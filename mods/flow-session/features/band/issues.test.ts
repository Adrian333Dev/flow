import { describe, expect, test } from 'claude-code/testing'
import { failureFiles, openIssues } from './issues'

describe('failureFiles', () => {
  test('names last month and this month', () => {
    expect(failureFiles('/h/.flow', new Date(2026, 9, 18))).toEqual([
      '/h/.flow/logs/failures/2026-09.jsonl',
      '/h/.flow/logs/failures/2026-10.jsonl',
    ])
  })

  test('January reaches back into December of the year before', () => {
    expect(failureFiles('/h', new Date(2027, 0, 5))[0]).toBe('/h/logs/failures/2026-12.jsonl')
  })
})

describe('openIssues', () => {
  const fail = (job: string) => JSON.stringify({ at: 't', job, error: 'x' })
  const clear = (job: string) => JSON.stringify({ at: 't', job, cleared: true })

  test('counts each job once however often it failed', () => {
    expect(openIssues([`${fail('a')}\n${fail('a')}\n${fail('b')}\n`])).toBe(2)
  })

  test('a later cleared line closes the job, in this file or across files', () => {
    expect(openIssues([`${fail('a')}\n${fail('b')}\n${clear('a')}\n`])).toBe(1)
    expect(openIssues([`${fail('a')}\n`, `${clear('a')}\n`])).toBe(0)
  })

  test('a job that failed again after it cleared is open', () => {
    expect(openIssues([`${fail('a')}\n${clear('a')}\n${fail('a')}\n`])).toBe(1)
  })

  test('lines with no job, and lines that are not JSON, count for nothing', () => {
    expect(openIssues([`not json\n${JSON.stringify({ source: 'agent', error: 'x' })}\n\n`])).toBe(0)
  })

  test('no files, no issues', () => {
    expect(openIssues([])).toBe(0)
  })
})
