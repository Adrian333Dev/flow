# Flow, working on the repo

## Project

Flow is a Claude Code workflow for a solo developer: global rules (`home/`), skills (`skills/`), the `flow` command and its hooks (`scripts/`), the `flow-session` mod (`mods/`), a project scaffold (`project-template/`) and the docs (`docs/`). Node and bash with no dependencies, the mod in TypeScript. `~/.flow/repos/flow` links to this checkout, so every edit here runs on this machine at once.

## Layout

- `lab/`: the maintainers' workspace: the `lab/util` submodule, `lab/scripts/` (serves this repo alone) and `lab/archive/`.
- `.claude/` holds what Claude Code reads here, `.flow/` what Flow owns. `docs/reference/files.md` lists every path.
- `~/.flow/wiki/claude-code/downloads/`: Claude Code's documentation on disk. Its `llms.txt` indexes every page, and `WebFetch` reaches the rest.
- `npm test` inside `scripts/` runs Flow's suite, and `lab/util/` has its own.

## Rules

- **`design-lives-in-the-map`** Cite `fw-16`'s map before the spec, whenever you answer or decide anything about the redesign. The spec lags the redesign until its build lands.
- **`read-the-spec-first`** Read `docs/spec/product.md` and the spec file of the part you touch, before changing skills, installation, the scripts or the docs tree.
- **`never-suggest-upkeep`** Never offer `/flow:upkeep`, and never count the closed tickets waiting for it. End with the next ticket instead: each reminder costs the user a line to skip.
- **`check-claude-code-updates`** When asked, run `bash lab/scripts/claude-code-changes.sh` and read each release against Flow. Write what touches Flow into `.flow/research/claude-code/releases-read-against-flow.md`, ticket each needed change, then set line 1 to the newest release read. Where Flow comes to rely on a newer release, raise `MIN_CLAUDE` in `scripts/lib/machine/prereq.js` and the README's Install line. Download again any page in `~/.flow/wiki/claude-code/downloads/pages/` whose topic a release changed.
- **`retired-stays-retired`** Never cite a mechanism the user retired (the `open` block, `flow get --files`) as current. A skill, a doc or a script still holding one is stale, never evidence it lives.
- **`design-rules-can-be-overturned`** Paths, types, file shapes, what a skill owns: a better idea wins. Say what the rule protected, whether that still holds, and recommend. The conduct rules, git, installing and deletes hold regardless.
- **`no-commit-no-push`** Never run `git commit` or `git push`, here or in a submodule, unless the user asks. Every other git command is fine, but never discard the user's uncommitted work. Flow has no commit step, so never raise a missing one.
- **`deletes-need-confirmation`** A delete needs its own confirmation, even inside an approved plan. Moving is not deleting. Pre-approved: something this session superseded, cleanup of what a change left behind, your own scratch in `tmp/`, and a ticket drop, repoint or merge.
- **`scratch-in-tmp`** Scratch files go in `tmp/`, gitignored. Never `/tmp`, never the repo root. Delete what your work put there in the same turn, once its result is written down. A drawing or mockup is design output: keep it in `.flow/research/<topic>/`. `tests/` belongs to the test suite and stays.
- **`tracked-never-means-git`** "Tracked" means the agent maintains the file as the work moves. A handoff file in `.flow/handoffs/` is untracked: read once, deleted by the mod after one clean turn.
- **`write-locked-decisions`** Write a decision the user confirmed with no open threads into its record, batched, with no approval asked. A proposal dropped, by anyone, goes into its ticket or spec file with why, in the same turn.
- **`no-code-review-skill`** Review runs in the same session, never a subagent. Criteria: `references/review-code.md` for code, `references/write-spec.md` for the spec.
- **`skill-edits-are-live`** A skill edit reaches a session at once. Adding, renaming or removing a skill needs `flow install`.
- **`never-symlink-a-folder`** Never symlink `~/.claude/skills/`, `agents/`, `rules/` or `commands/` as a whole folder. `flow install` links per item. The plugin folder `flow/` is the one folder link.
- **`one-source-two-ways`** Every shipped script lives once, in `scripts/`: bash where it wraps another command, Node where there is real logic. `lab/scripts/` holds the ones that serve this repo alone. Never copy a file, and never let a `lab/` path leak into a skill, `home/` or `project-template/`.
- **`read-repos-with-cat`** `repos/` holds other people's clones. Read them with `cat`, never `Read`, and never edit them.
- **`home-files-exist-twice`** `home/CLAUDE.md` and `home/settings.json` are the public templates, `~/.flow/CLAUDE.md` and `~/.claude/settings.json` the personalized copies, and this file is neither. Never write personal content into this repo. Always carry an edit to one copy across to its twin by hand, in the same turn and whichever way it was made. The same holds for any other file with a twin: look in `home/` and `project-template/` before finishing. Only a line that is personal stays out, and the reply names it. A setting with no template line, such as `wrapUpAt` in `~/.flow/settings.json`, goes to its documented default in `docs/reference/settings.md`.
- **`no-status-in-claude-md`** No counts, no dates and no build status here. What Flow does goes in `docs/spec/`, open work in tickets.
