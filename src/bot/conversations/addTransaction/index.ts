import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { getMe } from '@/api/me'
import { getCategoryPayeeMap, getTopPayees } from '@/api/payees'
import { deleteTransaction } from '@/api/transactions'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard, previewKeyboard } from '@/bot/keyboards'
import { showMenu } from '@/bot/handlers/menu'
import { getActiveMsgId, getPendingAmount } from '@/bot/state'
import { getLastUsed } from '@/bot/userState'
import { logger } from '@/core/logger'
import { invalidateCache, CACHE_KEYS } from '@/core/cache'
import { isoDate } from '@/utils/date'
import {
  MenuCallback,
  PostSaveCallback,
  PreviewCallback,
} from '@/bot/constants/callbacks'
import type { Conv } from '../shared/types'
import type { FlowContext, FlowData, TransactionDraft } from './flowContext'
import { renderPreview, restorePreview } from './preview'
import { pickAccount } from './steps/pickAccount'
import { pickCategory } from './steps/pickCategory'
import { pickCurrency } from './steps/pickCurrency'
import { pickDate } from './steps/pickDate'
import { pickPayee } from './steps/pickPayee'
import type { AmountResult } from '../shared/pickAmount'
import { pickAmount } from '../shared/pickAmount'
import { pickNotes } from './steps/pickNotes'
import { editAmount } from './steps/editAmount'
import { saveTransaction } from './steps/saveTransaction'

type StepHandler = (flow: FlowContext, data: FlowData) => Promise<void>

const EDIT_STEPS: Record<string, StepHandler> = {
  [PreviewCallback.EDIT_AMOUNT]: editAmount,
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
  const chatId = ctx.chat!.id

  let currencies: string[]
  let accounts: Awaited<ReturnType<typeof getAccounts>>
  let categories: Awaited<ReturnType<typeof getCategories>>
  let payees: string[]
  let categoryPayeeMap: Awaited<ReturnType<typeof getCategoryPayeeMap>>
  let me: Awaited<ReturnType<typeof getMe>>

  try {
    ;[currencies, accounts, categories, payees, categoryPayeeMap, me] =
      await conversation.external(() =>
        Promise.all([
          getCurrencies(),
          getAccounts(),
          getCategories(),
          getTopPayees(),
          getCategoryPayeeMap(),
          getMe(),
        ])
      )
  } catch (error) {
    logger.error('[addTransaction] failed to load data', error)
    const activeMsgId = await conversation.external(getActiveMsgId)

    if (activeMsgId) {
      await ctx.api
        .editMessageText(
          chatId,
          activeMsgId,
          '❌ Failed to load data. Try again.',
          {
            reply_markup: backToMenuKeyboard(),
          }
        )
        .catch(() => {})
    }

    return
  }

  const data: FlowData = {
    currencies,
    accounts,
    categories,
    payees,
    categoryPayeeMap,
  }

  let prefilledAmount = await conversation.external(getPendingAmount)

  while (true) {
    let amountResult: AmountResult | null

    if (prefilledAmount) {
      const activeMsgId = await conversation.external(getActiveMsgId)

      amountResult = { amount: prefilledAmount, msgId: activeMsgId! }
      prefilledAmount = undefined
    } else {
      amountResult = await pickAmount(conversation, ctx, chatId)
    }

    if (amountResult === null) {
      return
    }

    const lastUsed = await conversation.external(getLastUsed)

    const draft: TransactionDraft = {
      amount: amountResult.amount,
      currency: me.primary_currency,
      manualAccountId: lastUsed.manualAccountId,
      accountName: lastUsed.accountName,
      categoryId: lastUsed.categoryId,
      categoryName: lastUsed.categoryName,
      date: isoDate(),
      payee: lastUsed.payee,
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
        await showMenu(ctx.api, chatId, flow.msgId)

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
        await conversation.external(() => {
          invalidateCache(
            CACHE_KEYS.RECENT_TRANSACTIONS,
            CACHE_KEYS.CATEGORY_FREQUENCY,
            CACHE_KEYS.PAYEES,
            CACHE_KEYS.CATEGORY_PAYEES
          )

          return deleteTransaction(createdId)
        })
      } catch (error) {
        logger.error('[addTransaction] deleteTransaction failed', error)
        await ctx.api.editMessageText(
          chatId,
          flow.msgId,
          `Saved ✅\n\n❌ Undo failed: ${error instanceof Error ? error.message : String(error)}`
        )

        return
      }

      await showMenu(ctx.api, chatId, flow.msgId)

      return
    }

    if (postAction === MenuCallback.BACK) {
      await showMenu(ctx.api, chatId, flow.msgId)

      return
    }

    if (postAction === PostSaveCallback.ADD_NEW) {
      continue
    }

    return
  }
}
