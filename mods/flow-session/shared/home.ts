import type { EngineInterface } from 'claude-code'

/** The Flow home: `FLOW_HOME`, else `~/.flow`. */
export async function flowHome($: EngineInterface): Promise<string> {
  return (await $.env.get('FLOW_HOME')) ?? `${await $.env.get('HOME')}/.flow`
}

/** A file's text, or undefined when it is missing or unreadable. */
export async function readText($: EngineInterface, file: string): Promise<string | undefined> {
  return $.fs.read(file).catch(() => undefined)
}

/** The mod's folder in `CLAUDE_CODE_PLUGIN_DIRS` (one path, or several split by `,` or `:`), `~` expanded. */
export function findModFolder(dirs: string | undefined, home: string): string | undefined {
  const found = (dirs ?? '')
    .split(/[,:]/)
    .map((dir) => dir.trim().replace(/\/+$/, ''))
    .find((dir) => dir.endsWith('/flow-session') || dir === 'flow-session')
  return found?.replace(/^~(?=\/|$)/, home)
}

/** The mod's own folder, or undefined where `CLAUDE_CODE_PLUGIN_DIRS` names none. */
export async function modFolder($: EngineInterface): Promise<string | undefined> {
  const dirs = await $.env.get('CLAUDE_CODE_PLUGIN_DIRS').catch(() => undefined)
  const home = (await $.env.get('HOME').catch(() => undefined)) ?? ''
  return findModFolder(dirs, home)
}
