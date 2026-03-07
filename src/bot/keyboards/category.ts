import type { Category } from '@/api/types/types'
import { CategoryCallback, CommonCallback } from '@/bot/constants/callbacks'
import { buildPagedKeyboard } from './helpers/paged'
import type { InlineKeyboard } from 'grammy'

export const CATEGORY_PAGE_SIZE = 10

interface CategoryKeyboardOptions {
  categories: Category[]
  page: number
  recentIds: Set<number>
  selectedId?: number
  filterText?: string
}

export function categoryKeyboard({
  categories,
  page,
  recentIds,
  selectedId,
  filterText,
}: CategoryKeyboardOptions): InlineKeyboard {
  const recentCount = categories.filter(c => recentIds.has(c.id)).length

  return buildPagedKeyboard({
    items: categories,
    pageSize: CATEGORY_PAGE_SIZE,
    page,
    renderButton: (category, globalIndex) => {
      const isSelected = category.id === selectedId
      const isRecent = recentIds.has(category.id)
      const prefix = isSelected ? '✓ ' : isRecent ? '★ ' : ''

      return {
        label: `${prefix}${category.name}`,
        callback: `${CategoryCallback.ID_PREFIX}${category.id}`,
      }
    },
    separatorAfterIndex:
      !filterText && recentCount > 0 && recentCount < categories.length
        ? recentCount - 1
        : undefined,
    filterText,
    extraRows: [[{ label: '↩ Back', callback: CommonCallback.BACK }]],
  })
}
