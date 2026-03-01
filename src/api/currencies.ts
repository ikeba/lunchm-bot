import { withCache } from '@/core/cache'
import { getAccounts } from './accounts'
import { getMe } from './me'

export function getCurrencies(): Promise<string[]> {
  return withCache('currencies', async () => {
    const [me, accounts] = await Promise.all([getMe(), getAccounts()])
    const seen = new Set<string>([me.primary_currency])

    for (const account of accounts) {
      if (account.currency) {
        seen.add(account.currency)
      }
    }

    return [...seen]
  })
}
