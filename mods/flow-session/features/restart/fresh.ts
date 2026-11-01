/**
 * fresh.ts: `/fresh`, a light window once a piece of work is finished, typed by the user alone.
 *
 * It rides the restart's compaction (restart.ts `runRestart`) with no note and no files, and no
 * model request: the mod builds the window from the tickets in flight, the agent's last reply and
 * the user's unanswered messages (window.ts `buildFresh`). It never asks for a capture first: the
 * user knows finished work from a discussion in flight, and no test the mod can run does. Nothing
 * suggests it: the meters already show the size (the user 2026-11-01, the suggestion line kept in
 * `lab/archive/size-lines/`).
 */
import type { EngineInterface } from 'claude-code'
import type { Restart } from '../../shared/types'
import { reasonOf } from '../../shared/format'
import { readTracked, updateTracked } from '../../shared/state'
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
