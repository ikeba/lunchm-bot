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

export function parseFlexibleDate(input: string): string | null {
  const trimmed = input.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const slashDot = trimmed.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/)

  if (slashDot) {
    const day = Number(slashDot[1])
    const month = Number(slashDot[2])
    let year = slashDot[3] ? Number(slashDot[3]) : new Date().getFullYear()

    if (year < 100) {
      year += 2000
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const dayOnly = trimmed.match(/^(\d{1,2})$/)

  if (dayOnly) {
    const day = Number(dayOnly[1])

    if (day < 1 || day > 31) {
      return null
    }

    const now = new Date()

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return null
}
