/**
 * ticket.ts: reads a ticket the way the band needs it: its name, status, word and count.
 *
 * The mod cannot require Flow's scripts, so it asks them: `flow tickets get <ids> --json` answers
 * for every id in one process, with the counts and the lines of the open work already worked out.
 * The word is the ticket's `activity`; without one, `DESIGN` while `## Questions` has an open
 * box, else `BUILD` while `## Tasks` has one, else the status.
 */
import type { EngineInterface } from 'claude-code'

export type Ticket = {
  id: string
  name: string
  status: string
  /** The word and the count, such as `BUILD 2/5`; no count where the ticket has no list. */
  word: string
}

type Count = { done: number; total: number }

/** The fields of `flow tickets get --json` that the band reads. A count is null where the ticket has no list. */
export type TicketJson = {
  id: string
  name: string
  status: string
  activity?: string | null
  questions: Count | null
  tasks: Count | null
  /** The groundwork map of an older ticket: its count and the line of its first open box. */
  map: (Count & { line: number | null }) | null
  /** The lines of `ticket.md`, from 1, of the first open task and of the first open question. */
  firstOpen: { task: number | null; question: number | null }
  /** The handles of the open questions: `1.2` is the heading of its section in `context.md`. */
  openQuestions: string[]
  path: string
}

const isOpen = (count?: Count | null) => count != null && count.done < count.total
const show = (count?: Count | null) => (count ? `${count.done}/${count.total}` : '')

/** The `ticketPrefix` in the text of a `.flow/settings.json`, or undefined when it holds none. */
export function ticketPrefix(settings: string | undefined): string | undefined {
  try {
    const word = (JSON.parse(settings ?? '') as { ticketPrefix?: unknown }).ticketPrefix
    return typeof word === 'string' && /^[a-z]{2,8}$/.test(word) ? word : undefined
  } catch {
    return undefined
  }
}

/**
 * The tickets `ids` name, read by one `flow tickets get` run from the project at `cwd`. One id
 * prints the ticket itself and several print `{ tickets, missing }`; an id with no ticket is
 * left out. Where `flow` cannot run, or prints no JSON, the answer is none.
 */
export async function readTickets($: EngineInterface, ids: readonly string[], cwd: string): Promise<TicketJson[]> {
  if (!ids.length) return []
  try {
    const ran = await $.process.run(['flow', 'tickets', 'get', ...ids, '--json'], { cwd, timeoutMs: 10000 })
    const data = JSON.parse(ran.stdout) as { error?: string; tickets?: TicketJson[] } & TicketJson
    if (data.tickets) return data.tickets
    return data.error === undefined ? [data] : []
  } catch {
    return []
  }
}

/** The ticket as the band shows it. */
export function readTicket(json: TicketJson): Ticket {
  const questions = json.questions
  const tasks = json.tasks
  const activity = json.activity?.toLowerCase()
  const word = activity || (isOpen(questions) ? 'design' : isOpen(tasks) ? 'build' : json.status)
  const count = word === 'design' ? (questions ?? json.map ?? tasks) : (tasks ?? questions ?? json.map)
  // A ticket with no list shows the word alone: a cause hunt has nothing to count.
  const shown = [word.toUpperCase(), activity || isOpen(questions) || isOpen(tasks) ? show(count) : ''].filter(Boolean)
  return { id: json.id, name: json.name, status: json.status, word: shown.join(' ') }
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

/**
 * Where the word of `ticket` points: `BUILD` at the first open task, `DESIGN` at the first open
 * question (the map's, when the ticket has none), any other word at the top of the ticket.
 */
export function target(json: TicketJson, word: string): Target {
  const top: Target = { file: 'ticket', line: 1 }
  const first = word.split(' ')[0]?.toLowerCase()
  if (first === 'build') return json.firstOpen.task ? { file: 'ticket', line: json.firstOpen.task } : top
  if (first === 'design') {
    if (json.firstOpen.question) return { file: 'ticket', line: json.firstOpen.question }
    return json.map?.line ? { file: 'map', line: json.map.line } : top
  }
  return top
}
