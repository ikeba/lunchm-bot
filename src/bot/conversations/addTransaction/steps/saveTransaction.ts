import type { FlowContext } from '../flowContext'
import { renderPreview } from '../preview'
import { createTransaction } from '@/api/transactions'
import { afterSaveKeyboard, previewKeyboard } from '@/bot/keyboards'
import { setLastUsed } from '@/bot/userState'
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
        currency: draft.currency,
        manualAccountId: draft.manualAccountId,
        accountName: draft.accountName,
        categoryId: draft.categoryId,
        categoryName: draft.categoryName,
      })
    )

    await ctx.api.editMessageText(chatId, msgId, 'Saved ✅', {
      reply_markup: afterSaveKeyboard(created.id),
    })

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
