import { describe, expect, test } from 'claude-code/testing'
import { appendCommand, logLine, logPath, sourceOf, type LogFields } from './log'

const PUSH: LogFields = {
  at: new Date('2026-10-14T09:12:03.482Z'),
  project: 'flow-dev',
  session: '17da95cd-0000-4000-8000-000000000000',
  tool: 'Bash',
  source: 'rule',
  headline: 'Push to a remote',
  command: 'git push origin main',
  rule: 'Bash(git push *)',
  answer: 'allow',
  ms: 4210,
}

describe('logLine', () => {
  test('is the line of docs/spec/permissions.md', () => {
    expect(logLine(PUSH)).toBe(
      '{"at":"2026-10-14T09:12:03Z","project":"flow-dev","session":"17da95cd","agent":"main","tool":"Bash","source":"rule","headline":"Push to a remote","command":"git push origin main","rule":"Bash(git push *)","answer":"allow","ms":4210}',
    )
  })

  test('leaves out the rule and the time where there is none', () => {
    const line = JSON.parse(logLine({ ...PUSH, source: 'core', rule: undefined, ms: undefined, answer: 'auto-allow' }))
    expect('rule' in line).toBe(false)
    expect('ms' in line).toBe(false)
    expect(line.answer).toBe('auto-allow')
  })

  test('names a subagent by its id', () => {
    expect(JSON.parse(logLine({ ...PUSH, agent: 'a42' })).agent).toBe('a42')
  })

  test('cuts the command at 200 characters', () => {
    expect(JSON.parse(logLine({ ...PUSH, command: 'c'.repeat(500) })).command).toHaveLength(200)
  })

  test('stays one line for a command with newlines and quotes', () => {
    const line = logLine({ ...PUSH, command: 'echo "a"\nls' })
    expect(line).not.toContain('\n')
    expect(JSON.parse(line).command).toBe('echo "a"\nls')
  })

  test('holds what the audit view needs: a string source and answer, a text time', () => {
    const line = JSON.parse(logLine(PUSH))
    expect(typeof line.source).toBe('string')
    expect(typeof line.answer).toBe('string')
    expect(line.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })
})

describe('sourceOf', () => {
  test('is guard, rule or core', () => {
    expect(sourceOf('PreToolUse', undefined)).toBe('guard')
    expect(sourceOf('PreToolUse', 'Bash(git push *)')).toBe('guard')
    expect(sourceOf(undefined, 'Bash(git push *)')).toBe('rule')
    expect(sourceOf(undefined, undefined)).toBe('core')
  })
})

describe('logPath', () => {
  test('is the month file under the Flow home', () => {
    expect(logPath('/h/.flow', new Date('2026-10-14T09:12:03Z'))).toBe('/h/.flow/logs/permissions/2026-10.jsonl')
    expect(logPath('/h/.flow', new Date('2026-01-01T00:00:00Z'))).toBe('/h/.flow/logs/permissions/2026-01.jsonl')
  })
})

describe('appendCommand', () => {
  test('passes the line and the path as arguments, never inside the script', () => {
    const argv = appendCommand('{"a":"it\'s"}', '/h/x.jsonl')
    expect(argv.slice(0, 2)).toEqual(['bash', '-c'])
    expect(argv.slice(3)).toEqual(['log', '{"a":"it\'s"}', '/h/x.jsonl'])
    expect(argv[2]).not.toContain('{"a"')
  })
})
