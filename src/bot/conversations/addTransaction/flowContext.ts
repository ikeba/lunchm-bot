import type { Conversation } from '@grammyjs/conversations'
import type { Account, Category } from '@/api/types/types'
import type { MyContext } from '@/types/context'

export type Conv = Conversation<MyContext, MyContext>

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
}

export interface FlowData {
  currencies: string[]
  accounts: Account[]
  categories: Category[]
}
