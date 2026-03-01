import { InlineKeyboard } from 'grammy'
import type { Category } from '@/api/types/types'
import {
  CategoryCallback,
  CommonCallback,
  FilterCallback,
  PageCallback,
} from '@/bot/constants/callbacks'

export const CATEGORY_PAGE_SIZE = 10

function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, (index + 1) * size)
  )
}

function categoryButton(category: Category, isRecent: boolean) {
  const label = isRecent ? `★ ${category.name}` : category.name

  return InlineKeyboard.text(
    label,
    `${CategoryCallback.ID_PREFIX}${category.id}`
  )
}

function navigationRow(page: number, totalPages: number) {
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1

  return [
    InlineKeyboard.text(
      hasPrev ? '← Prev' : '·',
      hasPrev ? PageCallback.PREV : PageCallback.NOOP
    ),
    InlineKeyboard.text(`${page + 1}/${totalPages}`, PageCallback.NOOP),
    InlineKeyboard.text(
      hasNext ? 'Next →' : '·',
      hasNext ? PageCallback.NEXT : PageCallback.NOOP
    ),
  ]
}

export function categoryKeyboard(
  categories: Category[],
  page: number,
  totalPages: number,
  recentIds: Set<number>,
  filterText?: string
): InlineKeyboard {
  const pageItems = categories.slice(
    page * CATEGORY_PAGE_SIZE,
    (page + 1) * CATEGORY_PAGE_SIZE
  )

  const categoryRows = chunk(pageItems, 2).map(pair =>
    pair.map(category => categoryButton(category, recentIds.has(category.id)))
  )

  const filterRow = filterText
    ? [[InlineKeyboard.text(`✕ Clear "${filterText}"`, FilterCallback.CLEAR)]]
    : []

  const utilityRows = [[InlineKeyboard.text('↩ Back', CommonCallback.BACK)]]

  return InlineKeyboard.from([
    ...categoryRows,
    ...(totalPages > 1 ? [navigationRow(page, totalPages)] : []),
    ...filterRow,
    ...utilityRows,
  ])
}
