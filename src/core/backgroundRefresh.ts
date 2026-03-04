import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { getTopPayees } from '@/api/payees'
import { getCategoryFrequency, getRecentTransactions } from '@/api/transactions'
import { logger } from '@/core/logger'

export function backgroundRefresh(): void {
  try {
    Promise.all([
      getAccounts(),
      getCategories(),
      getCurrencies(),
      getCategoryFrequency(),
      getRecentTransactions(),
      getTopPayees(),
    ])
    logger.info('[backgroundRefresh] successful')
  } catch (err) {
    logger.warn('[backgroundRefresh] failed', err)
  }
}
