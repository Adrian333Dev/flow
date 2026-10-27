/**
 * window.ts: builds the restarted window from the disk and the old conversation.
 *
 * Reads the files and skills the agent named, the tickets the session works and the `context.md`
 * sections of their open questions, and the guides those files need (features/guides/situations.ts), and
 * hands the parts to first-message.ts. The old
 * window's turns stay in the session's transcript, where `flow audit` reads them.
 */
import type { EngineInterface } from 'claude-code'
import type { Entry, Restart } from '../../shared/types'
import { restartWindow, type Built } from './first-message'
import { CAP, parseSpec, sectionLines, skillBody, slice, tokensOf, type Loaded } from './loads'
import { entryFor, keyOf, keysOf } from '../guides/situations'
import { linksFromFile, wikiText, withWiki } from '../guides/skill-wiki'
import { openHandles } from '../../shared/ticket'

const bytes = (text: string) => new TextEncoder().encode(text).length
const kb = (n: number) => `${Math.max(1, Math.round(n / 1024))} KB`
const kTokens = (n: number) => `${Math.max(1, Math.round(n / 1000))}k tokens`

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

/** The skills the session lists, by the names `/skills` shows: a built-in one such as `plugin-authoring` has no file to read. */
async function listedSkills($: EngineInterface): Promise<string[]> {
  const usage = await $.session.usage({ breakdown: 'summary' }).catch(() => undefined)
  return usage?.context.breakdown?.skills?.skillFrontmatter.map((skill) => skill.name) ?? []
}

/**
 * The files and skills the agent named, read from disk, or why they cannot be loaded. Together
 * they stay under `CAP`: past it the answer names each part's size, so the agent can name fewer.
 * A skill the session lists with no file on disk goes in `invoke`, for the new agent to run itself.
 */
export async function resolveLoads($: EngineInterface, files: readonly string[], skills: readonly string[]): Promise<{ loaded: Loaded[]; invoke: string[] } | { error: string }> {
  if (!files.length && !skills.length) return { loaded: [], invoke: [] }
  const where = await whereAmI($)
  const loaded: Loaded[] = []
  const sizes: string[] = []
  for (const raw of files) {
    const spec = parseSpec(raw)
    const path = absolute(spec.path, where)
    const text = await $.fs.read(path).catch(() => undefined)
    if (text === undefined) return { error: `${raw} cannot be read` }
    const part = slice(text, spec)
    loaded.push({ type: 'file', path, ...part })
    sizes.push(`${raw} ${kTokens(tokensOf(part.text))}`)
  }
  const invoke: string[] = []
  let listed: string[] | undefined
  for (const name of skills) {
    const dir = await skillDir($, name, where)
    const text = dir === undefined ? undefined : await $.fs.read(`${dir}/SKILL.md`).catch(() => undefined)
    if (dir === undefined || text === undefined) {
      listed ??= await listedSkills($)
      if (!listed.includes(name)) return { error: `the skill ${name} is not found` }
      invoke.push(name)
      continue
    }
    loaded.push({ type: 'skill', name, dir, text: skillBody(text), links: linksFromFile(text) })
    sizes.push(`${name} ${kTokens(tokensOf(text))}`)
  }
  const total = loaded.reduce((sum, one) => sum + tokensOf(one.text), 0)
  if (total > CAP) return { error: `files and skills hold about ${kTokens(total)} (${sizes.join(', ')}), over the cap of ${kTokens(CAP)}. Name fewer, or parts: path#heading, path:from-to` }
  return { loaded, invoke }
}

/** The sections of `context.md` (its text at `path`) that the open questions of a `ticket.md` name. A handle with no section is skipped. */
function openSections(ticket: string, path: string, context: string): Loaded[] {
  const lines = context.split('\n')
  return openHandles(ticket).flatMap((handle) => {
    const found = sectionLines(context, handle)
    return found ? [{ type: 'file' as const, path, text: lines.slice(found.from - 1, found.to).join('\n'), ...found, whole: false }] : []
  })
}

/**
 * The ticket files of the badges in flight, each followed by its `context.md`: whole in groundwork
 * (`design`), where every topic stays in play, else the sections of its open questions.
 * `fw-244` is `.flow/tickets/244/ticket.md` beside its `context.md`, and a `home` ticket sits under the Flow home.
 */
async function ticketLoads($: EngineInterface, entries: readonly Entry[], where: Where, home: string): Promise<Loaded[]> {
  const found: Loaded[] = []
  for (const entry of entries.filter((e) => !e.isDone)) {
    const [, prefix, number] = /^(.+)-(\d+)$/.exec(entry.id) ?? []
    if (!prefix || !number) continue
    const base = prefix === 'home' ? home : `${where.root}/.flow`
    for (const dir of [`${base}/tickets/${Number(number)}`, `${base}/tickets/archive/${Number(number)}`]) {
      const path = `${dir}/ticket.md`
      const text = await $.fs.read(path).catch(() => undefined)
      if (text === undefined) continue
      found.push({ type: 'file', path, text, from: 1, to: text.split('\n').length, whole: true })
      const context = await $.fs.read(`${dir}/context.md`).catch(() => undefined)
      if (context !== undefined && /^design\b/i.test(entry.word)) {
        found.push({ type: 'file', path: `${dir}/context.md`, text: context, from: 1, to: context.split('\n').length, whole: true })
      } else if (context !== undefined) found.push(...openSections(text, `${dir}/context.md`, context))
      break
    }
  }
  return found
}

/**
 * The guides the window's files need (features/guides/situations.ts), each once, whole, from the Flow home.
 * A guide the window already loads whole is left out, and so is one missing on disk.
 */
async function guideLoads($: EngineInterface, files: readonly Loaded[], home: string): Promise<Loaded[]> {
  const reads = files.flatMap((one) => (one.type === 'file' ? [{ tool: 'Read', input: { file_path: one.path } }] : []))
  const have = new Set(files.flatMap((one, i) => (one.type === 'file' && one.whole ? keysOf(reads[i]!) : [])))
  const found: Loaded[] = []
  for (const call of reads) {
    for (const send of entryFor(call)?.send(call) ?? []) {
      if (send.tool !== 'Read' || have.has(keyOf(send))) continue
      have.add(keyOf(send))
      const path = `${home}/${send.path}`
      const text = await $.fs.read(path).catch(() => undefined)
      if (text !== undefined) found.push({ type: 'file', path, text, from: 1, to: text.split('\n').length, whole: true })
    }
  }
  return found
}

/**
 * The loads with each skill's wiki text after it (features/guides/skill-wiki.ts), as `skill.prompt` would add
 * it: a restart writes the `Skill` call itself, so the event never fires. Held: the window's whole
 * reads, and the text added before.
 */
async function withWikis($: EngineInterface, window: readonly Loaded[], home: string): Promise<Loaded[]> {
  const reads = new Set(window.flatMap((one) => (one.type === 'file' && one.whole ? [one.path] : [])))
  let text = ''
  const out: Loaded[] = []
  for (const one of window) {
    if (one.type !== 'skill' || !one.links?.length) {
      out.push(one)
      continue
    }
    const wiki = await wikiText(one.links, home, { text, reads }, (path) => $.fs.read(path).catch(() => undefined))
    text += `\n${wiki}`
    out.push({ ...one, text: withWiki(one.text, wiki) })
  }
  return out
}

/** True where a named file is already in the window: a whole ticket file, or a section with the same lines. */
const alreadyIn = (tickets: readonly Loaded[], one: Loaded) =>
  one.type === 'file' && tickets.some((t) => t.type === 'file' && t.path === one.path && (t.whole || (t.from === one.from && t.to === one.to)))

export type Input = {
  restart: Restart
  asked: readonly string[]
  /** The badges of the band: the tickets the session works. */
  entries: readonly Entry[]
  /** The Flow home, where a `home` ticket sits. */
  home: string
}

/** The window the restart answers the compaction with, and the line the mod logs about it. */
export async function buildWindow($: EngineInterface, input: Input): Promise<{ messages: Built[]; log: string }> {
  const where = await whereAmI($)
  const tickets = await ticketLoads($, input.entries, where, input.home)
  const named = await resolveLoads($, input.restart.files, input.restart.skills)
  const chosen = 'loaded' in named ? named.loaded.filter((one) => !alreadyIn(tickets, one)) : []
  const guides = await guideLoads($, [...tickets, ...chosen], input.home)
  const loads = (await withWikis($, [...tickets, ...guides, ...chosen], input.home)).slice(tickets.length)
  const invoke = 'invoke' in named ? named.invoke : []
  const messages = restartWindow({ tickets, loads, invoke, note: input.restart.message, asked: input.asked, manual: input.restart.manual })
  const sections = tickets.filter((one) => one.type === 'file' && !one.whole).length
  const log = [
    `restart: ${tickets.length - sections} tickets with ${sections} open sections, ${kb(tickets.reduce((sum, one) => sum + bytes(one.text), 0))}`,
    `${input.asked.length} unanswered messages`,
    `${loads.filter((one) => one.type === 'file').length} files and ${loads.filter((one) => one.type === 'skill').length} skills, ${kb(loads.reduce((sum, one) => sum + bytes(one.text), 0))}`,
    invoke.length ? `${invoke.length} skills to invoke` : '',
    'error' in named ? `loads dropped: ${named.error}` : '',
  ]
    .filter(Boolean)
    .join('; ')
  return { messages, log }
}
