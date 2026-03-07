import type { FlowContext } from './flowContext'
import { backKeyboard } from '@/bot/keyboards'
import { safeDelete } from '@/utils/telegram'

interface WaitForTextOptions<T> {
  flow: FlowContext
  parse: (text: string) => T | null
  errorMessage: string
  errorParseMode?: 'HTML'
}

export async function waitForTextInput<T>({
  flow,
  parse,
  errorMessage,
  errorParseMode,
}: WaitForTextOptions<T>): Promise<T | null> {
  while (true) {
    const event = await flow.conversation.wait()

    if (event.callbackQuery) {
      await event.answerCallbackQuery()

      return null
    }

    if (!event.message?.text) {
      continue
    }

    await safeDelete(flow.ctx.api, flow.chatId, event.message.message_id)

    const result = parse(event.message.text)

    if (result !== null) {
      return result
    }

    await flow.ctx.api
      .editMessageText(flow.chatId, flow.msgId, errorMessage, {
        parse_mode: errorParseMode,
        reply_markup: backKeyboard(),
      })
      .catch(() => {})
  }
}
