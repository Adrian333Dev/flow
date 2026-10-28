/**
 * restart-guide.ts: reads `prompts/restart-guide.md` in the Flow home, the guide sent with each ask for a restart
 * (the wrap-up lines and `/restart`), so it reaches the agent just before it writes the note.
 */
import type { EngineInterface } from 'claude-code'
import { flowHome } from '../../shared/home'

/** The guide's text. A missing file still asks for the restart, and names the path it read. */
export async function restartGuide($: EngineInterface): Promise<string> {
  const path = `${await flowHome($)}/prompts/restart-guide.md`
  const text = await $.fs.read(path).catch(() => undefined)
  if (text !== undefined) return text.trim()
  $.ui.log(`restart guide not found at ${path}`)
  return `The restart guide is missing (${path}). Update \`ticket.md\` and \`context.md\` with everything this window learned, then call \`restart\` with your note.`
}
