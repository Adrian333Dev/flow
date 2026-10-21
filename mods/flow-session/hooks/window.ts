/**
 * window.ts: builds the restarted window from the disk and the old conversation.
 *
 * Reads the files and skills the agent named and the tickets the session works, writes the
 * dialogue file (`.flow/restarts/<session>-<window>.md`), and hands the six parts to
 * hooks/first-message.ts. The file is written before the compaction is answered: a write that
 * fails stops the restart, and the session stays as it was.
 */
import type { EngineInterface, SessionMessage } from 'claude-code'
import type { Entry, Restart } from '../types'
import { carried, dialogueOf, fileOf, MIN_USERS, segmentsOf } from './dialogue'
import { restartWindow, type Built } from './first-message'
import { CAP, parseSpec, skillBody, slice, type Loaded } from './loads'

const bytes = (text: string) => new TextEncoder().encode(text).length
const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`

/** The folders a path may be relative to: the session's, and the user's home. */
type Where = { root: string; user: string }

async function whereAmI($: EngineInterface): Promise<Where> {
  return { root: (await $.session.root()).replace(/\/+$/, ''), user: (await $.env.get('HOME')) ?? '' }
}

/** A path as the agent wrote it, absolute. */
const absolute = (path: string, where: Where) => (path.startsWith('/') ? path : path.startsWith('~/') ? `${where.user}${path.slice(1)}` : `${where.root}/${path}`)

/** The folder of a skill: `plugin:name` under the plugin's folder in `~/.claude/skills/`, a bare name in the project, then in `~/.claude/skills/`. */
async function skillDir($: EngineInterface, name: string, where: Where): Promise<string | undefined> {
  const [plugin, bare] = name.includes(':') ? (name.split(':') as [string, string]) : [undefined, name]
  const dirs = [
    ...(plugin ? [`${where.user}/.claude/skills/${plugin}/skills/${bare}`] : []),
    `${where.root}/.claude/skills/${bare}`,
    `${where.user}/.claude/skills/${bare}`,
  ]
  for (const dir of dirs) if (await $.fs.exists(`${dir}/SKILL.md`)) return dir
  return undefined
}

/**
 * The files and skills the agent named, read from disk, or why they cannot be loaded. Together
 * they stay under `CAP`: past it the answer names each part's size, so the agent can name fewer.
 */
export async function resolveLoads($: EngineInterface, files: readonly string[], skills: readonly string[]): Promise<{ loaded: Loaded[] } | { error: string }> {
  if (!files.length && !skills.length) return { loaded: [] }
  const where = await whereAmI($)
  const loaded: Loaded[] = []
  const sizes: string[] = []
  for (const raw of files) {
    const spec = parseSpec(raw)
    const path = absolute(spec.path, where)
    const text = await $.fs.read(path).catch(() => undefined)
    if (text === undefined) return { error: `${raw} cannot be read` }
    const part = slice(text, spec)
    if ('error' in part) return { error: part.error }
    loaded.push({ type: 'file', path, ...part })
    sizes.push(`${raw} ${kb(bytes(part.text))}`)
  }
  for (const name of skills) {
    const dir = await skillDir($, name, where)
    const text = dir === undefined ? undefined : await $.fs.read(`${dir}/SKILL.md`).catch(() => undefined)
    if (dir === undefined || text === undefined) return { error: `the skill ${name} is not found` }
    loaded.push({ type: 'skill', name, dir, text: skillBody(text) })
    sizes.push(`${name} ${kb(bytes(text))}`)
  }
  const total = loaded.reduce((sum, one) => sum + bytes(one.text), 0)
  if (total > CAP) return { error: `files and skills hold ${kb(total)} (${sizes.join(', ')}), over the ${kb(CAP)} cap. Name fewer, or parts: path#heading, path:from-to` }
  return { loaded }
}

/** The ticket files of the badges in flight: `fw-244` is `.flow/tickets/244/ticket.md`, and a `home` ticket sits under the Flow home. */
async function ticketLoads($: EngineInterface, entries: readonly Entry[], where: Where, home: string): Promise<Loaded[]> {
  const found: Loaded[] = []
  for (const entry of entries.filter((e) => !e.isDone)) {
    const [, prefix, number] = /^(.+)-(\d+)$/.exec(entry.id) ?? []
    if (!prefix || !number) continue
    const base = prefix === 'home' ? home : `${where.root}/.flow`
    for (const path of [`${base}/tickets/${Number(number)}/ticket.md`, `${base}/tickets/archive/${Number(number)}/ticket.md`]) {
      const text = await $.fs.read(path).catch(() => undefined)
      if (text === undefined) continue
      found.push({ type: 'file', path, text, from: 1, to: text.split('\n').length, whole: true })
      break
    }
  }
  return found
}

export type Input = {
  messages: readonly SessionMessage[]
  restart: Restart
  asked: readonly string[]
  /** The badges of the band: the tickets the session works. */
  entries: readonly Entry[]
  restartTool: string
  /** The Flow home, where a `home` ticket sits. */
  home: string
}

/**
 * The window the restart answers the compaction with, or why none can be built. The dialogue file
 * is written here, so an error before the end leaves the session as it was.
 */
export async function buildWindow($: EngineInterface, input: Input): Promise<{ messages: Built[]; log: string } | { error: string }> {
  const where = await whereAmI($)
  const session = ((await $.session.id().catch(() => '')) || 'session').slice(0, 8)
  const dir = `${where.root}/.flow/restarts`
  const taken = (await $.fs.list(dir).catch(() => []))
    .map((entry) => new RegExp(`^${session}-(\\d+)\\.md$`).exec(entry.name)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)
  const window = Math.max(0, ...taken) + 1
  const path = `${dir}/${session}-${window}.md`
  const previous = taken.includes(window - 1) ? `${dir}/${session}-${window - 1}.md` : undefined

  const now = dialogueOf(input.messages, input.restartTool)
  const earlier = previous && now.users < MIN_USERS ? segmentsOf((await $.fs.read(previous).catch(() => '')) || '') : []
  const before = carried(earlier, now.users)
  const text = fileOf([...before, { window, users: now.users, text: now.text }])
  try {
    await $.fs.write(path, text)
  } catch (error) {
    return { error: `the dialogue file ${path} could not be written: ${error instanceof Error ? error.message : String(error)}` }
  }

  const tickets = await ticketLoads($, input.entries, where, input.home)
  const named = await resolveLoads($, input.restart.files, input.restart.skills)
  const loads = 'loaded' in named ? named.loaded.filter((one) => one.type === 'skill' || !tickets.some((t) => t.type === 'file' && t.path === one.path)) : []
  const messages = restartWindow({
    dialogue: { path, text, previous },
    tickets,
    loads,
    note: input.restart.message,
    asked: input.asked,
    manual: input.restart.manual,
  })
  const log = [
    `restart window ${window}: dialogue ${kb(bytes(text))} (${now.users} messages of the user${before.length ? `, ${before.length} earlier windows carried` : ''})`,
    `${tickets.length} tickets`,
    `${loads.filter((one) => one.type === 'file').length} files and ${loads.filter((one) => one.type === 'skill').length} skills, ${kb(loads.reduce((sum, one) => sum + bytes(one.text), 0))}`,
    'error' in named ? `loads dropped: ${named.error}` : '',
  ]
    .filter(Boolean)
    .join('; ')
  return { messages, log }
}
