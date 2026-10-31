/**
 * look.ts: the band's settings from `band-settings.json` in the mod folder.
 *
 * `shown` draws the band at all: off, the badges are still kept and saved, since the restart reads
 * them. `sweep` is the pale bar running along a badge, `spinner` the braille cell after its word and
 * `topRow` the empty row above the badges. Each is on unless the file says `false`, so a missing
 * or broken file changes nothing.
 */
export type Look = { shown: boolean; sweep: boolean; spinner: boolean; topRow: boolean }

export const DEFAULT_LOOK: Look = { shown: true, sweep: true, spinner: true, topRow: true }

/** The settings in the file's text. Anything that is not `false` leaves a setting on. */
export function parseLook(text: string | undefined): Look {
  if (text === undefined) return DEFAULT_LOOK
  try {
    const raw = JSON.parse(text) as { shown?: unknown; sweep?: unknown; spinner?: unknown; topRow?: unknown } | null
    return { shown: raw?.shown !== false, sweep: raw?.sweep !== false, spinner: raw?.spinner !== false, topRow: raw?.topRow !== false }
  } catch {
    return DEFAULT_LOOK
  }
}
