/**
 * The subagent half of `mods/flow-session/features/wrap-up/wrap-up.ts`, as it stood until 2026-11-07.
 * Each subagent was measured at every model request and sent 2 lines at its own size: save the state to
 * report files and begin the reply with `UNFINISHED:`. Removed by `fw-427`: a subagent that started a
 * research finishes it (the user, 2026-11-07). Wired in `register.ts` through `measureAgent` on
 * `turn.step`, `forgetAgent` on `turn.complete`, and `wrapUpResult` on `tool.call`.
 */
import type { EngineInterface, TurnStepChunk } from 'claude-code'
import { kilo, reasonOf } from '../../../mods/flow-session/shared/format'
import { flowSettings } from '../../../mods/flow-session/shared/settings'
import { type Lines, wrapUpLine, wrapUpSettings } from '../../../mods/flow-session/features/wrap-up/wrap-up'

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

export const sizeOf = (usage: { input_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }): number =>
  usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens

// Each subagent's size at its last request, and at its last check. A subagent's size is its own.
const agentSizes = new Map<string, number>()
const agentChecked = new Map<string, number>()

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
export async function sendAgentLine($: EngineInterface, agentId: string): Promise<void> {
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
