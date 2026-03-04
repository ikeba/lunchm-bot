import { withCache, TTL_1D } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { isoDate } from '@/utils/date'
import { TransactionSchema } from './types/types'

const EXCLUDED_PAYEE = ['[No Payee]', 'Added To EUR', 'Transfer']

export function getTopPayees(force = false): Promise<string[]> {
  return withCache(
    'payees',
    async () => {
      const data = await apiClient.get<{ transactions: unknown[] }>(
        `/transactions?limit=500&start_date=${isoDate(-90)}&end_date=${isoDate(1)}`
      )

      const counts = new Map<string, number>()

      const filteredTransactions = (data.transactions ?? [])
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
    },
    { ttl: TTL_1D, force }
  )
}
