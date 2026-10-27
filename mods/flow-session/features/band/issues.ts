/**
 * issues.ts: how many Flow issues are open, from the failure log.
 *
 * Repeats `open()` in `scripts/lib/logs/failures.js`, which the mod cannot require. An
 * issue is a job whose last run failed: a line with a `job` opens it and a later
 * `cleared` line for the same job closes it.
 */

/** The log files that can hold an open issue: last month's and this month's, `~/.flow/logs/failures/<year>-<month>.jsonl`. */
export function failureFiles(home: string, now: Date): string[] {
  const month = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const before = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return [before, now].map((date) => `${home}/logs/failures/${month(date)}.jsonl`)
}

/** The open issues over the text of those files, oldest first. */
export function openIssues(texts: readonly string[]): number {
  const jobs = new Set<string>()
  for (const line of texts.flatMap((text) => text.split('\n'))) {
    let entry: { job?: unknown; cleared?: unknown }
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (typeof entry.job !== 'string') continue
    if (entry.cleared) jobs.delete(entry.job)
    else jobs.add(entry.job)
  }
  return jobs.size
}
