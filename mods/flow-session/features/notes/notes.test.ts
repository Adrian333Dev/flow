import { describe, expect, test } from 'claude-code/testing'
import { parseNote, rows, titleOf } from './notes'

const file = (labels: string, project: string, body: string) =>
  `---\ndate: 2026-10-16\nlabels: [${labels}]\nproject: ${project}\n---\n\n${body}\n`

const board = parseNote('/h/.flow/notes/board-notes-page.md', 30, file('board, ui', 'fw', 'Board notes page: a full editor'))
const restart = parseNote('/h/.flow/notes/restart.md', 20, file('board', 'fw', 'Restart keeps the files open'))
const kind = parseNote('/h/.flow/notes/never-write-kind.md', 40, file('profile', 'home', 'never write kind'))
const cache = parseNote('/h/.flow/notes/cache-the-parse.md', 50, file('perf', 'luma', 'cache the parse'))
const all = [board, restart, kind, cache]

describe('parseNote', () => {
  test('reads the header and the title', () => {
    expect(board.labels).toEqual(['board', 'ui'])
    expect(board.project).toBe('fw')
    expect(board.title).toBe('Board notes page')
  })

  test('a file with no header is a home note titled by its first line', () => {
    const bare = parseNote('/h/.flow/notes/x.md', 1, 'see https://example.com for the idea\n')
    expect(bare.project).toBe('home')
    expect(bare.labels).toEqual([])
    expect(bare.title).toBe('see https://example.com for the idea')
  })

  test('reads quoted and empty labels', () => {
    expect(parseNote('/p', 1, file('"a", \'b\'', 'x', 'text')).labels).toEqual(['a', 'b'])
    expect(parseNote('/p', 1, file('', 'x', 'text')).labels).toEqual([])
  })
})

describe('titleOf', () => {
  test('cuts at a colon within 60 characters, else keeps the line', () => {
    expect(titleOf('Short title\n\nBody: with a colon')).toBe('Short title')
    expect(titleOf(`${'a '.repeat(40)}: late colon`)).toBe(`${'a '.repeat(40)}: late colon`.trim())
  })
})

describe('rows', () => {
  test('# alone lists labels by count, then the current project first', () => {
    const list = rows(all, '#', 'fw')
    expect(list.slice(0, 2)).toEqual([
      { text: '#board', label: '#board', description: '2 notes' },
      { text: '#perf', label: '#perf', description: '1 note' },
    ])
    expect(list.filter((r) => r.text.startsWith('@')).map((r) => r.label)).toEqual([
      'Board notes page',
      'Restart keeps the files open',
      'luma: cache the parse',
      'home: never write kind',
    ])
  })

  test('a note row writes an @ mention of the file, and shows its labels', () => {
    const [row] = rows([board], '#boa', 'fw').filter((r) => r.text.startsWith('@'))
    expect(row).toEqual({ text: '@/h/.flow/notes/board-notes-page.md ', label: 'Board notes page', description: '#board #ui' })
  })

  test('a word narrows labels and notes, and reads the project too', () => {
    expect(rows(all, '#bo', 'fw').map((r) => r.label)).toEqual(['#board', 'Board notes page', 'Restart keeps the files open'])
    expect(rows(all, '#luma', 'fw').map((r) => r.label)).toEqual(['luma: cache the parse'])
    expect(rows(all, '#nothing', 'fw')).toEqual([])
  })

  test('caps the rows', () => {
    const many = Array.from({ length: 20 }, (_, i) => parseNote(`/h/${i}.md`, i, file(`l${i}`, 'p', `note ${i}`)))
    const list = rows(many, '#', 'p')
    expect(list.filter((r) => r.text.startsWith('#')).length).toBe(6)
    expect(list.filter((r) => r.text.startsWith('@')).length).toBe(8)
  })
})
