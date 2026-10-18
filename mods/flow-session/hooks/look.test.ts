import { describe, expect, test } from 'claude-code/testing'
import { parseLook } from './look'

describe('parseLook', () => {
  test('each sign is on unless the file says false', () => {
    expect(parseLook('{ "sweep": false, "spinner": true }')).toEqual({ sweep: false, spinner: true })
    expect(parseLook('{ "spinner": false }')).toEqual({ sweep: true, spinner: false })
    expect(parseLook('{ "sweep": false, "spinner": false }')).toEqual({ sweep: false, spinner: false })
  })
  test('a missing or broken file leaves both on', () => {
    expect(parseLook(undefined)).toEqual({ sweep: true, spinner: true })
    expect(parseLook('{ nope')).toEqual({ sweep: true, spinner: true })
    expect(parseLook('null')).toEqual({ sweep: true, spinner: true })
  })
})
