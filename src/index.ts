import { conversations, createConversation } from '@grammyjs/conversations'
import { Bot } from 'grammy'
import process from 'node:process'
import type { MyContext } from './types/context'
import { addTransaction } from './bot/conversations/addTransaction'
import { setupCommands } from './bot/handlers/commands'
import { registerMenu, registerMenuCallbacks } from './bot/handlers/menu'
import { registerLogsCommand } from './bot/handlers/logs'
import { authMiddleware, skipOldUpdatesMiddleware } from './bot/middleware'
import { config } from './config'
import { logger } from './core/logger'
import { backgroundRefresh } from './core/backgroundRefresh'
import { invalidateCache, CACHE_KEYS } from './core/cache'

const bot = new Bot<MyContext>(config.TELEGRAM_BOT_TOKEN)

bot.use(skipOldUpdatesMiddleware)
bot.use(authMiddleware)

bot.use((ctx, next) => {
  if (ctx.message?.text?.startsWith('/')) {
    logger.info(`[cmd] ${ctx.message.text}`)
  }

  return next()
})

bot.use(conversations())

// /menu, /start, /help must run before createConversation to exit active conversations
registerMenu(bot)
registerLogsCommand(bot)
bot.use(createConversation(addTransaction))
registerMenuCallbacks(bot)

bot.catch(err => {
  logger.error('[bot] Unhandled error', {
    message: err.message,
    update: err.ctx?.update,
  })
})

const stopBot = () => bot.stop()

process.once('SIGINT', stopBot)
process.once('SIGTERM', stopBot)

bot.start({
  onStart: async info => {
    logger.info(`[ok] Bot @${info.username} is running`)

    await setupCommands(bot.api).catch(e =>
      logger.warn('[startup] setupCommands failed', e)
    )

    invalidateCache(...Object.values(CACHE_KEYS))
    backgroundRefresh()
  },
})
