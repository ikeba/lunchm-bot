export const CategoryCallback = {
  ID_PREFIX: 'category:',
} as const

export const PageCallback = {
  NEXT: 'page:next',
  PREV: 'page:prev',
  NOOP: 'page:noop',
} as const

export const CommonCallback = {
  BACK: 'back',
} as const

export const FilterCallback = {
  CLEAR: 'filter:clear',
} as const

export const MenuCallback = {
  BACK: 'menu:back',
} as const

export const AccountCallback = {
  PREFIX: 'account:',
} as const

export const CurrencyCallback = {
  PREFIX: 'currency:',
} as const

export const DateCallback = {
  YESTERDAY: 'date:yesterday',
  TODAY: 'date:today',
  TOMORROW: 'date:tomorrow',
  MANUAL: 'date:manual',
} as const

export const PreviewCallback = {
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  EDIT_ACCOUNT: 'edit:account',
  EDIT_CATEGORY: 'edit:category',
  EDIT_DATE: 'edit:date',
  EDIT_CURRENCY: 'edit:currency',
  EDIT_PAYEE: 'edit:payee',
  EDIT_NOTE: 'edit:note',
} as const

export const PayeeCallback = {
  SELECT_PREFIX: 'payee:s:',
  SKIP: 'payee:skip',
  USE_TYPED: 'payee:typed',
} as const

export const PostSaveCallback = {
  ADD_SIMILAR: 'add_similar',
  ADD_NEW: 'add_new',
  UNDO_PREFIX: 'undo:',
} as const
