import { describe, expect, test } from 'claude-code/testing'
import { DEFAULT_LOOK, parseLook } from '../look'

describe('parseLook', () => {
  test('each sign is on unless the file says false', () => {
    expect(parseLook('{ "sweep": false, "spinner": true }')).toEqual({ ...DEFAULT_LOOK, sweep: false })
    expect(parseLook('{ "spinner": false }')).toEqual({ ...DEFAULT_LOOK, spinner: false })
    expect(parseLook('{ "sweep": false, "spinner": false }')).toEqual({ ...DEFAULT_LOOK, sweep: false, spinner: false })
  })
  test('the top row is on unless the file says false', () => {
    expect(parseLook('{ "topRow": false }')).toEqual({ ...DEFAULT_LOOK, topRow: false })
    expect(parseLook('{ "topRow": true }').topRow).toBe(true)
  })
  test('the band shows unless the file says false', () => {
    expect(parseLook('{ "shown": false }')).toEqual({ ...DEFAULT_LOOK, shown: false })
    expect(parseLook('{ "sweep": false }').shown).toBe(true)
  })
  test('a missing or broken file leaves all on', () => {
    expect(parseLook(undefined)).toEqual({ shown: true, sweep: true, spinner: true, topRow: true })
    expect(parseLook('{ nope')).toEqual(DEFAULT_LOOK)
    expect(parseLook('null')).toEqual(DEFAULT_LOOK)
  })
})
