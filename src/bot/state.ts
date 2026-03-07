import type { Transaction } from '@/api/types/types'

let activeMsgId: number | undefined
let pendingAmount: string | undefined
let pendingEditTransaction: Transaction | undefined
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

export function getPendingEditTransaction(): Transaction | undefined {
  const transaction = pendingEditTransaction

  pendingEditTransaction = undefined

  return transaction
}

export function setPendingEditTransaction(
  transaction: Transaction | undefined
): void {
  pendingEditTransaction = transaction
}

export function isQuickInputEnabled(): boolean {
  return quickInputEnabled
}

export function setQuickInputEnabled(value: boolean): void {
  quickInputEnabled = value
}
