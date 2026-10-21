import { describe, expect, test } from 'claude-code/testing'
import { LEAD, offersRestart, wrapUpLine, wrapUpSettings } from './wrap-up'

describe('offersRestart', () => {
  const idle = { running: false, requested: false, restarting: false }

  test('is true from 30k under the limit and past it, while the wrap-up is on', () => {
    expect(LEAD).toBe(30000)
    expect(offersRestart(139999, 170000, true, idle)).toBe(false)
    expect(offersRestart(140000, 170000, true, idle)).toBe(true)
    expect(offersRestart(190000, 170000, true, idle)).toBe(true)
  })

  test('is false with no figure yet, and with the wrap-up off', () => {
    expect(offersRestart(undefined, 170000, true, idle)).toBe(false)
    expect(offersRestart(190000, 170000, false, idle)).toBe(false)
  })

  test('a limit under 30k offers it from the start', () => {
    expect(offersRestart(0, 20000, true, idle)).toBe(true)
  })

  test('is false while a turn runs, a press waits on the agent, or a restart is under way', () => {
    expect(offersRestart(150000, 170000, true, { ...idle, running: true })).toBe(false)
    expect(offersRestart(150000, 170000, true, { ...idle, requested: true })).toBe(false)
    expect(offersRestart(150000, 170000, true, { ...idle, restarting: true })).toBe(false)
  })
})

describe('wrapUpLine', () => {
  test('is silent more than 30k under the limit', () => {
    expect(wrapUpLine(0, 119000, 150000)).toBeUndefined()
  })

  test('gives the size every 10k from 30k under the limit, once each', () => {
    expect(wrapUpLine(110000, 122000, 150000)).toBe('Context 122k/150k')
    expect(wrapUpLine(122000, 128000, 150000)).toBeUndefined()
    expect(wrapUpLine(128000, 131000, 150000)).toBe('Context 131k/150k')
    expect(wrapUpLine(0, 145000, 150000)).toBe('Context 145k/150k')
    expect(wrapUpLine(141000, 149000, 150000)).toBeUndefined()
  })

  test('asks for the subagents, a handoff and the restart tool when the size crosses the limit', () => {
    expect(wrapUpLine(149000, 152300, 150000)).toBe(
      'Context 152k/150k. At the next checkpoint: wait for subagents, run /flow:handoff, call the restart tool.',
    )
  })

  test('skips the handoff while one stands', () => {
    expect(wrapUpLine(149000, 152300, 150000, true)).toBe(
      'Context 152k/150k. At the next checkpoint: wait for subagents, call the restart tool.',
    )
  })

  test('says it once, never on every check past the limit', () => {
    expect(wrapUpLine(152300, 160000, 150000)).toBeUndefined()
    expect(wrapUpLine(0, 155000, 150000)).toBeDefined()
  })

  test('says it again, firmer, every 20k past the limit', () => {
    expect(wrapUpLine(168000, 171000, 150000)).toBe(
      'Context 171k/150k. Finish this step, then wait for subagents, run /flow:handoff, call the restart tool.',
    )
    expect(wrapUpLine(171000, 189000, 150000)).toBeUndefined()
    expect(wrapUpLine(189000, 191000, 150000)).toBeDefined()
    expect(wrapUpLine(140000, 215000, 150000)).toBeDefined()
  })
})

describe('wrapUpSettings', () => {
  test('defaults to 170k, on', () => {
    expect(wrapUpSettings()).toEqual({ wrapUp: true, limit: 170000 })
    expect(wrapUpSettings('not json', '[]')).toEqual({ wrapUp: true, limit: 170000 })
  })

  test('wrapUpAt moves the limit and the local file wins', () => {
    expect(wrapUpSettings('{"wrapUpAt": 100000}').limit).toBe(100000)
    expect(wrapUpSettings('{"wrapUpAt": 100000}', '{"wrapUpAt": 80000}').limit).toBe(80000)
    expect(wrapUpSettings('{"wrapUpAt": -5}').limit).toBe(170000)
  })

  test('"wrapUp": false in settings.json silences it, and the local file cannot switch it', () => {
    expect(wrapUpSettings('{"wrapUp": false}').wrapUp).toBe(false)
    expect(wrapUpSettings('{}', '{"wrapUp": false}').wrapUp).toBe(true)
  })
})
