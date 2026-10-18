import { describe, expect, test } from 'claude-code/testing'
import { SEPARATOR, effortColour, fit, meters, modelColour, modelName, remaining, widthOf, type Meter, type Reading } from './meters'

const NOW = Date.parse('2026-10-18T12:00:00Z')
const at = (ms: number) => new Date(NOW + ms).toISOString()
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

const reading = (over: Partial<Reading> = {}): Reading => ({
  model: 'claude-opus-5-5',
  effort: 'high',
  tokens: 142000,
  limit: 150000,
  rates: [
    { kind: 'five_hour', percentUsed: 38 },
    { kind: 'seven_day', percentUsed: 81, resetsAt: at(52 * HOUR) },
  ],
  coldAt: NOW + 47 * MINUTE,
  ...over,
})

const text = (list: ReturnType<typeof meters>) => list.map((m) => (m.label ? `${m.label} ${m.value}` : m.value)).join(SEPARATOR)

describe('modelName', () => {
  test('reads a model id as the name the user types', () => {
    expect(modelName('claude-opus-5-5')).toBe('opus 5.5')
    expect(modelName('claude-sonnet-5-5[1m]')).toBe('sonnet 5.5')
    expect(modelName('claude-haiku-4-5-20251001')).toBe('haiku 4.5')
    expect(modelName('my-model')).toBe('my model')
  })
})

describe('colours', () => {
  test('a model has its family colour, darker the more powerful, and fable its own hue', () => {
    const light = (id: string) => parseInt(modelColour(id).slice(1), 16)
    const red = (id: string) => light(id) >> 8 & 255
    expect(red('claude-opus-5-5')).toBeLessThan(red('claude-sonnet-5-5'))
    expect(red('claude-sonnet-5-5')).toBeLessThan(red('claude-haiku-5-5'))
    expect(modelColour('claude-fable-5-1')).not.toBe(modelColour('claude-opus-5-5'))
    expect(modelColour('my-model')).toBe(modelColour('claude-opus-5-5'))
  })

  test('an effort level has a colour, an unlisted one none, and only ultra is purple', () => {
    for (const level of ['low', 'medium', 'high', 'xhigh', 'max', 'ultra']) expect(effortColour(level)).toBeDefined()
    expect(effortColour('turbo')).toBeUndefined()
    expect(effortColour('ultracode')).toBe(effortColour('ultra'))
    expect(effortColour('max')).not.toBe(effortColour('ultra'))
  })

  test('the model meter carries the name and the effort as two coloured pieces', () => {
    const model = meters(reading(), NOW)[0] as Meter
    expect(model.parts?.map((part) => part.text)).toEqual(['opus 5.5', ' high'])
    expect(model.parts?.map((part) => part.text).join('')).toBe(model.value)
  })
})

describe('remaining', () => {
  test('shows minutes, hours with minutes, then days with hours', () => {
    expect(remaining(47 * MINUTE)).toBe('47m')
    expect(remaining(3 * HOUR + 12 * MINUTE)).toBe('3h12m')
    expect(remaining(52 * HOUR)).toBe('2d4h')
    expect(remaining(-5 * MINUTE)).toBe('0m')
  })
})

describe('meters', () => {
  test('draws the row of the mockup, in order', () => {
    expect(text(meters(reading(), NOW))).toBe('opus 5.5 high │ context 142k/150k │ 5h 38% │ week 81% 2d4h │ cache 47m')
  })

  test('a limit shows its reset only above 70%', () => {
    const list = meters(reading({ rates: [{ kind: 'five_hour', percentUsed: 70, resetsAt: at(HOUR) }, { kind: 'seven_day', percentUsed: 71, resetsAt: at(HOUR) }] }), NOW)
    expect(text(list)).toContain('5h 70% │ week 71% 1h0m')
  })

  test('a limit with no reset time shows its percent alone', () => {
    expect(text(meters(reading({ rates: [{ kind: 'five_hour', percentUsed: 95 }] }), NOW))).toContain('5h 95% │')
  })

  test('the tones follow the figures', () => {
    const tone = (over: Partial<Reading>, id: string) => meters(reading(over), NOW).find((m) => m.id === id)?.tone
    expect(tone({ tokens: 99000 }, 'context')).toBe('ok')
    expect(tone({ tokens: 100000 }, 'context')).toBe('warn')
    expect(tone({ tokens: 150000 }, 'context')).toBe('bad')
    expect(tone({ rates: [{ kind: 'five_hour', percentUsed: 90 }] }, 'five')).toBe('bad')
    expect(tone({ rates: [{ kind: 'five_hour', percentUsed: 75 }] }, 'five')).toBe('warn')
    expect(tone({ coldAt: NOW + 5 * MINUTE }, 'cache')).toBe('warn')
    expect(tone({ coldAt: NOW + 6 * MINUTE }, 'cache')).toBe('ok')
  })

  test('a cache past its time reads cold', () => {
    const cache = meters(reading({ coldAt: NOW - 1 }), NOW).find((m) => m.id === 'cache')
    expect(cache).toEqual({ id: 'cache', label: 'cache', value: 'cold', tone: 'bad' })
  })

  test('a meter with no figure is left out', () => {
    const list = meters({ limit: 150000, rates: [] }, NOW)
    expect(list).toEqual([])
    expect(text(meters(reading({ effort: undefined, rates: [], coldAt: undefined }), NOW))).toBe('opus 5.5 │ context 142k/150k')
  })
})

describe('fit', () => {
  const all = meters(reading(), NOW)
  const ids = (list: readonly { id: string }[]) => list.map((m) => m.id)

  test('keeps every meter when the row is wide enough', () => {
    const width = all.reduce((sum, m) => sum + widthOf(m), 0) + SEPARATOR.length * (all.length - 1)
    expect(ids(fit(all, width))).toEqual(['model', 'context', 'five', 'week', 'cache'])
    expect(ids(fit(all, width - 1))).toEqual(['model', 'context', 'five', 'week'])
  })

  test('drops the cache, then the model, then the week, then the 5-hour limit', () => {
    expect(ids(fit(all, 62))).toEqual(['model', 'context', 'five', 'week'])
    expect(ids(fit(all, 45))).toEqual(['context', 'five', 'week'])
    expect(ids(fit(all, 30))).toEqual(['context', 'five'])
    expect(ids(fit(all, 20))).toEqual(['context'])
  })

  test('the context is the last to go, and a row too narrow for it is empty', () => {
    expect(ids(fit(all, widthOf(all[1] as Meter)))).toEqual(['context'])
    expect(fit(all, 1)).toEqual([])
    expect(fit([], 10)).toEqual([])
  })
})
