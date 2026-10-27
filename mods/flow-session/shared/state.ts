/**
 * state.ts: the session state 2 or more features read. The host holds the atoms, so a hot reload
 * loses none of them. The validator follows an atom only in the file declaring it, so every read
 * and change goes through the functions here.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'
import type { Entry, Tracked } from './types'

const tracked = atom({ plugin: 'flow-session', key: 'tracked' } as const, { asked: [] } as Tracked)
const band = atom({ plugin: 'flow-session', key: 'band' } as const, [] as Entry[])

/** What the restart keeps word for word, the turn it ends and the restart itself. */
export async function readTracked($: EngineInterface): Promise<Tracked> {
  return read($, tracked)
}

export async function updateTracked($: EngineInterface, change: (t: Tracked) => Tracked): Promise<void> {
  await update($, tracked, change)
}

/** The band's badges: the tickets the session works. */
export async function readBand($: EngineInterface): Promise<Entry[]> {
  return read($, band)
}

export async function updateBand($: EngineInterface, change: (entries: Entry[]) => Entry[]): Promise<void> {
  await update($, band, change)
}

// The helper agents running now: their `turn.start` seen, their `turn.complete` not. A restart waits for them.
const helpers = new Set<string>()

export const helperStarted = (id: string) => void helpers.add(id)
export const helperEnded = (id: string) => void helpers.delete(id)
export const helpersRunning = () => helpers.size

// False for `claude -p`. Unknown after a hot reload, which counts as somebody.
let interactive: boolean | undefined

export const setInteractive = (value: boolean) => void (interactive = value)
export const nobodyThere = () => interactive === false
