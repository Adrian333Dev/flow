/**
 * pane.ts: the logic of the permission dialog, with no call to the engine.
 *
 * What the dialog says, folds and cuts, what the draw needs, and the verdict of a
 * refusal that the second hook (`classic.PermissionRequest`) answers from.
 * Both live in module state: the draw is keyed by the exact question text, the
 * verdict by the tool and what it touches, since that hook sees no call id.
 */
import type { PermissionRequestDecision } from 'claude-code'
import { mainField } from './headline'

/** The dialog cuts its question at 2000 characters with a bare `…`, so the mod cuts first. */
const MAX_QUESTION = 1999
/** A sentence plus 11 lines of command fit the 12 rows the engine lets a draw use. */
const MAX_COLOUR_LINES = 11
const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const OWN_ID = 'toolu_plugin_'
const NOBODY = 'No one is here to ask. Choose another way, or stop.'

export type Shown = {
  /** The text given to `$.ui.ask`: the sentence, a blank line, the text. */
  question: string
  sentence: string
  /** The text as shown, with the notice of what was cut on its last line. */
  text: string
  cut: boolean
}

/** Ends a text the mod cut. No count: the user only needs to know that not all of it shows. */
const CUT_NOTICE = '… the rest is not shown'

/**
 * The question for a sentence and the text beneath it. A text too long for the
 * dialog is cut on a line, or where one line stands when no break fits, and
 * ends with a line saying the rest is not shown.
 */
export function questionText(sentence: string, text: string): Shown {
  const full = `${sentence}\n\n${text}`
  if (full.length <= MAX_QUESTION) return { question: full, sentence, text, cut: false }
  const room = Math.max(0, MAX_QUESTION - sentence.length - 2 - 1 - CUT_NOTICE.length)
  const head = text.slice(0, room)
  const newline = head.lastIndexOf('\n')
  const shown = `${newline < 0 ? head : head.slice(0, newline)}\n${CUT_NOTICE}`
  return { question: `${sentence}\n\n${shown}`, sentence, text: shown, cut: true }
}

const nonBlank = (text: string) => text.split('\n').filter((line) => line.trim()).length

/** Whether the draw keeps the blank lines: each costs a row, so only while every line fits. */
export const keepsBlanks = (text: string) => text.split('\n').length <= MAX_COLOUR_LINES

/** Whether the draw can carry the text in colour: nothing cut, and 11 lines or fewer, not counting the blank ones. */
export const drawsInColour = (shown: Shown) => !shown.cut && nonBlank(shown.text) <= MAX_COLOUR_LINES

/**
 * A command too long to colour whole, folded: up to its 11th non-blank line,
 * with `…` ending that line. Undefined for a command that fits.
 */
export function foldedText(text: string): string | undefined {
  if (nonBlank(text) <= MAX_COLOUR_LINES) return undefined
  const lines = text.split('\n')
  let seen = 0
  let end = 0
  for (; end < lines.length; end++) if (lines[end]!.trim() && ++seen === MAX_COLOUR_LINES) break
  return `${lines.slice(0, end + 1).join('\n')}…`
}

export type Draw = {
  sentence: string
  text: string
  colour: boolean
  /** The question the dialog is rewritten to. */
  asks: string
}

const draws = new Map<string, { draw: Draw; open: number }>()

/** Keeps what the draw needs while the dialog is open. Two asks with the same text share one entry. */
export function rememberDraw(question: string, draw: Draw): void {
  const kept = draws.get(question)
  if (kept) kept.open++
  else draws.set(question, { draw, open: 1 })
}

export const recallDraw = (question: string): Draw | undefined => draws.get(question)?.draw

export function forgetDraw(question: string): void {
  const kept = draws.get(question)
  if (!kept) return
  if (--kept.open <= 0) draws.delete(question)
}

/** The mod's own question carries a `toolu_plugin_` id, the model's own a `toolu_` one. */
export const isOwnQuestion = (requestId: string) => requestId.startsWith(OWN_ID)

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
  return { behavior: 'deny', message: `The user did not allow this call and wrote: "${verdict.note}". Read it and answer it.` }
}

/** What an ask answers where no one can: a deny the agent reads, with no interrupt. */
export const nobodyReason = () => NOBODY

type Decided = { decision: string; hook?: string; rule?: string }

/**
 * A core ask on a write under a `.claude` folder, with no guard reason and no
 * settings rule behind it. Claude Code asks for every such write, and the
 * mod's allow is the only way to remove that ask.
 */
export function isAutoAllow(tool: string, input: unknown, decided: Decided): boolean {
  if (decided.decision !== 'ask' || decided.hook === 'PreToolUse' || decided.rule !== undefined) return false
  if (!WRITE_TOOLS.has(tool)) return false
  return /(^|\/)\.claude\//.test(mainField(input) ?? '')
}
