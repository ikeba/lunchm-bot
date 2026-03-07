import type { FlowContext } from '@/bot/conversations/shared/flowContext'
import { renderPreview } from '../preview'
import { renderSaveSummary } from '../summary'
import type { SummaryData } from '../summary'
import {
  createTransaction,
  getCategoryMonthlySpending,
} from '@/api/transactions'
import { getAccounts } from '@/api/accounts'
import { getMe } from '@/api/me'
import { afterSaveKeyboard, previewKeyboard } from '@/bot/keyboards'
import { setLastUsed } from '@/bot/userState'
import { backgroundRefresh } from '@/core/backgroundRefresh'
import { invalidateCache, CACHE_KEYS } from '@/core/cache'
import { logger } from '@/core/logger'

export async function saveTransaction(
  flow: FlowContext
): Promise<number | null> {
  const { conversation, ctx, chatId, msgId, draft } = flow

  try {
    const created = await conversation.external(() =>
      createTransaction({
        date: draft.date,
        amount: draft.amount,
        currency: draft.currency,
        payee: draft.payee,
        notes: draft.notes,
        category_id: draft.categoryId,
        manual_account_id: draft.manualAccountId,
      })
    )

    await conversation.external(() =>
      setLastUsed({
        manualAccountId: draft.manualAccountId,
        accountName: draft.accountName,
        categoryId: draft.categoryId,
        categoryName: draft.categoryName,
        payee: draft.payee,
      })
    )

    await conversation.external(() => {
      invalidateCache(
        CACHE_KEYS.RECENT_TRANSACTIONS,
        CACHE_KEYS.CATEGORY_FREQUENCY,
        CACHE_KEYS.PAYEES,
        CACHE_KEYS.CATEGORY_PAYEES,
        CACHE_KEYS.ACCOUNTS
      )
      backgroundRefresh()
    })

    const summaryData = await conversation.external(
      async (): Promise<SummaryData | null> => {
        try {
          const [accounts, me, spending] = await Promise.all([
            getAccounts(),
            getMe(),
            draft.categoryId != null
              ? getCategoryMonthlySpending(draft.categoryId)
              : Promise.resolve(undefined),
          ])

          return {
            account: accounts.find(a => a.id === draft.manualAccountId),
            categoryName: draft.categoryName,
            spending,
            primaryCurrency: me.primary_currency,
          }
        } catch (summaryError) {
          logger.warn('[saveTransaction] summary fetch failed', summaryError)

          return null
        }
      }
    )

    await ctx.api.editMessageText(
      chatId,
      msgId,
      renderSaveSummary(summaryData),
      {
        parse_mode: 'HTML',
        reply_markup: afterSaveKeyboard(created.id),
      }
    )

    return created.id
  } catch (error) {
    logger.error('[addTransaction] createTransaction failed', error)
    await ctx.api.editMessageText(
      chatId,
      msgId,
      `${renderPreview(draft)}\n\n❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      { parse_mode: 'HTML', reply_markup: previewKeyboard() }
    )

    return null
  }
}
