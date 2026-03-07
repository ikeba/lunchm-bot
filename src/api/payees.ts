import { config } from '@/config'
import { withCache, TTL_1D, CACHE_KEYS } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { isoDate } from '@/utils/date'
import { TransactionSchema } from './types/types'
import type { Transaction, TransactionsApiResponse } from './types/types'
import { buildPath } from './helpers'

const excludedPayees = new Set(config.EXCLUDED_PAYEES)

function isUsablePayee(transaction: Transaction): boolean {
  return (
    !!transaction.payee &&
    Math.abs(Number(transaction.amount)) >= 1 &&
    !excludedPayees.has(transaction.payee)
  )
}

async function fetchUsableTransactions(): Promise<Transaction[]> {
  const data = await apiClient.get<TransactionsApiResponse>(
    buildPath('/transactions', {
      limit: 500,
      start_date: isoDate(-90),
      end_date: isoDate(1),
    })
  )

  return (data.transactions ?? [])
    .map(transaction => TransactionSchema.parse(transaction))
    .filter(isUsablePayee)
}

function rankPayees(transactions: Transaction[]): string[] {
  const counts = new Map<string, number>()

  for (const transaction of transactions) {
    counts.set(transaction.payee!, (counts.get(transaction.payee!) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([payee]) => payee)
}

export type CategoryPayeeMap = Map<number, string[]>

function buildCategoryPayeeMap(transactions: Transaction[]): CategoryPayeeMap {
  const byCat = new Map<number, Map<string, number>>()

  for (const transaction of transactions) {
    if (transaction.category_id == null) {
      continue
    }

    const catMap =
      byCat.get(transaction.category_id) ?? new Map<string, number>()

    catMap.set(transaction.payee!, (catMap.get(transaction.payee!) ?? 0) + 1)
    byCat.set(transaction.category_id, catMap)
  }

  const result: CategoryPayeeMap = new Map()

  for (const [categoryId, counts] of byCat) {
    result.set(
      categoryId,
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([payee]) => payee)
    )
  }

  return result
}

export function getTopPayees(): Promise<string[]> {
  return withCache(
    CACHE_KEYS.PAYEES,
    async () => {
      const transactions = await fetchUsableTransactions()

      return rankPayees(transactions)
    },
    { ttl: TTL_1D }
  )
}

export async function getCategoryPayeeMap(): Promise<CategoryPayeeMap> {
  const entries = await withCache(
    CACHE_KEYS.CATEGORY_PAYEES,
    async () => {
      const transactions = await fetchUsableTransactions()

      return [...buildCategoryPayeeMap(transactions).entries()]
    },
    { ttl: TTL_1D }
  )

  return new Map(entries)
}
