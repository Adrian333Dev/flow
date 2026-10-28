import { describe, expect, test } from 'claude-code/testing'
import { restartAsk } from '../ask'
import { isUsersOwn } from '../../../shared/dialogue'

describe('restartAsk', () => {
  test('asks for the restart with the guide, and no handoff', () => {
    const text = restartAsk('', 'GUIDE')
    expect(text).toBe('Restart now:\n\nGUIDE')
    expect(text).not.toContain('handoff')
  })

  test('never opens with a slash, which the host would run as a command', () => {
    expect(restartAsk('', 'GUIDE').startsWith('/')).toBe(false)
    expect(restartAsk('keep it short', 'GUIDE').startsWith('/')).toBe(false)
  })

  test('adds the words typed after /restart, before the guide', () => {
    expect(restartAsk(' keep it short ', 'GUIDE')).toBe('Restart now:\n\nUser: keep it short\n\nGUIDE')
    expect(restartAsk('  ', 'GUIDE')).not.toContain('User:')
  })

  test('is never the user’s own words in the next dialogue', () => {
    expect(isUsersOwn({ role: 'user', text: restartAsk('keep it short', 'GUIDE') })).toBe(false)
  })
})
