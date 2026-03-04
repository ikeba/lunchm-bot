import { apiClient } from '@/core/httpClient'
import { withCache, TTL_1D, TTL_5MIN, CACHE_KEYS } from '@/core/cache'
import { isoDate, monthStart, monthEnd } from '@/utils/date'
import { NewTransactionSchema, TransactionSchema } from './types/types'
import type {
  NewTransaction,
  Transaction,
  CategoryFrequencyEntry,
  CategorySpending,
  TransactionsApiResponse,
} from './types/types'
import { buildPath } from './helpers'

export type { CategoryFrequencyEntry, CategorySpending }

function sumByCategory(txs: unknown[], categoryId: number): number {
  return txs
    .map(t => TransactionSchema.parse(t))
    .filter(t => t.category_id === categoryId && !t.is_income)
    .reduce((sum, t) => sum + t.to_base, 0)
}

function buildFrequencyEntries(txs: unknown[]): CategoryFrequencyEntry[] {
  const byCategory = txs
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
}

export async function getTransactions(
  limit = 50,
  days = 30
): Promise<Transaction[]> {
  const start = isoDate(-days)
  const end = isoDate(1) // +1 day to cover ahead-of-UTC timezones
  // Fetch all transactions in range (API limit >> desired limit), then sort and slice
  const data = await apiClient.get<TransactionsApiResponse>(
    buildPath('/transactions', {
      limit: 1000,
      start_date: start,
      end_date: end,
    })
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

export async function createTransferGroup(params: {
  amount: string
  currency: string
  date: string
  sourceAccountId: number
  destinationAccountId: number
  categoryId?: number
}): Promise<void> {
  const [src, dest] = await Promise.all([
    createTransaction({
      date: params.date,
      amount: params.amount,
      currency: params.currency,
      payee: 'Transfer',
      manual_account_id: params.sourceAccountId,
      category_id: params.categoryId,
    }),
    createTransaction({
      date: params.date,
      amount: `-${params.amount}`,
      currency: params.currency,
      payee: 'Transfer',
      manual_account_id: params.destinationAccountId,
      category_id: params.categoryId,
    }),
  ])

  await apiClient.post('/transactions/group', {
    ids: [src.id, dest.id],
    date: params.date,
    payee: 'Transfer',
  })
}

export async function getCategoryFrequency(): Promise<
  CategoryFrequencyEntry[]
> {
  return withCache(
    CACHE_KEYS.CATEGORY_FREQUENCY,
    async () => {
      const data = await apiClient.get<TransactionsApiResponse>(
        buildPath('/transactions', {
          limit: 500,
          start_date: isoDate(-90),
          end_date: isoDate(1),
        })
      )

      return buildFrequencyEntries(data.transactions ?? [])
    },
    { ttl: TTL_1D }
  )
}

export function getRecentTransactions(): Promise<Transaction[]> {
  return withCache(
    CACHE_KEYS.RECENT_TRANSACTIONS,
    () => getTransactions(500, 3),
    {
      ttl: TTL_5MIN,
    }
  )
}

export async function getCategoryMonthlySpending(
  categoryId: number
): Promise<CategorySpending> {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const { year: lastYear, month: lastMonthNum } = (() => {
    const d = new Date(thisYear, now.getMonth() - 1, 1)

    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })()

  const lastMonthKey = `${CACHE_KEYS.CATEGORY_SPENDING_PREFIX}:${lastYear}-${String(lastMonthNum).padStart(2, '0')}:${categoryId}`

  const [thisMonthTotal, lastMonth] = await Promise.all([
    apiClient
      .get<TransactionsApiResponse>(
        buildPath('/transactions', {
          limit: 1000,
          start_date: monthStart(thisYear, thisMonth),
          end_date: isoDate(1),
        })
      )
      .then(data => sumByCategory(data.transactions ?? [], categoryId)),
    withCache(
      lastMonthKey,
      async () => {
        const data = await apiClient.get<TransactionsApiResponse>(
          buildPath('/transactions', {
            limit: 1000,
            start_date: monthStart(lastYear, lastMonthNum),
            end_date: monthEnd(lastYear, lastMonthNum),
          })
        )

        return sumByCategory(data.transactions ?? [], categoryId)
      },
      { ttl: TTL_1D }
    ),
  ])

  return { thisMonth: thisMonthTotal, lastMonth }
}
