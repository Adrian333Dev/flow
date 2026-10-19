import { describe, expect, mock, test } from 'claude-code/testing'

const TICKET = '---\nid: fw-9\ntitle: band-test\nstatus: in-progress\nactivity: build\n---\n\n## Tasks\n\n- [x] one\n- [ ] two\n'
const ENTRY = { size: 0, mtimeMs: 0, isLink: false }

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

/** Answers what Claude Code answers: the folder, one ticket and the failure log. */
function claudeCode(on: Parameters<typeof mock.env>[0], log = '') {
  mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
  on('session.root', () => ({ value: '/work' }))
  on('fs.list', () => ({ value: [{ name: 'fw-9-band-test', kind: 'dir', ...ENTRY }] }))
  on('fs.read', (_$, e) => {
    const path = (e as unknown as { path: string }).path
    if (path.endsWith('/ticket.md')) return { value: TICKET }
    if (path.includes('/logs/failures/')) return { value: log }
    return { deny: 'missing' }
  })
  on('tool.call', () => ({ result: 'ok' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))
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
  test('draws a badge for a ticket that flow start picked up, with the corners and the count', async ($, on) => {
    claudeCode(on)
    await $.tool.call({ tool: 'Bash', command: 'flow start fw-9 --activity build' })
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
    await $.tool.call({ tool: 'Bash', command: 'flow start fw-9' })
    const saved = kept.get('session:s1') as { v: number; band: { id: string }[] }
    expect(saved.v).toBe(1)
    expect(saved.band.map((entry) => entry.id)).toEqual(['fw-9'])
    expect(kept.get('session:other')).toEqual(other)
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

  test('a read of a ticket, with flow <id>, lights no badge', async ($, on) => {
    claudeCode(on)
    await $.tool.call({ tool: 'Bash', command: 'flow fw-9' })
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
