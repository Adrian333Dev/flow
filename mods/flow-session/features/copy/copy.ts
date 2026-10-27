/**
 * copy.ts: the agent's words as a copy, in 2 sizes.
 *
 * `/copy-v2` copies the agent's last message, as Claude Code's own `/copy` does. `/copy-all` copies
 * every message of words the agent wrote since the user's last message, as raw markdown with a `---`
 * line between them, so the user sees where one starts. Tool calls are left out. After each turn the
 * same stretch is written to `.flow/replies/<session>-<n>.md` (n counts the user's messages in the
 * window), so a reply that `/copy`'s one shared file would overwrite is still on disk. The newest
 * `KEEP` files stay.
 */
import type { EngineInterface, SessionMessage } from 'claude-code'
import { isUsersOwn } from '../../shared/dialogue'

/** How many saved replies a project keeps. */
export const KEEP = 100

/** Between the messages of the stretch. */
export const SEPARATOR = '\n\n---\n\n'

/** The agent's last message with words in it: what Claude Code's own `/copy` takes. */
export function lastOf(messages: readonly SessionMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === 'assistant' && m.text.trim() !== '')
  return last?.text.trim() ?? ''
}

/** Every message of words the agent wrote since the user's last message of their own, and how many such messages the window holds. */
export function stretchOf(messages: readonly SessionMessage[]): { text: string; users: number } {
  let from = 0
  let users = 0
  messages.forEach((m, i) => {
    if (!isUsersOwn(m)) return
    from = i + 1
    users++
  })
  const parts = messages
    .slice(from)
    .filter((m) => m.role === 'assistant')
    .map((m) => m.text.trim())
    .filter(Boolean)
  return { text: parts.join(SEPARATOR), users }
}

/** The names past the newest `keep` markdown files, oldest last. */
export function staleFiles(entries: readonly { name: string; kind: string; mtimeMs: number }[], keep: number): string[] {
  return entries
    .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md'))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(keep)
    .map((entry) => entry.name)
}

/** Writes the stretch to `.flow/replies/`, then removes the files past `KEEP`. */
export async function saveReply($: EngineInterface): Promise<void> {
  const { text: stretch, users } = stretchOf(await $.session.messages())
  if (!stretch) return
  const root = (await $.session.root()).replace(/\/+$/, '')
  const session = ((await $.session.id().catch(() => '')) || 'session').slice(0, 8)
  const dir = `${root}/.flow/replies`
  await $.fs.write(`${dir}/${session}-${users}.md`, `${stretch}\n`)
  for (const name of staleFiles(await $.fs.list(dir), KEEP)) await $.process.run(['rm', '--', `${dir}/${name}`]).catch(() => undefined)
}

/** Puts `words` on the clipboard and says how much, or why not. */
async function put($: EngineInterface, words: string): Promise<string> {
  if (!words) return 'Nothing to copy: the agent has said nothing yet.'
  const done = await $.ui.copy({ text: words })
  if (!done.isCopied) return `Not copied: ${done.reason}.`
  return `Copied ${words.length} characters, ${words.split('\n').length} lines.`
}

/** What `/copy-v2` answers: the last message is on the clipboard, or why it is not. */
export async function copyLast($: EngineInterface): Promise<string> {
  return put($, lastOf(await $.session.messages()))
}

/** `/copy-v2` (Alt+C in `~/.claude/keybindings.json`) and `/copy-all` (Alt+A). */
export async function registerCopy($: EngineInterface): Promise<void> {
  await $.command
    .register({ name: 'copy-v2', description: 'Copy the agent’s last message, as markdown. Alt+C runs it.' })
    .catch(() => undefined)
  await $.command
    .register({ name: 'copy-all', description: 'Copy every message the agent wrote since your last message, with a --- between them and no tool calls. Alt+A runs it.' })
    .catch(() => undefined)
}

/** What `/copy-all` answers: the stretch is on the clipboard, or why it is not. */
export async function copyAll($: EngineInterface): Promise<string> {
  return put($, stretchOf(await $.session.messages()).text)
}
