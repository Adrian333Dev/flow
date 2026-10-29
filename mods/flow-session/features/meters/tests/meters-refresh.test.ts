import { describe, expect, mock, test } from 'claude-code/testing'
import { flush } from '../../../shared/testing'

const HINT = {
  plugin: 'flow-session',
  component: 'PromptHint',
  surface: 'terminal',
  viewport: { columns: 120, rows: 30 },
  props: { isDraft: false, isWorking: false, hint: '' },
} as const

/** The session's context size, which a test moves between calls. */
function session(on: Parameters<typeof mock.env>[0], size: { tokens?: number }) {
  mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
  on('session.usage', () => ({ value: { context: { tokens: size.tokens }, rateLimits: [] } }) as never)
  on('tool.call', () => ({ result: 'ok' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine hint'] }))
}

const STEP = { turnId: 't1', index: 0, model: 'claude-sonnet-5-5', effort: 'high', messageCount: 3 }

/** One model request of the main loop, or of the subagent `agentId`, run to its end. */
async function request($: Parameters<Parameters<typeof test>[1]>[0], over: Record<string, unknown>) {
  const stream = $.turn.step({ ...STEP, ...over } as never)
  for await (const _ of stream) void _
  await flush()
}

describe('the model meter', () => {
  test('follows the model and effort of each request, a fallback model included, and ignores a subagent', async ($, on) => {
    session(on, { tokens: 1000 })
    // The model that answers is named by the response's stop chunk, which a test sets per request.
    const answered: { model?: string } = {}
    on('turn.step', async function* (_$, e) {
      if (answered.model) {
        const counts = { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 1, cache_creation_input_tokens: 1 }
        yield { kind: 'stop', index: 0, stopReason: 'end_turn', usage: { ...counts, model: answered.model } } as never
      }
      return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: null } as never
    })
    const ui = await $.ui.mount(HINT)

    await request($, {})
    expect(await ui.find({ text: 'sonnet 5.5' })).toBeDefined()
    expect(await ui.find({ text: ' high' })).toBeDefined()

    // The user lowered the effort.
    await request($, { effort: 'low' })
    expect(await ui.find({ text: ' low' })).toBeDefined()

    // The engine asked for sonnet and haiku answered.
    answered.model = 'claude-haiku-5-5'
    await request($, {})
    expect(await ui.find({ text: 'haiku 5.5' })).toBeDefined()

    // A subagent's request changes nothing.
    await request($, { model: 'claude-opus-5-5', effort: 'max', agentId: 'helper-1' })
    expect(await ui.find({ text: 'haiku 5.5' })).toBeDefined()
    await ui.unmount()
  })
})

describe('the context meter at the start of a session', () => {
  test('a resumed session shows the size it resumed with, before any response', async ($, on) => {
    session(on, {})
    on('classic.SessionStart', () => ({}) as never)
    on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
    const ui = await $.ui.mount(HINT)
    await $.classic.SessionStart({ source: 'resume', context_tokens: 88000, transcript_path: '/t.jsonl' } as never)
    await flush()
    expect(await ui.find({ text: '88k' })).toBeDefined()
    await ui.unmount()
  })
})

describe('the context meter', () => {
  test('follows the session inside a turn, with no session.measure', async ($, on) => {
    const size: { tokens?: number } = { tokens: 31000 }
    session(on, size)
    await $.tool.call({ tool: 'Read', input: {} } as never)
    const ui = await $.ui.mount(HINT)
    expect(await ui.find({ text: '31k' })).toBeDefined()
    size.tokens = 47000
    await $.tool.call({ tool: 'Read', input: {} } as never)
    await flush()
    expect(await ui.find({ text: '47k' })).toBeDefined()
    await ui.unmount()
  })
})
