import type { Category } from '@/api/types/types'
import { CategoryCallback, CommonCallback } from '@/bot/constants/callbacks'
import { buildPagedKeyboard } from './helpers/paged'
import type { InlineKeyboard } from 'grammy'

export const CATEGORY_PAGE_SIZE = 10

export function categoryKeyboard(
  categories: Category[],
  page: number,
  _totalPages: number,
  recentIds: Set<number>,
  filterText?: string
): InlineKeyboard {
  return buildPagedKeyboard({
    items: categories,
    pageSize: CATEGORY_PAGE_SIZE,
    page,
    renderButton: category => ({
      label: recentIds.has(category.id) ? `★ ${category.name}` : category.name,
      callback: `${CategoryCallback.ID_PREFIX}${category.id}`,
    }),
    filterText,
    extraRows: [[{ label: '↩ Back', callback: CommonCallback.BACK }]],
  })
}
