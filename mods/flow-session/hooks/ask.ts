/**
 * ask.ts: what `/restart` and the band's Restart button tell the agent.
 *
 * One short prompt, one model request: the agent answers with the `restart` call and its note.
 * The prompt starts with `ASK_PREFIX`, so the next window leaves it out of the dialogue.
 */
import { ASK_PREFIX } from './dialogue'

/** What `/restart` tells the agent. It never opens with `/`: the host runs a prompt that does as a command. */
export function restartAsk(extra: string): string {
  const lines = [`${ASK_PREFIX} write your note and call the restart tool.`]
  if (extra.trim()) lines.push(`User: ${extra.trim()}`)
  return lines.join('\n\n')
}
