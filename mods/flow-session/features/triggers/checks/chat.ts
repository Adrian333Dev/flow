/**
 * chat.ts: how likely the chat is heading to a change of a file, scored from both sides of it.
 *
 * Conservative first signals, to be tuned by mining past sessions (`fw-397`):
 *
 * - `named`: a message names the file, by a path or a bare file name.
 * - `change`: the same message also holds a word of change (edit, rewrite, remove…).
 * - `rule-drafted`: an agent reply holds a drafted rule line, ``- **`an-id`** …``, counted for `CLAUDE.md`.
 *
 * One naming alone never crosses the threshold: a file named with a word of change does, as does a
 * drafted rule. The current window alone counts, the latest turn weighing most.
 */
import { CODE_EXTENSIONS } from './shell-write'
import { GUIDES } from '../sends/guides'

/** One turn: what the user sent, and what the agent wrote back in text. The current turn has no reply yet. */
export type Turn = { user: string; agent: string }

export const WEIGHTS = { named: 3, change: 2, ruleDrafted: 5 } as const
export const THRESHOLD = 5
/** Each turn back counts this much of the one after it, and only the last 3 count. */
const DECAY = 0.5
const TURNS = 3

const FILE = new RegExp(String.raw`(?:^|[\s\x60'"(\[])((?:[\w.~-]+/)*[\w.-]+\.(?:md|${CODE_EXTENSIONS.join('|')}))(?=$|[\s\x60'"),.:;\]#])`, 'gm')
const CHANGE = /\b(?:edit|chang|rewrit|rewor|updat|add|remov|cut|delet|propos|draft|fix|mov|renam|restructur|replac|trim|split|merg)\w*/i
const RULE_LINE = /^\s*- \*\*`[a-z0-9]+(?:-[a-z0-9]+)+`\*\*/m

/** The files a text names, each once. A bare guide name is read as Flow's guide. */
export function filesNamed(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(FILE)) {
    const file = m[1]!.replace(/^~\//, '/')
    out.add(!file.includes('/') && (GUIDES as readonly string[]).includes(file) ? `references/guides/${file}` : file)
  }
  return [...out]
}

/** Each file's score over the turns, oldest first, the last the current one. */
export function chatScores(turns: readonly Turn[]): Map<string, number> {
  const scores = new Map<string, number>()
  const add = (file: string, points: number) => scores.set(file, (scores.get(file) ?? 0) + points)
  turns.slice(-TURNS).forEach((turn, i, last) => {
    const weight = DECAY ** (last.length - 1 - i)
    for (const text of [turn.user, turn.agent]) {
      const change = CHANGE.test(text)
      for (const file of filesNamed(text)) add(file, weight * (WEIGHTS.named + (change ? WEIGHTS.change : 0)))
    }
    if (RULE_LINE.test(turn.agent)) add('CLAUDE.md', weight * WEIGHTS.ruleDrafted)
  })
  return scores
}

/** The files at or over the threshold, highest first. */
export const likelyChanges = (turns: readonly Turn[]): { file: string; score: number }[] =>
  [...chatScores(turns)]
    .filter(([, score]) => score >= THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([file, score]) => ({ file, score }))
