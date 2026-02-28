import { config } from '@/config'
import { logger } from './logger'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET'

  logger.info(`[http] ${method} ${path}`)

  const res = await fetch(`${config.LUNCH_MONEY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.LUNCH_MONEY_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')

    logger.error(
      `[http] ${method} ${path} → ${res.status} ${res.statusText}`,
      body
    )
    throw new Error(`Lunch Money API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
