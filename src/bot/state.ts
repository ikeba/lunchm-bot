import type { Transaction } from '@/api/types/types'

interface BotState {
  activeMsgId: number | undefined
  pendingAmount: string | undefined
  pendingEditTransaction: Transaction | undefined
  quickInputEnabled: boolean
}

const state: BotState = {
  activeMsgId: undefined,
  pendingAmount: undefined,
  pendingEditTransaction: undefined,
  quickInputEnabled: true,
}

export function getActiveMsgId(): number | undefined {
  return state.activeMsgId
}

export function setActiveMsgId(id: number | undefined): void {
  state.activeMsgId = id
}

export function consumePendingAmount(): string | undefined {
  const value = state.pendingAmount

  state.pendingAmount = undefined

  return value
}

export function setPendingAmount(amount: string): void {
  state.pendingAmount = amount
}

export function consumePendingEditTransaction(): Transaction | undefined {
  const value = state.pendingEditTransaction

  state.pendingEditTransaction = undefined

  return value
}

export function setPendingEditTransaction(
  transaction: Transaction | undefined
): void {
  state.pendingEditTransaction = transaction
}

export function isQuickInputEnabled(): boolean {
  return state.quickInputEnabled
}

export function setQuickInputEnabled(value: boolean): void {
  state.quickInputEnabled = value
}
