import type { Bot } from 'grammy'
import { getTransactions } from '@/api/transactions'
import { Command } from '@/bot/commands'
import { formatTransactionList } from '@/utils/formatTransaction'
import type { MyContext } from '@/bot/context'

export async function handleListTransactions(
  ctx: MyContext,
  limit = 50
): Promise<void> {
  await ctx.reply(`Fetching last ${limit} transactions...`)
  try {
    const transactions = await getTransactions(limit)

    await ctx.reply(formatTransactionList(transactions))
  } catch (e) {
    await ctx.reply(`Error: ${e}`)
  }
}

export function registerListTransactionsHandler(bot: Bot<MyContext>): void {
  bot.command(Command.Transactions, ctx => {
    const arg = ctx.match ? Number.parseInt(ctx.match, 10) : Number.NaN
    const limit = Number.isNaN(arg) ? 50 : Math.min(arg, 200)

    return handleListTransactions(ctx, limit)
  })
}
