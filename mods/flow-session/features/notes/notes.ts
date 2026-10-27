/**
 * notes.ts: the rows of the `#` list, built from the files in `~/.flow/notes/`.
 *
 * `flow notes` writes those files (scripts/lib/notes.js). Typing `#` in the
 * prompt box lists the labels with their counts, then the newest notes, and
 * `#board` narrows the list. Taking a label row writes `#label`, and taking a
 * note row writes an `@` mention of its file. The query matches as
 * scripts/lib/query.js does: a word must appear in the text, the labels or the
 * project.
 */
import type { EngineInterface } from 'claude-code'
import { mention } from '../drag/drag'
import { frontmatter } from '../../shared/frontmatter'
import { flowHome, readText } from '../../shared/home'
import { ticketPrefix } from '../../shared/ticket'

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
const TITLE_WIDTH = 60
const MAX_LABELS = 6
const MAX_NOTES = 8

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

const cut = (text: string, width: number) => (text.length > width ? `${text.slice(0, width - 1).trimEnd()}…` : text)

/** The word a row's title starts with: none for the current project, `home:` or `<prefix>:` for the rest. */
const prefixOf = (note: Note, here: string) =>
  note.project.toLowerCase() === here.toLowerCase() ? '' : `${note.project}: `

/**
 * The rows for the token typed. Label rows come first, the most used first,
 * then notes: the current project's, then the rest, each newest change first.
 */
export function rows(notes: readonly Note[], token: string, here: string): Row[] {
  const query = token.replace(/^#/, '').toLowerCase()

  const counts = new Map<string, number>()
  for (const note of notes) for (const label of note.labels) counts.set(label, (counts.get(label) ?? 0) + 1)
  const labelRows: Row[] = [...counts]
    .filter(([label]) => label.includes(query))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_LABELS)
    .map(([label, count]) => ({ text: `#${label}`, label: `#${label}`, description: `${count} ${count === 1 ? 'note' : 'notes'}` }))

  const ownFirst = (note: Note) => (note.project.toLowerCase() === here.toLowerCase() ? 0 : 1)
  const noteRows: Row[] = notes
    .filter((note) => note.haystack.includes(query))
    .sort((a, b) => ownFirst(a) - ownFirst(b) || b.changed - a.changed)
    .slice(0, MAX_NOTES)
    .map((note) => ({
      text: `${mention(note.path)} `,
      label: cut(`${prefixOf(note, here)}${note.title}`, TITLE_WIDTH),
      description: note.labels.map((l) => `#${l}`).join(' '),
    }))

  return [...labelRows, ...noteRows]
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

/** The rows for the `#` token typed, from every project's notes. */
export async function noteRows($: EngineInterface, token: string): Promise<Row[]> {
  const home = await flowHome($)
  return rows(await readNotes($, home), token, await noteProject($, home))
}
