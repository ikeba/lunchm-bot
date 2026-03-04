import type { PrefKey } from '../core/db'
import { deletePref, getPref, setPref } from '../core/db'
import { logger } from '../core/logger'

export interface LastUsed {
  manualAccountId?: number
  accountName?: string
  categoryId?: number
  categoryName?: string
}

export function getLastUsed(): LastUsed {
  const accountIdRaw = getPref('last_used.account_id')
  const categoryIdRaw = getPref('last_used.category_id')

  const result = {
    manualAccountId: accountIdRaw ? Number(accountIdRaw) : undefined,
    accountName: getPref('last_used.account_name') ?? undefined,
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined,
    categoryName: getPref('last_used.category_name') ?? undefined,
  }

  logger.info('[userState] getLastUsed', result)

  return result
}

const PREF_KEYS = {
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

  logger.info('[userState] setLastUsed', patch)
}
