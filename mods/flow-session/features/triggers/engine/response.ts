/**
 * response.ts: runs the `response` entries of list.ts on each model response, inside `turn.step`.
 *
 * It adds what an entry sends to that same response: a `Read` of a guide beside a read of a matched
 * file, the guide's `Read` in place of an `Edit` or `Write` of one, which it holds back with every
 * call after it, and a group's `--help` beside the group's first command. It never adds what the
 * window or the response already holds, whoever made the call. Each added call's result is headed `[Auto]`.
 *
 * From the response's first tool call on, its chunks wait for the stop, so a write held back never
 * leaves the chain, and the added calls go last. Each added call's result gets its header once the
 * result is in (`withGuideHeader`, from `tool.call`).
 */
import type { EngineInterface, TurnStepChunk } from 'claude-code'
import { reasonOf } from '../../../shared/format'
import { type Call, commandOf, labelOf, nameOf, pathOf, touches } from '../checks/paths'
import { type CallEntry, entriesFor } from '../list'
import { keyOf, type Send } from '../sends/guides'
import { type Firing, logFirings } from '../log'
import { keysOf, windowOf } from './held'

/** A call the engine adds, with the header its result opens with, the entry that sent it, and for which call. */
export type Added = { send: Send; header: string; id: string; file: string; by: 'held' | 'beside' }

/** What the engine does to one response. */
export type Plan = {
  /** The positions, in the response's calls, of the calls held back: the first held write and every call after it. */
  held: number[]
  added: Added[]
  /** Headers for calls the model made itself, by position: a held write whose guide the model already reads. */
  notes: Map<number, string>
}

export const HEADER = '[Auto]'

/** True for a call held back while a guide it needs is missing: a change to a file, or a call an entry holds. */
export const holds = (call: Call, entries: readonly CallEntry[]) => call.tool === 'Edit' || call.tool === 'Write' || entries.some((entry) => entry.holds === true)

/** The calls named in a header, `Edit of writing.md`, `Bash (npm test)`. */
const named = (call: Call) =>
  touches(call) ? `${call.tool} of ${nameOf(pathOf(call))}` : call.tool === 'Bash' ? `Bash (${commandOf(call).split('\n')[0]!.slice(0, 60)})` : `${call.tool} call`

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
  const entries = calls.map(entriesFor)
  // Each call's sends, each with the line of the entry that sends it.
  const sendsOf = calls.map((call, i) => entries[i]!.flatMap((entry) => entry.send(call).map((send) => ({ send, why: entry.why(call), id: entry.id }))))
  const firstHeld = calls.findIndex((call, i) => holds(call, entries[i]!) && sendsOf[i]!.some((s) => !inWindow.has(keyOf(s.send))))
  const kept = firstHeld === -1 ? calls.length : firstHeld
  const have = new Set(inWindow)
  const ownAt = new Map<string, number>()
  calls.slice(0, kept).forEach((call, i) => keysOf(call).forEach((key) => (have.add(key), ownAt.has(key) || ownAt.set(key, i))))
  const added: Added[] = []
  const notes = new Map<number, string>()
  const upTo = firstHeld === -1 ? kept : firstHeld + 1
  for (let i = 0; i < upTo; i++) {
    const sends = sendsOf[i]!
    if (!sends.length) continue
    let heldWhy = i === firstHeld ? heldLine(calls, i) : undefined
    if (heldWhy) {
      // A guide the model reads in this same response carries the line where none is added.
      const own = sends.map((s) => ownAt.get(keyOf(s.send))).find((at) => at !== undefined)
      if (own !== undefined && sends.every((s) => have.has(keyOf(s.send)))) notes.set(own, `${HEADER} ${heldWhy}`)
    }
    for (const { send, why, id } of sends) {
      if (have.has(keyOf(send))) continue
      have.add(keyOf(send))
      added.push({ send, header: `${HEADER} ${heldWhy ?? why}`, id, file: labelOf(calls[i]!), by: i === firstHeld ? 'held' : 'beside' })
      heldWhy = undefined
    }
  }
  return { held: firstHeld === -1 ? [] : calls.map((_, i) => i).slice(firstHeld), added, notes }
}

/** The log's lines for a plan: one per entry and call, and one for a held call whose guides the model read itself in the same response. */
export function firingsOf(plan: Plan, calls: readonly Call[]): Firing[] {
  const out = new Map<string, Firing>()
  for (const a of plan.added) {
    const key = `${a.id}\n${a.by}\n${a.file}`
    const firing = out.get(key) ?? { id: a.id, by: a.by, file: a.file, sent: [] }
    firing.sent.push(a.send.tool === 'Read' ? a.send.path : a.send.command)
    out.set(key, firing)
  }
  const held = plan.held[0] === undefined ? undefined : calls[plan.held[0]]
  if (held && !plan.added.some((a) => a.by === 'held')) {
    const entry = entriesFor(held)[0]
    if (entry) out.set('held', { id: entry.id, by: 'held', file: labelOf(held), sent: [] })
  }
  return [...out.values()]
}

/** The tool input of a sent call, a path under the Flow home made absolute. */
export const inputOf = (send: Send, home: string): Record<string, unknown> =>
  send.tool === 'Read' ? { file_path: send.path.startsWith('/') ? send.path : `${home}/${send.path}` } : { command: send.command, description: send.description }

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
  if (!parsed.some(({ call }) => entriesFor(call).length)) return undefined
  const plan = planFor(
    parsed.map(({ call }) => call),
    await windowOf($, agentId),
  )
  if (!plan.held.length && !plan.added.length && !plan.notes.size) return undefined
  logFirings(
    $,
    agentId,
    firingsOf(
      plan,
      parsed.map(({ call }) => call),
    ),
  )
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

// The header each steered call gets on its result, by call id, taken once the result is in.
const guideHeaders = new Map<string, string>()

/** A response's chunks, steered by the entries. A response cut off before its stop passes on what it held, unsteered. */
export async function* steerStep($: EngineInterface, agentId: string | undefined, chunks: AsyncIterable<TurnStepChunk>): AsyncGenerator<TurnStepChunk> {
  const waiting: TurnStepChunk[] = []
  const streamed = new Map<number, Streamed>()
  let last = -1
  for await (const c of chunks) {
    if ('index' in c && typeof c.index === 'number') last = Math.max(last, c.index)
    if (c.kind === 'tool') streamed.set(c.index, { index: c.index, id: c.id, name: c.name, json: '' })
    if (c.kind === 'input') {
      const call = streamed.get(c.index)
      if (call) call.json += c.json
    }
    if (c.kind !== 'stop') {
      if (streamed.size) waiting.push(c)
      else yield c
      continue
    }
    const steering = streamed.size ? await steer($, agentId, [...streamed.values()]).catch((error) => void $.ui.log(`guides not sent: ${reasonOf(error)}`)) : undefined
    // A held block's own chunks are dropped. The engine's opaque ones carry no block, and pass.
    for (const w of waiting) if (w.kind === 'engine' || w.kind === 'stop' || !steering?.drop.has(w.index)) yield w
    for (const [id, header] of steering?.headers ?? []) guideHeaders.set(id, header)
    for (const [i, call] of (steering?.add ?? []).entries()) {
      last += 1
      yield { kind: 'tool', index: last, id: steering!.addedIds[i]!, name: call.name }
      yield { kind: 'input', index: last, json: JSON.stringify(call.input) }
    }
    if (steering?.drop.size) $.ui.log(`held back ${steering.drop.size} calls until the guides are read`)
    waiting.length = 0
    yield c
  }
  yield* waiting
}

/** A tool's result with the guide header its call was given, if any. The header is taken once. */
export function withGuideHeader<R extends { result?: unknown; context?: readonly string[] }>(callId: string, done: R): R {
  const header = guideHeaders.get(callId)
  guideHeaders.delete(callId)
  return header && done.result !== undefined ? { ...done, context: [header, ...(done.context ?? [])] } : done
}
