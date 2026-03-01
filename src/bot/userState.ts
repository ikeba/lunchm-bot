import type { PrefKey } from '../core/db'
import { deletePref, getPref, setPref } from '../core/db'

export interface LastUsed {
  currency?: string
  manualAccountId?: number
  accountName?: string
  categoryId?: number
  categoryName?: string
}

export function getLastUsed(): LastUsed {
  const accountIdRaw = getPref('last_used.account_id')
  const categoryIdRaw = getPref('last_used.category_id')

  return {
    currency: getPref('last_used.currency') ?? undefined,
    manualAccountId: accountIdRaw ? Number(accountIdRaw) : undefined,
    accountName: getPref('last_used.account_name') ?? undefined,
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined,
    categoryName: getPref('last_used.category_name') ?? undefined,
  }
}

const PREF_KEYS = {
  currency: 'last_used.currency',
  manualAccountId: 'last_used.account_id',
  accountName: 'last_used.account_name',
  categoryId: 'last_used.category_id',
  categoryName: 'last_used.category_name',
} as const satisfies Record<keyof LastUsed, PrefKey>

export function setLastUsed(patch: Partial<LastUsed>): void {
  for (const [field, key] of Object.entries(PREF_KEYS) as [
    keyof LastUsed,
    PrefKey,
  ][]) {
    if (!(field in patch)) {
      continue
    }

    const val = patch[field]

    val != null ? setPref(key, String(val)) : deletePref(key)
  }
}
