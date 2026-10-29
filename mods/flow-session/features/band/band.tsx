/**
 * band.tsx: the band above the prompt, one badge for each ticket the session works.
 *
 * A badge is the ticket's id and short name in black on `#ffb703`, joined to its word and
 * count on the terminal's background plus 7% of that colour. The band is one row: it ends with a
 * green Restart button, shown between turns from `LEAD` under the wrap-up limit (button.ts), and the issue count in red.
 * A ticket lights only when `flow tickets start <id>` picks it up, and then sits leftmost; `flow tickets get` reads it again whenever a
 * command or an edit touches it, and for every badge at once at each turn's end. For as long as a turn runs, the badge
 * the session works (the leftmost open one) shows a pale bar 3 cells wide moving along
 * it and a spinner turning after its word; `band-settings.json` switches either off. The rules
 * for joining and leaving are in band-model.ts; this file only feeds them and draws the result.
 *
 * register.ts calls these from its own hooks: a mod's hooks on one event are one hook,
 * and the validator follows `on` only where it is spelled out.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderElement, RenderInput, SessionAppendInput, ToolCallInput, TurnCompleteInput, TurnStartInput } from 'claude-code'

import { reasonOf } from '../../shared/format'
import { flowHome, modFolder, readText } from '../../shared/home'
import { readBand, updateBand } from '../../shared/state'
import { describeScenario, parseMock, parseScenarios, usage, withActing, type Scenario } from './mock/band-mock'
import { GAP, RESTART, RESTART_GAP, SPIN_CELLS, apply, currentId, layout, mix, setActing, spinnerAt, waveShares, type Badge } from './band-model'
import { failureFiles, openIssues } from './issues'
import { DEFAULT_LOOK, parseLook, type Look } from './look'
import { restartOffered } from '../meters/meters-row'
import { isExpired, isRecordKey, makeRecord, parseRecord, recordKey } from './record'
import { idsIn, idsInPath, readTicket, readTickets, startedIn, target, ticketPrefix } from '../../shared/ticket'

const issues = atom({ plugin: 'flow-session', key: 'issues' } as const, 0)
const frame = atom({ plugin: 'flow-session', key: 'frame' } as const, 0)

const ORANGE = '#ffb703'
const GREEN = '#22c55e'
const RED = '#ef4444'
const BLACK = '#000000'
const WHITE = '#ffffff'
// How far toward white the wave's centre cell goes: pale enough to stay behind black text.
const WASH = 0.75
// The terminal's background is not readable from a mod, so the status part mixes with this one.
const TERMINAL = '#16191d'
const WAVE_MS = 70
const FILE_TOOL = /^(Read|Edit|Write|MultiEdit|NotebookEdit)$/

// True from the main session's turn start to its end. A hot reload starts it over as false.
let turnRunning = false
let wave: { cancel: () => void } | undefined
// Which working signs show, read from `band-settings.json` at session start and at each turn's start.
let look: Look = DEFAULT_LOOK
// The test band `/band` shows in place of the real one. It is never saved: a hot reload, a restart,
// `/band off` and the next turn's start all clear it. `mockActing` puts the signs on its open badges.
let mock: { name: string; scenario: Scenario } | undefined
let lastMock: string | undefined
let mockActing = false

/** What a tool call names: ticket ids, and which of them `flow tickets start` picks up, which lights. The call's fields sit on the event itself. */
async function namedBy($: EngineInterface, tool: string, call: object): Promise<{ ids: string[]; started: string[] }> {
  const fields = call as { command?: unknown; file_path?: unknown }
  if (tool === 'Bash' && typeof fields.command === 'string') {
    const command = fields.command
    if (!/\bflow\b|\bfw\s/.test(command)) return { ids: [], started: [] }
    const started = startedIn(command, /\bstart\s+\d/.test(command) ? await prefixOf($) : undefined)
    return { ids: [...new Set([...idsIn(command), ...started])], started }
  }
  if (FILE_TOOL.test(tool) && typeof fields.file_path === 'string' && fields.file_path.includes('/tickets/')) {
    return { ids: idsInPath(fields.file_path, await prefixOf($)), started: [] }
  }
  return { ids: [], started: [] }
}

/**
 * The project's ticket prefix: `ticketPrefix` in `.flow/settings.json`, else the word its folder
 * offers (`offerWord` in scripts/features/tickets/store.ts, which this repeats: the mod cannot require it).
 */
async function prefixOf($: EngineInterface): Promise<string | undefined> {
  const root = await $.session.root()
  const valid = (word: string | undefined): word is string => word !== undefined && /^[a-z]{2,8}$/.test(word) && word !== 'home'
  // A settings file that does not parse falls back to the folder's word, as the scripts do.
  const saved = ticketPrefix(await readText($, `${root}/.flow/settings.json`))
  if (valid(saved)) return saved
  const letters = (root.split('/').filter(Boolean).pop() ?? '').toLowerCase().replace(/[^a-z]/g, '')
  const word = letters.length <= 8 ? letters : letters.slice(0, 3)
  return valid(word) ? word : 'flow'
}

/** A ticket's folder: `tickets/<n>` or `tickets/<n>-<words>`, open or in `tickets/archive/`. An id of another place has none here. */
async function folderOf($: EngineInterface, id: string): Promise<string | undefined> {
  const [, word, number] = /^([a-z]+)-(\d+)$/.exec(id) ?? []
  if (!number || word !== (await prefixOf($))) return undefined
  const tickets = `${await $.session.root()}/.flow/tickets`
  for (const dir of [tickets, `${tickets}/archive`]) {
    const entries = await $.fs.list(dir).catch(() => [])
    const found = entries.find((entry) => entry.kind === 'dir' && (entry.name === number || entry.name.startsWith(`${number}-`)))
    if (found) return `${dir}/${found.name}`
  }
  return undefined
}

/**
 * A click on a badge opens the ticket in VS Code through `code`. The name opens `ticket.md`;
 * the word opens the file at the open list its word names (ticket.ts `target`), asked of `flow` as it is now.
 */
async function openTicket($: EngineInterface, id: string, atWord: boolean): Promise<void> {
  const folder = await folderOf($, id)
  if (!folder) return
  const file = `${folder}/ticket.md`
  let path = file
  if (atWord) {
    const [json] = await readTickets($, [id], await $.session.root())
    const found = json && target(json, readTicket(json).word)
    if (found) path = `${found.file === 'map' ? `${folder}/groundwork/map.md` : file}:${found.line}`
  }
  const result = await $.process.run(atWord ? ['code', '-g', path] : ['code', path], { timeoutMs: 10000 })
  if (result.exitCode !== 0) $.ui.log(`opening ${id} failed: ${result.stderr.trim() || `code exited ${result.exitCode}`}`)
}

/**
 * Reads the tickets of this project again, all in one `flow` process, and puts each on the band.
 * `lit` are the ids `flow tickets start` picked up: they go leftmost. An id of another place has no ticket here.
 */
async function refresh($: EngineInterface, ids: readonly string[], lit: readonly string[] = []): Promise<void> {
  const prefix = await prefixOf($)
  const mine = ids.filter((id) => /^([a-z]+)-\d+$/.exec(id)?.[1] === prefix)
  for (const json of await readTickets($, mine, await $.session.root())) {
    const ticket = readTicket(json)
    await updateBand($, (entries) => apply(entries ?? [], ticket, lit.includes(ticket.id)))
  }
}

/** A failure of the saved record, put in the log so a band that never comes back is not silent. */
function lost($: EngineInterface, what: string, error: unknown): void {
  $.ui.log(`band ${what} failed: ${reasonOf(error)}`)
}

/** Writes the band to this session's record. A lost write is rewritten at the next turn's end. */
async function save($: EngineInterface): Promise<void> {
  const entries = await readBand($)
  await $.store.set(recordKey(await $.session.id()), makeRecord(entries, new Date()))
}

/** Deletes the records nobody has written for 14 days, and any key that holds no record. */
async function prune($: EngineInterface): Promise<void> {
  const now = new Date()
  for (const key of (await $.store.keys()).filter(isRecordKey)) {
    if (isExpired(await $.store.get(key), now)) await $.store.delete(key)
  }
}

/**
 * Puts the saved band back after a reopen, each ticket read again from its file: one that is
 * done turns green, one parked or dropped leaves. A hot reload keeps `$.state`, so a band
 * already there is left as it is.
 */
async function restore($: EngineInterface): Promise<void> {
  if ((await readBand($)).length) return
  const saved = parseRecord(await $.store.get(recordKey(await $.session.id())))
  if (!saved?.band.length) return
  await updateBand($, () => saved.band)
  await refresh($, saved.band.map((entry) => entry.id)).catch(() => undefined)
  $.ui.log(`band restored: ${saved.band.length} from ${saved.updated}`)
}

/** Starts or stops the wave's timer: one frame every 70 ms while any badge shown is acting and a sign is on. */
async function runWave($: EngineInterface): Promise<void> {
  const shown = mock ? withActing(mock.scenario.entries, mockActing) : await readBand($)
  const anyActing = (look.sweep || look.spinner) && shown.some((entry) => entry.acting)
  if (anyActing && !wave) wave = $.clock.every(WAVE_MS, () => void update($, frame, (n) => (n ?? 0) + 1).catch(() => undefined))
  if (!anyActing && wave) {
    wave.cancel()
    wave = undefined
  }
}

/** Puts the signs on the badge the session works while a turn runs, and takes them off every badge otherwise. */
async function pointWave($: EngineInterface): Promise<void> {
  await updateBand($, (entries) => setActing(entries ?? [], turnRunning ? currentId(entries ?? []) : undefined))
  await runWave($)
}

async function clearMock($: EngineInterface): Promise<void> {
  mock = undefined
  mockActing = false
  await runWave($)
  await update($, frame, (n) => (n ?? 0) + 1)
}

/** Reads `band-settings.json` in the mod folder, so an edit shows from the next turn. */
async function readLook($: EngineInterface): Promise<void> {
  const dir = await modFolder($)
  look = parseLook(dir ? await readText($, `${dir}/features/band/band-settings.json`) : undefined)
}

/** The scenarios in `band-scenarios.json` beside the mod's manifest, read afresh. */
async function readScenarios($: EngineInterface): Promise<{ scenarios: Record<string, Scenario>; error?: string }> {
  const dir = await modFolder($)
  if (!dir) return { scenarios: {}, error: 'The mod folder is not in CLAUDE_CODE_PLUGIN_DIRS, so band-scenarios.json cannot be found.' }
  const file = `${dir}/features/band/mock/band-scenarios.json`
  const text = await readText($, file)
  return text === undefined ? { scenarios: {}, error: `No scenarios file at ${file}.` } : parseScenarios(text)
}

/** `/band`: shows a test scenario in place of the real band, or puts the real one back. `clear` empties the real band. Returns the reply. */
export async function bandMock($: EngineInterface, args: string): Promise<string> {
  const word = args.trim().toLowerCase()
  if (word === 'off') {
    await clearMock($)
    return 'Band shows the real tickets.'
  }
  if (word === 'clear') {
    // The saved record is emptied too, or a reopen would bring the badges back.
    await updateBand($, () => [])
    await clearMock($)
    await save($).catch((error) => lost($, 'save', error))
    return 'Band emptied. `flow tickets start <id>` lights a ticket again.'
  }
  const { scenarios, error } = await readScenarios($)
  if (error) return error
  const names = Object.keys(scenarios)
  const command = parseMock(args, names, mock?.name, lastMock)
  if ('help' in command) return usage(names)
  if ('list' in command) return names.map((name, i) => describeScenario(`${i + 1} ${name}`, scenarios[name] as Scenario)).join('\n')
  if ('acting' in command) {
    if (!names.length) return usage(names)
    if (mock) mockActing = !mockActing
    else {
      // After a reopen no scenario is shown: `act` shows the last one, or the first, with the signs on.
      const name = lastMock && scenarios[lastMock] ? lastMock : (names[0] as string)
      mock = { name, scenario: scenarios[name] as Scenario }
      lastMock = name
      mockActing = true
    }
    await readLook($)
  } else if ('show' in command) {
    mock = { name: command.show, scenario: scenarios[command.show] as Scenario }
    lastMock = command.show
  } else {
    await clearMock($)
    return 'Band shows the real tickets.'
  }
  await runWave($)
  await update($, frame, (n) => (n ?? 0) + 1)
  return `Band shows scenario ${names.indexOf(mock?.name ?? '') + 1}, ${mock?.name}${mockActing ? ', act' : ''}.`
}

async function countIssues($: EngineInterface): Promise<void> {
  const texts = await Promise.all(failureFiles(await flowHome($), new Date()).map((file) => readText($, file)))
  await update($, issues, () => openIssues(texts.filter((text): text is string => text !== undefined)))
}

/** The session is ready: registers `/band`, reads the settings, puts the saved band back and counts the open issues. */
export async function bandStart($: EngineInterface): Promise<void> {
  await $.command
    .register({ name: 'band', description: 'Switch the test band on or off: /band, /band <number>, next, list, act, off. /band clear empties the real band.' })
    .catch(() => undefined)
  await readLook($).catch(() => undefined)
  await restore($).catch((error) => lost($, 'restore', error))
  await prune($).catch((error) => lost($, 'prune', error))
  await countIssues($).catch(() => undefined)
}

/** A turn began: the main session's puts the signs on the badge it works, and ends a test band. */
export async function bandTurnStart($: EngineInterface, e: TurnStartInput): Promise<void> {
  if (e.agentId !== undefined) return
  turnRunning = true
  if (mock) await clearMock($).catch(() => undefined)
  await readLook($).catch(() => undefined)
  await pointWave($).catch(() => undefined)
}

/**
 * Runs a tool call. `run` is the call itself; the tickets it names are read again after it.
 * A `flow tickets start <id>` makes that ticket the one the session works.
 */
export async function bandToolCall<R>($: EngineInterface, e: ToolCallInput, run: () => Promise<R>): Promise<R> {
  const { ids, started } = await namedBy($, e.tool, e)
  try {
    return await run()
  } finally {
    // The call has run: the file says what it did.
    await touched($, ids, started)
  }
}

/** Tickets a command named were changed or looked at: reads them again, and one picked up by `flow tickets start` goes leftmost and is the one the session works. */
async function touched($: EngineInterface, ids: string[], started: string[]): Promise<void> {
  await refresh($, ids, started).catch(() => undefined)
  if (!ids.length) return
  await pointWave($).catch(() => undefined)
  await save($).catch((error) => lost($, 'save', error))
}

// The command the person last ran with `!`. Its output row comes after the command has run, and that row is the cue.
let shell: string | undefined
// `flow [start|done|park|drop] [fw-]137`, or `fw` for `flow`: the person may type the number alone.
const SHELL_FLOW = /\b(?:flow|fw)\s+(?:(start|done|park|drop)\s+)?(?:[a-z]+-)?(\d+)\b/

/**
 * A row was added to the conversation. The person's own `!` commands raise no tool call, so a
 * `flow` command typed that way is read here: the `<bash-input>` row keeps the command, the
 * `<bash-stdout>` row after it says the command is done and names the ticket in full.
 */
export async function bandShell($: EngineInterface, e: SessionAppendInput): Promise<void> {
  if (e.agentId !== undefined) return
  const text = e.message.content.map((block) => (typeof block.text === 'string' ? block.text : '')).join('')
  const input = /<bash-input>([\s\S]*?)<\/bash-input>/.exec(text)
  if (input) {
    shell = input[1]
    return
  }
  if (!shell || !text.includes('<bash-stdout>')) return
  const command = shell
  shell = undefined
  const named = SHELL_FLOW.exec(command)
  if (!named) return
  const [, verb, number] = named
  const ids = idsIn(text).filter((id) => id.endsWith(`-${number}`))
  const tickets = ids.length ? ids : idsIn(command)
  await touched($, tickets, verb === 'start' ? tickets : [])
}

/** A turn ended: every badge is read again from its file, the signs stop, and the issue count is read again. */
export async function bandTurnComplete($: EngineInterface, e: TurnCompleteInput): Promise<void> {
  if (e.agentId !== undefined) return
  turnRunning = false
  await refresh($, (await readBand($).catch(() => [])).map((entry) => entry.id)).catch(() => undefined)
  await pointWave($).catch(() => undefined)
  await save($).catch((error) => lost($, 'save', error))
  await countIssues($).catch(() => undefined)
}

/**
 * The band's rows, or what the engine drew where there is nothing to show. `restartSession`
 * is what a press of the Restart button does; the button shows between turns from `LEAD` under the wrap-up limit.
 */
export async function drawBand(
  $: EngineInterface,
  e: RenderInput<'AbovePrompt'>,
  next: (e: RenderInput<'AbovePrompt'>) => Promise<RenderElement>,
  restartSession: () => void,
): Promise<RenderElement> {
  const scenario = mock?.scenario
  const entries = scenario ? withActing(scenario.entries, mockActing) : await readBand($)
  const open = scenario ? scenario.issues : await read($, issues)
  const restart = scenario ? scenario.restart : await restartOffered($, turnRunning)
  const tick = await read($, frame)
  if (e.props.hasSurvey || (!entries.length && !open && !restart)) return next(e)

  const elements = $.ui.resolve(e)
  const { Box, Button, Text } = elements
  const row = layout(entries, scenario?.columns ?? e.props.bodyColumns, open, look.spinner, restart)

  // Each badge is one plain Button, so the engine's own hover and pointer zone apply.
  const drawBadge = (badge: Badge, at: number) => {
    const colour = badge.isDone ? GREEN : ORANGE
    const dark = mix(TERMINAL, colour, 0.07)
    const waves = badge.acting && look.sweep
    const spins = badge.acting && look.spinner
    const shares = waves ? waveShares(badge.name.length + badge.status.length + (spins ? SPIN_CELLS : 0), tick) : undefined
    // While the wave runs each letter of the name has its own background. On the status and the
    // spinner only the bar's centre cell shows, in the badge's colour with black text.
    const lit = (at: number) => shares?.[at] === 1
    const name = shares
      ? [...badge.name].map((letter, i) => (
          <Text key={`n${i}`} color={BLACK} backgroundColor={mix(colour, WHITE, (shares[i] ?? 0) * WASH)}>
            {letter}
          </Text>
        ))
      : [
          <Text key="name" color={BLACK} backgroundColor={colour}>
            {badge.name}
          </Text>,
        ]
    const status = shares
      ? [...badge.status].map((letter, i) => {
          const on = lit(badge.name.length + i)
          return (
            <Text key={`s${i}`} color={on ? BLACK : colour} backgroundColor={on ? colour : dark}>
              {letter}
            </Text>
          )
        })
      : [
          <Text key="status" color={colour} backgroundColor={dark}>
            {badge.status}
          </Text>,
        ]
    const press = (atWord: boolean) => () => void openTicket($, badge.id, atWord).catch((error) => lost($, 'open', error))
    // A badge shown as its id alone has no status, so its right corner takes the badge's own colour.
    return [
      at ? <Text key={`gap-${badge.id}`}>{' '.repeat(GAP)}</Text> : '',
      <Button key={`badge-${badge.id}`} plain onPress={press(false)}>
        <Text color={colour}>▐</Text>
        {name}
      </Button>,
      <Button key={`word-${badge.id}`} plain onPress={press(true)}>
        {status}
        {spins
          ? [' ', spinnerAt(tick)].map((cell, i) => {
              const on = lit(badge.name.length + badge.status.length + i)
              return (
                <Text key={`p${i}`} color={on ? BLACK : colour} backgroundColor={on ? colour : dark}>
                  {cell}
                </Text>
              )
            })
          : ''}
        <Text color={badge.status ? dark : colour}>▌</Text>
      </Button>,
    ]
  }

  return (
    <Box marginTop={look.topRow ? 1 : 0}>
      {row.badges.flatMap((badge, at) => drawBadge(badge, at))}
      {row.folded ? <Text dimColor> +{row.folded}</Text> : ''}
      {row.restart || row.issues ? <Text>{' '.repeat(row.space)}</Text> : ''}
      {row.restart ? (
        <Button key="restart" plain onPress={restartSession}>
          <Text color={GREEN}>▐</Text>
          <Text color={BLACK} backgroundColor={GREEN}>
            {RESTART}
          </Text>
          <Text color={GREEN}>▌</Text>
        </Button>
      ) : (
        ''
      )}
      {row.restart && row.issues ? <Text>{' '.repeat(RESTART_GAP)}</Text> : ''}
      {row.issues ? <Text color={RED}>{row.issues}</Text> : ''}
    </Box>
  )
}
