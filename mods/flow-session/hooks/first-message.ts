/**
 * first-message.ts: the messages a restarted session starts from.
 *
 * The agent's note alone loses what the user never saw, so the new conversation keeps the last
 * exchange word for word: the agent's last reply, the user's messages since it, and the files
 * changed since. The mod holds those itself, never the old agent's memory of them.
 */
import { kilo } from './wrap-up'

export type Exchange = {
  /** The context size at the restart, in tokens. */
  size: number
  /** The agent's last finished reply, which the user has seen. */
  reply?: string
  /** The user's own messages since that reply, oldest first. They are unanswered. */
  asked: readonly string[]
  /** Files an edit tool touched since that reply. */
  changed: readonly string[]
}

export type Built = { role: 'user' | 'assistant'; text: string; toolUses: [] }

const MAX_FILES = 30

const user = (text: string): Built => ({ role: 'user', text, toolUses: [] })

const files = (paths: readonly string[]) =>
  paths.slice(0, MAX_FILES).join(', ') + (paths.length > MAX_FILES ? ` +${paths.length - MAX_FILES} more` : '')

/** What the new agent does first. A typed restart runs nothing: the user writes next. */
function ending(last: Exchange, manual: boolean): string {
  if (manual) return 'Nothing runs now. The user writes next.'
  if (!last.asked.length) return 'Continue from the note.'
  return 'The user has seen nothing since that reply. Do what Left lists, then answer every point of their messages in one reply.'
}

/** The conversation after a restart, oldest first: the note, the last reply, then the user's unanswered messages. */
export function restartMessages(note: string, last: Exchange, manual: boolean): Built[] {
  const parts = [
    `Restarted at ${kilo(last.size)}. Older turns are gone. Below: the agent's note${last.reply ? ', its last reply (the user saw it)' : ''}${last.asked.length ? ', the user\'s messages since, unanswered' : ''}.`,
    last.changed.length ? `Changed since that reply: ${files(last.changed)}.` : '',
    `Note:\n${note}`,
    ending(last, manual),
  ]
  const head = user(parts.filter(Boolean).join('\n\n'))
  const reply = last.reply ? [{ role: 'assistant', text: last.reply, toolUses: [] } satisfies Built] : []
  return [head, ...reply, ...last.asked.map(user)]
}
