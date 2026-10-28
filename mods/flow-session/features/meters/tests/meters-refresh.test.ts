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
