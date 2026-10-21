import { describe, expect, test } from 'claude-code/testing'
import { callsFor, numbered, parseSpec, sectionLines, skillBody, slice } from './loads'

const DOC = ['# Title', 'intro', '## A', 'a1', '```', '# not a heading', '```', 'a2', '### A.1', 'deep', '## B', 'b1'].join('\n')

describe('parseSpec', () => {
  test('reads a path, a markdown heading and a line range', () => {
    expect(parseSpec('src/a.ts')).toEqual({ path: 'src/a.ts' })
    expect(parseSpec('docs/x.md#The heading')).toEqual({ path: 'docs/x.md', heading: 'The heading' })
    expect(parseSpec('src/a.ts:10-20')).toEqual({ path: 'src/a.ts', from: 10, to: 20 })
  })
})

describe('sectionLines', () => {
  test('runs from the heading to the next of the same level, and takes the deeper ones with it', () => {
    expect(sectionLines(DOC, 'A')).toEqual({ from: 3, to: 10 })
    expect(sectionLines(DOC, '## a')).toEqual({ from: 3, to: 10 })
  })

  test('skips a fenced line that looks like a heading, and runs the last section to the end', () => {
    expect(sectionLines(DOC, 'B')).toEqual({ from: 11, to: 12 })
  })

  test('is undefined for a heading the file does not have', () => {
    expect(sectionLines(DOC, 'C')).toBeUndefined()
  })
})

describe('slice', () => {
  test('a whole file is its text; a range and a heading are their lines, with where they start', () => {
    expect(slice(DOC, { path: 'd.md' })).toMatchObject({ from: 1, to: 12, whole: true })
    expect(slice(DOC, { path: 'd.md', from: 2, to: 3 })).toEqual({ text: 'intro\n## A', from: 2, to: 3, whole: false })
    expect(slice(DOC, { path: 'd.md', heading: 'B' })).toEqual({ text: '## B\nb1', from: 11, to: 12, whole: false })
  })

  test('a range past the end stops at the last line, and one wholly outside is an error', () => {
    expect(slice('a\nb', { path: 'f', from: 2, to: 9 })).toMatchObject({ text: 'b', from: 2, to: 2 })
    expect(slice('a\nb', { path: 'f', from: 5, to: 9 })).toHaveProperty('error')
    expect(slice(DOC, { path: 'd.md', heading: 'Z' })).toHaveProperty('error')
  })
})

describe('callsFor', () => {
  test('numbers lines as Read does, from the first line shown', () => {
    expect(numbered('x\ny', 9)).toBe('     9\tx\n    10\ty')
  })

  test('a partial read is written with its offset and limit', () => {
    const [call, answer] = callsFor([{ type: 'file', path: '/p/d.md', text: '## B\nb1', from: 11, to: 12, whole: false }])
    expect(call!.toolUses[0]!.input).toEqual({ file_path: '/p/d.md', offset: 11, limit: 2 })
    expect(answer!.toolResults![0]!.text).toBe('    11\t## B\n    12\tb1')
  })

  test('a skill’s text goes in the result of its call, after Launching skill', () => {
    const [call, answer] = callsFor([{ type: 'skill', name: 'flow:execute', dir: '/s', text: 'BODY' }])
    expect(call!.toolUses[0]).toMatchObject({ tool: 'Skill', input: { skill: 'flow:execute' } })
    expect(answer!.toolResults![0]!.text).toBe('Launching skill: flow:execute\n\nBase directory for this skill: /s\n\nBODY')
    expect(answer!.text).toBe('')
  })
})

describe('skillBody', () => {
  test('drops the frontmatter', () => {
    expect(skillBody('---\nname: x\n---\n\n# X\ntext')).toBe('# X\ntext')
    expect(skillBody('# X')).toBe('# X')
  })
})
