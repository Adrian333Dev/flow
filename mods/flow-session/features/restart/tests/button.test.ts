import { describe, expect, test } from 'claude-code/testing'
import type { Tracked } from '../../../shared/types'
import { busyWith, pressed, pressLost, restartEnded, turnEnded, turnStarted } from '../button'

const fresh: Tracked = { asked: [] }
const restart = { message: 'NOTE', files: [], skills: [], size: 150000, started: false, manual: true }

describe('busyWith', () => {
  test('a turn counts from the band flag or from the tracked turn, since a hot reload empties the flag', () => {
    expect(busyWith(fresh, false)).toEqual({ running: false, requested: false, restarting: false })
    expect(busyWith(fresh, true).running).toBe(true)
    expect(busyWith({ ...fresh, turn: 't1' }, false).running).toBe(true)
  })

  test('a press and a restart each count', () => {
    expect(busyWith(pressed(fresh), false).requested).toBe(true)
    expect(busyWith({ ...fresh, restart }, false).restarting).toBe(true)
  })
})

describe('a press', () => {
  test('sets requested and makes the restart typed', () => {
    expect(pressed(fresh)).toEqual({ ...fresh, typed: true, requested: {} })
  })

  test('is answered by the next main turn, which is then the turn it waits on', () => {
    const waiting = turnStarted(pressed(fresh), 't1')
    expect(waiting.turn).toBe('t1')
    expect(waiting.requested).toEqual({ turn: 't1' })
  })

  test('a later turn start does not take the press over', () => {
    expect(turnStarted(turnStarted(pressed(fresh), 't1'), 't2').requested).toEqual({ turn: 't1' })
  })

  test('that turn ending with no restart ends the press, so the button comes back', () => {
    const ended = turnEnded(turnStarted(pressed(fresh), 't1'), 't1')
    expect(ended).toEqual({ ...fresh, typed: false })
    expect(busyWith(ended, false)).toEqual({ running: false, requested: false, restarting: false })
  })

  test('that turn ending with a restart under way keeps the press until the restart ends', () => {
    const ended = turnEnded({ ...turnStarted(pressed(fresh), 't1'), restart }, 't1')
    expect(ended.requested).toEqual({ turn: 't1' })
    expect(ended.turn).toBeUndefined()
    expect(restartEnded(ended)).toEqual({ ...fresh, typed: true })
  })

  test('an ask that could not be sent ends the press', () => {
    expect(pressLost(pressed(fresh))).toEqual({ ...fresh, typed: false })
  })
})

describe('a turn with no press', () => {
  test('starts and ends, and leaves no turn behind', () => {
    const running = turnStarted(fresh, 't1')
    expect(busyWith(running, false).running).toBe(true)
    expect(busyWith(turnEnded(running, 't1'), false).running).toBe(false)
  })

  test('an end of some other turn changes nothing', () => {
    const running = turnStarted(fresh, 't2')
    expect(turnEnded(running, 't1')).toBe(running)
  })
})
