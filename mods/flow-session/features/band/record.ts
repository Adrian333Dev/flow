/**
 * record.ts: the band's saved record, one `$.store` key for each session.
 *
 * `$.state` is the session's alone and a reopen empties it, so the band is written here when it
 * changes and read back at `session.start`. A record is `{ v: 1, updated, band }`: each feature
 * that joins later owns one more field and leaves the others as they are.
 */
import type { Entry } from '../../shared/types'

const PREFIX = 'session:'
const VERSION = 1
const DAY_MS = 86_400_000
export const KEEP_DAYS = 14

export type Saved = { v: number; updated: string; band: Entry[] }

export const recordKey = (sessionId: string): string => `${PREFIX}${sessionId}`
export const isRecordKey = (key: string): boolean => key.startsWith(PREFIX)

/** The record for the band as it stands. A wave is never saved: nothing runs after a reopen. */
export const makeRecord = (band: readonly Entry[], now: Date): Saved => ({
  v: VERSION,
  updated: now.toISOString(),
  band: band.map(plain),
})

const isEntry = (value: unknown): value is Entry => {
  const entry = value as Partial<Entry> | null
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.word === 'string' &&
    typeof entry.isDone === 'boolean'
  )
}

/** A badge as saved: only its own fields, so a record written with the old idle and ended counts reads the same. */
const plain = (entry: Entry): Entry => ({ id: entry.id, name: entry.name, word: entry.word, isDone: entry.isDone, acting: false })

/** What a stored value holds, or undefined when it is no record of this version. */
export function parseRecord(value: unknown): Saved | undefined {
  const record = value as Partial<Saved> | null
  if (typeof record !== 'object' || record === null || record.v !== VERSION) return undefined
  if (typeof record.updated !== 'string' || Number.isNaN(Date.parse(record.updated))) return undefined
  if (!Array.isArray(record.band) || !record.band.every(isEntry)) return undefined
  return { v: VERSION, updated: record.updated, band: record.band.map(plain) }
}

/** True when a stored value is no record, or was last written more than 14 days before `now`. */
export function isExpired(value: unknown, now: Date): boolean {
  const record = parseRecord(value)
  return !record || now.getTime() - Date.parse(record.updated) > KEEP_DAYS * DAY_MS
}
