import { z } from 'zod'

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
  balance: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  institution_name: z.string().nullable().optional(),
  closed: z.boolean().default(false),
})

export type Account = z.infer<typeof AccountSchema>
