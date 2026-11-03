/**
 * model-switch.ts: one line for each change of the session's model, in
 * `~/.flow/logs/model-switches/<year>-<month>.jsonl`.
 *
 * The line names the `source` Claude Code gives (`command`, `picker`, `sdk`, `auto`, `resume`), the
 * one fact that tells a switch the user made from one the session made alone. Same place and
 * convention as `~/.flow/logs/permissions/`, the append in `shared/log.ts` (mods share no code, so `flow-permissions` has its own).
 */
import type { EngineInterface } from 'claude-code'

import { reasonOf } from '../../shared/format'
import { flowHome } from '../../shared/home'
import { appendLines, monthPath, stamp } from '../../shared/log'

/** The fields of a `PostModelSwitch` hook input the log keeps. */
export type ModelSwitch = {
  session_id: string
  from_model: string
  to_model: string
  requested_model: string | null
  source: string
}

/** One JSON line with no trailing newline. `at` is ISO UTC with no milliseconds. */
export function switchLine(e: ModelSwitch, at: Date): string {
  return JSON.stringify({
    at: stamp(at),
    session: e.session_id.slice(0, 8),
    from: e.from_model,
    to: e.to_model,
    requested: e.requested_model,
    source: e.source,
  })
}

/** The month's file under the Flow home, named by UTC month as `at` is. */
export const switchPath = (home: string, at: Date): string => monthPath(home, 'model-switches', at)

/** Appends the switch to the log. Never throws: a lost line changes nothing else. */
export async function logSwitch($: EngineInterface, e: ModelSwitch): Promise<void> {
  try {
    const now = new Date()
    await appendLines($, switchPath(await flowHome($), now), [switchLine(e, now)])
  } catch (error) {
    $.ui.log(`model switch log line lost: ${reasonOf(error)}`)
  }
}
