/**
 * paths.ts: what a tool call touches, as the entries in list.ts test it: its file, its command, the kind of file.
 */
import { CODE_EXTENSIONS } from './shell-write'

/** A tool call as the response holds it: its tool and parsed arguments. */
export type Call = { tool: string; input: Record<string, unknown> }

export const pathOf = (call: Call) => (typeof call.input.file_path === 'string' ? call.input.file_path : '')
export const commandOf = (call: Call) => (call.tool === 'Bash' && typeof call.input.command === 'string' ? call.input.command : '')
export const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1)
/** What a call is logged by: its file, else its command's first line. */
export const labelOf = (call: Call) => pathOf(call) || commandOf(call).split('\n', 1)[0]!.slice(0, 100)
/** True for a `Read`, `Edit` or `Write` of a file. */
export const touches = (call: Call) => ['Read', 'Edit', 'Write'].includes(call.tool) && pathOf(call) !== ''
export const markdown = (call: Call) => touches(call) && pathOf(call).endsWith('.md')
export const code = (call: Call) => touches(call) && new RegExp(`\\.(${CODE_EXTENSIONS.join('|')})$`).test(pathOf(call))
/** The edit log's own files, which mirror the paths they log and are no loaded files. */
export const inEditLog = (call: Call) => /\/lab\/edit-log\//.test(pathOf(call))
