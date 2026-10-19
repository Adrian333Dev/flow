import { describe, expect, test } from 'claude-code/testing'
import { afterAnswer, restartMessages } from './first-message'

const REFUSAL = { skip: 'Flow compacts only at its own restart. Run /restart.' }

const exchange = { size: 150000, reply: 'REPLY', asked: ['ONE', 'TWO'], changed: ['/a.ts', '/b.ts'] }

describe('restartMessages', () => {
  test('an automatic restart keeps the note, the last reply and every unanswered message, in that order', () => {
    const [head, reply, one, two, ...rest] = restartMessages('NOTE', exchange, false)
    expect(rest).toHaveLength(0)
    expect(head).toMatchObject({ role: 'user' })
    expect(head!.text).toContain('Restarted at 150k.')
    expect(head!.text).toContain('Changed since that reply: /a.ts, /b.ts.')
    expect(head!.text).toContain('Note:\nNOTE')
    expect(head!.text).toContain('answer every point')
    expect(reply).toEqual({ role: 'assistant', text: 'REPLY', toolUses: [] })
    expect([one!.text, two!.text]).toEqual(['ONE', 'TWO'])
    expect([one!.role, two!.role]).toEqual(['user', 'user'])
  })

  test('a typed restart keeps the note and the reply, and says nothing runs', () => {
    const messages = restartMessages('NOTE', { ...exchange, asked: [], changed: [] }, true)
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(messages[0]!.text).toContain('Nothing runs now.')
    expect(messages[0]!.text).not.toContain('Changed since')
  })

  test('with no reply yet, the note stands alone', () => {
    const messages = restartMessages('NOTE', { size: 150000, asked: [], changed: [] }, false)
    expect(messages).toHaveLength(1)
    expect(messages[0]!.text).toContain('Continue from the note.')
  })

  test('a long list of changed files is cut at 30', () => {
    const changed = Array.from({ length: 33 }, (_, i) => `/f${i}`)
    expect(restartMessages('N', { ...exchange, changed }, false)[0]!.text).toContain('/f29 +3 more.')
  })
})

describe('afterAnswer', () => {
  const held = { reply: 'REAL', asked: ['ONE'], changed: ['/a.ts'] }

  test('a finished answer becomes the last reply and clears what was asked and changed', () => {
    expect(afterAnswer(held, 'NEW', false)).toEqual({ reply: 'NEW', asked: [], changed: [] })
  })

  test('the closing line of a restart turn changes nothing', () => {
    expect(afterAnswer(held, 'Restarting now.', true)).toBe(held)
  })

  test('an empty answer changes nothing', () => {
    expect(afterAnswer(held, '  ', false)).toBe(held)
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
