import type { EngineInterface } from 'claude-code'

/** A content block of a message as the API holds it: `text`, `tool_use`, `tool_result`. */
export type Block = { type: string; [field: string]: unknown }

/** A block's text: its own, or its content's, nested results joined by lines. */
export const textOf = (block: Block): string => {
  if (typeof block.text === 'string') return block.text
  if (typeof block.content === 'string') return block.content
  if (Array.isArray(block.content)) return (block.content as Block[]).map(textOf).join('\n')
  return ''
}

/** A message of a window as the API holds it. */
export type WindowMessage = { role?: string; content: string | readonly Block[] }

/** The messages in an agent's window: the main loop's where `agentId` is none. A window the session cannot read holds none. */
export async function windowMessages($: EngineInterface, agentId: string | undefined): Promise<WindowMessage[]> {
  const messages = agentId === undefined ? await $.session.messages({ as: 'api' }) : await $.session.messages({ as: 'api', agentId })
  return Array.isArray(messages) ? (messages as WindowMessage[]) : []
}
