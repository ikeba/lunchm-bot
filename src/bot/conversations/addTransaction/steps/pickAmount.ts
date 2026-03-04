import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'
import { MENU_KEYBOARD, MENU_TEXT } from '@/bot/handlers/menu'
import type { Conv } from '../flowContext'
import { safeDelete } from '@/utils/telegram'

const PROMPT_INITIAL = 'Enter amount (e.g. 12.50):'
const PROMPT_RETRY = 'Invalid amount. Try again:'

export interface AmountResult {
  amount: string
  msgId: number
}

export async function pickAmount(
  conversation: Conv,
  ctx: MyContext,
  chatId: number
): Promise<AmountResult | null> {
  const promptMsg = await ctx.reply(PROMPT_INITIAL, {
    reply_markup: backToMenuKeyboard(),
  })

  while (true) {
    const event = await conversation.wait()

    if (event.callbackQuery) {
      await event.answerCallbackQuery()
      await ctx.api.editMessageText(chatId, promptMsg.message_id, MENU_TEXT, {
        parse_mode: 'HTML',
        reply_markup: MENU_KEYBOARD,
      })

      return null
    }

    if (!event.message?.text) {
      continue
    }

    const raw = event.message.text.trim().replace(',', '.')

    await safeDelete(ctx.api, chatId, event.message.message_id)

    if (Number.isNaN(Number.parseFloat(raw))) {
      await ctx.api
        .editMessageText(chatId, promptMsg.message_id, PROMPT_RETRY, {
          reply_markup: backToMenuKeyboard(),
        })
        .catch(() => {})
      continue
    }

    return {
      amount: Number.parseFloat(raw).toFixed(2),
      msgId: promptMsg.message_id,
    }
  }
}
