import type { Bot } from 'grammy'
import type { MyContext } from '@/types/context'
import { parseAmount } from '@/utils/amount'
import { safeDelete } from '@/utils/telegram'

let pendingAmount: string | undefined
let enabled = true

export function setQuickInputEnabled(value: boolean): void {
  enabled = value
}

export function getPendingAmount(): string | undefined {
  const amount = pendingAmount

  pendingAmount = undefined

  return amount
}

export function registerQuickInput(bot: Bot<MyContext>): void {
  bot.on('message:text', async ctx => {
    if (!enabled) {
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

    pendingAmount = amount
    await ctx.deleteMessage().catch(() => {})
    await ctx.conversation.enter('addTransaction')
  })
}
