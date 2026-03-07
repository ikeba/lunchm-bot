import type { Bot } from 'grammy'
import type { MyContext } from '@/types/context'
import { parseAmount } from '@/utils/amount'
import { safeDelete } from '@/utils/telegram'
import { setPendingAmount, isQuickInputEnabled } from '@/bot/state'

export function registerQuickInput(bot: Bot<MyContext>): void {
  bot.on('message:text', async ctx => {
    if (!isQuickInputEnabled()) {
      return
    }

    const raw = ctx.message.text
    const amount = parseAmount(raw)

    if (amount === null) {
      if (/\d/.test(raw)) {
        const hint = await ctx.reply('Send just a number, e.g. 12.50')

        setTimeout(
          () => safeDelete(ctx.api, ctx.chat!.id, hint.message_id),
          3000
        )
      }

      return
    }

    setPendingAmount(amount)
    await ctx.deleteMessage().catch(() => {})
    await ctx.conversation.enter('addTransaction')
  })
}
