import { describe, expect, test } from 'claude-code/testing'
import { modFolder } from './restart-guide'

describe('modFolder', () => {
  test('is the flow-session entry, with ~ expanded', () => {
    expect(modFolder('~/.flow/repos/flow/mods/flow-session', '/home/me')).toBe('/home/me/.flow/repos/flow/mods/flow-session')
    expect(modFolder('/a/other, /b/mods/flow-session/', '/h')).toBe('/b/mods/flow-session')
  })

  test('is undefined with no flow-session entry', () => {
    expect(modFolder(undefined, '/h')).toBeUndefined()
    expect(modFolder('/a/flow-session-old', '/h')).toBeUndefined()
  })
})
