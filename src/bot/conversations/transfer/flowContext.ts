import type { MyContext } from '@/types/context'
import type { Conv } from '../shared/types'

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
