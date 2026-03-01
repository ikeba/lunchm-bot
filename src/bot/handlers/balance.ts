import type { Bot } from 'grammy'
import { getAccounts } from '@/api/accounts'
import { formatAccountList } from '@/utils/formatAccount'
import type { MyContext } from '@/bot/context'
import { Command } from '@/bot/commands'

export async function handleBalance(ctx: MyContext): Promise<void> {
  await ctx.reply('Fetching accounts...')
  try {
    const accounts = await getAccounts()

    await ctx.reply(formatAccountList(accounts), { parse_mode: 'HTML' })
  } catch (e) {
    await ctx.reply(`Error: ${e}`)
  }
}

export function registerBalanceHandler(bot: Bot<MyContext>): void {
  bot.command(Command.Balance, handleBalance)
}
