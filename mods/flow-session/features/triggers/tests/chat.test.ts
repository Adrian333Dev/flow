import { describe, expect, test } from 'claude-code/testing'
import { chatScores, filesNamed, likelyChanges } from '../checks/chat'
import { turnsOf } from '../engine/message'

describe('filesNamed', () => {
  test('finds paths and bare names, a bare guide name read as the guide', () => {
    expect(filesNamed('look at `home/CLAUDE.md` and writing.md, then mods/a/b.ts:12')).toEqual(['home/CLAUDE.md', 'references/guides/writing.md', 'mods/a/b.ts'])
    expect(filesNamed('~/.flow/CLAUDE.md#preferences')).toEqual(['/.flow/CLAUDE.md'])
    expect(filesNamed('no file here, v1.2 and e.g. a.b')).toEqual([])
  })
})

describe('chatScores', () => {
  test('a file named alone stays under the threshold, named with a word of change crosses it', () => {
    expect(likelyChanges([{ user: 'what does home/CLAUDE.md say?', agent: '' }])).toEqual([])
    expect(likelyChanges([{ user: 'we should rewrite home/CLAUDE.md', agent: '' }])).toEqual([{ file: 'home/CLAUDE.md', score: 5 }])
  })

  test('write, create, build and implement are words of change', () => {
    for (const word of ['write', 'create', 'build', 'implement'])
      expect(likelyChanges([{ user: `${word} skills/x/SKILL.md`, agent: '' }])).toEqual([{ file: 'skills/x/SKILL.md', score: 5 }])
  })

  test('a word of change inside a file name is none', () => {
    expect(likelyChanges([{ user: 'what does writing.md say?', agent: '' }])).toEqual([])
    expect(likelyChanges([{ user: 'look at lab/edit-log/home/CLAUDE.md.log.md', agent: '' }])).toEqual([])
    expect(likelyChanges([{ user: 'read write-code.md', agent: '' }])).toEqual([])
  })

  test('a drafted rule line counts for CLAUDE.md', () => {
    const turns = [
      { user: 'the agent keeps skipping reads', agent: 'Proposed:\n\n- **`read-before-acting`** Read the file first.\n' },
      { user: 'hmm', agent: '' },
    ]
    expect(chatScores(turns).get('CLAUDE.md')).toBe(2.5)
    expect(likelyChanges([turns[0]!])).toEqual([{ file: 'CLAUDE.md', score: 5 }])
  })

  test('older turns weigh half each, and only the last 3 count', () => {
    const old = { user: 'edit a.ts', agent: '' }
    const quiet = { user: 'ok', agent: '' }
    expect(chatScores([old, quiet]).get('a.ts')).toBe(2.5)
    expect(chatScores([old, quiet, quiet, quiet]).get('a.ts')).toBeUndefined()
    expect(likelyChanges([old, { user: 'and a.ts again', agent: '' }])).toEqual([{ file: 'a.ts', score: 5.5 }])
  })
})

describe('turnsOf', () => {
  test('a user message with text opens a turn, the agent text joins it, tool results and added text do not', () => {
    const turns = turnsOf([
      { role: 'user', content: 'fix writing.md' },
      { role: 'assistant', content: [{ type: 'text', text: 'Looking.' }, { type: 'tool_use', id: '1', name: 'Read', input: {} }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: '1', content: 'body' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'Done.' }] },
      { role: 'user', content: [{ type: 'text', text: '<system-reminder>x</system-reminder>' }] },
      { role: 'user', content: [{ type: 'text', text: 'thanks' }] },
    ])
    expect(turns).toEqual([
      { user: 'fix writing.md', agent: 'Looking.\nDone.\n' },
      { user: 'thanks', agent: '' },
    ])
  })
})
