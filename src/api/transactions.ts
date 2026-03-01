import { apiClient } from '@/core/httpClient'
import { withCache, TTL_1D } from '@/core/cache'
import { isoDate } from '@/utils/date'
import { NewTransactionSchema, TransactionSchema } from './types/types'
import type { NewTransaction, Transaction } from './types/types'

export interface CategoryFrequencyEntry {
  categoryId: number
  count: number
  lastDate: string
}

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

export async function getCategoryFrequency(): Promise<
  CategoryFrequencyEntry[]
> {
  return withCache(
    'category_frequency',
    async () => {
      const data = await apiClient.get<{ transactions: unknown[] }>(
        `/transactions?limit=500&start_date=${isoDate(-90)}&end_date=${isoDate(1)}`
      )

      const byCategory = (data.transactions ?? [])
        .map(transaction => TransactionSchema.parse(transaction))
        .filter(
          (transaction): transaction is Transaction & { category_id: number } =>
            transaction.category_id != null
        )
        .reduce<Record<number, { count: number; lastDate: string }>>(
          (acc, transaction) => {
            const existing = acc[transaction.category_id]

            acc[transaction.category_id] = {
              count: (existing?.count ?? 0) + 1,
              lastDate: existing
                ? [existing.lastDate, transaction.date].sort().at(-1)!
                : transaction.date,
            }

            return acc
          },
          {}
        )

      return Object.entries(byCategory).map(([categoryId, entry]) => ({
        categoryId: Number(categoryId),
        ...entry,
      }))
    },
    TTL_1D
  )
}
