import { describe, expect, test } from 'claude-code/testing'
import { isNote } from './note'

describe('isNote', () => {
  test('is true for a file under .flow/handoffs/', () => {
    expect(isNote('/p/work', '/p/work/.flow/handoffs/fw-136.md')).toBe(true)
    expect(isNote('/p/work/', '/p/work/.flow/handoffs/sub/a.md')).toBe(true)
  })

  test('is false for the folder, other folders and a path that climbs out', () => {
    expect(isNote('/p/work', '/p/work/.flow/handoffs/')).toBe(false)
    expect(isNote('/p/work', '/p/work/.flow/tickets/fw-1/ticket.md')).toBe(false)
    expect(isNote('/p/work', '/p/work/.flow/handoffs/../../src/a.ts')).toBe(false)
    expect(isNote('/p/work', '/q/work/.flow/handoffs/a.md')).toBe(false)
  })
})
