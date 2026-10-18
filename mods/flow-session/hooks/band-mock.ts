/**
 * band-mock.ts: the band's test scenarios, switched by `/band`.
 *
 * The scenarios are the user's to edit, in `band-scenarios.json` beside the mod's manifest.
 * `/band` reads that file on each run and draws the chosen scenario with the same code as the
 * real band. Nothing here touches a ticket or the saved record.
 */
import type { Entry } from '../types'

export type Scenario = {
  entries: Entry[]
  issues: number
  /** A row width that replaces the real one. */
  columns?: number
}

type RawBadge = { id?: unknown; slug?: unknown; word?: unknown; done?: unknown; acting?: unknown }
type Raw = { badges?: unknown; issues?: unknown; columns?: unknown }

const toEntry = (badge: RawBadge): Entry | undefined => {
  if (typeof badge.id !== 'string' || typeof badge.slug !== 'string' || typeof badge.word !== 'string') return undefined
  return {
    id: badge.id,
    name: `${badge.id}-${badge.slug}`,
    word: badge.word,
    isDone: badge.done === true,
    acting: badge.acting === true,
  }
}

/** The scenarios in the file's text, or why it could not be read. A scenario with no valid badge is left out. */
export function parseScenarios(text: string): { scenarios: Record<string, Scenario>; error?: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    return { scenarios: {}, error: `band-scenarios.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}` }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { scenarios: {}, error: 'band-scenarios.json must hold an object of scenarios.' }
  const scenarios: Record<string, Scenario> = {}
  for (const [name, value] of Object.entries(raw)) {
    const item = value as Raw
    const entries = (Array.isArray(item.badges) ? item.badges : []).map((badge) => toEntry(badge as RawBadge)).filter((entry): entry is Entry => entry !== undefined)
    if (!entries.length) continue
    scenarios[name] = {
      entries,
      issues: typeof item.issues === 'number' ? item.issues : 0,
      ...(typeof item.columns === 'number' && { columns: item.columns }),
    }
  }
  return { scenarios }
}

/** What `/band <args>` asks for. */
export type MockCommand =
  | { show: string }
  | { off: true }
  | { acting: true }
  | { list: true }
  | { help: true }

/**
 * Reads the command's arguments. A bare `/band` switches the mock off when it is on, else shows the
 * scenario last shown (or the first). `next` steps from the one shown.
 */
export function parseMock(args: string, names: readonly string[], current: string | undefined, last: string | undefined): MockCommand {
  const word = args.trim().toLowerCase()
  const first = names[0]
  if (word === 'off') return { off: true }
  if (word === 'act') return { acting: true }
  if (word === 'list') return { list: true }
  if (word === '' || word === 'on') {
    if (word === '' && current) return { off: true }
    const back = last && names.includes(last) ? last : first
    return back ? { show: back } : { help: true }
  }
  if (word === 'next') {
    const at = current ? names.indexOf(current) : -1
    const next = names[(at + 1) % names.length]
    return next ? { show: next } : { help: true }
  }
  const byNumber = /^\d+$/.test(word) ? names[Number(word) - 1] : undefined
  if (byNumber) return { show: byNumber }
  return names.includes(word) ? { show: word } : { help: true }
}

/** One line a scenario: its badges' words and what else it draws. */
export function describeScenario(name: string, scenario: Scenario): string {
  const words = scenario.entries.map((entry) => `${entry.id} ${entry.word}`).join(', ')
  const more = [scenario.issues ? `${scenario.issues} issues` : '', scenario.columns ? `${scenario.columns} columns` : ''].filter(Boolean)
  return `${name}: ${words}${more.length ? `; ${more.join(', ')}` : ''}`
}

export const usage = (names: readonly string[]) =>
  `/band switches the test band on or off. /band <number>, next, list, act (cycles: wave and spinner, wave alone, spinner alone, off), off. Scenarios: ${names.map((name, i) => `${i + 1} ${name}`).join(', ') || 'none'}.`

/** The entries as shown: with the wave forced on every open badge while `acting` is switched on. */
export const withActing = (entries: readonly Entry[], acting: boolean): Entry[] =>
  entries.map((entry) => (acting && !entry.isDone ? { ...entry, acting: true } : entry))
