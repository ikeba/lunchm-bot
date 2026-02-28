import { apiClient } from '@/core/httpClient'
import { isoDate } from '@/utils/date'
import { NewTransactionSchema, TransactionSchema } from './types'
import type { NewTransaction, Transaction } from './types'

export async function getTransactions(
  limit = 50,
  days = 30
): Promise<Transaction[]> {
  const start = isoDate(-days)
  const end = isoDate(1) // +1 day to cover ahead-of-UTC timezones
  // Fetch all transactions in range (API limit >> desired limit), then sort and slice
  const data = await apiClient.get<{ transactions: unknown[] }>(
    `/transactions?limit=1000&start_date=${start}&end_date=${end}`
  )

  return (data.transactions ?? [])
    .map(t => TransactionSchema.parse(t))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

export async function createTransaction(
  transaction: NewTransaction
): Promise<Transaction> {
  const body = { transactions: [NewTransactionSchema.parse(transaction)] }
  const data = await apiClient.post<{ transactions: unknown[] }>(
    '/transactions',
    body
  )

  return TransactionSchema.parse(data.transactions[0])
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiClient.delete(`/transactions/${id}`)
}
