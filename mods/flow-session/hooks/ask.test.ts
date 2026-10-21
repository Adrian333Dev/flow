import { describe, expect, test } from 'claude-code/testing'
import { restartAsk } from './ask'
import { isUsersOwn } from './dialogue'

describe('restartAsk', () => {
  test('asks for the note and the tool in one line, with no handoff and no instructions', () => {
    const text = restartAsk('')
    expect(text).toBe('Restart now: write your note and call the restart tool.')
    expect(text).not.toContain('handoff')
  })

  test('never opens with a slash, which the host would run as a command', () => {
    expect(restartAsk('').startsWith('/')).toBe(false)
    expect(restartAsk('keep it short').startsWith('/')).toBe(false)
  })

  test('adds the words typed after /restart', () => {
    expect(restartAsk(' keep it short ')).toContain('User: keep it short')
    expect(restartAsk('  ')).not.toContain('User:')
  })

  test('is never the user’s own words in the next dialogue', () => {
    expect(isUsersOwn({ role: 'user', text: restartAsk('keep it short') })).toBe(false)
  })
})
