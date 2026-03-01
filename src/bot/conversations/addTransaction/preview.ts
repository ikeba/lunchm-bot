import type { FlowContext, TransactionDraft } from './flowContext'
import { previewKeyboard } from '@/bot/keyboards'

export function renderPreview(draft: TransactionDraft): string {
  const lines = [
    '<b>New transaction</b>',
    '',
    `💰 Amount: <b>${draft.amount} ${draft.currency.toUpperCase()}</b>`,
    `🏦 Account: ${draft.accountName ?? '—'}`,
    `🏷 Category: ${draft.categoryName ?? '—'}`,
    `📅 Date: ${draft.date}`,
  ]

  if (draft.payee) {
    lines.push(`👤 Payee: ${draft.payee}`)
  }

  if (draft.notes) {
    lines.push(`📝 Note: ${draft.notes}`)
  }

  return lines.join('\n')
}

export async function restorePreview(flow: FlowContext): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    renderPreview(flow.draft),
    { parse_mode: 'HTML', reply_markup: previewKeyboard() }
  )
}
