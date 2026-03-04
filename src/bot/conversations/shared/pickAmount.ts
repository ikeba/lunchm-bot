import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'
import { MENU_KEYBOARD, MENU_TEXT } from '@/bot/handlers/menu'
import { safeDelete } from '@/utils/telegram'
import type { Conv } from './types'

export interface AmountResult {
  amount: string
  msgId: number
}

interface PickAmountOptions {
  promptInitial?: string
  promptRetry?: string
}

export async function pickAmount(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  options: PickAmountOptions = {}
): Promise<AmountResult | null> {
  const {
    promptInitial = 'Enter amount (e.g. 12.50):',
    promptRetry = 'Invalid amount. Try again:',
  } = options

  const promptMsg = await ctx.reply(promptInitial, {
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
        .editMessageText(chatId, promptMsg.message_id, promptRetry, {
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
