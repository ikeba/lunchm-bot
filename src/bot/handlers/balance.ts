import { getAccounts } from '@/api/accounts'
import { formatAccountList } from '@/utils/formatAccount'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'

export async function handleBalance(ctx: MyContext): Promise<void> {
  const loadingMsg = await ctx.reply('Fetching accounts...')

  try {
    const accounts = await getAccounts()

    await ctx.api
      .deleteMessage(loadingMsg.chat.id, loadingMsg.message_id)
      .catch(() => {})
    await ctx.reply(formatAccountList(accounts), {
      parse_mode: 'HTML',
      reply_markup: backToMenuKeyboard(),
    })
  } catch (e) {
    await ctx.api
      .deleteMessage(loadingMsg.chat.id, loadingMsg.message_id)
      .catch(() => {})
    await ctx.reply(`Error: ${e}`, { reply_markup: backToMenuKeyboard() })
  }
}
