import { describe, expect, test } from 'claude-code/testing'
import { mention, pastedPaths, relativeTo, words } from '../drag'

describe('words', () => {
  test('splits bare, quoted and escaped paths', () => {
    expect(words("/a/b '/c d/e' \"/f g/h\" /i\\ j/k")).toEqual(['/a/b', '/c d/e', '/f g/h', '/i j/k'])
  })

  test('splits on newlines', () => {
    expect(words('/a\n/b\n')).toEqual(['/a', '/b'])
  })

  test('is undefined for an open quote', () => {
    expect(words("'/a/b")).toBeUndefined()
  })
})

describe('pastedPaths', () => {
  test('accepts a paste made only of absolute paths', () => {
    expect(pastedPaths("'/a/b.md'")).toEqual(['/a/b.md'])
  })

  test('passes ordinary text and a mix through', () => {
    expect(pastedPaths('look at /a/b.md')).toBeUndefined()
    expect(pastedPaths('relative/path.md')).toBeUndefined()
    expect(pastedPaths('')).toBeUndefined()
  })
})

describe('relativeTo', () => {
  test('cuts the session folder off', () => {
    expect(relativeTo('/p/work', '/p/work/.flow/handoffs/note.md')).toBe('.flow/handoffs/note.md')
    expect(relativeTo('/p/work/', '/p/work/src/')).toBe('src')
  })

  test('is undefined for the folder, a sibling and an outside path', () => {
    expect(relativeTo('/p/work', '/p/work')).toBeUndefined()
    expect(relativeTo('/p/work', '/p/work-other/a.md')).toBeUndefined()
    expect(relativeTo('/p/work', '/etc/hosts')).toBeUndefined()
  })
})

describe('mention', () => {
  test('quotes a name with a space', () => {
    expect(mention('a/b.md')).toBe('@a/b.md')
    expect(mention('a/my file.md')).toBe('@"a/my file.md"')
  })
})
