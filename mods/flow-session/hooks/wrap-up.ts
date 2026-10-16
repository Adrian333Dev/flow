/**
 * wrap-up.ts: when the mod tells the agent to wrap up, and what it says.
 *
 * Answers get worse long before the window fills, so the limit follows the
 * work, never the window. The mod speaks when the size crosses the limit,
 * then every 20k past it. It replaces `scripts/hooks/context-check.js`, which
 * read the size from the session file.
 */
import { restartSteps } from './ask'

const LIMIT = 150000
const STEP = 20000

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
 * The line to send, or undefined. `before` is the size at the last check, 0 at the first.
 * `handoffFresh` is true while a handoff stands and nothing changed after it.
 */
export function wrapUpLine(before: number, now: number, limit: number, handoffFresh = false): string | undefined {
  if (now < limit) return undefined
  const mark = limit + Math.floor((now - limit) / STEP) * STEP
  if (before >= mark) return undefined
  const next = restartSteps(handoffFresh)
  if (before < limit) return `The context is at ${kilo(now)}. At the next checkpoint, ${next}.`
  return `The context is at ${kilo(now)}, past the ${kilo(limit)} limit. Stop at the step you are on: finish it, ${next}.`
}
