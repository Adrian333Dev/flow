import { describe, expect, test } from 'claude-code/testing'
import { freshSuggestion } from '../fresh'

describe('freshSuggestion', () => {
  test('says nothing under 120k', () => {
    expect(freshSuggestion(0, 119000)).toBeUndefined()
  })

  test('speaks at 120k, then once every 30k', () => {
    expect(freshSuggestion(110000, 121000)).toContain('/fresh')
    expect(freshSuggestion(121000, 140000)).toBeUndefined()
    expect(freshSuggestion(140000, 151000)).toContain('context 151k')
  })

  test('after a restart the marks speak again from below', () => {
    expect(freshSuggestion(210000, 40000)).toBeUndefined()
    expect(freshSuggestion(40000, 125000)).toContain('/fresh')
  })
})

describe('/fresh', () => {
  test('answers that a fresh window opens', async ($) => {
    const result = await $.command.run({ command: 'fresh', args: '' } as never)
    expect(result.text).toBe('Opening a fresh window.')
  })

  test('holds a restart record, so the restart tool is refused meanwhile', async ($) => {
    await $.command.run({ command: 'fresh', args: '' } as never)
    expect(await $.tool.call({ tool: 'mcp__flow-session__restart', message: 'NOTE' } as never)).toEqual({ deny: 'A restart is already under way.' })
  })
})
