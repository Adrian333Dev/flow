import { describe, expect, test } from 'claude-code/testing'
import { guardedSentence, headline, mainField } from '../headline'

describe('headline', () => {
  test('a shell command keeps itself as the text', () => {
    expect(headline('Bash', { command: 'npm test' })).toEqual({ sentence: 'Run a shell command', text: 'npm test' })
  })

  test('a commit, a push and a publish get their own sentence', () => {
    expect(headline('Bash', { command: 'git commit -m x' }).sentence).toBe('Commit')
    expect(headline('Bash', { command: 'git push origin main' }).sentence).toBe('Push to a remote')
    expect(headline('Bash', { command: 'npm publish' }).sentence).toBe('Publish a package')
  })

  test('finds a commit, a push or both anywhere a command starts', () => {
    expect(headline('Bash', { command: 'git add -A && git commit -q -m x' }).sentence).toBe('Commit')
    expect(headline('Bash', { command: 'cd /p; git push' }).sentence).toBe('Push to a remote')
    expect(headline('Bash', { command: 'git add .\ngit commit -m x\ngit push' }).sentence).toBe('Commit and push')
    expect(headline('Bash', { command: 'git commit -m x && npm publish' }).sentence).toBe('Publish a package')
  })

  test('util git save stages, commits and pushes, in any of its 4 spellings', () => {
    for (const spelling of ['util git save', 'util g save', 'u git save', 'u g save']) {
      expect(headline('Bash', { command: `${spelling} "fix the parser"` }).sentence).toBe('Stage everything, commit and push')
    }
    expect(headline('Bash', { command: 'util git save' }).sentence).toBe('Stage everything, commit and push')
    expect(headline('Bash', { command: 'cd /p && u g save -m "x"' }).sentence).toBe('Stage everything, commit and push')
  })

  test('a save with -n does not push, with -p names paths, with --dry-run only shows', () => {
    expect(headline('Bash', { command: 'util git save -n "msg"' }).sentence).toBe('Stage everything and commit')
    expect(headline('Bash', { command: 'util git save --no-push' }).sentence).toBe('Stage everything and commit')
    expect(headline('Bash', { command: 'util git save -p src,docs "msg"' }).sentence).toBe('Stage the listed paths, commit and push')
    expect(headline('Bash', { command: 'util git save -p src -n "msg"' }).sentence).toBe('Stage the listed paths and commit')
    expect(headline('Bash', { command: 'util git save --dry-run' }).sentence).toBe('Show the git commands a save would run')
  })

  test('a flag inside the message is no flag', () => {
    expect(headline('Bash', { command: 'util git save "drop -n and --dry-run from the docs"' }).sentence).toBe('Stage everything, commit and push')
  })

  test('save is no save in another command', () => {
    expect(headline('Bash', { command: 'util git status' }).sentence).toBe('Run a shell command')
    expect(headline('Bash', { command: 'echo util git save' }).sentence).toBe('Run a shell command')
    expect(headline('Bash', { command: 'util git saves' }).sentence).toBe('Run a shell command')
  })

  test('the words alone are no commit', () => {
    expect(headline('Bash', { command: 'echo git commit' }).sentence).toBe('Run a shell command')
    expect(headline('Bash', { command: 'git log --grep=commit' }).sentence).toBe('Run a shell command')
    expect(headline('Bash', { command: 'git commits' }).sentence).toBe('Run a shell command')
  })

  test('a write names its path and asks about a write', () => {
    const edit = headline('Edit', { file_path: '/p/.claude/skills/x/SKILL.md', old_string: 'a', new_string: 'b' })
    expect(edit).toEqual({ sentence: 'Edit this file', text: '/p/.claude/skills/x/SKILL.md' })
    expect(headline('Write', { file_path: '/p/a.md', content: 'x' }).sentence).toBe('Write this file')
    expect(headline('NotebookEdit', { notebook_path: '/p/n.ipynb' }).text).toBe('/p/n.ipynb')
  })

  test('a read, a fetch and a search show the path, the address and the query', () => {
    expect(headline('Read', { file_path: '/p/a' })).toMatchObject({ sentence: 'Read this file', text: '/p/a' })
    expect(headline('WebFetch', { url: 'https://x.dev', prompt: 'p' })).toMatchObject({ sentence: 'Fetch this page', text: 'https://x.dev' })
    expect(headline('WebSearch', { query: 'mods' })).toMatchObject({ sentence: 'Search the web', text: 'mods' })
  })

  test('another tool shows one line per field', () => {
    expect(headline('mcp__x__go', { a: 'one', b: 2 })).toEqual({ sentence: 'Call the tool mcp__x__go', text: 'a: one\nb: 2' })
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

describe('guardedSentence', () => {
  test('names the file kind a guard ask protects, in the mod\'s own words', () => {
    expect(guardedSentence('Edit', '/h/.claude/settings.json')).toBe('Edit this file · can switch the guard off')
    expect(guardedSentence('Write', '/h/.claude/settings.json')).toBe('Write this file · can switch the guard off')
    expect(guardedSentence('Write', '/h/.ssh/config')).toBe('Write into ~/.ssh · login keys')
  })
})
