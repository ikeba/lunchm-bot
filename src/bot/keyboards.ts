import { InlineKeyboard } from 'grammy'
import type { Account, Category } from '@/api/types'

export function previewKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Confirm', 'confirm')
    .row()
    .text('🏦 Edit Account', 'edit:account')
    .text('🏷 Edit Category', 'edit:category')
    .row()
    .text('📅 Edit Date', 'edit:date')
    .text('💱 Edit Currency', 'edit:currency')
    .row()
    .text('👤 Edit Payee', 'edit:payee')
    .text('📝 Edit Note', 'edit:note')
    .row()
    .text('❌ Cancel', 'cancel')
}

export function afterSaveKeyboard(transactionId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('Add similar', 'add_similar')
    .text('Add new', 'add_new')
    .text('Undo', `undo:${transactionId}`)
}

/** Back button — shown below text prompts (payee, note) */
export function backKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('↩ Back', 'back')
}

/** Date quick-pick */
export function datePicker(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Yesterday', 'date:yesterday')
    .text('Today', 'date:today')
    .text('Tomorrow', 'date:tomorrow')
    .row()
    .text('✏️ Enter manually', 'date:manual')
    .row()
    .text('↩ Back', 'back')
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
      `currency:${c}`
    )
    if (i % 3 === 2) {
      kb.row()
    }
  })
  if (currencies.length % 3 !== 0) {
    kb.row()
  }

  kb.text('↩ Back', 'back')

  return kb
}

export function accountKeyboard(accounts: Account[]): InlineKeyboard {
  const kb = new InlineKeyboard()

  accounts.forEach((acc, i) => {
    kb.text(acc.name, `account:${acc.id}`)
    if (i % 2 === 1) {
      kb.row()
    }
  })
  if (accounts.length % 2 === 1) {
    kb.row()
  }

  kb.text('Skip', 'account:skip').row().text('↩ Back', 'back')

  return kb
}

export function categoryKeyboard(categories: Category[]): InlineKeyboard {
  const kb = new InlineKeyboard()

  categories.forEach((cat, i) => {
    kb.text(cat.name, `category:${cat.id}`)
    if (i % 3 === 2) {
      kb.row()
    }
  })
  if (categories.length % 3 !== 0) {
    kb.row()
  }

  kb.text('Skip', 'category:skip').row().text('↩ Back', 'back')

  return kb
}
