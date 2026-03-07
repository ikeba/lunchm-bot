import { getRecentTransactions } from '@/api/transactions'
import type { Transaction } from '@/api/types/types'
import { formatTransactionList } from '@/utils/formatTransaction'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard, transactionListKeyboard } from '@/bot/keyboards'
import { getActiveMsgId } from '@/bot/state'

function filterTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(
    transaction => Math.abs(Number.parseFloat(transaction.amount)) >= 0.01
  )
}

export async function handleListTransactions(ctx: MyContext): Promise<void> {
  const chatId = ctx.chat!.id
  const msgId = getActiveMsgId()!

  await ctx.api
    .editMessageText(chatId, msgId, 'Fetching recent transactions...')
    .catch(() => {})

  try {
    const transactions = await getRecentTransactions()
    const filtered = filterTransactions(transactions)
    const keyboard =
      filtered.length > 0
        ? transactionListKeyboard(filtered)
        : backToMenuKeyboard()

    await ctx.api.editMessageText(
      chatId,
      msgId,
      formatTransactionList(transactions),
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
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
