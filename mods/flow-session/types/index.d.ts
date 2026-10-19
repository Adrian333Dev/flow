/**
 * The band's state contract: what the host keeps for the session, so a hot reload loses nothing.
 */

/** One badge: a ticket the session works. */
export type Entry = {
  id: string
  /** The id and short name joined, `fw-71-ticket-names-files`. */
  name: string
  /** The status part of the badge: the word in capitals, then the count, such as `BUILD 2/5`. */
  word: string
  isDone: boolean
  /** True on the badge the session works while a turn runs, which shows the sweep and the spinner. */
  acting: boolean
}

/** The meters row's figures (hooks/meters.ts `Reading`), and `beat`, a counter the 30-second timer bumps to redraw. */
export type MeterState = {
  model?: string
  effort?: string | number
  tokens?: number
  limit: number
  rates: { kind: string; percentUsed: number; resetsAt?: string }[]
  coldAt?: number
  beat: number
}

/** What a restart keeps word for word (hooks/register.ts). The host holds it, so an edit that reloads the mod loses none of it. */
export type Tracked = {
  /** The main turn that runs now, which the restart tool ends. */
  turn?: string
  /** The last finished reply. */
  reply?: string
  /** The user's messages since that reply, oldest first. */
  asked: string[]
  /** Files an edit tool touched since that reply. */
  changed: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'flow-session': { band: Entry[]; issues: number; frame: number; meters: MeterState; tracked: Tracked }
  }
}
