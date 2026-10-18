import { describe, expect, test } from 'claude-code/testing'

import { isExpired, makeRecord, parseRecord, recordKey } from './record'

const ENTRY = { id: 'fw-9', name: 'fw-9-x', word: 'BUILD 1/2', isDone: false, acting: true }
const NOW = new Date('2026-10-18T00:00:00Z')

describe('the saved record', () => {
  test('is keyed by the session and never saves the wave', () => {
    expect(recordKey('abc')).toBe('session:abc')
    const record = makeRecord([ENTRY], NOW)
    expect(record).toEqual({ v: 1, updated: '2026-10-18T00:00:00.000Z', band: [{ ...ENTRY, acting: false }] })
  })

  test('reads back what it wrote, and refuses anything else', () => {
    expect(parseRecord(makeRecord([ENTRY], NOW))?.band).toHaveLength(1)
    expect(parseRecord('text')).toBeUndefined()
    expect(parseRecord({ v: 2, updated: NOW.toISOString(), band: [] })).toBeUndefined()
    expect(parseRecord({ v: 1, updated: 'never', band: [] })).toBeUndefined()
    expect(parseRecord({ v: 1, updated: NOW.toISOString(), band: [{ id: 1 }] })).toBeUndefined()
  })

  test('expires after 14 days, and a value that is no record expires at once', () => {
    const at = (days: number) => makeRecord([], new Date(NOW.getTime() - days * 86_400_000))
    expect(isExpired(at(13), NOW)).toBe(false)
    expect(isExpired(at(15), NOW)).toBe(true)
    expect(isExpired({ junk: true }, NOW)).toBe(true)
  })
})
