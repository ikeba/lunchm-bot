import { withCache, TTL_1W } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { CategorySchema } from './types/types'
import type { Category } from './types/types'

export function getCategories(force = false): Promise<Category[]> {
  return withCache(
    'categories',
    async () => {
      const data = await apiClient.get<{ categories: unknown[] }>(
        '/categories?format=flattened'
      )

      return (data.categories ?? [])
        .map(c => CategorySchema.parse(c))
        .filter(c => !c.archived && !c.is_group)
    },
    { ttl: TTL_1W, force }
  )
}
