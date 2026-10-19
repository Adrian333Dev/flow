import { describe, expect, test } from 'claude-code/testing'
import { idsIn, idsInPath, readTicket, startedIn, target } from './ticket'

const ticket = (fields: string, body = '') => `---\nid: fw-9\ntitle: band-test\nstatus: in-progress\n${fields}---\n\n${body}`

const tasks = (...boxes: string[]) => `## Tasks\n\n${boxes.join('\n')}\n`

describe('readTicket', () => {
  test('the activity is the word, in capitals, with the count of the tasks', () => {
    const text = ticket('activity: build\n', tasks('- [x] one', '- [x] two', '- [ ] three', '- [ ] four', '- [ ] five'))
    expect(readTicket(text)).toEqual({ id: 'fw-9', name: 'fw-9-band-test', status: 'in-progress', word: 'BUILD 2/5' })
  })

  test('an activity with no list shows the word alone', () => {
    expect(readTicket(ticket('activity: debug\n'))?.word).toBe('DEBUG')
  })

  test('a word the agent set is drawn as it is, in capitals', () => {
    expect(readTicket(ticket('activity: proto\n', tasks('- [ ] a')))?.word).toBe('PROTO 0/1')
  })

  test('a design ticket counts its questions, then the map, then its tasks', () => {
    const questions = '## Questions\n\n- [x] a\n- [ ] b\n\n'
    expect(readTicket(ticket('activity: design\n', questions + tasks('- [ ] t')))?.word).toBe('DESIGN 1/2')
    expect(readTicket(ticket('activity: design\n', tasks('- [x] t')), '- [x] m1\n- [ ] m2\n- [ ] m3\n')?.word).toBe('DESIGN 1/3')
    expect(readTicket(ticket('activity: design\n', tasks('- [x] t', '- [ ] u')))?.word).toBe('DESIGN 1/2')
  })

  test('with no activity, an open question says DESIGN', () => {
    const text = ticket('', '## Questions\n\n1. [ ] which?\n\n' + tasks('- [ ] t'))
    expect(readTicket(text)?.word).toBe('DESIGN 0/1')
  })

  test('with no activity and no open question, an open task says BUILD', () => {
    expect(readTicket(ticket('', tasks('- [x] a', '- [ ] b')))?.word).toBe('BUILD 1/2')
  })

  test('with neither, the status in capitals and no count', () => {
    expect(readTicket(ticket('', tasks('- [x] a', '- [x] b')))?.word).toBe('IN-PROGRESS')
    expect(readTicket(ticket(''))?.word).toBe('IN-PROGRESS')
  })

  test('a commented-out box is not a box', () => {
    expect(readTicket(ticket('activity: build\n', tasks('- [x] a', '<!-- - [ ] b -->')))?.word).toBe('BUILD 1/1')
  })

  test('an indented task is a note under a step, not a step', () => {
    expect(readTicket(ticket('activity: build\n', tasks('- [ ] a', '    - [ ] detail')))?.word).toBe('BUILD 0/1')
  })

  test('a title becomes part of the name; none leaves the id', () => {
    expect(readTicket('---\nid: fw-9\nstatus: todo\n---\n')?.name).toBe('fw-9')
  })

  test('a bare id takes the project prefix, and a full one is kept', () => {
    const bare = '---\nid: 9\ntitle: band-test\nstatus: todo\n---\n'
    expect(readTicket(bare, undefined, 'fw')).toMatchObject({ id: 'fw-9', name: 'fw-9-band-test' })
    expect(readTicket(bare.replace('id: 9', 'id: fw-9'), undefined, 'abc')).toMatchObject({ id: 'fw-9', name: 'fw-9-band-test' })
  })

  test('a text with no id or status is not a ticket', () => {
    expect(readTicket('no frontmatter')).toBeUndefined()
    expect(readTicket('---\nid: fw-9\n---\n')).toBeUndefined()
  })
})

describe('idsIn', () => {
  test('finds each ticket id once', () => {
    expect(idsIn('flow start fw-137 && flow fw-137 fw-16')).toEqual(['fw-137', 'fw-16'])
  })

  test('finds none in plain text', () => {
    expect(idsIn('ls -la')).toEqual([])
  })
})

describe('idsInPath', () => {
  test('a folder named by its number takes the project prefix', () => {
    expect(idsInPath('/p/.flow/tickets/137/ticket.md', 'fw')).toEqual(['fw-137'])
    expect(idsInPath('/p/.flow/tickets/archive/137/ticket.md', 'fw')).toEqual(['fw-137'])
    expect(idsInPath('/p/.flow/tickets/137-old-words/groundwork/map.md', 'fw')).toEqual(['fw-137'])
  })

  test('names none outside a ticket folder, or with no prefix to put on a number', () => {
    expect(idsInPath('/p/.flow/tickets/ticket-counter', 'fw')).toEqual([])
    expect(idsInPath('/p/.flow/tickets/137/ticket.md')).toEqual([])
  })
})

describe('startedIn', () => {
  test('finds the ids that flow start picks up, in order, and not the ones a command only names', () => {
    expect(startedIn('flow start fw-9 --activity build && flow fw-16 && fw start fw-7')).toEqual(['fw-9', 'fw-7'])
  })

  test('a read, a done or a park picks nothing up', () => {
    expect(startedIn('flow fw-73')).toEqual([])
    expect(startedIn('flow done fw-133; flow park fw-16')).toEqual([])
  })
})

describe('target', () => {
  const body = ticket('', '## Questions\n\n- [x] a\n- [ ] b\n\n' + tasks('- [x] one', '<!-- - [ ] gone -->', '- [ ] two'))
  const lineOf = (text: string, needle: string) => text.split('\n').findIndex((line) => line.includes(needle)) + 1

  test('build points at the first open task', () => {
    expect(target(body, undefined, 'BUILD 1/2')).toEqual({ file: 'ticket', line: lineOf(body, '- [ ] two') })
  })

  test('design points at the first open question', () => {
    expect(target(body, undefined, 'DESIGN 1/2')).toEqual({ file: 'ticket', line: lineOf(body, '- [ ] b') })
  })

  test('design with no question of its own points at the map', () => {
    const own = ticket('', tasks('- [ ] t'))
    expect(target(own, '# Map\n\n- [x] a\n- [ ] b\n', 'DESIGN 1/2')).toEqual({ file: 'map', line: 4 })
  })

  test('any other word, and a list with nothing open, point at the top', () => {
    expect(target(body, undefined, 'DEBUG')).toEqual({ file: 'ticket', line: 1 })
    expect(target(ticket('', tasks('- [x] a')), undefined, 'BUILD 1/1')).toEqual({ file: 'ticket', line: 1 })
  })
})
