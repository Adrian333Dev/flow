/**
 * first-message.ts: the messages a restarted session starts from.
 *
 * The agent's note alone loses what the user never saw, so the new conversation keeps the last
 * exchange word for word: the agent's last reply, the user's messages since it, and the files
 * changed since. The mod supplies those itself, never the old agent's memory of them: the reply
 * is read from the conversation, the rest is held in host state.
 */
import type { SessionMessage } from 'claude-code'
import type { Tracked } from '../types'
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

/** What is tracked once a main turn ends with `answer`: the user's messages and the changed files are answered. A restart's closing line answers nothing, so it clears nothing. */
export function afterAnswer(tracked: Tracked, answer: string, restarting: boolean): Tracked {
  if (restarting || !answer.trim()) return tracked
  return { ...tracked, asked: [], changed: [] }
}

const MAX_TYPO_WORD = 40

const words = (text: string) => text.trim().split(/\s+/)

/** The edit distance between two words, a swap of neighbouring letters counting once. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1)
    }
  }
  return d[a.length]![b.length]!
}

const LETTERS = /^\p{L}+$/u

/** A word without the punctuation around it: `script,` and `script` are one word. */
const bare = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || word

/** The same word, or a typo mended. A short word and anything not all letters (a number, a path, a URL, `a.js`) must match exactly: one character makes another thing of them. */
function sameWord(was: string, is: string): boolean {
  const before = bare(was)
  const now = bare(is)
  if (before === now) return true
  const shortest = Math.min(before.length, now.length)
  if (shortest < 4 || Math.max(before.length, now.length) > MAX_TYPO_WORD || !LETTERS.test(before) || !LETTERS.test(now)) return false
  return distance(before, now) <= (shortest >= 5 ? 2 : 1)
}

/**
 * The user's messages with `text` added. A message that the new one begins with, word by word, is
 * dropped: the user submitted it, interrupted, and sent it again with more or with a typo mended,
 * and the new one holds every word.
 */
export function addAsked(asked: readonly string[], text: string): string[] {
  const now = words(text)
  const repeats = (earlier: string) => {
    const before = words(earlier)
    return earlier.trim() !== '' && before.length <= now.length && before.every((word, i) => sameWord(word, now[i]!))
  }
  return [...asked.filter((earlier) => !repeats(earlier)), text]
}

/** A message the user wrote, not the result of a tool call. */
const isUserWords = (m: SessionMessage | undefined): boolean =>
  m?.role === 'user' && !m.toolResults?.length && m.text.trim() !== ''

/**
 * The agent's last finished reply, read from the conversation: the last assistant text that a
 * message of the user follows, before the call to `restartTool`. The host lists each content
 * block as its own message, so the text before a tool call has no tool call of its own. Only the
 * user's next message tells a reply from that lead-in, and the restart turn has none yet. A
 * reopened session reads the same conversation, so nothing empties it.
 */
export function lastReply(messages: readonly SessionMessage[], restartTool: string): string | undefined {
  const call = messages.findLastIndex((m) => m.toolUses.some((use) => use.tool === restartTool))
  const before = call < 0 ? messages : messages.slice(0, call)
  return before.findLast((m, i) => m.role === 'assistant' && !m.toolUses.length && m.text.trim() !== '' && isUserWords(before[i + 1]))?.text
}

/** What the new agent does first. A typed restart runs nothing: the user writes next. */
function ending(last: Exchange, manual: boolean): string {
  if (manual) return 'Nothing runs now. The user writes next.'
  if (!last.asked.length) return 'Continue from the note.'
  return 'The user has seen nothing since that reply. Do what Next lists, then answer every point of their messages in one reply.'
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
