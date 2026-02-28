import type { Bot } from 'grammy'
import { getAccounts } from '@/api/accounts'
import { formatAccountList } from '@/utils/formatAccount'
import type { MyContext } from '@/bot/context'

export async function handleBalance(ctx: MyContext): Promise<void> {
  await ctx.reply('Fetching accounts...')
  try {
    const accounts = await getAccounts()

    await ctx.reply(formatAccountList(accounts))
  } catch (e) {
    await ctx.reply(`Error: ${e}`)
  }
}

export function registerBalanceHandler(bot: Bot<MyContext>): void {
  bot.command('balance', handleBalance)
}
