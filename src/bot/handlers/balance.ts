import { getAccounts } from '@/api/accounts'
import { formatAccountList } from '@/utils/formatAccount'
import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'
import { getActiveMsgId } from '@/bot/state'

export async function handleBalance(ctx: MyContext): Promise<void> {
  const chatId = ctx.chat!.id
  const msgId = getActiveMsgId()!

  await ctx.api
    .editMessageText(chatId, msgId, 'Fetching accounts...')
    .catch(() => {})

  try {
    const accounts = await getAccounts()

    await ctx.api.editMessageText(chatId, msgId, formatAccountList(accounts), {
      parse_mode: 'HTML',
      reply_markup: backToMenuKeyboard(),
    })
  } catch (e) {
    await ctx.api
      .editMessageText(chatId, msgId, `Error: ${e}`, {
        reply_markup: backToMenuKeyboard(),
      })
      .catch(() => {})
  }
}
