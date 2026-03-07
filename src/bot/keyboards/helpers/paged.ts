import { InlineKeyboard } from 'grammy'
import { FilterCallback, PageCallback } from '@/bot/constants/callbacks'

function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, (i + 1) * size)
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

export interface PagedKeyboardOptions<T> {
  items: T[]
  pageSize: number
  page: number
  columns?: number
  renderButton: (
    item: T,
    globalIndex: number
  ) => { label: string; callback: string }
  separatorAfterIndex?: number
  filterText?: string
  extraRows?: { label: string; callback: string }[][]
}

export function buildPagedKeyboard<T>({
  items,
  pageSize,
  page,
  columns = 2,
  renderButton,
  separatorAfterIndex,
  filterText,
  extraRows = [],
}: PagedKeyboardOptions<T>): InlineKeyboard {
  const totalPages = Math.ceil(items.length / pageSize) || 1
  const pageStart = page * pageSize
  const pageItems = items.slice(pageStart, (page + 1) * pageSize)

  const itemButtons = chunk(pageItems, columns).map((row, rowIndex) =>
    row.map((item, colIndex) => {
      const { label, callback } = renderButton(
        item,
        pageStart + rowIndex * columns + colIndex
      )

      return InlineKeyboard.text(label, callback)
    })
  )

  const itemRows: (typeof itemButtons)[number][] = []

  if (
    separatorAfterIndex != null &&
    separatorAfterIndex >= pageStart &&
    separatorAfterIndex < pageStart + pageItems.length - 1
  ) {
    const splitAfter = separatorAfterIndex - pageStart
    let counted = 0
    let inserted = false

    for (const row of itemButtons) {
      itemRows.push(row)
      counted += row.length

      if (!inserted && counted > splitAfter && counted < pageItems.length) {
        itemRows.push([InlineKeyboard.text('· · ·', PageCallback.NOOP)])
        inserted = true
      }
    }
  } else {
    itemRows.push(...itemButtons)
  }

  const filterRow = filterText
    ? [[InlineKeyboard.text(`✕ Clear "${filterText}"`, FilterCallback.CLEAR)]]
    : []

  const extraButtonRows = extraRows.map(row =>
    row.map(({ label, callback }) => InlineKeyboard.text(label, callback))
  )

  return InlineKeyboard.from([
    ...itemRows,
    ...(totalPages > 1 ? [navigationRow(page, totalPages)] : []),
    ...filterRow,
    ...extraButtonRows,
  ])
}
