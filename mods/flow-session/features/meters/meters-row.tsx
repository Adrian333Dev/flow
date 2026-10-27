/**
 * meters-row.tsx: the meters row under the prompt, fed by the session's figures and the transcript's end.
 *
 * `session.measure` brings the context and the rate limits. The effort and cache lifetime are in no
 * mod call, so each turn's end reads the transcript's tail (cache.ts), which also names the model
 * exactly. Until a first reply the model comes from `$.session.model()`. A 30-second timer
 * redraws the cache countdown. The pure part (which meters, which tone, what fits) is meters.ts.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderElement, RenderInput, SessionMeasureInput } from 'claude-code'

import { busyWith } from '../restart/button'
import { coldAt, lastRequest, transcriptTail } from '../../shared/cache'
import { flowSettings } from '../../shared/settings'
import { readTracked } from '../../shared/state'
import { SEPARATOR, fit, meters, type Tone } from './meters'
import { offersRestart, wrapUpSettings } from '../wrap-up/wrap-up'

const reading = atom({ plugin: 'flow-session', key: 'meters' } as const, { limit: 170000, rates: [], beat: 0 })

// Whether `wrapUp` is on in `~/.flow/settings.json`, read with the limit. Off, the band offers no restart.
let wrapUpOn = true

const TONES: Record<Tone, string | undefined> = { plain: undefined, ok: '#22c55e', warn: '#ffb703', bad: '#ef4444' }
const BEAT_MS = 30 * 1000

let beat: { cancel: () => void } | undefined

/** The session is ready: starts the 30-second redraw once, and reads the wrap-up limit. */
export async function metersStart($: EngineInterface): Promise<void> {
  if (!beat) beat = $.clock.every(BEAT_MS, () => void update($, reading, (r) => ({ ...r, beat: r.beat + 1 })).catch(() => undefined))
  await readLimit($).catch(() => undefined)
}

async function readLimit($: EngineInterface): Promise<void> {
  const { wrapUp, limit } = wrapUpSettings(...(await flowSettings($)))
  wrapUpOn = wrapUp
  await update($, reading, (r) => ({ ...r, limit }))
}

/**
 * True when the band offers the Restart button (see `offersRestart`). `turnRunning` is the band's own
 * flag. Reading the figures and the restart state here redraws the band as they move.
 */
export async function restartOffered($: EngineInterface, turnRunning: boolean): Promise<boolean> {
  const { tokens, limit } = await read($, reading)
  return offersRestart(tokens, limit, wrapUpOn, busyWith(await readTracked($), turnRunning))
}

/**
 * The context and the limits, pushed after each main turn and when a limit moves a point. During a
 * restart the figure is the old conversation's, so the context stays hidden.
 */
export async function metersMeasure($: EngineInterface, e: SessionMeasureInput): Promise<void> {
  const { restart } = await readTracked($)
  const tokens = restart ? undefined : e.context.tokens
  await update($, reading, (r) => ({ ...r, tokens, rates: e.rateLimits }))
}

/**
 * The context as the session has it now. `session.measure` comes only after a main turn, so a long
 * turn would show the old figure. No figure yet (just after a compaction) leaves the meter as it is.
 */
export async function metersRefresh($: EngineInterface): Promise<void> {
  const tokens = (await $.session.usage().catch(() => undefined))?.context.tokens
  if (tokens !== undefined) await update($, reading, (r) => (r.tokens === tokens ? r : { ...r, tokens }))
}

/** Hides the context meter until a response gives a figure: the old one belongs to a conversation that is gone. */
export async function metersClear($: EngineInterface): Promise<void> {
  await update($, reading, ({ tokens: _, ...r }) => r)
}

/** The model was switched: the name changes at once, and the cache of the old model is gone. The effort stays until the next request shows it. */
export async function metersSwitch($: EngineInterface, model: string): Promise<void> {
  await update($, reading, (r) => ({ ...r, model, coldAt: Date.now() }))
}

/** A keep-warm ping hit: the cache goes cold at `coldAt`. A fork is not in the transcript, so the countdown is set here. */
export async function metersWarmed($: EngineInterface, coldAt: number): Promise<void> {
  await update($, reading, (r) => ({ ...r, coldAt }))
}

/** The session started or a turn ended: the model, effort and cache countdown come from the transcript's end. */
export async function metersRead($: EngineInterface, transcript: string): Promise<void> {
  const tail = await transcriptTail($, transcript)
  if (tail === undefined) return
  const request = lastRequest(tail)
  // A session with no reply yet has no request, so the model comes from the session itself.
  const model = request?.model ?? ((await $.session.model().catch(() => undefined)) || undefined)
  await update($, reading, (r) => ({ ...r, model, effort: request?.effort, coldAt: coldAt(request) }))
}

// The footer's mode label (`⏵⏵ accept edits on`) and its gap, which the row shares.
const MODE_COLUMNS = 26

/** The meters in place of the engine's hint line, which keeps the mode label before it. The engine's line shows until a figure is known. */
export async function drawMeters(
  $: EngineInterface,
  e: RenderInput<'PromptHint'>,
  next: (e: RenderInput<'PromptHint'>) => Promise<RenderElement>,
): Promise<RenderElement> {
  const { beat: _beat, ...now } = await read($, reading)
  const columns = (e.viewport?.columns ?? 100) - MODE_COLUMNS
  const shown = fit(meters(now, Date.now()), columns)
  if (!shown.length) return next(e)

  const { Box, Text } = $.ui.resolve(e)
  const cells = shown.flatMap((meter, at) => [
    at ? (
      <Text key={`bar-${meter.id}`} dimColor>
        {SEPARATOR}
      </Text>
    ) : (
      ''
    ),
    meter.label ? (
      <Text key={`label-${meter.id}`} dimColor>
        {meter.label}{' '}
      </Text>
    ) : (
      ''
    ),
    ...(meter.parts ?? [{ text: meter.value }]).map((part, i) => (
      <Text key={`value-${meter.id}-${i}`} color={(part.colour ?? TONES[meter.tone]) || undefined} dimColor={part.dim}>
        {part.text}
      </Text>
    )),
  ])
  return <Box>{cells}</Box>
}
