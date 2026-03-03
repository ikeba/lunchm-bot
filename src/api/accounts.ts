import { withCache, TTL_1W } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { AccountSchema } from './types/types'
import type { Account } from './types/types'

export function getAccounts(): Promise<Account[]> {
  return withCache(
    'accounts',
    async () => {
      const data = await apiClient.get<{ manual_accounts: unknown[] }>(
        '/manual_accounts'
      )

      return (data.manual_accounts ?? [])
        .map(a => AccountSchema.parse(a))
        .filter(
          a =>
            a.status !== 'closed' && Number.parseFloat(a.balance ?? '0') !== 0
        )
    },
    TTL_1W
  )
}
