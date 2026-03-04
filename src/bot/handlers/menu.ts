import { InlineKeyboard } from 'grammy'
import type { Bot } from 'grammy'
import type { MyContext } from '@/types/context'
import { handleBalance } from './balance'
import { handleListTransactions } from './listTransactions'
import { backgroundRefresh } from '@/core/backgroundRefresh'
import { version } from '../../../package.json'
import { wideText } from '@/utils/text'

const Actions = {
  AddTransaction: 'menu:add-transaction',
  Transfer: 'menu:transfer',
  TransactionsList: 'menu:transactions-list',
  AccountsList: 'menu:accounts-list',
} as const

export const MENU_TEXT = wideText(
  `<b>Lunch Money Bot 💰</b>  <code>v${version}</code>`
)
export const MENU_KEYBOARD = new InlineKeyboard()
  .text('➕ Add transaction', Actions.AddTransaction)
  .text('💸 Transfer', Actions.Transfer)
  .row()
  .text('📋 Transactions', Actions.TransactionsList)
  .text('💰 Accounts', Actions.AccountsList)

export function registerMenu(bot: Bot<MyContext>): void {
  bot.command(['menu', 'start', 'help'], async ctx => {
    await ctx.conversation.exit('addTransaction')
    await ctx.conversation.exit('addTransfer')

    await ctx.reply(MENU_TEXT, {
      parse_mode: 'HTML',
      reply_markup: MENU_KEYBOARD,
    })

    await ctx.deleteMessage().catch(() => {})
    backgroundRefresh()
  })
}

export function registerMenuCallbacks(bot: Bot<MyContext>): void {
  bot.callbackQuery(Actions.AddTransaction, async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.conversation.enter('addTransaction')

    await ctx.deleteMessage().catch(() => {})
  })

  bot.callbackQuery(Actions.Transfer, async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.conversation.enter('addTransfer')

    await ctx.deleteMessage().catch(() => {})
  })

  bot.callbackQuery(Actions.TransactionsList, async ctx => {
    await ctx.answerCallbackQuery()
    await handleListTransactions(ctx)

    await ctx.deleteMessage().catch(() => {})
  })

  bot.callbackQuery(Actions.AccountsList, async ctx => {
    await ctx.answerCallbackQuery()
    await handleBalance(ctx)

    await ctx.deleteMessage().catch(() => {})
  })

  bot.callbackQuery('menu:back', async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(MENU_TEXT, {
      parse_mode: 'HTML',
      reply_markup: MENU_KEYBOARD,
    })
  })
}
