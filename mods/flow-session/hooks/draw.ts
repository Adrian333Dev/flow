/**
 * draw.ts: the rows drawn above the permission dialog, in colour.
 *
 * The sentence reads `Action target · reason`: the action bold, red when it
 * destroys and yellow otherwise, each path blue, the reason dim. A thick dim
 * rule parts it from the command. The command is coloured by part: the program
 * bold, flags cyan, strings green (a here-doc's body too), variables, control
 * words and operators magenta, paths blue, comments dim. Named colours only, so
 * the terminal's theme picks the shade.
 *
 * The engine lets a draw use 12 rows and counts a `Text` as 1 plus its
 * newlines, plus 1 for every 40 characters of each string child. One `Text` per
 * line with nested `Text`s per coloured piece costs 1 row per line, but only
 * while no piece reaches 40 characters, so a longer piece is cut into `Text`s
 * of 39 or fewer. Blank lines cost a row each, so a command too long to keep
 * them loses them in the picture only.
 */
import type { RenderNode } from 'claude-code'
import { keepsBlanks, type Draw } from './pane'
import { isPath, tokenize, type Piece, type PieceType } from './tokenize'

export type MakeText = (props: { key?: string; color?: string; bold?: boolean; dimColor?: boolean; children?: RenderNode | RenderNode[] }) => RenderNode

type Style = { color?: string; bold?: boolean; dimColor?: boolean }

const ACCENTS: Record<Exclude<PieceType, 'plain'>, Style> = {
  program: { bold: true },
  flag: { color: 'cyan' },
  variable: { color: 'magenta' },
  path: { color: 'blue' },
  string: { color: 'green' },
  comment: { dimColor: true },
  control: { color: 'magenta' },
}

/** Actions that destroy or overwrite, drawn red. */
const DESTROYS = /^(Delete|Discard|Drop|Wipe|Reset|Hard-reset|Overwrite|Force-[\w-]+|Rewrite|Rebase|Prune)\b/
const REASON = ' · '
const MAX_WIDTH = 39

/** The text in strings of 39 characters or fewer, cut at a space where one fits. */
function chunks(text: string): string[] {
  const out: string[] = []
  let current = ''
  for (const word of text.split(/(?<= )/)) {
    if (current && current.length + word.length > MAX_WIDTH) {
      out.push(current)
      current = ''
    }
    let rest = word
    while (rest.length > MAX_WIDTH) {
      out.push(rest.slice(0, MAX_WIDTH))
      rest = rest.slice(MAX_WIDTH)
    }
    current += rest
  }
  if (current) out.push(current)
  return out
}

/** A styled piece as children of its line: a short one as it is, a long one as one `Text` per chunk. */
function nodes(Text: MakeText, key: string, text: string, style?: Style): RenderNode[] {
  if (text.length <= MAX_WIDTH) return [style ? Text({ key, ...style, children: text }) : text]
  return chunks(text).map((chunk, n) => Text({ key: `${key}-${n}`, ...style, children: chunk }))
}

/** The sentence in styled pieces: the action up to the first path, each path, the words between, the reason. */
export function sentencePieces(sentence: string): { text: string; style?: Style }[] {
  const cut = sentence.indexOf(REASON)
  const head = cut < 0 ? sentence : sentence.slice(0, cut)
  const action: Style = { bold: true, color: DESTROYS.test(sentence) ? 'red' : 'yellow' }
  const out: { text: string; style?: Style }[] = []
  let acting = true
  for (const word of head.split(/(?<= )/)) {
    const path = isPath(word.trimEnd().replace(/,$/, ''))
    if (path) acting = false
    const style = path ? ACCENTS.path : acting ? action : undefined
    const last = out[out.length - 1]
    if (last && last.style === style) last.text += word
    else out.push({ text: word, style })
  }
  if (cut >= 0) out.push({ text: sentence.slice(cut), style: { dimColor: true } })
  return out
}

/** The rows for a draw, top to bottom: the sentence, a rule, then one row per line of the text. */
export function drawRows(draw: Draw, Text: MakeText, columns = 80): RenderNode[] {
  const sentence = sentencePieces(draw.sentence).flatMap((piece, k) => nodes(Text, `s${k}`, piece.text, piece.style))
  const rows = [
    Text({ key: 'sentence', children: sentence }),
    // 2 columns short of the width, so a margin around the dialog never wraps the rule onto a second row.
    Text({ key: 'rule', dimColor: true, children: nodes(Text, 'r', '━'.repeat(Math.max(1, columns - 2)), { dimColor: true }) }),
  ]
  const lines = tokenize(draw.text)
  const blanks = keepsBlanks(draw.text)
  lines.forEach((pieces, i) => {
    if (!pieces.map((piece) => piece.text).join('').trim()) {
      // A blank line still takes a row, which an empty string would not.
      if (blanks) rows.push(Text({ key: `l${i}`, children: ' ' }))
      return
    }
    const children = pieces.flatMap((piece: Piece, k) => nodes(Text, `t${i}-${k}`, piece.text, piece.type === 'plain' ? undefined : ACCENTS[piece.type]))
    rows.push(Text({ key: `l${i}`, children }))
  })
  return rows
}
