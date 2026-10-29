import { describe, expect, test } from 'claude-code/testing'
import {
  classify,
  cover,
  denyFor,
  guardedWrite,
  isAutoAllow,
  isCovered,
  storeVerdict,
  takeVerdict,
  verdictKey,
} from '../pane'

describe('classify', () => {
  test('names Allow and Refuse, and takes any other text as a note', () => {
    expect(classify('Allow')).toBe('allow')
    expect(classify('Refuse')).toBe('refuse')
    expect(classify('not now, use tmp/')).toBe('note')
  })
})

describe('the verdict', () => {
  test('is keyed by the tool and its command or path', () => {
    expect(verdictKey('Bash', { command: 'git push' })).toBe('Bash\ngit push')
    expect(verdictKey('Edit', { file_path: '/p/a', old_string: 'x' })).toBe('Edit\n/p/a')
    expect(verdictKey('mcp__x__go', { a: 1 })).toBe('mcp__x__go\n{"a":1}')
    expect(verdictKey('Bash', undefined)).toBe('Bash\n{}')
  })

  test('is read once', () => {
    const key = verdictKey('Bash', { command: 'git push' })
    storeVerdict(key, { interrupt: true })
    expect(takeVerdict(key)).toEqual({ interrupt: true })
    expect(takeVerdict(key)).toBeUndefined()
  })

  test('a refusal denies with an interrupt, a note without', () => {
    expect(denyFor({ interrupt: true })).toEqual({ behavior: 'deny', message: 'The user refused this call.', interrupt: true })
    const note = denyFor({ interrupt: false, note: 'use tmp/' })
    expect(note).toEqual({ behavior: 'deny', message: 'The user refused this call and wrote: "use tmp/".' })
    expect('interrupt' in note).toBe(false)
  })
})

describe('isAutoAllow', () => {
  const core = { decision: 'ask' }
  const input = { file_path: '/p/.claude/skills/x/SKILL.md' }

  test('allows a core ask on a write under .claude', () => {
    expect(isAutoAllow('Write', input, core)).toBe(true)
    expect(isAutoAllow('Edit', { file_path: '.claude/settings.json' }, core)).toBe(true)
  })

  test('never when the guard asked or a settings rule asked', () => {
    expect(isAutoAllow('Write', input, { decision: 'ask', hook: 'PreToolUse' })).toBe(false)
    expect(isAutoAllow('Write', input, { decision: 'ask', rule: 'Write(*)' })).toBe(false)
  })

  test('never for a read, a command, another folder or a name that only contains .claude', () => {
    expect(isAutoAllow('Read', input, core)).toBe(false)
    expect(isAutoAllow('Bash', { command: 'touch .claude/a' }, core)).toBe(false)
    expect(isAutoAllow('Write', { file_path: '/p/src/a.ts' }, core)).toBe(false)
    expect(isAutoAllow('Write', { file_path: '/p/not.claude/a' }, core)).toBe(false)
  })

  test('never when the decision is not an ask', () => {
    expect(isAutoAllow('Write', input, { decision: 'allow' })).toBe(false)
  })

  test('allows the main agent under a Flow mod folder, bar the two manifests', () => {
    const base = '/p/mods/flow-session'
    expect(isAutoAllow('Edit', { file_path: `${base}/features/band/band.tsx` }, core)).toBe(true)
    expect(isAutoAllow('Edit', { file_path: '/p/mods/flow-permissions/register.ts' }, core)).toBe(true)
    expect(isAutoAllow('Edit', { file_path: '/p/mods/flow-permissions/hooks/hooks.json' }, core)).toBe(false)
    expect(isAutoAllow('Write', { file_path: `${base}/shared/types.d.ts` }, core)).toBe(true)
    expect(isAutoAllow('Edit', { file_path: `${base}/.claude-plugin/plugin.json` }, core)).toBe(false)
    expect(isAutoAllow('Edit', { file_path: `${base}/hooks/hooks.json` }, core)).toBe(false)
  })

  test('allows a write outside the session folder, never inside it or under .git', () => {
    expect(isAutoAllow('Write', { file_path: '/code/reader/README.md' }, core, undefined, '/code/app')).toBe(true)
    expect(isAutoAllow('Write', { file_path: '/code/app-copy/a.ts' }, core, 'agent-1', '/code/app')).toBe(true)
    expect(isAutoAllow('Write', { file_path: '/code/app/src/a.ts' }, core, undefined, '/code/app/')).toBe(false)
    expect(isAutoAllow('Write', { file_path: '/code/reader/.git/hooks/pre-commit' }, core, undefined, '/code/app')).toBe(false)
    expect(isAutoAllow('Write', { file_path: 'rel/a.ts' }, core, undefined, '/code/app')).toBe(false)
    expect(isAutoAllow('Write', { file_path: '/code/reader/a.ts' }, { decision: 'ask', hook: 'PreToolUse' }, undefined, '/code/app')).toBe(false)
  })

  test('never for a subagent under the mod folder, or a folder with a similar name', () => {
    expect(isAutoAllow('Edit', { file_path: '/p/mods/flow-session/features/band/band.tsx' }, core, 'agent-1')).toBe(false)
    expect(isAutoAllow('Edit', { file_path: '/p/mods/flow-session-copy/features/band/band.tsx' }, core)).toBe(false)
  })
})

describe('one yes covers the same guard-asked file', () => {
  const guard = { decision: 'ask', hook: 'PreToolUse' }

  test('a write the guard asked about names its file', () => {
    expect(guardedWrite('Edit', { file_path: '/h/.claude/settings.json' }, guard)).toBe('/h/.claude/settings.json')
    expect(guardedWrite('Bash', { command: 'rm x' }, guard)).toBeUndefined()
    expect(guardedWrite('Edit', { file_path: '/p/a.ts' }, { decision: 'ask' })).toBeUndefined()
  })

  test('a covered file stays covered, another does not', () => {
    expect(isCovered('/h/.claude/settings.json')).toBe(false)
    cover('/h/.claude/settings.json')
    expect(isCovered('/h/.claude/settings.json')).toBe(true)
    expect(isCovered('/h/.claude/settings.local.json')).toBe(false)
  })
})
