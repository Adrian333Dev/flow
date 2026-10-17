import { describe, expect, mock, test } from 'claude-code/testing'

// The test kit's `$` has no exported type, so the helpers take it loosely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Kit = any

const PUSH = { command: 'git push origin main' }
const SENTENCE = 'Pushes 3 commits to origin/main.'
const GUARD_ASK = { decision: 'ask', reason: SENTENCE, hook: 'PreToolUse' }

/**
 * Opens a dialog the way the mod does and holds it open, so the test can draw
 * it. `finish()` answers Allow. `rendered` lists the questions the engine's own
 * node was asked to draw.
 */
function openDialog(on: Parameters<typeof mock.env>[0], $: Kit, input: unknown, tool = 'Bash') {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  let opened!: () => void
  const asked = new Promise<void>((resolve) => (opened = resolve))
  const rendered: string[] = []
  const questions: string[] = []
  mock.env(on, { FLOW_HOME: '/h/.flow', HOME: '/h' })
  on('tool.check', () => GUARD_ASK as never)
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
  test('draws the sentence and a one-line command in colour, over the reworded dialog', async ($, on) => {
    const dialog = openDialog(on, $, PUSH)
    await dialog.asked
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_01')
    expect(await ui.find({ type: 'Text', text: SENTENCE })).toMatchObject({ props: { bold: true, color: 'yellow' }, children: [SENTENCE] })
    expect(await ui.find({ type: 'Text', text: 'git push origin main' })).toMatchObject({ props: { color: 'cyan' } })
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
      props: { color: 'cyan' },
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
      props: { color: 'cyan' },
      children: ['  echo ', { props: { color: 'green' }, children: ['"$f"'] }, ' ', { props: { dimColor: true }, children: ['# show'] }],
    })
    expect(await ui.find({ type: 'Text', text: 'done' })).toMatchObject({ children: [{ props: { color: 'magenta' }, children: ['done'] }] })
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

  test('leaves a command of 12 lines to the engine as plain text', async ($, on) => {
    const dialog = openDialog(on, $, { command: Array(12).fill('ls').join('\n') })
    await dialog.asked
    expect(dialog.questions[0]).toBe(`${SENTENCE}\n\n${Array(12).fill('ls').join('\n')}`)
    const ui = await mount($, dialog.questions[0]!, 'toolu_plugin_03')
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
