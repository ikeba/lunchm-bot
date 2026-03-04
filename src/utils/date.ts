export function isoDate(offsetDays = 0): string {
  const d = new Date()

  d.setDate(d.getDate() + offsetDays)

  return d.toISOString().slice(0, 10)
}

export function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

// Returns last calendar day of given month (month is 1-indexed)
export function monthEnd(year: number, month: number): string {
  return new Date(year, month, 0).toISOString().slice(0, 10)
}
