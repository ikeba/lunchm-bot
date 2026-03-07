import { getRecentTransactions } from '@/api/transactions'
import { formatTransactionList } from '@/utils/formatTransaction'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard, transactionListKeyboard } from '@/bot/keyboards'
import { getActiveMsgId } from '@/bot/state'

export async function handleListTransactions(ctx: MyContext): Promise<void> {
  const chatId = ctx.chat!.id
  const msgId = getActiveMsgId()!

  await ctx.api
    .editMessageText(chatId, msgId, 'Fetching recent transactions...')
    .catch(() => {})

  try {
    const transactions = await getRecentTransactions()
    const { text, sorted } = formatTransactionList(transactions)
    const keyboard =
      sorted.length > 0 ? transactionListKeyboard(sorted) : backToMenuKeyboard()

    await ctx.api.editMessageText(chatId, msgId, text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    })
  } catch (e) {
    await ctx.api
      .editMessageText(chatId, msgId, `Error: ${e}`, {
        reply_markup: backToMenuKeyboard(),
      })
      .catch(() => {})
  }
}
