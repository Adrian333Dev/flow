/**
 * wrap-up.ts: when the mod tells the agent its context size, and what it says.
 *
 * Answers get worse long before the window fills, so the limit follows the
 * work, never the window. At the limit the mod tells the agent to finish the
 * work in hand and call `restart`; `HARD` past it, to finish the step in hand and call it.
 * Nothing forces a restart mid-work. Each line is
 * sent once and names no size: a notice pulls the agent off its task, and the
 * user is not reminded of the size. A subagent has its own lines at the same limit,
 * measured on its own conversation: it saves its state to files and finishes.
 */
import type { EngineInterface, TurnStepChunk } from 'claude-code'
import type { Busy } from '../restart/button'
import { restartGuide } from '../restart/restart-guide'
import { kilo, reasonOf } from '../../shared/format'
import { flowSettings, parseObject } from '../../shared/settings'

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
 * offers the restart. The button is for restarting by hand ahead of the automatic restart at the
 * limit, between turns. No figure (just after a compaction) hides it.
 */
export const offersRestart = (tokens: number | undefined, limit: number, on: boolean, busy: Busy): boolean =>
  on && !busy.running && !busy.requested && !busy.restarting && tokens !== undefined && tokens >= Math.max(limit - LEAD, 0)

/** The two lines a session is sent: at the limit, and `HARD` past it. */
export type Lines = { finish: string; stop: string }

/** The restart guide follows either line. */
export const MAIN_LINES: Lines = {
  finish: 'Finish the work in hand (the whole task or ticket, never only this step), run capture, then restart.',
  stop: 'Finish the step in hand, run capture, then restart.',
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

export const sizeOf = (usage: { input_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }): number =>
  usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens

// The main session's size at the last check that could send a line.
let lastChecked = 0
// Each subagent's size at its last request, and at its last check. A subagent's size is its own.
const agentSizes = new Map<string, number>()
const agentChecked = new Map<string, number>()

/** The main session's line for its size now, with the restart guide, or undefined. Each mark speaks once. */
export async function wrapUp($: EngineInterface): Promise<string | undefined> {
  const { wrapUp: on, limit } = wrapUpSettings(...(await flowSettings($)))
  const now = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (!on || now === undefined) return undefined
  const before = lastChecked
  lastChecked = now
  const line = wrapUpLine(before, now, limit)
  if (!line) return undefined
  $.ui.log(`wrap-up line sent at ${kilo(now)}`)
  return `${line}\n\n${await restartGuide($)}`
}

export async function* measureAgent(agentId: string | undefined, chunks: AsyncIterable<TurnStepChunk>): AsyncGenerator<TurnStepChunk> {
  for await (const c of chunks) {
    if (agentId !== undefined && c.kind === 'stop' && c.usage) agentSizes.set(agentId, sizeOf(c.usage))
    yield c
  }
}

export function forgetAgent(agentId: string): void {
  agentSizes.delete(agentId)
  agentChecked.delete(agentId)
}

/**
 * Sends a subagent its line for its own size, once per mark. A subagent cannot restart
 * (`$.turn.abort` and `$.session.compact` act on the main conversation alone), so its line tells it
 * to save its state to files and finish. It ignores a line inside a tool result as injected text
 * (probed, Haiku), so the line goes as a message.
 */
async function sendAgentLine($: EngineInterface, agentId: string): Promise<void> {
  const { wrapUp: on, limit } = wrapUpSettings(...(await flowSettings($)))
  const now = agentSizes.get(agentId)
  if (!on || now === undefined) return
  const before = agentChecked.get(agentId) ?? 0
  agentChecked.set(agentId, now)
  const line = wrapUpLine(before, now, limit, AGENT_LINES)
  if (!line) return
  $.ui.log(`wrap-up line sent to a subagent at ${kilo(now)}`)
  await $.session.send({ to: { agentId }, text: line }).catch((error) => $.ui.log(`the wrap-up line to a subagent was not sent: ${reasonOf(error)}`))
}

/**
 * A tool's result, with the main session's line after it when a mark was passed. A long turn with
 * no message from the user gets its line this way. A subagent's line goes as a message.
 */
export async function wrapUpResult<R extends { context?: readonly string[] }>($: EngineInterface, agentId: string | undefined, done: R): Promise<R> {
  if (agentId !== undefined) {
    await sendAgentLine($, agentId).catch(() => undefined)
    return done
  }
  const line = await wrapUp($).catch(() => undefined)
  return line ? { ...done, context: [...(done.context ?? []), line] } : done
}
