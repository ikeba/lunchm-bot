import { withCache, TTL_1D, CACHE_KEYS } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { isoDate } from '@/utils/date'
import { TransactionSchema } from './types/types'
import type { TransactionsApiResponse } from './types/types'
import { buildPath } from './helpers'

const EXCLUDED_PAYEE = ['[No Payee]', 'Added To EUR', 'Transfer']

function rankPayees(txs: unknown[]): string[] {
  const counts = new Map<string, number>()

  const filteredTransactions = txs
    .map(transaction => TransactionSchema.parse(transaction))
    .filter(
      transaction =>
        transaction.payee &&
        Math.abs(Number(transaction.amount)) >= 1 &&
        !EXCLUDED_PAYEE.includes(transaction.payee)
    )

  for (const transaction of filteredTransactions) {
    if (transaction.payee) {
      counts.set(
        transaction.payee,
        (counts.get(transaction.payee) ?? 0) + 1
      )
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([payee]) => payee)
}

export function getTopPayees(): Promise<string[]> {
  return withCache(
    CACHE_KEYS.PAYEES,
    async () => {
      const data = await apiClient.get<TransactionsApiResponse>(
        buildPath('/transactions', {
          limit: 500,
          start_date: isoDate(-90),
          end_date: isoDate(1),
        })
      )

      return rankPayees(data.transactions ?? [])
    },
    { ttl: TTL_1D }
  )
}
