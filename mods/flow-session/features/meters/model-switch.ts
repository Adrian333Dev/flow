/**
 * model-switch.ts: one line for each change of the session's model, in
 * `~/.flow/logs/model-switches/<year>-<month>.jsonl`.
 *
 * The line names the `source` Claude Code gives (`command`, `picker`, `sdk`, `auto`, `resume`), the
 * one fact that tells a switch the user made from one the session made alone. Same place and
 * convention as `~/.flow/logs/permissions/`. Mods share no code, so the append is written here again.
 */
import type { EngineInterface } from 'claude-code'

import { reasonOf } from '../../shared/format'
import { flowHome } from '../../shared/home'

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
    at: at.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    session: e.session_id.slice(0, 8),
    from: e.from_model,
    to: e.to_model,
    requested: e.requested_model,
    source: e.source,
  })
}

/** The month's file under the Flow home, named by UTC month as `at` is. */
export function switchPath(home: string, at: Date): string {
  const month = String(at.getUTCMonth() + 1).padStart(2, '0')
  return `${home}/logs/model-switches/${at.getUTCFullYear()}-${month}.jsonl`
}

/** Appends the switch to the log. `$.fs` has no append, and reading then writing loses a line when two sessions log at once. Never throws: a lost line changes nothing else. */
export async function logSwitch($: EngineInterface, e: ModelSwitch): Promise<void> {
  try {
    const now = new Date()
    const path = switchPath(await flowHome($), now)
    await $.process.run(['bash', '-c', 'mkdir -p "$(dirname "$2")" && printf "%s\\n" "$1" >> "$2"', 'log', switchLine(e, now), path], { timeoutMs: 5000 })
  } catch (error) {
    $.ui.log(`model switch log line lost: ${reasonOf(error)}`)
  }
}
