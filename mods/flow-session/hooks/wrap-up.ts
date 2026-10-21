/**
 * wrap-up.ts: when the mod tells the agent its context size, and what it says.
 *
 * Answers get worse long before the window fills, so the limit follows the
 * work, never the window. From 30k under the limit the mod gives the size every
 * 10k (`Context 140k/170k`), so the agent hands off before a large step instead
 * of in the middle of it. At the limit it asks for the restart, then again every
 * 20k past it. It replaces `scripts/hooks/context-check.js`, which read the
 * size from the session file.
 */
import { restartSteps } from './ask'
import type { Busy } from './button'

const LIMIT = 170000
const STEP = 20000
export const LEAD = 30000
const SIZE_STEP = 10000

/** Whole thousands, such as `152k`. */
export const kilo = (tokens: number) => `${Math.round(tokens / 1000)}k`

const parse = (text: string | undefined): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(text ?? '')
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/**
 * `wrapUp` and `wrapUpAt` from the text of `~/.flow/settings.json` and
 * `settings.local.json`. A switch is read from the first file alone, as
 * `scripts/lib/settings.js` does, and the local file wins for the limit.
 */
export function wrapUpSettings(globalText?: string, localText?: string): { wrapUp: boolean; limit: number } {
  const global = parse(globalText)
  const set = Number({ ...global, ...parse(localText) }.wrapUpAt)
  return { wrapUp: global.wrapUp !== false, limit: set > 0 ? set : LIMIT }
}

/**
 * True from `LEAD` under the limit while the wrap-up is on and nothing is `busy`: the band then
 * offers the restart. The button is for restarting by hand ahead of the automatic restart at the
 * limit, between turns. No figure (just after a compaction) hides it.
 */
export const offersRestart = (tokens: number | undefined, limit: number, on: boolean, busy: Busy): boolean =>
  on && !busy.running && !busy.requested && !busy.restarting && tokens !== undefined && tokens >= Math.max(limit - LEAD, 0)

/**
 * The line to send, or undefined. `before` is the size at the last check, 0 at the first.
 * `handoffFresh` is true while a handoff stands and nothing changed after it.
 */
export function wrapUpLine(before: number, now: number, limit: number, handoffFresh = false): string | undefined {
  const size = `Context ${kilo(now)}/${kilo(limit)}`
  if (now < limit) {
    const from = Math.max(limit - LEAD, 0)
    if (now < from) return undefined
    const notice = from + Math.floor((now - from) / SIZE_STEP) * SIZE_STEP
    return before >= notice ? undefined : size
  }
  const mark = limit + Math.floor((now - limit) / STEP) * STEP
  if (before >= mark) return undefined
  const next = restartSteps(handoffFresh)
  if (before < limit) return `${size}. At the next checkpoint: ${next}.`
  return `${size}. Finish this step, then ${next}.`
}
