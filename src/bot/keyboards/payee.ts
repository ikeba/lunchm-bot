import { CommonCallback, PayeeCallback } from '@/bot/constants/callbacks'
import { buildPagedKeyboard } from './helpers/paged'
import type { InlineKeyboard } from 'grammy'

export const PAYEE_PAGE_SIZE = 10

export function payeeKeyboard(
  payees: string[],
  page: number,
  _totalPages: number,
  filterText?: string
): InlineKeyboard {
  const useTypedRow = filterText
    ? [{ label: `✓ Use "${filterText}"`, callback: PayeeCallback.USE_TYPED }]
    : null

  return buildPagedKeyboard({
    items: payees,
    pageSize: PAYEE_PAGE_SIZE,
    page,
    renderButton: (payee, globalIndex) => ({
      label: payee,
      callback: PayeeCallback.SELECT_PREFIX + globalIndex,
    }),
    filterText,
    extraRows: [
      ...(useTypedRow ? [useTypedRow] : []),
      [{ label: '🚫 Clear payee', callback: PayeeCallback.SKIP }],
      [{ label: '↩ Back', callback: CommonCallback.BACK }],
    ],
  })
}
