/**
 * skill.ts: runs the `skill` entries of list.ts as a skill starts (`skill.prompt`), their text after the skill's own.
 *
 * Each is tested against the window of the agent that called the skill. Left open, both rare: a
 * skill preloaded into a subagent, and a typed skill while a background subagent's `Skill` call is
 * mid-flight, are tested against the main window.
 */
import type { EngineInterface } from 'claude-code'
import { reasonOf } from '../../../shared/format'
import { flowHome, readText } from '../../../shared/home'
import { TRIGGERS, type SkillEntry } from '../list'
import { type Firing, logFirings, textLabel } from '../log'
import { heldBy, type Held } from './held'

// The agents whose `Skill` call is running, last on top: `skill.prompt` names no agent, and fires inside the call.
const skillCallers: (string | undefined)[] = []

/** Runs a `Skill` call with its agent on top of the stack. A typed skill has no call: the main window. */
export async function inSkillCall<R>(agentId: string | undefined, run: () => Promise<R>): Promise<R> {
  skillCallers.push(agentId)
  try {
    return await run()
  } finally {
    skillCallers.splice(skillCallers.lastIndexOf(agentId), 1)
  }
}

/** A skill's text with what each `skill` entry adds after it. A failed entry adds nothing. */
export async function withSkillTriggers<R extends { text: string }>($: EngineInterface, frontmatter: unknown, out: R): Promise<R> {
  const agentId = skillCallers.at(-1)
  let held: Promise<Held> | undefined
  let text = out.text
  const firings: Firing[] = []
  const name = (frontmatter as { name?: unknown } | undefined)?.name
  const file = typeof name === 'string' ? name : undefined
  for (const entry of TRIGGERS.filter((t): t is SkillEntry => t.on === 'skill')) {
    const added = await entry
      .add({ frontmatter, held: () => (held ??= heldBy($, agentId)), home: () => flowHome($), read: (path) => readText($, path) })
      .catch((error) => {
        $.ui.log(`${entry.id} not sent: ${reasonOf(error)}`)
        firings.push({ id: entry.id, by: 'skill', file, sent: [], error: reasonOf(error) })
      })
    if (added) {
      text = `${text.trimEnd()}\n\n${added}`
      firings.push({ id: entry.id, by: 'skill', file, sent: [textLabel(added)] })
    }
  }
  logFirings($, agentId, firings)
  return text === out.text ? out : { ...out, text }
}
