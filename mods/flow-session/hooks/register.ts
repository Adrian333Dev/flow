/**
 * register.ts: the hooks module of Flow's session mod.
 *
 * The restart: at its wrap-up checkpoint, or when the user types `/restart`,
 * the agent calls the `restart` tool with its note and the files and skills to
 * load. The mod ends that turn, compacts between turns, and answers the
 * compaction itself, so the session and its transcript stay and no model
 * writes a summary. The answer is built by hooks/window.ts: the tickets with
 * the `context.md` sections of their open questions, and the files and skills,
 * loaded as `Read` and `Skill` calls, the note, and the user's messages it did
 * not answer, each whole. The old turns stay in the transcript. A typed
 * `/restart` stops after the compaction. An automatic one submits `CONTINUE`.
 *
 * `/copy-v2` (Alt+C in `~/.claude/keybindings.json`) copies the agent's last message, `/copy-all` (Alt+A)
 * everything since the user's last message, and each turn's end saves that to `.flow/replies/` (hooks/copy.ts).
 *
 * `/keepwarm` (hooks/keepwarm.ts) pings the prompt cache before it expires, for one session at a time, and stops at the first ping that misses.
 *
 * Also: dragged files load as mentions, the agent is warned at the wrap-up
 * mark, `#` in the prompt box lists the notes of `flow notes`, and every
 * permission ask opens Claude Code's question
 * dialog (hooks/pane.ts) and is logged (hooks/log.ts).
 *
 * The band above the prompt, one badge for each ticket the session works and a
 * Restart button between turns past the wrap-up mark (hooks/button.ts), is hooks/band.tsx,
 * registered from here.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, TurnStepChunk } from 'claude-code'
import type { Entry, Restart, Tracked } from '../types'
import { restartAsk } from './ask'
import { restartGuide } from './restart-guide'
import { pressed, pressLost, restartEnded, turnEnded, turnStarted } from './button'
import { copyAll, copyLast, saveReply } from './copy'
import { CONTINUE } from './dialogue'
import { addAsked, afterAnswer } from './first-message'
import { buildWindow, resolveLoads } from './window'
import { mention, pastedPaths, relativeTo } from './drag'
import { bandMock, bandShell, bandStart, bandToolCall, bandTurnComplete, bandTurnStart, drawBand } from './band'
import { closeWarm, keepWarmCommand, cancel as warmCancel, noteActive, noteBroken, noteTranscript, tick as warmTick, type Deps as WarmDeps } from './keepwarm'
import { drawMeters, metersClear, metersMeasure, metersRead, metersRefresh, metersStart, metersSwitch, metersWarmed } from './meters-row'
import { guardedSentence, headline } from './headline'
import { appendCommand, logLine, logPath, sourceOf, type LogAnswer, type LogFields } from './log'
import { parseNote, rows, ticketPrefix, type Note } from './notes'
import {
  classify,
  cover,
  denyFor,
  guardedWrite,
  isAutoAllow,
  isCovered,
  nobodyReason,
  storeVerdict,
  takeVerdict,
  verdictKey,
} from './pane'
import { steer, type Streamed } from './situations'
import { heldBy, linksOf, wikiText, withWiki } from './skill-wiki'
import { AGENT_LINES, kilo, sizeOf, wrapUpLine, wrapUpSettings } from './wrap-up'

const RESTART_TOOL = 'mcp__flow-session__restart'
const TOOL = new RegExp(`^${RESTART_TOOL}$`)
const REFUSAL = 'Flow compacts only at its own restart. Run /restart.'

let sizeBefore: number | undefined
// Why the compaction was skipped, when the window could not be built. The hook sets it, `runRestart` reads it.
let stopped: string | undefined
let lastChecked = 0
// What the restart keeps word for word, the turn it ends and the restart itself. The host holds it: a hot reload empties module variables.
// The validator reads an atom only where it is written, so meters-row.tsx spells this one again for the band's Restart button.
const tracked = atom({ plugin: 'flow-session', key: 'tracked' } as const, { asked: [] } as Tracked)
// The band's badges, spelled again here to read the tickets in flight (hooks/band.tsx writes them).
const band = atom({ plugin: 'flow-session', key: 'band' } as const, [] as Entry[])
// The helper agents that run now (their `turn.start` seen, their `turn.complete` not). A restart waits for them.
const helpers = new Set<string>()
// Each helper agent's context size at its last request, and at the last check that could send a line. A subagent's size is its own.
const agentSizes = new Map<string, number>()
const agentChecked = new Map<string, number>()
// The `#` list runs on every keystroke, so a note file is parsed again only when its change time moves.
const listedNotes = new Map<string, Note>()
// Whether a person is at the prompt (false for `claude -p`). Unknown after a hot reload, which counts as somebody.
let interactive: boolean | undefined
// The header each call steered by hooks/situations.ts gets on its result, by call id, taken once the result is in.
const guideHeaders = new Map<string, string>()
/** The agents whose `Skill` call is running, last on top: `skill.prompt` names no agent, and fires inside the call. */
const skillCallers: (string | undefined)[] = []

/** Prints the size change once the new conversation has a response: `usage()` has no figure before that. */
async function logSize($: EngineInterface): Promise<void> {
  const after = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (after === undefined || sizeBefore === undefined) return
  // The engine puts `flow-session:` in front of a log line, so no colon of our own.
  $.ui.log(`context ${kilo(sizeBefore)} → ${kilo(after)} after restart`)
  sizeBefore = undefined
}

/** The note the agent passed, trimmed. */
function readMessage(e: object): string {
  const input = e as { message?: unknown }
  return typeof input.message === 'string' ? input.message.trim() : ''
}

/** A list of strings the agent passed (`files`, `skills`), or undefined where it is not one. */
function readList(e: object, key: 'files' | 'skills'): string[] | undefined {
  const value = (e as Record<string, unknown>)[key]
  if (value === undefined) return []
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim() !== '') ? value.map((item: string) => item.trim()) : undefined
}

/** A settings file's text, or undefined when it is missing or unreadable. */
const readText = ($: EngineInterface, file: string) => $.fs.read(file).catch(() => undefined)

/** The wiki text of a skill's links, for the window of the agent that called it. */
async function skillWiki($: EngineInterface, links: Parameters<typeof wikiText>[0], agentId: string | undefined): Promise<string> {
  return wikiText(links, await flowHome($), await heldBy($, agentId), (path) => readText($, path))
}

/** The Flow home: `FLOW_HOME`, else `~/.flow`. */
const flowHome = async ($: EngineInterface) => (await $.env.get('FLOW_HOME')) ?? `${await $.env.get('HOME')}/.flow`

/** True while a keep-warm ping must wait: a main turn, a restart or a helper agent runs, or nobody is at the prompt. */
async function warmBusy($: EngineInterface): Promise<boolean> {
  if (interactive === false || helpers.size > 0) return true
  const t = await read($, tracked)
  return t.turn !== undefined || t.restart !== undefined || t.requested !== undefined
}

const warmDeps = ($: EngineInterface): WarmDeps => ({ busy: () => warmBusy($), warmed: (coldAt) => metersWarmed($, coldAt) })

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
  const line = wrapUpLine(before, now, limit)
  if (!line) return undefined
  $.ui.log(`wrap-up line sent at ${kilo(now)}`)
  return `${line}\n\n${await restartGuide($)}`
}

/**
 * The wrap-up line for one subagent at its own size, or undefined. A subagent cannot restart
 * (`$.turn.abort` and `$.session.compact` act on the main conversation alone), so its line tells it
 * to save its state to files and finish. Each mark speaks once per agent.
 */
async function agentWrapUp($: EngineInterface, id: string): Promise<string | undefined> {
  const home = await flowHome($)
  const { wrapUp: on, limit } = wrapUpSettings(
    await readText($, `${home}/settings.json`),
    await readText($, `${home}/settings.local.json`),
  )
  const now = agentSizes.get(id)
  if (!on || now === undefined) return undefined
  const before = agentChecked.get(id) ?? 0
  agentChecked.set(id, now)
  const line = wrapUpLine(before, now, limit, AGENT_LINES)
  if (line) $.ui.log(`wrap-up line sent to a subagent at ${kilo(now)}`)
  return line
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

/** The project name the ask log records: the session folder's name, `global` in the Flow home. */
async function projectName($: EngineInterface, home: string): Promise<string> {
  const root = (await $.session.root()).replace(/\/+$/, '')
  return root === home || `${root}/.flow` === home ? 'global' : root.slice(root.lastIndexOf('/') + 1)
}

/**
 * The word the notes of this session's project carry in `project:`: its ticket
 * prefix, `home` in the Flow home. A folder with no prefix falls back to its
 * name, which matches no note.
 */
async function noteProject($: EngineInterface, home: string): Promise<string> {
  const root = (await $.session.root()).replace(/\/+$/, '')
  if (root === home || `${root}/.flow` === home) return 'home'
  return ticketPrefix(await readText($, `${root}/.flow/settings.json`)) ?? root.slice(root.lastIndexOf('/') + 1)
}

/** True for a message the user typed, not the mod's own prompt, a notification or the /restart command. */
const usersOwn = (e: { origin?: { kind: string }; isMeta?: true; text: string }) =>
  !e.isMeta && (e.origin === undefined || e.origin.kind === 'composer' || e.origin.kind === 'bridge') && !/^\/restart\b/.test(e.text)

/**
 * Asks the agent for its note: what `/restart` does and what a press of the band's Restart button
 * does, one prompt and one model request. A command's hidden `context` starts no turn (probed
 * 2.1.301), so the ask is submitted as a prompt once the caller has returned. A press that is
 * already waiting on the agent asks nothing more. The ask lost, the button comes back.
 */
async function askForRestart($: EngineInterface, args: string): Promise<void> {
  if ((await read($, tracked)).requested) return
  const ask = restartAsk(args, await restartGuide($))
  await update($, tracked, pressed)
  void $.clock
    .sleep(100)
    .then(() => $.prompt.submit({ text: ask, asUser: true }))
    .catch(async (error) => {
      await update($, tracked, pressLost).catch(() => undefined)
      $.ui.log(`/restart could not start the agent: ${error instanceof Error ? error.message : String(error)}`)
    })
}

/**
 * Starts the compaction, then the turn that works from the note.
 * The note is in the compacted conversation by then, so a crash before the
 * turn loses nothing. A typed restart starts no turn: the user writes next.
 * Not awaited by its caller, so it owns its errors.
 */
async function runRestart($: EngineInterface, restart: Restart): Promise<void> {
  await update($, tracked, (t) => ({ ...t, restart: { ...restart, started: true } }))
  await metersClear($).catch(() => undefined)
  // The compacted conversation has no cached prefix: a ping now would pay for all of it.
  await noteBroken($).catch(() => undefined)
  try {
    stopped = undefined
    await $.command.run({ command: 'compact' })
    if (stopped) {
      $.ui.log(stopped)
    } else {
      sizeBefore = restart.size
      if (restart.manual) $.ui.log('restarted. Type your next message.')
      else await $.prompt.submit({ text: CONTINUE, asUser: true })
    }
  } catch (error) {
    $.ui.log(`restart failed, the session is as it was: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    await update($, tracked, restartEnded).catch(() => undefined)
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
 * The question is the sentence alone: the tool's row above the dialog shows the command.
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

  const started = Date.now()
  let label: string | undefined
  let failure = ''
  try {
    label = await $.ui.ask(sentence, { options: ['Allow', 'Refuse'], header: 'Permission' })
  } catch (error) {
    failure = reasonOf(error)  }
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
    // A hot reload loses the timer, so a switch that is on plans again.
    void warmTick($, warmDeps($))
    await $.tool.register({
      name: 'restart',
      description: 'Restart this session, as the restart guide sent with the ask says. Call it last. A subagent never restarts: it saves its state to files and begins its reply with `UNFINISHED:`.',
      isDeferred: false,
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Your note to the new window, in the order the restart guide gives.',
          },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files the next step works on: a path (whole file), `path#heading` (a markdown section), `path:from-to` (lines). A miss loads the whole file. With skills, 80 KB at most.',
          },
          skills: {
            type: 'array',
            items: { type: 'string' },
            description: 'Skills the new window starts with, such as `flow:execute`.',
          },
        },
        required: ['message'],
      },
    })
    await $.command
      .register({ name: 'restart', description: 'Restart this session in place, from a start message the agent writes.' })
      .catch(() => undefined)
    await $.command
      .register({ name: 'copy-v2', description: 'Copy the agent’s last message, as markdown. Alt+C runs it.' })
      .catch(() => undefined)
    await $.command
      .register({ name: 'copy-all', description: 'Copy every message the agent wrote since your last message, with a --- between them and no tool calls. Alt+A runs it.' })
      .catch(() => undefined)
    await $.command
      .register({ name: 'keepwarm', description: 'Keep this session’s prompt cache warm while you are away: /keepwarm on, off, status or ping (one test ping now).' })
      .catch(() => undefined)
    await $.command
      .register({ name: 'band', description: 'Switch the test band on or off: /band, /band <number>, next, list, act, off. /band clear empties the real band.' })
      .catch(() => undefined)
    return next(e)
  })

  // `/band` shows a test scenario in place of the real band (hooks/band-mock.ts).
  on('command.run', { command: 'band' }, async ($, e) => ({ text: await bandMock($, e.args ?? '') })).catch(() => ({
    text: 'The band command failed, so nothing changed.',
  }))

  // `/copy-v2` puts the agent's last message on the clipboard, `/copy-all` everything since the user's last message (hooks/copy.ts).
  on('command.run', { command: 'copy-v2' }, async ($) => ({ text: await copyLast($) })).catch(() => ({
    text: 'The copy command failed, so nothing was copied.',
  }))
  on('command.run', { command: 'copy-all' }, async ($) => ({ text: await copyAll($) })).catch(() => ({
    text: 'The copy command failed, so nothing was copied.',
  }))

  // `/keepwarm` switches the cache ping on or off for this session (hooks/keepwarm.ts).
  on('command.run', { command: 'keepwarm' }, async ($, e) => ({ text: await keepWarmCommand($, warmDeps($), e.args ?? '') })).catch(() => ({
    text: 'The keepwarm command failed, so nothing changed.',
  }))

  // `/restart` asks the agent for its note.
  on('command.run', { command: 'restart' }, async ($, e) => {
    await askForRestart($, e.args ?? '')
    return { text: 'Restarting: the agent writes its note.' }
  }).catch(() => ({ text: 'The restart command failed, so nothing restarted.' }))

  on('turn.start', async ($, e, next) => {
    await bandTurnStart($, e)
    if (e.agentId !== undefined) helpers.add(e.agentId)
    if (e.agentId === undefined) {
      // The user is back: no ping until this turn ends.
      warmCancel()
      await noteActive($).catch(() => undefined)
      await update($, tracked, (t) => turnStarted(t, e.turnId))
    }
    return next(e)
  })

  // `#` and a word lists the notes of every project (hooks/notes.ts). The rows
  // join beneath the engine's own, so a failure here shows no rows at all.
  on('prompt.autocomplete', { token: /^#/ }, async ($, e, next) => {
    const home = await flowHome($)
    const found = rows(await readNotes($, home), e.token, await noteProject($, home))
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
  // when a long turn has no message in it. A subagent's size is its own: it is
  // measured at each request (`turn.step`) and its line is sent to it as a message.
  on('prompt.submit', async ($, e, next) => {
    if (usersOwn(e)) await update($, tracked, (t) => ({ ...t, asked: addAsked(t.asked, e.text) }))
    const line = await wrapUp($).catch(() => undefined)
    return next(line ? { ...e, context: [...(e.context ?? []), line] } : e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId === undefined) void metersRefresh($).catch(() => undefined)
    const steered = await bandToolCall($, e, () => next(e))
    const header = guideHeaders.get(e.tool_use_id)
    guideHeaders.delete(e.tool_use_id)
    const done = header && steered.result !== undefined ? { ...steered, context: [header, ...(steered.context ?? [])] } : steered
    if (TOOL.test(e.tool) || done.result === undefined) return done
    if (e.agentId !== undefined) {
      // A subagent ignores a line inside a tool result as injected text (probed, Haiku): it goes as a message to the agent.
      const line = await agentWrapUp($, e.agentId).catch(() => undefined)
      if (line) await $.session.send({ to: { agentId: e.agentId }, text: line }).catch((error) => $.ui.log(`the wrap-up line to a subagent was not sent: ${reasonOf(error)}`))
      return done
    }
    const line = await wrapUp($).catch(() => undefined)
    return line ? { ...done, context: [...(done.context ?? []), line] } : done
  })

  // A skill's wiki folder rides after its text (hooks/skill-wiki.ts), tested against the window of
  // the agent that called it. A typed skill has no `Skill` call: the main window.
  on('tool.call', { tool: 'Skill' }, async (_$, e, next) => {
    skillCallers.push(e.agentId)
    try {
      return await next(e)
    } finally {
      skillCallers.splice(skillCallers.lastIndexOf(e.agentId), 1)
    }
  })

  on('skill.prompt', async ($, e, next) => {
    const out = await next(e)
    const links = linksOf(e.frontmatter)
    if (!links.length) return out
    const added = await skillWiki($, links, skillCallers.at(-1)).catch((error) => void $.ui.log(`wiki folder not sent: ${reasonOf(error)}`))
    return added ? { ...out, text: withWiki(out.text, added) } : out
  })

  // A closed session stops warming, and a session opened again starts with the switch off.
  on('session.end', async ($, e, next) => {
    await closeWarm($).catch(() => warmCancel())
    return next(e)
  })

  on('session.append', async ($, e, next) => {
    const kept = await next(e)
    await bandShell($, e).catch(() => undefined)
    return kept
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    if (e.agentId !== undefined) return { deny: 'A subagent does not restart. Write what you learned to your report files and begin your reply with `UNFINISHED:` and their paths.' }
    const { turn, restart } = await read($, tracked)
    if (restart) return { deny: 'A restart is already under way.' }
    if (helpers.size) return { deny: `${helpers.size === 1 ? 'A helper agent is' : `${helpers.size} helper agents are`} still running. Wait for ${helpers.size === 1 ? 'its' : 'their'} finished notice, then call restart again.` }
    const message = readMessage(e)
    if (!message) return { deny: 'Pass your note as `message`.' }
    const files = readList(e, 'files')
    const skills = readList(e, 'skills')
    if (!files || !skills) return { deny: '`files` and `skills` are lists of non-empty strings.' }
    // Read now, so a missing file or a load over the cap goes back to the agent while it can still fix it.
    const loads = await resolveLoads($, files, skills)
    if ('error' in loads) return { deny: `Nothing restarted: ${loads.error}.` }
    const usage = await $.session.usage().catch(() => undefined)
    const size = usage?.context.tokens ?? 0
    await update($, tracked, (t) => ({ ...t, restart: { message, files, skills, size, started: false, manual: t.typed === true }, typed: false }))
    const ended = turn ? await $.turn.abort({ turnId: turn }).then(() => true, () => false) : false
    if (!ended) $.ui.log('restart: the turn could not be ended, so its closing reply is left out of the new conversation')
    return { result: 'Restarting. Write nothing more.' }
  }).catch(() => ({ deny: 'The restart hook failed, so nothing restarted.' }))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await bandTurnComplete($, e)
    if (e.agentId !== undefined) {
      helpers.delete(e.agentId)
      agentSizes.delete(e.agentId)
      agentChecked.delete(e.agentId)
    }
    if (e.agentId === undefined) {
      void saveReply($).catch((error) => $.ui.log(`the reply was not saved: ${reasonOf(error)}`))
      if (e.reason === 'answer') await update($, tracked, (t) => afterAnswer(t, e.answer, t.restart !== undefined))
      await update($, tracked, (t) => turnEnded(t, e.turnId))
      await noteActive($).catch(() => undefined)
      void warmTick($, warmDeps($))
      const { restart } = await read($, tracked)
      if (restart && !restart.started) void runRestart($, restart)
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

  // The band of tickets the session works (hooks/band.tsx).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) =>
    drawBand($, e, next, () => void askForRestart($, '').catch((error) => $.ui.log(`the Restart button failed: ${reasonOf(error)}`))),
  )

  // The meters row (hooks/meters-row.tsx): figures from the session, the model, effort and cache from the transcript's end.
  // During a restart the figure is the old conversation's, so the context stays hidden.
  on('session.measure', async ($, e, next) => {
    const { restart } = await read($, tracked)
    await metersMeasure($, restart ? { ...e, context: { ...e.context, tokens: undefined } } : e).catch(() => undefined)
    return next(e)
  })
  // Every request of the main loop refreshes the context, so a long turn shows its size as it grows.
  // The guides sent by situation (hooks/situations.ts) steer the response: from its first tool call on,
  // the chunks wait for the stop, so a write held back never leaves the chain, and the added calls go last.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) void metersRefresh($).catch(() => undefined)
    const waiting: TurnStepChunk[] = []
    const streamed = new Map<number, Streamed>()
    let last = -1
    for await (const c of next(e)) {
      if ('index' in c && typeof c.index === 'number') last = Math.max(last, c.index)
      if (c.kind === 'tool') streamed.set(c.index, { index: c.index, id: c.id, name: c.name, json: '' })
      if (c.kind === 'input') {
        const call = streamed.get(c.index)
        if (call) call.json += c.json
      }
      if (c.kind !== 'stop') {
        if (streamed.size) waiting.push(c)
        else yield c
        continue
      }
      if (e.agentId !== undefined && c.usage) agentSizes.set(e.agentId, sizeOf(c.usage))
      const steering = streamed.size ? await steer($, e.agentId, [...streamed.values()]).catch((error) => void $.ui.log(`guides not sent: ${reasonOf(error)}`)) : undefined
      // A held block's own chunks are dropped. The engine's opaque ones carry no block, and pass.
      for (const w of waiting) if (w.kind === 'engine' || w.kind === 'stop' || !steering?.drop.has(w.index)) yield w
      for (const [id, header] of steering?.headers ?? []) guideHeaders.set(id, header)
      for (const [i, call] of (steering?.add ?? []).entries()) {
        last += 1
        yield { kind: 'tool', index: last, id: steering!.addedIds[i]!, name: call.name }
        yield { kind: 'input', index: last, json: JSON.stringify(call.input) }
      }
      if (steering?.drop.size) $.ui.log(`held back ${steering.drop.size} calls until the guides are read`)
      waiting.length = 0
      yield c
    }
    // A response cut off before its stop passes on what it held, unsteered.
    yield* waiting
  })
  on('classic.SessionStart', async ($, e, next) => {
    await metersRead($, e.transcript_path).catch(() => undefined)
    await noteTranscript($, e.transcript_path).catch(() => undefined)
    return next(e)
  })
  on('classic.Stop', async ($, e, next) => {
    await metersRead($, e.transcript_path).catch(() => undefined)
    await noteTranscript($, e.transcript_path).catch(() => undefined)
    return next(e)
  })
  on('classic.PostModelSwitch', async ($, e, next) => {
    await metersSwitch($, e.to_model).catch(() => undefined)
    await noteBroken($).catch(() => undefined)
    return next(e)
  })
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => drawMeters($, e, next))

  // The restart's compaction becomes the window of hooks/window.ts. A dialogue file that cannot be written skips it.
  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const { asked, restart } = await read($, tracked)
    if (e.trigger !== 'manual' || !restart?.started) return { skip: REFUSAL }
    let built: Awaited<ReturnType<typeof buildWindow>>
    try {
      built = await buildWindow($, { restart, asked, entries: await read($, band), home: await flowHome($) })
    } catch (error) {
      stopped = `Restart stopped, the session is as it was: ${reasonOf(error)}.`
      return { skip: stopped }
    }
    $.ui.log(built.log)
    return { messages: built.messages }
  }).catch(() => ({ skip: REFUSAL }))
}
