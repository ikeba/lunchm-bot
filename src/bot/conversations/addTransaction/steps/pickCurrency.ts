import type { FlowContext, FlowData } from '../flowContext'
import { restorePreview } from '../preview'
import { currencyKeyboard } from '@/bot/keyboards'
import { CommonCallback, CurrencyCallback } from '@/bot/constants/callbacks'
import { wideText } from '@/utils/text'

export async function pickCurrency(
  flow: FlowContext,
  data: FlowData
): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    wideText('💱 Select currency:'),
    { reply_markup: currencyKeyboard(data.currencies, flow.draft.currency) }
  )

  const cb = await flow.conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel !== CommonCallback.BACK) {
    flow.draft.currency = sel.slice(CurrencyCallback.PREFIX.length)
  }

  await restorePreview(flow)
}
