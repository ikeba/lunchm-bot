import type {
  FlowContext,
  TransactionDraft,
} from '@/bot/conversations/shared/flowContext'
import { restorePreview } from '../preview'
import { backKeyboard } from '@/bot/keyboards'
import { safeDelete } from '@/utils/telegram'

type TextField = Extract<keyof TransactionDraft, 'payee' | 'notes'>

export async function pickTextInput(
  flow: FlowContext,
  prompt: string,
  field: TextField
): Promise<void> {
  await flow.ctx.api.editMessageText(flow.chatId, flow.msgId, prompt, {
    reply_markup: backKeyboard(),
  })

  const event = await flow.conversation.wait()

  if (event.callbackQuery) {
    await event.answerCallbackQuery()
  } else if (event.message?.text) {
    const text = event.message.text.trim()

    flow.draft[field] = text === '/skip' ? undefined : text

    await safeDelete(flow.ctx.api, flow.chatId, event.message.message_id)
  }

  await restorePreview(flow)
}
