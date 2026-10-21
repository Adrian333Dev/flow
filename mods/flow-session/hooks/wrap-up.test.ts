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
  const FINISH = 'Finish this step, then call the restart tool with your note.'
  const STOP = 'Stop now and call the restart tool with your note.'

  test('is silent under the limit: no size notice at any mark', () => {
    for (const [before, now] of [[0, 119000], [110000, 122000], [128000, 131000], [141000, 149999]]) expect(wrapUpLine(before!, now!, 150000)).toBeUndefined()
  })

  test('says finish this step when the size crosses the limit', () => {
    expect(wrapUpLine(149000, 152300, 150000)).toBe(FINISH)
    expect(wrapUpLine(0, 150000, 150000)).toBe(FINISH)
  })

  test('says stop now when the size crosses 30k past the limit', () => {
    expect(wrapUpLine(152300, 180000, 150000)).toBe(STOP)
    expect(wrapUpLine(179999, 180001, 150000)).toBe(STOP)
  })

  test('says each once, never on a check between or after the marks', () => {
    expect(wrapUpLine(152300, 160000, 150000)).toBeUndefined()
    expect(wrapUpLine(180000, 230000, 150000)).toBeUndefined()
  })

  test('a size that jumps past both marks gets the second line alone', () => {
    expect(wrapUpLine(140000, 215000, 150000)).toBe(STOP)
  })

  test('names no size and no handoff', () => {
    for (const line of [FINISH, STOP]) expect(line).not.toMatch(/\d|handoff/)
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
