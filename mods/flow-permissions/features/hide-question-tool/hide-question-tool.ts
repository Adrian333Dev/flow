/**
 * hide-question-tool.ts: the agent never sees `AskUserQuestion`, and never gets to call it.
 *
 * A settings deny would remove the tool, and with it the permission dialog, which `$.ui.ask` opens
 * as an `AskUserQuestion` call. So the tool stays registered and is hidden in 3 places instead:
 * its schema moves behind ToolSearch, its name leaves the list of deferred tools, and a call the
 * model makes anyway is refused. A mod's own `$.ui.ask` is never refused.
 */
import type { On } from 'claude-code'

export const TOOL = 'AskUserQuestion'

export const REFUSAL = 'Never call this. Ask the user in plain text in your reply.'

/** The list of deferred tools without the hidden tool's line, the rest unchanged. */
export const withoutTool = (text: string): string =>
  text
    .split('\n')
    .filter((line) => line.trim() !== TOOL)
    .join('\n')

export function hideQuestionTool(on: On): void {
  on('tool.describe', { tool: TOOL }, (_$, e) => ({ ...e, description: REFUSAL, isDeferred: true }))

  on('prompt.attachment', { type: 'deferred_tools_delta' }, async (_$, e, next) => {
    const sent = await next(e)
    return sent.text === null ? sent : { text: withoutTool(sent.text) }
  })

  // The model's own call is raised by the engine. A mod's `$.ui.ask` names the mod.
  on('tool.check', { tool: TOOL }, (_$, e, next) =>
    next.origin.plugin === 'engine' ? { decision: 'deny' as const, reason: REFUSAL } : next(e),
  )
}
