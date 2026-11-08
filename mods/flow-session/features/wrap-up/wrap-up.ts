/**
 * wrap-up.ts: when the mod tells the agent its context size, and what it says.
 *
 * Answers get worse long before the window fills, so the limit follows the work, never the window.
 * Only a build asks for a restart (the user, 2026-11-07, `fw-427`): a plan being executed has
 * breaks the agent can see. At the limit the mod tells it to carry on and restart at the next
 * break; `HARD` past it, at the end of the step. Design, discussion and research end only when the
 * user restarts: they get one line at the limit, to bring the ticket up to date, and no restart.
 * The agent cannot tell when the user is done with a topic, so the build's first line names a break
 * it can see: the user turning to something new (`fw-362`, the user 2026-11-01). Each line is sent
 * once and names no size. No other line tells the agent its size: the size lines every 30k from
 * 120k (`fw-296`) made it restart too early, mid-discussion (`fw-362`; kept in
 * `lab/archive/size-lines/`). A subagent gets no line: one that started a job finishes it (kept in
 * `lab/archive/subagent-wrap-up/`).
 */
import type { EngineInterface } from 'claude-code'
import type { Busy } from '../restart/button'
import { restartGuide } from '../restart/restart-guide'
import { kilo } from '../../shared/format'
import { flowSettings, parseObject } from '../../shared/settings'
import { readBand } from '../../shared/state'

/** The limit when no setting names one. */
export const LIMIT = 200000
/** How far past the limit the second line comes. A turn that passes it a little is no problem. */
export const HARD = 100000
/** How far under the limit the band offers the Restart button. */
export const LEAD = 30000

/**
 * `wrapUp` and `wrapUpAt` from the text of `~/.flow/settings.json` and
 * `settings.local.json`. A switch is read from the first file alone, as
 * `scripts/shared/settings.ts` does, and the local file wins for the limits.
 */
export function wrapUpSettings(globalText?: string, localText?: string): { wrapUp: boolean; limit: number } {
  const global = parseObject(globalText)
  const both = { ...global, ...parseObject(localText) }
  const set = Number(both.wrapUpAt)
  return { wrapUp: global.wrapUp !== false, limit: set > 0 ? set : LIMIT }
}

/**
 * True from `LEAD` under the limit while the wrap-up is on and nothing is `busy`: the band then
 * offers the restart. The button is for restarting by hand, in any phase, between turns. No figure
 * (just after a compaction) hides it.
 */
export const offersRestart = (tokens: number | undefined, limit: number, on: boolean, busy: Busy): boolean =>
  on && !busy.running && !busy.requested && !busy.restarting && tokens !== undefined && tokens >= Math.max(limit - LEAD, 0)

/** The line at the limit, and the line `HARD` past it. Without `stop`, the first line is the only one. */
export type Lines = { finish: string; stop?: string }

/** A build's lines. The restart guide follows either. */
export const BUILD_LINES: Lines = {
  finish: 'Context is large. Carry on. Restart at the next break: the work in hand finished, or the user turning to something new. Run capture first.',
  stop: 'Context is very large. Restart at the end of this step, discussion or not. Run capture first.',
}

/** Every other phase, and a session with no ticket: no restart, so a restart by hand loses nothing. */
export const SAVE_LINES: Lines = {
  finish: "Context is large. Bring the ticket up to date with this window's decisions and findings. Never call restart: the user restarts by hand.",
}

/** The lines for the ticket the session works now, by the word on its badge: `BUILD 2/5` builds. */
export const linesFor = (word: string | undefined): Lines => (word !== undefined && /^build\b/i.test(word) ? BUILD_LINES : SAVE_LINES)

/**
 * The line to send, or undefined. `before` is the size at the last check, 0 at the first. A size
 * that jumps past both marks gets the second line alone.
 */
export function wrapUpLine(before: number, now: number, limit: number, lines: Lines = BUILD_LINES): string | undefined {
  if (lines.stop !== undefined && before < limit + HARD && now >= limit + HARD) return lines.stop
  if (before < limit && now >= limit) return lines.finish
  return undefined
}

// The main session's size at the last check that could send a line.
let lastChecked = 0

/**
 * The main session's line for its size now, or undefined. Each mark speaks once. The phase is
 * read at the mark: the ticket the session works now, as its badge shows it.
 */
export async function wrapUp($: EngineInterface): Promise<string | undefined> {
  const { wrapUp: on, limit } = wrapUpSettings(...(await flowSettings($)))
  const now = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (!on || now === undefined) return undefined
  const before = lastChecked
  lastChecked = now
  const word = (await readBand($).catch(() => [])).find((entry) => !entry.isDone)?.word
  const lines = linesFor(word)
  const line = wrapUpLine(before, now, limit, lines)
  if (!line) return undefined
  $.ui.log(`wrap-up line sent at ${kilo(now)}`)
  return lines === BUILD_LINES ? `${line}\n\n${await restartGuide($)}` : line
}

/**
 * A tool's result, with the main session's line after it when a mark was passed. A long turn with
 * no message from the user gets its line this way. A subagent's result passes unchanged.
 */
export async function wrapUpResult<R extends { context?: readonly string[] }>($: EngineInterface, agentId: string | undefined, done: R): Promise<R> {
  if (agentId !== undefined) return done
  const line = await wrapUp($).catch(() => undefined)
  return line ? { ...done, context: [...(done.context ?? []), line] } : done
}
