import { CommonCallback, PayeeCallback } from '@/bot/constants/callbacks'
import { buildPagedKeyboard } from './helpers/paged'
import type { InlineKeyboard } from 'grammy'

export const PAYEE_PAGE_SIZE = 10

interface PayeeKeyboardOptions {
  payees: string[]
  page: number
  categoryPayeeCount?: number
  filterText?: string
}

export function payeeKeyboard({
  payees,
  page,
  categoryPayeeCount,
  filterText,
}: PayeeKeyboardOptions): InlineKeyboard {
  const useTypedRow = filterText
    ? [{ label: `✓ Use "${filterText}"`, callback: PayeeCallback.USE_TYPED }]
    : null

  return buildPagedKeyboard({
    items: payees,
    pageSize: PAYEE_PAGE_SIZE,
    page,
    renderButton: (payee, globalIndex) => ({
      label:
        !filterText &&
        categoryPayeeCount != null &&
        globalIndex < categoryPayeeCount
          ? `★ ${payee}`
          : payee,
      callback: PayeeCallback.SELECT_PREFIX + globalIndex,
    }),
    separatorAfterIndex:
      !filterText &&
      categoryPayeeCount != null &&
      categoryPayeeCount > 0 &&
      categoryPayeeCount < payees.length
        ? categoryPayeeCount - 1
        : undefined,
    filterText,
    extraRows: [
      ...(useTypedRow ? [useTypedRow] : []),
      [{ label: '🚫 Clear payee', callback: PayeeCallback.SKIP }],
      [{ label: '↩ Back', callback: CommonCallback.BACK }],
    ],
  })
}
