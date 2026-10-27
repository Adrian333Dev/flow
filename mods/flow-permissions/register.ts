/**
 * register.ts: every hook of Flow's permission mod. Every ask the rules and the guard leave open
 * goes to Claude Code's question dialog (features/dialog/), and each is logged (features/log/).
 */
import type { Register } from 'claude-code'
import { askUser, setInteractive } from './features/dialog/ask'
import { denyFor, takeVerdict, verdictKey } from './features/dialog/pane'

export const register: Register = (on) => {
  on('session.start', async (_$, e, next) => {
    setInteractive(e.isInteractive)
    return next(e)
  })

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
}
