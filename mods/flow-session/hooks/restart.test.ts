import { describe, expect, test } from 'claude-code/testing'
import type { SessionMessage } from 'claude-code'
import { firstMessage, lastExchange } from './exchange'

const user = (text: string, toolResults?: SessionMessage['toolResults']): SessionMessage => ({
  role: 'user',
  text,
  toolUses: [],
  toolResults,
})
const assistant = (text: string, toolUses: SessionMessage['toolUses'] = []): SessionMessage => ({
  role: 'assistant',
  text,
  toolUses,
})

describe('lastExchange', () => {
  test('keeps the last typed prompt and the plain replies after it', () => {
    const kept = lastExchange([user('first'), assistant('one'), user('second'), assistant('two')])
    expect(kept.map((m) => m.text)).toEqual(['second', 'two'])
  })

  test('drops tool blocks, which an aborted restart call leaves unpaired', () => {
    const call = { id: 'toolu_1', name: 'mcp__flow-session__restart', input: {} } as unknown as SessionMessage['toolUses'][number]
    const kept = lastExchange([user('go'), assistant('working'), assistant('', [call])])
    expect(kept.map((m) => m.text)).toEqual(['go', 'working'])
  })

  test('is empty when the user never typed a prompt', () => {
    expect(lastExchange([])).toEqual([])
  })
})

describe('firstMessage', () => {
  test('holds the note, then each ticket', () => {
    const text = firstMessage('NOTE', ['## fw-1\n\nbody'])
    expect(text.indexOf('NOTE')).toBeLessThan(text.indexOf('## fw-1'))
  })

  test('is the note alone when no ticket is in flight', () => {
    expect(firstMessage('NOTE', [])).not.toContain('tickets in flight')
  })
})

describe('compaction', () => {
  test('a typed /compact is refused', async ($) => {
    const result = await $.session.compact({ trigger: 'manual', messages: [] })
    expect(result).toEqual({ skip: 'Flow compacts only at its own restart. Run /flow:handoff.' })
  })

  test('an automatic compaction is refused', async ($) => {
    const result = await $.session.compact({ trigger: 'auto', messages: [] })
    expect(result).toEqual({ skip: 'Flow compacts only at its own restart. Run /flow:handoff.' })
  })
})

describe('restart tool', () => {
  test('refuses a call with no note', async ($) => {
    const result = await $.tool.call({ tool: 'mcp__flow-session__restart', note: '' } as never)
    expect(result).toEqual({ deny: 'Pass the handoff note as `note`.' })
  })
})
