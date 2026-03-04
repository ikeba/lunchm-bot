import { withCache, TTL_1W, CACHE_KEYS } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { AccountSchema } from './types/types'
import type { Account, AccountsApiResponse } from './types/types'

export function getAccounts(): Promise<Account[]> {
  return withCache(
    CACHE_KEYS.ACCOUNTS,
    async () => {
      const data = await apiClient.get<AccountsApiResponse>('/manual_accounts')

      return (data.manual_accounts ?? [])
        .map(a => AccountSchema.parse(a))
        .filter(
          a =>
            a.status !== 'closed' && Number.parseFloat(a.balance ?? '0') !== 0
        )
    },
    { ttl: TTL_1W }
  )
}
