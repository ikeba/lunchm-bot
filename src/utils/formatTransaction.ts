import type { Transaction } from '@/api/types/types'

export function formatTransaction(t: Transaction): string {
  const sign = t.is_income ? '+' : '-'
  const payee = t.payee ?? 'No payee'
  const notes = t.notes ? `\n   ${t.notes}` : ''

  return `${sign}${t.amount} ${t.currency} | ${payee} | ${t.date}${notes}`
}

export function formatTransactionList(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return 'No transactions found.'
  }

  return transactions.map(formatTransaction).join('\n')
}
