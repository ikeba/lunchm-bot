import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { getMe } from '@/api/me'
import { createTransferGroup } from '@/api/transactions'
import type { Account } from '@/api/types/types'
import { MENU_KEYBOARD, MENU_TEXT } from '@/bot/handlers/menu'
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
import { safeDelete } from '@/utils/telegram'
import { wideText } from '@/utils/text'
import type { MyContext } from '@/types/context'
import type { Conv, TransferDraft, TransferFlowContext } from './flowContext'
import {
  renderTransferSuccess,
  restoreTransferPreview,
} from './preview'

const QUICK_PICKS: Record<string, number> = {
  [DateCallback.YESTERDAY]: -1,
  [DateCallback.TODAY]: 0,
  [DateCallback.TOMORROW]: 1,
}

async function exitToMenu(flow: TransferFlowContext): Promise<void> {
  await flow.ctx.api.editMessageText(flow.chatId, flow.msgId, MENU_TEXT, {
    parse_mode: 'HTML',
    reply_markup: MENU_KEYBOARD,
  })
}

async function pickAmount(
  conversation: Conv,
  ctx: MyContext,
  chatId: number
): Promise<{ amount: string; msgId: number } | null> {
  const promptMsg = await ctx.reply('Enter transfer amount (e.g. 100.00):', {
    reply_markup: backToMenuKeyboard(),
  })

  while (true) {
    const event = await conversation.wait()

    if (event.callbackQuery) {
      await event.answerCallbackQuery()
      await ctx.api.editMessageText(chatId, promptMsg.message_id, MENU_TEXT, {
        parse_mode: 'HTML',
        reply_markup: MENU_KEYBOARD,
      })

      return null
    }

    if (!event.message?.text) {
      continue
    }

    const raw = event.message.text.trim().replace(',', '.')

    await safeDelete(ctx.api, chatId, event.message.message_id)

    if (Number.isNaN(Number.parseFloat(raw))) {
      await ctx.api
        .editMessageText(
          chatId,
          promptMsg.message_id,
          'Invalid amount. Try again:',
          { reply_markup: backToMenuKeyboard() }
        )
        .catch(() => {})

      continue
    }

    return {
      amount: Number.parseFloat(raw).toFixed(2),
      msgId: promptMsg.message_id,
    }
  }
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
    await exitToMenu(flow)

    return false
  }

  const accountId = Number.parseInt(sel.slice(AccountCallback.PREFIX.length), 10)
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
    await exitToMenu(flow)

    return false
  }

  const accountId = Number.parseInt(sel.slice(AccountCallback.PREFIX.length), 10)
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
    wideText(`📅 Enter date (YYYY-MM-DD):\nCurrent: <code>${flow.draft.date}</code>`),
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

  const amountResult = await pickAmount(conversation, ctx, chatId)

  if (amountResult === null) {
    return
  }

  const [accounts, currencies, me, categories] = await conversation.external(() =>
    Promise.all([getAccounts(), getCurrencies(), getMe(), getCategories()])
  )

  const transferCategory = categories.find(
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

  const sourceOk = await pickSourceAccount(flow, accounts)

  if (!sourceOk) {
    return
  }

  const destOk = await pickDestinationAccount(flow, accounts)

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
      await exitToMenu(flow)

      return
    } else if (action === TransferCallback.EDIT_DATE) {
      await editDate(flow)
    } else if (action === TransferCallback.EDIT_CURRENCY) {
      await editCurrency(flow, currencies)
    }
  }

  const beforeSource = accounts.find(a => a.id === draft.sourceAccountId)
  const beforeDest = accounts.find(a => a.id === draft.destinationAccountId)

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
    renderTransferSuccess(draft, beforeSource, beforeDest, afterSource, afterDest),
    { reply_markup: backToMenuKeyboard() }
  )

  const menuCb = await conversation.waitFor('callback_query:data')

  await menuCb.answerCallbackQuery()

  if (menuCb.callbackQuery.data === MenuCallback.BACK) {
    await flow.ctx.api.editMessageText(flow.chatId, flow.msgId, MENU_TEXT, {
      parse_mode: 'HTML',
      reply_markup: MENU_KEYBOARD,
    })
  }
}
