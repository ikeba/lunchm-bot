import type { Api } from 'grammy'

export async function safeDelete(
  api: Api,
  chatId: number,
  messageId: number
): Promise<void> {
  await api.deleteMessage(chatId, messageId).catch(() => {})
}
