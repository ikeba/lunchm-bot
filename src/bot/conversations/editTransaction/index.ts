import {
  deleteTransaction,
  getRecentTransactions,
  updateTransaction,
} from '@/api/transactions'
import type { MyContext } from '@/types/context'
import {
  backToListKeyboard,
  backToMenuKeyboard,
  deleteConfirmKeyboard,
  editPreviewKeyboard,
} from '@/bot/keyboards'
import { handleListTransactions } from '@/bot/handlers/listTransactions'
import { getActiveMsgId, consumePendingEditTransactionId } from '@/bot/state'
import { logger } from '@/core/logger'
import { invalidateCache, CACHE_KEYS } from '@/core/cache'
import { backgroundRefresh } from '@/core/backgroundRefresh'
import { EditPreviewCallback, PreviewCallback } from '@/bot/constants/callbacks'
import type { Conv } from '@/bot/conversations/shared/types'
import { fetchFlowData } from '@/bot/conversations/shared/loadFlowData'
import { waitForEditAction } from '@/bot/conversations/shared/editLoop'
import type {
  FlowContext,
  FlowData,
  TransactionDraft,
} from '@/bot/conversations/shared/flowContext'
import { renderPreview, restorePreview } from '../addTransaction/preview'

export async function editTransaction(
  conversation: Conv,
  ctx: MyContext
): Promise<void> {
  const chatId = ctx.chat!.id
  const transactionId = await conversation.external(
    consumePendingEditTransactionId
  )

  if (!transactionId) {
    return
  }

  let data: FlowData
  let draft: TransactionDraft
  let txnId: number

  try {
    const [flowData, transactions] = await conversation.external(() =>
      Promise.all([fetchFlowData(), getRecentTransactions()])
    )

    data = flowData

    const transaction = transactions.find(t => t.id === transactionId)

    if (!transaction) {
      const activeMsgId = await conversation.external(getActiveMsgId)

      if (activeMsgId) {
        await ctx.api
          .editMessageText(chatId, activeMsgId, '❌ Transaction not found.', {
            reply_markup: backToListKeyboard(),
          })
          .catch(() => {})
      }

      return
    }

    const account = data.accounts.find(
      account => account.id === transaction.account_id
    )
    const category = data.categories.find(
      category => category.id === transaction.category_id
    )

    draft = {
      amount: transaction.amount,
      currency: transaction.currency,
      manualAccountId: transaction.account_id ?? undefined,
      accountName: account?.name,
      categoryId: transaction.category_id ?? undefined,
      categoryName: category?.name,
      date: transaction.date,
      payee: transaction.payee ?? undefined,
      notes: transaction.notes ?? undefined,
    }

    txnId = transaction.id
  } catch (error) {
    logger.error('[editTransaction] failed to load data', error)
    const activeMsgId = await conversation.external(getActiveMsgId)

    if (activeMsgId) {
      await ctx.api
        .editMessageText(
          chatId,
          activeMsgId,
          '❌ Failed to load data. Try again.',
          { reply_markup: backToMenuKeyboard() }
        )
        .catch(() => {})
    }

    return
  }

  const msgId = await conversation.external(getActiveMsgId)

  if (!msgId) {
    return
  }

  await ctx.api.editMessageText(
    chatId,
    msgId,
    renderPreview(draft, 'Edit transaction'),
    { parse_mode: 'HTML', reply_markup: editPreviewKeyboard() }
  )

  const flow: FlowContext = {
    conversation,
    ctx,
    chatId,
    msgId,
    draft,
    title: 'Edit transaction',
    keyboard: editPreviewKeyboard,
  }

  while (true) {
    const action = await waitForEditAction(flow, data)

    if (action === EditPreviewCallback.SAVE) {
      try {
        await conversation.external(() => {
          invalidateCache(
            CACHE_KEYS.RECENT_TRANSACTIONS,
            CACHE_KEYS.CATEGORY_FREQUENCY,
            CACHE_KEYS.PAYEES,
            CACHE_KEYS.CATEGORY_PAYEES,
            CACHE_KEYS.ACCOUNTS
          )

          return updateTransaction(txnId, {
            date: draft.date,
            amount: draft.amount,
            currency: draft.currency,
            payee: draft.payee,
            notes: draft.notes,
            category_id: draft.categoryId,
            manual_account_id: draft.manualAccountId,
          })
        })

        await conversation.external(() => backgroundRefresh())

        await ctx.api.editMessageText(chatId, flow.msgId, 'Updated ✅', {
          reply_markup: backToListKeyboard(),
        })
      } catch (error) {
        logger.error('[editTransaction] updateTransaction failed', error)
        await ctx.api.editMessageText(
          chatId,
          flow.msgId,
          `${renderPreview(draft, 'Edit transaction')}\n\n❌ Error: ${error instanceof Error ? error.message : String(error)}`,
          { parse_mode: 'HTML', reply_markup: editPreviewKeyboard() }
        )
        continue
      }

      return
    }

    if (action === EditPreviewCallback.DELETE) {
      await ctx.api.editMessageText(
        chatId,
        flow.msgId,
        `${renderPreview(draft, 'Delete transaction?')}\n\n⚠️ This cannot be undone.`,
        { parse_mode: 'HTML', reply_markup: deleteConfirmKeyboard() }
      )
      continue
    }

    if (action === EditPreviewCallback.DELETE_CONFIRM) {
      try {
        await conversation.external(() => {
          invalidateCache(
            CACHE_KEYS.RECENT_TRANSACTIONS,
            CACHE_KEYS.CATEGORY_FREQUENCY,
            CACHE_KEYS.PAYEES,
            CACHE_KEYS.CATEGORY_PAYEES,
            CACHE_KEYS.ACCOUNTS
          )

          return deleteTransaction(txnId)
        })

        await conversation.external(() => backgroundRefresh())

        await ctx.api.editMessageText(chatId, flow.msgId, 'Deleted 🗑', {
          reply_markup: backToListKeyboard(),
        })
      } catch (error) {
        logger.error('[editTransaction] deleteTransaction failed', error)
        await ctx.api.editMessageText(
          chatId,
          flow.msgId,
          `❌ Delete failed: ${error instanceof Error ? error.message : String(error)}`,
          { reply_markup: backToListKeyboard() }
        )
      }

      return
    }

    if (action === EditPreviewCallback.DELETE_CANCEL) {
      await restorePreview(flow)
      continue
    }

    if (action === PreviewCallback.CANCEL) {
      await handleListTransactions(ctx)

      return
    }
  }
}
