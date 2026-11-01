import { describe, expect, mock, test } from 'claude-code/testing'
import { setLinks, shippedOf } from '../shipped'

const ROOT = '/code/flow'
const HOME = '/h/.flow'
const LINKS = [
  { from: ROOT, to: '' },
  { from: `${HOME}/guides`, to: 'guides' },
  { from: '/h/.claude/skills/flow/skills/execute', to: 'skills/work/execute' },
]

describe('shippedOf', () => {
  test('names the repo path of a shipped loaded file, by its own path or through a link', () => {
    setLinks(ROOT, LINKS)
    expect(shippedOf(`${ROOT}/home/CLAUDE.md`)).toBe('home/CLAUDE.md')
    expect(shippedOf(`${ROOT}/CLAUDE.md`)).toBe('CLAUDE.md')
    expect(shippedOf(`${HOME}/guides/writing.md`)).toBe('guides/writing.md')
    expect(shippedOf('/h/.claude/skills/flow/skills/execute/SKILL.md')).toBe('skills/work/execute/SKILL.md')
    expect(shippedOf(`${ROOT}/project-template/CLAUDE.md`)).toBe('project-template/CLAUDE.md')
  })

  test('names nothing for the live copies, code, docs, the log itself, or another project', () => {
    setLinks(ROOT, LINKS)
    expect(shippedOf(`${HOME}/CLAUDE.md`)).toBeUndefined()
    expect(shippedOf(`${ROOT}/mods/flow-session/register.ts`)).toBeUndefined()
    expect(shippedOf(`${ROOT}/docs/spec/rules.md`)).toBeUndefined()
    expect(shippedOf(`${ROOT}/lab/edit-log/home/CLAUDE.md.log.md`)).toBeUndefined()
    expect(shippedOf(`${ROOT}/home/settings.json`)).toBeUndefined()
    expect(shippedOf('/other/skills/x/SKILL.md')).toBeUndefined()
    expect(shippedOf(`${ROOT}-old/home/CLAUDE.md`)).toBeUndefined()
  })
})

/** Claude Code with the links session start reads: the repo through ~/.flow/repos/flow, and ~/.flow/guides into it. */
function claudeCode(on: Parameters<typeof mock.env>[0]): void {
  mock.env(on, { FLOW_HOME: HOME, HOME: '/h' })
  on('ui.log', () => ({ value: undefined }) as never)
  on('session.start', () => ({ cwd: '/work' }))
  const real = new Map([
    [`${HOME}/repos/flow`, ROOT],
    [`${HOME}/guides`, `${ROOT}/guides`],
  ])
  on('fs.stat', (_$, e) => {
    const realPath = real.get((e as unknown as { path: string }).path)
    return realPath ? ({ value: { kind: 'directory', size: 0, mtimeMs: 0, isLink: true, realPath } } as never) : { deny: 'ENOENT' }
  })
  on('fs.list', (_$, e) =>
    (e as unknown as { path: string }).path === HOME ? ({ value: [{ name: 'guides', kind: 'other', size: 0, mtimeMs: 0, isLink: true }] } as never) : { deny: 'ENOENT' },
  )
  on('fs.read', () => ({ deny: 'ENOENT' }))
  on('turn.start', (_$, e) => ({ turnId: (e as unknown as { turnId: string }).turnId }) as never)
  on('tool.call', (_$, e) => ((e as unknown as { file_path: string }).file_path.endsWith('/broken.md') ? { result: 'failed', isError: true } : { result: 'ok' }) as never)
}

const edit = (file_path: string) => ({ tool: 'Edit', file_path, old_string: 'a', new_string: 'b' }) as never
const contextOf = async ($: { tool: { call: (e: never) => Promise<unknown> } }, call: never) => ((await $.tool.call(call)) as { context?: string[] }).context
const GUIDE = `${HOME}/guides/edit-log.md`
const reminder = (rel: string) => `[Auto] ${rel} is logged: add an entry to ${ROOT}/lab/edit-log/${rel}.log.md, as ${GUIDE} says.`

describe('the Edit and Write hook', () => {
  test("a turn's first edit of a shipped file names its log and the guide; a second edit of it in the turn adds nothing", async ($, on) => {
    claudeCode(on)
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.turn.start({ turnId: 't1' } as never)
    expect(await contextOf($, edit(`${ROOT}/home/CLAUDE.md`))).toEqual([reminder('home/CLAUDE.md')])
    expect(await contextOf($, edit(`${ROOT}/home/CLAUDE.md`))).toBeUndefined()
    expect(await contextOf($, edit(`${HOME}/guides/writing.md`))).toEqual([reminder('guides/writing.md')])
    await $.turn.start({ turnId: 't2' } as never)
    expect(await contextOf($, edit(`${ROOT}/home/CLAUDE.md`))).toEqual([reminder('home/CLAUDE.md')])
  })

  test('a Write of a new guide is reminded; a failed edit, a live copy and code are not', async ($, on) => {
    claudeCode(on)
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.turn.start({ turnId: 't1' } as never)
    expect(await contextOf($, { tool: 'Write', file_path: `${ROOT}/guides/new.md`, content: 'x' } as never)).toEqual([reminder('guides/new.md')])
    expect(await contextOf($, edit(`${ROOT}/guides/broken.md`))).toBeUndefined()
    expect(await contextOf($, edit(`${HOME}/CLAUDE.md`))).toBeUndefined()
    expect(await contextOf($, edit(`${ROOT}/mods/flow-session/register.ts`))).toBeUndefined()
  })
})
