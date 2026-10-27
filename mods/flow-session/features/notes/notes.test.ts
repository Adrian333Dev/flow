import { describe, expect, test } from 'claude-code/testing'
import { fitRows, labelRows, underline, underlineRows, matchTickets, noteRows, parseNote, scopeOf, ticketRows, titleOf, type ListedTicket } from './notes'

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

describe('scopeOf', () => {
  test('#t: asks for tickets, #n: for notes, anything else for all', () => {
    expect(scopeOf('#t:Mem')).toEqual({ scope: 'tickets', query: 'mem' })
    expect(scopeOf('#n:')).toEqual({ scope: 'notes', query: '' })
    expect(scopeOf('#mem')).toEqual({ scope: 'all', query: 'mem' })
    expect(scopeOf('#')).toEqual({ scope: 'all', query: '' })
    expect(scopeOf('#tool:x')).toEqual({ scope: 'all', query: 'tool:x' })
  })
})

describe('fitRows', () => {
  const row = (label: string, description: string) => ({ text: label, label, description })

  test('cuts a description at a word to the room after the longest label, and leaves a short one', () => {
    const long = row('fw-204-memory', 'in-progress · what the agent keeps across sessions, and how it finds what Flow knows')
    const [cut, short] = fitRows([long, row('fw-275-memory-rules', 'todo · short')], 80)
    // 80 - 4 indent - 19 label - 3 gap - 1 = 53 cells.
    expect(cut?.description).toBe('in-progress · what the agent keeps across sessions…')
    expect(cut!.description.length).toBeLessThanOrEqual(53)
    expect(short?.description).toBe('todo · short')
  })

  test('a description with no space is cut where the room ends', () => {
    expect(fitRows([row('x', 'a'.repeat(100))], 40)[0]?.description).toBe(`${'a'.repeat(30)}…`)
  })
})

describe('underline', () => {
  const u = (s: string) => [...s].map((ch) => `${ch}̲`).join('')

  test('underlines every match, any case', () => {
    expect(underline('Memory rules: memory', 'mem')).toBe(`${u('Mem')}ory rules: ${u('mem')}ory`)
  })

  test('changes nothing for an empty query, and reads a query as plain text', () => {
    expect(underline('a.b', '')).toBe('a.b')
    expect(underline('a.b axb', '.')).toBe(`a${u('.')}b axb`)
  })

  test('marks the label and the description of each row, never the text it writes', () => {
    const [row] = underlineRows([{ text: '@mem ', label: 'fw-204-memory', description: 'todo · memory work' }], 'mem')
    expect(row).toEqual({ text: '@mem ', label: `fw-204-${u('mem')}ory`, description: `todo · ${u('mem')}ory work` })
  })
})

describe('labelRows', () => {
  test('lists labels by count, narrowed by the query, capped at 6', () => {
    expect(labelRows(all, '').slice(0, 2)).toEqual([
      { text: '#board', label: '#board', description: '2 notes' },
      { text: '#perf', label: '#perf', description: '1 note' },
    ])
    expect(labelRows(all, 'bo').map((r) => r.label)).toEqual(['#board'])
    const many = Array.from({ length: 20 }, (_, i) => parseNote(`/h/${i}.md`, i, file(`l${i}`, 'p', `note ${i}`)))
    expect(labelRows(many, '')).toHaveLength(6)
  })
})

describe('noteRows', () => {
  test('the current project first, each newest first, another project named in the label', () => {
    expect(noteRows(all, '', 'fw').map((r) => r.label)).toEqual(['note', 'note', 'luma note', 'home note'])
    expect(noteRows(all, '', 'fw').map((r) => r.description)).toEqual([
      'Board notes page · #board · #ui',
      'Restart keeps the files open · #board',
      'cache the parse · #perf',
      'never write kind · #profile',
    ])
  })

  test('a note row writes an @ mention of the file', () => {
    expect(noteRows([board], 'boa', 'fw')[0]?.text).toBe('@/h/.flow/notes/board-notes-page.md ')
  })

  test('a word matches the text, the labels and the project, and the rows are capped', () => {
    expect(noteRows(all, 'bo', 'fw')).toHaveLength(2)
    expect(noteRows(all, 'luma', 'fw').map((r) => r.description)).toEqual(['cache the parse · #perf'])
    expect(noteRows(all, 'nothing', 'fw')).toEqual([])
    const many = Array.from({ length: 20 }, (_, i) => parseNote(`/h/${i}.md`, i, file(`l${i}`, 'p', `note ${i}`)))
    expect(noteRows(many, '', 'p')).toHaveLength(8)
  })
})

describe('ticket rows', () => {
  const ticket = (id: string, title: string, labels: string[], tickets = '/work/.flow/tickets'): ListedTicket => ({
    id,
    name: `${id}-${title}`,
    description: `${title}: what it does`,
    labels,
    status: 'todo',
    path: `${tickets}/${id.replace(/\D+/, '')}/ticket.md`,
  })
  const tickets = [ticket('fw-17', 'band-look', ['ui']), ticket('fw-170', 'groups', ['feature']), ticket('fw-236', 'ticket-context', ['feature'])]

  test('a row writes an @ mention of ticket.md under the root, labelled by the name, its words after the status', () => {
    expect(ticketRows(matchTickets(tickets, 'fw-236'), '/work')).toEqual([
      { text: '@.flow/tickets/236/ticket.md ', label: 'fw-236-ticket-context', description: 'todo · what it does' },
    ])
  })

  test('matches what the row shows: the id and name, and the description, never the labels', () => {
    expect(matchTickets(tickets, 'fw-17').map((t) => t.id)).toEqual(['fw-17', 'fw-170'])
    expect(matchTickets(tickets, 'context').map((t) => t.id)).toEqual(['fw-236'])
    expect(matchTickets(tickets, 'what it').map((t) => t.id)).toEqual(['fw-17', 'fw-170', 'fw-236'])
    expect(matchTickets(tickets, 'feature')).toEqual([])
  })

  test('a long name is cut at its end, a description with no short name stays whole', () => {
    const long = { ...ticket('fw-217', 'groundwork-proposed-instead-of', []), description: 'no colon here' }
    expect(ticketRows([long], '/work')[0]).toMatchObject({ label: 'fw-217-groundwork-…', description: 'todo · no colon here' })
  })

  test('a ticket outside the root is mentioned by its absolute path, and the rows are capped', () => {
    expect(ticketRows([ticket('home-3', 'x', [], '/h/.flow/tickets')], '/work')[0]?.text).toBe('@/h/.flow/tickets/3/ticket.md ')
    expect(ticketRows(Array.from({ length: 20 }, (_, i) => ticket(`fw-${i}`, 't', [])), '/work')).toHaveLength(8)
  })
})
