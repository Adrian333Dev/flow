/**
 * keepwarm.ts: `/keepwarm`, a ping that renews the session's prompt cache while the user is away.
 *
 * The cache lives 1 hour (or 5 minutes) from the last request that read it. `$.model.fork` sends the
 * main thread's last request again with one tiny question, so the API serves the same prefix from the
 * cache and the clock starts over; the fork is not in the transcript. A ping is worth it where a miss
 * (the whole prefix written again, about 30 times a ping's cost) would otherwise fall on the next message.
 *
 * Safety rests on 3 rules. `planOf` is the only place that decides, from facts read fresh each time
 * (the switch, the transcript's end, the clock), and it never pings while a turn, a restart or a helper
 * agent runs, nor a cache that has lapsed, nor one the model switch or a restart emptied. Every ping
 * is judged by `cache_read_input_tokens`; the first one that is not a hit, or fails, turns the switch
 * off, so a bug costs one miss and never repeats. And a timer only wakes `tick`, which reads the facts
 * again: a user who kept working has moved the due time, so nothing is sent.
 *
 * `tick` runs at the session's start, when a main turn ends and on `/keepwarm`. `cancel` runs when a
 * main turn starts.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, ModelForkResult, Timer } from 'claude-code'
import type { Warm } from '../../shared/types'
import { lastRequest, transcriptTail, type Request } from '../../shared/cache'
import { kilo, reasonOf } from '../../shared/format'
import { flowSettings, parseObject } from '../../shared/settings'
import { helpersRunning, nobodyThere, readTracked } from '../../shared/state'
import { metersWarmed } from '../meters/meters-row'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

/** How long before the cache goes cold the ping is sent. */
export const LEAD = 3 * MINUTE
/** How long after the last request the pings stop. The next turn starts them again. */
export const MAX_IDLE = 4 * HOUR
/** Pings for one request. A cache that lives 5 minutes pings more often, and this ends it. */
export const MAX_PINGS = 12
/** Never ping a cache this close to cold: it is gone by the time the call lands. */
export const MARGIN = 10 * 1000
/** Between two pings. */
export const SPACING = 60 * 1000
/** The longest sleep. A longer wait wakes to read the facts again. */
export const LOOK = 10 * MINUTE
/** The share of the prompt the cache must serve for a ping to count as a hit. */
export const HIT = 0.9
const PROMPT = 'Reply with the single word ok.'

/** `keepWarmLead` (minutes) and `keepWarmMaxIdle` (hours) from `~/.flow/settings.json` and `settings.local.json`, the local file winning, as milliseconds. */
export function keepWarmSettings(globalText?: string, localText?: string): { lead: number; maxIdle: number } {
  const both = { ...parseObject(globalText), ...parseObject(localText) }
  const lead = Number(both.keepWarmLead)
  const maxIdle = Number(both.keepWarmMaxIdle)
  return { lead: lead > 0 ? lead * MINUTE : LEAD, maxIdle: maxIdle > 0 ? maxIdle * HOUR : MAX_IDLE }
}

export type Facts = {
  now: number
  warm: Warm
  /** A main turn, a restart or a helper agent runs, or nobody is at the prompt. */
  busy: boolean
  /** The newest request in the transcript. */
  request?: Request
  lead: number
  maxIdle: number
}

export type Plan = { do: 'idle'; why: string } | { do: 'wait'; ms: number } | { do: 'ping' }

const idle = (why: string): Plan => ({ do: 'idle', why })

/**
 * What to do now, by the first rule that holds. Idle sets no timer: the next turn's end, a restart of
 * the mod or a command starts the plan again.
 */
export function planOf(f: Facts): Plan {
  const { now, warm, request } = f
  if (!warm.on) return idle('off')
  if (f.busy) return idle('a turn, a restart or a helper agent is running')
  if (!request || request.lifetime === undefined) return idle('no reply has written a cache yet')
  const lastWork = Math.max(request.at, warm.activeAt ?? 0)
  const renewed = Math.max(lastWork, warm.warmedAt ?? 0)
  if ((warm.brokenAt ?? 0) >= renewed) return idle('a model switch or a restart emptied the cache')
  if (now - lastWork >= f.maxIdle) return idle('idle past the limit')
  const cold = renewed + request.lifetime
  if (now >= cold - MARGIN) return idle('the cache has lapsed')
  if ((warm.period === request.at ? warm.pings : 0) >= MAX_PINGS) return idle('the ping limit for this request is reached')
  const due = cold - Math.min(f.lead, request.lifetime / 2)
  if (now < due) return { do: 'wait', ms: Math.min(due - now, LOOK) }
  const since = warm.attemptAt === undefined ? SPACING : now - warm.attemptAt
  return since < SPACING ? { do: 'wait', ms: SPACING - since } : { do: 'ping' }
}

/** The result of one ping: a hit with the tokens the cache served, or why it was not one. */
export type Verdict = { hit: true; read: number; total: number } | { hit: false; reason: string }

/** A ping is a hit when the cache served nearly the whole prompt. Anything else, even a failure, is a miss. */
export function judge(r: ModelForkResult): Verdict {
  if (!('usage' in r)) return { hit: false, reason: 'there was nothing to fork yet' }
  const read = r.usage.cache_read_input_tokens
  const total = r.usage.input_tokens + read + r.usage.cache_creation_input_tokens
  if (total > 0 && read / total >= HIT) return { hit: true, read, total }
  if (!r.isAnswered && r.reason === 'api-error') return { hit: false, reason: `the API refused the ping (${r.error})` }
  if (total === 0) return { hit: false, reason: `the ping got no reply (${r.isAnswered ? 'empty' : r.reason})` }
  return { hit: false, reason: `the cache was cold: it served ${kilo(read)} of ${kilo(total)}` }
}

// The host holds the state, so a hot reload and an in-place restart keep the switch.
const warm = atom({ plugin: 'flow-session', key: 'warm' } as const, { on: false, pings: 0 } as Warm)

let timer: Timer | undefined
// Ticks run one after another: two at once would plan from the same facts.
let chain: Promise<void> = Promise.resolve()

/** What `tick` reads from the rest of the session. Tests pass their own. */
export type Deps = {
  /** True while a main turn, a restart or a helper agent runs, or nobody is at the prompt. */
  busy: () => Promise<boolean>
  /** A ping hit: the cache goes cold at `coldAt`, which the meters row shows. */
  warmed: (coldAt: number) => Promise<void>
}

async function busy($: EngineInterface): Promise<boolean> {
  if (nobodyThere() || helpersRunning() > 0) return true
  const t = await readTracked($)
  return t.turn !== undefined || t.restart !== undefined || t.requested !== undefined
}

function depsOf($: EngineInterface): Deps {
  return { busy: () => busy($), warmed: (coldAt) => metersWarmed($, coldAt) }
}

/** Stops the timer. A main turn's start calls it: the user is back. */
export function cancel(): void {
  timer?.cancel()
  timer = undefined
}

async function requestOf($: EngineInterface, transcript: string): Promise<Request | undefined> {
  const tail = await transcriptTail($, transcript)
  return tail === undefined ? undefined : lastRequest(tail)
}

async function factsOf($: EngineInterface, deps: Deps): Promise<Facts> {
  const state = await read($, warm)
  const { lead, maxIdle } = keepWarmSettings(...(await flowSettings($)))
  const request = state.transcript ? await requestOf($, state.transcript).catch(() => undefined) : undefined
  return { now: await $.clock.now(), warm: state, busy: await deps.busy(), request, lead, maxIdle }
}

/**
 * Sends one ping and judges it. `period` is the request the ping belongs to: a counted ping adds to its
 * count, and a manual one (`/keepwarm ping`) passes none. The ping is written down before the call, in
 * one atomic update that refuses a second ping inside `SPACING`, so two ticks send one.
 */
async function fire($: EngineInterface, deps: Deps, started: number, lifetime: number | undefined, period?: number): Promise<Verdict | undefined> {
  let claimed = false
  await update($, warm, (w) => {
    claimed = w.attemptAt === undefined || started - w.attemptAt >= SPACING
    if (!claimed) return w
    const counted = period === undefined ? {} : { pings: (w.period === period ? w.pings : 0) + 1, period }
    return { ...w, ...counted, attemptAt: started }
  })
  if (!claimed) return undefined
  const verdict = await $.model.fork({ prompt: PROMPT }).then(judge, (error): Verdict => ({ hit: false, reason: `the ping failed (${reasonOf(error)})` }))
  if (verdict.hit) {
    await update($, warm, (w) => ({ ...w, warmedAt: started }))
    if (lifetime !== undefined) await deps.warmed(started + lifetime).catch(() => undefined)
  }
  return verdict
}

/** A ping that was not a hit turns the switch off and says why. */
async function stop($: EngineInterface, why: string): Promise<void> {
  await update($, warm, (w) => ({ ...w, on: false, stopped: why }))
  $.ui.log(`keep-warm is off: ${why}`)
  $.ui.toast(`Keep-warm is off: ${why}`, { timeoutMs: 10000 })
}

const minutes = (ms: number) => Math.max(1, Math.round(ms / MINUTE))

async function step($: EngineInterface, deps: Deps): Promise<void> {
  cancel()
  // A ping that hits plans again once, to set the next timer. A second ping in a row would be a bug, so the loop ends there.
  for (let round = 0; round < 2; round++) {
    const f = await factsOf($, deps)
    const plan = planOf(f)
    if (plan.do === 'idle') return
    if (plan.do === 'wait') {
      timer = $.clock.after(plan.ms, () => void tick($, deps))
      return
    }
    // The facts are a moment old: a turn that began since them ends the plan.
    if (await deps.busy()) return
    const verdict = await fire($, deps, f.now, f.request?.lifetime, f.request?.at)
    if (!verdict) return
    if (!verdict.hit) return stop($, verdict.reason)
    $.ui.log(`keep-warm: cache read ${kilo(verdict.read)} of ${kilo(verdict.total)}, ping ${(await read($, warm)).pings}`)
  }
}

/** Plans from fresh facts, then sends a ping, sets the one timer or does nothing. Never throws. */
export function tick($: EngineInterface, deps: Deps): Promise<void> {
  cancel()
  const run = chain.then(() => step($, deps))
  chain = run.catch(() => undefined)
  return run.catch((error) => $.ui.log(`keep-warm could not plan: ${reasonOf(error)}`))
}

export async function replan($: EngineInterface): Promise<void> {
  await tick($, depsOf($))
}

/** A main turn started: no ping until it ends. */
export async function warmTurnStarted($: EngineInterface): Promise<void> {
  cancel()
  await noteActive($).catch(() => undefined)
}

/** A main turn ended: the plan starts again from now. */
export async function warmTurnEnded($: EngineInterface): Promise<void> {
  await noteActive($).catch(() => undefined)
  void replan($)
}

/** The session started or a turn ended: the pings read this transcript's end. */
export async function warmTranscript($: EngineInterface, transcript: string): Promise<void> {
  await noteTranscript($, transcript).catch(() => undefined)
}

export async function keepWarm($: EngineInterface, args: string): Promise<string> {
  return keepWarmCommand($, depsOf($), args)
}

export async function registerKeepWarm($: EngineInterface): Promise<void> {
  await $.command
    .register({ name: 'keepwarm', description: 'Keep this session’s prompt cache warm while you are away: /keepwarm on, off, status or ping (one test ping now).' })
    .catch(() => undefined)
}

/** The session's transcript file: the pings read its end. */
export async function noteTranscript($: EngineInterface, transcript: string): Promise<void> {
  await update($, warm, (w) => (w.transcript === transcript ? w : { ...w, transcript }))
}

/** A main turn started or ended: the cache was renewed no earlier than now, whatever the transcript shows yet. */
export async function noteActive($: EngineInterface): Promise<void> {
  const at = await $.clock.now()
  await update($, warm, (w) => ({ ...w, activeAt: at }))
}

/** The session ends (exit, /clear, resume): the timer stops and the switch goes off, so a session opened again starts with it off. */
export async function closeWarm($: EngineInterface): Promise<void> {
  cancel()
  await update($, warm, (w) => ({ ...w, on: false, stopped: undefined }))
}

/** A model switch or a restart: the cached prefix is gone until a new request writes it. */
export async function noteBroken($: EngineInterface): Promise<void> {
  const at = await $.clock.now()
  await update($, warm, (w) => ({ ...w, brokenAt: at }))
}

async function status($: EngineInterface, deps: Deps): Promise<string> {
  const f = await factsOf($, deps)
  const plan = planOf(f)
  if (!f.warm.on) return f.warm.stopped ? `Keep-warm is off: ${f.warm.stopped}.` : 'Keep-warm is off.'
  const pings = f.warm.period === f.request?.at ? f.warm.pings : 0
  const sent = `${pings} ${pings === 1 ? 'ping' : 'pings'} sent`
  if (plan.do === 'wait' && f.request?.lifetime !== undefined) {
    const next = Math.max(f.request.at, f.warm.activeAt ?? 0, f.warm.warmedAt ?? 0) + f.request.lifetime - Math.min(f.lead, f.request.lifetime / 2)
    return `Keep-warm is on: next ping in ${minutes(next - f.now)} min, ${sent}.`
  }
  return `Keep-warm is on, waiting: ${plan.do === 'idle' ? plan.why : 'about to ping'}. ${sent}.`
}

/** `/keepwarm on|off|status|ping`; no word toggles. Returns the line the command answers. */
export async function keepWarmCommand($: EngineInterface, deps: Deps, args: string): Promise<string> {
  const word = args.trim().toLowerCase()
  const on = (await read($, warm)).on
  if (word === 'status') return status($, deps)
  if (word === 'ping') return manualPing($, deps)
  if (word !== '' && word !== 'on' && word !== 'off') return 'Use /keepwarm on, off, status or ping.'
  if (word === 'off' || (word === '' && on)) {
    cancel()
    await update($, warm, (w) => ({ ...w, on: false, stopped: undefined }))
    return 'Keep-warm is off.'
  }
  await update($, warm, (w) => ({ ...w, on: true, stopped: undefined, pings: 0, period: undefined, attemptAt: undefined }))
  await tick($, deps)
  return status($, deps)
}

/** One fork now, whatever the plan says, and what it found. The probe for a lapsed cache. */
async function manualPing($: EngineInterface, deps: Deps): Promise<string> {
  if (await deps.busy()) return 'Not sent: a turn, a restart or a helper agent is running.'
  const f = await factsOf($, deps)
  const verdict = await fire($, deps, f.now, f.request?.lifetime)
  if (!verdict) return 'Not sent: a ping went out less than a minute ago.'
  if (f.warm.on) await tick($, deps)
  return verdict.hit ? `Hit: the cache served ${kilo(verdict.read)} of ${kilo(verdict.total)} tokens.` : `Miss: ${verdict.reason}.`
}
