import type { Account } from '@/api/types/types'
import type { CategorySpending } from '@/api/transactions'
import { formatCurrency } from '@/utils/formatAccount'
import { escapeHtml } from '@/utils/text'

export interface SummaryData {
  account?: Account
  categoryName?: string
  spending?: CategorySpending
  primaryCurrency: string
}

export function renderSaveSummary(data: SummaryData | null): string {
  if (data == null) {
    return 'Saved ✅'
  }

  const { account, categoryName, spending, primaryCurrency } = data
  const lines: string[] = ['Saved ✅']

  if (account != null) {
    const balance = Number.parseFloat(account.balance)

    lines.push(
      '',
      `New balance for 🏦 ${escapeHtml(account.name)}: <b>${formatCurrency(balance, account.currency)}</b>`
    )
  }

  if (categoryName != null && spending != null) {
    lines.push(
      '',
      `Summary for <b>${escapeHtml(categoryName)}</b>`,
      `This month: <b>${formatCurrency(spending.thisMonth, primaryCurrency)}</b>`,
      `Last month: <b>${formatCurrency(spending.lastMonth, primaryCurrency)}</b>`
    )
  }

  return lines.join('\n')
}
