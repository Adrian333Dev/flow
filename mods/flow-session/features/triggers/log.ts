/**
 * log.ts: one line per trigger that fired or failed, in `~/.flow/logs/triggers/<year>-<month>.jsonl`.
 *
 * `/flow:triggers-check` reads it for the windows it checks, `/flow:audit` across sessions, to tell a guide
 * sent in time from one sent late or never. `by` says what made it fire:
 *
 * - `held`: a call held back until its guides were read. A miss by definition: the agent acted with the guide out of view.
 * - `beside`: a guide added beside the call that matched, a read of the file mostly.
 * - `result`, `mention`, `skill`: text added to a tool's result, an `@` mention, a skill's start.
 * - `chat`: guides attached from the chat score, with the `score` that crossed the threshold.
 *
 * A line with `error` is a firing whose text broke. Writing never throws and never delays the hook: a lost line changes nothing else.
 */
import type { EngineInterface } from 'claude-code'
import { reasonOf } from '../../shared/format'
import { flowHome } from '../../shared/home'
import { appendLines, monthPath, stamp } from '../../shared/log'

export type By = 'held' | 'beside' | 'result' | 'mention' | 'skill' | 'chat'

/** One firing, before the session facts are added. `sent` names each thing sent: a guide's file, a command, a text's first line. */
export type Firing = { id: string; by: By; file?: string; sent: string[]; score?: number; error?: string }

/** Where a firing happened. `turn` counts the user's prompts this session. */
export type Where = { session: string; turn: number; agent?: string }

/** The month's file under the Flow home. */
export const logPath = (home: string, at: Date) => monthPath(home, 'triggers', at)

/** One JSON line, no trailing newline. Empty fields are left out. */
export function firingLine(f: Firing, where: Where, at: Date): string {
  return JSON.stringify({
    at: stamp(at),
    session: where.session,
    turn: where.turn,
    ...(where.agent ? { agent: where.agent } : {}),
    id: f.id,
    by: f.by,
    ...(f.file ? { file: f.file } : {}),
    sent: f.sent,
    ...(f.score !== undefined ? { score: f.score } : {}),
    ...(f.error ? { error: f.error } : {}),
  })
}

/** What a text names in `sent`: its first line, cut at 100 characters. */
export const textLabel = (text: string) => text.split('\n', 1)[0]!.slice(0, 100)

/** Logs the firings in the background. */
export function logFirings($: EngineInterface, agentId: string | undefined, firings: readonly Firing[]): void {
  if (!firings.length) return
  void (async () => {
    const at = new Date()
    const where: Where = { session: await $.session.id(), turn: await $.session.turns(), agent: agentId }
    await appendLines($, logPath(await flowHome($), at), firings.map((f) => firingLine(f, where, at)))
  })().catch((error) => $.ui.log(`trigger log lines lost: ${reasonOf(error)}`))
}
