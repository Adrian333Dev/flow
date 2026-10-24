# Flow, working on the repo

## Project

Flow is a Claude Code workflow for a solo developer: global rules (`home/`), skills (`skills/`), the `flow` command and its hooks (`scripts/`), the `flow-session` mod (`mods/`), a project scaffold (`project-template/`) and the docs (`docs/`). Node and bash, the mod in TypeScript. Dependencies are allowed where they save real work (the user, 2026-10-21). `~/.flow/repos/flow` links to this checkout, so every edit here runs on this machine at once.

## Layout

- `lab/`: the maintainers' workspace: the `lab/util` submodule, `lab/scripts/` (serves this repo alone) and `lab/archive/`.
- `.claude/` holds what Claude Code reads here, `.flow/` what Flow owns. `docs/reference/files.md` lists every path.
- `~/.flow/wiki/claude-code/downloads/`: Claude Code's documentation on disk. Its `llms.txt` indexes every page, and `WebFetch` reaches the rest.
- `npm test` inside `scripts/` runs Flow's suite, and `lab/util/` has its own.

## Rules

- **`designed-is-not-built`** A design decided in a ticket changes nothing on disk until its build ticket closes. Until then every file follows the old model: a ticket, a skill or a folder that breaks the new design is the old model at work, never a fault in the file or in the design. Judge a file by the model that wrote it. For the redesign, cite `fw-16`'s map before the spec, which lags it.
- **`read-the-spec-first`** Read `docs/spec/product.md` and the spec file of the part you touch, before changing skills, installation, the scripts or the docs tree.
- **`never-suggest-upkeep`** Never offer `/flow:upkeep`, and never count the closed tickets waiting for it. End with the next ticket instead: each reminder costs the user a line to skip.
- **`check-claude-code-updates`** When asked, run `bash lab/scripts/claude-code-changes.sh` and read each release against Flow. Write what touches Flow into `.flow/research/claude-code/releases-read-against-flow.md`, ticket each needed change, then set line 1 to the newest release read. Where Flow comes to rely on a newer release, raise `MIN_CLAUDE` in `scripts/lib/machine/prereq.js` and the README's Install line. Download again any page in `~/.flow/wiki/claude-code/downloads/pages/` whose topic a release changed.
- **`write-locked-decisions`** Write a decision the user confirmed with no open threads into its record, batched, with no approval asked. A proposal dropped, by anyone, goes into its ticket or spec file with why, in the same turn.
- **`no-code-review-skill`** Review runs in the same session, never a subagent. Criteria: `references/review-code.md` for code, `references/write-spec.md` for the spec.
- **`skill-edits-are-live`** A skill edit reaches a session at once. Adding, renaming or removing a skill needs `flow install`.
- **`never-symlink-a-folder`** Never symlink `~/.claude/skills/`, `agents/`, `rules/` or `commands/` as a whole folder. `flow install` links per item. The plugin folder `flow/` is the one folder link.
- **`one-source-two-ways`** Every shipped script lives once, in `scripts/`: bash where it wraps another command, Node where there is real logic. `lab/scripts/` holds the ones that serve this repo alone. Never copy a file, and never let a `lab/` path leak into a skill, `home/` or `project-template/`.
- **`home-files-exist-twice`** `home/CLAUDE.md` and `home/settings.json` are the public templates, `~/.flow/CLAUDE.md` and `~/.claude/settings.json` the personalized copies, and this file is neither. Never write personal content into this repo. Always carry an edit to one copy across to its twin by hand, in the same turn and whichever way it was made. The same holds for any other file with a twin: look in `home/` and `project-template/` before finishing. Only a line that is personal stays out, and the reply names it. A setting with no template line, such as `wrapUpAt` in `~/.flow/settings.json`, goes to its documented default in `docs/reference/settings.md`.
- **`no-status-in-claude-md`** No counts, no dates and no build status here. What Flow does goes in `docs/spec/`, open work in tickets.

## Temporary

Flow runs on this machine alone. A second machine joins soon, once this version of Flow is finished. Never suggest setting it up or running anything for it. Design every change so state that follows a ticket or a project syncs, and the other machine sees it. Sync faults such as git conflicts belong to the multi-machine tickets (`fw-6`, `fw-158`), never to the change at hand. Delete this section when the machine joins.
