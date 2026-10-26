/**
 * dialogue.ts: the old window's dialogue, as the file a restart writes.
 *
 * The user's words and the agent's visible replies word for word, each tool call cut to one line,
 * no tool result. A file holds one window, and a window with few messages of the user's own also
 * carries the windows before it. Nothing here touches the host, so a script can run it over a
 * recorded transcript (lab/scripts/check-restart-dialogue.mjs): no import but types.
 */
import type { SessionMessage } from 'claude-code'

/** The prefix of the prompt the mod submits for `/restart` and the button. It is the mod's, never the user's. */
export const ASK_PREFIX = 'Restart now:'
/** The prompt the mod submits to start the turn after an automatic restart. */
export const CONTINUE = 'Continue from the note.'
/** How the first and the note's message of a restarted window begin. */
export const OPENING = 'The session restarted.'
export const NOTE_PREFIX = 'Note from the old agent:'
/** The id prefix of a call the mod wrote into a window. */
export const FAKE_ID = 'toolu_restart_'
/** A window with fewer messages of the user's own than this carries the window before it. */
export const MIN_USERS = 5

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
  if (text.startsWith(OPENING) || text.startsWith(NOTE_PREFIX) || text.startsWith(ASK_PREFIX)) return false
  return !NOT_THE_USER.some((pattern) => pattern.test(text))
}

const SHOWN = ['file_path', 'notebook_path', 'command', 'pattern', 'skill', 'path', 'url', 'query', 'description']

/** One line for a tool call: its name and the first line of its main argument. */
export function toolLine(use: { tool: string; input: Record<string, unknown> }): string {
  const arg = SHOWN.map((key) => use.input[key]).find((value): value is string => typeof value === 'string' && value.trim() !== '')
  const first = arg?.trim().split('\n')[0]?.slice(0, 120)
  return `[tool] ${use.tool.replace(/^mcp__/, '')}${first ? ` ${first}` : ''}`
}

type Block = { tool: boolean; text: string }

/**
 * The dialogue of a window and the number of the user's own messages in it. The call to
 * `restartTool` is no line of it, but the closing line of the aborted turn is a reply the user saw.
 * Calls the mod wrote into the window are not the agent's, so they are left out.
 */
export function dialogueOf(messages: readonly SessionMessage[], restartTool: string): { text: string; users: number } {
  const blocks: Block[] = []
  let users = 0
  for (const m of messages) {
    if (m.role === 'user') {
      if (!isUsersOwn(m)) continue
      users++
      blocks.push({ tool: false, text: `[user]\n${m.text}` })
      continue
    }
    if (m.text.trim()) blocks.push({ tool: false, text: `[agent]\n${m.text}` })
    for (const use of m.toolUses) {
      if (use.tool !== restartTool && !use.tool_use_id.startsWith(FAKE_ID)) blocks.push({ tool: true, text: toolLine(use) })
    }
  }
  const text = blocks.reduce((all, block, i) => (i === 0 ? block.text : `${all}${block.tool && blocks[i - 1]!.tool ? '\n' : '\n\n'}${block.text}`), '')
  return { text: text || 'no turns', users }
}

/** One window's part of a file. */
export type Segment = { window: number; users: number; text: string }

const HEADER = /^<!-- window (\d+) · user messages: (\d+) -->$/gm

const headerOf = (s: Segment) => `<!-- window ${s.window} · user messages: ${s.users} -->`

/** The text of a file of segments, oldest first. */
export const fileOf = (segments: readonly Segment[]): string => segments.map((s) => `${headerOf(s)}\n\n${s.text}\n`).join('\n')

/** The segments of a file this module wrote, oldest first. */
export function segmentsOf(file: string): Segment[] {
  const found = [...file.matchAll(HEADER)]
  return found.map((match, i) => {
    const start = match.index! + match[0].length
    const end = found[i + 1]?.index ?? file.length
    return { window: Number(match[1]), users: Number(match[2]), text: file.slice(start, end).trim() }
  })
}

/** The segments of an earlier file to carry: the newest, then back, until the window and they hold `MIN_USERS` messages of the user's. */
export function carried(earlier: readonly Segment[], users: number): Segment[] {
  const taken: Segment[] = []
  let total = users
  for (const segment of [...earlier].reverse()) {
    if (total >= MIN_USERS) break
    taken.unshift(segment)
    total += segment.users
  }
  return taken
}
