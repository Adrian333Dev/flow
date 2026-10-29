import { describe, expect, mock, test } from 'claude-code/testing'
import { flush } from '../../../shared/testing'
import { switchLine, switchPath } from '../model-switch'

const SWITCH = {
  session_id: '3915bf36-c598-4923-b847-412f0abb415d',
  from_model: 'claude-sonnet-5-5',
  to_model: 'claude-haiku-5-5',
  requested_model: null,
  source: 'resume',
}

describe('the model switch log', () => {
  test('a line names the models, what was asked and the source, with the time in UTC', () => {
    const line = switchLine(SWITCH, new Date('2026-10-29T03:27:50.887Z'))
    expect(JSON.parse(line)).toEqual({
      at: '2026-10-29T03:27:50Z',
      session: '3915bf36',
      from: 'claude-sonnet-5-5',
      to: 'claude-haiku-5-5',
      requested: null,
      source: 'resume',
    })
    expect(line).not.toContain('\n')
  })

  test('the file is the month of the switch under the Flow home', () => {
    expect(switchPath('/h/.flow', new Date('2026-10-29T03:27:50Z'))).toBe('/h/.flow/logs/model-switches/2026-10.jsonl')
    expect(switchPath('/h/.flow', new Date('2026-01-02T00:00:00Z'))).toBe('/h/.flow/logs/model-switches/2026-01.jsonl')
  })

  test('a switch is appended to the log when Claude Code reports it', async ($, on) => {
    mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
    const ran: string[][] = []
    on('classic.PostModelSwitch', () => ({}) as never)
    on('process.run', (_$, e) => {
      ran.push((e as unknown as { argv: string[] }).argv)
      return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    })
    await $.classic.PostModelSwitch({ ...SWITCH, hook_event_name: 'PostModelSwitch' } as never)
    await flush()
    expect(ran).toHaveLength(1)
    expect(JSON.parse(ran[0]![4]!)).toMatchObject({ from: 'claude-sonnet-5-5', to: 'claude-haiku-5-5', source: 'resume' })
    expect(ran[0]![5]).toMatch(/^\/h\/\.flow\/logs\/model-switches\/\d{4}-\d{2}\.jsonl$/)
  })
})
