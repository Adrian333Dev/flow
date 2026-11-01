import { describe, expect, test } from 'claude-code/testing'
import { dialogueOf } from '../dialogue'

const typed = (text: string) => ({ type: 'user', origin: { kind: 'human' }, message: { content: text } })
const said = (text: string) => ({ type: 'assistant', message: { model: 'claude-opus-5-5', content: [{ type: 'text', text }] } })
const called = (id: string, name: string, input: Record<string, unknown>) => ({ type: 'assistant', message: { model: 'claude-opus-5-5', content: [{ type: 'tool_use', id, name, input }] } })
const result = (id: string) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: 'FILE BODY' }] } })
const boundary = { type: 'system', subtype: 'compact_boundary' }
/** A transcript of `rows`: a string is a line the host cut, kept as it is. */
const jsonl = (...rows: (object | string)[]) => rows.map((row) => (typeof row === 'string' ? row : JSON.stringify(row))).join('\n')

describe('the dialogue /fresh-dialogue copies', () => {
  test('holds the words of both sides and one line per call, never a result or thinking', () => {
    const { text, users, cut } = dialogueOf(
      jsonl(
        typed('fix the parser'),
        { type: 'assistant', message: { content: [{ type: 'thinking', thinking: '' }] } },
        said('Reading it.'),
        called('t1', 'Read', { file_path: '/p/a.ts' }),
        result('t1'),
        called('t2', 'Bash', { command: 'pnpm test\necho done', description: 'Run the tests' }),
        result('t2'),
        said('Fixed.'),
      ),
    )
    expect(text).toBe('[user]\nfix the parser\n\n[agent]\nReading it.\n\n[tool] Read /p/a.ts\n[tool] Bash pnpm test\n\n[agent]\nFixed.')
    expect(users).toBe(1)
    expect(cut).toBe(false)
  })

  test('holds only the window since the last compaction, and leaves out what the mod wrote after it', () => {
    const { text, users } = dialogueOf(
      jsonl(
        typed('first window'),
        said('One.'),
        boundary,
        { type: 'user', message: { content: 'Session restarted. Continue from the note.' } },
        { type: 'assistant', message: { model: '<synthetic>', content: [{ type: 'tool_use', id: 'toolu_restart_1', name: 'Read', input: { file_path: '/t.md' } }] } },
        result('toolu_restart_1'),
        { type: 'user', message: { content: 'carried message' } },
        { type: 'user', origin: { kind: 'plugin', name: 'flow-session' }, message: { content: 'Continue from the note.' } },
        said('Two.'),
        typed('second window'),
      ),
    )
    expect(text).toBe('[agent]\nTwo.\n\n[user]\nsecond window')
    expect(users).toBe(1)
  })

  test('leaves out subagents, host text and reminders, and shows a typed skill as its command', () => {
    const { text } = dialogueOf(
      jsonl(
        { type: 'user', origin: { kind: 'human' }, message: { content: '<command-message>flow:execute</command-message>\n<command-name>/flow:execute</command-name>\n<command-args>fw-300</command-args>' } },
        { type: 'user', origin: { kind: 'human' }, message: { content: '<command-name>/compact</command-name>' } },
        { type: 'user', origin: { kind: 'human' }, message: { content: [{ type: 'text', text: 'my words' }, { type: 'text', text: '<system-reminder>hook text</system-reminder>' }] } },
        { ...said('subagent words'), isSidechain: true },
        typed('[Request interrupted by user]'),
        'not json',
      ),
    )
    expect(text).toBe('[user]\n/flow:execute fw-300\n\n[user]\nmy words')
  })

  test('past the limit keeps the newest part, opening on a message of the user', () => {
    const rows = Array.from({ length: 20 }, (_, i) => [typed(`ask ${i}`), said(`answer ${i} ${'x'.repeat(50)}`)]).flat()
    const { text, users, cut } = dialogueOf(jsonl(...rows), 400)
    expect(cut).toBe(true)
    expect(text).toStartWith('[user]\nask ')
    expect(text).toEndWith(`answer 19 ${'x'.repeat(50)}`)
    expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(400)
    expect(users).toBeLessThan(20)
  })

  test('an empty transcript copies to nothing', () => {
    expect(dialogueOf('')).toEqual({ text: '', users: 0, cut: false })
  })
})
