/**
 * ticket.ts: reads a ticket's text the way the band needs it: its name, status, word and count.
 *
 * The mod cannot require Flow's scripts, so `STEP`, `QUESTION` and the counting repeat
 * `scripts/lib/tickets/store.js`. The word is the ticket's `activity:`; without one,
 * `DESIGN` while `## Questions` has an open box, else `BUILD` while `## Tasks` has one,
 * else the status.
 */
import { frontmatter } from './frontmatter'

export type Ticket = {
  id: string
  name: string
  status: string
  /** The word and the count, such as `BUILD 2/5`; no count where the ticket has no list. */
  word: string
}

type Count = { done: number; total: number }

// The same patterns as the scripts: a step sits at the left margin, a question at any indent.
const STEP = /^ {0,3}(?:\d+[.)]|[-*])\s+\[([ xX])\]/
const QUESTION = /^\s*(?:\d+[.)]|[-*])\s+\[([ xX])\]/

/** Ticked and total boxes of a text. A commented-out box is not a box. */
function countBoxes(text: string | undefined, pattern: RegExp): Count | undefined {
  if (text === undefined) return undefined
  const boxes = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map((line) => pattern.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
  return boxes.length ? { done: boxes.filter((m) => m[1] !== ' ').length, total: boxes.length } : undefined
}

/** The text under `## <heading>` up to the next `##` heading, or undefined where there is none. */
function section(body: string, heading: string): string | undefined {
  const lines = body.split('\n')
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`)
  if (start === -1) return undefined
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^## /.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join('\n')
}

/** The frontmatter fields, unquoted, and the body after them. */
function split(text: string): { fields: Record<string, string>; body: string } {
  const { fields, body } = frontmatter(text)
  const unquoted = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.replace(/^["']|["']$/g, '')]))
  return { fields: unquoted, body }
}

const isOpen = (count?: Count) => count !== undefined && count.done < count.total
const show = (count?: Count) => (count ? `${count.done}/${count.total}` : '')

/** The `ticketPrefix` in the text of a `.flow/settings.json`, or undefined when it holds none. */
export function ticketPrefix(settings: string | undefined): string | undefined {
  try {
    const word = (JSON.parse(settings ?? '') as { ticketPrefix?: unknown }).ticketPrefix
    return typeof word === 'string' && /^[a-z]{2,8}$/.test(word) ? word : undefined
  } catch {
    return undefined
  }
}

/** The full id of a stored one: `9` is `fw-9` in a project whose prefix is `fw`; `fw-9` and `home-3` are as they are. */
const fullId = (stored: string, prefix?: string): string => (/^\d+$/.test(stored) && prefix ? `${prefix}-${Number(stored)}` : stored)

/**
 * The ticket in `text` (a `ticket.md`), or undefined where it has no id or status.
 * `map` is the text of its `groundwork/map.md`, counted for a design ticket with no questions of its own.
 * `prefix` is the project's `ticketPrefix`: the file holds the number alone.
 */
export function readTicket(text: string, map?: string, prefix?: string): Ticket | undefined {
  const { fields, body } = split(text)
  const { status } = fields
  const id = fields.id ? fullId(fields.id, prefix) : undefined
  if (!id || !status) return undefined
  const questions = countBoxes(section(body, 'Questions'), QUESTION)
  const tasks = countBoxes(section(body, 'Tasks'), STEP)
  const activity = fields.activity?.toLowerCase()
  const word = activity || (isOpen(questions) ? 'design' : isOpen(tasks) ? 'build' : status)
  const designs = word === 'design'
  const count = designs
    ? (questions ?? countBoxes(map, QUESTION) ?? tasks)
    : (tasks ?? questions ?? countBoxes(map, QUESTION))
  // A ticket with no list shows the word alone: a cause hunt has nothing to count.
  const shown = [word.toUpperCase(), activity || isOpen(questions) || isOpen(tasks) ? show(count) : ''].filter(Boolean)
  return { id, name: fields.title ? `${id}-${fields.title}` : id, status, word: shown.join(' ') }
}

/** The handles of the open questions in a `ticket.md`: `- [ ] 1.2: …` is `1.2`, the heading of its section in `context.md`. A question with no handle has none. */
export function openHandles(text: string): string[] {
  const questions = section(split(text).body, 'Questions')?.replace(/<!--[\s\S]*?-->/g, '') ?? ''
  return questions
    .split('\n')
    .map((line) => /^\s*(?:\d+[.)]|[-*])\s+\[ \]\s+`?([^\s:`]+)`?:/.exec(line)?.[1])
    .filter((handle): handle is string => handle !== undefined)
}

/** The ticket ids a command names, such as `fw-137`. */
export const idsIn = (text: string): string[] => [...new Set(text.match(/\b[a-z]+-\d+\b/g) ?? [])]

/** The ticket id a path inside `tickets/` names: `tickets/137/ticket.md` is `fw-137` under the prefix `fw`. */
export function idsInPath(file: string, prefix?: string): string[] {
  const found = /\/tickets\/(?:archive\/)?(\d+)(?=[-/]|$)/.exec(file)
  return found && prefix ? [`${prefix}-${Number(found[1])}`] : []
}

/** The ticket ids a command picks up with `flow tickets start <id>`, in the order it names them. `flow tickets get <id>` only reads. */
export const startedIn = (command: string): string[] => [...command.matchAll(/\b(?:flow\s+tickets|fw)\s+start\s+([a-z]+-\d+)\b/g)].map((match) => match[1] as string)

/** Where a click on a badge's word lands: a file of the ticket and a line in it, counted from 1. */
export type Target = { file: 'ticket' | 'map'; line: number }

/** The line of the first open box in `text`, or in the lines under `## <heading>` when one is named. Commented-out lines are skipped. */
function firstOpen(text: string, pattern: RegExp, heading?: string): number | undefined {
  const lines = text.split('\n')
  let inside = heading === undefined
  let commented = false
  for (const [at, line] of lines.entries()) {
    if (heading !== undefined && /^## /.test(line)) inside = line.trim() === `## ${heading}`
    if (commented || line.includes('<!--')) commented = !line.includes('-->')
    else if (inside && pattern.exec(line)?.[1] === ' ') return at + 1
  }
  return undefined
}

/**
 * Where the word of `ticket` points: `BUILD` at the first open task, `DESIGN` at the first open
 * question (the map's, when the ticket has none), any other word at the top of the ticket.
 */
export function target(ticket: string, map: string | undefined, word: string): Target {
  const top: Target = { file: 'ticket', line: 1 }
  const first = word.split(' ')[0]?.toLowerCase()
  if (first === 'build') {
    const line = firstOpen(ticket, STEP, 'Tasks')
    return line ? { file: 'ticket', line } : top
  }
  if (first === 'design') {
    const line = firstOpen(ticket, QUESTION, 'Questions')
    if (line) return { file: 'ticket', line }
    const inMap = map === undefined ? undefined : firstOpen(map, QUESTION)
    return inMap ? { file: 'map', line: inMap } : top
  }
  return top
}
