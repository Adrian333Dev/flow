import type { EngineInterface } from 'claude-code'
import { describe, expect, test } from 'claude-code/testing'
import { flush } from '../../shared/testing'
import { cancel, closeWarm, HIT, judge, keepWarmCommand, keepWarmSettings, LEAD, LOOK, MARGIN, MAX_IDLE, MAX_PINGS, noteActive, noteBroken, noteTranscript, planOf, SPACING, tick, type Deps, type Facts } from './keepwarm'

const MINUTE = 60 * 1000
const T0 = Date.parse('2026-10-24T10:00:00Z')

const facts = (over: Partial<Facts> = {}, warm: Partial<Facts['warm']> = {}): Facts => ({
  now: T0,
  warm: { on: true, pings: 0, ...warm },
  busy: false,
  request: { at: T0, lifetime: 60 * MINUTE },
  lead: LEAD,
  maxIdle: MAX_IDLE,
  ...over,
})

/** The request `ago` minutes before `T0`. */
const requested = (ago: number, lifetime = 60 * MINUTE) => ({ at: T0 - ago * MINUTE, lifetime })

describe('the plan', () => {
  test('is idle while the switch is off', () => {
    expect(planOf(facts({}, { on: false }))).toEqual({ do: 'idle', why: 'off' })
  })

  test('is idle while a turn, a restart or a helper agent runs', () => {
    expect(planOf(facts({ busy: true, request: requested(58) })).do).toBe('idle')
  })

  test('is idle before a reply has written a cache', () => {
    expect(planOf(facts({ request: undefined })).do).toBe('idle')
    expect(planOf(facts({ request: { at: T0 } })).do).toBe('idle')
  })

  test('waits for the due time, at most LOOK at a time', () => {
    expect(planOf(facts({ request: requested(0) }))).toEqual({ do: 'wait', ms: LOOK })
    expect(planOf(facts({ request: requested(50) }))).toEqual({ do: 'wait', ms: 7 * MINUTE })
  })

  test('pings once the due time has come: LEAD before the cache goes cold', () => {
    expect(planOf(facts({ request: requested(57) }))).toEqual({ do: 'ping' })
    expect(planOf(facts({ request: requested(56) })).do).toBe('wait')
  })

  test('moves the due time later when the user kept working, though the transcript is behind', () => {
    // The transcript shows a request 58 minutes ago, which alone would ping. A turn ended 1 minute ago.
    expect(planOf(facts({ request: requested(58) }, { activeAt: T0 - MINUTE })).do).toBe('wait')
  })

  test('counts a ping that hit as the cache’s newest renewal', () => {
    expect(planOf(facts({ request: requested(58) }, { warmedAt: T0 - MINUTE })).do).toBe('wait')
  })

  test('never pings a cache that has lapsed, or is about to', () => {
    expect(planOf(facts({ request: requested(61) }))).toMatchObject({ do: 'idle', why: 'the cache has lapsed' })
    expect(planOf(facts({ request: { at: T0 - 60 * MINUTE + MARGIN - 1, lifetime: 60 * MINUTE } })).do).toBe('idle')
    expect(planOf(facts({ request: { at: T0 - 60 * MINUTE + MARGIN + 1000, lifetime: 60 * MINUTE } })).do).toBe('ping')
  })

  test('never pings a cache a model switch or a restart emptied, until a new request writes it', () => {
    expect(planOf(facts({ request: requested(58) }, { brokenAt: T0 - MINUTE })).do).toBe('idle')
    expect(planOf(facts({ request: requested(58) }, { brokenAt: T0 - 59 * MINUTE })).do).toBe('ping')
    // The user's next turn renews the cache after the switch.
    expect(planOf(facts({ request: requested(30) }, { brokenAt: T0 - 31 * MINUTE })).do).toBe('wait')
  })

  test('stops after the idle limit, from the user’s last work', () => {
    const idle = MAX_IDLE / MINUTE
    expect(planOf(facts({ now: T0 + idle * MINUTE, request: { at: T0, lifetime: 60 * MINUTE } }, { warmedAt: T0 + idle * MINUTE - MINUTE })).do).toBe('idle')
    expect(planOf(facts({ now: T0 + 3 * 60 * MINUTE, maxIdle: MAX_IDLE }, { warmedAt: T0 + 3 * 60 * MINUTE - 5 * MINUTE })).do).toBe('wait')
  })

  test('stops at MAX_PINGS for one request, and counts again for the next', () => {
    expect(planOf(facts({ request: requested(57) }, { pings: MAX_PINGS, period: T0 - 57 * MINUTE })).do).toBe('idle')
    expect(planOf(facts({ request: requested(57) }, { pings: MAX_PINGS, period: T0 - 90 * MINUTE })).do).toBe('ping')
  })

  test('leaves SPACING between two pings', () => {
    expect(planOf(facts({ request: requested(57) }, { attemptAt: T0 - 10 * 1000 }))).toEqual({ do: 'wait', ms: SPACING - 10 * 1000 })
    expect(planOf(facts({ request: requested(57) }, { attemptAt: T0 - SPACING })).do).toBe('ping')
  })

  test('with a 5-minute cache pings at half its life at the latest', () => {
    expect(planOf(facts({ request: requested(2.4, 5 * MINUTE) })).do).toBe('wait')
    expect(planOf(facts({ request: requested(2.6, 5 * MINUTE) })).do).toBe('ping')
  })
})

describe('the settings', () => {
  test('default to 3 minutes and 4 hours, the local file winning', () => {
    expect(keepWarmSettings()).toEqual({ lead: 3 * MINUTE, maxIdle: 4 * 60 * MINUTE })
    expect(keepWarmSettings('{"keepWarmLead":5,"keepWarmMaxIdle":2}', '{"keepWarmLead":1}')).toEqual({ lead: MINUTE, maxIdle: 2 * 60 * MINUTE })
    expect(keepWarmSettings('{"keepWarmLead":-1,"keepWarmMaxIdle":"x"}')).toEqual({ lead: 3 * MINUTE, maxIdle: 4 * 60 * MINUTE })
    expect(keepWarmSettings('not json')).toEqual({ lead: 3 * MINUTE, maxIdle: 4 * 60 * MINUTE })
  })
})

const usage = (read: number, creation = 20, input = 30) => ({ input_tokens: input, output_tokens: 2, cache_read_input_tokens: read, cache_creation_input_tokens: creation })
const answered = (read: number, creation?: number) => ({ isAnswered: true, text: 'ok', usage: usage(read, creation) }) as never

describe('the verdict', () => {
  test('a ping is a hit when the cache served at least HIT of the prompt', () => {
    expect(judge(answered(150000))).toEqual({ hit: true, read: 150000, total: 150050 })
    const total = 100000
    expect(judge({ isAnswered: true, text: 'ok', usage: usage(total * HIT, 0, total * (1 - HIT)) } as never).hit).toBe(true)
    expect(judge({ isAnswered: true, text: 'ok', usage: usage(total * HIT - 1000, 0, total * (1 - HIT) + 1000) } as never).hit).toBe(false)
  })

  test('a reply with no words still counts when the cache served the prompt', () => {
    expect(judge({ isAnswered: false, reason: 'empty-reply', usage: usage(150000) } as never).hit).toBe(true)
  })

  test('a cold cache, an API error, an abort and nothing to fork are each a miss with a reason', () => {
    expect(judge(answered(0, 150000))).toEqual({ hit: false, reason: 'the cache was cold: it served 0k of 150k' })
    expect(judge({ isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded', usage: usage(0, 0, 0) } as never)).toEqual({ hit: false, reason: 'the API refused the ping (overloaded)' })
    expect(judge({ isAnswered: false, reason: 'aborted', usage: usage(0, 0, 0) } as never)).toEqual({ hit: false, reason: 'the ping got no reply (aborted)' })
    expect(judge({ isAnswered: false, reason: 'nothing-to-fork' } as never)).toEqual({ hit: false, reason: 'there was nothing to fork yet' })
  })
})

/** The engine beneath the mod, in memory: state with versions, a clock whose timers the test moves, a transcript whose newest request the test sets, a fork that answers as told. */
function world(opts: { tail?: number; fork?: () => unknown } = {}) {
  cancel()
  let now = T0
  const timers: { at: number; fn: () => void; live: boolean }[] = []
  const values = new Map<string, { value: unknown; version: number }>()
  const seen = { tail: opts.tail ?? T0, forks: 0, busy: false, logs: [] as string[], toasts: [] as string[], warmed: [] as number[], fork: opts.fork ?? (() => answered(150000)) }
  const keyOf = (ref: { plugin: string; key: string }) => `${ref.plugin}.${ref.key}`
  const $ = {
    state: {
      get: async (ref: { plugin: string; key: string }) => values.get(keyOf(ref)) ?? { value: undefined, version: 0 },
      set: async (ref: { plugin: string; key: string }, value: unknown, options?: { ifVersion?: number }) => {
        const held = values.get(keyOf(ref)) ?? { value: undefined, version: 0 }
        if (options?.ifVersion !== undefined && options.ifVersion !== held.version) return { isSet: false, version: held.version }
        values.set(keyOf(ref), { value, version: held.version + 1 })
        return { isSet: true, version: held.version + 1 }
      },
    },
    clock: {
      now: async () => now,
      after: (ms: number, fn: () => void) => {
        const timer = { at: now + ms, fn, live: true }
        timers.push(timer)
        return { cancel: () => void (timer.live = false) }
      },
    },
    env: { get: async (name: string) => ({ FLOW_HOME: '/h/.flow', HOME: '/h' })[name] },
    fs: { read: async () => Promise.reject(new Error('no such file')) },
    process: {
      run: async () => {
        const line = JSON.stringify({
          type: 'assistant',
          timestamp: new Date(seen.tail).toISOString(),
          message: { model: 'claude-test', usage: { input_tokens: 5, cache_read_input_tokens: 150000, cache_creation_input_tokens: 10, cache_creation: { ephemeral_1h_input_tokens: 10 } } },
        })
        return { exitCode: 0, stdout: `${line}\n`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false }
      },
    },
    model: { fork: async () => (seen.forks++, seen.fork()) },
    ui: { log: (text: string) => void seen.logs.push(text), toast: (text: string) => void seen.toasts.push(text) },
  } as unknown as EngineInterface
  const clock = {
    /** Moves the time on, firing each timer that falls due on the way, in order. */
    advance: async (ms: number) => {
      const end = now + ms
      for (;;) {
        const next = timers.filter((t) => t.live && t.at <= end).sort((a, b) => a.at - b.at)[0]
        if (!next) break
        next.live = false
        now = Math.max(now, next.at)
        next.fn()
        await flush()
      }
      now = end
      await flush()
    },
    settle: flush,
  }
  const deps: Deps = { busy: async () => seen.busy, warmed: async (coldAt) => void seen.warmed.push(coldAt) }
  return { $, clock, seen, deps }
}

describe('the pings', () => {
  test('one ping a cache life, each judged, with the countdown set from the hit', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    expect(await keepWarmCommand($, deps, 'on')).toMatch(/^Keep-warm is on: next ping in 57 min, 0 pings sent/)
    await clock.advance(56 * MINUTE)
    expect(seen.forks).toBe(0)
    await clock.advance(2 * MINUTE)
    expect(seen.forks).toBe(1)
    expect(seen.warmed).toEqual([T0 + 57 * MINUTE + 60 * MINUTE])
    // The next one is due 57 minutes after the hit.
    await clock.advance(55 * MINUTE)
    expect(seen.forks).toBe(1)
    await clock.advance(4 * MINUTE)
    expect(seen.forks).toBe(2)
  })

  test('a miss turns the switch off, says why, and sends no second ping', async () => {
    const { $, clock, seen, deps } = world({ fork: () => answered(0, 150000) })
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(5 * 60 * MINUTE)
    expect(seen.forks).toBe(1)
    expect(seen.toasts.join()).toContain('cache was cold')
    expect(seen.warmed).toEqual([])
    expect(await keepWarmCommand($, deps, 'status')).toMatch(/^Keep-warm is off: the cache was cold/)
  })

  test('a fork that throws is a miss too', async () => {
    const { $, clock, seen, deps } = world({ fork: () => ({ isAnswered: false, reason: 'api-error', status: null, error: 'unknown', usage: usage(0, 0, 0) }) })
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(2 * 60 * MINUTE)
    expect(seen.forks).toBe(1)
    expect(await keepWarmCommand($, deps, 'status')).toContain('Keep-warm is off')
  })

  test('sends nothing while a turn, a restart or a helper agent runs', async () => {
    const { $, clock, seen, deps } = world()
    seen.busy = true
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(3 * 60 * MINUTE)
    expect(seen.forks).toBe(0)
  })

  test('a user who keeps working moves the due time: the timer wakes, finds a newer request, and sends nothing', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(50 * MINUTE)
    // A turn begins and ends 50 minutes in: the transcript shows its request, and the turn's own tick runs.
    cancel()
    seen.tail = T0 + 50 * MINUTE
    await noteActive($)
    await tick($, deps)
    await clock.advance(55 * MINUTE)
    expect(seen.forks).toBe(0)
    await clock.advance(5 * MINUTE)
    expect(seen.forks).toBe(1)
  })

  test('a timer left from before the user came back does not ping while the turn runs', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(50 * MINUTE)
    // The turn started and has not ended; its start cancels the timer, and a timer that survived finds the turn busy.
    seen.busy = true
    await clock.advance(30 * MINUTE)
    expect(seen.forks).toBe(0)
  })

  test('never pings a cache that already lapsed', async () => {
    const { $, clock, seen, deps } = world({ tail: T0 - 61 * MINUTE })
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(3 * 60 * MINUTE)
    expect(seen.forks).toBe(0)
  })

  test('two ticks at once send one ping', async () => {
    const { $, clock, seen, deps } = world({ tail: T0 - 58 * MINUTE })
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, { ...deps, busy: async () => true }, 'on')
    await Promise.all([tick($, deps), tick($, deps)])
    await clock.settle()
    expect(seen.forks).toBe(1)
  })

  test('a model switch or a restart ends the pings until the next request writes the cache', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(20 * MINUTE)
    await noteBroken($)
    await clock.advance(3 * 60 * MINUTE)
    expect(seen.forks).toBe(0)
    // The user's next turn writes the cache again.
    cancel()
    seen.tail = T0 + 3 * 60 * MINUTE + 20 * MINUTE
    await clock.advance(MINUTE)
    await noteActive($)
    await tick($, deps)
    await clock.advance(58 * MINUTE)
    expect(seen.forks).toBe(1)
  })

  test('stops after the idle limit and starts again with the next turn', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(10 * 60 * MINUTE)
    expect(seen.forks).toBeLessThanOrEqual(5)
    const before = seen.forks
    await clock.advance(3 * 60 * MINUTE)
    expect(seen.forks).toBe(before)
    expect(await keepWarmCommand($, deps, 'status')).toMatch(/^Keep-warm is on, waiting: idle past the limit/)
  })

  test('a reload that loses the timer plans again from the state the host kept', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    cancel()
    await clock.advance(70 * MINUTE)
    expect(seen.forks).toBe(0)
    seen.tail = T0 + 70 * MINUTE
    await tick($, deps)
    await clock.advance(58 * MINUTE)
    expect(seen.forks).toBe(1)
  })
})

describe('closing the session', () => {
  test('stops the timer and turns the switch off, so no ping follows and a new session starts off', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    await keepWarmCommand($, deps, 'on')
    await clock.advance(20 * MINUTE)
    await closeWarm($)
    await clock.advance(5 * 60 * MINUTE)
    expect(seen.forks).toBe(0)
    expect(await keepWarmCommand($, deps, 'status')).toBe('Keep-warm is off.')
  })
})

describe('the command', () => {
  test('on, off and no word (which toggles)', async () => {
    const { $, clock, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    expect(await keepWarmCommand($, deps, '')).toMatch(/^Keep-warm is on/)
    expect(await keepWarmCommand($, deps, '')).toBe('Keep-warm is off.')
    await clock.advance(3 * 60 * MINUTE)
    expect(seen.forks).toBe(0)
    expect(await keepWarmCommand($, deps, 'ON')).toMatch(/^Keep-warm is on/)
    expect(await keepWarmCommand($, deps, 'off')).toBe('Keep-warm is off.')
    expect(await keepWarmCommand($, deps, 'maybe')).toBe('Use /keepwarm on, off, status or ping.')
  })

  test('on before any reply says it waits', async () => {
    const { $, deps } = world()
    expect(await keepWarmCommand($, deps, 'on')).toBe('Keep-warm is on, waiting: no reply has written a cache yet. 0 pings sent.')
  })

  test('ping sends one fork now and reports the figures, leaving the switch as it is', async () => {
    const { $, seen, deps } = world()
    await noteTranscript($, '/t.jsonl')
    expect(await keepWarmCommand($, deps, 'ping')).toBe('Hit: the cache served 150k of 150k tokens.')
    expect(seen.forks).toBe(1)
    expect(await keepWarmCommand($, deps, 'status')).toBe('Keep-warm is off.')
    expect(await keepWarmCommand($, deps, 'ping')).toBe('Not sent: a ping went out less than a minute ago.')
  })

  test('ping reports a miss without turning anything off, and refuses while busy', async () => {
    const { $, seen, deps } = world({ fork: () => answered(0, 150000) })
    await noteTranscript($, '/t.jsonl')
    expect(await keepWarmCommand($, deps, 'ping')).toBe('Miss: the cache was cold: it served 0k of 150k.')
    seen.busy = true
    expect(await keepWarmCommand($, deps, 'ping')).toMatch(/^Not sent: a turn/)
    expect(seen.forks).toBe(1)
  })
})
