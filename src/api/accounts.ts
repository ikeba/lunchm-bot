import { withCache } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { AccountSchema } from './types'
import type {Account} from './types';

export function getAccounts(): Promise<Account[]> {
  return withCache('accounts', async () => {
    const data = await apiClient.get<{ manual_accounts: unknown[] }>(
      '/manual_accounts'
    )

    return (data.manual_accounts ?? []).map(a => AccountSchema.parse(a))
  })
}
