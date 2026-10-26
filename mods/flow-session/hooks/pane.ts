/**
 * pane.ts: the logic of the permission dialog, with no call to the engine.
 *
 * How an answer reads, which asks the mod allows itself, and the verdict of a
 * refusal that the second hook (`classic.PermissionRequest`) answers from. The
 * verdict lives in module state, keyed by the tool and what it touches, since
 * that hook sees no call id.
 */
import type { PermissionRequestDecision } from 'claude-code'
import { mainField } from './headline'

const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const NOBODY = 'No one is here to ask. Choose another way, or stop.'

export type Answer = 'allow' | 'refuse' | 'note'

/** The answer by its label. Any other text came from the typed row. */
export const classify = (label: string): Answer => (label === 'Allow' ? 'allow' : label === 'Refuse' ? 'refuse' : 'note')

export type Verdict = { interrupt: true } | { interrupt: false; note: string }

const verdicts = new Map<string, Verdict>()

/** Tool and what it touches. The second hook has the tool's input but no call id. */
export const verdictKey = (tool: string, input: unknown) => `${tool}\n${mainField(input) ?? JSON.stringify(input ?? {})}`

export const storeVerdict = (key: string, verdict: Verdict) => void verdicts.set(key, verdict)

/** The verdict for a call, removed as it is read. */
export function takeVerdict(key: string): Verdict | undefined {
  const verdict = verdicts.get(key)
  verdicts.delete(key)
  return verdict
}

/** A refusal stops the turn. A typed note denies without stopping, and the agent reads the note. */
export function denyFor(verdict: Verdict): PermissionRequestDecision {
  if (verdict.interrupt) return { behavior: 'deny', message: 'The user refused this call.', interrupt: true }
  return { behavior: 'deny', message: `The user refused this call and wrote: "${verdict.note}".` }
}

/** What an ask answers where no one can: a deny the agent reads, with no interrupt. */
export const nobodyReason = () => NOBODY

type Decided = { decision: string; hook?: string; rule?: string }

// A loaded mod's folder is protected like `.claude`. The manifests stay asked: they decide which hooks load.
const MOD_FOLDER = /(^|\/)mods\/flow-session\//
const MOD_MANIFEST = /(^|\/)mods\/flow-session\/(\.claude-plugin\/plugin\.json|hooks\/hooks\.json)$/

/**
 * A core ask on a write under a `.claude` folder, or from the main agent under
 * this mod's folder bar its manifests, with no guard reason and no settings
 * rule behind it. Claude Code asks for every such write, and the mod's allow
 * is the only way to remove that ask.
 */
export function isAutoAllow(tool: string, input: unknown, decided: Decided, agentId?: string): boolean {
  if (decided.decision !== 'ask' || decided.hook === 'PreToolUse' || decided.rule !== undefined) return false
  if (!WRITE_TOOLS.has(tool)) return false
  const file = mainField(input) ?? ''
  if (/(^|\/)\.claude\//.test(file)) return true
  return agentId === undefined && MOD_FOLDER.test(file) && !MOD_MANIFEST.test(file)
}

/** Files whose guard ask got a yes this session. Lost on a restart, which asks again. */
const covered = new Set<string>()

/** The file a write asked about by the guard touches, or undefined for any other ask. */
export function guardedWrite(tool: string, input: unknown, decided: Decided): string | undefined {
  if (decided.decision !== 'ask' || decided.hook !== 'PreToolUse' || !WRITE_TOOLS.has(tool)) return undefined
  return mainField(input)
}

export const isCovered = (file: string) => covered.has(file)

export const cover = (file: string) => void covered.add(file)
