import { describe, expect, test } from 'claude-code/testing'
import { filesShown } from '../checks/shell-read'
import { guidesFor } from '../list'

describe('filesShown', () => {
  test('a one-file read counts the file it names', () => {
    expect(filesShown('cat references/guides/writing.md', '# Writing\n')).toEqual(['references/guides/writing.md'])
    expect(filesShown(`sed -n '40,60p' home/CLAUDE.md`, '- **`show-the-data`** …')).toEqual(['home/CLAUDE.md'])
    expect(filesShown('head -20 /w/docs/spec/rules.md | tail -5', 'x')).toEqual(['/w/docs/spec/rules.md'])
  })

  test('a grep over a folder counts only the files heading its output lines', () => {
    const output = ['references/guides/writing.md:72:## 6. Never cut these', 'references/guides/writing-old.md-73-', '--', 'references/guides/knowledge.md:4:x'].join('\n')
    expect(filesShown('grep -rn -C 1 "Never cut" references/guides/', output)).toEqual(['references/guides/writing.md', 'references/guides/writing-old.md', 'references/guides/knowledge.md'])
    expect(filesShown('rg "x" skills', 'skills/a/SKILL.md:x')).toEqual(['skills/a/SKILL.md'])
  })

  test('a grep of one file, with no path on its lines, counts the file', () => {
    expect(filesShown('grep -n "## 6" references/guides/writing.md', '72:## 6. Never cut these')).toEqual(['references/guides/writing.md'])
  })

  test('a listing, an empty output, a write and a command that reads nothing count none', () => {
    expect(filesShown('grep -rl "x" references/guides/', 'references/guides/writing.md\nguides/knowledge.md')).toEqual([])
    expect(filesShown('grep -rc "x" references/guides/', 'references/guides/writing.md:3')).toEqual([])
    expect(filesShown('grep -rn "x" references/guides/', '')).toEqual([])
    expect(filesShown(`sed -i 's/a/b/' home/CLAUDE.md`, '')).toEqual([])
    expect(filesShown('ls references/guides/writing.md', 'references/guides/writing.md')).toEqual([])
    expect(filesShown('wc -l references/guides/writing.md', '78 references/guides/writing.md')).toEqual([])
  })

  test('a count after the read is no listing', () => {
    expect(filesShown('cat home/CLAUDE.md | wc -l', '210')).toEqual(['home/CLAUDE.md'])
  })

  test('a file whose own text starts a line with a path is read for the command alone', () => {
    expect(filesShown('cat references/guides/writing.md', 'docs/spec/rules.md: the spec')).toEqual(['references/guides/writing.md'])
  })

  test('the grep that once matched nothing now brings the rule file when it shows a line', () => {
    expect(filesShown(`grep -rn "sed -i" home/CLAUDE.md`, '')).toEqual([])
    expect(filesShown(`grep -rn "sed -i" home/CLAUDE.md`, '42:- `sed -i` …')).toEqual(['home/CLAUDE.md'])
  })
})

describe('guidesFor', () => {
  test('each file takes the guides an edit of it would, each once', () => {
    expect(guidesFor(['home/CLAUDE.md', 'skills/a/SKILL.md'])).toEqual([
      { file: 'home/CLAUDE.md', guide: 'writing.md' },
      { file: 'home/CLAUDE.md', guide: 'write-loaded-files.md' },
      { file: 'home/CLAUDE.md', guide: 'write-rules.md' },
    ])
  })

  test('a slice of a guide brings that guide whole, with the loaded-file guide', () => {
    expect(guidesFor(['references/guides/writing.md']).map((g) => g.guide)).toEqual(['writing.md', 'write-loaded-files.md'])
  })

  test('a data file brings nothing, a code file the code guide', () => {
    expect(guidesFor(['package.json'])).toEqual([])
    expect(guidesFor(['features/a.ts']).map((g) => g.guide)).toEqual(['write-code.md'])
  })
})
