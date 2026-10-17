/**
 * headline.ts: the plain sentence and the text under it for an ask, from the tool and its input.
 *
 * The dialog shows a sentence, then the command or path alone. A guard ask brings
 * its own sentence, so the one here is for every other ask: a core ask's own
 * reason is long and full of paths.
 */

export type Headline = {
  sentence: string
  /** What the dialog shows beneath the sentence: the command, the path, the address. */
  text: string
  /** A write asks `Allow this write?`, everything else `Allow this command?`. */
  kind: 'command' | 'write'
}

const WRITES: Record<string, string> = {
  Edit: 'Edits this file.',
  MultiEdit: 'Edits this file.',
  Write: 'Writes this file.',
  NotebookEdit: 'Edits this notebook.',
}

const BASH_SENTENCES: [RegExp, string][] = [
  [/^\s*git\s+commit\b/, 'Makes a git commit.'],
  [/^\s*git\s+push\b/, 'Pushes commits to a remote.'],
  [/^\s*(npm|pnpm|yarn|cargo|gem|twine)\s+(publish|push|upload)\b/, 'Publishes a package.'],
]

const field = (input: unknown, name: string): string | undefined => {
  const value = (input as Record<string, unknown> | null | undefined)?.[name]
  return typeof value === 'string' ? value : undefined
}

/** The one field that names what the call touches. Undefined for a tool with none. */
export function mainField(input: unknown): string | undefined {
  for (const name of ['command', 'file_path', 'notebook_path', 'url', 'query']) {
    const value = field(input, name)
    if (value !== undefined) return value
  }
  return undefined
}

/** Other tools: one `name: value` line per field, since JSON reads badly in a dialog. */
function fieldLines(input: unknown): string {
  if (typeof input !== 'object' || input === null) return ''
  return Object.entries(input)
    .map(([name, value]) => `${name}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n')
}

/** The headline for a call. `Bash` gets a sentence by command only for a commit, a push and a publish. */
export function headline(tool: string, input: unknown): Headline {
  if (tool === 'Bash') {
    const command = field(input, 'command') ?? ''
    const sentence = BASH_SENTENCES.find(([pattern]) => pattern.test(command))?.[1] ?? 'Runs a shell command.'
    return { sentence, text: command, kind: 'command' }
  }
  const write = WRITES[tool]
  if (write) return { sentence: write, text: mainField(input) ?? '', kind: 'write' }
  if (tool === 'Read') return { sentence: 'Reads this file.', text: mainField(input) ?? '', kind: 'command' }
  if (tool === 'WebFetch') return { sentence: 'Fetches this page.', text: mainField(input) ?? '', kind: 'command' }
  if (tool === 'WebSearch') return { sentence: 'Searches the web.', text: mainField(input) ?? '', kind: 'command' }
  return { sentence: `Calls the tool ${tool}.`, text: fieldLines(input), kind: 'command' }
}

/** The dialog's own question, which the draw rewrites to. */
export const questionFor = (kind: Headline['kind']) => (kind === 'write' ? 'Allow this write?' : 'Allow this command?')
