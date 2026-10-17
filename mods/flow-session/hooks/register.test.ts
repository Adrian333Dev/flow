import { describe, expect, mock, test } from 'claude-code/testing'

type Stubs = { asks: { question: string; header?: string; options: unknown }[]; lines: Record<string, unknown>[]; paths: string[]; notes: string[] }

/** A dialog that cannot open at all, which the engine reports apart from Esc. */
class Broken extends Error {}

const NO_ANSWER = "no answer (The user doesn't want to proceed with this tool use. The tool use was rejected.)"

/**
 * Answers what Claude Code answers in a session: the verdict beneath the mod,
 * the dialog (`reply` is the label typed or picked, or an Error for Esc),
 * the folder, and the process that appends the log. Returns what the mod did.
 */
function claudeCode(on: Parameters<typeof mock.env>[0], core: Record<string, unknown>, reply: string | Error = 'Allow'): Stubs {
  const seen: Stubs = { asks: [], lines: [], paths: [], notes: [] }
  mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
  on('tool.check', () => core as never)
  on('classic.PermissionRequest', () => ({}) as never)
  on('tool.call', (_$, e) => {
    const call = e as unknown as { tool: string; questions?: { question: string; header?: string; options: unknown }[] }
    if (call.tool !== 'AskUserQuestion' || !call.questions) return { result: 'ok' }
    const question = call.questions[0]!
    seen.asks.push(question)
    if (reply instanceof Broken) throw reply
    if (reply instanceof Error) return { deny: reply.message }
    return { result: { answers: { [question.question]: reply } } }
  })
  on('session.id', () => ({ value: '17da95cd-0000-4000-8000-000000000000' }))
  on('session.root', () => ({ value: '/work/flow-dev' }))
  on('ui.log', (_$, e) => {
    seen.notes.push((e as unknown as { text: string }).text)
    return { value: undefined } as never
  })
  on('process.run', (_$, e) => {
    const argv = (e as unknown as { argv: string[] }).argv
    seen.lines.push(JSON.parse(argv[4]!))
    seen.paths.push(argv[5]!)
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  return seen
}

const PUSH = { command: 'git push origin main' }
const GUARD_ASK = { decision: 'ask', reason: 'Pushes 3 commits to origin/main.', hook: 'PreToolUse' }

describe('an ask the guard raised', () => {
  test('Allow runs the call, shows the sentence over the command, and logs it', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, 'Allow')
    const result = await $.tool.check({ tool: 'Bash', input: PUSH })
    expect(result).toEqual({ decision: 'allow' })
    expect(seen.asks).toHaveLength(1)
    expect(seen.asks[0]!.question).toBe('Pushes 3 commits to origin/main.\n\ngit push origin main')
    expect(seen.asks[0]!.header).toBe('Permission')
    expect(JSON.stringify(seen.asks[0]!.options)).toContain('Refuse')
    expect(seen.lines).toHaveLength(1)
    expect(seen.lines[0]).toMatchObject({
      project: 'flow-dev',
      session: '17da95cd',
      agent: 'main',
      tool: 'Bash',
      source: 'guard',
      headline: 'Pushes 3 commits to origin/main',
      command: 'git push origin main',
      answer: 'allow',
    })
    expect(seen.lines[0]).not.toHaveProperty('rule')
    expect(seen.paths[0]).toMatch(/^\/h\/\.flow\/logs\/permissions\/\d{4}-\d{2}\.jsonl$/)
  })

  test('Refuse returns the ask, and the second hook denies with an interrupt', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, 'Refuse')
    const result = await $.tool.check({ tool: 'Bash', input: PUSH })
    expect(result).toMatchObject({ decision: 'ask', hook: 'PreToolUse' })
    const denied = await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: PUSH } as never)
    expect(denied).toEqual({ decision: { behavior: 'deny', message: 'The user refused this call.', interrupt: true } })
    expect(seen.lines[0]).toMatchObject({ answer: 'refuse' })
    expect(seen.lines[0]!.ms).toBeDefined()
  })

  test('the verdict answers one call only', async ($, on) => {
    claudeCode(on, GUARD_ASK, 'Refuse')
    await $.tool.check({ tool: 'Bash', input: PUSH })
    await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: PUSH } as never)
    expect(await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: PUSH } as never)).toEqual({})
  })

  test('Esc is a refusal', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, new Error(NO_ANSWER))
    await $.tool.check({ tool: 'Bash', input: PUSH })
    const denied = await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: PUSH } as never)
    expect(denied).toMatchObject({ decision: { behavior: 'deny', interrupt: true } })
    expect(seen.lines[0]).toMatchObject({ answer: 'refuse' })
  })

  test('a typed note denies with no interrupt and carries the note', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, 'push to the fork instead')
    await $.tool.check({ tool: 'Bash', input: PUSH })
    const denied = (await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: PUSH } as never)) as { decision: Record<string, unknown> }
    expect(denied.decision.behavior).toBe('deny')
    expect(denied.decision.message).toContain('push to the fork instead')
    expect(denied.decision).not.toHaveProperty('interrupt')
    expect(seen.lines[0]).toMatchObject({ answer: 'note' })
  })

  test('another call is not denied by the verdict of this one', async ($, on) => {
    claudeCode(on, GUARD_ASK, 'Refuse')
    await $.tool.check({ tool: 'Bash', input: PUSH })
    expect(await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: { command: 'ls' } } as never)).toEqual({})
    // Helper modules keep their state between tests, so take the verdict this test stored.
    await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: PUSH } as never)
  })

  test('a failing dialog returns the ask for Claude Code to put, with no verdict and no log line', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, new Broken('no tool named "AskUserQuestion" in this session'))
    expect(await $.tool.check({ tool: 'Bash', input: PUSH })).toMatchObject({ decision: 'ask' })
    expect(seen.notes[0]).toContain('Claude Code asks instead')
    expect(await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: PUSH } as never)).toEqual({})
    expect(seen.lines).toHaveLength(0)
  })

  test('a long line is cut below 2000 characters and ends with a line that has no count', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, 'Allow')
    await $.tool.check({ tool: 'Bash', input: { command: 'echo ' + 'a'.repeat(3000) } })
    expect(seen.asks[0]!.question.length).toBeLessThan(2000)
    expect(seen.asks[0]!.question).toMatch(/\n… the rest is not shown$/)
    expect((seen.lines[0]!.command as string).length).toBe(200)
  })
})

describe('a command too long to colour', () => {
  const lines = Array.from({ length: 36 }, (_, i) => `echo line ${i}`)
  const LONG = { command: lines.join('\n') }
  const labels = (options: unknown) => (options as { label: string }[]).map((option) => option.label)

  test('opens folded with the first 11 lines, the last ending …, and two rows', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, 'Allow')
    expect(await $.tool.check({ tool: 'Bash', input: LONG })).toEqual({ decision: 'allow' })
    expect(seen.asks).toHaveLength(1)
    expect(seen.asks[0]!.question).toBe(`Pushes 3 commits to origin/main.\n\n${[...lines.slice(0, 10), 'echo line 10…'].join('\n')}`)
    expect(labels(seen.asks[0]!.options)).toEqual(['Allow', 'Refuse'])
    expect(seen.lines).toHaveLength(1)
    expect(seen.lines[0]).toMatchObject({ answer: 'allow' })
  })

  test('a refusal of a folded command stops the turn', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, 'Refuse')
    await $.tool.check({ tool: 'Bash', input: LONG })
    expect(await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: LONG } as never)).toMatchObject({ decision: { behavior: 'deny', interrupt: true } })
    expect(seen.lines[0]).toMatchObject({ answer: 'refuse' })
  })

  test('the log line holds the whole command, cut at 200 characters', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK, 'Allow')
    await $.tool.check({ tool: 'Bash', input: LONG })
    expect((seen.lines[0]!.command as string).startsWith('echo line 0\necho line 1')).toBe(true)
    expect((seen.lines[0]!.command as string).length).toBe(200)
  })
})

describe('an ask a settings rule raised', () => {
  test('logs the rule as the settings spell it', async ($, on) => {
    const seen = claudeCode(on, { decision: 'ask', reason: 'Claude requested permissions to use Bash, but you haven’t granted it yet.', rule: 'Bash(git push *)' }, 'Allow')
    await $.tool.check({ tool: 'Bash', input: PUSH })
    expect(seen.asks[0]!.question).toBe('Pushes commits to a remote.\n\ngit push origin main')
    expect(seen.lines[0]).toMatchObject({ source: 'rule', rule: 'Bash(git push *)', headline: 'Pushes commits to a remote', answer: 'allow' })
  })
})

describe('a core ask', () => {
  test('on a write under .claude is allowed with no dialog, and logged', async ($, on) => {
    const seen = claudeCode(on, { decision: 'ask', reason: 'Claude requested permissions to write to /p/.claude/x.md' })
    const result = await $.tool.check({ tool: 'Write', input: { file_path: '/p/.claude/x.md', content: 'x' } })
    expect(result).toEqual({ decision: 'allow' })
    expect(seen.asks).toHaveLength(0)
    expect(seen.lines[0]).toMatchObject({ source: 'core', tool: 'Write', command: '/p/.claude/x.md', answer: 'auto-allow' })
    expect(seen.lines[0]).not.toHaveProperty('ms')
  })

  test('on anything else opens the dialog with the mod’s own sentence', async ($, on) => {
    const seen = claudeCode(on, { decision: 'ask', reason: 'Claude requested permissions to fetch https://x.dev' }, 'Refuse')
    await $.tool.check({ tool: 'WebFetch', input: { url: 'https://x.dev', prompt: 'p' } })
    expect(seen.asks[0]!.question).toBe('Fetches this page.\n\nhttps://x.dev')
    expect(seen.lines[0]).toMatchObject({ source: 'core', tool: 'WebFetch', answer: 'refuse' })
  })
})

describe('a call that is not an ask', () => {
  test('passes unchanged and is not logged', async ($, on) => {
    const seen = claudeCode(on, { decision: 'allow' })
    expect(await $.tool.check({ tool: 'Bash', input: { command: 'ls' } })).toEqual({ decision: 'allow' })
    expect(seen.asks).toHaveLength(0)
    expect(seen.lines).toHaveLength(0)
  })
})

describe('no one is there', () => {
  test('denies with no interrupt and opens no dialog', async ($, on) => {
    const seen = claudeCode(on, GUARD_ASK)
    on('session.start', () => ({ cwd: '/work' }))
    on('tool.register', () => ({ value: undefined }) as never)
    on('command.register', () => ({ value: undefined }) as never)
    await $.session.start({ surface: null, isInteractive: false, cwd: '/work' })
    const result = await $.tool.check({ tool: 'Bash', input: PUSH })
    expect(result).toEqual({ decision: 'deny', reason: 'No one is here to ask. Choose another way, or stop.' })
    expect(seen.asks).toHaveLength(0)
    expect(seen.lines[0]).toMatchObject({ answer: 'nobody' })
    expect(seen.lines[0]).not.toHaveProperty('ms')
  })
})
