import { describe, expect, test } from 'claude-code/testing'
import type { SessionMessage } from 'claude-code'
import { isUsersOwn } from './dialogue'

const asked = (text: string): SessionMessage => ({ role: 'user', text, toolUses: [] })
const result: SessionMessage = { role: 'user', text: '', toolUses: [], toolResults: [{ tool_use_id: 'x', text: 'RESULT', isError: false }] }

describe('isUsersOwn', () => {
  test('is true for typed words, a typed skill command and pasted text', () => {
    expect(isUsersOwn(asked('Okay, run it.'))).toBe(true)
    expect(isUsersOwn(asked('<command-message>flow:execute</command-message>\n<command-name>/flow:execute</command-name>'))).toBe(true)
    expect(isUsersOwn(asked('  <pasted_content id="1">\nlong</pasted_content>'))).toBe(true)
  })

  test('is false for a tool result, a skill body, a notification, a command output and the mod’s own text', () => {
    expect(isUsersOwn(result)).toBe(false)
    expect(isUsersOwn(asked('Base directory for this skill: /s\n\nBODY'))).toBe(false)
    expect(isUsersOwn(asked('<task-notification> <task-id>a</task-id>'))).toBe(false)
    expect(isUsersOwn(asked('<local-command-stdout>Copied</local-command-stdout>'))).toBe(false)
    expect(isUsersOwn(asked('<command-name>/compact</command-name>'))).toBe(false)
    expect(isUsersOwn(asked('Restart now: call the restart tool.'))).toBe(false)
    expect(isUsersOwn(asked('Continue from the note.'))).toBe(false)
    expect(isUsersOwn(asked('Session restarted. Continue from the note.'))).toBe(false)
    expect(isUsersOwn(asked('Note from the old agent:\n\nNOTE'))).toBe(false)
    expect(isUsersOwn(asked('  '))).toBe(false)
  })

  test('the user typing the words “Continue.” is kept', () => {
    expect(isUsersOwn(asked('Continue.'))).toBe(true)
  })
})
