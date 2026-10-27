/**
 * meters.ts: the figures on the row under the prompt, and which of them fit.
 *
 * A reading goes in and the meters come out in a fixed order: model with its effort, context,
 * the 5-hour limit, the week, the cache. Each has a dim label, a value and a tone for its colour.
 * A narrow row loses whole meters, never part of one, in the order the map (20.5.0) set.
 */
import { kilo } from '../../shared/format'

export type Tone = 'plain' | 'ok' | 'warn' | 'bad'

/**
 * A piece of a value with a look of its own, such as the effort beside the model's name or the limit after the context.
 * The pieces joined are the value. No `colour` means the meter's tone colour, an empty one the terminal's own.
 */
export type Part = { text: string; colour?: string; dim?: boolean }

export type Meter = { id: 'model' | 'context' | 'five' | 'week' | 'cache'; label: string; value: string; tone: Tone; parts?: Part[] }

export type Reading = {
  model?: string
  effort?: string | number
  /** The last response's input in tokens, absent before the first response. */
  tokens?: number
  /** The wrap-up mark the context is read against, never the window. */
  limit: number
  rates: readonly { kind: string; percentUsed: number; resetsAt?: string }[]
  /** When the prompt cache goes cold, in epoch milliseconds, absent until a request has shown its lifetime. */
  coldAt?: number
}

export const SEPARATOR = ' │ '

// First to go when the row is narrow.
const DROP_ORDER: Meter['id'][] = ['cache', 'model', 'week', 'five', 'context']
// A limit shows its reset above this percent.
const RESET_ABOVE = 70
const WARN_AT = 70
const BAD_AT = 90
// The context turns amber at this share of the wrap-up mark, and red at the mark.
const CONTEXT_WARN = 2 / 3
const CACHE_WARN_MS = 5 * 60 * 1000

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** `claude-opus-5-5[1m]` as `opus 5.5`, and `Opus 5.5` the same. An id of another shape is shown as it is. */
export function modelName(id: string): string {
  return id
    .toLowerCase()
    .replace(/\[.*\]$/, '')
    .replace(/^claude-/, '')
    .replace(/-(\d+)-(\d+)(?:-\d{8})?$/, ' $1.$2')
    .replace(/-/g, ' ')
}

// A model is a clay, Claude's own brown-orange, deeper and more vivid the more powerful the model (opus is the strongest). Fable stands apart in teal.
const MODEL_COLOURS: [RegExp, string][] = [
  [/opus/i, '#f2440c'],
  [/sonnet/i, '#d97757'],
  [/haiku/i, '#eaa98a'],
  [/fable/i, '#14b8a6'],
]
// The effort runs from cool to hot and shares no hue with the models. Only an `ultra` level is purple.
const EFFORT_COLOURS: [RegExp, string][] = [
  [/^low$/, '#8b9bb4'],
  [/^medium$/, '#60a5fa'],
  [/^high$/, '#ff4d94'],
  [/^xhigh$/, '#dc2626'],
  [/^max$/, '#ff1744'],
  [/^ultra/, '#a855f7'],
]

/** The colour of a model id: its family's, the opus one for a family not listed. */
export const modelColour = (id: string) => (MODEL_COLOURS.find(([family]) => family.test(id)) ?? MODEL_COLOURS[0] as [RegExp, string])[1]

/** The colour of an effort level, or undefined for one not listed. */
export const effortColour = (effort: string | number) => EFFORT_COLOURS.find(([level]) => level.test(String(effort).toLowerCase()))?.[1]

/** Time left as `47m`, `3h12m` or `2d4h`, `0m` once it has passed. */
export function remaining(ms: number): string {
  if (ms >= DAY) return `${Math.floor(ms / DAY)}d${Math.floor((ms % DAY) / HOUR)}h`
  if (ms >= HOUR) return `${Math.floor(ms / HOUR)}h${Math.floor((ms % HOUR) / MINUTE)}m`
  return `${Math.max(0, Math.floor(ms / MINUTE))}m`
}

const limitTone = (percent: number): Tone => (percent >= BAD_AT ? 'bad' : percent >= WARN_AT ? 'warn' : 'ok')

function limitMeter(id: 'five' | 'week', label: string, rate: Reading['rates'][number], now: number): Meter {
  const percent = Math.round(rate.percentUsed)
  const at = rate.resetsAt ? Date.parse(rate.resetsAt) : NaN
  const reset = percent > RESET_ABOVE && Number.isFinite(at) ? ` ${remaining(at - now)}` : ''
  return { id, label, value: `${percent}%${reset}`, tone: limitTone(percent) }
}

/** Every meter the reading has a figure for, in display order. */
export function meters(reading: Reading, now: number): Meter[] {
  const found: Meter[] = []
  if (reading.model) {
    const name = modelName(reading.model)
    const parts: Part[] = [{ text: name, colour: modelColour(reading.model) }]
    if (reading.effort !== undefined) {
      const colour = effortColour(reading.effort)
      parts.push({ text: ` ${reading.effort}`, colour: colour ?? '' })
    }
    found.push({ id: 'model', label: '', value: parts.map((part) => part.text).join(''), tone: 'plain', parts })
  }
  if (reading.tokens !== undefined) {
    const used = reading.tokens / reading.limit
    const parts: Part[] = [{ text: kilo(reading.tokens) }, { text: `/${kilo(reading.limit)}`, dim: true }]
    found.push({ id: 'context', label: 'context', value: parts.map((part) => part.text).join(''), tone: used >= 1 ? 'bad' : used >= CONTEXT_WARN ? 'warn' : 'ok', parts })
  }
  const five = reading.rates.find((rate) => rate.kind === 'five_hour')
  if (five) found.push(limitMeter('five', '5h', five, now))
  const week = reading.rates.find((rate) => rate.kind === 'seven_day')
  if (week) found.push(limitMeter('week', 'week', week, now))
  if (reading.coldAt !== undefined) {
    const left = reading.coldAt - now
    found.push({ id: 'cache', label: 'cache', value: left > 0 ? remaining(left) : 'cold', tone: left <= 0 ? 'bad' : left <= CACHE_WARN_MS ? 'warn' : 'ok' })
  }
  return found
}

/** A meter's width in cells. */
export const widthOf = (meter: Meter) => meter.label.length + (meter.label ? 1 : 0) + meter.value.length

/** The meters that fit in `columns`, whole ones dropped in the map's order. */
export function fit(all: readonly Meter[], columns: number): Meter[] {
  const kept = [...all]
  const total = () => kept.reduce((sum, meter) => sum + widthOf(meter), 0) + SEPARATOR.length * Math.max(0, kept.length - 1)
  for (const id of DROP_ORDER) {
    if (total() <= columns) break
    const at = kept.findIndex((meter) => meter.id === id)
    if (at >= 0) kept.splice(at, 1)
  }
  return kept
}
