import { getRecentTransactions } from '@/api/transactions'
import { formatTransactionList } from '@/utils/formatTransaction'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'
import { getActiveMsgId } from '@/bot/state'

export async function handleListTransactions(ctx: MyContext): Promise<void> {
  const chatId = ctx.chat!.id
  const msgId = getActiveMsgId()!

  await ctx.api
    .editMessageText(chatId, msgId, 'Fetching recent transactions...')
    .catch(() => {})

  try {
    const transactions = await getRecentTransactions()

    await ctx.api.editMessageText(
      chatId,
      msgId,
      formatTransactionList(transactions),
      {
        parse_mode: 'HTML',
        reply_markup: backToMenuKeyboard(),
      }
    )
  } catch (e) {
    await ctx.api
      .editMessageText(chatId, msgId, `Error: ${e}`, {
        reply_markup: backToMenuKeyboard(),
      })
      .catch(() => {})
  }
}
