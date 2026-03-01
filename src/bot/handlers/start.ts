import { InlineKeyboard } from 'grammy'
import type { Bot } from 'grammy'
import { Command } from '@/bot/commands'
import type { MyContext } from '@/bot/context'
import { handleBalance } from './balance'
import { handleListTransactions } from './listTransactions'

const CallbackAction = {
  MenuAdd: 'menu:add',
  MenuTransactions: 'menu:transactions',
  MenuBalance: 'menu:balance',
} as const

const HELP_TEXT = `<b>Lunch Money Bot 💰</b>`

const MENU_KEYBOARD = new InlineKeyboard()
  .text('➕ Add transaction', CallbackAction.MenuAdd)
  .row()
  .text('📋 Transactions', CallbackAction.MenuTransactions)
  .text('💰 Balance', CallbackAction.MenuBalance)

export function registerStartHandlers(bot: Bot<MyContext>): void {
  bot.command([Command.Menu, 'start', 'help'], async ctx => {
    // Ensure the menu button is visible in this chat
    await ctx.api
      .setChatMenuButton({
        chat_id: ctx.chat.id,
        menu_button: { type: 'commands' },
      })
      .catch(() => {})
    await ctx.reply(HELP_TEXT, {
      parse_mode: 'HTML',
      reply_markup: MENU_KEYBOARD,
    })
  })

  bot.callbackQuery(CallbackAction.MenuAdd, async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.conversation.enter('addTransaction')
  })

  bot.callbackQuery(CallbackAction.MenuTransactions, async ctx => {
    await ctx.answerCallbackQuery()
    await handleListTransactions(ctx)
  })

  bot.callbackQuery(CallbackAction.MenuBalance, async ctx => {
    await ctx.answerCallbackQuery()
    await handleBalance(ctx)
  })
}
