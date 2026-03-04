import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { getMe } from '@/api/me'
import { getTopPayees } from '@/api/payees'
import { deleteTransaction } from '@/api/transactions'
import type { MyContext } from '@/types/context'
import { previewKeyboard } from '@/bot/keyboards'
import { MENU_KEYBOARD, MENU_TEXT } from '@/bot/handlers/menu'
import { getLastUsed } from '@/bot/userState'
import { logger } from '@/core/logger'
import { isoDate } from '@/utils/date'
import {
  MenuCallback,
  PostSaveCallback,
  PreviewCallback,
} from '@/bot/constants/callbacks'
import type {
  Conv,
  FlowContext,
  FlowData,
  TransactionDraft,
} from './flowContext'
import { renderPreview, restorePreview } from './preview'
import { pickAccount } from './steps/pickAccount'
import { pickCategory } from './steps/pickCategory'
import { pickCurrency } from './steps/pickCurrency'
import { pickDate } from './steps/pickDate'
import { pickPayee } from './steps/pickPayee'
import { pickAmount } from './steps/pickAmount'
import { pickNotes } from './steps/pickNotes'
import { saveTransaction } from './steps/saveTransaction'

type StepHandler = (flow: FlowContext, data: FlowData) => Promise<void>

const EDIT_STEPS: Record<string, StepHandler> = {
  [PreviewCallback.EDIT_ACCOUNT]: pickAccount,
  [PreviewCallback.EDIT_CURRENCY]: pickCurrency,
  [PreviewCallback.EDIT_DATE]: pickDate,
  [PreviewCallback.EDIT_PAYEE]: pickPayee,
  [PreviewCallback.EDIT_NOTE]: pickNotes,
}

export async function addTransaction(
  conversation: Conv,
  ctx: MyContext
): Promise<void> {
  const [currencies, accounts, categories, payees, me] =
    await conversation.external(() =>
      Promise.all([
        getCurrencies(),
        getAccounts(),
        getCategories(),
        getTopPayees(),
        getMe(),
      ])
    )

  const data: FlowData = { currencies, accounts, categories, payees }
  const chatId = ctx.chat!.id
  let useLastUsed = true

  const del = (...ids: number[]) =>
    Promise.all(
      ids.map(id => ctx.api.deleteMessage(chatId, id).catch(() => {}))
    )

  while (true) {
    const amountResult = await pickAmount(conversation, ctx, chatId)

    if (amountResult === null) {
      return
    }

    const lastUsed = useLastUsed ? await conversation.external(getLastUsed) : {}

    const draft: TransactionDraft = {
      amount: amountResult.amount,
      currency: me.primary_currency,
      manualAccountId: lastUsed.manualAccountId,
      accountName: lastUsed.accountName,
      categoryId: lastUsed.categoryId,
      categoryName: lastUsed.categoryName,
      date: isoDate(),
      payee: undefined,
      notes: undefined,
    }

    await ctx.api.editMessageText(
      chatId,
      amountResult.msgId,
      renderPreview(draft),
      { parse_mode: 'HTML', reply_markup: previewKeyboard() }
    )

    const flow: FlowContext = {
      conversation,
      ctx,
      chatId,
      msgId: amountResult.msgId,
      draft,
    }

    // Edit loop
    let confirmed = false

    while (!confirmed) {
      const cb = await conversation.waitFor('callback_query:data')

      await cb.answerCallbackQuery()
      const action = cb.callbackQuery.data

      if (action === PreviewCallback.CONFIRM) {
        confirmed = true
        continue
      }

      if (action === PreviewCallback.CANCEL) {
        await ctx.api.editMessageText(chatId, flow.msgId, MENU_TEXT, {
          parse_mode: 'HTML',
          reply_markup: MENU_KEYBOARD,
        })

        return
      }

      if (action === PreviewCallback.EDIT_CATEGORY) {
        const selection = await pickCategory(flow, data)

        if (selection !== null) {
          draft.categoryId = selection.categoryId
          draft.categoryName = selection.categoryName
        }

        await restorePreview(flow)
        continue
      }

      const handler = EDIT_STEPS[action]

      if (handler) {
        await handler(flow, data)
      }
    }

    // Save
    const createdId = await saveTransaction(flow)

    if (createdId === null) {
      return
    }

    // Post-save action
    const postSave = await conversation.waitFor('callback_query:data')

    await postSave.answerCallbackQuery()
    const postAction = postSave.callbackQuery.data

    if (postAction === `${PostSaveCallback.UNDO_PREFIX}${createdId}`) {
      try {
        await conversation.external(() => deleteTransaction(createdId))
      } catch (error) {
        logger.error('[addTransaction] deleteTransaction failed', error)
        await ctx.api.editMessageText(
          chatId,
          flow.msgId,
          `Saved ✅\n\n❌ Undo failed: ${error instanceof Error ? error.message : String(error)}`
        )

        return
      }

      await del(flow.msgId)

      return
    }

    if (postAction === MenuCallback.BACK) {
      await ctx.api.editMessageText(chatId, flow.msgId, MENU_TEXT, {
        parse_mode: 'HTML',
        reply_markup: MENU_KEYBOARD,
      })

      return
    }

    await del(flow.msgId)

    if (postAction === PostSaveCallback.ADD_SIMILAR) {
      useLastUsed = true
      continue
    }

    if (postAction === PostSaveCallback.ADD_NEW) {
      useLastUsed = false
      continue
    }

    return
  }
}
