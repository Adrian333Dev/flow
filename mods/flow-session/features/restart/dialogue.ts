/**
 * dialogue.ts: the dialogue of the window since the last restart, as `/fresh-dialogue` copies it.
 *
 * Only the rows after the transcript's last compaction: an earlier window is finished work, and
 * copying every window since the session's start overfilled the new one (the user, 2026-11-01).
 * Read from the transcript file, where `$.session.messages()` holds at most 4,096 entries. The user's words and the agent's text word
 * for word, each tool call cut to one line, no tool result and no thinking. Left out: what the mod
 * wrote (a restarted window's head, its calls, its submitted prompts), a subagent's lines and the
 * host's own text. The shape is the archived `dialogueOf` (lab/archive/mod-restart-dialogue/).
 * `readDialogueRows` runs Node over the file first: a mod read or a command's output stops at
 * 4 MiB, and a transcript here runs to 240 MB. Nothing else here touches the host.
 */
import type { EngineInterface, SessionMessage } from 'claude-code'
import { FAKE_ID, isUsersOwn } from '../../shared/dialogue'

/** The arguments a tool line shows, the first one present. */
const SHOWN = ['file_path', 'notebook_path', 'command', 'pattern', 'skill', 'path', 'url', 'query', 'description']

/** The most of the shrunk window kept, newest last: under the 4 MiB a command's output is cut at, and far past what `MAX_BYTES` of dialogue needs. */
const SHRUNK_BYTES = 3_500_000

/**
 * Streams the transcript at `argv[1]` and prints only what `dialogueOf` reads: no subagent row, no
 * tool result, no thinking, each tool input cut to the first line of the arguments `SHOWN` names.
 * A compaction drops every row before it. Prints the newest rows that fit in `argv[2]` bytes.
 */
const SHRINK = String.raw`
const fs = require('fs'), readline = require('readline')
const shown = ${JSON.stringify(SHOWN)}
const max = Number(process.argv[2]), rows = []
let size = 0
const part = (p) => {
  if (p.type === 'text') return { type: 'text', text: p.text }
  if (p.type === 'tool_result') return { type: 'tool_result' }
  if (p.type !== 'tool_use') return undefined
  const input = {}
  for (const key of shown) if (typeof p.input?.[key] === 'string') input[key] = p.input[key].trim().split('\n')[0].slice(0, 120)
  return { type: 'tool_use', id: p.id, name: p.name, input }
}
readline.createInterface({ input: fs.createReadStream(process.argv[1]), crlfDelay: Infinity })
  .on('line', (line) => {
    let r
    try { r = JSON.parse(line) } catch { return }
    if (r.isSidechain) return
    let out
    if (r.type === 'system' && r.subtype === 'compact_boundary') {
      rows.length = 0
      size = 0
      out = { type: 'system', subtype: 'compact_boundary' }
    }
    else if (r.type === 'user' || r.type === 'assistant') {
      const c = r.message?.content
      const content = typeof c === 'string' ? c : Array.isArray(c) ? c.map(part).filter(Boolean) : []
      if (!content.length) return
      out = { type: r.type, isMeta: r.isMeta, origin: r.origin, message: { model: r.message?.model, content } }
    } else return
    const text = JSON.stringify(out)
    rows.push(text)
    size += text.length + 1
    while (size > max && rows.length > 1) size -= rows.shift().length + 1
  })
  .on('close', () => process.stdout.write(rows.join('\n')))
`

/** The transcript at `path`, shrunk to the rows the dialogue reads. Throws where it cannot be read. */
export async function readDialogueRows($: EngineInterface, path: string): Promise<string> {
  const ran = await $.process.run(['node', '-e', SHRINK, path, String(SHRUNK_BYTES)], { timeoutMs: 120_000 })
  if (ran.exitCode !== 0) throw new Error(`the transcript ${path} cannot be read: ${ran.stderr.trim().split('\n').at(-1) ?? ''}`)
  return ran.stdout
}

type Part = { type?: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }
type Row = {
  type?: string
  subtype?: string
  isSidechain?: boolean
  isMeta?: boolean
  origin?: { kind?: string }
  message?: { model?: string; content?: string | Part[] }
}

/** One line for a tool call: its name and the first line of its main argument. */
export function toolLine(use: { tool: string; input: Record<string, unknown> }): string {
  const arg = SHOWN.map((key) => use.input[key]).find((value): value is string => typeof value === 'string' && value.trim() !== '')
  const first = arg?.trim().split('\n')[0]?.slice(0, 120)
  return `[tool] ${use.tool.replace(/^mcp__/, '')}${first ? ` ${first}` : ''}`
}

/** The rows of a transcript. A line the host padded or cut is not JSON: it holds no message. */
function rowsOf(jsonl: string): Row[] {
  return jsonl.split('\n').flatMap((line) => {
    if (!line.trim()) return []
    try {
      return [JSON.parse(line) as Row]
    } catch {
      return []
    }
  })
}

const partsOf = (row: Row): Part[] => {
  const content = row.message?.content
  return typeof content === 'string' ? [{ type: 'text', text: content }] : Array.isArray(content) ? content : []
}

/** A user row as the host lists a message. A reminder the host added to the user's words is not theirs. */
function userMessage(row: Row): Pick<SessionMessage, 'role' | 'text' | 'toolResults'> {
  const parts = partsOf(row)
  const text = parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string' && !p.text.trimStart().startsWith('<system-reminder>'))
    .map((p) => p.text)
    .join('\n')
  const results = parts.filter((p) => p.type === 'tool_result')
  return { role: 'user', text: typedSkill(text) ?? text, toolResults: results.length ? (results as never) : undefined }
}

/** A skill the user typed, `/flow:execute fw-300`, from the markup the host stores it as. A command with no `<command-message>`, such as `/compact`, stays markup and is left out. */
function typedSkill(text: string): string | undefined {
  if (!text.trimStart().startsWith('<command-message>')) return undefined
  const name = /<command-name>([^<]*)<\/command-name>/.exec(text)?.[1]?.trim()
  const args = /<command-args>([\s\S]*?)<\/command-args>/.exec(text)?.[1]?.trim()
  return name ? [name, args].filter(Boolean).join(' ') : undefined
}

const INTERRUPTED = /^\[Request interrupted/

/**
 * The most a dialogue carries, in bytes: about 65k tokens at the 2.5 bytes a token loads.ts counts,
 * so a window opens near 100k at most. One window's dialogue rarely reaches it.
 */
export const MAX_BYTES = 160 * 1024

type Block = { tool: boolean; user: boolean; text: string }

const bytes = (text: string) => new TextEncoder().encode(text).length

/** The newest blocks that fit in `max` bytes, opening on a message of the user's, and whether older ones were left out. */
function newest(blocks: readonly Block[], max: number): { kept: readonly Block[]; cut: boolean } {
  let total = 0
  let from = blocks.length
  while (from > 0 && total + bytes(blocks[from - 1]!.text) + 2 <= max) total += bytes(blocks[--from]!.text) + 2
  if (from === 0) return { kept: blocks, cut: false }
  while (from < blocks.length && !blocks[from]!.user) from++
  return { kept: blocks.slice(from), cut: true }
}

/**
 * The dialogue of a transcript's last window, the number of the user's own messages in it, and
 * whether its start was cut to fit `max` bytes. After a compaction, the user rows before the agent's first
 * reply or the user's first typed message are the window the mod wrote (its opening, note,
 * carried messages, `/compact` echo), so they are skipped: a carried message is in the dialogue
 * already, where the user typed it.
 */
export function dialogueOf(jsonl: string, max = MAX_BYTES): { text: string; users: number; cut: boolean } {
  const all: Block[] = []
  let head = false
  for (const row of rowsOf(jsonl)) {
    if (row.type === 'system' && row.subtype === 'compact_boundary') {
      all.length = 0
      head = true
      continue
    }
    if (row.isSidechain || row.isMeta) continue
    if (row.type === 'user') {
      if (row.origin?.kind === 'plugin') continue
      if (head && row.origin?.kind !== 'human') continue
      const message = userMessage(row)
      if (!isUsersOwn(message) || INTERRUPTED.test(message.text.trim())) continue
      head = false
      all.push({ tool: false, user: true, text: `[user]\n${message.text.trim()}` })
      continue
    }
    if (row.type !== 'assistant' || row.message?.model === '<synthetic>') continue
    head = false
    for (const part of partsOf(row)) {
      if (part.type === 'text' && part.text?.trim()) all.push({ tool: false, user: false, text: `[agent]\n${part.text.trim()}` })
      if (part.type === 'tool_use' && part.name && !part.id?.startsWith(FAKE_ID)) all.push({ tool: true, user: false, text: toolLine({ tool: part.name, input: part.input ?? {} }) })
    }
  }
  const { kept, cut } = newest(all, max)
  const text = kept.reduce((joined, block, i) => (i === 0 ? block.text : `${joined}${block.tool && kept[i - 1]!.tool ? '\n' : '\n\n'}${block.text}`), '')
  return { text, users: kept.filter((block) => block.user).length, cut }
}
