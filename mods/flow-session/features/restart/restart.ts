/**
 * restart.ts: the restart, from the ask to the compacted window.
 *
 * At its wrap-up checkpoint, or when the user types `/restart` or presses the band's Restart
 * button, the agent calls the `restart` tool with its note and the files and skills to load. The
 * mod ends that turn, compacts between turns, and answers the compaction itself (window.ts), so the
 * session and its transcript stay and no model writes a summary. A typed restart stops after the
 * compaction. An automatic one submits `CONTINUE`. `/fresh` (fresh.ts) runs the same compaction
 * with no note, answered by window.ts `buildFresh`.
 */
import type { EngineInterface, SessionCompactInput, SessionCompactResult, ToolCallInput, ToolCallResult, TurnCompleteInput } from 'claude-code'
import type { Restart } from '../../shared/types'
import { CONTINUE } from '../../shared/dialogue'
import { kilo, reasonOf } from '../../shared/format'
import { flowHome } from '../../shared/home'
import { helpersRunning, readBand, readTracked, updateTracked } from '../../shared/state'
import { metersClear } from '../meters/meters-row'
import { noteBroken } from '../keepwarm/keepwarm'
import { restartAsk } from './ask'
import { pressed, pressLost, restartEnded, turnEnded, turnStarted } from './button'
import { addAsked, afterAnswer } from './first-message'
import { restartGuide } from './restart-guide'
import { buildFresh, buildWindow, resolveLoads } from './window'

export const RESTART_CALL = /^mcp__flow-session__restart$/
const REFUSAL = 'Flow compacts only at its own restart. Run /restart.'

// The context size before the compaction, logged against the new one once a response gives it.
let sizeBefore: number | undefined
// Why the compaction was skipped, when the window could not be built. `restartCompact` sets it, `runRestart` reads it.
let stopped: string | undefined

export async function registerRestart($: EngineInterface): Promise<void> {
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
          description: 'Files the next step works on: a path (whole file), `path#heading` (a markdown section), `path:from-to` (lines). A miss loads the whole file. With skills, 40k tokens at most.',
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
}

/**
 * Asks the agent for its note: what `/restart` does and what a press of the band's Restart button
 * does, one prompt and one model request. A command's hidden `context` starts no turn (probed
 * 2.1.301), so the ask is submitted as a prompt once the caller has returned. A press that is
 * already waiting on the agent asks nothing more. The ask lost, the button comes back.
 */
export async function askForRestart($: EngineInterface, args: string): Promise<void> {
  if ((await readTracked($)).requested) return
  const ask = restartAsk(args, await restartGuide($))
  await updateTracked($, pressed)
  void $.clock
    .sleep(100)
    .then(() => $.prompt.submit({ text: ask, asUser: true }))
    .catch(async (error) => {
      await updateTracked($, pressLost).catch(() => undefined)
      $.ui.log(`/restart could not start the agent: ${reasonOf(error)}`)
    })
}

export async function restartCommand($: EngineInterface, args: string): Promise<string> {
  await askForRestart($, args)
  return 'Restarting: the agent writes its note.'
}

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

/** The `restart` tool call: checks the note and the loads, records the restart, and ends the turn. */
export async function restartCall($: EngineInterface, e: ToolCallInput): Promise<ToolCallResult> {
  if (e.agentId !== undefined) return { deny: 'A subagent does not restart. Write what you learned to your report files and begin your reply with `UNFINISHED:` and their paths.' }
  const { turn, restart } = await readTracked($)
  if (restart) return { deny: 'A restart is already under way.' }
  const helpers = helpersRunning()
  if (helpers) return { deny: `${helpers === 1 ? 'A helper agent is' : `${helpers} helper agents are`} still running. Wait for ${helpers === 1 ? 'its' : 'their'} finished notice, then call restart again.` }
  const message = readMessage(e)
  if (!message) return { deny: 'Pass your note as `message`.' }
  const files = readList(e, 'files')
  const skills = readList(e, 'skills')
  if (!files || !skills) return { deny: '`files` and `skills` are lists of non-empty strings.' }
  // Read now, so a missing file or a load over the cap goes back to the agent while it can still fix it.
  const loads = await resolveLoads($, files, skills)
  if ('error' in loads) return { deny: `Nothing restarted: ${loads.error}.` }
  const size = (await $.session.usage().catch(() => undefined))?.context.tokens ?? 0
  await updateTracked($, (t) => ({ ...t, restart: { message, files, skills, size, started: false, manual: t.typed === true }, typed: false }))
  const ended = turn ? await $.turn.abort({ turnId: turn }).then(() => true, () => false) : false
  if (!ended) $.ui.log('restart: the turn could not be ended, so its closing reply is left out of the new conversation')
  return { result: 'Restarting. Write nothing more.' }
}

/** The restart's compaction becomes the window of window.ts. Any other compaction is refused. */
export async function restartCompact($: EngineInterface, e: SessionCompactInput): Promise<SessionCompactResult> {
  const { asked, restart } = await readTracked($)
  if (e.trigger !== 'manual' || !restart?.started) return { skip: REFUSAL }
  let built: Awaited<ReturnType<typeof buildWindow>>
  try {
    const input = { asked, entries: await readBand($), home: await flowHome($) }
    built = restart.fresh ? await buildFresh($, input) : await buildWindow($, { ...input, restart })
  } catch (error) {
    stopped = `Restart stopped, the session is as it was: ${reasonOf(error)}.`
    return { skip: stopped }
  }
  $.ui.log(built.log)
  return { messages: built.messages }
}

export const compactRefused = (): SessionCompactResult => ({ skip: REFUSAL })

/** True for a message the user typed, not the mod's own prompt, a notification or the /restart and /fresh commands. */
const usersOwn = (e: { origin?: { kind: string }; isMeta?: true; text: string }) =>
  !e.isMeta && (e.origin === undefined || e.origin.kind === 'composer' || e.origin.kind === 'bridge') && !/^\/(restart|fresh)\b/.test(e.text)

/** A submitted prompt: the user's own message is kept for the next window until a reply answers it. */
export async function noteAsked($: EngineInterface, e: { origin?: { kind: string }; isMeta?: true; text: string }): Promise<void> {
  if (usersOwn(e)) await updateTracked($, (t) => ({ ...t, asked: addAsked(t.asked, e.text) }))
}

/** A main turn began: the turn the restart tool ends. */
export async function restartTurnStarted($: EngineInterface, turnId: string): Promise<void> {
  await updateTracked($, (t) => turnStarted(t, turnId))
}

/** A main turn ended: an answer clears the user's messages, and the press it answered ends with it. */
export async function restartTurnEnded($: EngineInterface, e: TurnCompleteInput): Promise<void> {
  if (e.reason === 'answer') await updateTracked($, (t) => afterAnswer(t, e.answer, t.restart !== undefined))
  await updateTracked($, (t) => turnEnded(t, e.turnId))
}

/** Prints the size change once the new conversation has a response: `usage()` has no figure before that. */
async function logSize($: EngineInterface): Promise<void> {
  const after = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (after === undefined || sizeBefore === undefined) return
  // The engine puts `flow-session:` in front of a log line, so no colon of our own.
  $.ui.log(`context ${kilo(sizeBefore)} → ${kilo(after)} after restart`)
  sizeBefore = undefined
}

/**
 * Starts the compaction, then the turn that works from the note.
 * The note is in the compacted conversation by then, so a crash before the
 * turn loses nothing. A typed restart starts no turn: the user writes next.
 * Not awaited by its caller, so it owns its errors. `/fresh` runs it too (fresh.ts).
 */
export async function runRestart($: EngineInterface, restart: Restart): Promise<void> {
  await updateTracked($, (t) => ({ ...t, restart: { ...restart, started: true } }))
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
    $.ui.log(`restart failed, the session is as it was: ${reasonOf(error)}`)
  } finally {
    await updateTracked($, restartEnded).catch(() => undefined)
  }
}

/** A main turn ended: a restart the tool recorded starts now, or the last one logs its size change. */
export async function startPendingRestart($: EngineInterface): Promise<void> {
  const { restart } = await readTracked($)
  if (restart && !restart.started) void runRestart($, restart)
  else if (sizeBefore !== undefined) void logSize($).catch(() => undefined)
}
