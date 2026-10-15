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
import { mention } from './drag'

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

/** A note's header and text. The header holds `date`, `labels: [a, b]` and `project`. */
function split(raw: string): { header: Map<string, string>; body: string } {
  const header = new Map<string, string>()
  const lines = raw.replace(/^﻿/, '').split('\n')
  if (lines[0]?.trim() !== '---') return { header, body: raw.trim() }
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (end === -1) return { header, body: raw.trim() }
  for (const line of lines.slice(1, end)) {
    const at = line.indexOf(':')
    if (at > 0) header.set(line.slice(0, at).trim(), line.slice(at + 1).trim())
  }
  return { header, body: lines.slice(end + 1).join('\n').trim() }
}

/** The words before the first `: ` of the first line, else the whole first line. */
export function titleOf(body: string): string {
  const line = (body.split('\n').find((l) => l.trim()) ?? '').trim()
  const cut = line.match(new RegExp(`^(.{1,${TITLE_COLON_MAX}}?):(?:\\s|$)`))
  return (cut?.[1]?.trim() || line)
}

/** One note file. `project` is `global` where the header names none. */
export function parseNote(path: string, changed: number, raw: string): Note {
  const { header, body } = split(raw)
  const inner = (header.get('labels') ?? '').replace(/^\[|\]$/g, '')
  const labels = inner.split(',').map((l) => unquote(l).toLowerCase()).filter(Boolean)
  const project = unquote(header.get('project') ?? '') || 'global'
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

/** The word a row's title starts with: none for the current project, `global:` or `<project>:` for the rest. */
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
