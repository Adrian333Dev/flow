/**
 * drag.ts: turns a pasted file path into the text of an `@` mention.
 *
 * Dragging a file into the prompt box pastes its absolute path, quoted or
 * not. Claude Code reads mentions while the text is still in the box, so the
 * rewrite has to happen in `prompt.edit`, before Enter.
 */
import type { EngineInterface } from 'claude-code'

/** The words of a paste, split as a shell would: bare, 'single', "double", or with `\ ` escapes. Undefined for an open quote. */
export function words(text: string): string[] | undefined {
  const out: string[] = []
  let word = ''
  let started = false
  let quote: string | undefined
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i)
    const next = text.charAt(i + 1)
    if (quote) {
      if (c === quote) quote = undefined
      else if (c === '\\' && quote === '"' && (next === '"' || next === '\\')) word += text.charAt(++i)
      else word += c
    } else if (c === "'" || c === '"') {
      quote = c
      started = true
    } else if (c === '\\' && next !== '') {
      word += text.charAt(++i)
      started = true
    } else if (/\s/.test(c)) {
      if (started) out.push(word)
      word = ''
      started = false
    } else {
      word += c
      started = true
    }
  }
  if (quote) return undefined
  if (started) out.push(word)
  return out
}

/** The absolute paths a paste is made of, or undefined when it holds anything else. */
export function pastedPaths(text: string): string[] | undefined {
  const found = words(text)
  return found?.length && found.every((word) => word.startsWith('/')) ? found : undefined
}

/** The path under `root`, or undefined for the folder itself and anything outside it. */
export function relativeTo(root: string, path: string): string | undefined {
  const base = root.endsWith('/') ? root : `${root}/`
  const rest = path.startsWith(base) ? path.slice(base.length).replace(/\/+$/, '') : ''
  return rest || undefined
}

/** One mention. A name with a space takes quotes, as Claude Code reads `@"my file.md"`. */
export const mention = (relative: string) => (/\s/.test(relative) ? `@"${relative}"` : `@${relative}`)

/** A paste of paths that all exist under the session's folder, as mentions. Undefined for any other edit. */
export async function mentionsFor($: EngineInterface, pasted: string): Promise<string | undefined> {
  const paths = pastedPaths(pasted)
  if (!paths) return undefined
  const root = await $.session.root()
  const parts: string[] = []
  for (const path of paths) {
    const relative = relativeTo(root, path)
    if (relative === undefined || !(await $.fs.exists(path))) return undefined
    parts.push(mention(relative))
  }
  return `${parts.join(' ')} `
}
