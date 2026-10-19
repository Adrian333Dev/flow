import { describe, expect, test } from 'claude-code/testing'
import { describeScenario, parseMock, parseScenarios, usage, withActing, type Scenario } from './band-mock'
import { layout } from './band-model'

const NAMES = ['one', 'two', 'wave']
const badge = (id: string, word: string, more: object = {}) => ({ id, slug: 'a-ticket-with-a-long-name', word, ...more })
// A file cannot be imported here (only code files load), so the shape of band-scenarios.json is repeated in small.
const { scenarios } = parseScenarios(
  JSON.stringify({
    one: { badges: [badge('fw-137', 'BUILD 2/5')] },
    wave: { badges: [badge('fw-137', 'BUILD 2/5', { acting: true }), badge('fw-138', 'DESIGN 1/3')] },
    done: { badges: [badge('fw-35', 'DONE ✓', { done: true }), badge('fw-137', 'BUILD 2/5')] },
    fold: { badges: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c'].map((n) => badge(`fw-14${n}`, 'DESIGN 2/6')) },
    wrap: { badges: ['1', '2', '3', '4', '5'].map((n) => badge(`fw-14${n}`, 'DESIGN 2/6')) },
    restart: { badges: [badge('fw-137', 'BUILD 2/5')], restart: true },
    narrow: { badges: [badge('fw-137', 'BUILD 2/5'), badge('fw-138', 'DESIGN 1/3')], issues: 2, columns: 60 },
  }),
)
const at = (name: string) => scenarios[name] as Scenario

describe('parseMock', () => {
  test('a scenario name shows it', () => {
    expect(parseMock(' Wave ', NAMES, undefined, undefined)).toEqual({ show: 'wave' })
  })
  test('a number shows the scenario at that place, and a number past the end asks for the usage', () => {
    expect(parseMock('2', NAMES, undefined, undefined)).toEqual({ show: 'two' })
    expect(parseMock('3', NAMES, 'one', 'one')).toEqual({ show: 'wave' })
    expect(parseMock('0', NAMES, undefined, undefined)).toEqual({ help: true })
    expect(parseMock('4', NAMES, undefined, undefined)).toEqual({ help: true })
  })
  test('off puts the real band back', () => {
    expect(parseMock('off', NAMES, 'one', undefined)).toEqual({ off: true })
  })
  test('a bare /band switches off when on, else shows the last scenario or the first', () => {
    expect(parseMock('', NAMES, 'two', 'two')).toEqual({ off: true })
    expect(parseMock('', NAMES, undefined, 'two')).toEqual({ show: 'two' })
    expect(parseMock('', NAMES, undefined, undefined)).toEqual({ show: 'one' })
    expect(parseMock('', NAMES, undefined, 'gone')).toEqual({ show: 'one' })
    expect(parseMock('on', NAMES, 'two', 'two')).toEqual({ show: 'two' })
  })
  test('next steps from the scenario shown, then wraps', () => {
    expect(parseMock('next', NAMES, undefined, undefined)).toEqual({ show: 'one' })
    expect(parseMock('next', NAMES, 'one', 'one')).toEqual({ show: 'two' })
    expect(parseMock('next', NAMES, 'wave', 'wave')).toEqual({ show: 'one' })
  })
  test('act and list are commands of their own', () => {
    expect(parseMock('act', NAMES, 'one', 'one')).toEqual({ acting: true })
    expect(parseMock('list', NAMES, undefined, undefined)).toEqual({ list: true })
  })
  test('anything else, or no scenario at all, asks for the usage', () => {
    expect(parseMock('nope', NAMES, undefined, undefined)).toEqual({ help: true })
    expect(parseMock('', [], undefined, undefined)).toEqual({ help: true })
    expect(usage(NAMES)).toContain('wave')
    expect(usage(NAMES)).toContain('clear')
  })
})

describe('parseScenarios', () => {
  test('reads badges, issues and columns, and drops a scenario with no valid badge', () => {
    const text = JSON.stringify({
      ok: { badges: [{ id: 'fw-1', slug: 'x', word: 'BUILD 1/2', done: false }], issues: 2, columns: 50 },
      empty: { badges: [{ id: 'fw-2' }] },
    })
    const { scenarios: read, error } = parseScenarios(text)
    expect(error).toBeUndefined()
    expect(Object.keys(read)).toEqual(['ok'])
    expect(read.ok).toMatchObject({ issues: 2, columns: 50, restart: false, entries: [{ id: 'fw-1', name: 'fw-1-x', word: 'BUILD 1/2', isDone: false }] })
  })
  test('says why a broken file could not be read', () => {
    expect(parseScenarios('{ nope').error).toContain('not valid JSON')
    expect(parseScenarios('[]').error).toContain('object')
  })
})

describe('scenarios', () => {
  test('fold leaves badges out at 93 columns, and five fit with the others as ids alone', () => {
    expect(layout(at('fold').entries, 93, 0).folded).toBeGreaterThan(0)
    const five = layout(at('wrap').entries, 93, 0)
    expect(five.folded).toBe(0)
    expect(five.badges.map((badge) => badge.status)).toEqual([' DESIGN 2/6', '', '', '', ''])
    const { entries, issues, columns } = at('narrow')
    expect(layout(entries, columns ?? 0, issues).folded).toBe(1)
  })
  test('restart draws the button, and the others do not', () => {
    expect(at('restart').restart).toBe(true)
    expect(at('one').restart).toBe(false)
  })
  test('wave has a badge acting, done has one done', () => {
    expect(at('wave').entries.some((entry) => entry.acting)).toBe(true)
    expect(at('done').entries.some((entry) => entry.isDone)).toBe(true)
  })
  test('describeScenario names the badges and the extras', () => {
    expect(describeScenario('narrow', at('narrow'))).toBe('narrow: fw-137 BUILD 2/5, fw-138 DESIGN 1/3; 2 issues, 60 columns')
  })
})

describe('withActing', () => {
  test('puts the wave on every open badge and leaves a done one', () => {
    const shown = withActing(at('done').entries, true)
    expect(shown.map((entry) => entry.acting)).toEqual([false, true])
    expect(withActing(at('one').entries, false)[0]?.acting).toBe(false)
  })
})
