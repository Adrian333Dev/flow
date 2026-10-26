import { describe, expect, test } from 'claude-code/testing'
import {
  classify,
  cover,
  denyFor,
  drawsInColour,
  foldedText,
  forgetDraw,
  guardedWrite,
  isAutoAllow,
  isCovered,
  isOwnQuestion,
  keepsBlanks,
  questionText,
  recallDraw,
  rememberDraw,
  storeVerdict,
  takeVerdict,
  verdictKey,
} from './pane'

const SENTENCE = 'Deletes 3 files.'

/** A text whose question with SENTENCE is `total` characters long. */
const filler = (total: number) => 'x'.repeat(total - SENTENCE.length - 2)

describe('drawsInColour', () => {
  const shown = (text: string) => questionText(SENTENCE, text)

  test('counts 10 lines, not the blank ones', () => {
    expect(drawsInColour(shown(Array(10).fill('ls').join('\n')))).toBe(true)
    expect(drawsInColour(shown(Array(11).fill('ls').join('\n')))).toBe(false)
    expect(drawsInColour(shown(`${Array(10).fill('ls').join('\n\n')}`))).toBe(true)
  })

  test('a cut text never draws in colour', () => {
    expect(drawsInColour(shown('y'.repeat(3000)))).toBe(false)
  })

  test('an empty command draws', () => {
    expect(drawsInColour(shown(''))).toBe(true)
  })
})

describe('foldedText', () => {
  test('is undefined for a command that fits in colour', () => {
    expect(foldedText(Array(10).fill('ls').join('\n'))).toBeUndefined()
    expect(foldedText('ls')).toBeUndefined()
    expect(foldedText('')).toBeUndefined()
  })

  test('keeps 10 lines and ends the 10th with …', () => {
    const lines = Array.from({ length: 36 }, (_, i) => `line ${i}`)
    const folded = foldedText(lines.join('\n'))!
    expect(folded.split('\n')).toEqual([...lines.slice(0, 9), 'line 9…'])
  })

  test('counts a command of 11 lines as long, and shows 10', () => {
    const folded = foldedText(Array(11).fill('ls').join('\n'))!
    expect(folded.split('\n')).toHaveLength(10)
    expect(folded.endsWith('ls…')).toBe(true)
  })

  test('keeps the blank lines before the 10th line but never counts them', () => {
    const lines = ['a', '', 'b', ...Array.from({ length: 12 }, (_, i) => `c${i}`)]
    const folded = foldedText(lines.join('\n'))!
    expect(folded.split('\n')).toEqual(['a', '', 'b', ...Array.from({ length: 7 }, (_, i) => `c${i}`), 'c7…'])
  })

  test('has no count in it', () => {
    expect(foldedText(Array(40).fill('ls').join('\n'))).not.toMatch(/\d+ more/)
  })
})

describe('keepsBlanks', () => {
  test('keeps blank lines only while every line fits in 10 rows', () => {
    expect(keepsBlanks(['a', '', 'b'].join('\n'))).toBe(true)
    expect(keepsBlanks([...Array(9).fill('a'), '', 'b'].join('\n'))).toBe(false)
  })
})

describe('questionText', () => {
  test('is the sentence, a blank line and the text', () => {
    expect(questionText('Pushes 3 commits.', 'git push origin main')).toEqual({
      question: 'Pushes 3 commits.\n\ngit push origin main',
      sentence: 'Pushes 3 commits.',
      text: 'git push origin main',
      cut: false,
    })
  })

  test('keeps 1999 characters whole and cuts 2000', () => {
    expect(questionText(SENTENCE, filler(1999)).cut).toBe(false)
    expect(questionText(SENTENCE, filler(2000)).cut).toBe(true)
  })

  test('cuts on a line and ends with a line that has no count', () => {
    const text = Array.from({ length: 300 }, (_, i) => `echo line number ${i}`).join('\n')
    const shown = questionText(SENTENCE, text)
    expect(shown.cut).toBe(true)
    expect(shown.question.length).toBeLessThan(2000)
    const lines = shown.text.split('\n')
    expect(lines.at(-1)).toBe('… the rest is not shown')
    expect(lines[0]).toBe('echo line number 0')
    for (const line of lines.slice(0, -1)) expect(line).toMatch(/^echo line number \d+$/)
  })

  test('one line over the room is cut where it stands', () => {
    const shown = questionText(SENTENCE, 'y'.repeat(3000))
    expect(shown.cut).toBe(true)
    expect(shown.question.length).toBeLessThan(2000)
    expect(shown.text).toMatch(/^y+\n… the rest is not shown$/)
  })

  test('an empty text is a sentence and a blank line', () => {
    expect(questionText(SENTENCE, '').question).toBe(`${SENTENCE}\n\n`)
  })
})

describe('drawsInColour', () => {
  test('is true for 10 lines and false for 11', () => {
    expect(drawsInColour(questionText(SENTENCE, Array(10).fill('ls').join('\n')))).toBe(true)
    expect(drawsInColour(questionText(SENTENCE, Array(11).fill('ls').join('\n')))).toBe(false)
  })

  test('is false for a cut text', () => {
    expect(drawsInColour(questionText(SENTENCE, 'y'.repeat(3000)))).toBe(false)
  })
})

describe('the draw by question text', () => {
  const draw = { sentence: SENTENCE, text: 'rm a', colour: true, asks: 'Allow this command?' }

  test('is found while the dialog is open and gone after', () => {
    rememberDraw('q1', draw)
    expect(recallDraw('q1')).toEqual(draw)
    forgetDraw('q1')
    expect(recallDraw('q1')).toBeUndefined()
  })

  test('two asks with the same text keep it until both close', () => {
    rememberDraw('q2', draw)
    rememberDraw('q2', draw)
    forgetDraw('q2')
    expect(recallDraw('q2')).toEqual(draw)
    forgetDraw('q2')
    expect(recallDraw('q2')).toBeUndefined()
  })

  test('forgetting a text never remembered does nothing', () => {
    forgetDraw('never')
    expect(recallDraw('never')).toBeUndefined()
  })
})

describe('isOwnQuestion', () => {
  test('tells the mod’s id from the model’s', () => {
    expect(isOwnQuestion('toolu_plugin_01abc')).toBe(true)
    expect(isOwnQuestion('toolu_01abc')).toBe(false)
  })
})

describe('classify', () => {
  test('names Allow and Refuse, and takes any other text as a note', () => {
    expect(classify('Allow')).toBe('allow')
    expect(classify('Refuse')).toBe('refuse')
    expect(classify('not now, use tmp/')).toBe('note')
  })
})

describe('the verdict', () => {
  test('is keyed by the tool and its command or path', () => {
    expect(verdictKey('Bash', { command: 'git push' })).toBe('Bash\ngit push')
    expect(verdictKey('Edit', { file_path: '/p/a', old_string: 'x' })).toBe('Edit\n/p/a')
    expect(verdictKey('mcp__x__go', { a: 1 })).toBe('mcp__x__go\n{"a":1}')
    expect(verdictKey('Bash', undefined)).toBe('Bash\n{}')
  })

  test('is read once', () => {
    const key = verdictKey('Bash', { command: 'git push' })
    storeVerdict(key, { interrupt: true })
    expect(takeVerdict(key)).toEqual({ interrupt: true })
    expect(takeVerdict(key)).toBeUndefined()
  })

  test('a refusal denies with an interrupt, a note without', () => {
    expect(denyFor({ interrupt: true })).toEqual({ behavior: 'deny', message: 'The user refused this call.', interrupt: true })
    const note = denyFor({ interrupt: false, note: 'use tmp/' })
    expect(note).toEqual({ behavior: 'deny', message: 'The user refused this call and wrote: "use tmp/".' })
    expect('interrupt' in note).toBe(false)
  })
})

describe('isAutoAllow', () => {
  const core = { decision: 'ask' }
  const input = { file_path: '/p/.claude/skills/x/SKILL.md' }

  test('allows a core ask on a write under .claude', () => {
    expect(isAutoAllow('Write', input, core)).toBe(true)
    expect(isAutoAllow('Edit', { file_path: '.claude/settings.json' }, core)).toBe(true)
  })

  test('never when the guard asked or a settings rule asked', () => {
    expect(isAutoAllow('Write', input, { decision: 'ask', hook: 'PreToolUse' })).toBe(false)
    expect(isAutoAllow('Write', input, { decision: 'ask', rule: 'Write(*)' })).toBe(false)
  })

  test('never for a read, a command, another folder or a name that only contains .claude', () => {
    expect(isAutoAllow('Read', input, core)).toBe(false)
    expect(isAutoAllow('Bash', { command: 'touch .claude/a' }, core)).toBe(false)
    expect(isAutoAllow('Write', { file_path: '/p/src/a.ts' }, core)).toBe(false)
    expect(isAutoAllow('Write', { file_path: '/p/not.claude/a' }, core)).toBe(false)
  })

  test('never when the decision is not an ask', () => {
    expect(isAutoAllow('Write', input, { decision: 'allow' })).toBe(false)
  })

  test('allows the main agent under the mod folder, bar the two manifests', () => {
    const base = '/p/mods/flow-session'
    expect(isAutoAllow('Edit', { file_path: `${base}/hooks/pane.ts` }, core)).toBe(true)
    expect(isAutoAllow('Write', { file_path: `${base}/types/index.d.ts` }, core)).toBe(true)
    expect(isAutoAllow('Edit', { file_path: `${base}/.claude-plugin/plugin.json` }, core)).toBe(false)
    expect(isAutoAllow('Edit', { file_path: `${base}/hooks/hooks.json` }, core)).toBe(false)
  })

  test('never for a subagent under the mod folder, or a folder with a similar name', () => {
    expect(isAutoAllow('Edit', { file_path: '/p/mods/flow-session/hooks/pane.ts' }, core, 'agent-1')).toBe(false)
    expect(isAutoAllow('Edit', { file_path: '/p/mods/flow-session-copy/hooks/pane.ts' }, core)).toBe(false)
  })
})

describe('one yes covers the same guard-asked file', () => {
  const guard = { decision: 'ask', hook: 'PreToolUse' }

  test('a write the guard asked about names its file', () => {
    expect(guardedWrite('Edit', { file_path: '/h/.claude/settings.json' }, guard)).toBe('/h/.claude/settings.json')
    expect(guardedWrite('Bash', { command: 'rm x' }, guard)).toBeUndefined()
    expect(guardedWrite('Edit', { file_path: '/p/a.ts' }, { decision: 'ask' })).toBeUndefined()
  })

  test('a covered file stays covered, another does not', () => {
    expect(isCovered('/h/.claude/settings.json')).toBe(false)
    cover('/h/.claude/settings.json')
    expect(isCovered('/h/.claude/settings.json')).toBe(true)
    expect(isCovered('/h/.claude/settings.local.json')).toBe(false)
  })
})
