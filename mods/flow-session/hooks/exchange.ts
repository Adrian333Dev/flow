/**
 * exchange.ts: what a restart keeps of the old conversation, and what the new first message says.
 */
import type { SessionMessage } from 'claude-code'

/**
 * The last prompt the user typed and the replies after it that are plain text.
 *
 * Tool blocks are dropped. The restart tool ends its own turn, which can leave
 * a `tool_use` with no result, and the API refuses a conversation holding one.
 */
export function lastExchange(messages: readonly SessionMessage[]): SessionMessage[] {
  let start = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m?.role === 'user' && m.text !== '' && !m.toolResults?.length) {
      start = i
      break
    }
  }
  if (start < 0) return []
  return messages.slice(start).filter((m) =>
    m.role === 'user' ? !m.toolResults?.length : m.toolUses.length === 0 && m.text !== '',
  )
}

/** The one message the new conversation starts from: the note, then each ticket in flight. */
export function firstMessage(note: string, tickets: readonly string[]): string {
  const parts = [
    'This session restarted at the context limit. The note below is what the last stretch of work left for this one.',
    note,
  ]
  if (tickets.length) parts.push('The tickets in flight, as they stand now:', ...tickets)
  return parts.join('\n\n')
}
