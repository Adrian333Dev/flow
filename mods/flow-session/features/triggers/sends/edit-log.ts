/**
 * edit-log.ts: the reminder that a loaded file Flow ships has a log (`docs/spec/rules.md` `### Changes
 * to a loaded file`, `fw-341`).
 *
 * The first landed `Edit` or `Write` of such a file in a turn adds one line to the edit's result,
 * naming the file's log, `lab/edit-log/<the file's path>.log.md` in the Flow repo, and the guide that
 * says how to write the entry. The agent writes the entry. A later edit of the same file in the turn
 * adds nothing: the one trigger counted per turn, never per window.
 */
import { repoRoot, shippedOf } from '../checks/shipped'

/** The files each agent's turn has logged, the main loop's under `main`, by their repo path. */
const turns = new Map<string, Set<string>>()

/** A new turn starts with no file reminded. Called on each `turn.start`, the main loop's and each helper's. */
export const editLogTurnStarted = (agentId: string | undefined) => void turns.set(agentId ?? 'main', new Set())

/** Where the log of a shipped file sits: its repo path mirrored under `lab/edit-log/`, `.log.md` added, so no log is named `CLAUDE.md` or `SKILL.md`. */
export const logPathOf = (root: string, rel: string) => `${root}/lab/edit-log/${rel}.log.md`

/** The line on the edit's result. */
export const reminderOf = (rel: string, log: string, guide: string) => `[Auto] ${rel} is logged: a change of approach gets an entry in ${log}, as ${guide} says.`

/** The reminder for a landed edit of a path, or none: no shipped file, no repo, or reminded already this turn. */
export function editLogReminder(path: unknown, agentId: string | undefined, home: string): string | undefined {
  const rel = typeof path === 'string' ? shippedOf(path) : undefined
  if (!rel || !repoRoot()) return undefined
  const key = agentId ?? 'main'
  const reminded = turns.get(key) ?? turns.set(key, new Set()).get(key)!
  if (reminded.has(rel)) return undefined
  reminded.add(rel)
  return reminderOf(rel, logPathOf(repoRoot(), rel), `${home}/references/guides/edit-log.md`)
}
