import type { FlowContext, FlowData } from '../flowContext'
import { restorePreview } from '../preview'
import { backKeyboard, datePicker } from '@/bot/keyboards'
import { DateCallback } from '@/bot/constants/callbacks'
import { isoDate } from '@/utils/date'

const QUICK_PICKS: Record<string, number> = {
  [DateCallback.YESTERDAY]: -1,
  [DateCallback.TODAY]: 0,
  [DateCallback.TOMORROW]: 1,
}

async function pickDateManual(flow: FlowContext): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    `📅 Enter date (YYYY-MM-DD):\nCurrent: <code>${flow.draft.date}</code>`,
    { parse_mode: 'HTML', reply_markup: backKeyboard() }
  )

  const event = await flow.conversation.wait()

  if (event.callbackQuery) {
    await event.answerCallbackQuery()
  } else if (event.message?.text) {
    const text = event.message.text.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      flow.draft.date = text
    } else {
      await flow.ctx.reply(
        '⚠️ Invalid format, expected YYYY-MM-DD. Date not changed.'
      )
    }
  }

  await restorePreview(flow)
}

export async function pickDate(
  flow: FlowContext,
  _data: FlowData
): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    `📅 Select date:\nCurrent: <code>${flow.draft.date}</code>`,
    { parse_mode: 'HTML', reply_markup: datePicker() }
  )

  const event = await flow.conversation.wait()

  if (!event.callbackQuery) {
    await restorePreview(flow)

    return
  }

  await event.answerCallbackQuery()
  const sel = event.callbackQuery.data ?? ''

  if (sel in QUICK_PICKS) {
    flow.draft.date = isoDate(QUICK_PICKS[sel])
    await restorePreview(flow)
  } else if (sel === DateCallback.MANUAL) {
    await pickDateManual(flow)
  } else {
    await restorePreview(flow)
  }
}
