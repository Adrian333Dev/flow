/**
 * guides.ts: the guides the entries send, the line each comes with, and the text a shell read attaches.
 */
import { nameOf } from '../checks/paths'

/** A call an entry sends: a file to read, by its path under the Flow home or an absolute one, or a command to run. */
export type Send = { tool: 'Read'; path: string } | { tool: 'Bash'; command: string; description: string }

/** Every guide an entry sends, in Flow's `references/guides/`. */
export const GUIDES = [
  'writing.md',
  'write-loaded-files.md',
  'write-rules.md',
  'write-spec.md',
  'write-new-spec.md',
  'write-tickets.md',
  'knowledge.md',
  'write-skills.md',
  'write-code.md',
  'edit-log.md',
  'wiki.md',
  'subagents.md',
] as const
export type Guide = (typeof GUIDES)[number]
export const guides = (...names: Guide[]): Send[] => names.map((name) => ({ tool: 'Read', path: `references/guides/${name}` }))

/** True where a path is one of the guides: its own `references/guides/<name>`, in the Flow home or a checkout of Flow. */
export const isGuide = (path: string) => GUIDES.some((guide) => path.endsWith(`/references/guides/${guide}`))

/** The key a sent call is known by: a guide by its path under the home, a command by its text. */
export const keyOf = (send: Send) => (send.tool === 'Read' ? `read:${send.path}` : `bash:${send.command}`)

/** The instruction on a guide sent for a call: the file it may change, else the act. */
export const changeLine = (file: string) => `Before planning a change to ${nameOf(file)}, follow this guide.`

/** The line a guide attached to a result opens with. Its guide path is what the window check counts. */
export const attachedLine = (file: string, guide: string) => `[Auto] ${changeLine(file).replace(/\.$/, '')}, references/guides/${guide}:`
export const ATTACHED = /\[Auto\] Before planning a change to .+?, follow this guide, references\/guides\/([\w-]+\.md):/g

/** The text of each wanted guide missing from the window, after its line. A guide missing on disk is skipped. */
export async function attachGuides(read: (path: string) => Promise<string | undefined>, wanted: readonly { file: string; guide: string }[], held: ReadonlySet<string>, home: string): Promise<string[]> {
  const parts: string[] = []
  for (const { file, guide } of wanted) {
    if (held.has(`read:references/guides/${guide}`)) continue
    const text = await read(`${home}/references/guides/${guide}`)
    if (text !== undefined) parts.push(`${attachedLine(file, guide)}\n\n${text.trimEnd()}`)
  }
  return parts
}
