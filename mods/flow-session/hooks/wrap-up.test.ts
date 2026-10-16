import { describe, expect, test } from 'claude-code/testing'
import { wrapUpLine, wrapUpSettings } from './wrap-up'

describe('wrapUpLine', () => {
  test('is silent under the limit', () => {
    expect(wrapUpLine(140000, 149000, 150000)).toBeUndefined()
  })

  test('asks for the subagents, a handoff and the restart tool when the size crosses the limit', () => {
    expect(wrapUpLine(149000, 152300, 150000)).toBe(
      'The context is at 152k. At the next checkpoint, wait for running subagents, run /flow:handoff, then call the restart tool with a start message.',
    )
  })

  test('skips the handoff while one stands', () => {
    expect(wrapUpLine(149000, 152300, 150000, true)).toBe(
      'The context is at 152k. At the next checkpoint, wait for running subagents, then call the restart tool with a start message.',
    )
  })

  test('says it once, never on every check past the limit', () => {
    expect(wrapUpLine(152300, 160000, 150000)).toBeUndefined()
    expect(wrapUpLine(0, 155000, 150000)).toBeDefined()
  })

  test('says it again, firmer, every 20k past the limit', () => {
    expect(wrapUpLine(168000, 171000, 150000)).toBe(
      'The context is at 171k, past the 150k limit. Stop at the step you are on: finish it, wait for running subagents, run /flow:handoff, then call the restart tool with a start message.',
    )
    expect(wrapUpLine(171000, 189000, 150000)).toBeUndefined()
    expect(wrapUpLine(189000, 191000, 150000)).toBeDefined()
    expect(wrapUpLine(140000, 215000, 150000)).toBeDefined()
  })
})

describe('wrapUpSettings', () => {
  test('defaults to 150k, on', () => {
    expect(wrapUpSettings()).toEqual({ wrapUp: true, limit: 150000 })
    expect(wrapUpSettings('not json', '[]')).toEqual({ wrapUp: true, limit: 150000 })
  })

  test('wrapUpAt moves the limit and the local file wins', () => {
    expect(wrapUpSettings('{"wrapUpAt": 100000}').limit).toBe(100000)
    expect(wrapUpSettings('{"wrapUpAt": 100000}', '{"wrapUpAt": 80000}').limit).toBe(80000)
    expect(wrapUpSettings('{"wrapUpAt": -5}').limit).toBe(150000)
  })

  test('"wrapUp": false in settings.json silences it, and the local file cannot switch it', () => {
    expect(wrapUpSettings('{"wrapUp": false}').wrapUp).toBe(false)
    expect(wrapUpSettings('{}', '{"wrapUp": false}').wrapUp).toBe(true)
  })
})
