export function isoDate(offsetDays = 0): string {
  const d = new Date()

  d.setDate(d.getDate() + offsetDays)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

// Returns last calendar day of given month (month is 1-indexed)
export function monthEnd(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate()

  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}
