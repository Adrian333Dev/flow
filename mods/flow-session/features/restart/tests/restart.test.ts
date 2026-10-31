import { describe, expect, mock, test } from 'claude-code/testing'
import { addAsked, afterAnswer, freshWindow, restartWindow } from '../first-message'
const REFUSAL = { skip: 'Flow compacts only at its own restart. Run /restart.' }

describe('restartWindow', () => {
  const file = { type: 'file' as const, path: '/p/a.ts', text: 'one\ntwo', from: 1, to: 2, whole: true }
  const skill = { type: 'skill' as const, name: 'flow:execute', dir: '/s/execute', text: 'BODY' }
  const window = { tickets: [file], loads: [skill], invoke: [] as string[], note: 'NOTE', asked: ['ONE', 'TWO'], manual: false }

  test('has its parts in order: opening, tickets and loads, note, unanswered messages', () => {
    const messages = restartWindow(window)
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user', 'user', 'user', 'user'])
    expect(messages[0]!.text).toBe(
      "Session restarted. Continue from the note.\nAnswer every point of the user's messages below.\nConflicts: files win on what exists; `ticket.md` wins over `context.md` on decisions.\nAfter answering, run `## Capture` over the note.",
    )
    expect(messages[1]!.toolUses[0]).toMatchObject({ tool: 'Read', input: { file_path: '/p/a.ts' } })
    expect(messages[2]!.toolResults![0]!.text).toBe('     1\tone\n     2\ttwo')
    expect(messages[3]!.toolUses[0]).toMatchObject({ tool: 'Skill', input: { skill: 'flow:execute' } })
    expect(messages[4]!.toolResults![0]!.text).toContain('Base directory for this skill: /s/execute\n\nBODY')
    expect(messages[5]!.text).toBe('Note from the old agent:\n\nNOTE')
    expect([messages[6]!.text, messages[7]!.text]).toEqual(['ONE', 'TWO'])
  })

  test('with every message answered, the opening asks for no answer', () => {
    expect(restartWindow({ ...window, asked: [] })[0]!.text).not.toContain('Answer every point')
  })

  test('every call has its own result in a separate message, with matching ids', () => {
    const messages = restartWindow(window)
    const calls = messages.flatMap((m) => m.toolUses.map((u) => u.tool_use_id))
    const results = messages.flatMap((m) => (m.toolResults ?? []).map((r) => r.tool_use_id))
    expect(new Set(calls).size).toBe(2)
    expect(results).toEqual(calls)
    expect(messages.filter((m) => m.toolUses.length).every((m) => !m.toolResults)).toBe(true)
  })

  test('a typed restart says nothing of continuing: the user writes next', () => {
    const [opening] = restartWindow({ ...window, manual: true, asked: [] })
    expect(opening!.text.split('\n')[0]).toBe('Session restarted.')
  })

  test('with no loads and no unanswered messages, the opening and the note remain', () => {
    const messages = restartWindow({ ...window, tickets: [], loads: [], asked: [] })
    expect(messages.map((m) => m.role)).toEqual(['user', 'user'])
  })
})

describe('freshWindow', () => {
  const file = { type: 'file' as const, path: '/p/ticket.md', text: 'T', from: 1, to: 1, whole: true }

  test('has its parts in order: opening, tickets, the last reply, unanswered messages', () => {
    const messages = freshWindow({ tickets: [file], reply: 'REPLY', asked: ['ONE'] })
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'user', 'user'])
    expect(messages[0]!.text).toContain("Answer every point of the user's messages below.")
    expect(messages[0]!.text).not.toContain('note')
    expect(messages[3]!.text).toBe("The agent's last reply in the old window:\n\nREPLY")
    expect(messages[4]!.text).toBe('ONE')
  })

  test('the opening names no way back to the old turns', () => {
    expect(freshWindow({ tickets: [], reply: '', asked: [] })[0]!.text).not.toContain('flow audit')
  })
})

describe('afterAnswer', () => {
  const held = { asked: ['ONE'] }

  test('a finished answer clears what was asked', () => {
    expect(afterAnswer(held, 'NEW', false)).toEqual({ asked: [] })
  })

  test('the closing line of a restart turn changes nothing', () => {
    expect(afterAnswer(held, 'Restarting now.', true)).toBe(held)
  })

  test('an empty answer changes nothing', () => {
    expect(afterAnswer(held, '  ', false)).toBe(held)
  })
})

describe('compaction', () => {
  test('a typed /compact is refused', async ($) => {
    expect(await $.session.compact({ trigger: 'manual', messages: [] })).toEqual(REFUSAL)
  })

  test('an automatic compaction is refused', async ($) => {
    expect(await $.session.compact({ trigger: 'auto', messages: [] })).toEqual(REFUSAL)
  })
})

describe('restart tool', () => {
  test('refuses a call with no message', async ($) => {
    const result = await $.tool.call({ tool: 'mcp__flow-session__restart', message: '' } as never)
    expect(result).toEqual({ deny: 'Pass your note as `message`.' })
  })

  test('is denied while a helper agent runs, and goes through once it finished', async ($, on) => {
    on('turn.start', (_$, e) => ({ turnId: e.turnId }) as never)
    on('turn.complete', () => ({ text: '' }) as never)
    const call = { tool: 'mcp__flow-session__restart', message: 'NOTE' } as never
    await $.turn.start({ turnId: 'sub', agentId: 'helper-1' } as never)
    const denied = await $.tool.call(call)
    expect(denied).toMatchObject({ deny: expect.stringContaining('A helper agent is still running') })
    await $.turn.complete({ turnId: 'sub', agentId: 'helper-1', reason: 'answer', answer: 'done' } as never)
    expect(await $.tool.call(call)).toMatchObject({ result: expect.any(String) })
  })

  test('a subagent is told to save its state to files and begin with UNFINISHED', async ($) => {
    const result = await $.tool.call({ tool: 'mcp__flow-session__restart', message: 'NOTE', agentId: 'sub-1' } as never)
    expect(result).toMatchObject({ deny: expect.stringContaining('UNFINISHED:') })
  })

  test('holds the restart in host state, so a second call is refused', async ($) => {
    const call = { tool: 'mcp__flow-session__restart', message: 'NOTE' } as never
    expect(await $.tool.call(call)).toMatchObject({ result: expect.any(String) })
    expect(await $.tool.call(call)).toEqual({ deny: 'A restart is already under way.' })
  })
})

describe('/restart', () => {
  test('answers with a line saying the agent writes its note', async ($, on) => {
    mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
    on('fs.read', () => ({ value: '' }))
    const result = await $.command.run({ command: 'restart', args: '' } as never)
    expect(result.text).toContain('the agent writes its note')
  })

  test('the guide is read from prompts/ in the Flow home', async ($, on) => {
    mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
    on('fs.read', (_$, e) => ({ value: e.path === '/h/.flow/prompts/restart-guide.md' ? 'GUIDE TEXT' : '' }))
    on('clock.sleep', () => ({ value: undefined }) as never)
    const sent: string[] = []
    on('prompt.submit', (_$, e) => {
      sent.push((e as unknown as { text: string }).text)
      return { text: '' }
    })
    await $.command.run({ command: 'restart', args: '' } as never)
    for (let turn = 0; turn < 50 && sent.length === 0; turn++) await Promise.resolve()
    expect(sent.join('')).toContain('GUIDE TEXT')
  })
})

describe('addAsked', () => {
  test('a message sent again with more words replaces the first one', () => {
    expect(addAsked(['Okay, here you go. Right?'], 'Okay, here you go. Right? Also the meters.')).toEqual(['Okay, here you go. Right? Also the meters.'])
  })

  test('separate messages are all kept, in order', () => {
    expect(addAsked(['yes'], 'and the next one')).toEqual(['yes', 'and the next one'])
  })

  test('a word that merely starts the new message is kept', () => {
    expect(addAsked(['yes'], 'yesterday it broke')).toEqual(['yes', 'yesterday it broke'])
  })

  test('only the messages the new one repeats are dropped', () => {
    expect(addAsked(['A one', 'B two'], 'A one and more')).toEqual(['B two', 'A one and more'])
  })

  test('a message sent again with a typo mended replaces the first one, at the same length', () => {
    expect(addAsked(['Fix the buidl script now'], 'Fix the build script now')).toEqual(['Fix the build script now'])
  })

  test('a typo mended and words added still replaces the first one', () => {
    expect(addAsked(['Fix the buidl script'], 'Fix the build script, then the tests')).toEqual(['Fix the build script, then the tests'])
  })

  test('a different word, a number or a short word makes a separate message', () => {
    expect(addAsked(['fix the login page'], 'fix the logout page')).toEqual(['fix the login page', 'fix the logout page'])
    expect(addAsked(['use port 3000'], 'use port 4000')).toEqual(['use port 3000', 'use port 4000'])
    expect(addAsked(['do A'], 'do B')).toEqual(['do A', 'do B'])
  })

  test('a file, a path, a URL or a number in any script makes a separate message, however close', () => {
    expect(addAsked(['edit tickets.js'], 'edit tickets.ts and more')).toEqual(['edit tickets.js', 'edit tickets.ts and more'])
    expect(addAsked(['look at src/a.ts'], 'look at src/b.ts then fix it')).toEqual(['look at src/a.ts', 'look at src/b.ts then fix it'])
    expect(addAsked(['open https://x.com/a'], 'open https://x.com/b now')).toEqual(['open https://x.com/a', 'open https://x.com/b now'])
    expect(addAsked(['port ٣٠٠٠'], 'port ٤٠٠٠ please')).toEqual(['port ٣٠٠٠', 'port ٤٠٠٠ please'])
  })

  test('a blank earlier message is kept as it was', () => {
    expect(addAsked(['  '], 'X')).toEqual(['  ', 'X'])
  })

  test('a message sent twice stays one, and an empty one removes nothing', () => {
    expect(addAsked(['go on'], 'go on')).toEqual(['go on'])
    expect(addAsked(['A one'], '')).toContain('A one')
  })

  test('a huge message is compared in moments', () => {
    const earlier = Array.from({ length: 50 }, (_, i) => `message ${i} ${'word '.repeat(50)}`)
    const huge = 'message 0 ' + 'word '.repeat(200000)
    const started = performance.now()
    addAsked(earlier, huge)
    expect(performance.now() - started).toBeLessThan(1000)
  })
})
