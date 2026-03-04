import type { Category } from '@/api/types/types'
import type { FlowContext, FlowData } from '../flowContext'
import { safeDelete } from '@/utils/telegram'
import { getCategoryFrequency } from '@/api/transactions'
import { categoryKeyboard, CATEGORY_PAGE_SIZE } from '@/bot/keyboards/category'
import {
  CategoryCallback,
  CommonCallback,
  FilterCallback,
  PageCallback,
} from '@/bot/constants/callbacks'
import {
  toFrequencyMap,
  getRecentIds,
  sortByFrequency,
} from '../helpers/categoryFrequency'
import { wideText } from '@/utils/text'

export interface CategorySelection {
  categoryId: number
  categoryName: string | undefined
}

type CategoryAction =
  | { type: 'navigate'; page: number }
  | { type: 'select'; categoryId: number }
  | { type: 'back' }
  | { type: 'clear-filter' }
  | { type: 'noop' }

function parseAction(
  data: string,
  currentPage: number,
  totalPages: number
): CategoryAction {
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
    default:
      if (data.startsWith(CategoryCallback.ID_PREFIX)) {
        return {
          type: 'select',
          categoryId: Number.parseInt(
            data.slice(CategoryCallback.ID_PREFIX.length),
            10
          ),
        }
      }

      return { type: 'noop' }
  }
}

export async function pickCategory(
  flow: FlowContext,
  data: FlowData
): Promise<CategorySelection | null> {
  const frequencyEntries = await flow.conversation.external(() =>
    getCategoryFrequency()
  )
  const frequencyMap = toFrequencyMap(frequencyEntries)
  const recentIds = getRecentIds(frequencyMap, 7)
  const sorted = sortByFrequency(data.categories, frequencyMap, recentIds)
  const categoryMap = new Map(sorted.map(category => [category.id, category]))

  let filterText = ''
  let page = 0

  function getFiltered(text: string): Category[] {
    if (!text) {
      return sorted
    }

    const lower = text.toLowerCase()

    return sorted.filter(category =>
      category.name.toLowerCase().includes(lower)
    )
  }

  async function render(filtered: Category[], text: string): Promise<void> {
    const totalPages = Math.ceil(filtered.length / CATEGORY_PAGE_SIZE) || 1
    const filter = text || undefined
    const label = wideText(
      text ? `Select category (🔍 "${text}"):` : 'Select category:'
    )

    await flow.ctx.api.editMessageText(flow.chatId, flow.msgId, label, {
      reply_markup: categoryKeyboard(
        filtered,
        page,
        totalPages,
        recentIds,
        filter
      ),
    })
  }

  await render(sorted, filterText)

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
    const totalPages = Math.ceil(filtered.length / CATEGORY_PAGE_SIZE) || 1
    const action = parseAction(update.callbackQuery.data, page, totalPages)

    switch (action.type) {
      case 'navigate':
        page = action.page
        await flow.ctx.api.editMessageReplyMarkup(flow.chatId, flow.msgId, {
          reply_markup: categoryKeyboard(
            filtered,
            page,
            totalPages,
            recentIds,
            filterText || undefined
          ),
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
        return {
          categoryId: action.categoryId,
          categoryName: categoryMap.get(action.categoryId)?.name,
        }

      case 'back':
        return null
    }
  }
}
