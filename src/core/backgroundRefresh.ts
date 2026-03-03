import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { getCategoryFrequency, getRecentTransactions } from '@/api/transactions'
import { logger } from '@/core/logger'

export function backgroundRefresh(): void {
  try {
    Promise.all([
      getCategories(),
      getCurrencies(),
      getCategoryFrequency(),
      getRecentTransactions(),
    ])
    logger.info('[backgroundRefresh] successful')
  } catch (err) {
    logger.warn('[backgroundRefresh] failed', err)
  }
}
