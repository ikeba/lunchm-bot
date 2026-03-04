import type { Conversation } from '@grammyjs/conversations'
import type { MyContext } from '@/types/context'

export type Conv = Conversation<MyContext, MyContext>

export interface TransferDraft {
  amount: string
  currency: string
  sourceAccountId: number
  sourceAccountName: string
  destinationAccountId: number
  destinationAccountName: string
  date: string
}

export interface TransferFlowContext {
  conversation: Conv
  ctx: MyContext
  chatId: number
  msgId: number
  draft: TransferDraft
}
