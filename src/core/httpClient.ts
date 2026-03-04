import { config } from '@/config'
import { logger } from './logger'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET'
  const start = Date.now()

  const res = await fetch(`${config.LUNCH_MONEY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.LUNCH_MONEY_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const ms = Date.now() - start

  const rawBody = await res.text().catch(() => '')
  const preview = rawBody.length > 200 ? `${rawBody.slice(0, 200)}…` : rawBody

  if (!res.ok) {
    logger.error(`[http] ${method} ${path} → ${res.status} ${ms}ms`, preview)
    throw new Error(`Lunch Money API error: ${res.status} ${res.statusText}`)
  }

  logger.info(`[http] ${method} ${path} → ${res.status} ${ms}ms`, preview)

  return JSON.parse(rawBody) as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
