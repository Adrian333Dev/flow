import { describe, expect, test } from 'claude-code/testing'

const DEFERRED = [
  'The following deferred tools are now available via ToolSearch:',
  'AskUserQuestion',
  'EnterWorktree',
  'WebSearch',
].join('\n')

const CORE = { plugin: 'engine', tier: 'core' } as const

const QUESTION = { questions: [{ question: 'Which one?', header: 'Pick', options: [{ label: 'A', description: 'a' }, { label: 'B', description: 'b' }], multiSelect: false }] }

describe('the question tool', () => {
  test('moves behind ToolSearch with a description that refuses it', async ($) => {
    const described = await $.tool.describe({ tool: 'AskUserQuestion', description: 'Asks the user a question.', provider: CORE })
    expect(described).toMatchObject({ description: 'Never call this. Ask the user in plain text in your reply.', isDeferred: true })
  })

  test('leaves every other tool’s description alone', async ($, on) => {
    on('tool.describe', (_$, e) => ({ description: e.description }))
    expect(await $.tool.describe({ tool: 'Bash', description: 'Runs a command.', provider: CORE })).toEqual({ description: 'Runs a command.' })
  })

  test('leaves the list of deferred tools, which keeps the others', async ($, on) => {
    on('prompt.attachment', (_$, e) => ({ text: (e as { text: string }).text }))
    const sent = await $.prompt.attachment({ type: 'deferred_tools_delta', text: DEFERRED, origin: { kind: 'engine' } } as never)
    expect(sent.text).toBe('The following deferred tools are now available via ToolSearch:\nEnterWorktree\nWebSearch')
  })

  test('is refused when the model calls it', async ($, on) => {
    on('tool.call', () => ({ result: { answers: { 'Which one?': 'A' } } }) as never)
    const result = (await $.tool.call({ tool: 'AskUserQuestion', ...QUESTION } as never)) as { isError?: boolean; text?: string; deny?: string }
    expect(JSON.stringify(result)).toContain('Ask the user in plain text in your reply.')
  })

  // A mod's own dialog passes: every test in dialog.test.ts opens one through this hook.
})
