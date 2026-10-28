import { describe, expect, test } from 'claude-code/testing'
import { findModFolder } from '../home'

describe('findModFolder', () => {
  test('is the flow-session entry, with ~ expanded', () => {
    expect(findModFolder('~/.flow/repos/flow/mods/flow-session', '/home/me')).toBe('/home/me/.flow/repos/flow/mods/flow-session')
    expect(findModFolder('/a/other, /b/mods/flow-session/', '/h')).toBe('/b/mods/flow-session')
  })

  test('is undefined with no flow-session entry', () => {
    expect(findModFolder(undefined, '/h')).toBeUndefined()
    expect(findModFolder('/a/flow-session-old', '/h')).toBeUndefined()
  })
})
