import { PreviewCallback } from '@/bot/constants/callbacks'
import type { FlowContext, FlowData } from './flowContext'
import { restorePreview } from '../addTransaction/preview'
import { pickAccount } from '../addTransaction/steps/pickAccount'
import { pickCategory } from '../addTransaction/steps/pickCategory'
import { pickCurrency } from '../addTransaction/steps/pickCurrency'
import { pickDate } from '../addTransaction/steps/pickDate'
import { pickPayee } from '../addTransaction/steps/pickPayee'
import { pickNotes } from '../addTransaction/steps/pickNotes'
import { editAmount } from '../addTransaction/steps/editAmount'
import { safeDelete } from '@/utils/telegram'

type StepHandler = (flow: FlowContext, data: FlowData) => Promise<void>

const EDIT_STEPS: Record<string, StepHandler> = {
  [PreviewCallback.EDIT_AMOUNT]: editAmount,
  [PreviewCallback.EDIT_ACCOUNT]: pickAccount,
  [PreviewCallback.EDIT_CURRENCY]: pickCurrency,
  [PreviewCallback.EDIT_DATE]: pickDate,
  [PreviewCallback.EDIT_PAYEE]: pickPayee,
  [PreviewCallback.EDIT_NOTE]: pickNotes,
}

export async function waitForEditAction(
  flow: FlowContext,
  data: FlowData
): Promise<string> {
  while (true) {
    const event = await flow.conversation.wait()

    if (event.message) {
      await safeDelete(flow.ctx.api, flow.chatId, event.message.message_id)
      continue
    }

    if (!event.callbackQuery?.data) {
      continue
    }

    await event.answerCallbackQuery()
    const action = event.callbackQuery.data

    if (action === PreviewCallback.EDIT_CATEGORY) {
      const selection = await pickCategory(flow, data)

      if (selection !== null) {
        flow.draft.categoryId = selection.categoryId
        flow.draft.categoryName = selection.categoryName
      }

      await restorePreview(flow)
      continue
    }

    const handler = EDIT_STEPS[action]

    if (handler) {
      await handler(flow, data)
      continue
    }

    return action
  }
}
