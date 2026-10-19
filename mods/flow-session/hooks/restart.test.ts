import { describe, expect, test } from 'claude-code/testing'
import type { SessionMessage } from 'claude-code'
import { addAsked, afterAnswer, lastReply, restartMessages } from './first-message'

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

describe('lastReply', () => {
  const TOOL = 'mcp__flow-session__restart'
  const said = (text: string): SessionMessage => ({ role: 'assistant', text, toolUses: [] })
  const asked = (text: string): SessionMessage => ({ role: 'user', text, toolUses: [] })
  const called = (tool: string, text = ''): SessionMessage => ({
    role: 'assistant',
    text,
    toolUses: [{ tool_use_id: tool, tool, input: {} }],
  })
  const result: SessionMessage = { role: 'user', text: '', toolUses: [], toolResults: [{ tool_use_id: 'x', text: 'ok', isError: false, result: 'ok' }] }

  test('is the last assistant text that calls no tool, whatever the memory holds', () => {
    const messages = [asked('A'), said('FIRST'), asked('B'), called('Read', 'looking'), result, said('SECOND'), asked('C'), called('Bash'), result]
    expect(lastReply(messages, TOOL)).toBe('SECOND')
  })

  test('the restart call and the closing line after it are no reply', () => {
    const messages = [asked('A'), said('REAL'), asked('B'), called('Read'), result, called(TOOL, 'Restarting.'), result, said('Restarting now.')]
    expect(lastReply(messages, TOOL)).toBe('REAL')
  })

  test('the lead-in text before the restart call is no reply, when the host lists it as its own message', () => {
    const messages = [asked('A'), said('REAL'), asked('B'), said('Now calling the restart.'), called(TOOL), result]
    expect(lastReply(messages, TOOL)).toBe('REAL')
  })

  test('the lead-in text is no reply when the call itself is gone from the list', () => {
    expect(lastReply([asked('A'), said('REAL'), asked('B'), said('Now calling the restart.')], TOOL)).toBe('REAL')
  })

  test('narration between tool calls is no reply', () => {
    const messages = [asked('A'), said('REAL'), asked('B'), said('Reading.'), called('Read'), result, said('Editing.'), called('Edit'), result, said('Restarting.'), called(TOOL)]
    expect(lastReply(messages, TOOL)).toBe('REAL')
  })

  test('a restart right after another one finds the reply the first one carried', () => {
    const messages = [asked('Restarted at 50k.'), said('CARRIED'), asked('B'), called(TOOL), result]
    expect(lastReply(messages, TOOL)).toBe('CARRIED')
  })

  test('a blank reply is skipped', () => {
    expect(lastReply([said('REAL'), asked('B'), said('  '), asked('C')], TOOL)).toBe('REAL')
  })

  test('a conversation with no reply yet has none', () => {
    expect(lastReply([asked('A'), called(TOOL)], TOOL)).toBeUndefined()
    expect(lastReply([], TOOL)).toBeUndefined()
  })
})

describe('afterAnswer', () => {
  const held = { asked: ['ONE'], changed: ['/a.ts'] }

  test('a finished answer clears what was asked and changed', () => {
    expect(afterAnswer(held, 'NEW', false)).toEqual({ asked: [], changed: [] })
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

  test('holds the restart in host state, so a second call is refused', async ($) => {
    const call = { tool: 'mcp__flow-session__restart', message: 'NOTE' } as never
    expect(await $.tool.call(call)).toMatchObject({ result: expect.any(String) })
    expect(await $.tool.call(call)).toEqual({ deny: 'A restart is already under way.' })
  })
})

describe('/restart', () => {
  test('answers with a line saying the agent writes the start message', async ($) => {
    const result = await $.command.run({ command: 'restart', args: '' } as never)
    expect(result.text).toContain('the agent writes the start message')
  })
})

describe('addAsked', () => {
  test('a message sent again with more words replaces the first one', () => {
    expect(addAsked(['Okay, here you go. Right?'], 'Okay, here you go. Right? Also the meters.')).toEqual(['Okay, here you go. Right? Also the meters.'])
  })

  test('separate messages are all kept, in order', () => {
    expect(addAsked(['yes'], 'and the next one')).toEqual(['yes', 'and the next one'])
  })

  test('a word that merely starts the new message is kept', () => {
    expect(addAsked(['yes'], 'yesterday it broke')).toEqual(['yes', 'yesterday it broke'])
  })

  test('only the messages the new one repeats are dropped', () => {
    expect(addAsked(['A one', 'B two'], 'A one and more')).toEqual(['B two', 'A one and more'])
  })

  test('a blank earlier message is kept as it was', () => {
    expect(addAsked(['  '], 'X')).toEqual(['  ', 'X'])
  })
})
