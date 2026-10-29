import { describe, expect, test } from 'claude-code/testing'
import { heldIn, linksFromFile, linksOf, loadLine, nameLine, wikiText, withWiki, type Held } from '../skill-wiki'

const HOME = '/h/.flow'
const INDEX = `${HOME}/wiki/audit/index.md`
const none: Held = { text: '', reads: new Set() }
const disk = (files: Record<string, string>) => async (path: string) => files[path]

describe('linksOf', () => {
  test('reads each folder and its mode from the frontmatter', () => {
    expect(linksOf({ name: 'audit', metadata: { wiki: { audit: 'load', 'claude-code': 'name' } } })).toEqual([
      { folder: 'audit', mode: 'load' },
      { folder: 'claude-code', mode: 'name' },
    ])
  })

  test('skips a folder or a mode out of shape, and a skill with no link', () => {
    expect(linksOf({ metadata: { wiki: { '../etc': 'load', audit: 'open', ok: 'name' } } })).toEqual([{ folder: 'ok', mode: 'name' }])
    expect(linksOf({ name: 'x' })).toEqual([])
    expect(linksOf({ metadata: 'wiki' })).toEqual([])
    expect(linksOf(undefined)).toEqual([])
  })
})

describe('linksFromFile', () => {
  test('reads nested blocks', () => {
    const text = ['---', 'name: audit', 'metadata:', '  wiki:', '    audit: load', '    research: name', 'description: x', '---', '# Audit'].join('\n')
    expect(linksFromFile(text)).toEqual([
      { folder: 'audit', mode: 'load' },
      { folder: 'research', mode: 'name' },
    ])
  })

  test('reads wiki written inline, beside other metadata', () => {
    const text = ['---', 'metadata:', '  owner: flow', '  wiki: { audit: load }', '---', 'body'].join('\n')
    expect(linksFromFile(text)).toEqual([{ folder: 'audit', mode: 'load' }])
  })

  test('finds nothing outside the frontmatter, or in a file with none', () => {
    expect(linksFromFile(['---', 'name: x', '---', 'metadata:', '  wiki:', '    audit: load'].join('\n'))).toEqual([])
    expect(linksFromFile('# No frontmatter')).toEqual([])
  })
})

describe('wikiText', () => {
  test('a load sends the index after its line', async () => {
    const text = await wikiText([{ folder: 'audit', mode: 'load' }], HOME, none, disk({ [INDEX]: '# Audit\n- queries.md\n' }))
    expect(text).toBe(`${loadLine(HOME, 'audit')}\n\n# Audit\n- queries.md`)
    expect(text).toStartWith("[Auto] The index of this skill's wiki folder, /h/.flow/wiki/audit/index.md:")
  })

  test('a name sends one line', async () => {
    expect(await wikiText([{ folder: 'audit', mode: 'name' }], HOME, none, disk({}))).toBe("[Auto] This skill's wiki folder: /h/.flow/wiki/audit/")
  })

  test('a missing index falls back to the name line, never an error', async () => {
    expect(await wikiText([{ folder: 'audit', mode: 'load' }], HOME, none, disk({}))).toBe(nameLine(HOME, 'audit'))
    expect(await wikiText([{ folder: 'audit', mode: 'load' }], HOME, none, async () => Promise.reject(new Error('EACCES')))).toBe(nameLine(HOME, 'audit'))
  })

  test('a window holding the load line, or a whole read of the index, gets nothing', async () => {
    const read = disk({ [INDEX]: 'index' })
    const links = [{ folder: 'audit', mode: 'load' } as const]
    expect(await wikiText(links, HOME, { text: `skill\n\n${loadLine(HOME, 'audit')}\n\nindex`, reads: new Set() }, read)).toBe('')
    expect(await wikiText(links, HOME, { text: '', reads: new Set([INDEX]) }, read)).toBe('')
    expect(await wikiText([{ folder: 'audit', mode: 'name' }], HOME, { text: '', reads: new Set([INDEX]) }, read)).toBe('')
  })

  test('a name is held by either line, a load by its own line alone', async () => {
    const read = disk({ [INDEX]: 'index' })
    expect(await wikiText([{ folder: 'audit', mode: 'name' }], HOME, { text: loadLine(HOME, 'audit'), reads: new Set() }, read)).toBe('')
    expect(await wikiText([{ folder: 'audit', mode: 'name' }], HOME, { text: nameLine(HOME, 'audit'), reads: new Set() }, read)).toBe('')
    expect(await wikiText([{ folder: 'audit', mode: 'load' }], HOME, { text: nameLine(HOME, 'audit'), reads: new Set() }, read)).toStartWith(loadLine(HOME, 'audit'))
  })

  test('2 links to one folder bring it once', async () => {
    const links = [{ folder: 'audit', mode: 'load' } as const, { folder: 'audit', mode: 'name' } as const]
    expect(await wikiText(links, HOME, none, disk({ [INDEX]: 'index' }))).toBe(`${loadLine(HOME, 'audit')}\n\nindex`)
  })

  test('no links add nothing', async () => {
    expect(await wikiText([], HOME, none, disk({}))).toBe('')
    expect(withWiki('skill', '')).toBe('skill')
    expect(withWiki('skill\n', 'wiki')).toBe('skill\n\nwiki')
  })
})

describe('heldIn', () => {
  const read = (id: string, input: Record<string, unknown>) => ({ role: 'assistant', content: [{ type: 'tool_use', id, name: 'Read', input }] })
  const result = (id: string, content: unknown) => ({ role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content }] })

  test('holds the text of every block, a skill expansion inside a result included', () => {
    const held = heldIn([
      { role: 'user', content: 'typed' },
      result('a', [{ type: 'text', text: `skill\n\n${loadLine(HOME, 'audit')}` }]),
      { role: 'assistant', content: [{ type: 'text', text: 'reply' }] },
    ] as never)
    expect(held.text).toContain('typed')
    expect(held.text).toContain(loadLine(HOME, 'audit'))
    expect(held.text).toContain('reply')
  })

  test('holds the paths of answered whole-file reads alone', () => {
    const held = heldIn([
      read('1', { file_path: INDEX }),
      result('1', 'x'),
      read('2', { file_path: '/part.md', offset: 10, limit: 5 }),
      result('2', 'x'),
      read('3', { file_path: '/unanswered.md' }),
    ] as never)
    expect([...held.reads]).toEqual([INDEX])
  })
})
