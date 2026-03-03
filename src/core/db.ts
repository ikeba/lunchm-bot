import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'

mkdirSync('data', { recursive: true })
const db = new Database('data/bot.db')

db.run(`CREATE TABLE IF NOT EXISTS prefs (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`)

db.run(`CREATE TABLE IF NOT EXISTS cache (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
)`)

export type PrefKey =
  | 'last_used.currency'
  | 'last_used.account_id'
  | 'last_used.account_name'
  | 'last_used.category_id'
  | 'last_used.category_name'

export function getPref(key: PrefKey): string | null {
  const row = db
    .query<{ value: string }, [string]>('SELECT value FROM prefs WHERE key = ?')
    .get(key)

  return row?.value ?? null
}

export function setPref(key: PrefKey, value: string): void {
  db.run('INSERT OR REPLACE INTO prefs (key, value) VALUES (?, ?)', [
    key,
    value,
  ])
}

export function deletePref(key: PrefKey): void {
  db.run('DELETE FROM prefs WHERE key = ?', [key])
}

export function getCacheEntry(
  key: string
): { value: string; fetchedAt: number } | null {
  const row = db
    .query<
      { value: string; fetched_at: number },
      [string]
    >('SELECT value, fetched_at FROM cache WHERE key = ?')
    .get(key)

  if (!row) {
    return null
  }

  return { value: row.value, fetchedAt: row.fetched_at }
}

export function setCacheEntry(key: string, value: string): void {
  db.run(
    'INSERT OR REPLACE INTO cache (key, value, fetched_at) VALUES (?, ?, ?)',
    [key, value, Date.now()]
  )
}
