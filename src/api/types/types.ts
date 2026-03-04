import { z } from 'zod'
import type { operations } from './lunchMoneyApiTypes'

export const TransactionSchema = z.object({
  id: z.number(),
  date: z.string(),
  amount: z.string(), // API returns decimal as string
  currency: z.string(),
  payee: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  account_id: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  is_income: z.boolean().default(false),
  to_base: z.number().default(0),
})

export type Transaction = z.infer<typeof TransactionSchema>

export const NewTransactionSchema = z.object({
  date: z.string(), // "YYYY-MM-DD"
  amount: z.string(), // decimal as string
  currency: z.string(),
  payee: z.string().optional(),
  notes: z.string().optional(),
  category_id: z.number().optional(),
  manual_account_id: z.number().optional(),
})

export type NewTransaction = z.infer<typeof NewTransactionSchema>

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  is_income: z.boolean(),
  archived: z.boolean(),
  is_group: z.boolean(),
  group_id: z.number().nullable(),
})

export type Category = z.infer<typeof CategorySchema>

export const AccountSchema = z.object({
  id: z.number(),
  name: z.string(),
  institution_name: z.string().nullable(),
  display_name: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  subtype: z.string().nullable().optional(),
  balance: z.string(),
  currency: z.string(),
  to_base: z.number(),
  balance_as_of: z.string(),
  status: z.enum(['active', 'closed']),
  closed_on: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  exclude_from_transactions: z.boolean().default(false),
})

export type Account = z.infer<typeof AccountSchema>

export type TransactionsApiResponse =
  operations['getAllTransactions']['responses'][200]['content']['application/json']

export type AccountsApiResponse =
  operations['getAllManualAccounts']['responses'][200]['content']['application/json']

export type CategoriesApiResponse =
  operations['getAllCategories']['responses'][200]['content']['application/json']

export type MeApiResponse =
  operations['getMe']['responses'][200]['content']['application/json']

export type TransactionFilters = NonNullable<
  operations['getAllTransactions']['parameters']['query']
>

export const MeSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  primary_currency: z.string(),
})

export type Me = z.infer<typeof MeSchema>

export interface CategoryFrequencyEntry {
  categoryId: number
  count: number
  lastDate: string
}

export interface CategorySpending {
  thisMonth: number
  lastMonth: number
}
