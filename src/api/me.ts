import { z } from 'zod'
import { withCache } from '@/core/cache'
import { apiClient } from '@/core/httpClient'

const MeSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  primary_currency: z.string(),
})

export type Me = z.infer<typeof MeSchema>

export function getMe(): Promise<Me> {
  return withCache('me', async () => {
    const data = await apiClient.get<unknown>('/me')

    return MeSchema.parse(data)
  })
}
