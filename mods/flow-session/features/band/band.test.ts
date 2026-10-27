import { describe, expect, mock, test } from 'claude-code/testing'
import { flush } from '../../shared/testing'

/** What `flow tickets get <id> --json` prints for a ticket in `build` with one of its 2 tasks done. */
const ticketJson = (id: string) => ({
  id,
  name: `${id}-band-test`,
  status: 'in-progress',
  activity: 'build',
  questions: null,
  tasks: { done: 1, total: 2 },
  map: null,
  firstOpen: { task: 11, question: null },
  openQuestions: [],
  path: `/work/.flow/tickets/${id.replace(/\D+/, '')}/ticket.md`,
})
const RAN = { exitCode: 0, stderr: '', isStdoutTruncated: false, isStderrTruncated: false }

const BAND = {
  plugin: 'flow-session',
  component: 'AbovePrompt',
  surface: 'terminal',
  viewport: { columns: 100, rows: 30 },
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 93,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

/** Answers what Claude Code answers: the folder, `flow tickets get` and the failure log. Returns each command run. */
function claudeCode(on: Parameters<typeof mock.env>[0], log = ''): string[][] {
  const runs: string[][] = []
  mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
  on('session.root', () => ({ value: '/work' }))
  on('fs.read', (_$, e) => {
    const path = (e as unknown as { path: string }).path
    if (path.endsWith('/.flow/settings.json')) return { value: '{"ticketPrefix":"fw"}' }
    if (path.includes('/logs/failures/')) return { value: log }
    return { deny: 'missing' }
  })
  on('process.run', (_$, e) => {
    const argv = (e as unknown as { argv: string[] }).argv
    runs.push(argv)
    const found = argv[0] === 'flow' ? argv.slice(3, -1).map(ticketJson) : []
    return { value: { ...RAN, stdout: JSON.stringify(found.length === 1 ? found[0] : { tickets: found, missing: [] }) } }
  })
  on('tool.call', () => ({ result: 'ok' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))
  return runs
}

/** The plugin's store in memory, as a Map the test reads: the test engine has no `$.store` to read with. */
function memoryStore(on: Parameters<typeof mock.env>[0], entries: Record<string, unknown> = {}): Map<string, unknown> {
  const kept = new Map(Object.entries(entries))
  on('store.get', (_$, e) => ({ value: kept.get((e as unknown as { key: string }).key) }))
  on('store.set', (_$, e) => {
    const { key, value } = e as unknown as { key: string; value: unknown }
    kept.set(key, JSON.parse(JSON.stringify(value)))
    return { value: undefined } as never
  })
  on('store.delete', (_$, e) => {
    kept.delete((e as unknown as { key: string }).key)
    return { value: undefined } as never
  })
  on('store.keys', () => ({ value: [...kept.keys()] }))
  return kept
}

describe('the band', () => {
  test('draws a badge for a ticket that flow tickets start picked up, with the corners and the count', async ($, on) => {
    claudeCode(on)
    await $.tool.call({ tool: 'Bash', command: 'flow tickets start fw-9 --activity build' })
    const ui = await $.ui.mount(BAND)
    const badge = await ui.find({ type: 'Button' })
    expect(badge?.key).toBe('badge-fw-9')
    expect(await ui.find({ text: 'fw-9-band-test' })).toBeDefined()
    expect(await ui.find({ text: ' BUILD 1/2' })).toBeDefined()
    await ui.unmount()
  })

  test('draws the issue count at the right and nothing else when no ticket is lit', async ($, on) => {
    claudeCode(on, '{"job":"a","error":"x"}\n{"job":"b","error":"x"}\n')
    on('session.start', () => ({ cwd: '/work' }))
    on('tool.register', () => ({ value: undefined }) as never)
    on('command.register', () => ({ value: undefined }) as never)
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Text', text: '2 issues' })).toBeDefined()
    await ui.unmount()
  })

  test('saves the band under its own session, and a second session writes its own key', async ($, on) => {
    claudeCode(on)
    const other = { v: 1, updated: new Date().toISOString(), band: [] }
    const kept = memoryStore(on, { 'session:other': other })
    on('session.id', () => ({ value: 's1' }))
    await $.tool.call({ tool: 'Bash', command: 'flow tickets start fw-9' })
    const saved = kept.get('session:s1') as { v: number; band: { id: string }[] }
    expect(saved.v).toBe(1)
    expect(saved.band.map((entry) => entry.id)).toEqual(['fw-9'])
    expect(kept.get('session:other')).toEqual(other)
  })

  test('reads every badge again in one flow process at a turn end', async ($, on) => {
    const runs = claudeCode(on)
    on('turn.start', (_$, e) => ({ turnId: (e as unknown as { turnId: string }).turnId }))
    on('turn.complete', () => ({ text: '' }) as never)
    await $.tool.call({ tool: 'Bash', command: 'flow tickets start fw-9' })
    await $.tool.call({ tool: 'Bash', command: 'flow tickets start fw-10' })
    runs.length = 0
    await $.turn.start({ text: '', turnId: 't1' })
    await $.turn.complete({ turnId: 't1', reason: 'answer', answer: 'Done.', durationMs: 1, isAborted: false })
    const flows = runs.filter((argv) => argv[0] === 'flow')
    expect(flows).toEqual([['flow', 'tickets', 'get', 'fw-10', 'fw-9', '--json']])
  })

  test('puts the saved band back at start, and prunes records older than 14 days', async ($, on) => {
    claudeCode(on)
    const entry = { id: 'fw-9', name: 'fw-9-band-test', word: 'BUILD 1/2', isDone: false, acting: false, idle: 1, ended: 0 }
    // A record written before the idle and ended counts were dropped still reads back.
    const day = 86_400_000
    const kept = memoryStore(on, {
      'session:s1': { v: 1, updated: new Date(Date.now() - day).toISOString(), band: [entry] },
      'session:old': { v: 1, updated: new Date(Date.now() - 15 * day).toISOString(), band: [entry] },
      'session:broken': 'not a record',
    })
    on('session.id', () => ({ value: 's1' }))
    on('session.start', () => ({ cwd: '/work' }))
    on('tool.register', () => ({ value: undefined }) as never)
    on('command.register', () => ({ value: undefined }) as never)
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount(BAND)
    expect((await ui.find({ type: 'Button' }))?.key).toBe('badge-fw-9')
    await ui.unmount()
    expect(kept.has('session:old')).toBe(false)
    expect(kept.has('session:broken')).toBe(false)
    expect(kept.has('session:s1')).toBe(true)
  })

  test('lights a badge for a flow command the person ran with !, typed with the number alone', async ($, on) => {
    claudeCode(on)
    const row = (text: string) => ({
      message: { type: 'user' as const, content: [{ type: 'text', text }] },
      door: 'prompt' as const,
      origin: { kind: 'composer' as const },
      uuid: text,
    })
    // `fw` is the short name of `flow`.
    await $.session.append(row('<bash-input>fw start 9</bash-input>'))
    await $.session.append(row('<bash-stdout>fw-9-band-test  todo → in-progress</bash-stdout>'))
    const ui = await $.ui.mount(BAND)
    expect((await ui.find({ type: 'Button' }))?.key).toBe('badge-fw-9')
    await ui.unmount()
  })

  test('a read of a ticket, with flow tickets get <id>, lights no badge', async ($, on) => {
    claudeCode(on)
    await $.tool.call({ tool: 'Bash', command: 'flow tickets get fw-9' })
    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Button' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'drawn by Claude Code' })).toBeDefined()
    await ui.unmount()
  })

  test('a flow command the person ran with ! and no start lights nothing', async ($, on) => {
    claudeCode(on)
    const row = (text: string) => ({
      message: { type: 'user' as const, content: [{ type: 'text', text }] },
      door: 'prompt' as const,
      origin: { kind: 'composer' as const },
      uuid: text,
    })
    await $.session.append(row('<bash-input>fw 9</bash-input>'))
    await $.session.append(row('<bash-stdout>fw-9-band-test  in-progress</bash-stdout>'))
    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Button' })).toBeUndefined()
    await ui.unmount()
  })

  test('yields to Claude Code when there is nothing to show', async ($, on) => {
    claudeCode(on)
    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Text', text: 'drawn by Claude Code' })).toBeDefined()
    await ui.unmount()
  })
})

describe('the Restart button', () => {
  /** What Claude Code answers beneath the mod's turn and measure hooks. */
  function turns(on: Parameters<typeof mock.env>[0]) {
    claudeCode(on)
    on('session.measure', (_$, e) => ({ changed: (e as unknown as { changed: never[] }).changed }))
    on('turn.start', (_$, e) => ({ turnId: (e as unknown as { turnId: string }).turnId }))
    on('turn.complete', () => ({ text: '' }) as never)
    const logged: unknown[] = []
    on('ui.log', (_$, e) => (logged.push(e), { value: undefined }) as never)
    return logged
  }
  /** A press runs on its own after the click returns. */
  const settle = flush
  const sized = (tokens: number) => ({ context: { tokens, window: 200000 }, rateLimits: [], changed: ['context' as const] })
  const begin = (turnId: string, agentId?: string) => ({ text: '', turnId, ...(agentId ? { agentId } : {}) })
  const finish = (turnId: string, reason: 'answer' | 'aborted' = 'answer', agentId?: string) => ({
    turnId,
    reason,
    answer: 'Done.',
    durationMs: 1,
    isAborted: reason === 'aborted',
    ...(agentId ? { agentId } : {}),
  })

  test('shows between turns past the mark, hides while a turn runs, and comes back when it ends', async ($, on) => {
    turns(on)
    await $.session.measure(sized(150000))
    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ key: 'restart' })).toBeDefined()
    await $.turn.start(begin('t1'))
    expect(await ui.find({ key: 'restart' })).toBeUndefined()
    await $.turn.complete(finish('t1'))
    expect(await ui.find({ key: 'restart' })).toBeDefined()
    await ui.unmount()
  })

  test('stays hidden under the mark', async ($, on) => {
    turns(on)
    await $.session.measure(sized(100000))
    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ key: 'restart' })).toBeUndefined()
    await ui.unmount()
  })

  test('a subagent’s turn neither hides the button nor brings it back', async ($, on) => {
    turns(on)
    await $.session.measure(sized(150000))
    const ui = await $.ui.mount(BAND)
    await $.turn.start(begin('a1', 'agent-1'))
    expect(await ui.find({ key: 'restart' })).toBeDefined()
    await $.turn.start(begin('t1'))
    await $.turn.complete(finish('a1', 'answer', 'agent-1'))
    expect(await ui.find({ key: 'restart' })).toBeUndefined()
    await $.turn.complete(finish('t1'))
    expect(await ui.find({ key: 'restart' })).toBeDefined()
    await ui.unmount()
  })

  test('a press hides it at once and keeps it hidden through the restart', async ($, on) => {
    turns(on)
    on('clock.sleep', () => ({ value: undefined }) as never)
    on('prompt.submit', (_$, e) => ({ text: (e as unknown as { text: string }).text }))
    await $.session.measure(sized(150000))
    const ui = await $.ui.mount(BAND)
    await ui.press({ key: 'restart' })
    await settle()
    expect(await ui.find({ key: 'restart' })).toBeUndefined()
    await $.turn.start(begin('t1'))
    await $.turn.complete(finish('t1'))
    // The turn ended with no restart tool call: the press failed and the button is back.
    expect(await ui.find({ key: 'restart' })).toBeDefined()
    await ui.unmount()
  })

  test('a press whose turn calls the restart tool stays hidden until the restart ends', async ($, on) => {
    turns(on)
    on('clock.sleep', () => ({ value: undefined }) as never)
    on('prompt.submit', (_$, e) => ({ text: (e as unknown as { text: string }).text }))
    on('turn.abort', () => ({ value: undefined }) as never)
    on('session.compact', () => ({ messages: [] }) as never)
    await $.session.measure(sized(150000))
    const ui = await $.ui.mount(BAND)
    await ui.press({ key: 'restart' })
    await settle()
    await $.turn.start(begin('t1'))
    await $.tool.call({ tool: 'mcp__flow-session__restart', message: 'NOTE' } as never)
    expect(await ui.find({ key: 'restart' })).toBeUndefined()
    await ui.unmount()
  })

  test('a press the agent never receives brings the button back', async ($, on) => {
    const logged = turns(on)
    on('clock.sleep', () => ({ value: undefined }) as never)
    on('prompt.submit', () => {
      throw new Error('no agent')
    })
    await $.session.measure(sized(150000))
    const ui = await $.ui.mount(BAND)
    await ui.press({ key: 'restart' })
    await settle()
    expect(JSON.stringify(logged)).toContain('could not start the agent')
    expect(await ui.find({ key: 'restart' })).toBeDefined()
    await ui.unmount()
  })
})
