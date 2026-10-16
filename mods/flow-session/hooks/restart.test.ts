import { describe, expect, test } from 'claude-code/testing'
import { firstMessage } from './first-message'

const REFUSAL = { skip: 'Flow compacts only at its own restart. Run /restart.' }

describe('firstMessage', () => {
  test('holds the message the agent wrote', () => {
    expect(firstMessage('MESSAGE')).toContain('MESSAGE')
  })
})

describe('compaction', () => {
  test('a typed /compact is refused', async ($) => {
    expect(await $.session.compact({ trigger: 'manual', messages: [] })).toEqual(REFUSAL)
  })

  test('an automatic compaction is refused', async ($) => {
    expect(await $.session.compact({ trigger: 'auto', messages: [] })).toEqual(REFUSAL)
  })
})

describe('restart tool', () => {
  test('refuses a call with no message', async ($) => {
    const result = await $.tool.call({ tool: 'mcp__flow-session__restart', message: '' } as never)
    expect(result).toEqual({ deny: 'Pass the start message as `message`.' })
  })
})

describe('/restart', () => {
  test('answers with a line saying the agent writes the start message', async ($) => {
    const result = await $.command.run({ command: 'restart', args: '' } as never)
    expect(result.text).toContain('the agent writes the start message')
  })
})
