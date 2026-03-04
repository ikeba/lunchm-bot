import type { Category } from '@/api/types/types'
import type { CategoryFrequencyEntry } from '@/api/transactions'
import { isoDate } from '@/utils/date'

export type FrequencyMap = Map<number, { count: number; lastDate: string }>

export function toFrequencyMap(
  entries: CategoryFrequencyEntry[]
): FrequencyMap {
  return new Map(
    entries.map(entry => [
      entry.categoryId,
      { count: entry.count, lastDate: entry.lastDate },
    ])
  )
}

export function getRecentIds(
  frequencyMap: FrequencyMap,
  daysBack: number
): Set<number> {
  const cutoff = isoDate(-daysBack)

  return new Set(
    [...frequencyMap.entries()]
      .filter(([, usage]) => usage.lastDate >= cutoff)
      .map(([categoryId]) => categoryId)
  )
}

export function sortByFrequency(
  categories: Category[],
  frequencyMap: FrequencyMap,
  recentIds: Set<number>
): Category[] {
  const recent = (id: number) => (recentIds.has(id) ? 1 : 0)
  const count = (id: number) => frequencyMap.get(id)?.count ?? 0

  return [...categories].sort(
    (a, b) =>
      recent(b.id) - recent(a.id) ||
      count(b.id) - count(a.id) ||
      a.name.localeCompare(b.name)
  )
}
