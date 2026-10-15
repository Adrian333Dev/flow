/**
 * note.ts: which mentioned files are notes left for another session.
 *
 * `/flow:handoff` writes a note for a session that was not here into
 * `.flow/handoffs/`. The session that opens it reads it as a mention, and the
 * mod removes the file once that turn ends with an answer.
 */

/** True for a file under the session's `.flow/handoffs/`. A path with `..` in it never counts. */
export function isNote(root: string, path: string): boolean {
  const base = `${root.replace(/\/+$/, '')}/.flow/handoffs/`
  return path.startsWith(base) && path.length > base.length && !path.includes('/../')
}
