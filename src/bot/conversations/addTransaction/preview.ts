import type { FlowContext, TransactionDraft } from './flowContext'
import { previewKeyboard } from '@/bot/keyboards'

export function renderPreview(
  draft: TransactionDraft,
  title = 'New transaction'
): string {
  // Zero-width spaces pad the line to force a wide Telegram bubble,
  // preventing inline keyboard button labels from being truncated.
  const spacer = '\u200B'.repeat(40)
  const lines = [
    `<b>${title}</b>${spacer}`,
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
  const keyboard = flow.keyboard ?? previewKeyboard

  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    renderPreview(flow.draft, flow.title),
    { parse_mode: 'HTML', reply_markup: keyboard() }
  )
}
