/**
 * dialogue.ts: tells the user's own messages from the text the mod and the host add.
 *
 * The prompts the mod submits and the messages it writes into a restarted window begin with the
 * prefixes below, so neither `/copy-all` nor the restart counts them as the user's. Nothing here
 * touches the host: no import but types.
 */
import type { SessionMessage } from 'claude-code'

/** The prefix of the prompt the mod submits for `/restart` and the button. It is the mod's, never the user's. */
export const ASK_PREFIX = 'Restart now:'
/** The prompt the mod submits to start the turn after an automatic restart. */
export const CONTINUE = 'Continue from the note.'
/** How the first and the note's message of a restarted window begin. */
export const OPENING = 'Session restarted.'
export const NOTE_PREFIX = 'Note from the old agent:'
/** The id prefix of a call the mod wrote into a window. */
export const FAKE_ID = 'toolu_restart_'

/** Text in a user message that is not the user's: the mod's own, a command's output, a skill's body, a notification. */
const NOT_THE_USER = [
  /^<(local-command-|command-name>|task-notification|system-reminder)/,
  /^Base directory for this skill:/,
  /^Launching skill:/,
  /^Claude Code sent this note/,
  /^Restarted at \d+k\./,
]

/** A message the user wrote: not a tool result, not the mod's prompt and not text the host added. */
export function isUsersOwn(m: Pick<SessionMessage, 'role' | 'text' | 'toolResults'>): boolean {
  if (m.role !== 'user' || m.toolResults?.length) return false
  const text = m.text.trim()
  if (!text || text === CONTINUE) return false
  if ([OPENING, NOTE_PREFIX, ASK_PREFIX].some((prefix) => text.startsWith(prefix))) return false
  return !NOT_THE_USER.some((pattern) => pattern.test(text))
}
