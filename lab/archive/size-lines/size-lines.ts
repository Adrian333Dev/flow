/**
 * size-lines.ts: the size lines and the /fresh suggestion, as they stood in
 * `mods/flow-session/features/wrap-up/wrap-up.ts` and `features/restart/fresh.ts`
 * until 2026-11-01 (`fw-362`).
 *
 * The main session got its size alone (`Context: 152k tokens.`) at 120k, then every 30k, past
 * the limit too. `wrapUp` returned `sizeLine(before, now)` when no wrap-up line was due. At each
 * turn's end the same marks showed the user a line suggesting `/fresh`, from `register.ts`'s
 * turn-end hook (`suggestFresh`).
 */
import type { EngineInterface } from 'claude-code'
import { kilo } from '../../shared/format'
import { readTracked } from '../../shared/state'

/** Where the size lines start, and how far apart they come. */
export const SIZE_FROM = 120000
export const SIZE_EVERY = 30000

/** The size line, or undefined: once for each mark from `SIZE_FROM` that the check passed. */
export function sizeLine(before: number, now: number): string | undefined {
  const mark = (tokens: number) => (tokens < SIZE_FROM ? -1 : Math.floor((tokens - SIZE_FROM) / SIZE_EVERY))
  return mark(now) > mark(before) ? `Context: ${kilo(now)} tokens.` : undefined
}

/** The suggestion, or undefined: once for each size mark passed since the last turn end. */
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
