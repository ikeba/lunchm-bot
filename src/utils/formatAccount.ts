import type { Account } from '@/api/types/types'

export function formatAccount(a: Account): string {
  const balance = a.balance != null ? `${a.balance} ${a.currency}` : 'N/A'
  const institution = a.institution_name ? ` (${a.institution_name})` : ''

  return `${a.name}${institution}: ${balance}`
}

function formatBalance(
  balance: string | null | undefined,
  currency: string | null | undefined
): string {
  if (balance == null || currency == null) {
    return 'N/A'
  }

  const num = Number.parseFloat(balance)
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const formatted = formatter.format(num).replace(/,/g, ' ')

  return `${formatted} ${currency.toUpperCase()}`
}

export function formatAccountList(accounts: Account[]): string {
  if (accounts.length === 0) {
    return 'No accounts found.'
  }

  // Group by institution_name
  const groups = new Map<string, Account[]>()

  for (const account of accounts) {
    const key = account.institution_name || 'Other'

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups.get(key)!.push(account)
  }

  // Sort within each group by balance descending
  for (const group of groups.values()) {
    group.sort((a, b) => {
      const balA = Number.parseFloat(a.balance || '0')
      const balB = Number.parseFloat(b.balance || '0')

      return balB - balA
    })
  }

  // Compute global max widths across ALL accounts
  let maxNameLen = 0
  let maxBalanceLen = 0
  const balanceStrings = new Map<Account, string>()

  for (const account of accounts) {
    maxNameLen = Math.max(maxNameLen, account.name.length)
    const balStr = formatBalance(account.balance, account.currency)

    balanceStrings.set(account, balStr)
    maxBalanceLen = Math.max(maxBalanceLen, balStr.length)
  }

  // Render with HTML <pre> for monospace alignment
  const lines: string[] = ['💰 Accounts']

  for (const [institution, group] of groups) {
    const emoji = institution.toLowerCase().includes('crypto') ? '💰' : '🏦'

    lines.push('')
    lines.push(`${emoji} ${institution}`)

    const preLines: string[] = []

    for (const account of group) {
      const name = account.name.padEnd(maxNameLen)
      const balance = balanceStrings.get(account)!.padStart(maxBalanceLen)

      preLines.push(`${name}  ${balance}`)
    }

    lines.push(`<pre>${preLines.join('\n')}</pre>`)
  }

  return lines.join('\n')
}
