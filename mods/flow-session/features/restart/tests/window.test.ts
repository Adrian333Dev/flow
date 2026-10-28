import type { EngineInterface } from 'claude-code'
import { describe, expect, test } from 'claude-code/testing'
import type { Entry, Restart } from '../../../shared/types'
import { buildWindow, resolveLoads } from '../window'

const restart = (over: Partial<Restart> = {}): Restart => ({ message: 'NOTE', files: [], skills: [], size: 150000, started: true, manual: false, ...over })
const entry = (id: string, isDone = false): Entry => ({ id, name: id, word: 'BUILD 1/2', isDone, acting: false })

type Built = { messages: { text: string; toolUses: { input: { file_path?: string } }[] }[]; log: string }

/**
 * The part of the engine `buildWindow` uses, over a disk the test holds. The kit's `$` is the
 * mod's hooks, not the engine, so the function is handed this stand-in. It writes nothing.
 */
function engine(state: { files: Record<string, string>; listed?: string[]; open?: Record<string, string[]> }): { $: EngineInterface } {
  const usage = async () => ({ context: { tokens: 0, window: 0, breakdown: { skills: { skillFrontmatter: (state.listed ?? []).map((name) => ({ name, source: 'built-in', tokens: 0 })) } } } })
  const $ = {
    session: { root: async () => '/work/flow-dev', id: async () => '17da95cd-0000-4000-8000-000000000000', usage },
    env: { get: async () => '/h' },
    process: {
      run: async (argv: string[]) => {
        const found = argv.slice(3, -1).map((id) => ({ id, openQuestions: state.open?.[id] ?? [] }))
        return { exitCode: 0, stdout: JSON.stringify(found.length === 1 ? found[0] : { tickets: found, missing: [] }), stderr: '' }
      },
    },
    fs: {
      exists: async (path: string) => path in state.files,
      read: async (path: string) => {
        if (!(path in state.files)) throw new Error('no such file')
        return state.files[path]!
      },
    },
  } as unknown as EngineInterface
  return { $ }
}

const build = ($: EngineInterface, over: { restart?: Restart; entries?: Entry[]; asked?: string[] } = {}) =>
  buildWindow($, { restart: over.restart ?? restart(), asked: over.asked ?? [], entries: over.entries ?? [], home: '/h/.flow' })

describe('the opening of a window', () => {
  test('opens with instructions alone, and reads no dialogue', async () => {
    const { $ } = engine({ files: {} })
    const built = (await build($, { asked: ['ONE'] })) as Built
    expect(built.messages[0]!.text).toStartWith('Session restarted. Continue from the note.')
    expect(built.messages[0]!.text).not.toContain('flow audit')
    expect(built.messages.flatMap((m) => m.toolUses)).toHaveLength(0)
    expect(built.messages.at(-1)!.text).toBe('ONE')
    expect(built.log).toContain('1 unanswered messages')
  })
})

describe('the loads of a window', () => {
  const TICKET = '/work/flow-dev/.flow/tickets/244/ticket.md'
  const paths = (built: Built) => built.messages.flatMap((m) => m.toolUses).map((use) => use.input.file_path)

  test('a ticket of the band loads whole, and a files entry for the same path loads once', async () => {
    const { $ } = engine({ files: { [TICKET]: 'T1\nT2', '/work/flow-dev/a.ts': 'A' } })
    const built = (await build($, { restart: restart({ files: ['.flow/tickets/244/ticket.md', 'a.ts'] }), entries: [entry('fw-244'), entry('fw-1', true)] })) as Built
    expect(paths(built).filter((path) => path === TICKET)).toHaveLength(1)
    expect(paths(built)).toContain('/work/flow-dev/a.ts')
  })

  test('a ticket loads with the context.md sections of its open questions, and a section named again loads once', async () => {
    const CONTEXT = '/work/flow-dev/.flow/tickets/244/context.md'
    const ticket = '## Questions\n\n- [x] 1: done\n  - [ ] 1.1: open\n- [ ] 2: open, no section\n- [ ] no handle\n\n## Tasks'
    const context = '## 1\n\nONE\n\n## 1.1\n\nOPEN\n\n## Loose\n\nLOOSE'
    const { $ } = engine({ files: { [TICKET]: ticket, [CONTEXT]: context }, open: { 'fw-244': ['1.1', '2'] } })
    const built = (await build($, { restart: restart({ files: ['.flow/tickets/244/context.md#1.1'] }), entries: [entry('fw-244')] })) as Built
    expect(paths(built)).toEqual([TICKET, CONTEXT])
    const text = JSON.stringify(built.messages)
    expect(text).toContain('OPEN')
    expect(text).not.toContain('ONE')
    expect(text).not.toContain('LOOSE')
    expect(built.log).toContain('1 tickets with 1 open sections')
  })

  test('a ticket in groundwork loads its whole context.md', async () => {
    const CONTEXT = '/work/flow-dev/.flow/tickets/244/context.md'
    const ticket = '## Questions\n\n- [ ] 1.1: open\n'
    const context = '## 1\n\nONE\n\n## 1.1\n\nOPEN\n\n## Loose\n\nLOOSE'
    const { $ } = engine({ files: { [TICKET]: ticket, [CONTEXT]: context } })
    const built = (await build($, { entries: [{ ...entry('fw-244'), word: 'DESIGN 1/3' }] })) as Built
    expect(paths(built)).toEqual([TICKET, CONTEXT])
    const text = JSON.stringify(built.messages)
    for (const part of ['ONE', 'OPEN', 'LOOSE']) expect(text).toContain(part)
  })

  test('each matched file brings its guides once, and a guide the agent named loads once', async () => {
    const G = (name: string) => `/h/.flow/guides/${name}`
    const files = { [TICKET]: 'T', '/work/flow-dev/docs/spec/a.md': 'S', [G('write-tickets.md')]: 'WT', [G('style.md')]: 'ST', [G('write-spec.md')]: 'WS', '/work/flow-dev/a.ts': 'A' }
    const { $ } = engine({ files })
    const built = (await build($, { restart: restart({ files: ['docs/spec/a.md', 'a.ts', '/h/.flow/guides/style.md'] }), entries: [entry('fw-244')] })) as Built
    expect(paths(built)).toEqual([TICKET, G('write-tickets.md'), G('write-spec.md'), '/work/flow-dev/docs/spec/a.md', '/work/flow-dev/a.ts', G('style.md')])
  })

  test('a ticket that is done is not loaded', async () => {
    const { $ } = engine({ files: { [TICKET]: 'T1' } })
    expect(paths((await build($, { entries: [entry('fw-244', true)] })) as Built)).not.toContain(TICKET)
  })

  test('files over 40k tokens are refused with each size, and the window still opens', async () => {
    const { $ } = engine({ files: { '/work/flow-dev/big.md': 'x'.repeat(200_000) } })
    const built = (await build($, { restart: restart({ files: ['big.md'] }) })) as Built
    expect(built.log).toContain('loads dropped: files and skills hold about 50k tokens (big.md 50k tokens), over the cap of 40k tokens')
    expect(JSON.stringify(built.messages)).not.toContain('xxxx')
  })

  test('a skill the session lists with no file, such as a built-in one, is named in the opening for the agent to invoke', async () => {
    const { $ } = engine({ files: {}, listed: ['plugin-authoring'] })
    const built = (await build($, { restart: restart({ skills: ['plugin-authoring'] }) })) as Built
    expect(built.messages[0]!.text).toContain('Invoke the `plugin-authoring` skill first.')
    expect(built.messages.flatMap((m) => m.toolUses)).toHaveLength(0)
    expect(built.log).toContain('1 skills to invoke')
  })

  test('a restarted skill brings its wiki index once, as the skill.prompt hook would', async () => {
    const skill = ['---', 'name: audit', 'metadata:', '  wiki:', '    audit: load', '---', '# Audit'].join('\n')
    const files = { '/h/.claude/skills/flow/skills/audit/SKILL.md': skill, '/h/.flow/wiki/audit/index.md': 'AUDIT-INDEX\n' }
    const { $ } = engine({ files })
    const window = JSON.stringify((await build($, { restart: restart({ skills: ['flow:audit'] }) })).messages)
    expect(window).toContain("[Added by Flow] The index of this skill's wiki folder, /h/.flow/wiki/audit/index.md:\\n\\nAUDIT-INDEX")
    expect(window.split('AUDIT-INDEX')).toHaveLength(2)
    const named = JSON.stringify((await build(engine({ files }).$, { restart: restart({ skills: ['flow:audit'], files: ['/h/.flow/wiki/audit/index.md'] }) })).messages)
    expect(named).not.toContain("[Added by Flow] The index of this skill's wiki folder")
  })

  test('a skill the session does not list is still refused', async () => {
    const { $ } = engine({ files: {}, listed: ['plugin-authoring'] })
    expect(await resolveLoads($, [], ['plugin-authorng'])).toEqual({ error: 'the skill plugin-authorng is not found' })
  })
})
