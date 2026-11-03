/**
 * shipped.ts: which edited paths are loaded files Flow ships, and where each one sits in the Flow repo.
 *
 * An agent reaches the repo's files by their own path or through a link: `~/.flow/references/guides/x.md` is
 * `references/guides/x.md`, `~/.claude/skills/flow/skills/execute/SKILL.md` is `skills/work/execute/SKILL.md`.
 * The links are read once at session start, so the entries in `list.ts`, which run with no file
 * system, can ask too.
 */
import type { EngineInterface } from 'claude-code'
import { flowHome } from '../../../shared/home'

/** A path that leads into the repo, and the repo-relative path it stands for (empty for the repo itself). */
export type Link = { from: string; to: string }

/** The repo's root and the links into it. Empty until session start reads them. */
let known: { root: string; links: Link[] } = { root: '', links: [] }

/** Sets what `shippedOf` resolves through. Session start calls it, and tests. */
export const setLinks = (root: string, links: readonly Link[]) => void (known = { root, links: [...links].sort((a, b) => b.from.length - a.from.length) })

/** The folders of the repo whose markdown agents load, and the repo's own `CLAUDE.md`. */
const SHIPPED = /^(?:(?:home|project-template|references|prompts|skills)\/.+|CLAUDE)\.md$/

/** The repo-relative path of any path inside the repo, by its own path or through a link, or undefined. */
export function repoPathOf(path: string): string | undefined {
  const link = known.links.find((l) => path === l.from || path.startsWith(`${l.from}/`))
  if (!link) return undefined
  const rest = path.slice(link.from.length).replace(/^\/+/, '')
  return link.to && rest ? `${link.to}/${rest}` : link.to || rest
}

/** The repo-relative path of a loaded file Flow ships, or undefined for any other path. */
export function shippedOf(path: string): string | undefined {
  const rel = repoPathOf(path)
  return rel !== undefined && SHIPPED.test(rel) ? rel : undefined
}

/** The repo's root: the checkout `~/.flow/repos/flow` leads to. */
export const repoRoot = () => known.root

/** Where a path leads, or undefined where it leads nowhere. */
async function realOf($: EngineInterface, path: string): Promise<string | undefined> {
  return (await $.fs.stat(path, { resolve: true }).catch(() => undefined))?.realPath
}

/** Reads the repo's root and every link into it from the Flow home and the skills plugin folder. No repo, no links. */
export async function readLinks($: EngineInterface): Promise<void> {
  const home = await flowHome($)
  const root = await realOf($, `${home}/repos/flow`)
  if (!root) return setLinks('', [])
  const links: Link[] = [
    { from: root, to: '' },
    { from: `${home}/repos/flow`, to: '' },
  ]
  const skills = `${await $.env.get('HOME')}/.claude/skills/flow/skills`
  const dirs = [home, skills, await realOf($, skills)].filter((d): d is string => d !== undefined)
  for (const dir of new Set(dirs)) {
    for (const entry of await $.fs.list(dir).catch(() => [])) {
      if (!entry.isLink) continue
      const real = await realOf($, `${dir}/${entry.name}`)
      if (real?.startsWith(`${root}/`)) links.push({ from: `${dir}/${entry.name}`, to: real.slice(root.length + 1) })
    }
  }
  setLinks(root, links)
}
