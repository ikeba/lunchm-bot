import type { Transaction } from '@/api/types/types'
import { escapeHtml } from '@/utils/text'

const NUMBER_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function isZeroAmount(amount: string): boolean {
  return Math.abs(Number.parseFloat(amount)) < 0.01
}

function formatAmountWithCurrency(amount: string, currency: string): string {
  const num = Number.parseFloat(amount)
  const sign = num < 0 ? '+' : '−'
  const formatted = NUMBER_FORMAT.format(Math.abs(num)).replace(/,/g, ' ')

  return `${sign}${formatted} ${currency.toUpperCase()}`
}

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  return transactions.reduce((acc, t) => {
    const group = acc.get(t.date) ?? []

    acc.set(t.date, [...group, t])

    return acc
  }, new Map<string, Transaction[]>())
}

function formatDayGroup(date: string, transactions: Transaction[]): string {
  const amountColumns = transactions.map(t =>
    formatAmountWithCurrency(t.amount, t.currency)
  )
  const payeeColumns = transactions.map(t => escapeHtml(t.payee ?? '—'))

  const maxAmountLen = Math.max(...amountColumns.map(s => s.length))
  const maxPayeeLen = Math.max(...payeeColumns.map(s => s.length))

  const header = `<b>${'Amount'.padStart(maxAmountLen)}</b> | <b>${'Payee'.padEnd(maxPayeeLen)}</b>`

  const rows = transactions.map((_, i) => {
    const amount = amountColumns[i].padStart(maxAmountLen)
    const payee = payeeColumns[i].padEnd(maxPayeeLen)

    return `${amount} | ${payee}`
  })

  const table = [header, ...rows].join('\n')

  return `📅 <b>${date}</b>\n<pre>${table}</pre>`
}

export function formatTransactionList(transactions: Transaction[]): string {
  const filtered = transactions.filter(t => !isZeroAmount(t.amount))

  if (filtered.length === 0) {
    return 'No transactions found.'
  }

  const byDate = groupByDate(filtered)
  const sortedDates = [...byDate.keys()].sort((a, b) => a.localeCompare(b))

  return sortedDates
    .map(date => formatDayGroup(date, byDate.get(date)!))
    .join('\n\n')
}
