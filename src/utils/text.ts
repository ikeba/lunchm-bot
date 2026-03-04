const WIDE_PAD = '\u2800'.repeat(32)

export function wideText(text: string): string {
  return `${text}\n${WIDE_PAD}`
}
