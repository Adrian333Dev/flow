/**
 * ticket.ts: reads a ticket's text the way the band needs it: its name, status, word and count.
 *
 * The mod cannot require Flow's scripts, so `STEP`, `QUESTION` and the counting repeat
 * `scripts/lib/tickets/store.js`. The word is the ticket's `activity:`; without one,
 * `DESIGN` while `## Questions` has an open box, else `BUILD` while `## Tasks` has one,
 * else the status.
 */

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

/** The frontmatter fields and the body after them. */
function split(text: string): { fields: Record<string, string>; body: string } {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') return { fields: {}, body: text }
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (end === -1) return { fields: {}, body: text }
  const fields: Record<string, string> = {}
  for (const line of lines.slice(1, end)) {
    const at = line.indexOf(':')
    if (at > 0) fields[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^["']|["']$/g, '')
  }
  return { fields, body: lines.slice(end + 1).join('\n') }
}

const isOpen = (count?: Count) => count !== undefined && count.done < count.total
const show = (count?: Count) => (count ? `${count.done}/${count.total}` : '')

/**
 * The ticket in `text` (a `ticket.md`), or undefined where it has no id or status.
 * `map` is the text of its `groundwork/map.md`, counted for a design ticket with no questions of its own.
 */
export function readTicket(text: string, map?: string): Ticket | undefined {
  const { fields, body } = split(text)
  const { id, status } = fields
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

/** The ticket ids a command or a path names, such as `fw-137`. */
export const idsIn = (text: string): string[] => [...new Set(text.match(/\b[a-z]+-\d+\b/g) ?? [])]
