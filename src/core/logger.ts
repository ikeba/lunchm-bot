import { mkdir } from 'node:fs/promises'
import { config } from '@/config'

const LEVELS = { error: 0, warn: 1, info: 2 } as const

type Level = keyof typeof LEVELS

const configured: Level = (config.LOG_LEVEL as Level) ?? 'info'

function shouldLog(level: Level): boolean {
  return LEVELS[level] <= LEVELS[configured]
}

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function logDay(): string {
  return new Date().toISOString().slice(0, 10)
}

async function writeToFile(line: string): Promise<void> {
  const dir = 'logs'

  await mkdir(dir, { recursive: true })
  await Bun.write(
    Bun.file(`${dir}/${logDay()}.log`),
    // append by reading existing + adding new line
    `${await readExisting(`${dir}/${logDay()}.log`)}${line}\n`
  )
}

async function readExisting(path: string): Promise<string> {
  const file = Bun.file(path)

  return (await file.exists()) ? file.text() : ''
}

function format(level: Level, message: string, extra?: unknown): string {
  const suffix =
    extra !== undefined
      ? ` | ${extra instanceof Error ? (extra.stack ?? extra.message) : JSON.stringify(extra)}`
      : ''

  return `[${timestamp()}] [${level.toUpperCase()}] ${message}${suffix}`
}

export const logger = {
  info(message: string, extra?: unknown): void {
    if (!shouldLog('info')) {
      return
    }

    const line = format('info', message, extra)

    console.log(line)
    writeToFile(line).catch(console.error)
  },

  warn(message: string, extra?: unknown): void {
    if (!shouldLog('warn')) {
      return
    }

    const line = format('warn', message, extra)

    console.warn(line)
    writeToFile(line).catch(console.error)
  },

  error(message: string, extra?: unknown): void {
    // errors always log regardless of level
    const line = format('error', message, extra)

    console.error(line)
    writeToFile(line).catch(console.error)
  },
}
