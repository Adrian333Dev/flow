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

declare module 'claude-code' {
  interface PluginState {
    'flow-session': { band: Entry[]; issues: number; frame: number }
  }
}
