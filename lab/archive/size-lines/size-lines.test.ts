import { describe, expect, test } from 'claude-code/testing'
import { freshSuggestion, SIZE_EVERY, SIZE_FROM, sizeLine } from './size-lines'

describe('sizeLine', () => {
  test('says the size alone at 120k, then every 30k, past the wrap-up marks too', () => {
    expect([SIZE_FROM, SIZE_EVERY]).toEqual([120000, 30000])
    expect(sizeLine(118000, 121400)).toBe('Context: 121k tokens.')
    for (const mark of [150000, 180000, 210000, 240000, 270000, 300000, 330000]) expect(sizeLine(mark - 1000, mark + 2000)).toBe(`Context: ${(mark + 2000) / 1000}k tokens.`)
  })

  test('is silent under 120k and between marks', () => {
    for (const [before, now] of [[0, 119999], [100000, 119000], [121000, 149999], [150000, 179000]]) expect(sizeLine(before!, now!)).toBeUndefined()
  })

  test('a size that jumps several marks gets one line', () => {
    expect(sizeLine(0, 185000)).toBe('Context: 185k tokens.')
  })

  test('a size that fell, after a restart, starts again from 120k', () => {
    expect(sizeLine(260000, 40000)).toBeUndefined()
    expect(sizeLine(40000, 125000)).toBe('Context: 125k tokens.')
  })
})

describe('freshSuggestion', () => {
  test('says nothing under 120k', () => {
    expect(freshSuggestion(0, 119000)).toBeUndefined()
  })

  test('speaks at 120k, then once every 30k', () => {
    expect(freshSuggestion(110000, 121000)).toContain('/fresh')
    expect(freshSuggestion(121000, 140000)).toBeUndefined()
    expect(freshSuggestion(140000, 151000)).toContain('context 151k')
  })

  test('after a restart the marks speak again from below', () => {
    expect(freshSuggestion(210000, 40000)).toBeUndefined()
    expect(freshSuggestion(40000, 125000)).toContain('/fresh')
  })
})
