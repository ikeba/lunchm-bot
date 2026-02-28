import { z } from 'zod'

const schema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  LUNCH_MONEY_API_KEY: z.string(),
  ALLOWED_USER_ID: z.coerce.number(),
  LUNCH_MONEY_BASE_URL: z.string().default('https://api.lunchmoney.dev/v2'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info']).default('info'),
})

export const config = schema.parse(Bun.env)
