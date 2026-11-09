import { describe, expect, test } from 'claude-code/testing'
import { groupsOf } from '../checks/commands'
import { windowKeys } from '../engine/held'
import { HEADER, planFor } from '../engine/response'
import { entryFor, type Call } from '../list'
import { setLinks } from '../checks/shipped'
import { attachedLine } from '../sends/guides'

const read = (file_path: string, more: Record<string, unknown> = {}): Call => ({ tool: 'Read', input: { file_path, ...more } })
const edit = (file_path: string): Call => ({ tool: 'Edit', input: { file_path, old_string: 'a', new_string: 'b' } })
const bash = (command: string): Call => ({ tool: 'Bash', input: { command } })
const sent = (plan: ReturnType<typeof planFor>) => plan.added.map((a) => (a.send.tool === 'Read' ? a.send.path : a.send.command))

describe('entryFor', () => {
  test('matches each kind of file to its entry, first match wins', () => {
    expect(entryFor(read('/w/.flow/tickets/284/ticket.md'))?.id).toBe('ticket')
    expect(entryFor(read('/w/.flow/tickets/284/protos/a.ts'))?.id).toBe('ticket')
    expect(entryFor(edit('/w/home/CLAUDE.md'))?.id).toBe('rule-file')
    expect(entryFor(edit('/w/.claude/rules/db.md'))?.id).toBe('rule-file')
    expect(entryFor(edit('/w/skills/work/execute/SKILL.md'))?.id).toBe('loaded-file')
    expect(entryFor(edit('/w/prompts/restart-guide.md'))?.id).toBe('loaded-file')
    expect(entryFor(edit('/w/references/guides/review-code.md'))?.id).toBe('loaded-file')
    expect(entryFor(edit('/w/docs/spec/rules.md'))?.id).toBe('spec')
    expect(entryFor(edit('/w/docs/manual/restart.md'))?.id).toBe('markdown')
    expect(entryFor(edit('/h/.flow/wiki/bash/findings/a.md'))?.id).toBe('wiki')
    expect(entryFor(read('/h/.flow/references/guides/wiki.md'))).toBeUndefined()
    expect(entryFor(bash('cd x && flow audit'))?.id).toBe('command')
    expect(entryFor(edit('/w/mods/flow-session/features/restart/window.ts'))?.id).toBe('code')
    expect(entryFor(read('/w/scripts/flow.js'))?.id).toBe('code')
    expect(entryFor(read('/w/app/main.py'))?.id).toBe('code')
  })

  test('leaves data files, a guide read, bare ticket commands and a help call alone', () => {
    expect(entryFor(edit('/w/scripts/package.json'))).toBeUndefined()
    expect(entryFor(read('/w/a.yaml'))).toBeUndefined()
    expect(entryFor(read('/h/.flow/references/guides/writing.md'))).toBeUndefined()
    expect(entryFor(read('/h/.flow/references/guides/write-code.md'))).toBeUndefined()
    expect(entryFor(bash('flow tickets start fw-284 --activity build'))).toBeUndefined()
    expect(entryFor(bash('flow audit --help'))).toBeUndefined()
    expect(entryFor({ tool: 'Grep', input: { pattern: 'x', path: '/w/a.md' } })).toBeUndefined()
  })

  test('an edit of a guide still takes its entry', () => {
    expect(entryFor(edit('/w/references/guides/writing.md'))?.id).toBe('loaded-file')
  })
})

describe('knowledge', () => {
  const write = (file_path: string): Call => ({ tool: 'Write', input: { file_path, content: 'x' } })

  test('an edited .mcp.json and an install command take the entry, a written or edited skill does not', () => {
    expect(entryFor(write('/w/.claude/skills/a/SKILL.md'))?.id).toBe('loaded-file')
    expect(entryFor(edit('/w/.mcp.json'))?.id).toBe('knowledge')
    expect(entryFor(bash('claude plugin install x@y --scope project'))?.id).toBe('knowledge')
    expect(entryFor(bash('cd w && claude mcp add ctx -- npx ctx'))?.id).toBe('knowledge')
    expect(entryFor(edit('/w/.claude/skills/a/SKILL.md'))?.id).toBe('loaded-file')
    expect(entryFor(bash('claude plugin list'))).toBeUndefined()
  })

  test('a written skill gets no guide, and nothing is held', () => {
    expect(planFor([write('/w/.claude/skills/a/SKILL.md')], new Set())).toEqual({ held: [], added: [], notes: new Map() })
  })

  test('an install command is held back until knowledge.md is read', () => {
    const plan = planFor([bash('claude plugin install x@y')], new Set())
    expect(plan.held).toEqual([0])
    expect(plan.added[0]!.header).toBe(`${HEADER} Your Bash (claude plugin install x@y) was held back, so it did not run. Read this guide, then make it again.`)
    expect(planFor([bash('claude plugin install x@y')], new Set(['read:references/guides/knowledge.md']))).toEqual({ held: [], added: [], notes: new Map() })
  })
})

describe('shell-write', () => {
  const sed = `sed -i 's/^- \\[ \\] fw-274:/- [x] fw-274:/' .flow/tickets/316/ticket.md`

  test('a shell write takes the entry, a read does not', () => {
    expect(entryFor(bash(sed))?.id).toBe('shell-write')
    expect(entryFor(bash(`sed -n '1,5p' .flow/tickets/316/ticket.md`))).toBeUndefined()
    expect(entryFor(bash(`grep -rn "sed -i" home/CLAUDE.md`))).toBeUndefined()
    expect(entryFor(bash(`sed -i 's/a/b/' package.json`))).toBeUndefined()
  })

  test('a sed -i on a ticket is held until the ticket guide is read', () => {
    const plan = planFor([bash(sed)], new Set())
    expect(plan.held).toEqual([0])
    expect(sent(plan)).toEqual(['references/guides/write-tickets.md'])
    expect(plan.added[0]!.header).toBe(`${HEADER} Your Bash (${sed.slice(0, 60)}) was held back, so it did not run. Read this guide, then make it again.`)
    expect(planFor([bash(sed)], new Set(['read:references/guides/write-tickets.md']))).toEqual({ held: [], added: [], notes: new Map() })
  })

  test('a ticket and a test file in one command bring both guides, a rule file none', () => {
    const both = ["python3 - <<'EOF'", "a='.flow/tickets/321/ticket.md'", "b='features/usage/visits.test.ts'", "open(a,'w').write('x')", "open(b,'w').write('y')", 'EOF'].join('\n')
    expect(sent(planFor([bash(both)], new Set()))).toEqual(['references/guides/write-tickets.md', 'references/guides/write-code.md'])
    expect(sent(planFor([bash(`sed -i 's/a/b/' home/CLAUDE.md`)], new Set()))).toEqual([])
  })
})

describe('groupsOf', () => {
  test('finds flow groups and util groups anywhere in the command', () => {
    expect(groupsOf('flow audit sql "select 1" | head')).toEqual(['flow audit'])
    expect(groupsOf('util fs tree . && flow notes get x')).toEqual(['util fs', 'flow notes'])
    expect(groupsOf('flow new "x"; echo flowaudit')).toEqual([])
  })
})

describe('windowKeys', () => {
  test('counts a whole-file read and a help call once answered', () => {
    const keys = windowKeys([
      { content: [
        { type: 'tool_use', id: 'a', name: 'Read', input: { file_path: '/h/.flow/references/guides/writing.md' } },
        { type: 'tool_use', id: 'b', name: 'Read', input: { file_path: '/h/.flow/references/guides/write-spec.md', offset: 40, limit: 10 } },
        { type: 'tool_use', id: 'c', name: 'Bash', input: { command: 'flow audit --help' } },
        { type: 'tool_use', id: 'd', name: 'Read', input: { file_path: '/h/.flow/references/guides/write-tickets.md' } },
      ] },
      { content: [{ type: 'tool_result', tool_use_id: 'a' }, { type: 'tool_result', tool_use_id: 'b' }, { type: 'tool_result', tool_use_id: 'c' }] },
    ])
    expect([...keys].sort()).toEqual(['bash:flow audit --help', 'read:references/guides/writing.md'])
  })

  test('counts a guide attached to a shell read, so a later edit runs', () => {
    const keys = windowKeys([{ content: [{ type: 'text', text: `${attachedLine('docs/spec/a.md', 'write-spec.md')}\n\n# Write the spec` }] }])
    expect([...keys]).toEqual(['read:references/guides/write-spec.md'])
    expect(planFor([edit('/w/docs/spec/a.md')], new Set([...keys, 'read:references/guides/writing.md'])).held).toEqual([])
  })
})

describe('planFor', () => {
  test('a read of a matched file gets each missing guide added beside it', () => {
    const plan = planFor([read('/w/docs/spec/rules.md')], new Set(['read:references/guides/writing.md']))
    expect(plan.held).toEqual([])
    expect(sent(plan)).toEqual(['references/guides/write-spec.md'])
    expect(plan.added[0]!.header).toBe(`${HEADER} Before planning a change to rules.md, follow this guide.`)
  })

  test('nothing is added that the window or the response holds', () => {
    expect(planFor([read('/w/docs/spec/rules.md')], new Set(['read:references/guides/writing.md', 'read:references/guides/write-spec.md'])).added).toEqual([])
    const plan = planFor([read('/w/docs/spec/rules.md'), read('/h/.flow/references/guides/writing.md')], new Set())
    expect(sent(plan)).toEqual(['references/guides/write-spec.md'])
  })

  test('3 files in one response share their guides', () => {
    const plan = planFor([read('/w/home/CLAUDE.md'), read('/w/skills/a/SKILL.md'), read('/w/docs/spec/a.md')], new Set())
    expect(sent(plan)).toEqual(['references/guides/writing.md', 'references/guides/write-spec.md'])
  })

  test('a code file gets the code guide once a window, never per file', () => {
    const plan = planFor([read('/w/a.ts'), read('/w/b.ts')], new Set())
    expect(sent(plan)).toEqual(['references/guides/write-code.md'])
    expect(plan.added[0]!.header).toBe(`${HEADER} Before planning a change to a.ts, follow this guide.`)
    expect(planFor([edit('/w/a.ts')], new Set(['read:references/guides/write-code.md']))).toEqual({ held: [], added: [], notes: new Map() })
  })

  test('an edit with a guide missing is held back with every call after it, the guide read in its place', () => {
    const plan = planFor([read('/w/a.ts'), edit('/w/docs/manual/restart.md'), bash('npm test')], new Set(['read:references/guides/write-code.md']))
    expect(plan.held).toEqual([1, 2])
    expect(sent(plan)).toEqual(['references/guides/writing.md'])
    expect(plan.added[0]!.header).toBe(
      `${HEADER} Your Edit of restart.md was held back, so the file is unchanged. Held with it: Bash (npm test). Read this guide, then make them again.`,
    )
  })

  test('the held line rides the first guide added, the others say what they are', () => {
    const plan = planFor([edit('/w/docs/spec/a.md')], new Set())
    expect(plan.added.map((a) => a.header.includes('held back'))).toEqual([true, false])
  })

  test('an edit whose guide the model reads beside it is still held, the line on the model\'s own read', () => {
    const plan = planFor([read('/h/.flow/references/guides/writing.md'), edit('/w/notes/a.md')], new Set())
    expect(plan.held).toEqual([1])
    expect(plan.added).toEqual([])
    expect(plan.notes.get(0)).toContain('Your Edit of a.md was held back')
  })

  test('an edit with every guide in the window runs', () => {
    expect(planFor([edit('/w/notes/a.md')], new Set(['read:references/guides/writing.md']))).toEqual({ held: [], added: [], notes: new Map() })
  })

  test('a group\'s first command gets its help, a help call already there stops it', () => {
    const plan = planFor([bash('flow audit')], new Set())
    expect(plan.added.map((a) => a.send)).toEqual([{ tool: 'Bash', command: 'flow audit --help', description: 'List the flow audit commands' }])
    expect(planFor([bash('flow audit'), bash('flow audit --help')], new Set()).added).toEqual([])
    expect(planFor([bash('flow audit')], new Set(['bash:flow audit --help'])).added).toEqual([])
  })
})

describe('edit-log', () => {
  test("the edit log's own files take no loaded-file guides, and its guide read brings nothing", () => {
    expect(entryFor(edit('/code/flow/lab/edit-log/skills/work/execute/SKILL.md.log.md'))?.id).toBe('markdown')
    expect(entryFor(read('/h/.flow/references/guides/edit-log.md'))).toBeUndefined()
  })
})

describe('agent', () => {
  const agent: Call = { tool: 'Agent', input: { description: 'x', prompt: 'y' } }

  test('a subagent call is held back until subagents.md is read', () => {
    const plan = planFor([agent], new Set())
    expect(plan.held).toEqual([0])
    expect(sent(plan)).toEqual(['references/guides/subagents.md'])
    expect(plan.added[0]!.header).toBe(`${HEADER} Your Agent call was held back, so it did not run. Read this guide, then make it again.`)
  })

  test('a window holding the guide, or a read of it beside the call, lets it run', () => {
    expect(planFor([agent], new Set(['read:references/guides/subagents.md']))).toEqual({ held: [], added: [], notes: new Map() })
    expect(windowKeys([
      { content: [{ type: 'tool_use', id: 'a', name: 'Read', input: { file_path: '/h/.flow/references/guides/subagents.md' } }] },
      { content: [{ type: 'tool_result', tool_use_id: 'a' }] },
    ])).toEqual(new Set(['read:references/guides/subagents.md']))
  })
})
