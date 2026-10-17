import { describe, expect, test } from 'claude-code/testing'
import {
  classify,
  denyFor,
  drawsInColour,
  forgetDraw,
  isAutoAllow,
  isOwnQuestion,
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

  test('cuts on a line and counts the lines hidden', () => {
    const text = Array.from({ length: 300 }, (_, i) => `echo line number ${i}`).join('\n')
    const shown = questionText(SENTENCE, text)
    expect(shown.cut).toBe(true)
    expect(shown.question.length).toBeLessThan(2000)
    const hidden = Number(/(\d+) more lines not shown$/.exec(shown.text)?.[1])
    const kept = shown.text.split('\n').length - 1
    expect(kept + hidden).toBe(300)
    expect(shown.text.startsWith('echo line number 0\n')).toBe(true)
    expect(shown.text.split('\n')[kept - 1]).toMatch(/^echo line number \d+$/)
  })

  test('one line over the room is cut by characters', () => {
    const shown = questionText(SENTENCE, 'y'.repeat(3000))
    expect(shown.cut).toBe(true)
    expect(shown.question.length).toBeLessThan(2000)
    expect(shown.text).toMatch(/\n\d+ more characters not shown$/)
    const kept = shown.text.split('\n')[0]!.length
    const hidden = Number(/(\d+) more characters/.exec(shown.text)?.[1])
    expect(kept + hidden).toBe(3000)
  })

  test('says "1 more line" for one line', () => {
    const lines = Array.from({ length: 2 }, () => 'z'.repeat(995))
    const shown = questionText(SENTENCE, lines.join('\n'))
    expect(shown.cut).toBe(true)
    expect(shown.text.endsWith('\n1 more line not shown')).toBe(true)
  })

  test('an empty text is a sentence and a blank line', () => {
    expect(questionText(SENTENCE, '').question).toBe(`${SENTENCE}\n\n`)
  })
})

describe('drawsInColour', () => {
  test('is true for 11 lines and false for 12', () => {
    expect(drawsInColour(questionText(SENTENCE, Array(11).fill('ls').join('\n')))).toBe(true)
    expect(drawsInColour(questionText(SENTENCE, Array(12).fill('ls').join('\n')))).toBe(false)
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
    expect(note).toEqual({ behavior: 'deny', message: 'The user did not allow this call and wrote: "use tmp/". Read it and answer it.' })
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
})
