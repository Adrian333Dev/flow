/**
 * restart-guide.ts: reads `restart-guide.md` beside it, the guide sent with each ask for a restart
 * (the wrap-up lines and `/restart`), so it reaches the agent just before it writes the note.
 */
import type { EngineInterface } from 'claude-code'
import { modFolder } from '../../shared/home'

const FILE = 'features/restart/restart-guide.md'

/** The guide's text. A missing file still asks for the restart, and names the path it read. */
export async function restartGuide($: EngineInterface): Promise<string> {
  const folder = await modFolder($)
  const path = folder ? `${folder}/${FILE}` : FILE
  const text = folder ? await $.fs.read(path).catch(() => undefined) : undefined
  if (text !== undefined) return text.trim()
  $.ui.log(`restart guide not found at ${path}`)
  return `The restart guide is missing (${path}). Update \`ticket.md\` and \`context.md\` with everything this window learned, then call \`restart\` with your note.`
}
