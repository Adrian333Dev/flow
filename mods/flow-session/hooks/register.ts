/**
 * register.ts: the hooks module of Flow's session mod.
 *
 * The restart: at its wrap-up checkpoint the agent calls the `restart` tool
 * with its handoff note. The mod ends that turn, compacts between turns, and
 * answers the compaction itself with the note, so the session and its
 * transcript stay and no model writes a summary.
 *
 * Also: dragged files load as mentions, a handoff note is removed once read,
 * the agent is warned at the wrap-up mark, and `#` in the prompt box lists
 * the notes of `flow notes`.
 */
import type { EngineInterface, Register } from 'claude-code'
import { firstMessage, lastExchange } from './exchange'
import { mention, pastedPaths, relativeTo } from './drag'
import { isNote } from './note'
import { parseNote, rows, type Note } from './notes'
import { kilo, wrapUpLine, wrapUpSettings } from './wrap-up'

const TOOL = /^mcp__flow-session__restart$/
const REFUSAL = 'Flow compacts only at its own restart. Run /flow:handoff.'

type Restart = {
  note: string
  skill?: string
  args?: string
  tickets: string[]
  size: number
  started: boolean
}

let pending: Restart | null = null
let mainTurn: string | undefined
let sizeBefore: number | undefined
let lastChecked = 0
let mentionedNotes: string[] = []
const noteTurns = new Map<string, string[]>()
// The `#` list runs on every keystroke, so a note file is parsed again only when its change time moves.
const listedNotes = new Map<string, Note>()

/** Prints the size change once the new conversation has a response: `usage()` has no figure before that. */
async function logSize($: EngineInterface): Promise<void> {
  const after = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (after === undefined || sizeBefore === undefined) return
  $.ui.log(`restart: context ${kilo(sizeBefore)} → ${kilo(after)}`)
  sizeBefore = undefined
}

/** What the agent passed, checked: a bad ticket id or skill name is dropped, never read as a path. */
function readInput(e: object): { note: string; skill?: string; args?: string; tickets: string[] } {
  const input = e as { note?: unknown; skill?: unknown; args?: unknown; tickets?: unknown }
  const skill = typeof input.skill === 'string' && /^[\w:-]+$/.test(input.skill) ? input.skill : undefined
  const tickets = Array.isArray(input.tickets)
    ? input.tickets.filter((id): id is string => typeof id === 'string' && /^[a-z]{2,8}-\d+$/.test(id))
    : []
  return {
    note: typeof input.note === 'string' ? input.note.trim() : '',
    skill,
    args: typeof input.args === 'string' ? input.args : undefined,
    tickets,
  }
}

/** A settings file's text, or undefined when it is missing or unreadable. */
const readText = ($: EngineInterface, file: string) => $.fs.read(file).catch(() => undefined)

/** The Flow home: `FLOW_HOME`, else `~/.flow`. */
const flowHome = async ($: EngineInterface) => (await $.env.get('FLOW_HOME')) ?? `${await $.env.get('HOME')}/.flow`

/** The wrap-up line for the size now, or undefined. Remembers the size, so each mark speaks once. */
async function wrapUp($: EngineInterface): Promise<string | undefined> {
  const home = await flowHome($)
  const { wrapUp: on, limit } = wrapUpSettings(
    await readText($, `${home}/settings.json`),
    await readText($, `${home}/settings.local.json`),
  )
  const now = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (!on || now === undefined) return undefined
  const before = lastChecked
  lastChecked = now
  const line = wrapUpLine(before, now, limit)
  if (line) $.ui.log(`wrap-up line sent at ${kilo(now)}`)
  return line
}

/** A paste of paths that all exist under the session's folder, as mentions. Undefined for any other edit. */
async function mentionsFor($: EngineInterface, pasted: string): Promise<string | undefined> {
  const paths = pastedPaths(pasted)
  if (!paths) return undefined
  const root = await $.session.root()
  const parts: string[] = []
  for (const path of paths) {
    const relative = relativeTo(root, path)
    if (relative === undefined || !(await $.fs.exists(path))) return undefined
    parts.push(mention(relative))
  }
  return `${parts.join(' ')} `
}

/** Every note in `<home>/notes/`, each parsed once per change. */
async function readNotes($: EngineInterface, home: string): Promise<Note[]> {
  const dir = `${home}/notes`
  const entries = await $.fs.list(dir).catch(() => [])
  const found = await Promise.all(
    entries
      .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md') && !entry.name.startsWith('.'))
      .map(async (entry) => {
        const path = `${dir}/${entry.name}`
        const kept = listedNotes.get(path)
        if (kept?.changed === entry.mtimeMs) return kept
        const raw = await readText($, path)
        if (raw === undefined) return undefined
        const note = parseNote(path, entry.mtimeMs, raw)
        listedNotes.set(path, note)
        return note
      }),
  )
  return found.filter((note): note is Note => note !== undefined)
}

/** The project name `flow note` files under: the session folder's name, `global` in the Flow home. */
async function projectName($: EngineInterface, home: string): Promise<string> {
  const root = (await $.session.root()).replace(/\/+$/, '')
  return root === home || `${root}/.flow` === home ? 'global' : root.slice(root.lastIndexOf('/') + 1)
}

/** `$.fs` has no delete, so the notes go through `rm`. */
async function removeNotes($: EngineInterface, paths: readonly string[]): Promise<void> {
  for (const path of paths) await $.process.run(['rm', '--', path]).catch(() => undefined)
}

/** One ticket's file. Its folder is the id, or the id and a slug. */
async function ticketText($: EngineInterface, root: string, id: string): Promise<string> {
  try {
    const dir = `${root}/.flow/tickets`
    const found = (await $.fs.list(dir)).find((entry) => entry.name === id || entry.name.startsWith(`${id}-`))
    if (!found) return `${id}: no ticket folder found.`
    return `## ${id}\n\n${await $.fs.read(`${dir}/${found.name}/ticket.md`)}`
  } catch {
    return `${id}: ticket.md could not be read.`
  }
}

/** Starts the compaction, then the next turn. Not awaited by its caller, so it owns its errors. */
async function runRestart($: EngineInterface, restart: Restart): Promise<void> {
  restart.started = true
  try {
    await $.command.run({ command: 'compact' })
    sizeBefore = restart.size
    if (restart.skill) await $.command.run({ command: restart.skill, args: restart.args ?? '' })
    else await $.prompt.submit({ text: 'Continue from the note.', asUser: true })
  } catch (error) {
    $.ui.log(`restart failed, the session is as it was: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    pending = null
  }
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: 'restart',
      description:
        'Restarts this session in place once /flow:handoff has finished: the conversation is replaced by `note` and the tickets named, and the skill starts again. Call it last. Nothing you write after the call is read.',
      isDeferred: false,
      inputSchema: {
        type: 'object',
        properties: {
          note: { type: 'string', description: 'The handoff note: what the next stretch of work needs.' },
          skill: { type: 'string', description: 'The skill the work continues in, without the slash, such as flow:execute.' },
          args: { type: 'string', description: 'What follows the skill name, such as a ticket id.' },
          tickets: { type: 'array', items: { type: 'string' }, description: 'Ids of the tickets in flight. Each ticket.md joins the first message.' },
        },
        required: ['note'],
      },
    })
    return next(e)
  })

  // A note for another session: the mention records it, the next main turn
  // takes it, and that turn's clean answer removes the file.
  on('prompt.mention', async ($, e, next) => {
    if (e.agentId === undefined && isNote(await $.session.root(), e.path)) mentionedNotes.push(e.path)
    return next(e)
  })

  on('turn.start', async (_$, e, next) => {
    if (e.agentId === undefined) {
      mainTurn = e.turnId
      if (mentionedNotes.length) noteTurns.set(e.turnId, mentionedNotes)
      mentionedNotes = []
    }
    return next(e)
  })

  // `#` and a word lists the notes of every project (hooks/notes.ts). The rows
  // join beneath the engine's own, so a failure here shows no rows at all.
  on('prompt.autocomplete', { token: /^#/ }, async ($, e, next) => {
    const home = await flowHome($)
    const found = rows(await readNotes($, home), e.token, await projectName($, home))
    const before = await next(e)
    return { suggestions: [...before.suggestions, ...found] }
  }).catch(() => ({ suggestions: [] }))

  // A dragged file arrives as one paste. Rewritten here, while the text is in
  // the box, it loads as a typed `@` does.
  on('prompt.edit', async ($, e, next) => {
    const mentions = await mentionsFor($, e.inputText).catch(() => undefined)
    return next(mentions ? { ...e, inputText: mentions } : e)
  })

  // The warning rides on the next message the user types, or on a tool result
  // when a long turn has no message in it. A subagent's size is its own.
  on('prompt.submit', async ($, e, next) => {
    const line = await wrapUp($).catch(() => undefined)
    return next(line ? { ...e, context: [...(e.context ?? []), line] } : e)
  })

  on('tool.call', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId !== undefined || TOOL.test(e.tool) || done.result === undefined) return done
    const line = await wrapUp($).catch(() => undefined)
    return line ? { ...done, context: [...(done.context ?? []), line] } : done
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    if (e.agentId !== undefined) return { deny: 'Only the main session restarts.' }
    if (pending) return { deny: 'A restart is already under way.' }
    const input = readInput(e)
    if (!input.note) return { deny: 'Pass the handoff note as `note`.' }
    const usage = await $.session.usage().catch(() => undefined)
    pending = { ...input, size: usage?.context.tokens ?? 0, started: false }
    if (mainTurn) await $.turn.abort({ turnId: mainTurn }).catch(() => undefined)
    return { result: 'Restarting. Write nothing more.' }
  }).catch(() => ({ deny: 'The restart hook failed, so nothing restarted.' }))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const notes = noteTurns.get(e.turnId)
    if (notes) {
      noteTurns.delete(e.turnId)
      if (e.reason === 'answer') await removeNotes($, notes)
    }
    if (e.agentId === undefined) {
      if (pending && !pending.started) void runRestart($, pending)
      else if (sizeBefore !== undefined) void logSize($).catch(() => undefined)
    }
    return done
  })

  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    if (e.trigger !== 'manual' || !pending?.started) return { skip: REFUSAL }
    const root = await $.session.root()
    const tickets = await Promise.all(pending.tickets.map((id) => ticketText($, root, id)))
    return {
      messages: [
        { role: 'user', text: firstMessage(pending.note, tickets), toolUses: [] },
        ...lastExchange(e.messages),
      ],
    }
  }).catch(() => ({ skip: REFUSAL }))
}
