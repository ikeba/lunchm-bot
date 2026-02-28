import { InlineKeyboard } from 'grammy'
import type {Bot} from 'grammy';
import type { MyContext } from '@/bot/context'
import { handleBalance } from './balance'
import { handleListTransactions } from './listTransactions'

const HELP_TEXT = `<b>Lunch Money Bot 💰</b>

/add — add a new transaction
/transactions — last 50 transactions
/balance — account balances`

const MENU_KEYBOARD = new InlineKeyboard()
  .text('➕ Add transaction', 'menu:add')
  .row()
  .text('📋 Transactions', 'menu:txns')
  .text('💰 Balance', 'menu:balance')

export function registerStartHandlers(bot: Bot<MyContext>): void {
  bot.command(['start', 'help'], async ctx => {
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

  bot.callbackQuery('menu:add', async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.conversation.enter('addTransaction')
  })

  bot.callbackQuery('menu:txns', async ctx => {
    await ctx.answerCallbackQuery()
    await handleListTransactions(ctx)
  })

  bot.callbackQuery('menu:balance', async ctx => {
    await ctx.answerCallbackQuery()
    await handleBalance(ctx)
  })
}
