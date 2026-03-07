let activeMsgId: number | undefined
let pendingAmount: string | undefined
let quickInputEnabled = true

export function getActiveMsgId(): number | undefined {
  return activeMsgId
}

export function setActiveMsgId(id: number | undefined): void {
  activeMsgId = id
}

export function getPendingAmount(): string | undefined {
  const amount = pendingAmount

  pendingAmount = undefined

  return amount
}

export function setPendingAmount(amount: string): void {
  pendingAmount = amount
}

export function isQuickInputEnabled(): boolean {
  return quickInputEnabled
}

export function setQuickInputEnabled(value: boolean): void {
  quickInputEnabled = value
}
