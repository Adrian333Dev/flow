import type { EngineInterface } from 'claude-code'
import { describe, expect, test } from 'claude-code/testing'
import type { Entry, Restart } from '../types'
import { buildWindow } from './window'

const DIR = '/work/flow-dev/.flow/restarts'
const NAME = (n: number) => ({ name: `17da95cd-${n}.md`, kind: 'file', size: 1, isLink: false })

const say = (text: string) => ({ role: 'user', text, toolUses: [] }) as never
const reply = (text: string) => ({ role: 'assistant', text, toolUses: [] }) as never

const restart = (over: Partial<Restart> = {}): Restart => ({ message: 'NOTE', files: [], skills: [], size: 150000, started: true, manual: false, ...over })
const entry = (id: string, isDone = false): Entry => ({ id, name: id, word: 'BUILD 1/2', isDone, acting: false })

type Disk = { files: Record<string, string>; listed?: ReturnType<typeof NAME>[]; writeFails?: boolean }
type Built = { messages: { text: string; toolUses: { input: { file_path?: string } }[] }[]; log: string }

/**
 * The part of the engine `buildWindow` uses, over a disk the test holds. The kit's `$` is the
 * mod's hooks, not the engine, so the function is handed this stand-in.
 */
function engine(state: Disk): { $: EngineInterface; written: Record<string, string> } {
  const written: Record<string, string> = {}
  const $ = {
    session: { root: async () => '/work/flow-dev', id: async () => '17da95cd-0000-4000-8000-000000000000' },
    env: { get: async () => '/h' },
    fs: {
      list: async () => state.listed ?? [],
      exists: async (path: string) => path in state.files,
      read: async (path: string) => {
        if (!(path in state.files)) throw new Error('no such file')
        return state.files[path]!
      },
      write: async (path: string, content: string) => {
        if (state.writeFails) throw new Error('disk full')
        written[path] = content
      },
    },
  } as unknown as EngineInterface
  return { $, written }
}

const build = ($: EngineInterface, over: { messages?: never[]; restart?: Restart; entries?: Entry[] } = {}) =>
  buildWindow($, { messages: over.messages ?? [say('hello'), reply('hi')], restart: over.restart ?? restart(), asked: [], entries: over.entries ?? [], restartTool: 'restart', home: '/h/.flow' })

describe('the dialogue file of a window', () => {
  test('is numbered one above the highest window of this session, and holds the dialogue', async () => {
    const { $, written } = engine({ files: {}, listed: [NAME(1), NAME(3), { ...NAME(9), name: 'ffffffff-9.md' }] })
    expect(await build($)).toHaveProperty('messages')
    expect(Object.keys(written)).toEqual([`${DIR}/17da95cd-4.md`])
    expect(written[`${DIR}/17da95cd-4.md`]).toContain('<!-- window 4 · user messages: 1 -->')
    expect(written[`${DIR}/17da95cd-4.md`]).toContain('[user]\nhello\n\n[agent]\nhi')
  })

  test('is window 1 when the folder holds none, and the opening names no earlier file', async () => {
    const { $, written } = engine({ files: {} })
    const built = (await build($)) as Built
    expect(Object.keys(written)).toEqual([`${DIR}/17da95cd-1.md`])
    expect(built.messages[0]!.text).not.toContain('The window before it')
  })

  test('with fewer than 5 messages of the user carries the newest segments of the file before', async () => {
    const before = ['<!-- window 1 · user messages: 3 -->\n\nOLD ONE\n', '<!-- window 2 · user messages: 2 -->\n\nOLD TWO\n'].join('\n')
    const { $, written } = engine({ files: { [`${DIR}/17da95cd-2.md`]: before }, listed: [NAME(1), NAME(2)] })
    const built = (await build($)) as Built
    const file = written[`${DIR}/17da95cd-3.md`]!
    // 1 user message now, 2 in window 2, 3 in window 1: 5 are held only with both
    expect(file.indexOf('OLD ONE')).toBeGreaterThan(-1)
    expect(file.indexOf('OLD ONE')).toBeLessThan(file.indexOf('OLD TWO'))
    expect(file.indexOf('OLD TWO')).toBeLessThan(file.indexOf('hello'))
    expect(built.messages[0]!.text).toContain(`The window before it is ${DIR}/17da95cd-2.md`)
  })

  test('with 5 messages of the user carries nothing', async () => {
    const { $, written } = engine({ files: { [`${DIR}/17da95cd-1.md`]: '<!-- window 1 · user messages: 3 -->\n\nOLD ONE\n' }, listed: [NAME(1)] })
    await build($, { messages: ['a', 'b', 'c', 'd', 'e'].flatMap((word) => [say(word), reply(word)]) as never[] })
    expect(written[`${DIR}/17da95cd-2.md`]).not.toContain('OLD ONE')
  })

  test('a failed write returns the error and no messages', async () => {
    const { $ } = engine({ files: {}, writeFails: true })
    const built = await build($)
    expect(built).not.toHaveProperty('messages')
    expect((built as { error: string }).error).toContain(`${DIR}/17da95cd-1.md could not be written`)
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

  test('a ticket that is done is not loaded', async () => {
    const { $ } = engine({ files: { [TICKET]: 'T1' } })
    expect(paths((await build($, { entries: [entry('fw-244', true)] })) as Built)).not.toContain(TICKET)
  })

  test('files over 80 KB are refused with each size, and the window still opens', async () => {
    const { $ } = engine({ files: { '/work/flow-dev/big.md': 'x'.repeat(90 * 1024) } })
    const built = (await build($, { restart: restart({ files: ['big.md'] }) })) as Built
    expect(built.log).toContain('loads dropped: files and skills hold 90 KB (big.md 90 KB), over the 80 KB cap')
    expect(JSON.stringify(built.messages)).not.toContain('xxxx')
  })
})
