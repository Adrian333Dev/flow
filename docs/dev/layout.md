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

**`home/settings.json`** is the permissions, the `PreToolUse` hook, feature flags, and `skillOverrides` (the machine's off list). `home/settings.md` explains every key. It is merged into `~/.claude/settings.json` by hand, because `flow install` never writes that file.

**`scripts/`** holds the CLI and the hooks:

- `flow/flow.js` is the entry point. `lib/` holds the argument layer and the model. `commands/` holds one file per command group. `lib/audit/` reads Claude Code's transcripts.
- `guard.js` is the `PreToolUse` hook that blocks unauthorized commands.
- `snapshot.js` takes snapshots before and after subagent runs.
- `package.json` and `tests/` sit here: this is the Node package root.
- Symlinked as `~/.flow/scripts`. `flow.js` gets two more symlinks in `~/.local/bin/` named `flow` and `fw`.

**`references/`** holds files Flow ships and rarely loads: `style.md` is the house style, `workflow.md` describes how the pieces fit, `study-cases.md` says how to record a failure, `cli-design.md` carries the rules the `flow` command surface follows, and `work-sync.md` covers moving uncommitted work between machines. Symlinked as `~/.flow/references`.

**`skills/`** holds every skill, one folder each, filed under a group: `phases/`, `tools/`, `standards/`, `stack/`, `commands/`, `dev/`, or `drafts/`. [Adding a skill](skills.md) covers the groups. A symlink in `~/.claude/skills/` is flat and named for the skill, so nothing outside this tree ever reads a group name.

**`agents/`** holds subagent definitions, one markdown file each: a system prompt, a tool allowlist, and a model. Symlinked into `~/.claude/agents/`.

**`rules/`** holds prescriptive rules, one markdown file per topic. Each file is symlinked into `~/.claude/rules/` by `flow install`. Rules without `paths:` frontmatter load every session; rules with `paths:` load only when the agent reads a matching file. Populated by `/file-findings` when knowledge is promoted from `.flow/findings/`.

**`project-template/`** is what a new project starts with: a `CLAUDE.md` with `## Project` and `## Rules` sections, a `.gitignore`, a `.flow-include`, and `.flow/overlays/` with an `.info` that explains what overlays are. Nothing else. It is copied into a project as-is. A directory that is not a project deletes `## Project`. `.flow-include` ships empty, with a comment explaining that it names the gitignored files that travel with `flow work send`.

## What belongs to the repository

**`CLAUDE.md`** is the rules for working on Flow itself. It installs nowhere. While Flow is not installed on a machine, this file is the only rule set any session here loads.

**`README.md`** introduces Flow and links to everything else.

**`backlog.md`** holds every open item, one line each. The only place an open item lives. `lab/context/` holds the reasoning behind them.

**`.claude/settings.json`** is this repository's own Claude Code settings, committed. It carries `claudeMdExcludes`, which stops every `CLAUDE.md` under `repos/`, `home/`, and `project-template/` from loading when a file beside one is read.

**`docs/`** holds Flow's published documentation, one folder per audience. `dev/` is this folder, for whoever changes Flow. `manual/` is for whoever uses Flow, and it is designed but unwritten. Both are authored here and never moved in from `lab/`.

## The design record under `lab/`

`lab/` holds the reasoning this repository was built from. It ships nowhere and is never deleted. It shrinks to what is still live.

**Every record under `lab/` is history, and the skills on disk win wherever the two disagree.** Git holds the change history, which nothing here restates. `state.md` is the one exception: it is maintained as the work moves, so where state.md disagrees with disk, the file is the bug.

Every context file sits in `lab/context/`, flat:

- **`state.md`**: what is built, where each piece stands, and which design record covers what. The only status file.
- **`remaining.md`**: decisions locked in the 2026-08-08 and 2026-08-09 conversations.
- **`threads.md`**: the open discussion threads.
- **`design-*.md`**: the reasoning behind one locked decision each. `state.md` says which one covers what.

Everything beside `context/` is a folder:

- **`util/`**: the `util` CLI, a submodule: [Adrian333Dev/util](https://github.com/Adrian333Dev/util). Edited here, committed from inside the folder, and the new pointer committed here afterwards.
- **`toolbox/`**: external tools filed by job, a submodule: [Adrian333Dev/toolbox](https://github.com/Adrian333Dev/toolbox). It left the workflow and installs nowhere.
- **`scripts/`**: scripts serving this repository's development, installed nowhere. `repos.sh` clones the reference repositories, `try.sh` builds [the scratch session](scratch-session.md), and `proxy.mjs` is a context auditor used while developing.
- **`research/`**: evidence behind the skills, and cached upstream documentation.

## What is gitignored

- **`repos/`**: clones of other people's repositories. `bash lab/scripts/repos.sh` restores them. Nothing here is yours and nothing here is ever edited.
- **`tmp/`**: scratch. `tmp/try/` is the throwaway session from `try.sh`, holding both config roots and a project that survives between runs. `tmp/tests/` is where both test suites write.

Neither survives a fresh clone, and nothing at runtime reads either one.

## Where a new file goes

- A note about why something was decided → `lab/context/`, flat, one file per decision
- An open item → `backlog.md`, one line, with a pointer to the argument
- A shipped script → `scripts/`, once. A script that serves only this repository → `lab/scripts/`
- A scratch file → `tmp/`, never the repository root
- A skill → `skills/<group>/<name>/SKILL.md`. [Adding a skill](skills.md) covers the rest.

Two rules bind the design record. Nothing under `lab/` is a Flow skill, even if a folder there contains a `SKILL.md`: `skills/` is the only place a live skill exists. And no path inside `lab/` may appear in a skill, in `home/`, or in `project-template/`, because none of those can see `lab/` once installed.
