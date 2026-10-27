import type { EngineInterface } from 'claude-code'
import { describe, expect, test } from 'claude-code/testing'
import { idsIn, idsInPath, readTicket, readTickets, startedIn, target, ticketPrefix, type TicketJson } from './ticket'

/** What `flow tickets get --json` says of a ticket with nothing open, with the fields a test sets laid over it. */
const json = (over: Partial<TicketJson> = {}): TicketJson => ({
  id: 'fw-9',
  name: 'fw-9-band-test',
  status: 'in-progress',
  activity: null,
  questions: null,
  tasks: null,
  map: null,
  firstOpen: { task: null, question: null },
  openQuestions: [],
  path: '/p/.flow/tickets/9/ticket.md',
  ...over,
})

describe('readTicket', () => {
  test('the activity is the word, in capitals, with the count of the tasks', () => {
    expect(readTicket(json({ activity: 'build', tasks: { done: 2, total: 5 } }))).toEqual({ id: 'fw-9', name: 'fw-9-band-test', status: 'in-progress', word: 'BUILD 2/5' })
  })

  test('an activity with no list shows the word alone', () => {
    expect(readTicket(json({ activity: 'debug' })).word).toBe('DEBUG')
  })

  test('a word the agent set is drawn as it is, in capitals', () => {
    expect(readTicket(json({ activity: 'proto', tasks: { done: 0, total: 1 } })).word).toBe('PROTO 0/1')
  })

  test('a design ticket counts its questions, then the map, then its tasks', () => {
    const tasks = { done: 1, total: 2 }
    expect(readTicket(json({ activity: 'design', questions: { done: 1, total: 2 }, tasks: { done: 0, total: 1 } })).word).toBe('DESIGN 1/2')
    expect(readTicket(json({ activity: 'design', tasks: { done: 1, total: 1 }, map: { done: 1, total: 3, line: 5 } })).word).toBe('DESIGN 1/3')
    expect(readTicket(json({ activity: 'design', tasks })).word).toBe('DESIGN 1/2')
  })

  test('with no activity, an open question says DESIGN', () => {
    expect(readTicket(json({ questions: { done: 0, total: 1 }, tasks: { done: 0, total: 1 } })).word).toBe('DESIGN 0/1')
  })

  test('with no activity and no open question, an open task says BUILD', () => {
    expect(readTicket(json({ tasks: { done: 1, total: 2 } })).word).toBe('BUILD 1/2')
  })

  test('with neither, the status in capitals and no count', () => {
    expect(readTicket(json({ tasks: { done: 2, total: 2 } })).word).toBe('IN-PROGRESS')
    expect(readTicket(json()).word).toBe('IN-PROGRESS')
  })
})

describe('readTickets', () => {
  /** An engine whose `flow` prints `stdout`; `runs` holds each command it was asked to run. */
  const engine = (stdout: string, runs: { argv: string[]; cwd?: string }[] = []) =>
    ({
      process: {
        run: async (argv: string[], init?: { cwd?: string }) => {
          runs.push({ argv, cwd: init?.cwd })
          return { exitCode: 0, stdout, stderr: '' }
        },
      },
    }) as unknown as EngineInterface

  test('asks for every id in one run, in the project folder', async () => {
    const runs: { argv: string[]; cwd?: string }[] = []
    const found = await readTickets(engine(JSON.stringify({ tickets: [json(), json({ id: 'fw-10' })], missing: [] }), runs), ['fw-9', 'fw-10'], '/p')
    expect(found.map((t) => t.id)).toEqual(['fw-9', 'fw-10'])
    expect(runs).toEqual([{ argv: ['flow', 'tickets', 'get', 'fw-9', 'fw-10', '--json'], cwd: '/p' }])
  })

  test('one id answers with the ticket itself', async () => {
    expect((await readTickets(engine(JSON.stringify(json())), ['fw-9'], '/p')).map((t) => t.id)).toEqual(['fw-9'])
  })

  test('a refusal, text that is not JSON and no ids give none, and no ids start no run', async () => {
    const runs: { argv: string[] }[] = []
    expect(await readTickets(engine('{"error":"no ticket"}', runs), ['fw-9'], '/p')).toEqual([])
    expect(await readTickets(engine('not json'), ['fw-9'], '/p')).toEqual([])
    expect(await readTickets(engine('{}', runs), [], '/p')).toEqual([])
    expect(runs).toHaveLength(1)
  })
})

describe('idsIn', () => {
  test('finds each ticket id once', () => {
    expect(idsIn('flow tickets start fw-137 && flow tickets get fw-137 fw-16')).toEqual(['fw-137', 'fw-16'])
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
  test('finds the ids that flow tickets start picks up, in order, and not the ones a command only names', () => {
    expect(startedIn('flow tickets start fw-9 --activity build && flow tickets get fw-16 && fw start fw-7')).toEqual(['fw-9', 'fw-7'])
  })

  test('a read, a done or a park picks nothing up', () => {
    expect(startedIn('flow tickets get fw-73')).toEqual([])
    expect(startedIn('flow done fw-133; flow park fw-16')).toEqual([])
  })
})

describe('target', () => {
  const open = json({ firstOpen: { task: 12, question: 5 } })

  test('build points at the first open task', () => {
    expect(target(open, 'BUILD 1/2')).toEqual({ file: 'ticket', line: 12 })
  })

  test('design points at the first open question', () => {
    expect(target(open, 'DESIGN 1/2')).toEqual({ file: 'ticket', line: 5 })
  })

  test('design with no question of its own points at the map', () => {
    expect(target(json({ map: { done: 1, total: 2, line: 4 } }), 'DESIGN 1/2')).toEqual({ file: 'map', line: 4 })
  })

  test('any other word, and a list with nothing open, point at the top', () => {
    expect(target(open, 'DEBUG')).toEqual({ file: 'ticket', line: 1 })
    expect(target(json(), 'BUILD 1/1')).toEqual({ file: 'ticket', line: 1 })
  })
})

describe('ticketPrefix', () => {
  test('reads the prefix of a settings file, and nothing from a missing or odd one', () => {
    expect(ticketPrefix('{"ticketPrefix":"fw"}')).toBe('fw')
    expect(ticketPrefix(undefined)).toBeUndefined()
    expect(ticketPrefix('not json')).toBeUndefined()
    expect(ticketPrefix('{}')).toBeUndefined()
    expect(ticketPrefix('{"ticketPrefix":"Flow-Dev"}')).toBeUndefined()
  })
})
