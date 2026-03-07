import type { MyContext } from '@/types/context'
import { backToMenuKeyboard } from '@/bot/keyboards'
import { showMenu } from '@/bot/handlers/menu'
import { getActiveMsgId, setActiveMsgId } from '@/bot/state'
import { parseAmount } from '@/utils/amount'
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

  let msgId = await conversation.external(getActiveMsgId)

  if (msgId) {
    await ctx.api
      .editMessageText(chatId, msgId, promptInitial, {
        reply_markup: backToMenuKeyboard(),
      })
      .catch(() => {
        msgId = undefined
      })
  }

  if (!msgId) {
    const msg = await ctx.reply(promptInitial, {
      reply_markup: backToMenuKeyboard(),
    })

    msgId = msg.message_id
    await conversation.external(() => setActiveMsgId(msgId))
  }

  while (true) {
    const event = await conversation.wait()

    if (event.callbackQuery) {
      await event.answerCallbackQuery()
      await showMenu(ctx.api, chatId, msgId)

      return null
    }

    if (!event.message?.text) {
      continue
    }

    await safeDelete(ctx.api, chatId, event.message.message_id)

    const amount = parseAmount(event.message.text)

    if (amount === null) {
      await ctx.api
        .editMessageText(chatId, msgId, promptRetry, {
          reply_markup: backToMenuKeyboard(),
        })
        .catch(() => {})
      continue
    }

    return {
      amount,
      msgId,
    }
  }
}
