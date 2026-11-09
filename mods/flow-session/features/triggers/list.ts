/**
 * list.ts: every trigger, the only file to edit to add one (`docs/spec/rules.md` `### Guides sent by situation`).
 *
 * A trigger adds text or calls for the agent when a situation holds. Each entry names its moment,
 * `on`, and an engine in `engine/` runs the entries of that moment:
 *
 * - `response` (engine/response.ts): as a response streams, for each tool call `when` covers, the calls
 *   `send` names go into the same response: a guide's `Read`, a group's `--help`. A held call (any
 *   `Edit` or `Write`, or `holds`) waits until its guides are read. The restart window reads these too.
 * - `result` and `mention` (engine/result.ts): once a tool's result is in, or a file is `@` mentioned,
 *   `add` returns text for the result's `context`.
 * - `skill` (engine/skill.ts): as a skill starts, `add` returns text after the skill's own.
 *
 * Whether the window already holds a thing is tested by the engine for the guide entries, and by
 * `add` against the `held` it is handed for the others. The checks an entry calls live in `checks/`,
 * the text it builds in `sends/`.
 *
 * Beside the list, engine/message.ts scores the chat on each message the user sends (`checks/chat.ts`),
 * and sends a likely-changed file the guides its entry here names. Every engine logs what it sends
 * (log.ts), which `/flow:triggers-check` and `/flow:audit` read against the transcript.
 */
import { groupsOf, helpOf } from './checks/commands'
import { type Call, code, commandOf, inEditLog, markdown, pathOf, touches } from './checks/paths'
import { filesShown } from './checks/shell-read'
import { filesWritten } from './checks/shell-write'
import type { Held } from './engine/held'
import { editLogReminder } from './sends/edit-log'
import { labelsText, ticketText } from './sends/file-context'
import { attachGuides, changeLine, guides, isGuide, keyOf, type Send } from './sends/guides'
import { linksOf, wikiText } from './sends/skill-wiki'

export type { Call } from './checks/paths'
export type { Send } from './sends/guides'

/** A trigger on the tool calls of a response. */
export type CallEntry = {
  id: string
  on: 'response'
  /** True where the entry covers the call. */
  when: (call: Call) => boolean
  /** The calls the entry sends for it. Paths are relative to the Flow home. */
  send: (call: Call) => Send[]
  /** What the sent calls are for, ending the header of each one's result. */
  why: (call: Call) => string
  /** True where a covered call that is no `Edit` or `Write` is held back too, until its guides are read. */
  holds?: boolean
  /** True where the entry matches beside the first match, never in its place. */
  also?: boolean
}

/** What a `result` or `mention` entry is handed. Each lookup runs once, and only when asked. */
export type ResultInput = {
  call: Call
  agentId: string | undefined
  /** The result's text, where the tool returns one: a `Bash` output. */
  text?: string
  /** The keys of the guides and help calls the window holds. */
  keys: () => Promise<ReadonlySet<string>>
  held: () => Promise<Held>
  home: () => Promise<string>
  /** A file's text, none where it is missing. */
  read: (path: string) => Promise<string | undefined>
  /** The JSON a `flow` command prints with `--json`, none where it fails. */
  flow: (args: string[], cwd: string) => Promise<unknown>
}

/** A trigger on a tool's result, or on an `@` mention, which is handed as a `Read` of the file. */
export type ResultEntry = {
  id: string
  on: readonly ('result' | 'mention')[]
  /** The tools whose results it sees. */
  tools: readonly string[]
  /** The texts to add to the result's `context`, none where the situation does not hold or the window has them. */
  add: (input: ResultInput) => Promise<string[]>
}

/** A trigger on a skill starting. */
export type SkillEntry = {
  id: string
  on: 'skill'
  /** The text to add after the skill's, empty for none. */
  add: (input: { frontmatter: unknown; held: () => Promise<Held>; home: () => Promise<string>; read: (path: string) => Promise<string | undefined> }) => Promise<string>
}

export type Trigger = CallEntry | ResultEntry | SkillEntry

const guideWhy = (call: Call) => {
  const file = pathOf(call) || filesWritten(commandOf(call))[0]
  return file ? changeLine(file) : 'Before adding a skill, a plugin or an MCP server, follow this guide.'
}

/** The guides an `Edit` of each file a Bash command writes takes, once each. A relative path gets the leading `/` the entries test. */
function shellWriteGuides(call: Call): Send[] {
  const sends = new Map<string, Send>()
  for (const file of filesWritten(commandOf(call))) {
    const edit: Call = { tool: 'Edit', input: { file_path: file.startsWith('/') ? file : `/${file}` } }
    for (const entry of entriesFor(edit)) for (const send of entry.send(edit)) sends.set(keyOf(send), send)
  }
  return [...sends.values()]
}

/** The guides the files take, each once, as an `Edit` of each would send them. A relative path gets the leading `/` the entries test. */
export function guidesFor(files: readonly string[]): { file: string; guide: string }[] {
  const out = new Map<string, { file: string; guide: string }>()
  for (const file of files) {
    const edit: Call = { tool: 'Edit', input: { file_path: file.startsWith('/') ? file : `/${file}` } }
    for (const send of entryFor(edit)?.send(edit) ?? [])
      if (send.tool === 'Read' && !out.has(keyOf(send))) out.set(keyOf(send), { file, guide: send.path.replace(/^references\/guides\//, '') })
  }
  return [...out.values()]
}

/** The text of a file's `Read` or mention, sent where the window lacks the exact text. */
const once = (build: (input: ResultInput, path: string) => Promise<string | undefined>) => async (input: ResultInput) => {
  const path = pathOf(input.call)
  const text = path ? await build(input, path) : undefined
  return text && !(await input.held()).text.includes(text) ? [text] : []
}

/** The list. Among the `response` entries the first match wins. The guides themselves send nothing when read. */
export const TRIGGERS: readonly Trigger[] = [
  {
    id: 'ticket',
    on: 'response',
    when: (call) => touches(call) && /\/tickets\//.test(pathOf(call)),
    send: () => guides('write-tickets.md'),
    why: guideWhy,
  },
  {
    id: 'knowledge',
    on: 'response',
    when: (call) =>
      (['Edit', 'Write'].includes(call.tool) && pathOf(call).endsWith('/.mcp.json')) ||
      /(?:^|[\s;&|(`])claude\s+(?:plugin\s+(?:install|enable)|mcp\s+add)\b/.test(commandOf(call)),
    send: () => guides('knowledge.md'),
    why: guideWhy,
    holds: true,
  },
  {
    id: 'agent',
    on: 'response',
    when: (call) => call.tool === 'Agent' || call.tool === 'Task',
    send: () => guides('subagents.md'),
    why: () => 'Before starting a subagent, follow this guide.',
    holds: true,
  },
  {
    id: 'rule-file',
    on: 'response',
    when: (call) => markdown(call) && (/\/CLAUDE(\.local)?\.md$/.test(pathOf(call)) || /\/\.claude\/rules\//.test(pathOf(call))),
    // Loaded text gets no guide: /flow:write-instructions covers it, and attached guides went unfollowed (fw-425).
    send: () => [],
    why: guideWhy,
  },
  {
    id: 'loaded-file',
    on: 'response',
    when: (call) => markdown(call) && !inEditLog(call) && /\/skills\/|\/\.claude\/(commands|agents|output-styles)\/|\/references\/|\/prompts\//.test(pathOf(call)),
    send: () => [],
    why: guideWhy,
  },
  {
    id: 'spec',
    on: 'response',
    when: (call) => markdown(call) && /\/docs\/spec\//.test(pathOf(call)),
    send: () => guides('writing.md', 'write-spec.md'),
    why: guideWhy,
  },
  {
    id: 'wiki',
    on: 'response',
    when: (call) => markdown(call) && /\/\.flow\/wiki\//.test(pathOf(call)),
    send: () => guides('writing.md', 'wiki.md'),
    why: guideWhy,
  },
  {
    id: 'markdown',
    on: 'response',
    when: markdown,
    send: () => guides('writing.md'),
    why: guideWhy,
  },
  {
    id: 'code',
    on: 'response',
    when: code,
    send: () => guides('write-code.md'),
    why: guideWhy,
  },
  {
    id: 'shell-write',
    on: 'response',
    when: (call) => shellWriteGuides(call).length > 0,
    send: shellWriteGuides,
    why: guideWhy,
    holds: true,
  },
  {
    id: 'command',
    on: 'response',
    when: (call) => groupsOf(commandOf(call)).some((group) => !helpOf(commandOf(call), group)),
    send: (call) =>
      groupsOf(commandOf(call))
        .filter((group) => !helpOf(commandOf(call), group))
        .map((group) => ({ tool: 'Bash', command: `${group} --help`, description: `List the ${group} commands` })),
    why: (call) => `The ${groupsOf(commandOf(call)).join(', ')} commands.`,
  },
  {
    // A shell read sends the guides an edit of each file its output shows would take. A read changes nothing on disk: no hold.
    id: 'shell-read',
    on: ['result'],
    tools: ['Bash'],
    add: async (input: ResultInput) => {
      const wanted = guidesFor(filesShown(commandOf(input.call), input.text ?? ''))
      return wanted.length ? attachGuides(input.read, wanted, await input.keys(), await input.home()) : []
    },
  },
  {
    id: 'ticket-header',
    on: ['result', 'mention'],
    tools: ['Read'],
    add: once((input, path) => ticketText(input.flow, path)),
  },
  {
    id: 'wiki-labels',
    on: ['result', 'mention'],
    tools: ['Read'],
    add: once(async (input, path) => labelsText(input.flow, await input.home(), path)),
  },
  {
    id: 'edit-log',
    on: ['result'],
    tools: ['Edit', 'Write'],
    add: async (input: ResultInput) => {
      const line = editLogReminder(pathOf(input.call), input.agentId, await input.home())
      return line ? [line] : []
    },
  },
  {
    id: 'skill-wiki',
    on: 'skill',
    add: async (input) => {
      const links = linksOf(input.frontmatter)
      if (!links.length) return ''
      return wikiText(links, await input.home(), await input.held(), input.read)
    },
  },
]

/** The `response` entries, in order. */
export const CALL_ENTRIES = TRIGGERS.filter((t): t is CallEntry => t.on === 'response')

/** The first `response` entry that covers a call, or undefined. A read of a guide itself is covered by none. */
export function entryFor(call: Call): CallEntry | undefined {
  if (call.tool === 'Read' && isGuide(pathOf(call))) return undefined
  return CALL_ENTRIES.find((entry) => !entry.also && entry.when(call))
}

/** Every `response` entry that covers a call: the first match, then each `also` entry that matches. */
export function entriesFor(call: Call): CallEntry[] {
  const first = entryFor(call)
  if (call.tool === 'Read' && isGuide(pathOf(call))) return []
  return [...(first ? [first] : []), ...CALL_ENTRIES.filter((entry) => entry.also && entry.when(call))]
}
