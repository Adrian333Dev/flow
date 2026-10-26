/**
 * tokenize.ts: cuts a shell command into coloured pieces, one list per line.
 *
 * The kinds: a command's program, flags, variables, paths (a quoted one too),
 * strings, comments, control words and operators (`for`, `then`, `|`, `&&`,
 * `;`, `>`), and everything else as plain. A here-doc's body is a string, such
 * as a commit message, and its closing line is a control word. A scanner of its
 * own, since scripts/lib/guard/parse.js reads a command into words and keeps no
 * positions in the text. Naive on purpose: joining a line's pieces always gives
 * the line back.
 */

export type PieceType = 'plain' | 'program' | 'flag' | 'variable' | 'path' | 'string' | 'comment' | 'control'
export type Piece = { text: string; type: PieceType }

/** A path, a URL or a file name: `~/x`, `./x`, `/x`, `a/b`, `https://x`, `.env`, `notes.md`. */
export const isPath = (text: string) =>
  /^(~|\.{1,2}\/|\/|[\w.-]+\/|[a-z][\w+.-]*:\/\/|\.[\w.-]+$|[\w-]*[A-Za-z][\w-]*\.[A-Za-z][A-Za-z0-9]{0,4}$)/.test(text)

const ASSIGNMENT = /^\w+=/
const QUOTED = /^(["'])(.*)\1$/

const KEYWORDS = new Set(['for', 'in', 'do', 'done', 'if', 'then', 'elif', 'else', 'fi', 'while', 'until', 'case', 'esac', 'function', 'select'])
// After these a new command starts, so the next word may be a keyword too.
const OPENS_COMMAND = new Set(['if', 'then', 'else', 'elif', 'do', 'while', 'until'])
// Longest first, since `&&` must win over `&`.
const OPERATORS = ['&&', '||', ';;', '>>', '<<<', '<<-', '<<', '|&', '|', ';', '&', '>', '<']
const ENDS_COMMAND = new Set(['&&', '||', ';;', '|&', '|', ';', '&'])
const WORD = /^[^\s'"\\|&;<>()]+/
const HEREDOC_DELIMITER = /^(['"]?)([^\s'"<>|&;()]+)\1/

type Heredoc = { delimiter: string; dash: boolean }

type State = {
  /** The quote left open at the end of the last line. */
  quote: "'" | '"' | null
  atCommand: boolean
  /** The first word of the current command, and how many words it has so far. */
  head: string
  words: number
  /** Here-docs opened on a line, whose bodies start on the next. */
  waiting: Heredoc[]
  body: Heredoc | null
}

/** The index of the quote closing a string that continues at `from`, or -1. */
function closeOf(line: string, from: number, quote: string): number {
  if (quote === "'") return line.indexOf("'", from)
  for (let i = from; i < line.length; i++) {
    if (line[i] === '\\') i++
    else if (line[i] === '"') return i
  }
  return -1
}

function scanLine(line: string, state: State): Piece[] {
  if (state.body) {
    const { delimiter, dash } = state.body
    const closing = (dash ? line.replace(/^\t+/, '') : line) === delimiter
    if (closing) {
      state.body = state.waiting.shift() ?? null
      state.atCommand = true
    }
    return line ? [{ text: line, type: closing ? 'control' : 'string' }] : []
  }

  const out: Piece[] = []
  const push = (text: string, type: PieceType) => {
    if (!text) return
    const last = out[out.length - 1]
    if (last?.type === type) last.text += text
    else out.push({ text, type })
  }
  const newCommand = () => {
    state.atCommand = true
    state.head = ''
    state.words = 0
  }
  const word = (text: string) => {
    const keyword =
      KEYWORDS.has(text) &&
      (state.atCommand || (text === 'in' && state.words === 2 && ['for', 'select', 'case'].includes(state.head)))
    if (keyword) {
      push(text, 'control')
      if (OPENS_COMMAND.has(text)) return newCommand()
      state.head ||= text
      state.atCommand = false
      state.words++
      return
    }
    // `X=1 cmd`: the assignment leaves the next word the program.
    if (state.atCommand && ASSIGNMENT.test(text)) return push(text, 'plain')
    const type: PieceType = state.atCommand
      ? 'program'
      : text.startsWith('-') ? 'flag' : text.startsWith('$') ? 'variable' : isPath(text) ? 'path' : 'plain'
    push(text, type)
    if (state.atCommand) state.head = text
    state.atCommand = false
    state.words++
  }

  let continued = false
  let i = 0
  while (i < line.length) {
    if (state.quote) {
      const close = closeOf(line, i, state.quote)
      push(line.slice(i, close < 0 ? undefined : close + 1), 'string')
      i = close < 0 ? line.length : close + 1
      if (close >= 0) state.quote = null
      continue
    }
    const c = line[i]!
    if (c === ' ' || c === '\t') {
      push(c, 'plain')
      i++
    } else if (c === '#' && (i === 0 || /[\s;&|(]/.test(line[i - 1]!))) {
      push(line.slice(i), 'comment')
      i = line.length
    } else if (c === "'" || c === '"') {
      if (state.atCommand || i === 0 || /[\s;&|(]/.test(line[i - 1]!)) word('')
      state.quote = c
      push(c, 'string')
      i++
    } else if (c === '\\') {
      push(line.slice(i, i + 2), 'plain')
      if (i + 1 >= line.length) continued = true
      i += 2
    } else {
      const operator = OPERATORS.find((o) => line.startsWith(o, i))
      if (operator) {
        push(operator, 'control')
        i += operator.length
        if (ENDS_COMMAND.has(operator)) newCommand()
        if (operator === '<<' || operator === '<<-') {
          const spaces = /^[ \t]*/.exec(line.slice(i))![0]
          const found = HEREDOC_DELIMITER.exec(line.slice(i + spaces.length))
          if (found) {
            push(spaces + found[0], 'plain')
            i += spaces.length + found[0].length
            state.waiting.push({ delimiter: found[2]!, dash: operator === '<<-' })
          }
        }
      } else if (c === '(' || c === ')') {
        push(c, 'plain')
        if (c === '(') newCommand()
        i++
      } else {
        const found = WORD.exec(line.slice(i))
        const text = found ? found[0] : c
        word(text)
        i += text.length
      }
    }
  }

  if (!state.quote) {
    if (!continued) newCommand()
    state.body = state.waiting.shift() ?? null
  }
  return out
}

/** A quoted path draws as a path: `"src/a b.ts"`. */
const quotedPath = (piece: Piece): Piece => {
  const inner = piece.type === 'string' ? QUOTED.exec(piece.text)?.[2] : undefined
  return inner !== undefined && isPath(inner) ? { ...piece, type: 'path' } : piece
}

/** The command's pieces, one list per line. A quote left open runs on into the next line. */
export function tokenize(command: string): Piece[][] {
  const state: State = { quote: null, atCommand: true, head: '', words: 0, waiting: [], body: null }
  return command.split('\n').map((line) => scanLine(line, state).map(quotedPath))
}
