import type {
  FlowContext,
  FlowData,
} from '@/bot/conversations/shared/flowContext'
import { restorePreview } from '../preview'
import { backKeyboard } from '@/bot/keyboards'
import { parseAmount } from '@/utils/amount'
import { waitForTextInput } from '@/bot/conversations/shared/waitForTextInput'

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

  const amount = await waitForTextInput({
    flow,
    parse: parseAmount,
    errorMessage: 'Invalid amount. Try again:',
  })

  if (amount !== null) {
    flow.draft.amount = amount
  }

  await restorePreview(flow)
}
