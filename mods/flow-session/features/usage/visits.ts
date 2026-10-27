/**
 * visits.ts: a `Read` inside a wiki folder or a research topic, counted once per folder per window.
 *
 *   <home>/wiki/claude-code/mod-hooks.md          → claude-code
 *   <root>/.flow/research/agent-memory/letta.md   → research:agent-memory
 *   <home>/research/agent-memory/letta.md         → research:agent-memory
 *
 * The count goes to the session's ticket, the last `flow tickets start <id>` in the main window's
 * Bash calls, else to the project: `flow visit <key> [--ticket <id>]` (scripts/features/usage/usage.ts).
 * The CLI cannot tell which ticket the calling session works, so the mod counts and `flow search` never
 * does. The first `Read` of a folder in a window counts: a compaction or a restart counts it again, and a
 * subagent's window counts apart. The hook is `tool.call` on `Read` (register.ts), never awaited.
 */
import type { EngineInterface } from 'claude-code'
import { reasonOf } from '../../shared/format'
import { flowHome } from '../../shared/home'
import { startedIn } from '../../shared/ticket'
import { type Block, type WindowMessage, windowMessages } from '../../shared/window'


const NAME = '[\\w.-]+'
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The folder a path sits in, as `flow visit` names it, or undefined for a path outside every wiki folder and research topic. */
export function visitKey(path: string, home: string, root: string): string | undefined {
  const wiki = new RegExp(`^${escape(home)}/wiki/(${NAME})/.`).exec(path)
  if (wiki) return wiki[1]
  for (const research of [`${root}/.flow/research`, `${home}/research`]) {
    const topic = new RegExp(`^${escape(research)}/(${NAME})/.`).exec(path)
    if (topic) return `research:${topic[1]}`
  }
  return undefined
}

const blocksOf = (messages: readonly WindowMessage[]): Block[] => messages.flatMap((m) => (typeof m.content === 'string' ? [] : m.content))
const toolUses = (messages: readonly WindowMessage[], name: string) => blocksOf(messages).filter((b) => b.type === 'tool_use' && b.name === name)
const inputOf = (b: Block) => (b.input ?? {}) as Record<string, unknown>

/**
 * Whether the `Read` call `id` is the window's first inside the folder `key`. A call the window does not
 * hold yet counts where no other `Read` sits in the folder, so 2 reads sent together count once.
 */
export function firstRead(messages: readonly WindowMessage[], key: string, id: string | undefined, home: string, root: string): boolean {
  const first = toolUses(messages, 'Read').find((b) => {
    const path = inputOf(b).file_path
    return typeof path === 'string' && visitKey(path, home, root) === key
  })
  return !first || first.id === id
}

/** The ticket the window last picked up with `flow tickets start <id>`, or undefined. */
export function ticketOf(messages: readonly WindowMessage[]): string | undefined {
  const commands = toolUses(messages, 'Bash').map((b) => inputOf(b).command)
  return commands.flatMap((c) => (typeof c === 'string' ? startedIn(c) : [])).at(-1)
}

/** Counts a `Read` of `path` for the session's ticket, else the project, where it is the window's first in its folder. */
export async function countVisit($: EngineInterface, path: unknown, agentId: string | undefined, id: string | undefined): Promise<void> {
  if (typeof path !== 'string') return
  try {
    const home = await flowHome($)
    const root = (await $.session.root()).replace(/\/+$/, '')
    const key = visitKey(path, home, root)
    if (!key) return
    const main = await windowMessages($, undefined)
    if (!firstRead(agentId === undefined ? main : await windowMessages($, agentId), key, id, home, root)) return
    const ticket = ticketOf(main)
    const ran = await $.process.run(['flow', 'visit', key, ...(ticket ? ['--ticket', ticket] : [])], { cwd: root, timeoutMs: 10000 })
    if (ran.exitCode !== 0) $.ui.log(`visit to ${key} not counted: ${ran.stderr.trim()}`)
  } catch (error) {
    $.ui.log(`visit not counted: ${reasonOf(error)}`)
  }
}
