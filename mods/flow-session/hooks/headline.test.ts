import { describe, expect, test } from 'claude-code/testing'
import { headline, mainField, questionFor } from './headline'

describe('headline', () => {
  test('a shell command keeps itself as the text', () => {
    expect(headline('Bash', { command: 'npm test' })).toEqual({ sentence: 'Runs a shell command.', text: 'npm test', kind: 'command' })
  })

  test('a commit, a push and a publish get their own sentence', () => {
    expect(headline('Bash', { command: 'git commit -m x' }).sentence).toBe('Makes a git commit.')
    expect(headline('Bash', { command: 'git push origin main' }).sentence).toBe('Pushes commits to a remote.')
    expect(headline('Bash', { command: 'npm publish' }).sentence).toBe('Publishes a package.')
  })

  test('a write names its path and asks about a write', () => {
    const edit = headline('Edit', { file_path: '/p/.claude/skills/x/SKILL.md', old_string: 'a', new_string: 'b' })
    expect(edit).toEqual({ sentence: 'Edits this file.', text: '/p/.claude/skills/x/SKILL.md', kind: 'write' })
    expect(headline('Write', { file_path: '/p/a.md', content: 'x' }).sentence).toBe('Writes this file.')
    expect(headline('NotebookEdit', { notebook_path: '/p/n.ipynb' }).text).toBe('/p/n.ipynb')
  })

  test('a read, a fetch and a search show the path, the address and the query', () => {
    expect(headline('Read', { file_path: '/p/a' })).toMatchObject({ sentence: 'Reads this file.', text: '/p/a' })
    expect(headline('WebFetch', { url: 'https://x.dev', prompt: 'p' })).toMatchObject({ sentence: 'Fetches this page.', text: 'https://x.dev' })
    expect(headline('WebSearch', { query: 'mods' })).toMatchObject({ sentence: 'Searches the web.', text: 'mods' })
  })

  test('another tool shows one line per field', () => {
    expect(headline('mcp__x__go', { a: 'one', b: 2 })).toEqual({ sentence: 'Calls the tool mcp__x__go.', text: 'a: one\nb: 2', kind: 'command' })
  })

  test('an input that is not an object gives empty text', () => {
    expect(headline('Bash', undefined).text).toBe('')
    expect(headline('Edit', null).text).toBe('')
    expect(headline('other', 'x').text).toBe('')
  })
})

describe('mainField', () => {
  test('is the command, else the path, address or query', () => {
    expect(mainField({ command: 'ls', file_path: '/a' })).toBe('ls')
    expect(mainField({ url: 'https://x.dev' })).toBe('https://x.dev')
    expect(mainField({ other: 1 })).toBeUndefined()
  })
})

describe('questionFor', () => {
  test('names a write or a command', () => {
    expect(questionFor('write')).toBe('Allow this write?')
    expect(questionFor('command')).toBe('Allow this command?')
  })
})
