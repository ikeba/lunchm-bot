import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { getTopPayees } from '@/api/payees'
import { getCategoryFrequency, getRecentTransactions } from '@/api/transactions'
import { logger } from '@/core/logger'

export function backgroundRefresh(force = false): void {
  try {
    Promise.all([
      getCategories(),
      getCurrencies(),
      getCategoryFrequency(force),
      getRecentTransactions(force),
      getTopPayees(force),
    ])
    logger.info('[backgroundRefresh] successful')
  } catch (err) {
    logger.warn('[backgroundRefresh] failed', err)
  }
}
