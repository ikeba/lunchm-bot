interface LastUsed {
  currency?: string
  manualAccountId?: number
  accountName?: string
  categoryId?: number
  categoryName?: string
}

const state: LastUsed = {}

export function getLastUsed(): LastUsed {
  return { ...state }
}

export function setLastUsed(patch: Partial<LastUsed>): void {
  Object.assign(state, patch)
}
