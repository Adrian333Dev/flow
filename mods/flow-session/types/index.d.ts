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

/** A restart the agent asked for, from the tool call to the end of the compaction. */
export type Restart = {
  message: string
  size: number
  started: boolean
  /** Typed by the user as /restart: the compaction ends it and no turn follows. */
  manual: boolean
}

/** What a restart keeps word for word besides the last reply, which the conversation holds, and the restart itself (hooks/register.ts). The host holds it, so an edit that reloads the mod loses none of it. */
export type Tracked = {
  /** The main turn that runs now, which the restart tool ends. */
  turn?: string
  /** The restart under way. Set by the restart tool, cleared when the compaction ends. */
  restart?: Restart
  /** Set by /restart, taken by the restart tool, which makes that restart typed. */
  typed?: boolean
  /** The user's messages since the last finished reply, oldest first. */
  asked: string[]
  /** Files an edit tool touched since that reply. */
  changed: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'flow-session': { band: Entry[]; issues: number; frame: number; meters: MeterState; tracked: Tracked }
  }
}
