import { InlineKeyboard } from 'grammy'
import type { Account } from '@/api/types/types'
import {
  AccountCallback,
  CommonCallback,
  CurrencyCallback,
  DateCallback,
  MenuCallback,
  PostSaveCallback,
  PreviewCallback,
} from '@/bot/constants/callbacks'

export { categoryKeyboard, CATEGORY_PAGE_SIZE } from '@/bot/keyboards/category'

export function previewKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Confirm', PreviewCallback.CONFIRM)
    .row()
    .text('🏦 Edit Account', PreviewCallback.EDIT_ACCOUNT)
    .text('🏷 Edit Category', PreviewCallback.EDIT_CATEGORY)
    .row()
    .text('📅 Edit Date', PreviewCallback.EDIT_DATE)
    .text('💱 Edit Currency', PreviewCallback.EDIT_CURRENCY)
    .row()
    .text('👤 Edit Payee', PreviewCallback.EDIT_PAYEE)
    .text('📝 Edit Note', PreviewCallback.EDIT_NOTE)
    .row()
    .text('❌ Cancel', PreviewCallback.CANCEL)
}

export function afterSaveKeyboard(transactionId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('Add similar', PostSaveCallback.ADD_SIMILAR)
    .text('Add new', PostSaveCallback.ADD_NEW)
    .row()
    .text('Undo', `${PostSaveCallback.UNDO_PREFIX}${transactionId}`)
    .row()
    .text('← Menu', MenuCallback.BACK)
}

export function backToMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('← Menu', MenuCallback.BACK)
}

/** Back button — shown below text prompts (payee, note) */
export function backKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('↩ Back', CommonCallback.BACK)
}

/** Date quick-pick */
export function datePicker(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Yesterday', DateCallback.YESTERDAY)
    .text('Today', DateCallback.TODAY)
    .text('Tomorrow', DateCallback.TOMORROW)
    .row()
    .text('✏️ Enter manually', DateCallback.MANUAL)
    .row()
    .text('↩ Back', CommonCallback.BACK)
}

export function currencyKeyboard(
  currencies: string[],
  selected: string
): InlineKeyboard {
  const kb = new InlineKeyboard()

  currencies.forEach((c, i) => {
    kb.text(
      c.toUpperCase() === selected.toUpperCase()
        ? `${c.toUpperCase()} ✓`
        : c.toUpperCase(),
      `${CurrencyCallback.PREFIX}${c}`
    )
    if (i % 3 === 2) {
      kb.row()
    }
  })
  if (currencies.length % 3 !== 0) {
    kb.row()
  }

  kb.text('↩ Back', CommonCallback.BACK)

  return kb
}

export function accountKeyboard(accounts: Account[]): InlineKeyboard {
  const kb = new InlineKeyboard()

  accounts.forEach((acc, i) => {
    kb.text(acc.name, `${AccountCallback.PREFIX}${acc.id}`)
    if (i % 2 === 1) {
      kb.row()
    }
  })
  if (accounts.length % 2 === 1) {
    kb.row()
  }

  kb.text('↩ Back', CommonCallback.BACK)

  return kb
}
