const WIDE_PAD = '\u2800'.repeat(32)

export function wideText(text: string): string {
  return `${text}\n${WIDE_PAD}`
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
