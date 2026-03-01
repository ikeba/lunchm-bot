import type { FlowContext, FlowData } from '../flowContext'
import { restorePreview } from '../preview'
import { accountKeyboard } from '@/bot/keyboards'
import { AccountCallback, CommonCallback } from '@/bot/constants/callbacks'

export async function pickAccount(
  flow: FlowContext,
  data: FlowData
): Promise<void> {
  await flow.ctx.api.editMessageText(
    flow.chatId,
    flow.msgId,
    'Select account:',
    { reply_markup: accountKeyboard(data.accounts) }
  )

  const cb = await flow.conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel !== CommonCallback.BACK) {
    flow.draft.manualAccountId = Number.parseInt(
      sel.slice(AccountCallback.PREFIX.length),
      10
    )
    flow.draft.accountName = data.accounts.find(
      account => account.id === flow.draft.manualAccountId
    )?.name
  }

  await restorePreview(flow)
}
