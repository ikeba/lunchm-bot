import type { Account } from '@/api/types/types'
import { transferPreviewKeyboard } from '@/bot/keyboards'
import type { TransferDraft, TransferFlowContext } from './flowContext'

function formatBalance(balance: string): string {
  return Number.parseFloat(balance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function renderTransferPreview(draft: TransferDraft): string {
  const spacer = '\u200B'.repeat(40)
  const lines = [
    `<b>Transfer</b>${spacer}`,
    '',
    `💸 Amount: <b>${draft.amount} ${draft.currency.toUpperCase()}</b>`,
    `📤 From: ${draft.sourceAccountName}`,
    `📥 To: ${draft.destinationAccountName}`,
    `📅 Date: ${draft.date}`,
  ]

  return lines.join('\n')
}

export function renderTransferSuccess(
  draft: TransferDraft,
  beforeSource: Account | undefined,
  beforeDest: Account | undefined,
  afterSource: Account | undefined,
  afterDest: Account | undefined
): string {
  const lines = [
    '✅ Transfer complete',
    '',
    `💸 ${draft.amount} ${draft.currency.toUpperCase()}`,
  ]

  if (beforeSource && afterSource) {
    lines.push(
      '',
      `📤 ${draft.sourceAccountName}`,
      `   Before: ${formatBalance(beforeSource.balance)} ${beforeSource.currency.toUpperCase()} → After: ${formatBalance(afterSource.balance)} ${afterSource.currency.toUpperCase()}`
    )
  }

  if (beforeDest && afterDest) {
    lines.push(
      '',
      `📥 ${draft.destinationAccountName}`,
      `   Before: ${formatBalance(beforeDest.balance)} ${beforeDest.currency.toUpperCase()} → After: ${formatBalance(afterDest.balance)} ${afterDest.currency.toUpperCase()}`
    )
  }

  return lines.join('\n')
}

export async function restoreTransferPreview(
  flow: TransferFlowContext
): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    renderTransferPreview(flow.draft),
    { parse_mode: 'HTML', reply_markup: transferPreviewKeyboard() }
  )
}
