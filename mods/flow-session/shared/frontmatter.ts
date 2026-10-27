/** The `key: value` lines between the 2 `---` lines that open a file, and the text after them. Values keep their quotes. */
export function frontmatter(text: string): { fields: Record<string, string>; body: string } {
  const lines = text.replace(/^﻿/, '').split('\n')
  if (lines[0]?.trim() !== '---') return { fields: {}, body: text }
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (end === -1) return { fields: {}, body: text }
  const fields: Record<string, string> = {}
  for (const line of lines.slice(1, end)) {
    const at = line.indexOf(':')
    if (at > 0) fields[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  return { fields, body: lines.slice(end + 1).join('\n') }
}
