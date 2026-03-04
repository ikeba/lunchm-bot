import type { Bot } from 'grammy'
import type { MyContext } from '@/types/context'
import { escapeHtml } from '@/utils/text'

const LOG_DIR = 'data/logs'
const LINES = 50

function logDay(): string {
  return new Date().toISOString().slice(0, 10)
}

async function readLastLines(path: string, count: number): Promise<string> {
  const file = Bun.file(path)

  if (!(await file.exists())) {
    return ''
  }

  const text = await file.text()
  const lines = text.trimEnd().split('\n')

  return lines.slice(-count).join('\n')
}

export function registerLogsCommand(bot: Bot<MyContext>): void {
  bot.command('logs', async ctx => {
    const path = `${LOG_DIR}/${logDay()}.log`
    const tail = await readLastLines(path, LINES)

    if (!tail) {
      await ctx.reply('No logs for today yet.')

      return
    }

    const escaped = escapeHtml(tail)

    await ctx.reply(`<pre>${escaped}</pre>`, { parse_mode: 'HTML' })
  })
}
