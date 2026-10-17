/**
 * draw.ts: the rows drawn above the permission dialog, in colour.
 *
 * The sentence is bold yellow. A one-line command is cyan. A script keeps cyan
 * and adds three accents: strings green, comments dim, control words and
 * operators magenta. Named colours only, so the terminal's theme picks the
 * shade. One `Text` per line with a nested `Text` per coloured piece costs the
 * engine 1 row per line, and it lets a sentence plus 11 lines draw.
 */
import type { RenderNode } from 'claude-code'
import type { Draw } from './pane'
import { tokenize, type PieceType } from './tokenize'

export type MakeText = (props: { key?: string; color?: string; bold?: boolean; dimColor?: boolean; children?: RenderNode | RenderNode[] }) => RenderNode

const ACCENTS: Record<Exclude<PieceType, 'plain'>, { color?: string; dimColor?: boolean }> = {
  string: { color: 'green' },
  comment: { dimColor: true },
  control: { color: 'magenta' },
}

/** The rows for a draw, top to bottom: the sentence, then one row per line of the text. */
export function drawRows(draw: Draw, Text: MakeText): RenderNode[] {
  const rows = [Text({ key: 'sentence', bold: true, color: 'yellow', children: draw.sentence })]
  const lines = tokenize(draw.text)
  lines.forEach((pieces, i) => {
    // A blank line still takes a row, which an empty string would not.
    const plain = pieces.map((piece) => piece.text).join('') || ' '
    const children =
      lines.length === 1
        ? plain
        : pieces.map((piece, k) => (piece.type === 'plain' ? piece.text : Text({ key: `t${i}-${k}`, ...ACCENTS[piece.type], children: piece.text })))
    rows.push(Text({ key: `l${i}`, color: 'cyan', children: children.length ? children : ' ' }))
  })
  return rows
}
