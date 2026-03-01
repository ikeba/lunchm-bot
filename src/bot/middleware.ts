import type { MiddlewareFn } from 'grammy'
import { config } from '@/config'
import { logger } from '@/core/logger'
import type { MyContext } from './context'

export const authMiddleware: MiddlewareFn<MyContext> = (ctx, next) => {
  if (ctx.from?.id !== config.ALLOWED_USER_ID) {
    return
  }

  return next()
}

// Unix timestamp (seconds) captured at process startup
const BOT_START_TIME = Math.floor(Date.now() / 1000)

/**
 * Drop any update whose message date is older than the bot start time.
 * This prevents processing a backlog of commands that arrived while the bot was offline.
 */
export const skipOldUpdatesMiddleware: MiddlewareFn<MyContext> = (
  ctx,
  next
) => {
  // Callback queries don't have their own timestamp — skip filtering them
  if (ctx.callbackQuery) {
    return next()
  }

  const date =
    ctx.message?.date ??
    ctx.editedMessage?.date ??
    ctx.channelPost?.date ??
    null

  if (date !== null && date < BOT_START_TIME) {
    logger.info(
      `[middleware] Skipping old update (msg_date=${date}, bot_start=${BOT_START_TIME})`
    )

    return
  }

  return next()
}
