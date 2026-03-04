import { getAccounts } from '@/api/accounts'
import { formatAccountList } from '@/utils/formatAccount'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'
import { safeDelete } from '@/utils/telegram'

export async function handleBalance(ctx: MyContext): Promise<void> {
  const loadingMsg = await ctx.reply('Fetching accounts...')

  try {
    const accounts = await getAccounts()

    await safeDelete(ctx.api, loadingMsg.chat.id, loadingMsg.message_id)
    await ctx.reply(formatAccountList(accounts), {
      parse_mode: 'HTML',
      reply_markup: backToMenuKeyboard(),
    })
  } catch (e) {
    await safeDelete(ctx.api, loadingMsg.chat.id, loadingMsg.message_id)
    await ctx.reply(`Error: ${e}`, { reply_markup: backToMenuKeyboard() })
  }
}
