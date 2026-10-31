/**
 * fresh.ts: `/fresh`, a light window once a piece of work is finished, typed by the user alone.
 *
 * It rides the restart's compaction (restart.ts `runRestart`) with no note and no files, and no
 * model request: the mod builds the window from the tickets in flight, the agent's last reply and
 * the user's unanswered messages (window.ts `buildFresh`). It never asks for a capture first: the
 * user knows finished work from a discussion in flight, and no test the mod can run does. At a
 * turn's end the mod suggests it past each size mark, on the screen alone.
 */
import type { EngineInterface } from 'claude-code'
import type { Restart } from '../../shared/types'
import { kilo, reasonOf } from '../../shared/format'
import { readTracked, updateTracked } from '../../shared/state'
import { sizeLine } from '../wrap-up/wrap-up'
import { runRestart } from './restart'

export async function registerFresh($: EngineInterface): Promise<void> {
  await $.command
    .register({ name: 'fresh', description: 'Open a fresh window once the work is finished: the tickets in flight, the agent’s last reply and your unanswered messages. No model request.' })
    .catch(() => undefined)
}

/** What `/fresh` answers. The compaction runs once the command has returned: a command run inside a hook the session waits on is refused. */
export async function freshCommand($: EngineInterface): Promise<string> {
  if ((await readTracked($)).restart) return 'A restart is already under way.'
  const size = (await $.session.usage().catch(() => undefined))?.context.tokens ?? 0
  // Started from the first, so a turn ending in between never runs it as the agent's restart.
  const fresh: Restart = { message: '', files: [], skills: [], size, started: true, manual: true, fresh: true }
  await updateTracked($, (t) => ({ ...t, restart: fresh }))
  void $.clock
    .sleep(100)
    .then(() => runRestart($, fresh))
    .catch((error) => $.ui.log(`/fresh failed, the session is as it was: ${reasonOf(error)}`))
  return 'Opening a fresh window.'
}

/** The suggestion, or undefined: once for each size mark (wrap-up.ts `sizeLine`) passed since the last turn end. */
export const freshSuggestion = (before: number, now: number): string | undefined =>
  sizeLine(before, now) ? `context ${kilo(now)}: once this work is finished, /fresh opens a light window from the tickets and the last reply` : undefined

// The main session's size at the last turn end.
let lastEnded = 0

/** A main turn ended: past a size mark, the suggestion goes on the screen. The agent never sees a log line. A restart under way says nothing. */
export async function suggestFresh($: EngineInterface): Promise<void> {
  if ((await readTracked($)).restart) return
  const now = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (now === undefined) return
  const line = freshSuggestion(lastEnded, now)
  lastEnded = now
  if (line) $.ui.log(line)
}
