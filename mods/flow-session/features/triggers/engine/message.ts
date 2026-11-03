/**
 * message.ts: the chat score, on each message the user sends (`prompt.submit`).
 *
 * The turns of the main window and the message being sent are scored (`checks/chat.ts`). Each file
 * at or over the threshold gets the guides an `Edit` of it would, each missing one attached beside
 * the message after `[Auto] Before planning a change to <file>, follow this guide, references/guides/<guide>:`,
 * the line the window check counts as a read. A restart starts the score at zero, since the window does.
 */
import type { EngineInterface } from 'claude-code'
import { flowHome, readText } from '../../../shared/home'
import { type Block, textOf, type WindowMessage, windowMessages } from '../../../shared/window'
import { likelyChanges, type Turn } from '../checks/chat'
import { guidesFor } from '../list'
import { logFirings } from '../log'
import { attachGuides } from '../sends/guides'
import { windowKeys } from './held'

/** Text the user never typed: what a hook or the host added beside a message. */
const ADDED = /^\s*(?:\[Auto\]|<system-reminder>|<local-command|<command-name>)/

/** The turns of a window, oldest first: each user message that holds text opens one, and the agent's text joins it. */
export function turnsOf(messages: readonly WindowMessage[]): Turn[] {
  const turns: Turn[] = []
  for (const m of messages) {
    const blocks: readonly Block[] = typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content
    const texts = blocks.filter((b) => b.type === 'text').map(textOf).filter((t) => t.trim() && !ADDED.test(t))
    if (m.role === 'user' && texts.length) turns.push({ user: texts.join('\n'), agent: '' })
    else if (m.role === 'assistant' && turns.length && texts.length) turns.at(-1)!.agent += `${texts.join('\n')}\n`
  }
  return turns
}

/** The guides the chat calls for beside the message being sent, each once a window. */
export async function chatGuides($: EngineInterface, text: string): Promise<string[]> {
  const messages = await windowMessages($, undefined)
  const likely = likelyChanges([...turnsOf(messages), { user: text, agent: '' }])
  if (!likely.length) return []
  const keys = windowKeys(messages)
  const home = await flowHome($)
  const parts: string[] = []
  for (const { file, score } of likely) {
    const wanted = guidesFor([file]).filter(({ guide }) => !parts.some((p) => p.includes(`references/guides/${guide}:`)))
    const sent = await attachGuides((path) => readText($, path), wanted, keys, home)
    if (!sent.length) continue
    parts.push(...sent)
    logFirings($, undefined, [{ id: 'chat', by: 'chat', file, sent: wanted.filter(({ guide }) => sent.some((s) => s.includes(`references/guides/${guide}:`))).map(({ guide }) => `references/guides/${guide}`), score }])
  }
  return parts
}
