export function parseAmount(raw: string): string | null {
  const cleaned = raw.trim().replaceAll(',', '.')
  const parsed = Number.parseFloat(cleaned)

  return Number.isNaN(parsed) ? null : parsed.toFixed(2)
}

export function formatAmount(amount: string): string {
  const parsed = Number.parseFloat(amount)

  return Number.isNaN(parsed) ? amount : parsed.toFixed(2)
}
