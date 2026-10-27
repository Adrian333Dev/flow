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

/** The meters row's figures (features/meters/meters.ts `Reading`), and `beat`, a counter the 30-second timer bumps to redraw. */
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
  /** The agent's note. */
  message: string
  /** What it asked to load: `files` entries (a path, `path#heading`, `path:from-to`) and skill names. */
  files: string[]
  skills: string[]
  size: number
  started: boolean
  /** Typed by the user as /restart: the compaction ends it and no turn follows. */
  manual: boolean
}

/** What a restart keeps word for word besides the dialogue, which the conversation holds, and the restart itself (features/restart/restart.ts). The host holds it, so an edit that reloads the mod loses none of it. */
export type Tracked = {
  /** The main turn that runs now, which the restart tool ends. Cleared when that turn ends. */
  turn?: string
  /** The restart under way. Set by the restart tool, cleared when the compaction ends. */
  restart?: Restart
  /** Set by /restart, taken by the restart tool, which makes that restart typed. */
  typed?: boolean
  /**
   * A press of the Restart button (or a typed /restart) waiting on the agent, which hides the button.
   * `turn` is the main turn that answers it, known once that turn starts. Cleared when the restart
   * ends, or when that turn ends with no restart.
   */
  requested?: { turn?: string }
  /** The user's messages since the last finished reply, oldest first. */
  asked: string[]
}

/** The keep-warm switch and what its pings must know (features/keepwarm/keepwarm.ts). The host holds it, so a hot reload and an in-place restart keep it. Times are epoch milliseconds. */
export type Warm = {
  /** Whether this session warms its cache. Off until `/keepwarm on`; a miss or a failed ping turns it off. */
  on: boolean
  /** The session's transcript file, from its last start. */
  transcript?: string
  /** The last ping that hit: it renewed the cache, and the transcript does not show it. */
  warmedAt?: number
  /** The pings sent for the request at `period`. */
  pings: number
  period?: number
  /** The last ping sent, written before the call, so a second tick cannot send another. */
  attemptAt?: number
  /** The start or end of the newest main turn: the cache was renewed no earlier than this, even where the transcript is not yet written. */
  activeAt?: number
  /** A model switch or a restart: the cached prefix is gone from here until a new request writes it. */
  brokenAt?: number
  /** Why the switch went off by itself. */
  stopped?: string
}

declare module 'claude-code' {
  interface PluginState {
    'flow-session': { band: Entry[]; issues: number; frame: number; meters: MeterState; tracked: Tracked; warm: Warm }
  }
}
