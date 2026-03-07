import { getAccounts } from '@/api/accounts'
import { getMe } from '@/api/me'
import { createTransferGroup } from '@/api/transactions'
import type { Account } from '@/api/types/types'
import { showMenu } from '@/bot/handlers/menu'
import {
  accountKeyboard,
  backKeyboard,
  backToMenuKeyboard,
  currencyKeyboard,
  datePicker,
} from '@/bot/keyboards'
import {
  AccountCallback,
  CommonCallback,
  CurrencyCallback,
  DateCallback,
  MenuCallback,
  TransferCallback,
} from '@/bot/constants/callbacks'
import { invalidateCache, CACHE_KEYS } from '@/core/cache'
import { logger } from '@/core/logger'
import { isoDate } from '@/utils/date'
import { wideText } from '@/utils/text'
import type { MyContext } from '@/types/context'
import { loadFlowData } from '../shared/loadFlowData'
import { pickAmount } from '../shared/pickAmount'
import type { Conv } from '../shared/types'
import type { TransferDraft, TransferFlowContext } from './flowContext'
import { renderTransferSuccess, restoreTransferPreview } from './preview'

const QUICK_PICKS: Record<string, number> = {
  [DateCallback.YESTERDAY]: -1,
  [DateCallback.TODAY]: 0,
  [DateCallback.TOMORROW]: 1,
}

async function pickSourceAccount(
  flow: TransferFlowContext,
  accounts: Account[]
): Promise<boolean> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    wideText('📤 Select source account:'),
    { reply_markup: accountKeyboard(accounts) }
  )

  const cb = await flow.conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel === CommonCallback.BACK) {
    await showMenu(flow.ctx.api, flow.chatId, flow.msgId)

    return false
  }

  const accountId = Number.parseInt(
    sel.slice(AccountCallback.PREFIX.length),
    10
  )
  const account = accounts.find(a => a.id === accountId)

  if (!account) {
    return false
  }

  flow.draft.sourceAccountId = accountId
  flow.draft.sourceAccountName = account.name

  return true
}

async function pickDestinationAccount(
  flow: TransferFlowContext,
  accounts: Account[]
): Promise<boolean> {
  const filtered = accounts.filter(a => a.id !== flow.draft.sourceAccountId)

  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    wideText('📥 Select destination account:'),
    { reply_markup: accountKeyboard(filtered) }
  )

  const cb = await flow.conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel === CommonCallback.BACK) {
    await showMenu(flow.ctx.api, flow.chatId, flow.msgId)

    return false
  }

  const accountId = Number.parseInt(
    sel.slice(AccountCallback.PREFIX.length),
    10
  )
  const account = accounts.find(a => a.id === accountId)

  if (!account) {
    return false
  }

  flow.draft.destinationAccountId = accountId
  flow.draft.destinationAccountName = account.name

  return true
}

async function editCurrency(
  flow: TransferFlowContext,
  currencies: string[]
): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    wideText('💱 Select currency:'),
    { reply_markup: currencyKeyboard(currencies, flow.draft.currency) }
  )

  const cb = await flow.conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel !== CommonCallback.BACK) {
    flow.draft.currency = sel.slice(CurrencyCallback.PREFIX.length)
  }

  await restoreTransferPreview(flow)
}

async function editDateManual(flow: TransferFlowContext): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    wideText(
      `📅 Enter date (YYYY-MM-DD):\nCurrent: <code>${flow.draft.date}</code>`
    ),
    { parse_mode: 'HTML', reply_markup: backKeyboard() }
  )

  const event = await flow.conversation.wait()

  if (event.callbackQuery) {
    await event.answerCallbackQuery()
  } else if (event.message?.text) {
    const text = event.message.text.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      flow.draft.date = text
    }
  }

  await restoreTransferPreview(flow)
}

async function editDate(flow: TransferFlowContext): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    wideText(`📅 Select date:\nCurrent: <code>${flow.draft.date}</code>`),
    { parse_mode: 'HTML', reply_markup: datePicker() }
  )

  const event = await flow.conversation.wait()

  if (!event.callbackQuery) {
    await restoreTransferPreview(flow)

    return
  }

  await event.answerCallbackQuery()
  const sel = event.callbackQuery.data ?? ''

  if (sel in QUICK_PICKS) {
    flow.draft.date = isoDate(QUICK_PICKS[sel])
    await restoreTransferPreview(flow)
  } else if (sel === DateCallback.MANUAL) {
    await editDateManual(flow)
  } else {
    await restoreTransferPreview(flow)
  }
}

export async function addTransfer(
  conversation: Conv,
  ctx: MyContext
): Promise<void> {
  const chatId = ctx.chat!.id

  const amountResult = await pickAmount(conversation, ctx, chatId, {
    promptInitial: 'Enter transfer amount (e.g. 100.00):',
  })

  if (amountResult === null) {
    return
  }

  const data = await loadFlowData(conversation)
  const me = await conversation.external(getMe)

  const transferCategory = data.categories.find(
    c => c.name.toLowerCase() === 'payment, transfer'
  )

  const draft: TransferDraft = {
    amount: amountResult.amount,
    currency: me.primary_currency,
    sourceAccountId: 0,
    sourceAccountName: '',
    destinationAccountId: 0,
    destinationAccountName: '',
    date: isoDate(),
  }

  const flow: TransferFlowContext = {
    conversation,
    ctx,
    chatId,
    msgId: amountResult.msgId,
    draft,
  }

  const sourceOk = await pickSourceAccount(flow, data.accounts)

  if (!sourceOk) {
    return
  }

  const destOk = await pickDestinationAccount(flow, data.accounts)

  if (!destOk) {
    return
  }

  await restoreTransferPreview(flow)

  let confirmed = false

  while (!confirmed) {
    const cb = await conversation.waitFor('callback_query:data')

    await cb.answerCallbackQuery()
    const action = cb.callbackQuery.data

    if (action === TransferCallback.CONFIRM) {
      confirmed = true
    } else if (action === TransferCallback.CANCEL) {
      await showMenu(flow.ctx.api, flow.chatId, flow.msgId)

      return
    } else if (action === TransferCallback.EDIT_DATE) {
      await editDate(flow)
    } else if (action === TransferCallback.EDIT_CURRENCY) {
      await editCurrency(flow, data.currencies)
    }
  }

  const beforeSource = data.accounts.find(a => a.id === draft.sourceAccountId)
  const beforeDest = data.accounts.find(
    a => a.id === draft.destinationAccountId
  )

  try {
    await conversation.external(() =>
      createTransferGroup({
        amount: draft.amount,
        currency: draft.currency,
        date: draft.date,
        sourceAccountId: draft.sourceAccountId,
        destinationAccountId: draft.destinationAccountId,
        categoryId: transferCategory?.id,
      })
    )
  } catch (error) {
    logger.error('[addTransfer] createTransferGroup failed', error)
    await flow.ctx.api.editMessageText(
      flow.chatId,
      flow.msgId,
      `❌ Transfer failed: ${error instanceof Error ? error.message : String(error)}`,
      { reply_markup: backToMenuKeyboard() }
    )

    return
  }

  const freshAccounts = await conversation.external(() => {
    invalidateCache(CACHE_KEYS.ACCOUNTS)

    return getAccounts()
  })

  const afterSource = freshAccounts.find(a => a.id === draft.sourceAccountId)
  const afterDest = freshAccounts.find(a => a.id === draft.destinationAccountId)

  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    renderTransferSuccess(
      draft,
      beforeSource,
      beforeDest,
      afterSource,
      afterDest
    ),
    { reply_markup: backToMenuKeyboard() }
  )

  const menuCb = await conversation.waitFor('callback_query:data')

  await menuCb.answerCallbackQuery()

  if (menuCb.callbackQuery.data === MenuCallback.BACK) {
    await showMenu(flow.ctx.api, flow.chatId, flow.msgId)
  }
}
