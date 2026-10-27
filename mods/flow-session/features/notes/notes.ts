/**
 * notes.ts: the rows of the `#` list: the labels of `~/.flow/notes/`, the project's open tickets, then the notes.
 *
 * `flow notes` writes those files (scripts/features/notes/notes.ts). Typing `#` in the
 * prompt box lists the labels with their counts, then the open tickets, then the newest
 * notes, and `#board` narrows the list. `#t:board` lists tickets alone, `#n:board`
 * labels and notes alone. Taking a label row writes `#label`, and taking a note or
 * ticket row writes an `@` mention of its file, so a ticket's header comes with it
 * (ticket-context.ts).
 *
 * A row's label is a short handle and its description carries the words, since the
 * engine lines the descriptions up after the longest label and cuts an overlong label
 * from the left. The words typed show underlined by a combining character: since 2.1.312
 * the engine strips style codes from a row, so bold or colour cannot reach it. A note matches as scripts/shared/query.ts
 * does: a word must appear in the text, the labels or the project. A ticket matches on
 * what its row shows: its name and description.
 */
import type { EngineInterface } from 'claude-code'
import { mention, relativeTo } from '../drag/drag'
import { frontmatter } from '../../shared/frontmatter'
import { flowHome, readText } from '../../shared/home'
import { ticketPrefix } from '../../shared/ticket'
import { lastColumns } from '../../shared/viewport'

export type Note = {
  path: string
  changed: number
  title: string
  labels: string[]
  project: string
  /** The whole file, lowercased, for matching. */
  haystack: string
}

export type Row = { text: string; label: string; description: string }

// A colon later than this in the first line belongs to the sentence, not to a title.
const TITLE_COLON_MAX = 60
const NAME_WIDTH = 24
const MAX_LABELS = 6
const MAX_NOTES = 8
const MAX_TICKETS = 8
// The cells a row spends outside its description: the indent before the label, and the gap after the
// longest label (seen at 80 columns, 2.1.311), plus 1 so the last cell stays empty.
const ROW_INDENT = 4
const LABEL_GAP = 3
// `flow tickets` takes about a quarter second, and the list runs on every keystroke.
const TICKETS_KEPT_MS = 10000

/** An open ticket, as `flow tickets --json --flat` lists it. */
export type ListedTicket = { id: string; name: string; description: string; labels: string[]; status: string; path: string }

/** What the token asks for: `#t:` tickets alone, `#n:` labels and notes alone, else all, and the words after the lead. */
export function scopeOf(token: string): { scope: 'all' | 'tickets' | 'notes'; query: string } {
  const found = /^#([tn]):(.*)$/.exec(token)
  const query = (found ? (found[2] ?? '') : token.replace(/^#/, '')).toLowerCase()
  return { scope: found ? (found[1] === 't' ? 'tickets' : 'notes') : 'all', query }
}

const unquote = (value: string) => value.trim().replace(/^(["'])(.*)\1$/, '$2')

/** The words before the first `: ` of the first line, else the whole first line. */
export function titleOf(body: string): string {
  const line = (body.split('\n').find((l) => l.trim()) ?? '').trim()
  const cut = line.match(new RegExp(`^(.{1,${TITLE_COLON_MAX}}?):(?:\\s|$)`))
  return (cut?.[1]?.trim() || line)
}

/** One note file. `project` is the prefix its header names, `home` where it names none. */
export function parseNote(path: string, changed: number, raw: string): Note {
  const { fields, body: text } = frontmatter(raw)
  const body = text.trim()
  const inner = (fields.labels ?? '').replace(/^\[|\]$/g, '')
  const labels = inner.split(',').map((l) => unquote(l).toLowerCase()).filter(Boolean)
  const project = unquote(fields.project ?? '') || 'home'
  return {
    path,
    changed,
    title: titleOf(body),
    labels,
    project,
    haystack: `${body}\n${labels.join(' ')}\n${project}`.toLowerCase(),
  }
}

/** A ticket's name cut to `width` at its last whole word: `fw-217-groundwork-…`. */
const cutName = (name: string, width: number) => {
  if (name.length <= width) return name
  const head = name.slice(0, width - 1)
  return `${head.slice(0, head.lastIndexOf('-') + 1) || head}…`
}

/** A note row's label: `note` for the current project, `home note` or `<prefix> note` for the rest. */
const noteLabel = (note: Note, here: string) => (note.project.toLowerCase() === here.toLowerCase() ? 'note' : `${note.project} note`)

/** The label rows for the query, the most used first. */
export function labelRows(notes: readonly Note[], query: string): Row[] {
  const counts = new Map<string, number>()
  for (const note of notes) for (const label of note.labels) counts.set(label, (counts.get(label) ?? 0) + 1)
  return [...counts]
    .filter(([label]) => label.includes(query))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_LABELS)
    .map(([label, count]) => ({ text: `#${label}`, label: `#${label}`, description: `${count} ${count === 1 ? 'note' : 'notes'}` }))
}

/** The note rows for the query: the current project's, then the rest, each newest change first. */
export function noteRows(notes: readonly Note[], query: string, here: string): Row[] {
  const ownFirst = (note: Note) => (note.project.toLowerCase() === here.toLowerCase() ? 0 : 1)
  return notes
    .filter((note) => note.haystack.includes(query))
    .sort((a, b) => ownFirst(a) - ownFirst(b) || b.changed - a.changed)
    .slice(0, MAX_NOTES)
    .map((note) => ({
      text: `${mention(note.path)} `,
      label: noteLabel(note, here),
      description: [note.title, ...note.labels.map((l) => `#${l}`)].join(' · '),
    }))
}

/** The open tickets whose name (the id with it) or description holds the query: what the row shows. */
export const matchTickets = (tickets: readonly ListedTicket[], query: string) =>
  tickets.filter((t) => `${t.name} ${t.description}`.toLowerCase().includes(query))

/** A ticket's description without the short name and colon it opens with. */
const wordsOf = (description: string) => description.replace(new RegExp(`^[^:\\n]{1,${TITLE_COLON_MAX}}:\\s+`), '')

/** The rows for tickets already matched, in their order. A ticket outside `root` is mentioned by its absolute path. */
export function ticketRows(tickets: readonly ListedTicket[], root: string): Row[] {
  return tickets.slice(0, MAX_TICKETS).map((t) => ({
    text: `${mention(relativeTo(root, t.path) ?? t.path)} `,
    label: cutName(t.name, NAME_WIDTH),
    description: `${t.status} · ${wordsOf(t.description)}`,
  }))
}

/**
 * The rows with each description cut at a word to the room left in `columns`, since the engine
 * wraps a long one onto a second line. The engine lines descriptions up after the longest label.
 */
export function fitRows(rows: readonly Row[], columns: number): Row[] {
  const widest = Math.max(0, ...rows.map((r) => r.label.length))
  const room = columns - ROW_INDENT - widest - LABEL_GAP - 1
  return rows.map((r) => {
    if (r.description.length <= room) return r
    const head = r.description.slice(0, Math.max(0, room - 1))
    const atWord = head.lastIndexOf(' ') > room / 2 ? head.slice(0, head.lastIndexOf(' ')) : head
    return { ...r, description: `${atWord.replace(/[\s·,]+$/, '')}…` }
  })
}

// A combining low line draws under the character before it and takes no cell of its own.
const UNDERLINE = '̲'

/** The text with each character of each match of the query underlined, any case. */
export function underline(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(escaped, 'gi'), (found) => [...found].map((ch) => `${ch}${UNDERLINE}`).join(''))
}

/** The rows with the query underlined, after `fitRows`, which counts each underline as a character. */
export const underlineRows = (rows: readonly Row[], query: string): Row[] =>
  rows.map((r) => ({ ...r, label: underline(r.label, query), description: underline(r.description, query) }))

let keptTickets: { root: string; at: number; tickets: ListedTicket[] } | undefined

/** The open tickets of the project at `root`, read again once they are 10 s old. None where `flow` cannot answer. */
async function readOpenTickets($: EngineInterface, root: string): Promise<ListedTicket[]> {
  if (keptTickets?.root === root && Date.now() - keptTickets.at < TICKETS_KEPT_MS) return keptTickets.tickets
  const ran = await $.process.run(['flow', 'tickets', '--json', '--flat'], { cwd: root, timeoutMs: 10000 }).catch(() => undefined)
  let tickets: ListedTicket[] = []
  try {
    const listed = (JSON.parse(ran?.stdout ?? '') as { tickets?: ListedTicket[] }).tickets
    if (Array.isArray(listed)) tickets = listed
  } catch {
    // No JSON: no project here, or `flow` failed. The list shows the notes alone.
  }
  keptTickets = { root, at: Date.now(), tickets }
  return tickets
}

// The `#` list runs on every keystroke, so a note file is parsed again only when its change time moves.
const listedNotes = new Map<string, Note>()

/** Every note in `<home>/notes/`, each parsed once per change. */
async function readNotes($: EngineInterface, home: string): Promise<Note[]> {
  const dir = `${home}/notes`
  const entries = await $.fs.list(dir).catch(() => [])
  const found = await Promise.all(
    entries
      .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md') && !entry.name.startsWith('.'))
      .map(async (entry) => {
        const path = `${dir}/${entry.name}`
        const kept = listedNotes.get(path)
        if (kept?.changed === entry.mtimeMs) return kept
        const raw = await readText($, path)
        if (raw === undefined) return undefined
        const note = parseNote(path, entry.mtimeMs, raw)
        listedNotes.set(path, note)
        return note
      }),
  )
  return found.filter((note): note is Note => note !== undefined)
}

/**
 * The word the notes of this session's project carry in `project:`: its ticket
 * prefix, `home` in the Flow home. A folder with no prefix falls back to its
 * name, which matches no note.
 */
async function noteProject($: EngineInterface, home: string): Promise<string> {
  const root = (await $.session.root()).replace(/\/+$/, '')
  if (root === home || `${root}/.flow` === home) return 'home'
  return ticketPrefix(await readText($, `${root}/.flow/settings.json`)) ?? root.slice(root.lastIndexOf('/') + 1)
}

/** The rows for the `#` token typed: labels, this project's open tickets, then every project's notes, as the scope asks. */
export async function listRows($: EngineInterface, token: string): Promise<Row[]> {
  const { scope, query } = scopeOf(token)
  const root = (await $.session.root()).replace(/\/+$/, '')
  const shown = (found: Row[]) => underlineRows(fitRows(found, lastColumns()), query)
  if (scope === 'tickets') return shown(ticketRows(matchTickets(await readOpenTickets($, root), query), root))
  const home = await flowHome($)
  const [notes, project, tickets] = await Promise.all([
    readNotes($, home),
    noteProject($, home),
    scope === 'all' ? readOpenTickets($, root) : Promise.resolve([]),
  ])
  return shown([...labelRows(notes, query), ...ticketRows(matchTickets(tickets, query), root), ...noteRows(notes, query, project)])
}
