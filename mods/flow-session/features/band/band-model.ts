/**
 * band-model.ts: what the band holds and how it lays out, with nothing drawn here.
 *
 * The ticket started last sits leftmost, so the order is the start order. A ticket never
 * leaves from being idle: it leaves at once when parked or dropped, and a closed one
 * (`DONE ✓`) leaves when the next ticket starts. The band is one row. The layout takes the first
 * of three looks that fits it, and folds what still does not fit into `+N`.
 */
import type { Entry } from '../../shared/types'
import type { Ticket } from '../../shared/ticket'

export const DONE_WORD = 'DONE ✓'

/**
 * A ticket's file was read. `lights` is true when the command is `flow tickets start` on the ticket:
 * it goes leftmost, and the closed badges leave. A ticket only read keeps its place.
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
  if (!lights) return entries.map((entry) => (entry === kept ? next : entry))
  return [next, ...entries.filter((entry) => entry !== kept && !entry.isDone)]
}

/**
 * The badge the session is working on: the leftmost open one, which is the one started last.
 * When it closes, the next one started before it takes over. A closed badge is never current.
 */
export const currentId = (entries: readonly Entry[]): string | undefined => entries.find((entry) => !entry.isDone)?.id

/** Marks `id` as acting, and every other badge as not. */
export const setActing = (entries: readonly Entry[], id: string | undefined): Entry[] =>
  entries.map((entry) => {
    const acting = entry.id === id && !entry.isDone
    return entry.acting === acting ? entry : { ...entry, acting }
  })

/** One badge as laid out: both parts' text with their padding, ready to draw. */
export type Badge = { id: string; name: string; status: string; isDone: boolean; acting: boolean }

export type Layout = {
  /** The badges that fit, the first on the left. */
  badges: Badge[]
  folded: number
  issues: string
  /** True when the Restart button shows before the issue count. */
  restart: boolean
  /** Blank cells between the last badge (or `+N`) and the button or issue count. */
  space: number
}

/** Blank cells between two badges. */
export const GAP = 1

/** The Restart button's label, which sits between 2 corners like a badge, and the blank cells between it and the issue count. */
export const RESTART = ' Restart '
export const RESTART_CELLS = RESTART.length + 2
export const RESTART_GAP = 2

/** How much of a badge other than the main one shows: the whole, its id and word, or its id alone. */
type Shape = 'full' | 'words' | 'ids'
const SHAPES: readonly Shape[] = ['full', 'words', 'ids']

/**
 * The corner is the only padding at each end, so the text starts at the colour's edge.
 * The status takes one space after the name's colour ends (without it the badge looked bad,
 * the user, 2026-10-18). Corners are kept at any width: without them each end would take a
 * space, the same 2 cells, so dropping them frees nothing. An id alone has no status, and a
 * closed one keeps its `✓`.
 */
function badgeOf(entry: Entry, shape: Shape): Badge {
  const word = shape === 'ids' ? (entry.isDone ? '✓' : '') : entry.word
  return {
    id: entry.id,
    name: shape === 'full' ? entry.name : entry.id,
    status: word ? ` ${word}` : '',
    isDone: entry.isDone,
    acting: entry.acting,
  }
}

/** The spinner and the space before it, drawn after the status while a badge acts. */
export const SPIN_CELLS = 2

/** Cells of a badge: its text, its 2 corners and, while it acts with the spinner on, the spinner. */
const cells = (badge: Badge, spinner: boolean) => badge.name.length + badge.status.length + 2 + (badge.acting && spinner ? SPIN_CELLS : 0)
const foldWidth = (n: number) => (n ? ` +${n}`.length : 0)

/** The badges from the left that fit `room`, which keeps its cells for the `+N` of those left out. */
function fit(badges: readonly Badge[], room: number, spinner: boolean): Badge[] {
  const shown: Badge[] = []
  let used = 0
  for (const [at, badge] of badges.entries()) {
    const width = cells(badge, spinner) + (shown.length ? GAP : 0)
    if (used + width + foldWidth(badges.length - at - 1) > room) break
    shown.push(badge)
    used += width
  }
  return shown
}

/**
 * The band in `columns` cells, one row. The right end holds the Restart button, when `restart` is
 * true, then the open Flow `issues`; they keep their cells and the badges give way. The main badge,
 * the leftmost open one, always shows whole. The others show whole while all fit, then as id and
 * word, then as id alone; what still does not fit folds. `spinner` says whether an acting badge
 * shows its spinner.
 */
export function layout(entries: readonly Entry[], columns: number, issues: number, spinner = true, restart = false): Layout {
  const count = issues ? `${issues} issue${issues > 1 ? 's' : ''}` : ''
  const right = (restart ? RESTART_CELLS + (count ? RESTART_GAP : 0) : 0) + count.length
  const room = columns - (right ? right + 2 : 0)
  const main = entries.find((entry) => !entry.isDone) ?? entries[0]
  let badges: Badge[] = []
  for (const shape of SHAPES) {
    badges = fit(entries.map((entry) => badgeOf(entry, entry === main ? 'full' : shape)), room, spinner)
    if (badges.length === entries.length) break
  }
  const folded = entries.length - badges.length
  const left = badges.reduce((n, badge, at) => n + cells(badge, spinner) + (at ? GAP : 0), 0) + foldWidth(folded)
  return { badges, folded, issues: count, restart, space: Math.max(1, columns - left - right) }
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
