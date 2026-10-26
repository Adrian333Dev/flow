import { describe, expect, mock, test } from 'claude-code/testing'

// The test kit's `$` has no exported type, so the helpers take it loosely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Kit = any

const PUSH = { command: 'git push origin main' }
const SENTENCE = 'Push to origin/main'
const GUARD_ASK = { decision: 'ask', reason: SENTENCE, hook: 'PreToolUse' }

/**
 * Opens a dialog the way the mod does and holds it open, so the test can draw
 * it. `finish()` answers Allow. `rendered` lists the questions the engine's own
 * node was asked to draw.
 */
function openDialog(on: Parameters<typeof mock.env>[0], $: Kit, input: unknown, tool = 'Bash', ask: object = GUARD_ASK) {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  let opened!: () => void
  const asked = new Promise<void>((resolve) => (opened = resolve))
  const rendered: string[] = []
  const questions: string[] = []
  mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
  on('tool.check', () => ask as never)
  on('tool.call', async (_$, e) => {
    const call = e as unknown as { tool: string; questions?: { question: string }[] }
    if (call.tool !== 'AskUserQuestion' || !call.questions) return { result: 'ok' }
    const question = call.questions[0]!.question
    questions.push(question)
    opened()
    await gate
    return { result: { answers: { [question]: 'Allow' } } }
  })
  on('session.id', () => ({ value: 'sess' }))
  on('session.root', () => ({ value: '/work/flow-dev' }))
  on('ui.log', () => ({ value: undefined }) as never)
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('ui.render', (_$, e) => {
    const props = (e as unknown as { props: { questions: { question: string }[] } }).props
    rendered.push(props.questions[0]!.question)
    return { type: 'engine', ref: rendered.length }
  })
  const pending = $.tool.check({ tool, input })
  return {
    asked,
    questions,
    rendered,
    finish: async () => {
      release()
      await pending
    },
  }
}

const mount = ($: Kit, question: string, requestId: string) =>
  $.ui.mount({
    plugin: 'flow-session',
    component: 'AskUserQuestion',
    requestId,
    viewport: { columns: 80, rows: 24 },
    props: {
      tool: 'AskUserQuestion',
      questions: [{ question, header: 'Permission', multiSelect: false, options: [{ label: 'Allow', description: '' }, { label: 'Refuse', description: '' }] }],
    },
    surface: 'terminal',
  } as never)

describe('the draw above the dialog', () => {
  test('draws the sentence by part, a rule, and the command by part, over the reworded dialog', async ($, on) => {
    const dialog = openDialog(on, $, PUSH)
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_01')
    expect(await ui.find({ type: 'Text', text: SENTENCE })).toMatchObject({
      children: [{ props: { bold: true, color: 'yellow' }, children: ['Push to '] }, { props: { color: 'blue' }, children: ['origin/main'] }],
    })
    expect(await ui.find({ type: 'Text', text: /^━+$/ })).toMatchObject({ props: { dimColor: true } })
    expect(await ui.find({ type: 'Text', text: 'git push origin main' })).toMatchObject({
      children: [{ props: { bold: true }, children: ['git'] }, ' push origin main'],
    })
    expect(await ui.find({ type: 'engine' })).toBeDefined()
    expect(dialog.rendered).toEqual(['Allow this command?'])
    await ui.unmount()
    await dialog.finish()
  })

  test('a script adds green strings, dim comments and magenta control words', async ($, on) => {
    const dialog = openDialog(on, $, { command: 'for f in a b; do\n  echo "$f" # show\ndone' })
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_02')
    expect(await ui.find({ type: 'Text', text: 'for f in a b; do' })).toMatchObject({
      children: [
        { props: { color: 'magenta' }, children: ['for'] },
        ' f ',
        { props: { color: 'magenta' }, children: ['in'] },
        ' a b',
        { props: { color: 'magenta' }, children: [';'] },
        ' ',
        { props: { color: 'magenta' }, children: ['do'] },
      ],
    })
    expect(await ui.find({ type: 'Text', text: '  echo "$f" # show' })).toMatchObject({
      children: ['  ', { props: { bold: true }, children: ['echo'] }, ' ', { props: { color: 'green' }, children: ['"$f"'] }, ' ', { props: { dimColor: true }, children: ['# show'] }],
    })
    expect(await ui.find({ type: 'Text', text: 'done' })).toMatchObject({ children: [{ props: { color: 'magenta' }, children: ['done'] }] })
    await ui.unmount()
    await dialog.finish()
  })

  test('a here-doc message draws green and its EOF magenta', async ($, on) => {
    const dialog = openDialog(on, $, { command: "git commit -F - <<'EOF'\nfix the parser\nEOF" })
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_06')
    expect(await ui.find({ type: 'Text', text: 'fix the parser' })).toMatchObject({ children: [{ props: { color: 'green' }, children: ['fix the parser'] }] })
    expect(await ui.find({ type: 'Text', text: /^EOF$/ })).toMatchObject({ children: [{ props: { color: 'magenta' }, children: ['EOF'] }] })
    await ui.unmount()
    await dialog.finish()
  })

  test('a piece of 40 characters or more is cut into texts under 40, with the line unchanged', async ($, on) => {
    const long = 'echo alpha beta gamma delta epsilon zeta eta theta iota kappa lambda'
    const dialog = openDialog(on, $, { command: `${long}\n${long}` })
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_07')
    const line = (await ui.find({ type: 'Text', text: long })) as { children: { children: string[] }[] }
    expect(line.children.length).toBeGreaterThan(1)
    for (const piece of line.children) expect(piece.children.join('').length).toBeLessThan(40)
    await ui.unmount()
    await dialog.finish()
  })

  test('a delete draws its action red, its path blue and its reason dim', async ($, on) => {
    const ask = { decision: 'ask', reason: 'Delete ~/old · outside project', hook: 'PreToolUse' }
    const dialog = openDialog(on, $, { command: 'rm -rf ~/old' }, 'Bash', ask)
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_12')
    expect(await ui.find({ type: 'Text', text: 'Delete ~/old · outside project' })).toMatchObject({
      children: [
        { props: { bold: true, color: 'red' }, children: ['Delete '] },
        { props: { color: 'blue' }, children: ['~/old'] },
        { props: { dimColor: true }, children: [' · outside project'] },
      ],
    })
    expect(await ui.find({ type: 'Text', text: 'rm -rf ~/old' })).toMatchObject({
      children: [{ props: { bold: true }, children: ['rm'] }, ' ', { props: { color: 'cyan' }, children: ['-rf'] }, ' ', { props: { color: 'blue' }, children: ['~/old'] }],
    })
    await ui.unmount()
    await dialog.finish()
  })

  test('blank lines stay while the command fits in 10 rows', async ($, on) => {
    const dialog = openDialog(on, $, { command: 'ls\n\nls -a' })
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_08')
    expect(await ui.find({ type: 'Text', text: /^ $/ })).toBeDefined()
    await ui.unmount()
    await dialog.finish()
  })

  test('a commit of 12 lines with 2 blank ones draws, without the blank rows', async ($, on) => {
    const command = ["git add . && git commit -q -F - <<'EOF'", 'subject', '', ...Array(5).fill('a line of the message'), '', 'Co-Authored-By: x', 'EOF', 'git status'].join('\n')
    expect(command.split('\n')).toHaveLength(12)
    const dialog = openDialog(on, $, { command })
    await dialog.asked
    expect(dialog.questions[0]).toContain(command)
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_09')
    expect(await ui.find({ type: 'Text', text: SENTENCE })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ $/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /^git status$/ })).toBeDefined()
    await ui.unmount()
    await dialog.finish()
  })

  test('a write asks about a write', async ($, on) => {
    const dialog = openDialog(on, $, { file_path: '/p/src/a.ts', old_string: 'a', new_string: 'b' }, 'Edit')
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_05')
    expect(dialog.rendered).toEqual(['Allow this write?'])
    await ui.unmount()
    await dialog.finish()
  })

  test('leaves the model’s own question alone', async ($, on) => {
    const dialog = openDialog(on, $, PUSH)
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_01abc')
    expect(await ui.find({ type: 'Text', text: SENTENCE })).toBeUndefined()
    expect(await ui.find({ type: 'engine' })).toBeDefined()
    expect(dialog.rendered).toEqual([dialog.questions[0]!])
    await ui.unmount()
    await dialog.finish()
  })

  test('folds a command of 11 lines: draws the first 10 in colour, the last ending …', async ($, on) => {
    const dialog = openDialog(on, $, { command: Array(11).fill('ls').join('\n') })
    await dialog.asked
    expect(dialog.questions[0]).toBe(`${SENTENCE}\n\n${[...Array(9).fill('ls'), 'ls…'].join('\n')}`)
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_03')
    expect(await ui.find({ type: 'Text', text: SENTENCE })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'ls…' })).toMatchObject({ children: [{ props: { bold: true }, children: ['ls…'] }] })
    expect(dialog.rendered).toEqual(['Allow this command?'])
    await ui.unmount()
    await dialog.finish()
  })

  test('draws a folded commit message in green, with no row for a notice', async ($, on) => {
    const message = Array.from({ length: 30 }, (_, i) => `message line ${i}`)
    const dialog = openDialog(on, $, { command: ["git commit -F - <<'EOF'", ...message, 'EOF'].join('\n') })
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_10')
    expect(await ui.find({ type: 'Text', text: 'message line 7' })).toMatchObject({ children: [{ props: { color: 'green' }, children: ['message line 7'] }] })
    expect(await ui.find({ type: 'Text', text: 'message line 8…' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'message line 9' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /not shown/ })).toBeUndefined()
    await ui.unmount()
    await dialog.finish()
  })

  test('leaves a cut line to the engine as plain text', async ($, on) => {
    const dialog = openDialog(on, $, { command: `echo ${'a'.repeat(3000)}` })
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_11')
    expect(await ui.find({ type: 'Text', text: SENTENCE })).toBeUndefined()
    expect(await ui.find({ type: 'engine' })).toBeDefined()
    await ui.unmount()
    await dialog.finish()
  })

  test('forgets the draw once the dialog is answered', async ($, on) => {
    const dialog = openDialog(on, $, PUSH)
    await dialog.asked
    await dialog.finish()
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_04')
    expect(await ui.find({ type: 'Text', text: SENTENCE })).toBeUndefined()
    expect(await ui.find({ type: 'engine' })).toBeDefined()
    await ui.unmount()
  })
})
