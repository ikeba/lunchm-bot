import { deleteCacheEntries, getCacheEntry, setCacheEntry } from '@/core/db'

export const TTL_1H = 60 * 60 * 1000
export const TTL_1D = TTL_1H * 24
export const TTL_1W = TTL_1D * 7
export const TTL_5MIN = 5 * 60 * 1000

export const CACHE_KEYS = {
  CATEGORIES: 'categories',
  CURRENCIES: 'currencies',
  CATEGORY_FREQUENCY: 'category_frequency',
  RECENT_TRANSACTIONS: 'recent_transactions',
  PAYEES: 'payees',
  ME: 'me',
  ACCOUNTS: 'accounts',
  CATEGORY_SPENDING_PREFIX: 'category_spending',
} as const

export function invalidateCache(...keys: string[]): void {
  deleteCacheEntries(keys)
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttl = TTL_1H }: { ttl?: number } = {}
): Promise<T> {
  const entry = getCacheEntry(key)

  if (entry && Date.now() - entry.fetchedAt < ttl) {
    return JSON.parse(entry.value) as T
  }

  const data = await fetcher()

  setCacheEntry(key, JSON.stringify(data))

  return data
}
