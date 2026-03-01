import type { Conversation } from '@grammyjs/conversations'
import { getAccounts } from '@/api/accounts'
import { getCategories } from '@/api/categories'
import { getCurrencies } from '@/api/currencies'
import { createTransaction, deleteTransaction } from '@/api/transactions'
import type { Account, Category } from '@/api/types'
import type { MyContext } from '@/bot/context'
import {
  accountKeyboard,
  afterSaveKeyboard,
  backKeyboard,
  categoryKeyboard,
  currencyKeyboard,
  datePicker,
  previewKeyboard,
} from '@/bot/keyboards'
import { getLastUsed, setLastUsed } from '@/bot/userState'
import { logger } from '@/core/logger'
import { isoDate } from '@/utils/date'

interface TransactionDraft {
  amount: string
  currency: string
  manualAccountId?: number
  accountName?: string
  categoryId?: number
  categoryName?: string
  date: string
  payee?: string
  notes?: string
}

type Conv = Conversation<MyContext, MyContext>

function renderPreview(draft: TransactionDraft): string {
  const lines = [
    '<b>New transaction</b>',
    '',
    `💰 Amount: <b>${draft.amount} ${draft.currency.toUpperCase()}</b>`,
    `🏦 Account: ${draft.accountName ?? '—'}`,
    `🏷 Category: ${draft.categoryName ?? '—'}`,
    `📅 Date: ${draft.date}`,
  ]

  if (draft.payee) {
    lines.push(`👤 Payee: ${draft.payee}`)
  }

  if (draft.notes) {
    lines.push(`📝 Note: ${draft.notes}`)
  }

  return lines.join('\n')
}

async function restorePreview(
  ctx: MyContext,
  chatId: number,
  msgId: number,
  draft: TransactionDraft
): Promise<void> {
  await ctx.api.editMessageText(chatId, msgId, renderPreview(draft), {
    parse_mode: 'HTML',
    reply_markup: previewKeyboard(),
  })
}

async function pickAccount(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  msgId: number,
  draft: TransactionDraft,
  accounts: Account[]
): Promise<void> {
  await ctx.api.editMessageText(chatId, msgId, 'Select account:', {
    reply_markup: accountKeyboard(accounts),
  })

  const cb = await conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel === 'account:skip') {
    draft.manualAccountId = undefined
    draft.accountName = undefined
  } else if (sel !== 'back') {
    draft.manualAccountId = Number.parseInt(sel.replace('account:', ''), 10)
    draft.accountName = accounts.find(a => a.id === draft.manualAccountId)?.name
  }

  await restorePreview(ctx, chatId, msgId, draft)
}

async function pickCategory(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  msgId: number,
  draft: TransactionDraft,
  categories: Category[]
): Promise<void> {
  await ctx.api.editMessageText(chatId, msgId, 'Select category:', {
    reply_markup: categoryKeyboard(categories),
  })

  const cb = await conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel === 'category:skip') {
    draft.categoryId = undefined
    draft.categoryName = undefined
  } else if (sel !== 'back') {
    draft.categoryId = Number.parseInt(sel.replace('category:', ''), 10)
    draft.categoryName = categories.find(c => c.id === draft.categoryId)?.name
  }

  await restorePreview(ctx, chatId, msgId, draft)
}

async function pickCurrency(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  msgId: number,
  draft: TransactionDraft,
  currencies: string[]
): Promise<void> {
  await ctx.api.editMessageText(chatId, msgId, '💱 Select currency:', {
    reply_markup: currencyKeyboard(currencies, draft.currency),
  })

  const cb = await conversation.waitFor('callback_query:data')

  await cb.answerCallbackQuery()
  const sel = cb.callbackQuery.data

  if (sel !== 'back') {
    draft.currency = sel.replace('currency:', '')
  }

  await restorePreview(ctx, chatId, msgId, draft)
}

async function pickDateManual(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  msgId: number,
  draft: TransactionDraft
): Promise<void> {
  await ctx.api.editMessageText(
    chatId,
    msgId,
    `📅 Enter date (YYYY-MM-DD):\nCurrent: <code>${draft.date}</code>`,
    { parse_mode: 'HTML', reply_markup: backKeyboard() }
  )

  const event = await conversation.wait()

  if (event.callbackQuery) {
    await event.answerCallbackQuery()
    // 'back' — no change
  } else if (event.message?.text) {
    const t = event.message.text.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      draft.date = t
    } else {
      await ctx.reply(
        '⚠️ Invalid format, expected YYYY-MM-DD. Date not changed.'
      )
    }
  }

  await restorePreview(ctx, chatId, msgId, draft)
}

async function pickDate(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  msgId: number,
  draft: TransactionDraft
): Promise<void> {
  await ctx.api.editMessageText(
    chatId,
    msgId,
    `📅 Select date:\nCurrent: <code>${draft.date}</code>`,
    { parse_mode: 'HTML', reply_markup: datePicker() }
  )

  const event = await conversation.wait()

  if (!event.callbackQuery) {
    await restorePreview(ctx, chatId, msgId, draft)

    return
  }

  await event.answerCallbackQuery()
  const sel = event.callbackQuery.data ?? ''

  const quickPicks: Record<string, number> = {
    'date:yesterday': -1,
    'date:today': 0,
    'date:tomorrow': 1,
  }

  if (sel in quickPicks) {
    draft.date = isoDate(quickPicks[sel])
    await restorePreview(ctx, chatId, msgId, draft)
  } else if (sel === 'date:manual') {
    await pickDateManual(conversation, ctx, chatId, msgId, draft)
  } else {
    // 'back' — no change
    await restorePreview(ctx, chatId, msgId, draft)
  }
}

async function pickTextField(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  msgId: number,
  prompt: string,
  draft: TransactionDraft,
  field: 'payee' | 'notes'
): Promise<void> {
  await ctx.api.editMessageText(chatId, msgId, prompt, {
    reply_markup: backKeyboard(),
  })

  const event = await conversation.wait()

  if (event.callbackQuery) {
    await event.answerCallbackQuery()
    // 'back' — no change
  } else if (event.message?.text) {
    const t = event.message.text.trim()

    draft[field] = t === '/skip' ? undefined : t
  }

  await restorePreview(ctx, chatId, msgId, draft)
}

// Save helper — returns created transaction id, or null on error

async function saveTransaction(
  conversation: Conv,
  ctx: MyContext,
  chatId: number,
  msgId: number,
  draft: TransactionDraft
): Promise<number | null> {
  try {
    const created = await conversation.external(() =>
      createTransaction({
        date: draft.date,
        amount: draft.amount,
        currency: draft.currency,
        payee: draft.payee,
        notes: draft.notes,
        category_id: draft.categoryId,
        manual_account_id: draft.manualAccountId,
      })
    )

    await conversation.external(() =>
      setLastUsed({
        currency: draft.currency,
        manualAccountId: draft.manualAccountId,
        accountName: draft.accountName,
        categoryId: draft.categoryId,
        categoryName: draft.categoryName,
      })
    )

    await ctx.api.editMessageText(chatId, msgId, 'Saved ✅', {
      reply_markup: afterSaveKeyboard(created.id),
    })

    return created.id
  } catch (e) {
    logger.error('[addTransaction] createTransaction failed', e)
    await ctx.api.editMessageText(
      chatId,
      msgId,
      `${renderPreview(draft)}\n\n❌ Error: ${e instanceof Error ? e.message : String(e)}`,
      { parse_mode: 'HTML', reply_markup: previewKeyboard() }
    )

    return null
  }
}

// Main conversation

export async function addTransaction(
  conversation: Conv,
  ctx: MyContext
): Promise<void> {
  const [currencies, accounts, categories] = await conversation.external(() =>
    Promise.all([getCurrencies(), getAccounts(), getCategories()])
  )

  const chatId = ctx.chat!.id
  let useLastUsed = true

  // Outer loop — repeats for "Add similar" / "Add new"
  while (true) {
    // Step 1: ask for amount
    await ctx.reply('Enter amount (e.g. 12.50):')

    const amountCtx = await conversation.waitFor('message:text')
    const raw = amountCtx.message.text.trim().replace(',', '.')

    if (Number.isNaN(Number.parseFloat(raw))) {
      await ctx.reply('Invalid amount. Start over with /add')

      return
    }

    const amount = Number.parseFloat(raw).toFixed(2)

    // Step 2: build draft from defaults
    const lastUsed = useLastUsed ? await conversation.external(getLastUsed) : {}
    const draft: TransactionDraft = {
      amount,
      currency: lastUsed.currency ?? currencies[0] ?? 'usd',
      manualAccountId: lastUsed.manualAccountId,
      accountName: lastUsed.accountName,
      categoryId: lastUsed.categoryId,
      categoryName: lastUsed.categoryName,
      date: isoDate(),
      payee: undefined,
      notes: undefined,
    }

    // Step 3: show preview card
    const previewMsg = await ctx.reply(renderPreview(draft), {
      parse_mode: 'HTML',
      reply_markup: previewKeyboard(),
    })
    const msgId = previewMsg.message_id

    // Step 4: edit loop
    let confirmed = false

    while (!confirmed) {
      const cb = await conversation.waitFor('callback_query:data')

      await cb.answerCallbackQuery()
      const action = cb.callbackQuery.data

      switch (action) {
        case 'confirm':
          confirmed = true
          break

        case 'cancel':
          await ctx.api.deleteMessage(chatId, msgId)

          return

        case 'edit:account':
          await pickAccount(conversation, ctx, chatId, msgId, draft, accounts)
          break

        case 'edit:category':
          await pickCategory(
            conversation,
            ctx,
            chatId,
            msgId,
            draft,
            categories
          )
          break

        case 'edit:currency':
          await pickCurrency(
            conversation,
            ctx,
            chatId,
            msgId,
            draft,
            currencies
          )
          break

        case 'edit:date':
          await pickDate(conversation, ctx, chatId, msgId, draft)
          break

        case 'edit:payee':
          await pickTextField(
            conversation,
            ctx,
            chatId,
            msgId,
            'Enter payee (or /skip to clear):',
            draft,
            'payee'
          )
          break

        case 'edit:note':
          await pickTextField(
            conversation,
            ctx,
            chatId,
            msgId,
            'Enter note (or /skip to clear):',
            draft,
            'notes'
          )
          break
      }
    }

    // Step 5: save
    const createdId = await saveTransaction(
      conversation,
      ctx,
      chatId,
      msgId,
      draft
    )

    if (createdId === null) {
      return
    }

    // Step 6: post-save action
    const postSave = await conversation.waitFor('callback_query:data')

    await postSave.answerCallbackQuery()
    const postAction = postSave.callbackQuery.data

    if (postAction === `undo:${createdId}`) {
      try {
        await conversation.external(() => deleteTransaction(createdId))
        await ctx.api.editMessageText(chatId, msgId, 'Undone.')
      } catch (e) {
        logger.error('[addTransaction] deleteTransaction failed', e)
        await ctx.api.editMessageText(
          chatId,
          msgId,
          `Saved ✅\n\n❌ Undo failed: ${e instanceof Error ? e.message : String(e)}`
        )
      }

      return
    }

    if (postAction === 'add_similar') {
      useLastUsed = true
      continue
    }

    if (postAction === 'add_new') {
      useLastUsed = false
      continue
    }

    return
  }
}
