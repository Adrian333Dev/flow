/**
 * viewport.ts: the terminal's width as the last drawing saw it, for a hook the engine gives no width.
 *
 * `prompt.autocomplete` carries no viewport, and its rows wrap a long description onto a
 * second line. The meters row draws on every turn and again after a resize, so it notes the
 * width here (meters-row.tsx), and the `#` list cuts its rows to it (notes.ts).
 */
let seen = 0

/** Keep the width a drawing was given. */
export function noteColumns(columns: number | undefined): void {
  if (columns && columns > 0) seen = columns
}

/** The width last seen, else 80, the width Claude Code assumes where no terminal has measured. */
export const lastColumns = (): number => seen || 80
