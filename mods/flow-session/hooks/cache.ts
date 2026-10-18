/**
 * cache.ts: what the end of the transcript says about the last request: when it was made,
 * the model and effort it used, and how long the prompt cache it wrote lives.
 *
 * No mod call reports the cache lifetime. The transcript names it on every line that wrote the
 * cache (`usage.cache_creation`), so the lifetime comes from the newest such line and the start
 * from the newest line that carries any usage. Each request that reads the cache renews it.
 */

const MINUTE = 60 * 1000

export type Request = {
  /** When the newest request was made, in epoch milliseconds. */
  at: number
  model?: string
  effort?: string | number
  /** How long the cache lives, in milliseconds, absent when no line in the text wrote it. */
  lifetime?: number
}

type Line = {
  type?: string
  timestamp?: string
  effort?: unknown
  message?: { model?: unknown; usage?: Record<string, unknown> }
}

const count = (value: unknown) => (typeof value === 'number' ? value : 0)

function parse(text: string): Line | undefined {
  try {
    const line: unknown = JSON.parse(text)
    return line && typeof line === 'object' ? (line as Line) : undefined
  } catch {
    return undefined
  }
}

/** The lifetime a line's usage wrote, or undefined when it wrote nothing. */
function lifetimeOf(usage: Record<string, unknown>): number | undefined {
  const written = usage.cache_creation as Record<string, unknown> | undefined
  if (count(written?.ephemeral_1h_input_tokens) > 0) return 60 * MINUTE
  if (count(written?.ephemeral_5m_input_tokens) > 0) return 5 * MINUTE
  return undefined
}

/**
 * The newest request in the end of a transcript. The first line of `text` may be cut, and a line
 * written well after a reply with every count at 0 is no request.
 */
export function lastRequest(text: string): Request | undefined {
  const lines = text.split('\n').reverse()
  let found: Request | undefined
  for (const raw of lines) {
    const line = parse(raw)
    const usage = line?.type === 'assistant' ? line.message?.usage : undefined
    if (!line || !usage) continue
    const at = Date.parse(line.timestamp ?? '')
    if (Number.isNaN(at) || count(usage.input_tokens) + count(usage.cache_creation_input_tokens) + count(usage.cache_read_input_tokens) === 0) continue
    const model = line.message?.model
    if (!found) {
      found = {
        at,
        model: typeof model === 'string' && model.startsWith('claude') ? model : undefined,
        effort: typeof line.effort === 'string' || typeof line.effort === 'number' ? line.effort : undefined,
      }
    }
    const lifetime = lifetimeOf(usage)
    if (lifetime !== undefined) return { ...found, lifetime }
  }
  return found
}

/** When the cache goes cold, or undefined when the request showed no lifetime. */
export const coldAt = (request: Request | undefined) => (request?.lifetime === undefined ? undefined : request.at + request.lifetime)
