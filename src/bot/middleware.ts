import type { MiddlewareFn } from 'grammy'
import { config } from '@/config'
import type { MyContext } from './context'

export const authMiddleware: MiddlewareFn<MyContext> = (ctx, next) => {
  if (ctx.from?.id !== config.ALLOWED_USER_ID) {
    return
  }

  return next()
}
