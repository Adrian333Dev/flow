/**
 * headline.ts: the plain sentence and the text under it for an ask, from the tool and its input.
 *
 * The dialog shows the sentence alone; the text goes to the log. A guard ask brings
 * its own sentence, so the one here is for every other ask: a core ask's own
 * reason is long and full of paths.
 */

export type Headline = {
  sentence: string
  /** The command, the path or the address, for the log. */
  text: string
}

const WRITES: Record<string, string> = {
  Edit: 'Edit this file',
  MultiEdit: 'Edit this file',
  Write: 'Write this file',
  NotebookEdit: 'Edit this notebook',
}

// A command starts at the text's start, a new line, or after `;`, `&`, `|` or `(`.
const START = String.raw`(?:^|[\n;&|(])\s*`
const COMMIT = new RegExp(`${START}git\\s+commit\\b`)
const PUSH = new RegExp(`${START}git\\s+push\\b`)
const PUBLISH = new RegExp(`${START}(?:npm|pnpm|yarn|cargo|gem|twine)\\s+(?:publish|push|upload)\\b`)

const SAVE = new RegExp(`${START}(?:u|util)\\s+(?:g|git)\\s+save\\b`)

/**
 * `util git save` stages, commits and pushes inside one script, so the rules on
 * `git commit` never see it. Its flags are read up to the first quote, where
 * the message starts.
 */
function saveSentence(command: string): string {
  const flags = command.split(/["']/)[0]!
  if (/\s--dry-run\b/.test(flags)) return 'Show the git commands a save would run'
  const what = /\s(?:-p|--path)\s/.test(flags) ? 'the listed paths' : 'everything'
  return /\s(?:-n|--no-push)\b/.test(flags) ? `Stage ${what} and commit` : `Stage ${what}, commit and push`
}

/** The sentence for a shell command: a publish, a save, a commit, a push or both, found anywhere in the command. */
function bashSentence(command: string): string {
  if (PUBLISH.test(command)) return 'Publish a package'
  if (SAVE.test(command)) return saveSentence(command)
  const commit = COMMIT.test(command)
  const push = PUSH.test(command)
  if (commit && push) return 'Commit and push'
  if (commit) return 'Commit'
  if (push) return 'Push to a remote'
  return 'Run a shell command'
}

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
    return { sentence: bashSentence(command), text: command }
  }
  const write = WRITES[tool]
  if (write) return { sentence: write, text: mainField(input) ?? '' }
  if (tool === 'Read') return { sentence: 'Read this file', text: mainField(input) ?? '' }
  if (tool === 'WebFetch') return { sentence: 'Fetch this page', text: mainField(input) ?? '' }
  if (tool === 'WebSearch') return { sentence: 'Search the web', text: mainField(input) ?? '' }
  return { sentence: `Call the tool ${tool}`, text: fieldLines(input) }
}

/**
 * The sentence for a write the guard asked about. The guard's own sentence
 * does not survive: Claude Code swaps in its long `requested permissions` text.
 */
export function guardedSentence(tool: string, file: string): string {
  if (/(^|\/)\.ssh\//.test(file)) return 'Write into ~/.ssh · login keys'
  return `${WRITES[tool] ?? 'Edit this file'} · can switch the guard off`
}
