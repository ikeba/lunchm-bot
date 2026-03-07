import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { getCategoryPayeeMap, getTopPayees } from '@/api/payees'
import type { FlowData } from './flowContext'
import type { Conv } from './types'

export async function fetchFlowData(): Promise<FlowData> {
  const [currencies, accounts, categories, payees, categoryPayeeMap] =
    await Promise.all([
      getCurrencies(),
      getAccounts(),
      getCategories(),
      getTopPayees(),
      getCategoryPayeeMap(),
    ])

  return { currencies, accounts, categories, payees, categoryPayeeMap }
}

export async function loadFlowData(conversation: Conv): Promise<FlowData> {
  return conversation.external(fetchFlowData)
}
