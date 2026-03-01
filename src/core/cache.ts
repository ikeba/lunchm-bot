export const TTL_1H = 60 * 60 * 1000
export const TTL_1D = TTL_1H * 24

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = TTL_1H
): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined

  if (entry && Date.now() - entry.fetchedAt < ttlMs) {
    return entry.data
  }

  const data = await fetcher()

  store.set(key, { data, fetchedAt: Date.now() })

  return data
}
