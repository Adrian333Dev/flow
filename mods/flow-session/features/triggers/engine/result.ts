/**
 * result.ts: runs the `result` and `mention` entries of list.ts once a tool's result is in, or a
 * file is `@` mentioned, their texts added to the result's `context`.
 *
 * A refusal or a failed call passes untouched. Each entry's lookups (the window, the Flow home) run
 * once, and only when an entry asks. A failed entry adds nothing, and the others still run.
 */
import type { EngineInterface } from 'claude-code'
import { reasonOf } from '../../../shared/format'
import { flowHome, readText } from '../../../shared/home'
import { windowMessages, type WindowMessage } from '../../../shared/window'
import { type Call, labelOf } from '../checks/paths'
import { type Firing, logFirings, textLabel } from '../log'
import { TRIGGERS, type ResultEntry, type ResultInput } from '../list'
import { flowJson } from '../sends/file-context'
import { heldIn, windowKeys } from './held'

type Done = { deny?: string; isError?: boolean; text?: string; context?: readonly string[] }

const RESULT_ENTRIES = TRIGGERS.filter((t): t is ResultEntry => Array.isArray(t.on))

const memo = <T>(get: () => Promise<T>) => {
  let value: Promise<T> | undefined
  return () => (value ??= get())
}

async function run<R extends Done>(moment: 'result' | 'mention', $: EngineInterface, call: Call, agentId: string | undefined, done: R): Promise<R> {
  if (done.deny !== undefined || done.isError) return done
  const entries = RESULT_ENTRIES.filter((entry) => entry.on.includes(moment) && entry.tools.includes(call.tool))
  if (!entries.length) return done
  const messages = memo<WindowMessage[]>(() => windowMessages($, agentId))
  const input: ResultInput = {
    call,
    agentId,
    text: typeof done.text === 'string' ? done.text : undefined,
    keys: memo(async () => windowKeys(await messages())),
    held: memo(async () => heldIn(await messages())),
    home: memo(() => flowHome($)),
    read: (path) => readText($, path),
    flow: (args, cwd) => flowJson($, args, cwd),
  }
  const added: string[] = []
  const firings: Firing[] = []
  const file = labelOf(call)
  for (const entry of entries) {
    try {
      const texts = await entry.add(input)
      added.push(...texts)
      if (texts.length) firings.push({ id: entry.id, by: moment, file, sent: texts.map(textLabel) })
    } catch (error) {
      $.ui.log(`${entry.id} not sent: ${reasonOf(error)}`)
      firings.push({ id: entry.id, by: moment, file, sent: [], error: reasonOf(error) })
    }
  }
  logFirings($, agentId, firings)
  return added.length ? { ...done, context: [...(done.context ?? []), ...added] } : done
}

/** A `tool.call` result with what the entries for its tool add. */
export async function withResultTriggers<R extends Done>($: EngineInterface, e: { tool: string; agentId?: string }, done: R): Promise<R> {
  return run('result', $, { tool: e.tool, input: e as unknown as Record<string, unknown> }, e.agentId, done)
}

/** A `prompt.mention` result with what the entries add for the file, handed to them as a `Read` of it. */
export async function withMentionTriggers<R extends Done>($: EngineInterface, path: unknown, agentId: string | undefined, done: R): Promise<R> {
  return run('mention', $, { tool: 'Read', input: { file_path: path } }, agentId, done)
}
