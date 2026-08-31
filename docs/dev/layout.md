# The repository layout

One clone holds everything Flow is. Six folders install on a machine, five entries belong to the repository and go nowhere, one is the design record the workflow was built from, and two are gitignored scratch. This page says what is in each, and where a new file goes.

- [What ships and what stays here](#what-ships-and-what-stays-here)
- [What installs on a machine](#what-installs-on-a-machine)
- [What belongs to the repository](#what-belongs-to-the-repository)
- [The design record under `lab/`](#the-design-record-under-lab)
- [What is gitignored](#what-is-gitignored)
- [Where a new file goes](#where-a-new-file-goes)

## What ships and what stays here

Installing points names on your machine at files in this clone rather than copying them, so most of what follows is reachable from two paths at once. [Developing Flow](README.md) covers that arrangement.

The split that matters when you first open the repository is a different one, and it has four parts:

- **Six folders install** — `home/`, `scripts/`, `references/`, `skills/`, `agents/` and `project-template/`
- **Five entries belong to the repository** — `CLAUDE.md`, `README.md`, `backlog.md`, `.claude/settings.json` and `docs/`
- **`lab/` is the design record**, installed nowhere and never deleted
- **`repos/` and `tmp/` are gitignored**, and either can be thrown away at any moment

`.gitignore`, `.gitmodules` and `.vscode/` belong to git and to the editor. Flow reads none of them.

## What installs on a machine

- **`home/CLAUDE.md`** — the rules that apply in every directory, project or not. Copied to `~/.claude/CLAUDE.md` on a first install, then personalized there. The copy here is the template: placeholders plus rules, and no personal content ever
- **`home/settings.json`** — permissions, the `PreToolUse` hook, feature flags, and `skillOverrides`, which ships the machine's off list. `home/settings.md` explains every key. It is merged into `~/.claude/settings.json` by hand, because `flow install` never writes that file
- **`scripts/`** — `guard.js`, `snapshot.js`, and `flow/`, where `flow.js` is the entry point, `lib/` holds the argument layer and the model, and `commands/` holds one file per command group. Also the Node package root, so `package.json` and `tests/` sit here. Symlinked as `~/.flow/scripts`, and `flow.js` gets two more symlinks in `~/.local/bin` named `flow` and `fw`, which is what makes it a command. `guard.js` and `snapshot.js` are hooks, named by path in `settings.json` and never typed
- **`references/`** — files Flow ships and rarely loads: `style.md` is the house style, `workflow.md` says how the pieces fit, `study-cases.md` says how to record a failure, `cli-design.md` holds the rules `flow`'s command surface follows, and `work-sync.md` covers moving uncommitted work between two machines. Symlinked as `~/.flow/references`
- **`skills/`** — every skill, one folder each, filed under `phases/`, `tools/`, `standards/`, `stack/`, `commands/` or `drafts/`. [Adding a skill](skills.md) covers the groups. A link in `~/.claude/skills/` is flat and named for the skill, so nothing outside this tree ever reads a group name
- **`agents/`** — subagent definitions, one markdown file each: a system prompt, a tool allowlist and a model. Symlinked into `~/.claude/agents/`. `haiku-worker` is named for its model, so the folder reads at a glance
- **`project-template/`** — `CLAUDE.md` with a `## Project` and a `## Rules` section, `.gitignore`, `.flow-include`, and `.flow/overlays/` holding the `.info` that explains it. Nothing else. It is copied into a project as-is; a directory that is not a project deletes `## Project`, which is the section that makes it one. `.flow-include` ships with no entries, only a comment saying what it is for — it names the gitignored files that travel with `flow work send`

## What belongs to the repository

- **`CLAUDE.md`** — the rules for working on Flow itself. It installs nowhere, and while Flow is uninstalled it is the only rule set any session here loads
- **`README.md`** — the index to everything, including both documentation folders
- **`backlog.md`** — every open item in Flow, one line each. The only place an open item lives; `lab/context/` holds the reasoning behind them
- **`.claude/settings.json`** — this repository's own settings, committed. It carries `claudeMdExcludes`, which stops every `CLAUDE.md` under `repos/`, `home/` and `project-template/` from loading when a file beside one is read
- **`docs/`** — Flow's published documentation, one folder per audience. `dev/` is this folder, for whoever changes Flow. `manual/` is for whoever uses Flow, and it is designed and unwritten. Both are authored here and never moved in from `lab/`. The rest of `docs/` — `spec/`, `context/`, `research/` and `intake/` — appears only if Flow is ever installed into this repository as a project

## The design record under `lab/`

`lab/` holds the reasoning this repository was built from. It ships nowhere and never gets deleted; it shrinks to what is still live instead.

**Every record under `lab/` is history, and the skills on disk win wherever the two disagree.** Git holds the change history, which nothing here restates. `state.md` is the single exception: it is maintained as the work moves, so where it disagrees with disk, the file is the bug.

Every context file sits in `lab/context/`, flat, with no loose markdown at the top of `lab/`:

- **`state.md`** — what is built, where each piece stands, and which design record covers what. The only status file
- **`remaining.md`** — decisions locked in the 2026-08-08 and 2026-08-09 conversations, and the only record of the arguments behind them
- **`refactor-agenda.md`** — the cleanup work now in progress
- **`session-new-plugin.md`** — a historical log, newest at the bottom. Where a decision's origin is found
- **`threads.md`** — the open discussion threads
- **`shit-explanations.md`** — the message the user rejected most recently, kept word for word because the wording is the evidence. An entry is deleted once its faults are rules, so the file holds one at a time and git holds the rest
- **`design-*.md`** — the reasoning behind one locked decision each. `state.md` says which one covers what

Everything beside `context/` is a folder:

- **`util/`** — the `util` command-line tool, worked on here and a submodule of its own: [`Adrian333Dev/util`](https://github.com/Adrian333Dev/util). Edited from this repository like any other file, committed from inside the folder, and the new pointer committed here afterwards
- **`toolbox/`** — external tools filed by job: MCP servers, plugins, skills, libraries, apps. A submodule of its own: [`Adrian333Dev/toolbox`](https://github.com/Adrian333Dev/toolbox). It left the workflow and installs nowhere, and the rewrite that earns it a way back happens here
- **`study-cases/`** — `premature-implementation/` is a `CLAUDE.md` rewritten without approval, and unproposed changes applied on a partial approval. Every other case recorded a failure that got fixed; this one records a failure that recurs
- **`research/`** — the evidence behind the skills, and cached upstream documentation
- **`framework-build/`** — the previous generation, kept until the backlog harvests it into skills
- **`excalidraw/`** — third-party diagram skills awaiting a verdict, and the input for a skill built later
- **`scripts/`** — scripts serving this repository's development, which install nowhere. `repos.sh` clones the reference repositories and carries the list of them in its own header, `try.sh` builds [the scratch session](scratch-session.md), and `proxy.mjs` is a context auditor used while developing

## What is gitignored

- **`repos/`** — clones of other people's repositories. `bash lab/scripts/repos.sh` restores them and says what Flow took from each. Nothing here is yours and nothing here is ever edited
- **`tmp/`** — scratch. `tmp/try/` is the throwaway session, holding both config roots and a project that survives between runs; `tmp/tests/` is where both test suites write

Neither survives a fresh clone, and nothing at runtime reads either one.

## Where a new file goes

- **A note about why something was decided** → `lab/context/`, flat, one file per decision
- **An open item** → `backlog.md`, one line, with a pointer to where the argument lives
- **A shipped script** → `scripts/`, once. One that serves this repository alone → `lab/scripts/`
- **A scratch file** → `tmp/`, never the repository root
- **A skill** → `skills/<group>/<name>/SKILL.md`, and [Adding a skill](skills.md) covers the rest

Two rules bind the design record. **Nothing under `lab/` is a Flow skill**, including a folder that contains a `SKILL.md` — `skills/` is the only place a live skill exists. And **no path inside `lab/` may reach a skill, `home/` or `project-template/`**, because none of those can see it once installed.

`repos/` is read with `cat` rather than a file-reading tool, since a clone there is large and none of it is Flow's.
