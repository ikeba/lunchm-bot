import type { Account } from '@/api/types'

export function formatAccount(a: Account): string {
  const balance = a.balance != null ? `${a.balance} ${a.currency}` : 'N/A'
  const institution = a.institution_name ? ` (${a.institution_name})` : ''

  return `${a.name}${institution}: ${balance}`
}

export function formatAccountList(accounts: Account[]): string {
  if (accounts.length === 0)
{ return 'No accounts found.' }

  return accounts.map(formatAccount).join('\n')
}
