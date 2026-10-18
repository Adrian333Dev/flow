/**
 * look.ts: which of the band's two working signs show, from `band-settings.json` in the mod folder.
 *
 * `sweep` is the pale bar running along a badge, `spinner` the braille cell after its word. Each is
 * on unless the file says `false`, so a missing or broken file changes nothing.
 */
export type Look = { sweep: boolean; spinner: boolean }

export const DEFAULT_LOOK: Look = { sweep: true, spinner: true }

/** The settings in the file's text. Anything that is not `false` leaves a sign on. */
export function parseLook(text: string | undefined): Look {
  if (text === undefined) return DEFAULT_LOOK
  try {
    const raw = JSON.parse(text) as { sweep?: unknown; spinner?: unknown } | null
    return { sweep: raw?.sweep !== false, spinner: raw?.spinner !== false }
  } catch {
    return DEFAULT_LOOK
  }
}
