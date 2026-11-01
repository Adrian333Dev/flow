import { describe, expect, test } from 'claude-code/testing'

describe('/fresh', () => {
  test('answers that a fresh window opens', async ($) => {
    const result = await $.command.run({ command: 'fresh', args: '' } as never)
    expect(result.text).toBe('Opening a fresh window.')
  })

  test('holds a restart record, so the restart tool is refused meanwhile', async ($) => {
    await $.command.run({ command: 'fresh', args: '' } as never)
    expect(await $.tool.call({ tool: 'mcp__flow-session__restart', message: 'NOTE' } as never)).toEqual({ deny: 'A restart is already under way.' })
  })
})
