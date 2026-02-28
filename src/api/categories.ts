import { withCache } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { CategorySchema } from './types'
import type {Category} from './types';

export function getCategories(): Promise<Category[]> {
  return withCache('categories', async () => {
    const data = await apiClient.get<{ categories: unknown[] }>(
      '/categories?format=flattened'
    )

    return (data.categories ?? [])
      .map(c => CategorySchema.parse(c))
      .filter(c => !c.archived && !c.is_group)
  })
}
