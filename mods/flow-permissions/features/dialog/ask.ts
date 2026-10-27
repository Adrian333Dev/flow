/**
 * ask.ts: a permission ask, put to the user in Claude Code's question dialog and logged.
 *
 * Allow returns an allow. A refusal, Esc or the dialog's fourth row stores a verdict and returns the
 * ask unchanged, so `classic.PermissionRequest` can deny with an interrupt. A typed note stores a
 * verdict without one. A dialog that fails for any other reason returns the ask unchanged with no
 * verdict, so Claude Code asks itself. The question is the sentence alone: the tool's row above the
 * dialog shows the command.
 */
import type { EngineInterface } from 'claude-code'
import { appendCommand, logLine, logPath, sourceOf, type LogAnswer, type LogFields } from '../log/log'
import { guardedSentence, headline } from './headline'
import { classify, cover, guardedWrite, isAutoAllow, isCovered, nobodyReason, storeVerdict, verdictKey, takeVerdict } from './pane'

export type Check = { tool: string; input: unknown; agentId?: string }
export type Decided = { decision: 'allow' | 'ask' | 'deny'; reason?: string; hook?: string; rule?: string }

// Whether a person is at the prompt (false for `claude -p`). Unknown after a hot reload, which counts as somebody.
let interactive: boolean | undefined

export const setInteractive = (value: boolean) => void (interactive = value)

/** The Flow home: `FLOW_HOME`, else `~/.flow`. This mod keeps its own: mods share no code. */
async function flowHome($: EngineInterface): Promise<string> {
  return (await $.env.get('FLOW_HOME')) ?? `${await $.env.get('HOME')}/.flow`
}

const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** The project name the ask log records: the session folder's name, `global` in the Flow home. */
async function projectName($: EngineInterface, home: string): Promise<string> {
  const root = (await $.session.root()).replace(/\/+$/, '')
  return root === home || `${root}/.flow` === home ? 'global' : root.slice(root.lastIndexOf('/') + 1)
}

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

/** The answer to an ask the rules and the guard left open. */
export async function askUser($: EngineInterface, e: Check, decided: Decided): Promise<Decided> {
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
    failure = reasonOf(error)
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
