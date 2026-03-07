import type { FlowContext, FlowData } from '../flowContext'
import { restorePreview } from '../preview'
import { backKeyboard, datePicker } from '@/bot/keyboards'
import { DateCallback } from '@/bot/constants/callbacks'
import { isoDate, parseFlexibleDate } from '@/utils/date'
import { wideText } from '@/utils/text'
import { waitForTextInput } from '../../shared/waitForTextInput'

const QUICK_PICKS: Record<string, number> = {
  [DateCallback.YESTERDAY]: -1,
  [DateCallback.TODAY]: 0,
  [DateCallback.TOMORROW]: 1,
}

const MANUAL_PROMPT = '📅 Enter date (e.g. 15, 25.03, 2026-03-07):'

async function pickDateManual(flow: FlowContext): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    wideText(`${MANUAL_PROMPT}\nCurrent: <code>${flow.draft.date}</code>`),
    { parse_mode: 'HTML', reply_markup: backKeyboard() }
  )

  const parsed = await waitForTextInput({
    flow,
    parse: parseFlexibleDate,
    errorMessage: wideText(
      `⚠️ Invalid date. Try again.\n${MANUAL_PROMPT}\nCurrent: <code>${flow.draft.date}</code>`
    ),
    errorParseMode: 'HTML',
  })

  if (parsed !== null) {
    flow.draft.date = parsed
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
    wideText(`📅 Select date:\nCurrent: <code>${flow.draft.date}</code>`),
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
