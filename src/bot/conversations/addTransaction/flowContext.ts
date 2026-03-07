import type { InlineKeyboard } from 'grammy'
import type { Account, Category } from '@/api/types/types'
import type { CategoryPayeeMap } from '@/api/payees'
import type { MyContext } from '@/types/context'
import type { Conv } from '../shared/types'

export interface TransactionDraft {
  amount: string
  currency: string
  manualAccountId?: number
  accountName?: string
  categoryId?: number
  categoryName?: string
  date: string
  payee?: string
  notes?: string
}

export interface FlowContext {
  conversation: Conv
  ctx: MyContext
  chatId: number
  msgId: number
  draft: TransactionDraft
  title?: string
  keyboard?: () => InlineKeyboard
}

export interface FlowData {
  currencies: string[]
  accounts: Account[]
  categories: Category[]
  payees: string[]
  categoryPayeeMap: CategoryPayeeMap
}
