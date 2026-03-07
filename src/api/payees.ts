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

function rankPayees(txs: unknown[]): string[] {
  const counts = new Map<string, number>()

  const filteredTransactions = txs
    .map(transaction => TransactionSchema.parse(transaction))
    .filter(isUsablePayee)

  for (const transaction of filteredTransactions) {
    if (transaction.payee) {
      counts.set(transaction.payee, (counts.get(transaction.payee) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([payee]) => payee)
}

export type CategoryPayeeMap = Map<number, string[]>

function buildCategoryPayeeMap(txs: unknown[]): CategoryPayeeMap {
  const byCat = new Map<number, Map<string, number>>()

  for (const raw of txs) {
    const transaction = TransactionSchema.parse(raw)

    if (!isUsablePayee(transaction) || transaction.category_id == null) {
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

async function fetchTransactionData(): Promise<unknown[]> {
  const data = await apiClient.get<TransactionsApiResponse>(
    buildPath('/transactions', {
      limit: 500,
      start_date: isoDate(-90),
      end_date: isoDate(1),
    })
  )

  return data.transactions ?? []
}

export function getTopPayees(): Promise<string[]> {
  return withCache(
    CACHE_KEYS.PAYEES,
    async () => {
      const txs = await fetchTransactionData()

      return rankPayees(txs)
    },
    { ttl: TTL_1D }
  )
}

export function getCategoryPayeeMap(): Promise<CategoryPayeeMap> {
  return withCache(
    CACHE_KEYS.CATEGORY_PAYEES,
    async () => {
      const txs = await fetchTransactionData()

      return buildCategoryPayeeMap(txs)
    },
    { ttl: TTL_1D }
  )
}
