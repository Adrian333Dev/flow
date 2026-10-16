import { describe, expect, test } from 'claude-code/testing'
import { restartAsk, restartSteps, startInstructions, withInstructions } from './ask'

describe('restartSteps', () => {
  test('asks for the handoff while none stands', () => {
    expect(restartSteps(false)).toContain('run /flow:handoff')
  })

  test('leaves the handoff out while one stands', () => {
    expect(restartSteps(true)).not.toContain('/flow:handoff')
  })
})

describe('startInstructions', () => {
  test('is the file text, trimmed', () => {
    expect(startInstructions('\n# Writing the start message\n')).toBe('# Writing the start message')
  })

  test('falls back to one line when the file is missing or empty', () => {
    expect(startInstructions(undefined)).toContain('what to load first')
    expect(startInstructions('  \n')).toContain('what to load first')
  })
})

describe('withInstructions', () => {
  test('puts the instructions beneath the line', () => {
    expect(withInstructions('Wrap up.', 'Write 5 parts.')).toBe('Wrap up.\n\nWrite 5 parts.')
  })
})

describe('restartAsk', () => {
  test('asks for the handoff and the tool, then gives the instructions', () => {
    const text = restartAsk(false, '', 'Write 5 parts.')
    expect(text).toContain('run /flow:handoff, then call the restart tool with a start message.')
    expect(text.endsWith('Write 5 parts.')).toBe(true)
  })

  test('adds the words typed after /restart', () => {
    expect(restartAsk(true, ' keep it short ', 'x')).toContain('The user adds: keep it short')
    expect(restartAsk(true, '  ', 'x')).not.toContain('The user adds')
  })
})
