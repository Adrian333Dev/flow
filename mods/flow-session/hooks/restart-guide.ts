/**
 * restart-guide.ts: reads `prompts/restart-guide.md`, the guide sent with each ask for a restart
 * (the wrap-up lines and `/restart`), so it reaches the agent just before it writes the note.
 *
 * The mod's folder comes from `CLAUDE_CODE_PLUGIN_DIRS`, the entry ending in `flow-session`.
 */
import type { EngineInterface } from 'claude-code'

const FILE = 'prompts/restart-guide.md'

/** The mod's folder in `CLAUDE_CODE_PLUGIN_DIRS` (one path, or several split by `,` or `:`), `~` expanded. */
export function modFolder(dirs: string | undefined, home: string): string | undefined {
  const found = (dirs ?? '')
    .split(/[,:]/)
    .map((dir) => dir.trim().replace(/\/+$/, ''))
    .find((dir) => dir.endsWith('/flow-session') || dir === 'flow-session')
  return found?.replace(/^~(?=\/|$)/, home)
}

/** The guide's text. A missing file still asks for the restart, and names the path it read. */
export async function restartGuide($: EngineInterface): Promise<string> {
  const dirs = await $.env.get('CLAUDE_CODE_PLUGIN_DIRS').catch(() => undefined)
  const home = (await $.env.get('HOME').catch(() => undefined)) ?? ''
  const folder = modFolder(dirs, home)
  const path = folder ? `${folder}/${FILE}` : FILE
  const text = folder ? await $.fs.read(path).catch(() => undefined) : undefined
  if (text !== undefined) return text.trim()
  $.ui.log(`restart guide not found at ${path}`)
  return `The restart guide is missing (${path}). Update \`ticket.md\` and \`context.md\` with everything this window learned, then call \`restart\` with your note.`
}
