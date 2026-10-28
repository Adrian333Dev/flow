import type { EngineInterface } from 'claude-code'
import { describe, expect, test } from 'claude-code/testing'
import { copyAll, copyLast, KEEP, lastOf, saveReply, SEPARATOR, staleFiles, stretchOf } from '../copy'

const say = (text: string) => ({ role: 'user', text, toolUses: [] }) as never
const use = (tool: string, input: Record<string, unknown>, id = 't1') => ({ tool, input, tool_use_id: id })
const reply = (text: string, toolUses: unknown[] = []) => ({ role: 'assistant', text, toolUses }) as never
const result = (id: string) => ({ role: 'user', text: '', toolUses: [], toolResults: [{ tool_use_id: id, text: 'ok', isError: false }] }) as never

describe('the last message', () => {
  test('is the agent’s last message with words in it, as written', () => {
    expect(lastOf([say('go'), reply('first'), reply('## Plan\n- one')])).toBe('## Plan\n- one')
  })

  test('skips a message of tool calls only, a notification and a command the user ran', () => {
    const messages = [say('go'), reply('the answer'), reply('', [use('Read', { file_path: '/a' })]), result('t1'), say('<task-notification>x</task-notification>'), say('<command-name>/copy</command-name>')]
    expect(lastOf(messages)).toBe('the answer')
  })

  test('is empty when the agent has said nothing', () => {
    expect(lastOf([say('go')])).toBe('')
    expect(lastOf([])).toBe('')
  })
})

describe('the stretch since the user’s last message', () => {
  test('holds each message of words with a separator between them, and no tool call', () => {
    const messages = [
      say('first'),
      reply('old answer'),
      say('second'),
      reply('Checking the file.', [use('Read', { file_path: '/p/a.ts' }, 't1'), use('Bash', { command: 'rm -rf x', description: 'Remove scratch' }, 't2')]),
      result('t1'),
      reply('', [use('Edit', { file_path: '/p/a.ts' }, 't3')]),
      reply('## Plan\n- one'),
    ]
    expect(stretchOf(messages)).toEqual({ text: ['Checking the file.', '## Plan\n- one'].join(SEPARATOR), users: 2 })
  })

  test('keeps the reply when a notification or the mod’s prompt follows it', () => {
    const messages = [say('go'), reply('the long answer'), say('<task-notification>x</task-notification>'), say('Continue from the note.'), reply('ok')]
    expect(stretchOf(messages)).toEqual({ text: `the long answer${SEPARATOR}ok`, users: 1 })
  })

  test('is empty before the agent answers, and for no messages', () => {
    expect(stretchOf([say('go')]).text).toBe('')
    expect(stretchOf([])).toEqual({ text: '', users: 0 })
  })
})

describe('the saved files', () => {
  const file = (name: string, mtimeMs: number) => ({ name, kind: 'file', mtimeMs })

  test('past the newest KEEP are stale, the oldest first to go', () => {
    const entries = Array.from({ length: KEEP + 2 }, (_, i) => file(`s-${i}.md`, i))
    expect(staleFiles(entries, KEEP)).toEqual(['s-1.md', 's-0.md'])
  })

  test('only markdown files count', () => {
    expect(staleFiles([file('a.md', 1), file('b.txt', 0), { name: 'd.md', kind: 'dir', mtimeMs: 0 }], 0)).toEqual(['a.md'])
  })
})

/** The part of the engine the module uses, over a disk the test holds. */
function engine(messages: unknown[], opts: { copied?: boolean; listed?: { name: string; kind: string; mtimeMs: number }[] } = {}) {
  const written: Record<string, string> = {}
  const removed: string[][] = []
  const copies: string[] = []
  const $ = {
    session: { messages: async () => messages, root: async () => '/work/p/', id: async () => '17da95cd-0000-4000-8000-000000000000' },
    fs: { write: async (path: string, content: string) => void (written[path] = content), list: async () => opts.listed ?? [] },
    process: { run: async (argv: string[]) => void removed.push(argv) },
    ui: {
      copy: async ({ text }: { text: string }) => {
        copies.push(text)
        return opts.copied === false ? { isCopied: false, reason: 'no-clipboard' } : { isCopied: true }
      },
    },
  } as unknown as EngineInterface
  return { $, written, removed, copies }
}

describe('saveReply', () => {
  test('writes the stretch to .flow/replies and removes the stale files', async () => {
    const listed = Array.from({ length: KEEP + 1 }, (_, i) => ({ name: `s-${i}.md`, kind: 'file', mtimeMs: i }))
    const { $, written, removed } = engine([say('go'), reply('answer')], { listed })
    await saveReply($)
    expect(written).toEqual({ '/work/p/.flow/replies/17da95cd-1.md': 'answer\n' })
    expect(removed).toEqual([['rm', '--', '/work/p/.flow/replies/s-0.md']])
  })

  test('writes nothing when the agent has said nothing', async () => {
    const { $, written } = engine([say('go')])
    await saveReply($)
    expect(written).toEqual({})
  })
})

describe('the commands', () => {
  const messages = [say('go'), reply('Looking.', [use('Read', { file_path: '/a' })]), result('t1'), reply('a\nb')]

  test('/copy-v2 copies the last message and says how much', async () => {
    const { $, copies } = engine(messages)
    expect(await copyLast($)).toBe('Copied 3 characters, 2 lines.')
    expect(copies).toEqual(['a\nb'])
  })

  test('/copy-all copies every message of words, with no tool call', async () => {
    const { $, copies } = engine(messages)
    expect(await copyAll($)).toMatch(/^Copied /)
    expect(copies).toEqual([`Looking.${SEPARATOR}a\nb`])
  })

  test('say why when the clipboard did not take it', async () => {
    expect(await copyLast(engine(messages, { copied: false }).$)).toBe('Not copied: no-clipboard.')
    expect(await copyAll(engine(messages, { copied: false }).$)).toBe('Not copied: no-clipboard.')
  })

  test('copy nothing when there is no reply', async () => {
    const { $, copies } = engine([say('go')])
    expect(await copyLast($)).toMatch(/^Nothing to copy/)
    expect(await copyAll($)).toMatch(/^Nothing to copy/)
    expect(copies).toEqual([])
  })
})
