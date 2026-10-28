import { describe, expect, mock, test } from 'claude-code/testing'
import { flush } from '../../../shared/testing'
import { firstRead, ticketOf, visitKey } from '../visits'

const HOME = '/h/.flow'
const ROOT = '/work'
const RAN = { exitCode: 0, stdout: '{}', stderr: '', isStdoutTruncated: false, isStderrTruncated: false }

const read = (id: string, file_path: string) => ({ type: 'tool_use', id, name: 'Read', input: { file_path } })
const bash = (id: string, command: string) => ({ type: 'tool_use', id, name: 'Bash', input: { command } })
const assistant = (...content: { type: string }[]) => ({ role: 'assistant', content })

describe('visitKey', () => {
  test('names a wiki folder, and a research topic of the project or the home', () => {
    expect(visitKey(`${HOME}/wiki/claude-code/mod-hooks.md`, HOME, ROOT)).toBe('claude-code')
    expect(visitKey(`${HOME}/wiki/claude-code/findings/a.md`, HOME, ROOT)).toBe('claude-code')
    expect(visitKey(`${ROOT}/.flow/research/agent-memory/letta.md`, HOME, ROOT)).toBe('research:agent-memory')
    expect(visitKey(`${HOME}/research/agent-memory/letta.md`, HOME, ROOT)).toBe('research:agent-memory')
  })

  test('names nothing for a file outside a folder, or another project', () => {
    expect(visitKey(`${HOME}/wiki/index.md`, HOME, ROOT)).toBeUndefined()
    expect(visitKey(`${HOME}/research/notes.md`, HOME, ROOT)).toBeUndefined()
    expect(visitKey('/other/.flow/research/agent-memory/letta.md', HOME, ROOT)).toBeUndefined()
    expect(visitKey(`${ROOT}/src/index.ts`, HOME, ROOT)).toBeUndefined()
  })
})

describe('firstRead and ticketOf', () => {
  test('only the first Read of a folder in the window counts, and one the window lacks counts alone', () => {
    const window = [assistant(read('a', `${HOME}/wiki/node/index.md`), read('b', `${HOME}/wiki/node/test.md`))]
    expect(firstRead(window, 'node', 'a', HOME, ROOT)).toBe(true)
    expect(firstRead(window, 'node', 'b', HOME, ROOT)).toBe(false)
    expect(firstRead(window, 'tmux', 'c', HOME, ROOT)).toBe(true)
  })

  test('the ticket is the last one started, and none without a start', () => {
    expect(ticketOf([assistant(bash('a', 'flow tickets start fw-12 --activity build'), bash('b', 'flow tickets get fw-9'))])).toBe('fw-12')
    expect(ticketOf([assistant(bash('a', 'flow tickets start fw-12')), assistant(bash('b', 'flow tickets start fw-274'))])).toBe('fw-274')
    expect(ticketOf([assistant(bash('a', 'ls'))])).toBeUndefined()
  })
})

/** Answers what Claude Code answers, the window growing with each Read. Returns each `flow visit` run. */
function claudeCode(on: Parameters<typeof mock.env>[0], window: object[]): { argv: string[]; cwd?: string }[] {
  const runs: { argv: string[]; cwd?: string }[] = []
  mock.env(on, { FLOW_HOME: HOME, HOME: '/h' })
  on('session.root', () => ({ value: ROOT }))
  on('fs.read', () => ({ value: '{"ticketPrefix":"fw"}' }))
  on('ui.log', () => ({ value: undefined }) as never)
  on('session.messages', () => ({ value: window }) as never)
  on('process.run', (_$, e) => {
    const { argv, init } = e as unknown as { argv: string[]; init?: { cwd?: string } }
    if (argv[1] === 'visit') runs.push({ argv, cwd: init?.cwd })
    return { value: { ...RAN, stdout: '[]' } }
  })
  on('tool.call', () => ({ result: 'file text' }))
  return runs
}

describe('the Read hook', () => {
  test('2 reads of one folder count once per window, for the ticket the session started', async ($, on) => {
    const window: object[] = [assistant(bash('s', 'flow tickets start fw-274 --activity build'))]
    const runs = claudeCode(on, window)
    for (const [id, file] of [['r1', 'mod-hooks.md'], ['r2', 'index.md']] as const) {
      const path = `${HOME}/wiki/claude-code/${file}`
      window.push(assistant(read(id, path)))
      await $.tool.call({ tool: 'Read', file_path: path, tool_use_id: id })
    }
    await flush()
    expect(runs).toEqual([{ argv: ['flow', 'visit', 'claude-code', '--ticket', 'fw-274'], cwd: ROOT }])
  })

  test('a read with no ticket started counts for the project, and a read elsewhere counts nothing', async ($, on) => {
    const window: object[] = []
    const runs = claudeCode(on, window)
    const report = `${ROOT}/.flow/research/agent-memory/letta.md`
    window.push(assistant(read('r1', report)))
    await $.tool.call({ tool: 'Read', file_path: report, tool_use_id: 'r1' })
    await $.tool.call({ tool: 'Read', file_path: `${ROOT}/src/index.ts`, tool_use_id: 'r2' })
    await flush()
    expect(runs).toEqual([{ argv: ['flow', 'visit', 'research:agent-memory'], cwd: ROOT }])
  })
})
