/**
 * wrap-up.ts: when the mod tells the agent its context size, and what it says.
 *
 * Answers get worse long before the window fills, so the limit follows the
 * work, never the window. At the limit the mod tells the agent to finish its
 * step and call `restart`; `HARD` past it, to stop and call it. Each line is
 * sent once and names no size: a notice pulls the agent off its task, and the
 * user is not reminded of the size. It replaces `scripts/hooks/context-check.js`,
 * which read the size from the session file.
 */
import type { Busy } from './button'

const LIMIT = 170000
/** How far past the limit the second line comes. A turn that passes it a little is no problem. */
export const HARD = 30000
/** How far under the limit the band offers the Restart button. */
export const LEAD = 30000

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
 * The line to send, or undefined. `before` is the size at the last check, 0 at the first. A size
 * that jumps past both marks gets the second line alone.
 */
export function wrapUpLine(before: number, now: number, limit: number): string | undefined {
  if (before < limit + HARD && now >= limit + HARD) return 'Stop now and call the restart tool with your note.'
  if (before < limit && now >= limit) return 'Finish this step, then call the restart tool with your note.'
  return undefined
}
