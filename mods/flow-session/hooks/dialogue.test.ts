import { describe, expect, test } from 'claude-code/testing'
import type { SessionMessage } from 'claude-code'
import { carried, dialogueOf, fileOf, isUsersOwn, segmentsOf, toolLine } from './dialogue'

const TOOL = 'mcp__flow-session__restart'
const said = (text: string): SessionMessage => ({ role: 'assistant', text, toolUses: [] })
const asked = (text: string): SessionMessage => ({ role: 'user', text, toolUses: [] })
const called = (tool: string, input: Record<string, unknown> = {}, id = `id-${tool}`, text = ''): SessionMessage => ({
  role: 'assistant',
  text,
  toolUses: [{ tool_use_id: id, tool, input }],
})
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
    expect(isUsersOwn(asked('The session restarted. The old window is carried.'))).toBe(false)
    expect(isUsersOwn(asked('Note from the old agent:\n\nNOTE'))).toBe(false)
    expect(isUsersOwn(asked('  '))).toBe(false)
  })

  test('the user typing the words “Continue.” is kept', () => {
    expect(isUsersOwn(asked('Continue.'))).toBe(true)
  })
})

describe('toolLine', () => {
  test('names the tool and the first line of its main argument', () => {
    expect(toolLine({ tool: 'Edit', input: { file_path: '/a/b.ts', old_string: 'X' } })).toBe('[tool] Edit /a/b.ts')
    expect(toolLine({ tool: 'Bash', input: { command: 'git status\nls', description: 'status' } })).toBe('[tool] Bash git status')
    expect(toolLine({ tool: 'mcp__x__y', input: {} })).toBe('[tool] x__y')
  })
})

describe('dialogueOf', () => {
  test('keeps the user’s words and every visible reply, cuts each call to a line and drops results', () => {
    const messages = [asked('A one'), said('Reading it.'), called('Read', { file_path: '/a.ts' }), result, said('Done.\n\nTwo paragraphs.'), asked('B two')]
    const { text, users } = dialogueOf(messages, TOOL)
    expect(users).toBe(2)
    expect(text).toBe('[user]\nA one\n\n[agent]\nReading it.\n\n[tool] Read /a.ts\n\n[agent]\nDone.\n\nTwo paragraphs.\n\n[user]\nB two')
    expect(text).not.toContain('RESULT')
  })

  test('calls in a row sit on lines of their own with no blank line between', () => {
    const { text } = dialogueOf([called('Read', { file_path: '/a' }, 'a'), called('Edit', { file_path: '/b' }, 'b')], TOOL)
    expect(text).toBe('[tool] Read /a\n[tool] Edit /b')
  })

  test('the restart call is no line, and the closing reply after it is kept: the user saw it', () => {
    const { text } = dialogueOf([asked('A'), said('REAL'), called(TOOL, {}, 'r', 'Restarting.'), result, said('Restarting now.')], TOOL)
    expect(text).toContain('REAL')
    expect(text).toContain('Restarting.')
    expect(text).toContain('Restarting now.')
    expect(text).not.toContain('[tool]')
  })

  test('leaves out the mod’s own prompts, the calls it wrote and the user’s old messages’ stand-ins', () => {
    const fake = called('Read', { file_path: '/p/.flow/restarts/abc-1.md' }, 'toolu_restart_1')
    const { text, users } = dialogueOf([asked('The session restarted. x'), fake, result, asked('Note from the old agent:\n\nN'), asked('REAL'), asked('Continue from the note.'), asked('Restart now: go')], TOOL)
    expect(users).toBe(1)
    expect(text).toBe('[user]\nREAL')
  })

  test('a window with no turns says so', () => {
    expect(dialogueOf([], TOOL)).toEqual({ text: 'no turns', users: 0 })
  })

  test('a huge conversation is read in moments and never cut', () => {
    const long = 'word '.repeat(100000)
    const messages = Array.from({ length: 2000 }, (_, i) => (i % 2 ? said(long.slice(0, 500)) : asked(`message ${i}`)))
    const started = performance.now()
    const { text, users } = dialogueOf(messages, TOOL)
    expect(users).toBe(1000)
    expect(text).toContain('message 1998')
    expect(performance.now() - started).toBeLessThan(1000)
  })
})

describe('segments', () => {
  const one = { window: 1, users: 2, text: '[user]\nA' }
  const two = { window: 2, users: 4, text: '[user]\nB\n\n[agent]\nC' }

  test('a file is read back into the segments it was written from', () => {
    expect(segmentsOf(fileOf([one, two]))).toEqual([one, two])
  })

  test('a user message that looks like a header does not split a segment', () => {
    const tricky = { window: 3, users: 1, text: '[user]\n<!-- window 9 -->' }
    expect(segmentsOf(fileOf([tricky]))).toEqual([tricky])
  })

  test('carries the newest windows back until 5 messages of the user’s are held', () => {
    expect(carried([one, two], 1)).toEqual([two])
    expect(carried([one, two], 0)).toEqual([one, two])
    expect(carried([one, two], 5)).toEqual([])
    expect(carried([], 2)).toEqual([])
  })
})
