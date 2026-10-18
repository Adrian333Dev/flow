/**
 * register.ts: the hooks module of Flow's session mod.
 *
 * The restart: at its wrap-up checkpoint, or when the user types `/restart`,
 * the agent calls the `restart` tool with the start message it wrote. The mod
 * ends that turn, compacts between turns, and answers the compaction itself
 * with that message, so the session and its transcript stay and no model
 * writes a summary.
 *
 * Also: dragged files load as mentions, a handoff note is removed once read,
 * the agent is warned at the wrap-up mark, `#` in the prompt box lists the
 * notes of `flow notes`, and every permission ask opens Claude Code's question
 * dialog (hooks/pane.ts) and is logged (hooks/log.ts).
 *
 * The band above the prompt, one badge for each ticket the session works, is
 * hooks/band.tsx, registered from here.
 */
import type { EngineInterface, Register } from 'claude-code'
import { INSTRUCTIONS_PATH, restartAsk, startInstructions, withInstructions } from './ask'
import { firstMessage } from './first-message'
import { mention, pastedPaths, relativeTo } from './drag'
import { bandMock, bandShell, bandStart, bandToolCall, bandTurnComplete, bandTurnStart, drawBand } from './band'
import { drawMeters, metersMeasure, metersRead, metersStart, metersSwitch } from './meters-row'
import { drawRows, type MakeText } from './draw'
import { guardedSentence, headline, questionFor } from './headline'
import { appendCommand, logLine, logPath, sourceOf, type LogAnswer, type LogFields } from './log'
import { isNote } from './note'
import { parseNote, rows, type Note } from './notes'
import {
  classify,
  cover,
  denyFor,
  drawsInColour,
  foldedText,
  forgetDraw,
  guardedWrite,
  isAutoAllow,
  isCovered,
  isOwnQuestion,
  nobodyReason,
  questionText,
  recallDraw,
  rememberDraw,
  storeVerdict,
  takeVerdict,
  verdictKey,
  type Shown,
} from './pane'
import { kilo, wrapUpLine, wrapUpSettings } from './wrap-up'

const TOOL = /^mcp__flow-session__restart$/
const EDIT = /^(Edit|Write|MultiEdit|NotebookEdit)$/
const REFUSAL = 'Flow compacts only at its own restart. Run /restart.'

type Restart = {
  message: string
  size: number
  started: boolean
}

let pending: Restart | null = null
let mainTurn: string | undefined
let sizeBefore: number | undefined
let lastChecked = 0
// A handoff stands from the moment its skill loads until work changes a file in a later turn.
let handoffFresh = false
let handoffTurn: string | undefined
let mentionedNotes: string[] = []
const noteTurns = new Map<string, string[]>()
// The `#` list runs on every keystroke, so a note file is parsed again only when its change time moves.
const listedNotes = new Map<string, Note>()
// Whether a person is at the prompt (false for `claude -p`). Unknown after a hot reload, which counts as somebody.
let interactive: boolean | undefined

/** Prints the size change once the new conversation has a response: `usage()` has no figure before that. */
async function logSize($: EngineInterface): Promise<void> {
  const after = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (after === undefined || sizeBefore === undefined) return
  // The engine puts `flow-session:` in front of a log line, so no colon of our own.
  $.ui.log(`context ${kilo(sizeBefore)} → ${kilo(after)} after restart`)
  sizeBefore = undefined
}

/** The start message the agent passed, trimmed. */
function readMessage(e: object): string {
  const input = e as { message?: unknown }
  return typeof input.message === 'string' ? input.message.trim() : ''
}

/** A settings file's text, or undefined when it is missing or unreadable. */
const readText = ($: EngineInterface, file: string) => $.fs.read(file).catch(() => undefined)

/** The Flow home: `FLOW_HOME`, else `~/.flow`. */
const flowHome = async ($: EngineInterface) => (await $.env.get('FLOW_HOME')) ?? `${await $.env.get('HOME')}/.flow`

/** The instructions for the start message, read when the ask is built. */
async function startText($: EngineInterface): Promise<string> {
  try {
    return startInstructions(await readText($, `${await flowHome($)}/${INSTRUCTIONS_PATH}`))
  } catch {
    return startInstructions(undefined)
  }
}

/** The wrap-up line for the size now, or undefined. Remembers the size, so each mark speaks once. */
async function wrapUp($: EngineInterface): Promise<string | undefined> {
  const home = await flowHome($)
  const { wrapUp: on, limit } = wrapUpSettings(
    await readText($, `${home}/settings.json`),
    await readText($, `${home}/settings.local.json`),
  )
  const now = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (!on || now === undefined) return undefined
  const before = lastChecked
  lastChecked = now
  const line = wrapUpLine(before, now, limit, handoffFresh)
  if (!line) return undefined
  $.ui.log(`wrap-up line sent at ${kilo(now)}`)
  return withInstructions(line, await startText($))
}

/** A paste of paths that all exist under the session's folder, as mentions. Undefined for any other edit. */
async function mentionsFor($: EngineInterface, pasted: string): Promise<string | undefined> {
  const paths = pastedPaths(pasted)
  if (!paths) return undefined
  const root = await $.session.root()
  const parts: string[] = []
  for (const path of paths) {
    const relative = relativeTo(root, path)
    if (relative === undefined || !(await $.fs.exists(path))) return undefined
    parts.push(mention(relative))
  }
  return `${parts.join(' ')} `
}

/** Every note in `<home>/notes/`, each parsed once per change. */
async function readNotes($: EngineInterface, home: string): Promise<Note[]> {
  const dir = `${home}/notes`
  const entries = await $.fs.list(dir).catch(() => [])
  const found = await Promise.all(
    entries
      .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md') && !entry.name.startsWith('.'))
      .map(async (entry) => {
        const path = `${dir}/${entry.name}`
        const kept = listedNotes.get(path)
        if (kept?.changed === entry.mtimeMs) return kept
        const raw = await readText($, path)
        if (raw === undefined) return undefined
        const note = parseNote(path, entry.mtimeMs, raw)
        listedNotes.set(path, note)
        return note
      }),
  )
  return found.filter((note): note is Note => note !== undefined)
}

/** The project name `flow note` files under: the session folder's name, `global` in the Flow home. */
async function projectName($: EngineInterface, home: string): Promise<string> {
  const root = (await $.session.root()).replace(/\/+$/, '')
  return root === home || `${root}/.flow` === home ? 'global' : root.slice(root.lastIndexOf('/') + 1)
}

/** `$.fs` has no delete, so the notes go through `rm`. */
async function removeNotes($: EngineInterface, paths: readonly string[]): Promise<void> {
  for (const path of paths) await $.process.run(['rm', '--', path]).catch(() => undefined)
}

/**
 * Starts the compaction, then the turn that works from the start message.
 * The message is in the compacted conversation by then, so a crash before the
 * turn loses nothing. Not awaited by its caller, so it owns its errors.
 */
async function runRestart($: EngineInterface, restart: Restart): Promise<void> {
  restart.started = true
  handoffFresh = false
  try {
    await $.command.run({ command: 'compact' })
    sizeBefore = restart.size
    await $.prompt.submit({ text: 'Continue from the start message.', asUser: true })
  } catch (error) {
    $.ui.log(`restart failed, the session is as it was: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    pending = null
  }
}

const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

type Check = { tool: string; input: unknown; agentId?: string }
type Decided = { decision: 'allow' | 'ask' | 'deny'; reason?: string; hook?: string; rule?: string }

/** One line in the permission log. Never throws: a lost line must not change the answer. */
async function logAsk($: EngineInterface, fields: Omit<LogFields, 'at' | 'project' | 'session'>): Promise<void> {
  try {
    const home = await flowHome($)
    const now = new Date()
    const session = await $.session.id().catch(() => '')
    const line = logLine({ ...fields, at: now, project: await projectName($, home), session })
    await $.process.run(appendCommand(line, logPath(home, now)), { timeoutMs: 5000 })
  } catch (error) {
    $.ui.log(`permission log line lost: ${reasonOf(error)}`)
  }
}

/**
 * A permission ask, put to the user in the question dialog. Allow returns an
 * allow. A refusal, Esc or the dialog's fourth row stores a verdict and returns
 * the ask unchanged, so `classic.PermissionRequest` can deny with an interrupt.
 * A typed note stores a verdict without one. A dialog that fails for any other
 * reason returns the ask unchanged with no verdict, so Claude Code asks itself.
 * A command too long to colour is cut to its first lines, the last ending `…`.
 */
async function askUser($: EngineInterface, e: Check, decided: Decided): Promise<Decided> {
  const shown = headline(e.tool, e.input)
  const guarded = guardedWrite(e.tool, e.input, decided)
  const guardReason = decided.hook === 'PreToolUse' ? decided.reason?.trim() : undefined
  const sentence = guarded !== undefined ? guardedSentence(e.tool, guarded) : guardReason || shown.sentence
  const entry = { tool: e.tool, agent: e.agentId, rule: decided.rule, source: sourceOf(decided.hook, decided.rule), headline: sentence, command: shown.text }
  const done = (answer: LogAnswer, ms?: number) => logAsk($, { ...entry, answer, ms })

  if (isAutoAllow(e.tool, e.input, decided, e.agentId) || (guarded !== undefined && isCovered(guarded))) {
    await done('auto-allow')
    return { decision: 'allow' }
  }
  if (interactive === false) {
    await done('nobody')
    return { decision: 'deny', reason: nobodyReason() }
  }

  const fold = foldedText(shown.text)
  const text: Shown = fold === undefined ? questionText(sentence, shown.text) : { question: `${sentence}\n\n${fold}`, sentence, text: fold, cut: false }
  const colour = fold !== undefined || drawsInColour(text)
  if (colour) rememberDraw(text.question, { sentence, text: text.text, colour, asks: questionFor(shown.kind) })
  const started = Date.now()
  let label: string | undefined
  let failure = ''
  try {
    label = await $.ui.ask(text.question, { options: ['Allow', 'Refuse'], header: 'Permission' })
  } catch (error) {
    failure = reasonOf(error)
  } finally {
    if (colour) forgetDraw(text.question)
  }
  const ms = Date.now() - started

  // Esc and the fourth row reject with "no answer (…)". Anything else is the dialog failing.
  if (label === undefined && !/no answer/i.test(failure)) {
    $.ui.log(`permission dialog failed, Claude Code asks instead: ${failure}`)
    return decided
  }
  const answer = label === undefined ? 'refuse' : classify(label)
  const key = verdictKey(e.tool, e.input)
  if (answer === 'allow') {
    takeVerdict(key)
    if (guarded !== undefined) cover(guarded)
    await done('allow', ms)
    return { decision: 'allow' }
  }
  storeVerdict(key, answer === 'note' ? { interrupt: false, note: label ?? '' } : { interrupt: true })
  await done(answer, ms)
  return decided
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    interactive = e.isInteractive
    await bandStart($)
    await metersStart($).catch(() => undefined)
    await $.tool.register({
      name: 'restart',
      description: `Restarts this session in place once the handoff is written: the conversation is replaced by \`message\`, and the work continues from it. Call it last. Nothing you write after the call is read.`,
      isDeferred: false,
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The start message: what to load first, then what the next stretch of work needs.' },
        },
        required: ['message'],
      },
    })
    await $.command
      .register({ name: 'restart', description: 'Restart this session in place, from a start message the agent writes.' })
      .catch(() => undefined)
    await $.command
      .register({ name: 'band', description: 'Switch the test band on or off: /band, /band <number>, next, list, act, off.' })
      .catch(() => undefined)
    return next(e)
  })

  // `/band` shows a test scenario in place of the real band (hooks/band-mock.ts).
  on('command.run', { command: 'band' }, async ($, e) => ({ text: await bandMock($, e.args ?? '') })).catch(() => ({
    text: 'The band command failed, so nothing changed.',
  }))

  // `/restart` asks the agent for the handoff, if none stands, and the start message.
  // A command's hidden `context` starts no turn (probed 2.1.301), so the ask is
  // submitted as a prompt once the command has returned.
  on('command.run', { command: 'restart' }, async ($, e) => {
    const ask = restartAsk(handoffFresh, e.args ?? '', await startText($))
    void $.clock
      .sleep(100)
      .then(() => $.prompt.submit({ text: ask, asUser: true }))
      .catch((error) => $.ui.log(`/restart could not start the agent: ${error instanceof Error ? error.message : String(error)}`))
    return { text: 'Restarting: the agent writes the start message.' }
  }).catch(() => ({ text: 'The restart command failed, so nothing restarted.' }))

  // A handoff stands once its skill loads. A file changed in a later turn ends it.
  on('skill.prompt', { skill: /(^|:)handoff$/ }, async (_$, e, next) => {
    handoffFresh = true
    handoffTurn = mainTurn
    return next(e)
  })

  on('tool.call', { tool: EDIT }, async (_$, e, next) => {
    if (mainTurn !== handoffTurn) handoffFresh = false
    return next(e)
  })

  // A note for another session: the mention records it, the next main turn
  // takes it, and that turn's clean answer removes the file.
  on('prompt.mention', async ($, e, next) => {
    if (e.agentId === undefined && isNote(await $.session.root(), e.path)) mentionedNotes.push(e.path)
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await bandTurnStart($, e)
    if (e.agentId === undefined) {
      mainTurn = e.turnId
      if (mentionedNotes.length) noteTurns.set(e.turnId, mentionedNotes)
      mentionedNotes = []
    }
    return next(e)
  })

  // `#` and a word lists the notes of every project (hooks/notes.ts). The rows
  // join beneath the engine's own, so a failure here shows no rows at all.
  on('prompt.autocomplete', { token: /^#/ }, async ($, e, next) => {
    const home = await flowHome($)
    const found = rows(await readNotes($, home), e.token, await projectName($, home))
    const before = await next(e)
    return { suggestions: [...before.suggestions, ...found] }
  }).catch(() => ({ suggestions: [] }))

  // A dragged file arrives as one paste. Rewritten here, while the text is in
  // the box, it loads as a typed `@` does.
  on('prompt.edit', async ($, e, next) => {
    const mentions = await mentionsFor($, e.inputText).catch(() => undefined)
    return next(mentions ? { ...e, inputText: mentions } : e)
  })

  // The warning rides on the next message the user types, or on a tool result
  // when a long turn has no message in it. A subagent's size is its own.
  on('prompt.submit', async ($, e, next) => {
    const line = await wrapUp($).catch(() => undefined)
    return next(line ? { ...e, context: [...(e.context ?? []), line] } : e)
  })

  on('tool.call', async ($, e, next) => {
    const done = await bandToolCall($, e, () => next(e))
    if (e.agentId !== undefined || TOOL.test(e.tool) || done.result === undefined) return done
    const line = await wrapUp($).catch(() => undefined)
    return line ? { ...done, context: [...(done.context ?? []), line] } : done
  })

  on('session.append', async ($, e, next) => {
    const kept = await next(e)
    await bandShell($, e).catch(() => undefined)
    return kept
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    if (e.agentId !== undefined) return { deny: 'Only the main session restarts.' }
    if (pending) return { deny: 'A restart is already under way.' }
    const message = readMessage(e)
    if (!message) return { deny: 'Pass the start message as `message`.' }
    const usage = await $.session.usage().catch(() => undefined)
    pending = { message, size: usage?.context.tokens ?? 0, started: false }
    if (mainTurn) await $.turn.abort({ turnId: mainTurn }).catch(() => undefined)
    return { result: 'Restarting. Write nothing more.' }
  }).catch(() => ({ deny: 'The restart hook failed, so nothing restarted.' }))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await bandTurnComplete($, e)
    const notes = noteTurns.get(e.turnId)
    if (notes) {
      noteTurns.delete(e.turnId)
      if (e.reason === 'answer') await removeNotes($, notes)
    }
    if (e.agentId === undefined) {
      if (pending && !pending.started) void runRestart($, pending)
      else if (sizeBefore !== undefined) void logSize($).catch(() => undefined)
    }
    return done
  })

  // Every ask the rules and the guard leave open goes to the question dialog.
  // A hook that throws is skipped, and Claude Code's own prompt appears.
  on('tool.check', async ($, e, next) => {
    const decided = await next(e)
    return decided.decision === 'ask' ? askUser($, e, decided) : decided
  }).catch(() => ({ decision: 'ask' as const }))

  // The second half of a refusal: the call is denied, and a refusal also stops the turn.
  on('classic.PermissionRequest', async (_$, e, next) => {
    const verdict = takeVerdict(verdictKey(e.tool_name, e.tool_input))
    return verdict ? { decision: denyFor(verdict) } : next(e)
  }).catch(() => ({}))

  // The mod's own question draws in colour above the dialog, which is
  // reworded to ask `Allow this command?`. The model's own questions pass.
  // Nothing is read and nothing runs in here: the draw comes from module state.
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const questions = e.props.questions as { question?: string }[]
    const draw = isOwnQuestion(e.requestId) ? recallDraw(questions[0]?.question ?? '') : undefined
    if (!draw) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const dialog = await next({ ...e, props: { ...e.props, questions: questions.map((q) => ({ ...q, question: draw.asks })) } })
    return Box({ flexDirection: 'column', children: [...drawRows(draw, Text as unknown as MakeText), dialog] })
  })

  // The band of tickets the session works (hooks/band.tsx).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => drawBand($, e, next))

  // The meters row (hooks/meters-row.tsx): figures from the session, the model, effort and cache from the transcript's end.
  on('session.measure', async ($, e, next) => {
    await metersMeasure($, e).catch(() => undefined)
    return next(e)
  })
  on('classic.SessionStart', async ($, e, next) => {
    await metersRead($, e.transcript_path).catch(() => undefined)
    return next(e)
  })
  on('classic.Stop', async ($, e, next) => {
    await metersRead($, e.transcript_path).catch(() => undefined)
    return next(e)
  })
  on('classic.PostModelSwitch', async ($, e, next) => {
    await metersSwitch($, e.to_model).catch(() => undefined)
    return next(e)
  })
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => drawMeters($, e, next))

  // The restart's compaction becomes one message, the one the agent wrote.
  on('session.compact', async (_$, e, next) => {
    if (e.agentId !== undefined) return next(e)
    if (e.trigger !== 'manual' || !pending?.started) return { skip: REFUSAL }
    return { messages: [{ role: 'user', text: firstMessage(pending.message), toolUses: [] }] }
  }).catch(() => ({ skip: REFUSAL }))
}
