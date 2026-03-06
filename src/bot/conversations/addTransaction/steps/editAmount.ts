import type { FlowContext, FlowData } from '../flowContext'
import { restorePreview } from '../preview'
import { backKeyboard } from '@/bot/keyboards'
import { parseAmount } from '@/utils/amount'
import { safeDelete } from '@/utils/telegram'

export async function editAmount(
  flow: FlowContext,
  _data: FlowData
): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    `Current: ${flow.draft.amount} ${flow.draft.currency.toUpperCase()}\nEnter new amount:`,
    { reply_markup: backKeyboard() }
  )

  while (true) {
    const event = await flow.conversation.wait()

    if (event.callbackQuery) {
      await event.answerCallbackQuery()
      break
    }

    if (!event.message?.text) {
      continue
    }

    await safeDelete(flow.ctx.api, flow.chatId, event.message.message_id)

    const amount = parseAmount(event.message.text)

    if (amount === null) {
      await flow.ctx.api
        .editMessageText(
          flow.chatId,
          flow.msgId,
          'Invalid amount. Try again:',
          { reply_markup: backKeyboard() }
        )
        .catch(() => {})
      continue
    }

    flow.draft.amount = amount
    break
  }

  await restorePreview(flow)
}
