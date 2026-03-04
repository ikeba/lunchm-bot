import { withCache, TTL_1W, CACHE_KEYS } from '@/core/cache'
import { apiClient } from '@/core/httpClient'
import { MeSchema } from './types/types'
import type { Me, MeApiResponse } from './types/types'

export type { Me }

export function getMe(): Promise<Me> {
  return withCache(
    CACHE_KEYS.ME,
    async () => {
      const data = await apiClient.get<MeApiResponse>('/me')

      return MeSchema.parse(data)
    },
    { ttl: TTL_1W }
  )
}
