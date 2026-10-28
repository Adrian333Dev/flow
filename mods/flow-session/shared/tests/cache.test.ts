import { describe, expect, test } from 'claude-code/testing'
import { coldAt, lastRequest } from '../cache'

const MINUTE = 60 * 1000
const T = '2026-10-18T15:40:00.000Z'

const assistant = (timestamp: string, usage: object, over: object = {}) =>
  JSON.stringify({ type: 'assistant', timestamp, effort: 'high', message: { model: 'claude-opus-5-5', usage }, ...over })

const wrote1h = { input_tokens: 2, cache_creation_input_tokens: 2000, cache_read_input_tokens: 140000, cache_creation: { ephemeral_1h_input_tokens: 2000, ephemeral_5m_input_tokens: 0 } }
const wrote5m = { input_tokens: 2, cache_creation_input_tokens: 2000, cache_read_input_tokens: 140000, cache_creation: { ephemeral_1h_input_tokens: 0, ephemeral_5m_input_tokens: 2000 } }
const readOnly = { input_tokens: 2, cache_creation_input_tokens: 0, cache_read_input_tokens: 142000, cache_creation: { ephemeral_1h_input_tokens: 0, ephemeral_5m_input_tokens: 0 } }
const empty = { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

describe('lastRequest', () => {
  test('reads the model, the effort and the hour a request wrote', () => {
    const request = lastRequest(assistant(T, wrote1h))
    expect(request).toEqual({ at: Date.parse(T), model: 'claude-opus-5-5', effort: 'high', lifetime: 60 * MINUTE })
    expect(coldAt(request)).toBe(Date.parse(T) + 60 * MINUTE)
  })

  test('a 5-minute write is 5 minutes', () => {
    expect(lastRequest(assistant(T, wrote5m))?.lifetime).toBe(5 * MINUTE)
  })

  test('a request that only read the cache starts the time, and an earlier write names the lifetime', () => {
    const later = '2026-10-18T15:50:00.000Z'
    const request = lastRequest([assistant(T, wrote1h), assistant(later, readOnly)].join('\n'))
    expect(request?.at).toBe(Date.parse(later))
    expect(request?.lifetime).toBe(60 * MINUTE)
  })

  test('a line with every count at 0 is no request', () => {
    const request = lastRequest([assistant(T, wrote1h), assistant('2026-10-18T16:30:00.000Z', empty)].join('\n'))
    expect(request?.at).toBe(Date.parse(T))
  })

  test('no line that wrote the cache leaves the lifetime out', () => {
    const request = lastRequest(assistant(T, readOnly))
    expect(request?.lifetime).toBeUndefined()
    expect(coldAt(request)).toBeUndefined()
  })

  test('a cut first line, a user line and a line that is not JSON are passed over', () => {
    const text = ['{"type":"assistant","timest', JSON.stringify({ type: 'user', timestamp: T }), 'not json', assistant(T, wrote1h)].join('\n')
    expect(lastRequest(text)?.at).toBe(Date.parse(T))
  })

  test('a synthetic model is no model', () => {
    const request = lastRequest(assistant(T, wrote1h, { message: { model: '<synthetic>', usage: wrote1h } }))
    expect(request?.model).toBeUndefined()
  })

  test('an empty text has no request', () => {
    expect(lastRequest('')).toBeUndefined()
  })
})
