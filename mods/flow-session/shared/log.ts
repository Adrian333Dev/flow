import type { EngineInterface } from 'claude-code'

/** The month's file of a log under the Flow home, `<home>/logs/<name>/<year>-<month>.jsonl`, by UTC month. */
export function monthPath(home: string, name: string, at: Date): string {
  const month = String(at.getUTCMonth() + 1).padStart(2, '0')
  return `${home}/logs/${name}/${at.getUTCFullYear()}-${month}.jsonl`
}

/** ISO UTC with no milliseconds, the `at` of every log line. */
export const stamp = (at: Date) => at.toISOString().replace(/\.\d{3}Z$/, 'Z')

/** Appends lines to a file, creating its folder. `$.fs` has no append, and reading then writing loses a line when two sessions log at once. */
export async function appendLines($: EngineInterface, path: string, lines: readonly string[]): Promise<void> {
  if (!lines.length) return
  await $.process.run(['bash', '-c', 'mkdir -p "$(dirname "$1")" && printf "%s\\n" "${@:2}" >> "$1"', 'log', path, ...lines], { timeoutMs: 5000 })
}
