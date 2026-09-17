# The repository layout

One clone holds everything Flow is. This page says what is in each folder, and where a new file goes.

## Table of contents

- [The four parts](#the-four-parts)
- [What installs on a machine](#what-installs-on-a-machine)
- [What belongs to the repository](#what-belongs-to-the-repository)
- [The design record under lab](#the-design-record-under-lab)
- [What is gitignored](#what-is-gitignored)
- [Where a new file goes](#where-a-new-file-goes)

## The four parts

Installing creates symlinks from your machine into this clone, so most files are reachable from two paths at once: one in the repository, one on the machine. [Developing Flow](README.md) covers that arrangement.

When you first open the repository, the split that matters has four parts:

- **Seven folders install**: `home/`, `scripts/`, `references/`, `skills/`, `agents/`, `rules/`, and `project-template/`
- **Five entries belong to the repository**: `CLAUDE.md`, `README.md`, `backlog.md`, `.claude/settings.json`, and `docs/`
- **`lab/` is the design record**: installed nowhere, never deleted
- **`repos/` and `tmp/` are gitignored**: either can be thrown away at any moment

`.gitignore`, `.gitmodules`, and `.vscode/` belong to git and the editor. Flow reads none of them.

## What installs on a machine

**`home/CLAUDE.md`** is the rules that apply in every directory, project or not. It is copied to `~/.claude/CLAUDE.md` on a first install, then personalized there. The copy here is the template: placeholders and rules, never personal content.

**`home/settings.json`** is the permissions, the hooks, feature flags, and `skillOverrides` (the off list, which reaches outside skills only). [Settings](../manual/settings.md) explains every key. It is merged into `~/.claude/settings.json` by hand, because `flow install` never writes that file.

**`home/plugin.json`** is 2 lines naming Flow and describing it. `flow install` copies it to `~/.claude/skills/flow/.claude-plugin/plugin.json`, and that copy is what makes every skill typed `/flow:groundwork` instead of `/groundwork`. Copied rather than linked, because Codex ignores a symlinked manifest. It is the only file `flow install` writes that is not a symlink, apart from the first `CLAUDE.md`.

**`scripts/`** holds the CLI and the hooks:

- `flow/flow.js` is the entry point. `lib/` holds the argument layer and the model. `commands/` holds one file per command group. `lib/audit/` reads Claude Code's transcripts.
- `guard.js` is the `PreToolUse` hook that blocks unauthorized commands.
- `changes.js` records what each subagent changed, under its agent id, and hands the parent a diff per file when the subagent finishes. `flow/lib/changes.js` holds the logic.
- `rule-check.js` is the `PreToolUse` hook on Edit and Write. It runs every check in `rule-checks/` and records the results.
- `instructions-loaded.js` is the `InstructionsLoaded` hook, recording which rule files entered context.
- `check-ticket.js` is the `UserPromptExpansion` hook that refuses a typed phase skill whose ticket id matches nothing, before the skill loads.
- `rule-checks/` holds one file per rule check, named after the rule id it enforces. The folder is the whole registry, and its `.info` states the export contract.
- `package.json` and `tests/` sit here: this is the Node package root.
- Symlinked as `~/.flow/scripts`. `flow.js` gets two more symlinks in `~/.local/bin/` named `flow` and `fw`.

**`references/`** holds files Flow ships and rarely loads: `style.md` is the house style, `workflow.md` describes how the pieces fit, `study-cases.md` says how to record a failure, `cli-design.md` carries the rules the `flow` command surface follows, and `reminder.md` is the line the `UserPromptSubmit` hook prints beside every message. Symlinked as `~/.flow/references`.

**`skills/`** holds every skill, one folder each, filed under a group: `phases/`, `tools/`, `dev/`, or `drafts/`. [Adding a skill](skills.md) covers the groups. The symlinks `flow install` builds are flat and named for the skill, inside `~/.claude/skills/flow/skills/`, so nothing outside this tree ever reads a group name.

**`agents/`** holds subagent definitions, one markdown file each: a system prompt, a tool allowlist, and a model. Symlinked into `~/.claude/agents/`.

**`rules/`** holds prescriptive rules, one markdown file per topic. Each file is symlinked into `~/.claude/rules/` by `flow install`. Rules without `paths:` frontmatter load every session; rules with `paths:` load only when the agent reads a matching file. Populated by `/flow:file-findings` when knowledge is promoted from `.flow/findings/`.

**`project-template/`** is what a new project starts with: a `CLAUDE.md` with a `## Project` section, a `.gitignore`, a `.work-include`, and `.flow/overlays/` with an `.info` that explains what overlays are. Nothing else. It is copied into a project as-is. A directory that is not a project deletes `## Project`. `.work-include` ships empty, with a comment explaining that it names the gitignored files that travel with `util git work send`.

## What belongs to the repository

**`CLAUDE.md`** is the rules for working on Flow itself. It installs nowhere. While Flow is not installed on a machine, this file is the only rule set any session here loads.

**`README.md`** introduces Flow and links to everything else.

**`backlog.md`** holds every open item in Flow, one line each: `## V1` in build order, then `## After V1` by area. The only place an open item lives. `lab/context/` holds the reasoning behind them. Each submodule under `lab/` keeps its own `backlog.md` in the same shape.

**`.claude/settings.json`** is this repository's own Claude Code settings, committed. It carries `claudeMdExcludes`, which stops every `CLAUDE.md` under `repos/`, `home/`, and `project-template/` from loading when a file beside one is read.

**`docs/`** holds Flow's published documentation, one folder per audience. `dev/` is this folder, for whoever changes Flow. `manual/` is for whoever uses Flow, and holds `reference.md`, `tickets.md`, `settings.md`, `where-everything-lives.md` and `use/`, 4 pages following one ticket from `/flow:start` to the handoff. Each folder carries a `README.md` indexing its own pages. Nothing in `dev/` restates what `manual/` covers. Install, the commands and the skills live in `manual/reference.md`, and every folder Flow puts on a machine lives in `manual/where-everything-lives.md`. Every settings key lives in `manual/settings.md`. Both folders are authored here and never moved in from `lab/`.

## The design record under `lab/`

`lab/` holds the reasoning this repository was built from. It ships nowhere and is never deleted. It shrinks to what is still live.

**Every record under `lab/` is history, and the skills on disk win wherever the two disagree.** Git holds the change history, which nothing here restates. `state.md` is the one exception: it is maintained as the work moves, so where state.md disagrees with disk, the file is the bug.

Every context file sits in `lab/context/`, flat:

- **`state.md`**: what is built, where each piece stands, and which record covers what. The only status file.
- **`handoff.md`**: the latest handoff between sessions, rewritten whole each time.
- **Every other file**: the reasoning behind one subject, such as `management.md`. There are 7, and `state.md` says which one covers what.

Everything beside `context/` is a folder:

- **`util/`**: the `util` CLI, a submodule: [Adrian333Dev/util](https://github.com/Adrian333Dev/util). Edited here, committed from inside the folder, and the new pointer committed here afterwards.
- **`toolbox/`**: outside tools filed by who they are for, AI agents or everything else, then by what they help with, one file per tool, a submodule: [Adrian333Dev/toolbox](https://github.com/Adrian333Dev/toolbox). It installs nowhere. `/flow:research` clones it into `tmp/` to search it.
- **`domain-skills/`**: the shared skills about one field or tool each, a submodule: [Adrian333Dev/domain-skills](https://github.com/Adrian333Dev/domain-skills). Committed the same way as `util/`.
- **`scripts/`**: scripts serving this repository's development, installed nowhere. `repos.sh` clones the reference repositories, and `try.sh` builds [the scratch session](scratch-session.md).
- **`research/`**: evidence behind the skills, and cached upstream documentation.

## What is gitignored

- **`repos/`**: clones of other people's repositories. `bash lab/scripts/repos.sh` restores them. Nothing here is yours and nothing here is ever edited.
- **`tmp/`**: scratch. `tmp/try/` is the throwaway session from `try.sh`, holding both config roots and a project that survives between runs. `tmp/tests/` is where both test suites write.

Neither survives a fresh clone, and nothing at runtime reads either one.

## Where a new file goes

- A note about why something was decided → `lab/context/`, flat, one file per decision
- An open item → `backlog.md`, one line, with a pointer to the argument. An item about a submodule alone → that submodule's `backlog.md`
- A shipped script → `scripts/`, once. A script that serves only this repository → `lab/scripts/`. `lab/scripts/seeds/<name>/` is a board for the scratch project, `files/` copied in and `seed.sh` run, picked with `try.sh --seed <name>`
- A rule check → `scripts/rule-checks/<rule-id>.js`, named after the rule it enforces. Nothing registers it
- A scratch file → `tmp/`, never the repository root
- A skill → `skills/<group>/<name>/SKILL.md`. [Adding a skill](skills.md) covers the rest.

Two rules bind the design record. Nothing under `lab/` is a Flow skill, even where a folder there holds a `SKILL.md`: Flow's own skills live in `skills/` alone, and `domain-skills/` is another repository's. And no path inside `lab/` may appear in a skill, in `home/`, or in `project-template/`, because none of those can see `lab/` once installed.
