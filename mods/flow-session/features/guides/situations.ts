/**
 * situations.ts: the guides sent by situation (`docs/spec/rules.md` `### Guides sent by situation`).
 *
 * One list of entries, each saying which tool calls it matches and which calls it sends. The engine,
 * run by register.ts on every model response (`turn.step`), adds what an entry sends to that same
 * response: a `Read` of a guide beside a read of a matched file, the guide's `Read` in place of an
 * `Edit` or `Write` of one, which it holds back with every call after it, and a group's `--help`
 * beside the group's first command. It never adds what the window or the response already holds,
 * whoever made the call. Each added call's result is headed `[Added by Flow]`.
 */
import type { EngineInterface } from 'claude-code'
import { type Block, windowMessages } from '../../shared/window'
import { CODE_EXTENSIONS, filesWritten } from './shell-write'

/** A tool call as the response holds it: its tool and parsed arguments. */
export type Call = { tool: string; input: Record<string, unknown> }

/** A call an entry sends: a guide to read, or a command to run. */
export type Send = { tool: 'Read'; path: string } | { tool: 'Bash'; command: string; description: string }

export type Entry = {
  id: string
  /** True where the entry covers the call. */
  when: (call: Call) => boolean
  /** The calls the entry sends for it. Paths are relative to the Flow home. */
  send: (call: Call) => Send[]
  /** What the sent calls are for, ending the header of each one's result. */
  why: (call: Call) => string
  /** True where a covered call that is no `Edit` or `Write` is held back too, until its guides are read. */
  holds?: boolean
}

const pathOf = (call: Call) => (typeof call.input.file_path === 'string' ? call.input.file_path : '')
const commandOf = (call: Call) => (call.tool === 'Bash' && typeof call.input.command === 'string' ? call.input.command : '')
const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1)
const touches = (call: Call) => ['Read', 'Edit', 'Write'].includes(call.tool) && pathOf(call) !== ''
const markdown = (call: Call) => touches(call) && pathOf(call).endsWith('.md')
const code = (call: Call) => touches(call) && new RegExp(`\\.(${CODE_EXTENSIONS.join('|')})$`).test(pathOf(call))
/** Every guide an entry sends, in Flow's `guides/`. */
const GUIDES = ['style.md', 'write-loaded-files.md', 'write-rules.md', 'write-spec.md', 'write-tickets.md', 'knowledge.md', 'write-code.md'] as const
type Guide = (typeof GUIDES)[number]
const guides = (...names: Guide[]): Send[] => names.map((name) => ({ tool: 'Read', path: `guides/${name}` }))
const guideWhy = (what: string) => () => `Guide for ${what}.`

/** The `flow` and `util` groups a command runs, by the word after the program's name. */
export function groupsOf(command: string): string[] {
  const found = new Set<string>()
  for (const m of command.matchAll(/(?:^|[\s;&|(`])(flow\s+(?:notes|audit)|util\s+[a-z][\w-]*)\b/g)) found.add(m[1]!.replace(/\s+/, ' '))
  return [...found]
}

/** True for a command that is a group's own help: `flow audit --help`, `util fs -h`. */
const helpOf = (command: string, group: string) => new RegExp(`^\\s*${group.replace(' ', '\\s+')}\\s+(--help|-h)\\s*$`).test(command)

/** The guides an `Edit` of each file a Bash command writes takes, once each. A relative path gets the leading `/` the entries test. */
function shellWriteGuides(call: Call): Send[] {
  const sends = new Map<string, Send>()
  for (const file of filesWritten(commandOf(call))) {
    const edit: Call = { tool: 'Edit', input: { file_path: file.startsWith('/') ? file : `/${file}` } }
    for (const send of entryFor(edit)?.send(edit) ?? []) sends.set(keyOf(send), send)
  }
  return [...sends.values()]
}

/** The list, first match wins. The guides themselves send nothing when read. */
export const ENTRIES: readonly Entry[] = [
  {
    id: 'ticket',
    when: (call) => touches(call) && /\/tickets\//.test(pathOf(call)),
    send: () => guides('write-tickets.md'),
    why: guideWhy("a ticket's files"),
  },
  {
    id: 'knowledge',
    when: (call) =>
      (call.tool === 'Write' && pathOf(call).endsWith('/SKILL.md')) ||
      (['Edit', 'Write'].includes(call.tool) && pathOf(call).endsWith('/.mcp.json')) ||
      /(?:^|[\s;&|(`])claude\s+(?:plugin\s+(?:install|enable)|mcp\s+add)\b/.test(commandOf(call)),
    send: (call) => (call.tool === 'Bash' || !markdown(call) ? guides('knowledge.md') : guides('style.md', 'write-loaded-files.md', 'knowledge.md')),
    why: guideWhy('adding a skill, a plugin or an MCP server'),
    holds: true,
  },
  {
    id: 'rule-file',
    when: (call) => markdown(call) && (/\/CLAUDE(\.local)?\.md$/.test(pathOf(call)) || /\/\.claude\/rules\//.test(pathOf(call))),
    send: () => guides('style.md', 'write-loaded-files.md', 'write-rules.md'),
    why: guideWhy('rule files'),
  },
  {
    id: 'loaded-file',
    when: (call) => markdown(call) && /\/skills\/|\/\.claude\/(commands|agents|output-styles)\/|\/references\/|\/guides\/|\/prompts\//.test(pathOf(call)),
    send: () => guides('style.md', 'write-loaded-files.md'),
    why: guideWhy('files an agent loads'),
  },
  {
    id: 'spec',
    when: (call) => markdown(call) && /\/docs\/spec\//.test(pathOf(call)),
    send: () => guides('style.md', 'write-spec.md'),
    why: guideWhy('spec files'),
  },
  {
    id: 'markdown',
    when: markdown,
    send: () => guides('style.md'),
    why: guideWhy('markdown'),
  },
  {
    id: 'code',
    when: code,
    send: () => guides('write-code.md'),
    why: guideWhy('code'),
  },
  {
    id: 'shell-write',
    when: (call) => shellWriteGuides(call).length > 0,
    send: shellWriteGuides,
    why: guideWhy('files written from the shell'),
    holds: true,
  },
  {
    id: 'command',
    when: (call) => groupsOf(commandOf(call)).some((group) => !helpOf(commandOf(call), group)),
    send: (call) =>
      groupsOf(commandOf(call))
        .filter((group) => !helpOf(commandOf(call), group))
        .map((group) => ({ tool: 'Bash', command: `${group} --help`, description: `List the ${group} commands` })),
    why: (call) => `The ${groupsOf(commandOf(call)).join(', ')} commands.`,
  },
]

/** True where a path is one of the guides: its own `guides/<name>`, in the Flow home or a checkout of Flow. */
const isGuide = (path: string) => GUIDES.some((guide) => path.endsWith(`/guides/${guide}`))

/** The entry that covers a call, or undefined. A read of a guide itself is covered by none. */
export function entryFor(call: Call): Entry | undefined {
  if (call.tool === 'Read' && isGuide(pathOf(call))) return undefined
  return ENTRIES.find((entry) => entry.when(call))
}

/** True for a call held back while a guide it needs is missing: a change to a file, or a call its entry holds. */
const holds = (call: Call, entry: Entry | undefined) => call.tool === 'Edit' || call.tool === 'Write' || entry?.holds === true

/** The key a sent call is known by: a guide by its path under the home, a command by its text. */
export const keyOf = (send: Send) => (send.tool === 'Read' ? `read:${send.path}` : `bash:${send.command}`)

/** The keys a call already in the window or the response stands for: a whole-file read of a guide, a group's help. */
export function keysOf(call: Call): string[] {
  if (call.tool === 'Read') {
    const { offset, limit } = call.input as { offset?: number; limit?: number }
    if (limit !== undefined || (offset !== undefined && offset > 1)) return []
    return GUIDES.filter((guide) => pathOf(call).endsWith(`/guides/${guide}`)).map((guide) => `read:guides/${guide}`)
  }
  const command = commandOf(call)
  return groupsOf(command)
    .filter((group) => helpOf(command, group))
    .map((group) => `bash:${group} --help`)
}

/** The keys the window holds: each call it answered, by `keysOf`. */
export function windowKeys(messages: readonly { content: readonly Block[] }[]): Set<string> {
  const answered = new Set<string>()
  for (const m of messages) for (const b of m.content) if (b.type === 'tool_result' && typeof b.tool_use_id === 'string') answered.add(b.tool_use_id)
  const keys = new Set<string>()
  for (const m of messages)
    for (const b of m.content)
      if (b.type === 'tool_use' && typeof b.id === 'string' && answered.has(b.id) && typeof b.name === 'string')
        for (const key of keysOf({ tool: b.name, input: (b.input ?? {}) as Record<string, unknown> })) keys.add(key)
  return keys
}

/** A call the engine adds, with the header its result opens with. */
export type Added = { send: Send; header: string }

/** What the engine does to one response. */
export type Plan = {
  /** The positions, in the response's calls, of the calls held back: the first held write and every call after it. */
  held: number[]
  added: Added[]
  /** Headers for calls the model made itself, by position: a held write whose guide the model already reads. */
  notes: Map<number, string>
}

export const HEADER = '[Added by Flow]'

/** The calls named in a header, `Edit of style.md`, `Bash (npm test)`. */
const named = (call: Call) => (touches(call) ? `${call.tool} of ${nameOf(pathOf(call))}` : call.tool === 'Bash' ? `Bash (${commandOf(call).split('\n')[0]!.slice(0, 60)})` : call.tool)

/** The line saying a write was held back, and what was held with it. */
function heldLine(calls: readonly Call[], from: number): string {
  const after = calls.slice(from + 1).map(named)
  const also = after.length ? ` Held with it: ${after.join(', ')}.` : ''
  const effect = touches(calls[from]!) ? 'so the file is unchanged' : 'so it did not run'
  return `Your ${named(calls[from]!)} was held back, ${effect}.${also} Read this guide, then make ${after.length ? 'them' : 'it'} again.`
}

/**
 * The plan for one response's calls, given the keys the window holds. A write is held back when a
 * guide its entry sends is missing from the window: the model wrote it without the guide in view.
 */
export function planFor(calls: readonly Call[], inWindow: ReadonlySet<string>): Plan {
  const entries = calls.map(entryFor)
  const firstHeld = calls.findIndex((call, i) => holds(call, entries[i]) && entries[i]?.send(call).some((s) => !inWindow.has(keyOf(s))))
  const kept = firstHeld === -1 ? calls.length : firstHeld
  const have = new Set(inWindow)
  const ownAt = new Map<string, number>()
  calls.slice(0, kept).forEach((call, i) => keysOf(call).forEach((key) => (have.add(key), ownAt.has(key) || ownAt.set(key, i))))
  const added: Added[] = []
  const notes = new Map<number, string>()
  const upTo = firstHeld === -1 ? kept : firstHeld + 1
  for (let i = 0; i < upTo; i++) {
    const entry = entries[i]
    if (!entry) continue
    const call = calls[i]!
    const sends = entry.send(call)
    let why = entry.why(call)
    if (i === firstHeld) {
      why = heldLine(calls, i)
      // A guide the model reads in this same response carries the line where none is added.
      const own = sends.map((s) => ownAt.get(keyOf(s))).find((at) => at !== undefined)
      if (own !== undefined && sends.every((s) => have.has(keyOf(s)))) notes.set(own, `${HEADER} ${why}`)
    }
    for (const send of sends) {
      if (have.has(keyOf(send))) continue
      have.add(keyOf(send))
      added.push({ send, header: `${HEADER} ${why}` })
      if (i === firstHeld) why = entry.why(call)
    }
  }
  return { held: firstHeld === -1 ? [] : calls.map((_, i) => i).slice(firstHeld), added, notes }
}

/** The tool input of a sent call, its guide path made absolute under the Flow home. */
export const inputOf = (send: Send, home: string): Record<string, unknown> =>
  send.tool === 'Read' ? { file_path: `${home}/${send.path}` } : { command: send.command, description: send.description }

/** The keys the window of the agent that made the step holds. A window the session cannot read holds none. */
export async function windowOf($: EngineInterface, agentId: string | undefined): Promise<Set<string>> {
  return windowKeys((await windowMessages($, agentId)) as { content: Block[] }[])
}

/** A tool call as it streamed: its block, id, name and the JSON of its arguments. */
export type Streamed = { index: number; id: string; name: string; json: string }

/** What the step's hook does: the blocks it drops, the calls it adds, and the header of each call's result by id. */
export type Steering = { drop: Set<number>; add: { name: string; input: Record<string, unknown> }[]; headers: Map<string, string>; addedIds: string[] }

/**
 * The steering for one response's calls. Reads the window only when an entry covers a call. A call
 * whose arguments do not parse, as after a cut-off response, is passed on untouched.
 */
export async function steer($: EngineInterface, agentId: string | undefined, streamed: readonly Streamed[]): Promise<Steering | undefined> {
  const parsed = streamed.flatMap((s) => {
    try {
      const input = JSON.parse(s.json || '{}') as unknown
      return input && typeof input === 'object' ? [{ s, call: { tool: s.name, input: input as Record<string, unknown> } }] : []
    } catch {
      return []
    }
  })
  if (!parsed.some(({ call }) => entryFor(call))) return undefined
  const plan = planFor(
    parsed.map(({ call }) => call),
    await windowOf($, agentId),
  )
  if (!plan.held.length && !plan.added.length && !plan.notes.size) return undefined
  const home = (await $.env.get('FLOW_HOME')) ?? `${await $.env.get('HOME')}/.flow`
  const headers = new Map<string, string>()
  for (const [at, header] of plan.notes) headers.set(parsed[at]!.s.id, header)
  const addedIds = plan.added.map(() => `toolu_flow${Math.random().toString(36).slice(2, 14)}`)
  plan.added.forEach((a, i) => headers.set(addedIds[i]!, a.header))
  const from = plan.held.length ? parsed[plan.held[0]!]!.s.index : Infinity
  return {
    drop: new Set(streamed.filter((s) => s.index >= from).map((s) => s.index)),
    add: plan.added.map((a) => ({ name: a.send.tool, input: inputOf(a.send, home) })),
    headers,
    addedIds,
  }
}
