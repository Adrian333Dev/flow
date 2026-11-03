/**
 * held.ts: what a window already holds, so no trigger sends a thing twice.
 *
 * 2 views of the same messages: the keys of the guides read whole and the help calls answered
 * (`windowKeys`, for the guide entries), and the window's text with its whole-file reads (`heldIn`,
 * for the entries that send text). A window the session cannot read holds nothing.
 */
import type { EngineInterface } from 'claude-code'
import { type Block, type WindowMessage, textOf, windowMessages } from '../../../shared/window'
import { groupsOf, helpOf } from '../checks/commands'
import { type Call, commandOf, pathOf } from '../checks/paths'
import { repoPathOf, repoRoot } from '../checks/shipped'
import { ATTACHED, GUIDES } from '../sends/guides'

const blocksOf = (messages: readonly WindowMessage[]): readonly Block[] =>
  messages.flatMap((m): readonly Block[] => (typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content))

const answeredIn = (blocks: readonly Block[]) => new Set(blocks.flatMap((b) => (b.type === 'tool_result' && typeof b.tool_use_id === 'string' ? [b.tool_use_id] : [])))

/** The keys a call already in the window or the response stands for: a whole-file read of a guide, a group's help. */
export function keysOf(call: Call): string[] {
  if (call.tool === 'Read') {
    const { offset, limit } = call.input as { offset?: number; limit?: number }
    if (limit !== undefined || (offset !== undefined && offset > 1)) return []
    const guides = GUIDES.filter((guide) => pathOf(call).endsWith(`/references/guides/${guide}`)).map((guide) => `read:references/guides/${guide}`)
    // A repo file counts by its path in the checkout, whichever link it was read through.
    const rel = repoPathOf(pathOf(call))
    return rel ? [...guides, `read:${repoRoot()}/${rel}`] : guides
  }
  const command = commandOf(call)
  return groupsOf(command)
    .filter((group) => helpOf(command, group))
    .map((group) => `bash:${group} --help`)
}

/** The keys the window holds: each call it answered, by `keysOf`, and each guide attached to a result. */
export function windowKeys(messages: readonly WindowMessage[]): Set<string> {
  const blocks = blocksOf(messages)
  const answered = answeredIn(blocks)
  const keys = new Set<string>()
  for (const b of blocks) {
    if (b.type === 'tool_use' && typeof b.id === 'string' && answered.has(b.id) && typeof b.name === 'string')
      for (const key of keysOf({ tool: b.name, input: (b.input ?? {}) as Record<string, unknown> })) keys.add(key)
    for (const m of textOf(b).matchAll(ATTACHED)) if ((GUIDES as readonly string[]).includes(m[1]!)) keys.add(`read:references/guides/${m[1]}`)
  }
  return keys
}

/** The keys the window of the agent that made the step holds. */
export async function windowOf($: EngineInterface, agentId: string | undefined): Promise<Set<string>> {
  return windowKeys(await windowMessages($, agentId))
}

/** What a window holds as text: every block's text, and the paths of its answered whole-file reads. */
export type Held = { text: string; reads: ReadonlySet<string> }

export function heldIn(messages: readonly WindowMessage[]): Held {
  const blocks = blocksOf(messages)
  const answered = answeredIn(blocks)
  const reads = new Set<string>()
  for (const b of blocks) {
    if (b.type !== 'tool_use' || b.name !== 'Read' || !answered.has(b.id as string)) continue
    const input = (b.input ?? {}) as { file_path?: unknown; offset?: number; limit?: number }
    if (typeof input.file_path === 'string' && input.limit === undefined && (input.offset === undefined || input.offset <= 1)) reads.add(input.file_path)
  }
  return { text: blocks.map(textOf).join('\n'), reads }
}

/** What the window of an agent holds: the main loop's where `agentId` is none. */
export async function heldBy($: EngineInterface, agentId: string | undefined): Promise<Held> {
  return heldIn(await windowMessages($, agentId))
}
