/**
 * loads.ts: what the agent names to be loaded into the restarted window, and the calls that make it look read.
 *
 * `files` entries are a path, `path#heading` for a markdown file, or `path:from-to` for lines. The
 * mod reads them from disk and writes a `Read` call with its result into the new window, as a
 * call and a result in two messages (the form the engine stores: probed 2.1.305). An edit then
 * needs no `Read` first, inside the lines that were read.
 */
import type { SessionMessage } from 'claude-code'
import { FAKE_ID } from '../../shared/dialogue'
import type { Link } from '../guides/skill-wiki'

export type Built = Pick<SessionMessage, 'role' | 'text' | 'toolUses' | 'toolResults'>

/** Files and skills together, in tokens. Tickets stand outside it. */
export const CAP = 40_000

/** A text's tokens, estimated at 2.5 bytes a token, as measured on Flow's own files (`fw-296` question 4). 4 bytes let 40k admit 65k to 70k real tokens. */
export const tokensOf = (text: string) => Math.ceil(new TextEncoder().encode(text).length / 2.5)

/** What a `files` entry asks for. `from` and `to` are line numbers counted from 1, both included. */
export type Spec = { path: string; heading?: string; from?: number; to?: number }

export function parseSpec(raw: string): Spec {
  const text = raw.trim()
  const heading = /^(.*?\.md)#(.+)$/.exec(text)
  if (heading) return { path: heading[1]!, heading: heading[2]!.trim() }
  const range = /^(.*):(\d+)-(\d+)$/.exec(text)
  if (range) return { path: range[1]!, from: Number(range[2]), to: Number(range[3]) }
  return { path: text }
}

/** Lines as `Read` prints them: the number right-aligned in 6, a tab, the line. */
export const numbered = (text: string, from = 1): string => text.split('\n').map((line, i) => `${String(from + i).padStart(6)}\t${line}`).join('\n')

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/

/** The lines of the section `heading` names in a markdown text: from its heading to the next of the same level or higher. Fenced code holds no heading. */
export function sectionLines(text: string, heading: string): { from: number; to: number } | undefined {
  const lines = text.split('\n')
  const wanted = heading.replace(/^#+\s*/, '').trim().toLowerCase()
  let fenced = false
  let start = -1
  let level = 0
  for (const [i, line] of lines.entries()) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const found = fenced ? null : HEADING.exec(line)
    if (!found) continue
    if (start < 0) {
      if (found[2]!.toLowerCase() === wanted) [start, level] = [i, found[1]!.length]
    } else if (found[1]!.length <= level) {
      return { from: start + 1, to: i }
    }
  }
  return start < 0 ? undefined : { from: start + 1, to: lines.length }
}

/**
 * What a spec reads of a file's text: the lines and where they start. A heading the file lacks or a
 * range outside it loads the whole file: refusing would cost the old window another full request.
 */
export function slice(text: string, spec: Spec): { text: string; from: number; to: number; whole: boolean } {
  const lines = text.split('\n')
  if (spec.heading !== undefined) {
    const found = sectionLines(text, spec.heading)
    if (found) return { text: lines.slice(found.from - 1, found.to).join('\n'), ...found, whole: false }
  } else if (spec.from !== undefined && spec.to !== undefined && spec.from >= 1 && spec.to >= spec.from && spec.from <= lines.length) {
    const to = Math.min(spec.to, lines.length)
    return { text: lines.slice(spec.from - 1, to).join('\n'), from: spec.from, to, whole: false }
  }
  return { text, from: 1, to: lines.length, whole: true }
}

/** What was read of a file, ready to be written as a call. */
export type Loaded =
  | { type: 'file'; path: string; text: string; from: number; to: number; whole: boolean }
  | { type: 'skill'; name: string; dir: string; text: string; links?: Link[] }

/** A `Read` of lines `from` to `to` (the whole file when `whole`), as a call and its result. */
function readPair(id: string, file: Extract<Loaded, { type: 'file' }>): Built[] {
  const input = file.whole ? { file_path: file.path } : { file_path: file.path, offset: file.from, limit: file.to - file.from + 1 }
  return [
    { role: 'assistant', text: '', toolUses: [{ tool_use_id: id, tool: 'Read', input }] },
    { role: 'user', text: '', toolUses: [], toolResults: [{ tool_use_id: id, text: numbered(file.text, file.from), isError: false }] },
  ]
}

/** A `Skill` call and its result, which holds the skill's text where the terminal hides it. */
function skillPair(id: string, skill: Extract<Loaded, { type: 'skill' }>): Built[] {
  return [
    { role: 'assistant', text: '', toolUses: [{ tool_use_id: id, tool: 'Skill', input: { skill: skill.name } }] },
    {
      role: 'user',
      text: '',
      toolUses: [],
      toolResults: [{ tool_use_id: id, text: `Launching skill: ${skill.name}\n\nBase directory for this skill: ${skill.dir}\n\n${skill.text}`, isError: false }],
    },
  ]
}

/** The calls that make `loaded` look read, in order. */
export const callsFor = (loaded: readonly Loaded[], first = 1): Built[] =>
  loaded.flatMap((one, i) => (one.type === 'file' ? readPair(`${FAKE_ID}${first + i}`, one) : skillPair(`${FAKE_ID}${first + i}`, one)))

/** A skill file without its frontmatter. */
export function skillBody(text: string): string {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') return text
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  return end < 0 ? text : lines.slice(end + 1).join('\n').replace(/^\n+/, '')
}
