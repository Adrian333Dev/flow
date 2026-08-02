# Flow — working on the repo

Flow is a Claude Code workflow for a solo developer: global rules, a skill set, and a small project scaffold. This file governs work **on** this repo. It is not installed anywhere.

## Layout

| Path | What it is | Where it ends up |
|---|---|---|
| `global/CLAUDE.md` | the rules that apply in every directory, project or not | copied to `~/.claude/CLAUDE.md`, then personalized |
| `global/settings.json` | git deny list, feature flags | merged into `~/.claude/settings.json` |
| `global/scripts/` | `tree.sh`, `merge-files.js`, `link-skills.sh` | symlinked as `~/.claude/scripts` |
| `skills/` | every skill, one folder each | symlinked into `~/.claude/skills/` |
| `project-template/` | `CLAUDE.md` (`## Project` + `## Project rules`), `.gitignore`, `docs/work/backlog.md` | copied into a new project |

`skills/CLAUDE.md` is the authoring guide for anything under `skills/`.

## Two versions of every global file

The copy here is the **template** — placeholders plus rules, public. The copy at `~/.claude/` is **personalized** and belongs to the machine it's on; backing it up is the user's own business, not Flow's. They drift apart on purpose. Never write personal profile content into this repo, and never expect an edit to `~/.claude/CLAUDE.md` to flow back here — carry it across by hand when it's a rule worth shipping.

## Rules

- **Telegraphic style** for everything that loads into agent context — see `skills/CLAUDE.md`.
- **A skill edit is live immediately.** `~/.claude/skills/*` symlinks into `skills/`, so there is one copy and no propagation step. Adding, renaming or removing a skill is the only case needing `bash global/scripts/link-skills.sh`.
- **`global/scripts/` paths are written as `~/.claude/scripts/…`** wherever a skill or rule names them — that is where they run from.
- **Real commit messages.** The changelog convention in `skills/CLAUDE.md` only covers behavior changes; everything else is recoverable from git only if the message says something.
