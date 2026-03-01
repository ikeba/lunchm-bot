import { conversations, createConversation } from '@grammyjs/conversations'
import { Bot } from 'grammy'
import { getCategories } from './api/categories'
import { getCurrencies } from './api/currencies'
import type { MyContext } from './bot/context'
import { addTransaction } from './bot/conversations/addTransaction'
import { registerBalanceHandler } from './bot/handlers/balance'
import { registerListTransactionsHandler } from './bot/handlers/listTransactions'
import { registerStartHandlers } from './bot/handlers/start'
import { authMiddleware, skipOldUpdatesMiddleware } from './bot/middleware'
import { Command } from './bot/commands'
import { config } from './config'
import { logger } from './core/logger'

const bot = new Bot<MyContext>(config.TELEGRAM_BOT_TOKEN)

// Skip backlog of updates that arrived while the bot was offline
bot.use(skipOldUpdatesMiddleware)

// Auth — must be first
bot.use(authMiddleware)

// Log incoming commands
bot.use((ctx, next) => {
  if (ctx.message?.text?.startsWith('/')) {
    logger.info(`[cmd] ${ctx.message.text}`)
  }

  return next()
})

// Conversations v2 manages session state internally
bot.use(conversations())
bot.use(createConversation(addTransaction))

// Handlers
registerStartHandlers(bot)
registerListTransactionsHandler(bot)
registerBalanceHandler(bot)

// /add — enters the conversation
bot.command(Command.Add, ctx => ctx.conversation.enter('addTransaction'))

bot.catch(err => {
  logger.error('[bot] Unhandled error', {
    message: err.message,
    update: err.ctx?.update,
  })
})

bot.start({
  onStart: async info => {
    logger.info(`[ok] Bot @${info.username} is running`)

    await bot.api
      .setMyCommands([
        { command: Command.Add, description: 'Add a new transaction' },
        { command: Command.Transactions, description: 'Last 50 transactions' },
        { command: Command.Balance, description: 'Account balances' },
        { command: Command.Menu, description: 'Show menu' },
      ])
      .catch(e => logger.warn('[startup] setMyCommands failed', e))

    await bot.api
      .setChatMenuButton({
        menu_button: { type: 'commands' },
      })
      .catch(e => logger.warn('[startup] setChatMenuButton failed', e))

    // Pre-warm cache so first commands have no latency
    await Promise.all([getCurrencies(), getCategories()]).catch(e =>
      logger.warn('[startup] Cache warm-up failed', e)
    )
    logger.info('[startup] Cache warm-up done')
  },
})
