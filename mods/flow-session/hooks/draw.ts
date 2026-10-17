/**
 * draw.ts: the rows drawn above the permission dialog, in colour.
 *
 * The sentence is bold yellow. A one-line command is cyan. A script keeps cyan
 * and adds three accents: strings (a here-doc's body too) green, comments dim,
 * control words and operators magenta. Named colours only, so the terminal's
 * theme picks the shade.
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
import { tokenize, type Piece, type PieceType } from './tokenize'

export type MakeText = (props: { key?: string; color?: string; bold?: boolean; dimColor?: boolean; children?: RenderNode | RenderNode[] }) => RenderNode

const ACCENTS: Record<Exclude<PieceType, 'plain'>, { color?: string; dimColor?: boolean }> = {
  string: { color: 'green' },
  comment: { dimColor: true },
  control: { color: 'magenta' },
}

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

/** A piece as children of its line: a short one as it is, a long one as one `Text` per chunk. */
function nodes(Text: MakeText, key: string, piece: Piece): RenderNode[] {
  const style = piece.type === 'plain' ? undefined : ACCENTS[piece.type]
  if (piece.text.length <= MAX_WIDTH) return [style ? Text({ key, ...style, children: piece.text }) : piece.text]
  return chunks(piece.text).map((chunk, n) => Text({ key: `${key}-${n}`, ...style, children: chunk }))
}

/** The rows for a draw, top to bottom: the sentence, then one row per line of the text. */
export function drawRows(draw: Draw, Text: MakeText): RenderNode[] {
  const rows = [Text({ key: 'sentence', bold: true, color: 'yellow', children: draw.sentence })]
  const lines = tokenize(draw.text)
  const blanks = keepsBlanks(draw.text)
  lines.forEach((pieces, i) => {
    const whole = pieces.map((piece) => piece.text).join('')
    if (!whole.trim()) {
      // A blank line still takes a row, which an empty string would not.
      if (blanks) rows.push(Text({ key: `l${i}`, color: 'cyan', children: ' ' }))
      return
    }
    const children =
      lines.length === 1
        ? nodes(Text, `t${i}`, { text: whole, type: 'plain' })
        : pieces.flatMap((piece, k) => nodes(Text, `t${i}-${k}`, piece))
    rows.push(Text({ key: `l${i}`, color: 'cyan', children }))
  })
  return rows
}
