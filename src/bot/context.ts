import type { ConversationFlavor } from '@grammyjs/conversations'
import type { Context } from 'grammy'

// MyContext = grammy Context + conversations plugin
export type MyContext = Context & ConversationFlavor<Context>
