/**
 * button.ts: what hides the band's Restart button, and the steps of `Tracked` that set and clear it.
 *
 * The button shows only between turns. A press hides it at once and keeps it hidden until the
 * restart ends, or until the turn the press started ends with no restart (Esc, a refusal), so one
 * failed press never hides it for good. register.ts calls these from its hooks.
 */
import type { Tracked } from '../types'

/** What keeps the button away: a turn running, a press waiting on the agent, a restart under way. */
export type Busy = { running: boolean; requested: boolean; restarting: boolean }

/** `turnRunning` is the band's own flag. `turn` outlives a hot reload, which empties the flag, so both count. */
export const busyWith = (t: Tracked, turnRunning: boolean): Busy => ({
  running: turnRunning || t.turn !== undefined,
  requested: t.requested !== undefined,
  restarting: t.restart !== undefined,
})

/** A press of the button or a typed /restart: the agent is asked, and the restart it makes is typed. */
export const pressed = (t: Tracked): Tracked => ({ ...t, typed: true, requested: {} })

/** The ask could not be sent: nothing waits on the agent. */
export function pressLost(t: Tracked): Tracked {
  const { requested: _, ...rest } = t
  return { ...rest, typed: false }
}

/** A main turn began. The first one after a press is the turn that answers it. */
export function turnStarted(t: Tracked, turnId: string): Tracked {
  const next: Tracked = { ...t, turn: turnId }
  if (t.requested && t.requested.turn === undefined) next.requested = { turn: turnId }
  return next
}

/** A main turn ended. If it was the one that answered a press and began no restart, the press failed. */
export function turnEnded(t: Tracked, turnId: string): Tracked {
  if (t.turn !== turnId) return t
  const { turn: _, ...rest } = t
  return rest.requested?.turn === turnId && !rest.restart ? pressLost(rest) : rest
}

/** The restart is over, whether it finished or failed. */
export function restartEnded(t: Tracked): Tracked {
  const { restart: _, requested: __, ...rest } = t
  return rest
}
