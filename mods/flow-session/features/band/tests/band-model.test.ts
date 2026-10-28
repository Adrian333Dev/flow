import { describe, expect, test } from 'claude-code/testing'
import type { Entry } from '../../../shared/types'
import { DONE_WORD, GAP, RESTART_CELLS, RESTART_GAP, SPIN_CELLS, apply, currentId, layout, mix, setActing, spinnerAt, waveShares } from '../band-model'
import type { Ticket } from '../../../shared/ticket'

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

  test('the ticket started last goes leftmost, and a read keeps every place', () => {
    const joined = apply(apply([], ticket('a', 'in-progress'), true), ticket('b', 'in-progress'), true)
    expect(ids(joined)).toEqual(['b', 'a'])
    const again = apply(joined, ticket('a', 'in-progress', 'BUILD 2/2'), false)
    expect(ids(again)).toEqual(['b', 'a'])
    expect(again[1]?.word).toBe('BUILD 2/2')
  })

  test('a ticket started again goes leftmost, once', () => {
    const band = [entry('b'), entry('a')]
    expect(ids(apply(band, ticket('a', 'in-progress', 'DEBUG'), true))).toEqual(['a', 'b'])
    expect(apply(band, ticket('a', 'in-progress', 'DEBUG'), true)[0]?.word).toBe('DEBUG')
  })

  test('a ticket started drops the closed ones, and a read of a lit ticket drops nothing', () => {
    const closed = entry('a', { isDone: true, word: DONE_WORD })
    expect(ids(apply([closed, entry('b')], ticket('c', 'in-progress'), true))).toEqual(['c', 'b'])
    expect(ids(apply([closed, entry('b')], ticket('b', 'in-progress'), false))).toEqual(['a', 'b'])
  })

  test('a closed ticket started again opens in place of its DONE badge', () => {
    const closed = entry('a', { isDone: true, word: DONE_WORD })
    const [first, ...rest] = apply([entry('b'), closed], ticket('a', 'in-progress'), true)
    expect(first).toMatchObject({ id: 'a', isDone: false, word: 'BUILD 1/2' })
    expect(ids(rest)).toEqual(['b'])
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
  test('is the leftmost open badge, the one started last', () => {
    expect(currentId([entry('a'), entry('b')])).toBe('a')
    expect(currentId([entry('c', { isDone: true }), entry('a'), entry('b')])).toBe('a')
    expect(currentId([entry('c', { isDone: true })])).toBeUndefined()
    expect(currentId([])).toBeUndefined()
  })

  test('when the acting ticket closes, the one started before it acts', () => {
    const band = [entry('c'), entry('b'), entry('a')]
    expect(currentId(band)).toBe('c')
    expect(currentId(apply(band, ticket('c', 'done'), false))).toBe('b')
  })
})

describe('layout', () => {
  const two = [entry('fw-16', { name: 'fw-16-flow-redesign', word: 'DESIGN 36/56' }), entry('fw-71', { name: 'fw-71-ticket-names-files', word: 'BUILD 2/5' })]
  const many = Array.from({ length: 8 }, (_, n) => entry(`fw-${n}`, { name: `fw-${n}-some-ticket-name`, word: 'BUILD 12/34' }))
  const cellsOf = (row: ReturnType<typeof layout>) => row.badges.reduce((n, b, i) => n + b.name.length + b.status.length + 2 + (i ? GAP : 0), 0)

  test('the corner is the only padding; the status takes one space after the name', () => {
    const row = layout([two[1]!], 93, 0)
    expect(row.badges[0]).toMatchObject({ name: 'fw-71-ticket-names-files', status: ' BUILD 2/5' })
  })

  test('with room for all, every badge shows whole, in order, and the issue count sits at the right edge', () => {
    const row = layout(two, 93, 2)
    expect(row.badges.map((b) => b.name)).toEqual(['fw-16-flow-redesign', 'fw-71-ticket-names-files'])
    expect(row.issues).toBe('2 issues')
    expect(cellsOf(row) + row.space + row.issues.length).toBe(93)
  })

  test('one issue is singular, none draws nothing', () => {
    expect(layout(two, 93, 1).issues).toBe('1 issue')
    expect(layout(two, 93, 0).issues).toBe('')
  })

  test('with less room the main badge stays whole and the others show their id and word', () => {
    const row = layout(two, 70, 2)
    expect(row.badges.map((b) => b.name)).toEqual(['fw-16-flow-redesign', 'fw-71'])
    expect(row.badges[1]?.status).toBe(' BUILD 2/5')
    expect(row.folded).toBe(0)
  })

  test('with least room the others show their id alone, and what still does not fit folds into +N', () => {
    const row = layout(many, 70, 0)
    expect(row.badges.map((b) => b.name)).toEqual(['fw-0-some-ticket-name', 'fw-1', 'fw-2', 'fw-3', 'fw-4'])
    expect(row.badges[1]?.status).toBe('')
    expect(row.folded).toBe(3)
  })

  test('a closed badge keeps its ✓ as an id alone', () => {
    const closed = entry('fw-35', { isDone: true, word: DONE_WORD })
    const row = layout([entry('fw-1'), closed], 35, 0)
    expect(row.badges[1]).toMatchObject({ name: 'fw-35', status: ' ✓', isDone: true })
  })

  test('the main badge is the leftmost open one, even behind a closed badge', () => {
    const closed = entry('fw-35', { isDone: true, word: DONE_WORD })
    const row = layout([closed, entry('fw-1')], 35, 0)
    expect(row.badges.map((b) => b.name)).toEqual(['fw-35', 'fw-1-name'])
  })

  test('a main badge too wide for the row folds, and the count keeps its cells', () => {
    const wide = [entry('fw-1', { name: `fw-1-${'a'.repeat(60)}` })]
    expect(layout(wide, 80, 0).badges).toHaveLength(1)
    expect(layout(wide, 80, 3)).toMatchObject({ badges: [], folded: 1 })
  })

  test('no band exceeds its width, with or without the button', () => {
    for (let columns = 60; columns < 140; columns++) {
      for (const restart of [false, true]) {
        const row = layout(many, columns, 12, true, restart)
        const right = (restart ? RESTART_CELLS + RESTART_GAP : 0) + row.issues.length
        const fold = row.folded ? ` +${row.folded}`.length : 0
        expect(cellsOf(row) + fold + row.space + right).toBe(columns)
        expect(row.badges.length + row.folded).toBe(8)
      }
    }
  })

  test('the Restart button takes its cells before the issue count, and the badges give way', () => {
    const plain = layout(two, 100, 2)
    const button = layout(two, 100, 2, true, true)
    expect(button.restart).toBe(true)
    expect(plain.space - button.space).toBe(RESTART_CELLS + RESTART_GAP)
    expect(layout(two, 100, 0, true, true).space).toBe(plain.space + '2 issues'.length - RESTART_CELLS)
    expect(layout(many, 100, 2).folded).toBe(0)
    expect(layout(many, 100, 2, true, true).folded).toBeGreaterThan(0)
  })

  test('the Restart label and its corners are as wide as a bracketed button', () => {
    expect(RESTART_CELLS).toBe('[ Restart ]'.length)
  })

  test('the Restart button shows with no badge at all', () => {
    expect(layout([], 93, 0, true, true)).toMatchObject({ badges: [], restart: true })
  })

  test('a badge that acts takes 2 more cells for its spinner, and the row still fits', () => {
    const acting = [{ ...two[1]!, acting: true }]
    const row = layout(acting, 93, 2)
    const idle = layout([two[1]!], 93, 2)
    expect(idle.space - row.space).toBe(SPIN_CELLS)
    expect(row.badges[0]?.acting).toBe(true)
  })

  test('an empty band has no badges', () => {
    expect(layout([], 93, 0)).toMatchObject({ badges: [], folded: 0, issues: '', restart: false })
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
