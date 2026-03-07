import type {
  FlowContext,
  FlowData,
} from '@/bot/conversations/shared/flowContext'
import { restorePreview } from '../preview'
import { safeDelete } from '@/utils/telegram'
import { payeeKeyboard, PAYEE_PAGE_SIZE } from '@/bot/keyboards/payee'
import {
  CommonCallback,
  FilterCallback,
  PageCallback,
  PayeeCallback,
} from '@/bot/constants/callbacks'
import { wideText } from '@/utils/text'

type PayeeAction =
  | { type: 'navigate'; page: number }
  | { type: 'select'; index: number }
  | { type: 'skip' }
  | { type: 'use-typed' }
  | { type: 'back' }
  | { type: 'clear-filter' }
  | { type: 'noop' }

function parseAction(
  data: string,
  currentPage: number,
  totalPages: number
): PayeeAction {
  switch (data) {
    case PageCallback.NEXT:
      return {
        type: 'navigate',
        page: Math.min(currentPage + 1, totalPages - 1),
      }
    case PageCallback.PREV:
      return { type: 'navigate', page: Math.max(currentPage - 1, 0) }
    case PageCallback.NOOP:
      return { type: 'noop' }
    case CommonCallback.BACK:
      return { type: 'back' }
    case FilterCallback.CLEAR:
      return { type: 'clear-filter' }
    case PayeeCallback.SKIP:
      return { type: 'skip' }
    case PayeeCallback.USE_TYPED:
      return { type: 'use-typed' }
    default:
      if (data.startsWith(PayeeCallback.SELECT_PREFIX)) {
        return {
          type: 'select',
          index: Number.parseInt(
            data.slice(PayeeCallback.SELECT_PREFIX.length),
            10
          ),
        }
      }

      return { type: 'noop' }
  }
}

function prioritizeByCategory(
  allPayees: string[],
  categoryPayees: string[] | undefined
): string[] {
  if (!categoryPayees || categoryPayees.length === 0) {
    return allPayees
  }

  const categorySet = new Set(categoryPayees)
  const rest = allPayees.filter(payee => !categorySet.has(payee))

  return [...categoryPayees, ...rest]
}

export async function pickPayee(
  flow: FlowContext,
  data: FlowData
): Promise<void> {
  const categoryPayees = flow.draft.categoryId
    ? data.categoryPayeeMap.get(flow.draft.categoryId)
    : undefined
  const sortedPayees = prioritizeByCategory(data.payees, categoryPayees)

  let filterText = ''
  let page = 0

  function getFiltered(text: string): string[] {
    if (!text) {
      return sortedPayees
    }

    const lower = text.toLowerCase()

    return sortedPayees.filter(payee => payee.toLowerCase().includes(lower))
  }

  async function render(filtered: string[], text: string): Promise<void> {
    const label = wideText(
      text ? `🔍 "${text}":` : '🔍 Select payee (type to search):'
    )

    await flow.ctx.api.editMessageText(flow.chatId, flow.msgId, label, {
      reply_markup: payeeKeyboard({
        payees: filtered,
        page,
        categoryPayeeCount: !text ? categoryPayees?.length : undefined,
        filterText: text || undefined,
      }),
    })
  }

  await render(sortedPayees, filterText)

  while (true) {
    const update = await flow.conversation.wait()

    if (update.message?.text) {
      filterText = update.message.text.trim()
      page = 0
      await safeDelete(flow.ctx.api, flow.chatId, update.message.message_id)
      await render(getFiltered(filterText), filterText)
      continue
    }

    if (!update.callbackQuery?.data) {
      continue
    }

    await update.answerCallbackQuery()

    const filtered = getFiltered(filterText)
    const totalPages = Math.ceil(filtered.length / PAYEE_PAGE_SIZE) || 1
    const action = parseAction(update.callbackQuery.data, page, totalPages)

    switch (action.type) {
      case 'navigate':
        page = action.page
        await flow.ctx.api.editMessageReplyMarkup(flow.chatId, flow.msgId, {
          reply_markup: payeeKeyboard({
            payees: filtered,
            page,
            categoryPayeeCount: !filterText
              ? categoryPayees?.length
              : undefined,
            filterText: filterText || undefined,
          }),
        })
        continue

      case 'clear-filter':
        filterText = ''
        page = 0
        await render(getFiltered(''), '')
        continue

      case 'noop':
        continue

      case 'select':
        flow.draft.payee = filtered[action.index]
        await restorePreview(flow)

        return

      case 'use-typed':
        if (filterText) {
          flow.draft.payee = filterText
        }

        await restorePreview(flow)

        return

      case 'skip':
        flow.draft.payee = undefined
        await restorePreview(flow)

        return

      case 'back':
        await restorePreview(flow)

        return
    }
  }
}
