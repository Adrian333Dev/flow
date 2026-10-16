/**
 * ask.ts: what the mod asks of the agent when a session restarts.
 *
 * The wrap-up line and `/restart` give the same steps, then the instructions
 * for the start message. The handoff step is asked only while no handoff
 * stands, since the mod knows whether work changed after the last one.
 */

/** The instructions for the start message, under the Flow home. The handoff skill owns the file. */
export const INSTRUCTIONS_PATH = 'repos/flow/skills/tools/handoff/references/start-message.md'

const FALLBACK =
  'Open the start message with what to load first, then where the work stands, what comes next, and any question waiting on the user.'

/** The file's text, or a one-line fallback while the file cannot be read, so a restart never stops on it. */
export function startInstructions(text: string | undefined): string {
  return text?.trim() || FALLBACK
}

/** The wrap-up line's steps, a sentence tail: subagents, the handoff when none stands, then the tool. */
export function restartSteps(handoffFresh: boolean): string {
  const handoff = handoffFresh ? '' : 'run /flow:handoff, '
  return `wait for running subagents, ${handoff}then call the restart tool with a start message`
}

/** A line of the wrap-up or the ask, with the start message's instructions beneath it. */
export function withInstructions(line: string, instructions: string): string {
  return `${line}\n\n${instructions}`
}

/** What `/restart` tells the agent. */
export function restartAsk(handoffFresh: boolean, extra: string, instructions: string): string {
  const handoff = handoffFresh ? '' : 'run /flow:handoff, then '
  const lines = [
    withInstructions(`The user asked to restart this session now. Wait for running subagents, ${handoff}call the restart tool with a start message.`, instructions),
  ]
  if (extra.trim()) lines.push(`The user adds: ${extra.trim()}`)
  return lines.join('\n\n')
}
