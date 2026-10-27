/**
 * log.ts: one line per ask for `~/.flow/logs/permissions/<year>-<month>.jsonl`.
 *
 * `flow audit permissions` (scripts/lib/audit/permissions.js) reads it. It skips
 * a line without a string `source` and `answer`, counts `answer: "auto-allow"`
 * apart from asks, and exempts a `source: "rule"` line whose `rule` is spelled
 * as in home/settings.json → `permissions.ask`.
 */

export type Source = 'guard' | 'rule' | 'core'
export type LogAnswer = 'allow' | 'refuse' | 'note' | 'auto-allow' | 'nobody'

export type LogFields = {
  at: Date
  project: string
  session: string
  /** The subagent's id, else `main`. */
  agent?: string
  tool: string
  source: Source
  /** The sentence the dialog showed. */
  headline: string
  command: string
  /** The settings rule that asked, spelled as in `permissions.ask`. */
  rule?: string
  answer: LogAnswer
  /** How long the dialog was open. Absent where none opened. */
  ms?: number
}

const MAX_COMMAND = 200
const SESSION_WIDTH = 8

/** `guard` when the guard's hook asked, `rule` when a settings rule did, else Claude Code itself. */
export function sourceOf(hook: string | undefined, rule: string | undefined): Source {
  if (hook === 'PreToolUse') return 'guard'
  return rule === undefined ? 'core' : 'rule'
}

/** One JSON line with no trailing newline. `at` is ISO UTC with no milliseconds. */
export function logLine(fields: LogFields): string {
  return JSON.stringify({
    at: fields.at.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    project: fields.project,
    session: fields.session.slice(0, SESSION_WIDTH),
    agent: fields.agent ?? 'main',
    tool: fields.tool,
    source: fields.source,
    headline: fields.headline.replace(/\.$/, ''),
    command: fields.command.slice(0, MAX_COMMAND),
    rule: fields.rule,
    answer: fields.answer,
    ms: fields.ms,
  })
}

/** The month's file under the Flow home, named by UTC month as `at` is. */
export function logPath(home: string, now: Date): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${home}/logs/permissions/${now.getUTCFullYear()}-${month}.jsonl`
}

/**
 * The command that appends `line` to `path` and makes the folder first.
 * `$.fs` has no append, and reading then writing loses a line when two
 * sessions log at once.
 */
export const appendCommand = (line: string, path: string): string[] => [
  'bash',
  '-c',
  'mkdir -p "$(dirname "$2")" && printf "%s\\n" "$1" >> "$2"',
  'log',
  line,
  path,
]
