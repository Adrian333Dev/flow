/**
 * shell-read.ts: the files a Bash read shows the content of, judged by its result (`docs/spec/rules.md` `### Guides sent by situation`).
 *
 * A shell read is a segment starting with `grep`, `rg`, `cat`, `head`, `tail`, `sed` (never in place),
 * `awk`, `less` or `bat`. A file counts where the output shows its content: a path heading output
 * lines (`references/guides/writing.md:12:…`, `…md-13-…` for context), or, where no line carries a path, each
 * file the command names. A listing (`grep -l`, `-c`, `-q`) and an empty output show none.
 */
import { CODE_EXTENSIONS, SEGMENT, writesFiles } from './shell-write'

const READ = new RegExp(String.raw`${SEGMENT}(?:e|f)?(?:grep|rg|cat|head|tail|g?sed|awk|less|bat)\b`)
const GREP = new RegExp(String.raw`${SEGMENT}(?:e|f)?(?:grep|rg)\b`)
/** A grep or rg segment with a flag that prints names or counts, never content. */
const LISTING = new RegExp(
  String.raw`${SEGMENT}(?:e|f)?(?:grep|rg)\b[^|;&\n]*?\s(?:-[A-Za-z]*[lLcq][A-Za-z]*|--(?:files-with(?:out)?-matches?|files-without-match|count|quiet|silent))(?=\s|$)`,
)
const EXT = String.raw`\.(?:md|${CODE_EXTENSIONS.join('|')})`
const NAMED = new RegExp(String.raw`[^\s'"\`;|&()<>=,:]+${EXT}(?!\w)`, 'g')
/** An output line headed by a path: `a.md:12:x`, `a.md-12-x`, `a.md:x`. Never `a.md:3` alone, a count. */
const HEADED = new RegExp(String.raw`^([^\s:'"\`]+?${EXT})(?:[:-]\d+[:-]|:(?!\d+$))`)

/**
 * The files a shell read shows the content of, in order and once each. None where the command is no
 * read, or writes. Only a grep's output is searched for paths: a file's own text can start a line with one.
 */
export function filesShown(command: string, output: string): string[] {
  if (!READ.test(command) || writesFiles(command) || !output.trim()) return []
  if (GREP.test(command)) {
    const headed = [...new Set(output.split('\n').flatMap((line) => HEADED.exec(line)?.[1] ?? []))]
    if (headed.length) return headed
    if (LISTING.test(command)) return []
  }
  return [...new Set(command.match(NAMED) ?? [])]
}
