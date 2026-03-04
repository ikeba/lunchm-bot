import { getRecentTransactions } from '@/api/transactions'
import { formatTransactionList } from '@/utils/formatTransaction'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'
import { safeDelete } from '@/utils/telegram'

export async function handleListTransactions(ctx: MyContext): Promise<void> {
  const loadingMsg = await ctx.reply('Fetching recent transactions...')

  try {
    const transactions = await getRecentTransactions()

    await safeDelete(ctx.api, loadingMsg.chat.id, loadingMsg.message_id)
    await ctx.reply(formatTransactionList(transactions), {
      parse_mode: 'HTML',
      reply_markup: backToMenuKeyboard(),
    })
  } catch (e) {
    await safeDelete(ctx.api, loadingMsg.chat.id, loadingMsg.message_id)
    await ctx.reply(`Error: ${e}`, { reply_markup: backToMenuKeyboard() })
  }
}
