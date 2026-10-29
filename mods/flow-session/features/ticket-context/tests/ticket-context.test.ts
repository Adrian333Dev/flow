import { describe, expect, mock, test } from 'claude-code/testing'
import { ticketFileOf, ticketHeader, wikiFolderOf, wikiLabels, type TicketRecord } from '../ticket-context'

const PATH = '/work/.flow/tickets/236/ticket.md'
const INDEX = '/h/.flow/wiki/claude-code/index.md'
const RAN = { exitCode: 0, stderr: '', isStdoutTruncated: false, isStderrTruncated: false }

/** What `flow tickets get <id> --json` says of an in-progress ticket with nothing around it, with the fields a test sets laid over it. */
const record = (over: Partial<TicketRecord> = {}): TicketRecord => ({
  id: 'fw-236',
  status: 'in-progress',
  storedStatus: 'in-progress',
  heldBy: '',
  activity: '',
  labels: [],
  parent: '',
  progress: null,
  blockedBy: [],
  dependents: [],
  openQuestions: [],
  ...over,
})

describe('ticketFileOf', () => {
  test('finds the project root and the number of a ticket.md, archived or in an old-named folder', () => {
    expect(ticketFileOf(PATH)).toEqual({ root: '/work', number: '236' })
    expect(ticketFileOf('/work/.flow/tickets/archive/12/ticket.md')).toEqual({ root: '/work', number: '12' })
    expect(ticketFileOf('/work/.flow/tickets/137-old-words/ticket.md')).toEqual({ root: '/work', number: '137' })
    expect(ticketFileOf('/h/.flow/tickets/3/ticket.md')).toEqual({ root: '/h', number: '3' })
  })

  test('finds none for a sibling file or a ticket.md anywhere else', () => {
    expect(ticketFileOf('/work/.flow/tickets/236/context.md')).toBeUndefined()
    expect(ticketFileOf('/work/.flow/tickets/236/reports/ticket.md')).toBeUndefined()
    expect(ticketFileOf('/work/docs/ticket.md')).toBeUndefined()
  })
})

describe('wikiFolderOf', () => {
  test("names the folder of a wiki folder's index.md alone", () => {
    expect(wikiFolderOf(INDEX, '/h/.flow')).toBe('claude-code')
    expect(wikiFolderOf('/h/.flow/wiki/claude-code/mod-hooks.md', '/h/.flow')).toBeUndefined()
    expect(wikiFolderOf('/h/.flow/wiki/claude-code/findings/index.md', '/h/.flow')).toBeUndefined()
    expect(wikiFolderOf('/other/wiki/claude-code/index.md', '/h/.flow')).toBeUndefined()
  })
})

describe('ticketHeader', () => {
  test('a ticket with every fact shows each the front matter lacks on its row, inside a fence under the label', () => {
    const header = ticketHeader(
      record({
        status: 'parked',
        storedStatus: 'todo',
        heldBy: 'post-v1',
        activity: 'build',
        labels: ['feature', 'post-v1'],
        parent: 'fw-204',
        progress: { done: 4, total: 12 },
        blockedBy: [{ id: 'fw-12', reason: 'todo' }],
        dependents: [{ id: 'fw-300', status: 'todo' }],
        openQuestions: ['0', '0.3'],
      }),
      PATH,
    )
    expect(header).toBe(
      [
        '[Auto] fw-236 as `flow` reports it. These lines are generated, not part of /work/.flow/tickets/236/ticket.md: never copy them into the file. Change these fields with `flow tickets` alone.',
        '```text',
        'status:      todo (held by post-v1)',
        'children:    4/12 done',
        'waits on:    fw-12 (todo)',
        'dependents:  fw-300 (todo)',
        'questions:   2 open (0, 0.3)',
        '```',
      ].join('\n'),
    )
  })

  test('a ticket whose front matter shows every fact gets no header', () => {
    expect(ticketHeader(record({ activity: 'build', labels: ['feature'], parent: 'fw-204' }), PATH)).toBe('')
  })

  test('a held ticket from a flow with no storedStatus says parked', () => {
    expect(ticketHeader(record({ status: 'parked', storedStatus: undefined, heldBy: 'later' }), PATH)).toContain('status:      parked (held by later)')
  })
})

describe('wikiLabels', () => {
  test('counts each label, the most used first, and the findings with none last', () => {
    const text = wikiLabels('claude-code', '/h/.flow', [{ labels: ['mod-api'] }, { labels: ['mod-api', 'terminal-ui'] }, { labels: ['mod-loading'] }, { labels: [] }])
    expect(text.split('\n')[1]).toBe('mod-api 2 · mod-loading 1 · terminal-ui 1 · no label 1')
    expect(text).toStartWith('[Auto] The findings in /h/.flow/wiki/claude-code/findings/, by label')
  })

  test('a folder with no findings says so', () => {
    expect(wikiLabels('node', '/h/.flow', [])).toBe('[Auto] /h/.flow/wiki/node/findings/ holds no findings.')
  })
})

/**
 * Answers what Claude Code answers: the folder, the window (`messages`), `flow tickets get`, `flow findings`
 * and the mention, as `mention` gives it. Returns each command this feature ran: the band runs its own
 * `flow tickets get fw-236` on the same `Read`.
 */
function claudeCode(on: Parameters<typeof mock.env>[0], window: () => unknown[], mention: object = { type: 'file' }): { argv: string[]; cwd?: string }[] {
  const runs: { argv: string[]; cwd?: string }[] = []
  mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
  on('session.root', () => ({ value: '/work' }))
  on('fs.read', () => ({ value: '{"ticketPrefix":"fw"}' }))
  on('ui.log', () => ({ value: undefined }) as never)
  on('session.messages', () => ({ value: window() }) as never)
  on('process.run', (_$, e) => {
    const { argv, init } = e as unknown as { argv: string[]; init?: { cwd?: string } }
    if (argv[3] !== 'fw-236') runs.push({ argv, cwd: init?.cwd })
    const out = argv[1] === 'tickets' ? record({ progress: { done: 1, total: 3 } }) : [{ labels: ['mod-api'] }]
    return { value: { ...RAN, stdout: JSON.stringify(out) } }
  })
  on('tool.call', () => ({ result: 'file text' }))
  on('prompt.mention', () => mention as never)
  return runs
}

const contextOf = (done: unknown) => (done as { context?: string[] }).context ?? []

describe('the Read hook', () => {
  test("a Read of a ticket.md gets the header, from one flow run in the project's root", async ($, on) => {
    const runs = claudeCode(on, () => [])
    const done = await $.tool.call({ tool: 'Read', file_path: PATH })
    expect(contextOf(done)).toHaveLength(1)
    expect(contextOf(done)[0]).toContain('children:    1/3 done')
    expect(runs).toEqual([{ argv: ['flow', 'tickets', 'get', '236', '--json'], cwd: '/work' }])
  })

  test('a window holding the same header gets nothing, a changed header goes again', async ($, on) => {
    let held = ''
    claudeCode(on, () => [{ role: 'user', content: [{ type: 'text', text: held }] }])
    held = contextOf(await $.tool.call({ tool: 'Read', file_path: PATH }))[0]!
    expect(contextOf(await $.tool.call({ tool: 'Read', file_path: PATH }))).toEqual([])
    held = held.replace('1/3', '2/3')
    expect(contextOf(await $.tool.call({ tool: 'Read', file_path: PATH }))).toHaveLength(1)
  })

  test('a sibling file and any other file get nothing, and run no flow', async ($, on) => {
    const runs = claudeCode(on, () => [])
    expect(contextOf(await $.tool.call({ tool: 'Read', file_path: '/work/.flow/tickets/236/context.md' }))).toEqual([])
    expect(contextOf(await $.tool.call({ tool: 'Read', file_path: '/work/src/index.ts' }))).toEqual([])
    expect(runs).toEqual([])
  })

  test("a Read of a wiki folder's index.md gets its labels", async ($, on) => {
    const runs = claudeCode(on, () => [])
    const done = await $.tool.call({ tool: 'Read', file_path: INDEX })
    expect(contextOf(done)[0]).toContain('mod-api 1')
    expect(runs[0]?.argv).toEqual(['flow', 'findings', '--', 'wiki:claude-code', '--json'])
  })
})

describe('the mention hook', () => {
  test('an @ mention of a ticket.md gets the header', async ($, on) => {
    claudeCode(on, () => [])
    const done = await $.prompt.mention({ mention: '.flow/tickets/236/ticket.md', path: PATH })
    expect(contextOf(done)[0]).toStartWith('[Auto] fw-236 as `flow` reports it.')
  })

  test('a refused mention stays refused, with nothing added and no flow run', async ($, on) => {
    const runs = claudeCode(on, () => [], { deny: 'a secret' })
    expect(await $.prompt.mention({ mention: '.flow/tickets/236/ticket.md', path: PATH })).toEqual({ deny: 'a secret' })
    expect(runs).toEqual([])
  })
})
