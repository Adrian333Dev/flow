import { describe, expect, test } from 'claude-code/testing'
import { checkReport, type LogLine, type Row, windowsArg } from '../check-command'

const T = (s: string) => `2026-11-03T10:00:${s}.000Z`
const L = (s: string) => `2026-11-03T10:00:${s}Z`

describe('checkReport', () => {
  test('a guide sent beside a read is ok, a held call LATE, a broken send FAILED', () => {
    const rows: Row[] = [
      { k: 'p', t: T('01') },
      { k: 'p', t: T('05') },
      { k: 'p', t: T('09') },
    ]
    const log: LogLine[] = [
      { at: L('02'), session: 's', id: 'code', by: 'beside', file: '/w/a.ts', sent: ['guides/write-code.md'] },
      { at: L('06'), session: 's', id: 'spec-first', by: 'held', file: '/w/scripts/flow.ts', sent: ['/w/docs/spec/product.md'] },
      { at: L('10'), session: 's', id: 'skill-wiki', by: 'skill', file: 'audit', sent: [], error: 'flow audit failed' },
    ]
    expect(checkReport(rows, log)).toBe(
      [
        'this window, turns 1-3:',
        '',
        'code        a.ts beside turn 1 · sent write-code.md  ok',
        'spec-first  flow.ts held turn 2 · sent product.md    LATE',
        'skill-wiki  audit turn 3 · flow audit failed         FAILED',
      ].join('\n'),
    )
  })

  test('an edit that ran with its guide out of the window is MISSED, one after the read is not', () => {
    const rows: Row[] = [
      { k: 'p', t: T('01') },
      { k: 'u', t: T('02'), id: 'e1', n: 'Edit', i: { file_path: '/w/a.ts' } },
      { k: 'r', t: T('03'), id: 'e1', e: false, a: [] },
      { k: 'u', t: T('04'), id: 'g1', n: 'Read', i: { file_path: '/h/.flow/guides/write-code.md' } },
      { k: 'r', t: T('05'), id: 'g1', e: false, a: [] },
      { k: 'u', t: T('06'), id: 'e2', n: 'Edit', i: { file_path: '/w/b.ts' } },
      { k: 'r', t: T('07'), id: 'e2', e: false, a: [] },
    ]
    expect(checkReport(rows, [])).toBe(['this window, turns 1-1:', '', 'code  a.ts ran turn 1 · write-code.md never in the window  MISSED'].join('\n'))
  })

  test('a guide attached to a shell read counts as in the window, a failed edit is no act', () => {
    const rows: Row[] = [
      { k: 'p', t: T('01') },
      { k: 'u', t: T('02'), id: 'e0', n: 'Edit', i: { file_path: '/w/c.ts' } },
      { k: 'r', t: T('03'), id: 'e0', e: true, a: [] },
      { k: 'u', t: T('04'), id: 'b1', n: 'Bash', i: { command: 'cat a.ts' } },
      { k: 'r', t: T('05'), id: 'b1', e: false, a: [] },
      { k: 'a', t: T('05'), a: ['write-code.md'] },
      { k: 'u', t: T('06'), id: 'e1', n: 'Edit', i: { file_path: '/w/a.ts' } },
      { k: 'r', t: T('07'), id: 'e1', e: false, a: [] },
    ]
    expect(checkReport(rows, [])).toBe('this window, turns 1-1: nothing fired, nothing missed.')
  })

  test('windows split at each compaction, newest first, each log line in its own', () => {
    const rows: Row[] = [{ k: 'p', t: T('01') }, { k: 'w', t: T('05') }, { k: 'p', t: T('06') }]
    const log: LogLine[] = [{ at: L('02'), session: 's', id: 'code', by: 'beside', file: '/w/a.ts', sent: ['guides/write-code.md'] }]
    expect(checkReport(rows, log)).toBe(
      ['this window, turns 1-1: nothing fired, nothing missed.', '', '1 window back, turns 1-1:', '', 'code  a.ts beside turn 1 · sent write-code.md  ok'].join('\n'),
    )
  })
})

describe('windowsArg', () => {
  test('reads --windows, 1 by default, and refuses anything else', () => {
    expect(windowsArg('')).toBe(1)
    expect(windowsArg('--windows 2')).toBe(2)
    expect(windowsArg('2')).toBeUndefined()
  })
})
