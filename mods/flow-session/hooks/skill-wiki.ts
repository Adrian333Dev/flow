/**
 * skill-wiki.ts: the wiki folder a skill links, sent with the skill's text.
 *
 * A skill names its folders in frontmatter, `metadata: { wiki: { audit: load } }`. `load` sends the
 * folder's `index.md`, `name` one line naming the folder. Each goes once per window: a window that
 * holds the line already, or a whole-file `Read` of the `index.md`, gets nothing. The hook is
 * `skill.prompt` (hooks/register.ts), and the restart window adds the same text itself (hooks/window.ts).
 *
 * Left open, both rare: a skill preloaded into a subagent, and a typed skill while a background
 * subagent's `Skill` call is mid-flight, are tested against the main window.
 */
import type { EngineInterface } from 'claude-code'

export type Link = { folder: string; mode: 'load' | 'name' }

const FOLDER = /^[\w.-]+$/

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** The folders a skill's frontmatter links, as the engine hands it. A folder or mode out of shape is skipped. */
export function linksOf(frontmatter: unknown): Link[] {
  const metadata = isObject(frontmatter) ? frontmatter.metadata : undefined
  const wiki = isObject(metadata) ? metadata.wiki : undefined
  if (!isObject(wiki)) return []
  return Object.entries(wiki).flatMap(([folder, mode]) => (FOLDER.test(folder) && (mode === 'load' || mode === 'name') ? [{ folder, mode }] : []))
}

/** A `key: { a: b, c: d }` value, as a map. */
const inline = (value: string): Record<string, unknown> | undefined => {
  const body = /^\{(.*)\}$/.exec(value.trim())?.[1]
  if (body === undefined) return undefined
  const map: Record<string, unknown> = {}
  for (const pair of body.split(',')) {
    const [key, ...rest] = pair.split(':')
    if (key?.trim() && rest.length) map[key.trim()] = rest.join(':').trim()
  }
  return map
}

/** The same links, read from a `SKILL.md`'s text: `metadata:` then `wiki:` as nested blocks, or `wiki:` written inline. */
export function linksFromFile(text: string): Link[] {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') return []
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  const head = lines.slice(1, end < 0 ? lines.length : end)
  const start = head.findIndex((line) => /^metadata:\s*$/.test(line))
  if (start < 0) return []
  const indent = (line: string) => /^ */.exec(line)![0].length
  const wiki: Record<string, unknown> = {}
  let inWiki = -1
  for (const line of head.slice(start + 1)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (indent(line) === 0) break
    const [, key, value] = /^\s*([^:\s]+):\s*(.*)$/.exec(line) ?? []
    if (!key) continue
    if (inWiki >= 0 && indent(line) > inWiki) wiki[key] = value?.trim()
    else if (key === 'wiki') {
      const map = inline(value ?? '')
      if (map) Object.assign(wiki, map)
      inWiki = map ? -1 : indent(line)
    } else inWiki = -1
  }
  return linksOf({ metadata: { wiki } })
}

export const loadLine = (home: string, folder: string) => `[Added by Flow] The index of this skill's wiki folder, ${home}/wiki/${folder}/index.md:`
export const nameLine = (home: string, folder: string) => `[Added by Flow] This skill's wiki folder: ${home}/wiki/${folder}/`

/** What a window already holds: its text, and the paths it read whole. */
export type Held = { text: string; reads: ReadonlySet<string> }

/**
 * The text a skill's links add after its own, empty where the window holds each already.
 * A `load` is held by its line or a whole `Read` of its `index.md`, a `name` by either line or that
 * `Read`. A missing `index.md` sends the name line. The text added so far counts as held.
 */
export async function wikiText(links: readonly Link[], home: string, held: Held, read: (path: string) => Promise<string | undefined>): Promise<string> {
  const parts: string[] = []
  const holds = (line: string) => held.text.includes(line) || parts.some((part) => part.includes(line))
  for (const { folder, mode } of links) {
    const index = `${home}/wiki/${folder}/index.md`
    if (held.reads.has(index) || holds(loadLine(home, folder))) continue
    const text = mode === 'load' ? await read(index).catch(() => undefined) : undefined
    if (text !== undefined) parts.push(`${loadLine(home, folder)}\n\n${text.trimEnd()}`)
    else if (!holds(nameLine(home, folder))) parts.push(nameLine(home, folder))
  }
  return parts.join('\n\n')
}

/** A skill's text with its wiki text after it. */
export const withWiki = (text: string, wiki: string) => (wiki ? `${text.trimEnd()}\n\n${wiki}` : text)

type Block = { type: string; [field: string]: unknown }

const textOf = (block: Block): string => {
  if (typeof block.text === 'string') return block.text
  if (typeof block.content === 'string') return block.content
  if (Array.isArray(block.content)) return (block.content as Block[]).map(textOf).join('\n')
  return ''
}

/** What a window holds, by `Held`: every block's text, and the paths of its answered whole-file reads. */
export function heldIn(messages: readonly { content: string | readonly Block[] }[]): Held {
  const blocks = messages.flatMap((m) => (typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content))
  const answered = new Set(blocks.flatMap((b) => (b.type === 'tool_result' && typeof b.tool_use_id === 'string' ? [b.tool_use_id] : [])))
  const reads = new Set<string>()
  for (const b of blocks) {
    if (b.type !== 'tool_use' || b.name !== 'Read' || !answered.has(b.id as string)) continue
    const input = (b.input ?? {}) as { file_path?: unknown; offset?: number; limit?: number }
    if (typeof input.file_path === 'string' && input.limit === undefined && (input.offset === undefined || input.offset <= 1)) reads.add(input.file_path)
  }
  return { text: blocks.map(textOf).join('\n'), reads }
}

/** What the window of an agent holds: the main loop's where `agentId` is none. A window the session cannot read holds nothing. */
export async function heldBy($: EngineInterface, agentId: string | undefined): Promise<Held> {
  const messages = agentId === undefined ? await $.session.messages({ as: 'api' }) : await $.session.messages({ as: 'api', agentId })
  return Array.isArray(messages) ? heldIn(messages as { content: Block[] }[]) : { text: '', reads: new Set() }
}
