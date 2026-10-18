import { describe, expect, test } from 'claude-code/testing'
import type { Entry } from '../types'
import { DONE_WORD, SPIN_CELLS, apply, currentId, layout, mix, setActing, spinnerAt, waveShares } from './band-model'
import type { Ticket } from './ticket'

const entry = (id: string, over: Partial<Entry> = {}): Entry => ({
  id,
  name: `${id}-name`,
  word: 'BUILD 1/2',
  isDone: false,
  acting: false,
  ...over,
})

const ticket = (id: string, status: string, word = 'BUILD 1/2'): Ticket => ({ id, name: `${id}-name`, status, word })
const ids = (entries: readonly Entry[]) => entries.map((e) => e.id)

describe('apply', () => {
  test('lights an unlit ticket only when the command lights', () => {
    expect(apply([], ticket('a', 'in-progress'), false)).toEqual([])
    expect(ids(apply([], ticket('a', 'in-progress'), true))).toEqual(['a'])
  })

  test('tickets join first in, first out and keep their place', () => {
    const joined = apply(apply([], ticket('a', 'in-progress'), true), ticket('b', 'in-progress'), true)
    expect(ids(joined)).toEqual(['a', 'b'])
    const again = apply(joined, ticket('a', 'in-progress', 'BUILD 2/2'), false)
    expect(ids(again)).toEqual(['a', 'b'])
    expect(again[0]?.word).toBe('BUILD 2/2')
  })

  test('a ticket lit anew drops the closed ones, and a read of a lit ticket drops nothing', () => {
    const closed = entry('a', { isDone: true, word: DONE_WORD })
    expect(ids(apply([closed, entry('b')], ticket('c', 'in-progress'), true))).toEqual(['b', 'c'])
    expect(ids(apply([closed, entry('b')], ticket('b', 'in-progress'), false))).toEqual(['a', 'b'])
  })

  test('a parked, dropped or todo ticket leaves at once', () => {
    for (const status of ['todo', 'parked', 'dropped']) {
      expect(ids(apply([entry('a'), entry('b')], ticket('a', status), false))).toEqual(['b'])
    }
  })

  test('a closed ticket turns DONE in place, and a closed ticket never lit is ignored', () => {
    const [done, other] = apply([entry('a', { acting: true }), entry('b')], ticket('a', 'done'), false)
    expect(done).toMatchObject({ id: 'a', word: DONE_WORD, isDone: true, acting: false })
    expect(other?.id).toBe('b')
    expect(apply([entry('b')], ticket('a', 'done'), true)).toEqual([entry('b')])
  })
})

describe('setActing', () => {
  test('marks only the badge named, moves it, and clears all with none', () => {
    const on = setActing([entry('a'), entry('b')], 'b')
    expect(on.map((e) => e.acting)).toEqual([false, true])
    expect(setActing(on, 'a').map((e) => e.acting)).toEqual([true, false])
    expect(setActing(on, undefined).map((e) => e.acting)).toEqual([false, false])
  })

  test('a closed badge never acts', () => {
    expect(setActing([entry('a', { isDone: true })], 'a')[0]?.acting).toBe(false)
  })
})

describe('currentId', () => {
  test('is the preferred badge while it is open, else the newest open one', () => {
    const band = [entry('a'), entry('b'), entry('c', { isDone: true })]
    expect(currentId(band, 'a')).toBe('a')
    expect(currentId(band, 'c')).toBe('b')
    expect(currentId(band, undefined)).toBe('b')
    expect(currentId([entry('c', { isDone: true })], 'c')).toBeUndefined()
    expect(currentId([], 'a')).toBeUndefined()
  })
})

describe('layout', () => {
  const two = [entry('fw-16', { name: 'fw-16-flow-redesign', word: 'DESIGN 36/56' }), entry('fw-71', { name: 'fw-71-ticket-names-files', word: 'BUILD 2/5' })]

  test('the corner is the only padding; the status takes one space after the name', () => {
    const row = layout([two[1]!], 93, 0)
    expect(row.badges[0]).toMatchObject({ name: 'fw-71-ticket-names-files', status: ' BUILD 2/5' })
  })

  test('badges keep their order and the issue count sits at the right edge', () => {
    const row = layout(two, 93, 2)
    expect(row.badges.map((b) => b.id)).toEqual(['fw-16', 'fw-71'])
    expect(row.issues).toBe('2 issues')
    const left = row.badges.reduce((n, b) => n + b.name.length + b.status.length + 2, 0) + 2
    expect(left + row.space + row.issues.length).toBe(93)
  })

  test('one issue is singular, none draws nothing', () => {
    expect(layout(two, 93, 1).issues).toBe('1 issue')
    expect(layout(two, 93, 0).issues).toBe('')
  })

  test('badges that do not fit fold into +N', () => {
    const row = layout(two, 80, 2)
    expect(row.badges).toHaveLength(1)
    expect(row.folded).toBe(1)
    const three = layout([...two, entry('fw-90', { name: 'fw-90-machine-name-wsl', word: 'DEBUG' })], 93, 2)
    expect(three.badges).toHaveLength(2)
    expect(three.folded).toBe(1)
  })

  test('the row never exceeds its width', () => {
    for (let columns = 60; columns < 120; columns++) {
      const row = layout(two, columns, 12)
      const left = row.badges.reduce((n, b, i) => n + b.name.length + b.status.length + 2 + (i ? 2 : 0), 0) + (row.folded ? ` +${row.folded}`.length : 0)
      expect(left + row.space + row.issues.length).toBe(columns)
    }
  })

  test('a badge that acts takes 2 more cells for its spinner, and the row still fits', () => {
    const acting = [{ ...two[1]!, acting: true }]
    const row = layout(acting, 93, 2)
    const idle = layout([two[1]!], 93, 2)
    expect(idle.space - row.space).toBe(SPIN_CELLS)
    expect(row.badges[0]?.acting).toBe(true)
  })

  test('an empty band has no badges', () => {
    expect(layout([], 93, 0)).toMatchObject({ badges: [], folded: 0, issues: '' })
  })
})

describe('mix', () => {
  test('goes the share of the way between two colours', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(mix('#16191d', '#ffb703', 0.07)).toBe('#26241b')
  })
})

describe('spinnerAt', () => {
  test('turns through 10 braille cells, a step each frame, then starts over', () => {
    expect([0, 1, 2, 9, 10].map(spinnerAt)).toEqual(['⠋', '⠙', '⠹', '⠏', '⠋'])
  })
})

describe('waveShares', () => {
  test('starts over at once after the wave has crossed, with no rest', () => {
    expect(waveShares(10, 10 + 2)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0.35])
    expect(waveShares(10, 13)).toEqual(waveShares(10, 0))
  })

  test('starts at the left edge and moves a cell a frame', () => {
    expect(waveShares(10, 3).slice(0, 3)).toEqual([0.35, 1, 0.35])
    expect(waveShares(10, 4).slice(1, 4)).toEqual([0.35, 1, 0.35])
  })

  test('one share for each letter', () => {
    expect(waveShares(7, 123)).toHaveLength(7)
  })
})
