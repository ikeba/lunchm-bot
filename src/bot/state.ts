interface BotState {
  activeMsgId: number | undefined
  pendingAmount: string | undefined
  pendingEditTransactionId: number | undefined
  quickInputEnabled: boolean
}

const state: BotState = {
  activeMsgId: undefined,
  pendingAmount: undefined,
  pendingEditTransactionId: undefined,
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

export function consumePendingEditTransactionId(): number | undefined {
  const value = state.pendingEditTransactionId

  state.pendingEditTransactionId = undefined

  return value
}

export function setPendingEditTransaction(id: number): void {
  state.pendingEditTransactionId = id
}

export function isQuickInputEnabled(): boolean {
  return state.quickInputEnabled
}

export function setQuickInputEnabled(value: boolean): void {
  state.quickInputEnabled = value
}
