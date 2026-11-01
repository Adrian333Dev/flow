/**
 * edit-log.ts: the reminder that a loaded file Flow ships has a log (`docs/spec/rules.md` `### Changes
 * to a loaded file`, `fw-341`).
 *
 * The first landed `Edit` or `Write` of such a file in a turn adds one line to the edit's result,
 * naming the file's log, `lab/edit-log/<the file's path>.log.md` in the Flow repo, and the guide that
 * says how to write the entry. The agent writes the entry. A later edit of the same file in the turn
 * adds nothing.
 */
import type { EngineInterface } from 'claude-code'
import { flowHome } from '../../shared/home'
import { repoRoot, shippedOf } from './shipped'

/** The files each agent's turn has logged, the main loop's under `main`, by their repo path. */
const turns = new Map<string, Set<string>>()

/** A new turn starts with no file reminded. Called on each `turn.start`, the main loop's and each helper's. */
export const editLogTurnStarted = (agentId: string | undefined) => void turns.set(agentId ?? 'main', new Set())

/** Where the log of a shipped file sits: its repo path mirrored under `lab/edit-log/`, `.log.md` added, so no log is named `CLAUDE.md` or `SKILL.md`. */
export const logPathOf = (root: string, rel: string) => `${root}/lab/edit-log/${rel}.log.md`

/** The line on the edit's result. */
export const reminderOf = (rel: string, log: string, guide: string) => `[Auto] ${rel} is logged: add an entry to ${log}, as ${guide} says.`

type Done = { deny?: string; isError?: boolean; context?: readonly string[] }

/** The `tool.call` hook of `Edit` and `Write`: the call runs as it would, and the turn's first landed edit of a shipped loaded file gets the reminder. */
export async function withEditLog<R extends Done>($: EngineInterface, e: { file_path?: unknown; agentId?: string }, run: () => Promise<R>): Promise<R> {
  const done = await run()
  const rel = typeof e.file_path === 'string' ? shippedOf(e.file_path) : undefined
  if (!rel || !repoRoot() || done.deny !== undefined || done.isError) return done
  const key = e.agentId ?? 'main'
  const reminded = turns.get(key) ?? turns.set(key, new Set()).get(key)!
  if (reminded.has(rel)) return done
  reminded.add(rel)
  const line = reminderOf(rel, logPathOf(repoRoot(), rel), `${await flowHome($)}/guides/edit-log.md`)
  return { ...done, context: [...(done.context ?? []), line] }
}
