import type { EngineInterface } from 'claude-code'
import { flowHome, readText } from './home'

/** A settings file's object: `{}` for a missing file, bad JSON, or anything but an object. */
export function parseObject(text: string | undefined): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(text ?? '')
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** The text of `~/.flow/settings.json` and `settings.local.json`, each undefined where missing. */
export async function flowSettings($: EngineInterface): Promise<[string | undefined, string | undefined]> {
  const home = await flowHome($)
  return [await readText($, `${home}/settings.json`), await readText($, `${home}/settings.local.json`)]
}
