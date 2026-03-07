import { z } from 'zod'

const schema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  LUNCH_MONEY_API_KEY: z.string(),
  ALLOWED_USER_ID: z.coerce.number(),
  LUNCH_MONEY_BASE_URL: z.string().default('https://api.lunchmoney.dev/v2'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info']).default('info'),
  EXCLUDED_PAYEES: z
    .string()
    .default('[No Payee],Added To EUR,Transfer')
    .transform(value =>
      value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    ),
})

export const config = schema.parse(Bun.env)
