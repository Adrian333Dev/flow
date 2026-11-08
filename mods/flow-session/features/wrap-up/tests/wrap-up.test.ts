import { describe, expect, test } from 'claude-code/testing'
import { BUILD_LINES, HARD, LEAD, SAVE_LINES, linesFor, offersRestart, wrapUpLine, wrapUpSettings } from '../wrap-up'

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
  const FINISH = 'Context is large. Carry on. Restart at the next break: the work in hand finished, or the user turning to something new. Run capture first.'
  const STOP = 'Context is very large. Restart at the end of this step, discussion or not. Run capture first.'

  test('is silent under the limit: no size notice at any mark', () => {
    for (const [before, now] of [[0, 119000], [110000, 122000], [128000, 131000], [141000, 149999]]) expect(wrapUpLine(before!, now!, 150000)).toBeUndefined()
  })

  test('says restart at the next break when the size crosses the limit', () => {
    expect(wrapUpLine(149000, 152300, 150000)).toBe(FINISH)
    expect(wrapUpLine(0, 150000, 150000)).toBe(FINISH)
  })

  test('says restart at the end of this step when the size crosses 100k past the limit', () => {
    expect(HARD).toBe(100000)
    expect(wrapUpLine(152300, 260000, 150000)).toBe(STOP)
    expect(wrapUpLine(249999, 250001, 150000)).toBe(STOP)
  })

  test('says each once, never on a check between or after the marks', () => {
    expect(wrapUpLine(152300, 200000, 150000)).toBeUndefined()
    expect(wrapUpLine(250000, 300000, 150000)).toBeUndefined()
  })

  test('a size that jumps past both marks gets the second line alone', () => {
    expect(wrapUpLine(140000, 265000, 150000)).toBe(STOP)
  })

  test('names no size and no handoff', () => {
    for (const line of [FINISH, STOP]) expect(line).not.toMatch(/\d|handoff/)
  })
})

describe('linesFor', () => {
  test('a build gets the restart lines; every other phase and no ticket gets the save line', () => {
    expect(linesFor('BUILD 2/5')).toBe(BUILD_LINES)
    expect(linesFor('BUILD')).toBe(BUILD_LINES)
    for (const word of ['DESIGN 1/4', 'DEBUG', 'in-progress', undefined]) expect(linesFor(word)).toBe(SAVE_LINES)
  })

  test('the save line comes once, at the limit, and never asks for a restart', () => {
    expect(wrapUpLine(149000, 152300, 150000, SAVE_LINES)).toBe(SAVE_LINES.finish)
    expect(wrapUpLine(152300, 260000, 150000, SAVE_LINES)).toBeUndefined()
    expect(wrapUpLine(140000, 265000, 150000, SAVE_LINES)).toBe(SAVE_LINES.finish)
    expect(SAVE_LINES.finish).toContain('Never call restart')
    expect(SAVE_LINES.finish).not.toMatch(/\d|handoff/)
  })
})

describe('wrapUpSettings', () => {
  test('defaults to 200k, on', () => {
    expect(wrapUpSettings()).toEqual({ wrapUp: true, limit: 200000 })
    expect(wrapUpSettings('not json', '[]')).toEqual({ wrapUp: true, limit: 200000 })
  })

  test('wrapUpAt moves the limit and the local file wins', () => {
    expect(wrapUpSettings('{"wrapUpAt": 100000}').limit).toBe(100000)
    expect(wrapUpSettings('{"wrapUpAt": 100000}', '{"wrapUpAt": 80000}').limit).toBe(80000)
    expect(wrapUpSettings('{"wrapUpAt": -5}').limit).toBe(200000)
  })

  test('"wrapUp": false in settings.json silences it, and the local file cannot switch it', () => {
    expect(wrapUpSettings('{"wrapUp": false}').wrapUp).toBe(false)
    expect(wrapUpSettings('{}', '{"wrapUp": false}').wrapUp).toBe(true)
  })
})
