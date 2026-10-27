/**
 * steer-step.ts: runs situations.ts on each model response, inside `turn.step`.
 *
 * From the response's first tool call on, its chunks wait for the stop, so a write held back never
 * leaves the chain, and the added calls go last. Each added call's result gets its header once the
 * result is in (`withGuideHeader`, from `tool.call`).
 */
import type { EngineInterface, TurnStepChunk } from 'claude-code'
import { reasonOf } from '../../shared/format'
import { steer, type Streamed } from './situations'

// The header each steered call gets on its result, by call id, taken once the result is in.
const guideHeaders = new Map<string, string>()

/** A response's chunks, steered by the guides. A response cut off before its stop passes on what it held, unsteered. */
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
