/**
 * wrap-up.ts: when the mod tells the agent its context size, and what it says.
 *
 * Answers get worse long before the window fills, so the limit follows the
 * work, never the window. At the limit the mod tells the agent to finish its
 * step and call `restart`; `HARD` past it, to stop and call it. Each line is
 * sent once and names no size: a notice pulls the agent off its task, and the
 * user is not reminded of the size. A subagent has its own lines at the same limit,
 * measured on its own conversation: it saves its state to files and finishes. It replaces `scripts/hooks/context-check.js`,
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
 * `scripts/lib/settings.js` does, and the local file wins for the limits.
 */
export function wrapUpSettings(globalText?: string, localText?: string): { wrapUp: boolean; limit: number } {
  const global = parse(globalText)
  const both = { ...global, ...parse(localText) }
  const set = Number(both.wrapUpAt)
  return { wrapUp: global.wrapUp !== false, limit: set > 0 ? set : LIMIT }
}

/**
 * True from `LEAD` under the limit while the wrap-up is on and nothing is `busy`: the band then
 * offers the restart. The button is for restarting by hand ahead of the automatic restart at the
 * limit, between turns. No figure (just after a compaction) hides it.
 */
export const offersRestart = (tokens: number | undefined, limit: number, on: boolean, busy: Busy): boolean =>
  on && !busy.running && !busy.requested && !busy.restarting && tokens !== undefined && tokens >= Math.max(limit - LEAD, 0)

/** The two lines a session is sent: at the limit, and 30k past it. */
export type Lines = { finish: string; stop: string }

/** The restart guide (hooks/restart-guide.ts) follows either line. */
export const MAIN_LINES: Lines = {
  finish: 'Finish this step, then restart.',
  stop: 'Stop now and restart.',
}

/**
 * A subagent cannot restart: the mod ends neither its turn nor its conversation. It saves what it
 * learned to files and begins its reply with `UNFINISHED:`, and the session that sent it starts
 * the next one from those files. A restart costs about 4 requests of a full window, so a job
 * near its end finishes instead.
 */
export const AGENT_LINES: Lines = {
  finish:
    'From the session that started you: your window is full, and this replaces the stopping point in your brief. Unless you are within a few steps of your final report, write what you learned to your report files now: the sources read, the findings, what is left to do. Then begin your reply with `UNFINISHED:` and the paths of those files.',
  stop: 'From the session that started you: stop now, whatever your brief says. Write what you learned to your report files and begin your reply with `UNFINISHED:` and their paths.',
}

/**
 * The line to send, or undefined. `before` is the size at the last check, 0 at the first. A size
 * that jumps past both marks gets the second line alone.
 */
export function wrapUpLine(before: number, now: number, limit: number, lines: Lines = MAIN_LINES): string | undefined {
  if (before < limit + HARD && now >= limit + HARD) return lines.stop
  if (before < limit && now >= limit) return lines.finish
  return undefined
}

/** A request's context size: what it sent fresh, read from the cache and wrote to it. */
export const sizeOf = (usage: { input_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }): number =>
  usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens
