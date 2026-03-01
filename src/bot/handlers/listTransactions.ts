import { getTransactions } from '@/api/transactions'
import { formatTransactionList } from '@/utils/formatTransaction'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'

export async function handleListTransactions(
  ctx: MyContext,
  limit = 50
): Promise<void> {
  const loadingMsg = await ctx.reply(`Fetching last ${limit} transactions...`)

  try {
    const transactions = await getTransactions(limit)

    await ctx.api
      .deleteMessage(loadingMsg.chat.id, loadingMsg.message_id)
      .catch(() => {})
    await ctx.reply(formatTransactionList(transactions), {
      reply_markup: backToMenuKeyboard(),
    })
  } catch (e) {
    await ctx.api
      .deleteMessage(loadingMsg.chat.id, loadingMsg.message_id)
      .catch(() => {})
    await ctx.reply(`Error: ${e}`, { reply_markup: backToMenuKeyboard() })
  }
}
