/**
 * first-message.ts: the messages a restarted session starts from.
 *
 * The mod builds the new window from the old one, never the old agent's memory of it: an opening
 * line, the old window's dialogue word for word (as one `Read` of a file the mod wrote), what the
 * agent chose to load, the agent's note, and the user's messages it never answered. The loads are
 * `Read` and `Skill` calls with their results (hooks/loads.ts), so the terminal draws them
 * collapsed and the agent edits without reading the files again.
 */
import type { Tracked } from '../types'
import { NOTE_PREFIX, OPENING } from './dialogue'
import { callsFor, type Built, type Loaded } from './loads'

export type { Built }

/** What a restart carries. `tickets` and `loads` are in the order they are shown. */
export type Window = {
  /** The file the dialogue was written to, and the file of the window before it, if any. */
  dialogue: { path: string; text: string; previous?: string }
  tickets: readonly Loaded[]
  loads: readonly Loaded[]
  note: string
  /** The user's messages the agent never answered, oldest first. */
  asked: readonly string[]
  /** Typed by the user as /restart: nothing runs after the compaction. */
  manual: boolean
}

const user = (text: string): Built => ({ role: 'user', text, toolUses: [] })

/** What the new agent is told first. */
function opening(window: Window): string {
  const { previous } = window.dialogue
  const lines = [
    `${OPENING} The old window is carried, not summarized. Below: its dialogue word for word, what the old agent loaded, its note, and the user's messages it did not answer.${previous ? ` The window before it is ${previous}.` : ''}`,
    "Where the dialogue and a ticket's `## State` differ, the dialogue wins.",
    'After you answer the user, run the capture pass (`## Capture` in CLAUDE.md) over the dialogue and the note.',
  ]
  if (window.manual) lines.push('Nothing runs now. The user writes next.')
  return lines.join('\n\n')
}

/** The conversation after a restart, oldest first: the six parts below the fixed part Claude Code adds. */
export function restartWindow(window: Window): Built[] {
  const { path, text } = window.dialogue
  const file: Loaded = { type: 'file', path, text, from: 1, to: text.split('\n').length, whole: true }
  return [
    user(opening(window)),
    ...callsFor([file, ...window.tickets, ...window.loads]),
    user(`${NOTE_PREFIX}\n\n${window.note}`),
    ...window.asked.map(user),
  ]
}

/** What is tracked once a main turn ends with `answer`: the user's messages are answered. A restart's closing line answers nothing, so it clears nothing. */
export function afterAnswer(tracked: Tracked, answer: string, restarting: boolean): Tracked {
  if (restarting || !answer.trim()) return tracked
  return { ...tracked, asked: [] }
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
