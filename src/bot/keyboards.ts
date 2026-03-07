import { InlineKeyboard } from 'grammy'
import type { Account, Transaction } from '@/api/types/types'
import {
  AccountCallback,
  CommonCallback,
  CurrencyCallback,
  DateCallback,
  EditPreviewCallback,
  MenuCallback,
  PostSaveCallback,
  PreviewCallback,
  TransactionListCallback,
  TransferCallback,
} from '@/bot/constants/callbacks'

export { categoryKeyboard, CATEGORY_PAGE_SIZE } from '@/bot/keyboards/category'

function addEditFieldRows(kb: InlineKeyboard): InlineKeyboard {
  return kb
    .text('🏷 Category', PreviewCallback.EDIT_CATEGORY)
    .text('👤 Payee', PreviewCallback.EDIT_PAYEE)
    .row()
    .text('🏦 Account', PreviewCallback.EDIT_ACCOUNT)
    .text('📅 Date', PreviewCallback.EDIT_DATE)
    .row()
    .text('💰 Amount', PreviewCallback.EDIT_AMOUNT)
    .text('📝 Note', PreviewCallback.EDIT_NOTE)
    .row()
    .text('💱 Currency', PreviewCallback.EDIT_CURRENCY)
    .row()
}

export function previewKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text('✅ Confirm', PreviewCallback.CONFIRM)
    .row()

  return addEditFieldRows(kb).text('❌ Cancel', PreviewCallback.CANCEL)
}

export function afterSaveKeyboard(transactionId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('Undo', `${PostSaveCallback.UNDO_PREFIX}${transactionId}`)
    .row()
    .text('➕ New', PostSaveCallback.ADD_NEW)
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

export function transferPreviewKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Confirm', TransferCallback.CONFIRM)
    .row()
    .text('📅 Edit Date', TransferCallback.EDIT_DATE)
    .text('💱 Edit Currency', TransferCallback.EDIT_CURRENCY)
    .row()
    .text('❌ Cancel', TransferCallback.CANCEL)
}

export function editPreviewKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text('💾 Save', EditPreviewCallback.SAVE)
    .text('🗑 Delete', EditPreviewCallback.DELETE)
    .row()

  return addEditFieldRows(kb).text('❌ Cancel', PreviewCallback.CANCEL)
}

export function deleteConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Yes, delete', EditPreviewCallback.DELETE_CONFIRM)
    .text('↩ Back', EditPreviewCallback.DELETE_CANCEL)
}

export function transactionListKeyboard(
  transactions: Transaction[]
): InlineKeyboard {
  const kb = new InlineKeyboard()

  transactions.forEach((transaction, index) => {
    kb.text(
      String(index + 1),
      `${TransactionListCallback.SELECT_PREFIX}${transaction.id}`
    )
    if ((index + 1) % 8 === 0) {
      kb.row()
    }
  })

  if (transactions.length % 8 !== 0) {
    kb.row()
  }

  kb.text('← Menu', MenuCallback.BACK)

  return kb
}

export function accountKeyboard(
  accounts: Account[],
  selectedId?: number
): InlineKeyboard {
  const sorted = selectedId
    ? [
        ...accounts.filter(a => a.id === selectedId),
        ...accounts.filter(a => a.id !== selectedId),
      ]
    : accounts

  const kb = new InlineKeyboard()

  sorted.forEach((acc, i) => {
    const label = acc.id === selectedId ? `✓ ${acc.name}` : acc.name

    kb.text(label, `${AccountCallback.PREFIX}${acc.id}`)
    if (i % 2 === 1) {
      kb.row()
    }
  })
  if (sorted.length % 2 === 1) {
    kb.row()
  }

  kb.text('↩ Back', CommonCallback.BACK)

  return kb
}
