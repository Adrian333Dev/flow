import { describe, expect, test } from 'claude-code/testing'
import { firingsOf, planFor } from '../engine/response'
import type { Call } from '../list'
import { firingLine, logPath, textLabel } from '../log'

const at = new Date('2026-11-03T14:05:09.123Z')
const edit = (file_path: string): Call => ({ tool: 'Edit', input: { file_path, old_string: 'a', new_string: 'b' } })
const read = (file_path: string): Call => ({ tool: 'Read', input: { file_path } })

describe('firingLine', () => {
  test('writes the session facts, then the firing, leaving empty fields out', () => {
    expect(firingLine({ id: 'spec', by: 'beside', file: '/w/docs/spec/a.md', sent: ['references/guides/writing.md'] }, { session: 's1', turn: 4 }, at)).toBe(
      '{"at":"2026-11-03T14:05:09Z","session":"s1","turn":4,"id":"spec","by":"beside","file":"/w/docs/spec/a.md","sent":["references/guides/writing.md"]}',
    )
    expect(firingLine({ id: 'skill-wiki', by: 'skill', sent: [], error: 'flow audit failed', score: 6 }, { session: 's1', turn: 2, agent: 'a7' }, at)).toBe(
      '{"at":"2026-11-03T14:05:09Z","session":"s1","turn":2,"agent":"a7","id":"skill-wiki","by":"skill","sent":[],"score":6,"error":"flow audit failed"}',
    )
  })

  test('files by UTC month, and a text is named by its first line', () => {
    expect(logPath('/h/.flow', at)).toBe('/h/.flow/logs/triggers/2026-11.jsonl')
    expect(textLabel('[Auto] Ticket fw-1\n\nbody')).toBe('[Auto] Ticket fw-1')
  })
})

describe('firingsOf', () => {
  test('a held edit is one held line with every guide it sent', () => {
    const calls = [edit('/w/docs/spec/a.md')]
    expect(firingsOf(planFor(calls, new Set()), calls)).toEqual([
      { id: 'spec', by: 'held', file: '/w/docs/spec/a.md', sent: ['references/guides/writing.md', 'references/guides/write-spec.md'] },
    ])
  })

  test('a read gets a beside line per entry, an also entry its own', () => {
    const calls = [read('/w/docs/spec/a.md'), read('/w/b.ts')]
    expect(firingsOf(planFor(calls, new Set(['read:references/guides/writing.md'])), calls)).toEqual([
      { id: 'spec', by: 'beside', file: '/w/docs/spec/a.md', sent: ['references/guides/write-spec.md'] },
      { id: 'code', by: 'beside', file: '/w/b.ts', sent: ['references/guides/write-code.md'] },
    ])
  })

  test('a held edit whose guide the model reads in the same response still logs the miss', () => {
    const calls = [read('/h/.flow/references/guides/writing.md'), edit('/w/notes/a.md')]
    expect(firingsOf(planFor(calls, new Set()), calls)).toEqual([{ id: 'markdown', by: 'held', file: '/w/notes/a.md', sent: [] }])
  })

  test('nothing to log where nothing fired', () => {
    const calls = [edit('/w/a.ts')]
    expect(firingsOf(planFor(calls, new Set(['read:references/guides/write-code.md'])), calls)).toEqual([])
  })
})
