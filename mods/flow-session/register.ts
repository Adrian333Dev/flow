/**
 * register.ts: every hook of Flow's session mod, one per event and matcher, each calling its features
 * in order. A mod may register an event once without a matcher, so the features share these hooks.
 * Each feature's code and its own state live in `features/<name>/`, the state 2 or more share in `shared/`.
 */
import type { Register } from 'claude-code'
import { reasonOf } from './shared/format'
import { helperEnded, helperStarted, setInteractive } from './shared/state'
import { bandMock, bandShell, bandStart, bandToolCall, bandTurnComplete, bandTurnStart, drawBand } from './features/band/band'
import { copyAll, copyLast, registerCopy, saveReply } from './features/copy/copy'
import { mentionsFor } from './features/drag/drag'
import { inSkillCall, withSkillWiki } from './features/guides/skill-wiki'
import { steerStep, withGuideHeader } from './features/guides/steer-step'
import { cancel as warmCancel, closeWarm, keepWarm, noteBroken, registerKeepWarm, replan, warmTranscript, warmTurnEnded, warmTurnStarted } from './features/keepwarm/keepwarm'
import { drawMeters, metersMeasure, metersRead, metersRefresh, metersStart, metersStep, metersSwitch } from './features/meters/meters-row'
import { listRows } from './features/notes/notes'
import { withFileContext } from './features/ticket-context/ticket-context'
import { countVisit } from './features/usage/visits'
import {
  RESTART_CALL,
  askForRestart,
  compactRefused,
  noteAsked,
  registerRestart,
  restartCall,
  restartCommand,
  restartCompact,
  restartTurnEnded,
  restartTurnStarted,
  startPendingRestart,
} from './features/restart/restart'
import { forgetAgent, measureAgent, wrapUp, wrapUpResult } from './features/wrap-up/wrap-up'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    setInteractive(e.isInteractive)
    await bandStart($)
    await metersStart($).catch(() => undefined)
    // A hot reload loses the timer, so a switch that is on plans again.
    void replan($)
    await registerRestart($)
    await registerCopy($)
    await registerKeepWarm($)
    return next(e)
  })

  on('command.run', { command: 'band' }, async ($, e) => ({ text: await bandMock($, e.args ?? '') })).catch(() => ({
    text: 'The band command failed, so nothing changed.',
  }))
  on('command.run', { command: 'copy-v2' }, async ($) => ({ text: await copyLast($) })).catch(() => ({
    text: 'The copy command failed, so nothing was copied.',
  }))
  on('command.run', { command: 'copy-all' }, async ($) => ({ text: await copyAll($) })).catch(() => ({
    text: 'The copy command failed, so nothing was copied.',
  }))
  on('command.run', { command: 'keepwarm' }, async ($, e) => ({ text: await keepWarm($, e.args ?? '') })).catch(() => ({
    text: 'The keepwarm command failed, so nothing changed.',
  }))
  on('command.run', { command: 'restart' }, async ($, e) => ({ text: await restartCommand($, e.args ?? '') })).catch(() => ({
    text: 'The restart command failed, so nothing restarted.',
  }))

  on('turn.start', async ($, e, next) => {
    await bandTurnStart($, e)
    if (e.agentId !== undefined) helperStarted(e.agentId)
    else {
      await warmTurnStarted($)
      await restartTurnStarted($, e.turnId)
    }
    return next(e)
  })

  // The note and ticket rows join beneath the engine's own, so a failure here shows no rows at all.
  on('prompt.autocomplete', { token: /^#/ }, async ($, e, next) => {
    const found = await listRows($, e.token)
    const before = await next(e)
    return { suggestions: [...before.suggestions, ...found] }
  }).catch(() => ({ suggestions: [] }))

  on('prompt.edit', async ($, e, next) => {
    const mentions = await mentionsFor($, e.inputText).catch(() => undefined)
    return next(mentions ? { ...e, inputText: mentions } : e)
  })

  on('prompt.submit', async ($, e, next) => {
    await noteAsked($, e)
    const line = await wrapUp($).catch(() => undefined)
    return next(line ? { ...e, context: [...(e.context ?? []), line] } : e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId === undefined) void metersRefresh($).catch(() => undefined)
    const done = withGuideHeader(e.tool_use_id, await bandToolCall($, e, () => next(e)))
    if (RESTART_CALL.test(e.tool) || done.result === undefined) return done
    return wrapUpResult($, e.agentId, done)
  })

  on('tool.call', { tool: 'Skill' }, async (_$, e, next) => inSkillCall(e.agentId, () => next(e)))

  // A ticket's header or a wiki folder's labels, beside the file read or mentioned.
  // A failure passes the read through as it was: next(e) after a first call settles with that call's result.
  // A read inside a wiki folder or a research topic counts a visit, never awaited into the read's result.
  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const path = (e as { file_path?: unknown }).file_path
    const done = await next(e)
    if (done.deny === undefined && !done.isError) void countVisit($, path, e.agentId, e.tool_use_id)
    return withFileContext($, path, e.agentId, done)
  }).catch(async (_$, e, next) => next(e))
  on('prompt.mention', async ($, e, next) => withFileContext($, e.path, e.agentId, await next(e)))

  on('skill.prompt', async ($, e, next) => withSkillWiki($, e.frontmatter, await next(e)))

  on('tool.call', { tool: RESTART_CALL }, async ($, e) => restartCall($, e)).catch(() => ({ deny: 'The restart hook failed, so nothing restarted.' }))

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

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await bandTurnComplete($, e)
    if (e.agentId !== undefined) {
      helperEnded(e.agentId)
      forgetAgent(e.agentId)
      return done
    }
    void saveReply($).catch((error) => $.ui.log(`the reply was not saved: ${reasonOf(error)}`))
    await restartTurnEnded($, e)
    await warmTurnEnded($)
    await startPendingRestart($)
    return done
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) =>
    drawBand($, e, next, () => void askForRestart($, '').catch((error) => $.ui.log(`the Restart button failed: ${reasonOf(error)}`))),
  )

  on('session.measure', async ($, e, next) => {
    await metersMeasure($, e).catch(() => undefined)
    return next(e)
  })

  // Every request of the main loop refreshes the context meter, so a long turn shows its size as it grows.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) void metersRefresh($).catch(() => undefined)
    yield* steerStep($, e.agentId, measureAgent(e.agentId, metersStep($, e, next(e))))
  })

  on('classic.SessionStart', async ($, e, next) => {
    await metersRead($, e.transcript_path).catch(() => undefined)
    await warmTranscript($, e.transcript_path)
    return next(e)
  })
  on('classic.Stop', async ($, e, next) => {
    await metersRead($, e.transcript_path).catch(() => undefined)
    await warmTranscript($, e.transcript_path)
    return next(e)
  })
  on('classic.PostModelSwitch', async ($, e, next) => {
    await metersSwitch($, e.to_model).catch(() => undefined)
    await noteBroken($).catch(() => undefined)
    return next(e)
  })
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => drawMeters($, e, next))

  on('session.compact', async ($, e, next) => (e.agentId !== undefined ? next(e) : restartCompact($, e))).catch(compactRefused)
}
