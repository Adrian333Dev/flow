/**
 * shell-write.ts: which files a Bash command writes (`docs/spec/rules.md` `### Guides sent by situation`).
 *
 * A shell write is an in-place `sed` or `perl`, or a script that writes: a heredoc, or an inline
 * `python`/`node` run, whose text holds a write call. The files are the words ending in a known
 * extension. A path a script builds from variables is not found, and no guide arrives for it.
 */

/** The extensions of code files, as `situations.ts` tests them for `Read`, `Edit` and `Write`. */
export const CODE_EXTENSIONS = [
  ...'ts tsx mts cts js jsx mjs cjs py rb go rs java kt swift c h cc cpp hpp cs php sh bash lua svelte vue scala ex exs dart sql'.split(' '),
] as const

/** Where a command segment starts: the line start, or after `;`, `&`, `|`, a newline, `(` or a backtick; then `VAR=x` words and `xargs`. */
const SEGMENT = String.raw`(?:^|[;&|\n(\`])\s*(?:[A-Za-z_]\w*=\S*\s+)*(?:xargs\s+(?:-\S+\s+)*)?`

/** `sed`, `gsed` or `perl` with an in-place flag: `-i`, `-i.bak`, `-pi`, `-Ei`, `--in-place`. */
const IN_PLACE = new RegExp(String.raw`${SEGMENT}(?:g?sed|perl)\s+(?:-\S+\s+)*?(?:-[nplaweEsrzu0-9]*i\S*|--in-place\S*)(?=\s)`)

/** An interpreter run at the start of a segment. */
const INTERPRETER = new RegExp(String.raw`${SEGMENT}(?:python3?|node|deno|bun|ruby)\b`)

/** A write call in a script's text. */
const WRITE_CALL = /\.write\(|write_text|writeFileSync|appendFileSync|writeFile\(|open\([^\n]*?['"][wax]\+?b?['"]\s*[,)]/

const EXTENSION = new RegExp(String.raw`[^\s'"\`;|&()<>=,:]+\.(?:md|${CODE_EXTENSIONS.join('|')})(?!\w)`, 'g')

/** True where the command changes a file from the shell. */
export function writesFiles(command: string): boolean {
  if (IN_PLACE.test(command)) return true
  return WRITE_CALL.test(command) && (command.includes('<<') || INTERPRETER.test(command))
}

/** The files a shell write names, in order and once each. None where the command writes nothing. */
export function filesWritten(command: string): string[] {
  if (!writesFiles(command)) return []
  return [...new Set(command.match(EXTENSION) ?? [])]
}
