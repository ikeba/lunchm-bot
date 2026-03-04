import { getCacheEntry, setCacheEntry } from '@/core/db'

export const TTL_1H = 60 * 60 * 1000
export const TTL_1D = TTL_1H * 24
export const TTL_1W = TTL_1D * 7
export const TTL_5MIN = 5 * 60 * 1000

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  { ttl = TTL_1H, force = false }: { ttl?: number; force?: boolean } = {}
): Promise<T> {
  const entry = getCacheEntry(key)

  if (!force && entry && Date.now() - entry.fetchedAt < ttl) {
    return JSON.parse(entry.value) as T
  }

  const data = await fetcher()

  setCacheEntry(key, JSON.stringify(data))

  return data
}
