/**
 * skill-wiki.ts: the wiki folder a skill links, sent with the skill's text.
 *
 * A skill names its folders in frontmatter, `metadata: { wiki: { audit: load } }`. `load` sends the
 * folder's `index.md`, `name` one line naming the folder. Each goes once per window: a window that
 * holds the line already, or a whole-file `Read` of the `index.md`, gets nothing. The `skill-wiki`
 * entry (list.ts) sends it on `skill.prompt`, and the restart window adds the same text itself (restart/window.ts).
 */
import type { Held } from '../engine/held'

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

export const loadLine = (home: string, folder: string) => `[Auto] The index of this skill's wiki folder, ${home}/wiki/${folder}/index.md:`
export const nameLine = (home: string, folder: string) => `[Auto] This skill's wiki folder: ${home}/wiki/${folder}/`

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
