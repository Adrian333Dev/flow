/**
 * band-model.ts: what the band holds and how it lays out, with nothing drawn here.
 *
 * Tickets join first in, first out and keep their place. A ticket never leaves from being
 * idle: it leaves at once when parked or dropped, and a closed one (`DONE ✓`) leaves when
 * the next ticket lights. The layout gives as many badges as fit the row, the rest folded
 * into `+N`.
 */
import type { Entry } from '../types'
import type { Ticket } from './ticket'

export const DONE_WORD = 'DONE ✓'

/**
 * A ticket's file was read. `lights` is true when the command lights an unlit ticket:
 * `flow <id>` on one in progress, or a move to in progress.
 */
export function apply(entries: readonly Entry[], ticket: Ticket, lights: boolean): Entry[] {
  const at = entries.findIndex((entry) => entry.id === ticket.id)
  const kept = at === -1 ? undefined : entries[at]
  if (ticket.status === 'done') {
    if (!kept) return [...entries]
    return entries.map((entry) => (entry === kept ? { ...kept, name: ticket.name, word: DONE_WORD, isDone: true, acting: false } : entry))
  }
  if (ticket.status !== 'in-progress') return entries.filter((entry) => entry !== kept)
  if (!kept && !lights) return [...entries]
  const next: Entry = { ...(kept ?? { id: ticket.id, acting: false }), name: ticket.name, word: ticket.word, isDone: false }
  if (kept) return entries.map((entry) => (entry === kept ? next : entry))
  // A new ticket lit: the closed ones leave.
  return [...entries.filter((entry) => !entry.isDone), next]
}

/**
 * The badge the session is working on: `preferred` (the last one lit) while it is open on the
 * band, else the newest open one. A closed badge is never current.
 */
export function currentId(entries: readonly Entry[], preferred?: string): string | undefined {
  const open = entries.filter((entry) => !entry.isDone)
  return open.find((entry) => entry.id === preferred)?.id ?? open[open.length - 1]?.id
}

/** Marks `id` as acting, and every other badge as not. */
export const setActing = (entries: readonly Entry[], id: string | undefined): Entry[] =>
  entries.map((entry) => {
    const acting = entry.id === id && !entry.isDone
    return entry.acting === acting ? entry : { ...entry, acting }
  })

/** One badge as laid out: both parts' text with their padding, ready to draw. */
export type Badge = { id: string; name: string; status: string; isDone: boolean; acting: boolean }

export type Layout = {
  badges: Badge[]
  folded: number
  issues: string
  /** Blank cells between the last badge (or `+N`) and the issue count. */
  space: number
}

const GAP = 2

/**
 * The corner is the only padding at each end, so the text starts at the colour's edge.
 * The status takes one space after the name's colour ends (without it the badge looked bad,
 * the user, 2026-10-18). Corners are kept at any width: without them each end would take a
 * space, the same 2 cells, so dropping them frees nothing.
 */
const badgeOf = (entry: Entry): Badge => ({
  id: entry.id,
  name: entry.name,
  status: ` ${entry.word}`,
  isDone: entry.isDone,
  acting: entry.acting,
})

/** The spinner and the space before it, drawn after the status while a badge acts. */
export const SPIN_CELLS = 2

/** Cells of a badge: its text, its 2 corners and, while it acts with the spinner on, the spinner. */
const cells = (badge: Badge, spinner: boolean) => badge.name.length + badge.status.length + 2 + (badge.acting && spinner ? SPIN_CELLS : 0)
const foldWidth = (n: number) => (n ? ` +${n}`.length : 0)

function fit(entries: readonly Entry[], room: number, spinner: boolean): { badges: Badge[]; used: number } {
  const badges: Badge[] = []
  let used = 0
  for (const entry of entries) {
    const badge = badgeOf(entry)
    const width = cells(badge, spinner) + (badges.length ? GAP : 0)
    if (used + width + foldWidth(entries.length - badges.length - 1) > room) break
    badges.push(badge)
    used += width
  }
  return { badges, used }
}

/** The band's row in `columns` cells, with `issues` open Flow issues at the right. `spinner` says whether an acting badge shows its spinner. */
export function layout(entries: readonly Entry[], columns: number, issues: number, spinner = true): Layout {
  const right = issues ? `${issues} issue${issues > 1 ? 's' : ''}` : ''
  const room = columns - (right ? right.length + 2 : 0)
  const { badges, used } = fit(entries, room, spinner)
  const folded = entries.length - badges.length
  const left = used + foldWidth(folded)
  return { badges, folded, issues: right, space: Math.max(1, columns - left - right.length) }
}

/** Mixes two `#rrggbb` colours: `share` of the way from `from` to `to`. */
export function mix(from: string, to: string, share: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const out = [0, 1, 2].map((i) => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * share))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** The wave's 3 cells, how far from the badge's colour toward white each one's background is. */
const WAVE = [0.35, 1, 0.35]

/**
 * The share of white in each cell's background for a name and status `length` cells long at
 * `frame`: 0 is the badge's colour. The wave moves a cell a frame from the left edge to past the
 * right edge and starts over at once.
 */
export function waveShares(length: number, frame: number): number[] {
  const start = (frame % (length + WAVE.length)) - WAVE.length
  return Array.from({ length }, (_, i) => WAVE[i - start] ?? 0)
}

/**
 * The spinner's cells: braille dots turning (the user's pick, 2026-10-18). Braille is in neither
 * terminal font (Consolas, DejaVu Sans Mono), so a fallback font draws it: if the cell shows cut,
 * the block elements `▘▀▝▐▗▄▖▌` are drawn by the terminal itself and always fit.
 */
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/** The spinner's cell at `frame`, a step each frame. */
export const spinnerAt = (frame: number): string => SPINNER[frame % SPINNER.length] as string
