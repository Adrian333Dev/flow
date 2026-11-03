/**
 * check-command.ts: `/triggers-check`, for the user alone, with no model request. Whether each
 * trigger fired in time in this window, and with `--windows <n>` the windows before it too.
 *
 * 2 sources, joined by time: the session's transcript, split into windows at each compaction, and
 * the load log (`log.ts`). Each line is one firing, or one act a trigger should have covered:
 *
 * - `ok`: sent beside the read that matched, or with a result, a mention, a skill.
 * - `LATE`: sent only once the act it guards was made, a held call.
 * - `MISSED`: an edit or a held kind of call ran while a guide its entry sends was out of the window.
 * - `FAILED`: fired, and what it sends broke.
 *
 * A miss no check recognizes stays invisible: the chat score (`engine/message.ts`, to come) adds its own lines.
 */
import type { EngineInterface } from 'claude-code'
import { reasonOf } from '../../shared/format'
import { flowHome, readText } from '../../shared/home'
import { monthPath } from '../../shared/log'
import { transcriptPath } from '../keepwarm/keepwarm'
import { type Call, nameOf, pathOf } from './checks/paths'
import { keysOf } from './engine/held'
import { holds } from './engine/response'
import { entriesFor } from './list'
import { ATTACHED, keyOf } from './sends/guides'

/** A transcript row as the scan prints it: a window's start, a prompt, a tool call, a tool's result, the guides a hook attached to a result. */
export type Row =
  | { k: 'w'; t: string }
  | { k: 'p'; t: string }
  | { k: 'u'; t: string; id: string; n: string; i: Record<string, unknown> }
  | { k: 'r'; t: string; id: string; e: boolean; a: string[] }
  | { k: 'a'; t: string; a: string[] }

/** A load log line, as `log.ts` writes it. */
export type LogLine = { at: string; session: string; id: string; by: string; file?: string; sent: string[]; error?: string; score?: number }

/**
 * Streams the transcript at `argv[1]`, the main thread alone, and prints the rows of its last
 * `argv[2]` windows as `Row` JSON lines. A turn is a new `promptId`. Tool inputs keep only what
 * the checks read, and a result only the guides attached to it, so a 240 MB transcript prints little.
 */
const SCAN = String.raw`
const fs = require('fs'), readline = require('readline')
const keep = Math.max(1, Number(process.argv[2]))
const windows = [[]], prompts = new Set()
const attached = new RegExp(${JSON.stringify(ATTACHED.source)}, 'g')
const textOf = (c) => typeof c === 'string' ? c : Array.isArray(c) ? c.map((b) => typeof b === 'string' ? b : b.text ?? textOf(b.content)).join('\n') : ''
readline.createInterface({ input: fs.createReadStream(process.argv[1]), crlfDelay: Infinity })
  .on('line', (line) => {
    let r
    try { r = JSON.parse(line) } catch { return }
    if (r.isSidechain) return
    const t = r.timestamp ?? ''
    if (r.type === 'system' && r.subtype === 'compact_boundary') {
      windows.push([{ k: 'w', t }])
      if (windows.length > keep) windows.shift()
      return
    }
    const rows = windows[windows.length - 1]
    // Text a hook adds to a result is its own row, never inside the tool_result.
    if (r.type === 'attachment' && r.attachment?.type === 'hook_additional_context') {
      const a = [...textOf(r.attachment.content).matchAll(attached)].map((m) => m[1])
      if (a.length) rows.push({ k: 'a', t, a })
      return
    }
    if (r.type === 'user' && r.promptId && !prompts.has(r.promptId)) { prompts.add(r.promptId); rows.push({ k: 'p', t }) }
    const c = r.message?.content
    if (!Array.isArray(c)) return
    for (const b of c) {
      if (r.type === 'assistant' && b.type === 'tool_use') {
        const i = {}
        for (const key of ['file_path', 'command', 'offset', 'limit']) if (b.input?.[key] !== undefined) i[key] = b.input[key]
        rows.push({ k: 'u', t, id: b.id, n: b.name, i })
      }
      if (r.type === 'user' && b.type === 'tool_result') rows.push({ k: 'r', t, id: b.tool_use_id, e: b.is_error === true, a: [...textOf(b.content).matchAll(attached)].map((m) => m[1]) })
    }
  })
  .on('close', () => process.stdout.write(windows.flat().map((row) => JSON.stringify(row)).join('\n')))
`

/** A file's name, or a command's first words. */
const shown = (file: string | undefined) => (!file ? '' : file.startsWith('/') ? nameOf(file) : file.slice(0, 40))

/** The guide or file a sent thing names, short. */
const sentName = (sent: string) => (sent.startsWith('guides/') || sent.startsWith('/') ? nameOf(sent) : sent.slice(0, 40))

type Line = { id: string; what: string; status: 'ok' | 'LATE' | 'MISSED' | 'FAILED'; at: string }

/** The report for the scanned rows and the session's log lines, newest window first. */
export function checkReport(rows: readonly Row[], log: readonly LogLine[]): string {
  const windows: Row[][] = []
  for (const row of rows) {
    if (row.k === 'w' || !windows.length) windows.push([])
    windows.at(-1)!.push(row)
  }
  if (!windows.length) return 'No window to check.'
  const parts = windows.map((rows, n) => {
    const start = rows[0]!.t
    const end = windows[n + 1]?.[0]?.t ?? '￿'
    const prompts = rows.filter((r) => r.k === 'p').map((r) => r.t)
    const turnAt = (t: string) => Math.max(1, prompts.filter((p) => p <= t).length)
    const lines: Line[] = []
    for (const l of log.filter((l) => l.at >= start.slice(0, 19) && l.at < end)) {
      const sent = l.sent.length ? `sent ${l.sent.map(sentName).join(', ')}` : 'its guides read in the same response'
      const turn = turnAt(l.at)
      if (l.error) lines.push({ id: l.id, what: `${shown(l.file)} turn ${turn} · ${l.error}`, status: 'FAILED', at: l.at })
      else if (l.by === 'held') lines.push({ id: l.id, what: `${shown(l.file)} held turn ${turn} · ${sent}`, status: 'LATE', at: l.at })
      else lines.push({ id: l.id, what: `${shown(l.file)} ${l.by} turn ${turn} · ${sent}`, status: 'ok', at: l.at })
    }
    // The walk: the keys the window holds as each call is answered, and the held kinds of calls that ran without theirs.
    const keys = new Set<string>()
    const calls = new Map<string, Call>()
    for (const row of rows) {
      if (row.k === 'u') calls.set(row.id, { tool: row.n, input: row.i })
      if (row.k === 'a') for (const guide of row.a) keys.add(`read:guides/${guide}`)
      if (row.k !== 'r') continue
      for (const guide of row.a) keys.add(`read:guides/${guide}`)
      const call = calls.get(row.id)
      if (!call || row.e) continue
      const entries = entriesFor(call)
      if (holds(call, entries)) {
        const missing = entries.flatMap((entry) => entry.send(call)).filter((send) => !keys.has(keyOf(send)))
        if (missing.length)
          lines.push({
            id: entries[0]!.id,
            what: `${shown(pathOf(call) || String(call.input.command ?? call.tool))} ran turn ${turnAt(row.t)} · ${missing.map((s) => sentName(s.tool === 'Read' ? s.path : s.command)).join(', ')} never in the window`,
            status: 'MISSED',
            at: row.t,
          })
      }
      for (const key of keysOf(call)) keys.add(key)
    }
    lines.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
    const back = windows.length - 1 - n
    const label = back === 0 ? 'this window' : `${back} window${back === 1 ? '' : 's'} back`
    const head = `${label}, turns 1-${prompts.length}`
    if (!lines.length) return `${head}: nothing fired, nothing missed.`
    const idWidth = Math.max(...lines.map((l) => l.id.length))
    const whatWidth = Math.max(...lines.map((l) => l.what.length))
    return [`${head}:`, '', ...lines.map((l) => `${l.id.padEnd(idWidth)}  ${l.what.padEnd(whatWidth)}  ${l.status}`)].join('\n')
  })
  return parts.reverse().join('\n\n')
}

/** The windows asked for: `--windows <n>`, 1 by default. */
export function windowsArg(args: string): number | undefined {
  const m = args.trim().match(/^(?:--windows\s+(\d+))?$/)
  return m ? Number(m[1] ?? 1) : undefined
}

/** The session's log lines from the month files of the transcript's span: this month and the one before. */
async function logLines($: EngineInterface, session: string): Promise<LogLine[]> {
  const home = await flowHome($)
  const now = new Date()
  const before = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const out: LogLine[] = []
  for (const at of [before, now]) {
    for (const line of ((await readText($, monthPath(home, 'triggers', at))) ?? '').split('\n')) {
      try {
        const parsed = JSON.parse(line) as LogLine
        if (parsed.session === session) out.push(parsed)
      } catch {
        // A line cut by a crash holds nothing.
      }
    }
  }
  return out
}

export async function registerTriggersCheck($: EngineInterface): Promise<void> {
  await $.command
    .register({ name: 'triggers-check', description: 'Whether each guide and trigger fired in time in this window. --windows <n> adds the windows before it. No model request.' })
    .catch(() => undefined)
}

/** What `/triggers-check` answers. */
export async function triggersCheck($: EngineInterface, args: string): Promise<string> {
  const windows = windowsArg(args)
  if (windows === undefined) return 'Usage: /triggers-check [--windows <n>]'
  const session = await $.session.id()
  const named = await transcriptPath($).catch(() => undefined)
  const path = named ?? `${await $.env.get('HOME')}/.claude/projects/${(await $.session.root()).replace(/[^A-Za-z0-9]/g, '-')}/${session}.jsonl`
  const ran = await $.process.run(['node', '-e', SCAN, path, String(windows)], { timeoutMs: 120_000 })
  if (ran.exitCode !== 0) return `The transcript ${path} could not be read: ${ran.stderr.trim().split('\n').at(-1) ?? ''}`
  try {
    const rows = ran.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Row)
    return `/triggers-check\n\n${checkReport(rows, await logLines($, session))}`
  } catch (error) {
    return `The check failed: ${reasonOf(error)}`
  }
}
