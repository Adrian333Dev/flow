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
- **Eight entries belong to the repository**: `CLAUDE.md`, `README.md`, `install.sh`, `backlog.md`, `CHANGELOG.md`, `upgrades/`, `.claude/settings.json`, and `docs/`
- **`lab/` is the design record**: installed nowhere, never deleted
- **`repos/` and `tmp/` are gitignored**: either can be thrown away at any moment

`.gitignore`, `.gitmodules`, and `.vscode/` belong to git and the editor. Flow reads none of them.

## What installs on a machine

**`home/AGENTS.md`** is the rules that apply in every directory, project or not. `flow setup` writes it to `~/.flow/AGENTS.md` once the user has checked its form, links `~/.agents/AGENTS.md` to that file, and it is personalized there. The copy here is the template: placeholders and rules, never personal content.

**`home/CLAUDE.md`** is one line, `@~/.agents/AGENTS.md`, written into `~/.claude/CLAUDE.md` by the same skill, so Claude Code loads the same rules. Claude Code never reads an `AGENTS.md` by itself. `project-template/` holds the same pair for a project.

**`home/settings.json`** is the permissions, the hooks, feature flags, and `skillOverrides` (the off list, which reaches outside skills only). [Settings](../manual/settings.md) explains every key. `flow setup` merges it into `~/.claude/settings.json` key by key. `flow install` never writes that file, and writes none of the 3 above either: a rule file copied before the interview holds nothing of the user.

**`scripts/`** holds the CLI, the hooks, and the script that carries out a migration:

- `flow/flow.js` is the entry point. `lib/` holds the argument layer and the model. `commands/` holds one file per command group. `lib/audit/` reads Claude Code's transcripts.
- `flow/setup/` holds what the `flow setup` session follows: `machine.md`, its instructions, and `form.md`, the form it fills in. Not a skill: the session runs in safe mode, which loads none, so `commands/setup.js` hands the text over as a system prompt.
- `guard.js` is the `PreToolUse` hook that blocks unauthorized commands.
- `changes.js` records what each subagent changed, under its agent id, and hands the parent a diff per file when the subagent finishes. `flow/lib/changes.js` holds the logic.
- `rule-check.js` is the `PreToolUse` hook on Edit and Write. It runs every check in `rule-checks/` and records the results.
- `instructions-loaded.js` is the `InstructionsLoaded` hook, recording which rule files entered context.
- `check-ticket.js` is the `UserPromptExpansion` hook that refuses a typed phase skill whose ticket id matches nothing, before the skill loads.
- `reminder.js` is the `UserPromptSubmit` hook that prints `references/reminder.md` beside every message, unless `"reminder": false` in `~/.flow/settings.json` silences it.
- `session-check.js` is the `SessionStart` hook that names what needs attention, reading `~/.flow/run.json`, `~/.flow/version` and the project's `.flow/version`, and printing nothing when all 3 are fine. `"sessionCheck": false` silences it. It also makes every skill link match the `skills` lines, through `flow/lib/skill-links.js`.
- `skills-pull.js` updates every skill repository in `~/.flow/repos/sources/` in the background, started by the session check and never typed. It pulls, or fetches and writes what is waiting into `~/.flow/skills-update.json`, which `"skillsAutoUpdate": false` chooses. `flow/lib/skills-update.js` holds the logic.
- `file-suggestion.js` builds the list `@` opens, named by `fileSuggestion` in `home/settings.json`. It saves each project's walk in the system's temp folder and answers every keystroke from it.
- `apply-migration.js` carries out a migration that `flow setup`, `/flow:setup-project` or `/flow:migrate` wrote, copying each path into the place's original before it changes, while that window is open. It is not a `flow` command, so it is never typed by hand. `flow/lib/migrations.js` and `flow/lib/originals.js` hold the logic.
- `rule-checks/` holds one file per rule check, named after the rule id it enforces. The folder is the whole registry, and its `.info` states the export contract.
- `package.json` and `tests/` sit here: this is the Node package root.
- Symlinked as `~/.flow/scripts`. `flow.js` gets two more symlinks in `~/.local/bin/` named `flow` and `fw`.

**`references/`** holds files Flow ships and rarely loads: `style.md` is the house style, with `write-rules.md` beside it for a rule file and `write-docs.md` for a documentation page, `workflow.md` describes how the pieces fit, `study-cases.md` says how to record a failure, `cli-design.md` carries the rules the `flow` command surface follows, `reminder.md` is the line the `UserPromptSubmit` hook prints beside every message, and `harnesses/<name>.md` says where one harness keeps its own files, Claude Code's first. Symlinked as `~/.flow/references`.

**`skills/`** holds every skill, one folder each, filed under a group: `phases/`, `tools/`, `dev/`, or `drafts/`. [Adding a skill](skills.md) covers the groups. The symlinks `flow install` builds are flat and named for the skill, inside `~/.agents/skills/flow/skills/`, so the only group names read outside this tree are `drafts/`, which never installs, and `dev/`, whose skills switch.

**`skills/.claude-plugin/plugin.json`** is 2 lines naming Flow and describing it, and it is what makes every skill typed `/flow:groundwork` instead of `/groundwork`. Codex reads it here, because it follows each skill's link into this tree and looks above the real folder. `flow install` copies it into `~/.agents/skills/flow/.claude-plugin/`, where Claude Code reads it. Copied rather than linked, because Codex ignores a symlinked manifest. That copy and `~/.flow/settings.local.json` are the only things `flow install` writes that are not symlinks.

**`agents/`** holds subagent definitions, one markdown file each: a system prompt, a tool allowlist, and a model. Symlinked into `~/.claude/agents/`.

**`rules/`** holds prescriptive rules, one markdown file per topic. Each file is symlinked into `~/.claude/rules/` by `flow install`. Rules without `paths:` frontmatter load every session; rules with `paths:` load only when the agent reads a matching file. Populated by `/flow:file-findings` when knowledge is promoted from `.flow/findings/`.

**`project-template/`** is what a new project starts with: an `AGENTS.md` with a `## Project` section, a `CLAUDE.md` holding the one line `@AGENTS.md`, a `.gitignore`, a `.work-include`, and `.flow/overlays/` with an `.info` that explains what overlays are. Nothing else. It is copied into a project as-is. A directory that is not a project deletes `## Project`. `.work-include` ships empty, with a comment explaining that it names the gitignored files that travel with `util git work send`.

## What belongs to the repository

**`CLAUDE.md`** is the rules for working on Flow itself. It installs nowhere. While Flow is not installed on a machine, this file is the only rule set any session here loads.

**`README.md`** introduces Flow and links to everything else.

**`install.sh`** is what the one pasted install line runs, `curl -fsSL <address>/install.sh | bash`. It checks for git, node and claude, clones Flow into `~/.flow/repos/flow/`, then hands over to `flow install`, which does every other step. A clone that exists is never cloned again, so running it twice changes nothing. `--use <folder>` skips the clone and uses that folder as Flow.

**`backlog.md`** holds every open item in Flow, one line each: `## V1` in build order, then `## After V1` by area. The only place an open item lives. `lab/context/` holds the reasoning behind them. Each submodule under `lab/` keeps its own `backlog.md` in the same shape.

**`CHANGELOG.md`** holds one entry per change in how Flow behaves, numbered from 1, newest first. An entry's number is Flow's version, and `~/.flow/version` holds the number a machine last applied. Nothing is written into it until Flow is installed on a machine, since a migration is the only reader an entry has.

**`upgrades/`** holds one guide per entry, `12.md` being the step from 11 to 12. `/flow:migrate` reads every guide above the machine's number and writes one migration from them, and `upgrades/README.md` says what a guide holds. Nothing here is symlinked: the skill reads the guides out of this clone, which it finds through `clone` in `~/.flow/settings.local.json`.

**`.claude/settings.json`** is this repository's own Claude Code settings, committed. It carries `claudeMdExcludes`, which stops every `CLAUDE.md` under `lab/`, `repos/`, and `project-template/` from loading when a file beside one is read.

**`docs/`** holds Flow's published documentation, one folder per audience. `dev/` is this folder, for whoever changes Flow. `manual/` is for whoever uses Flow, and holds `reference.md`, `tickets.md`, `settings.md`, `where-everything-lives.md` and `use/`, 4 pages following one ticket from `/flow:start` to the handoff. Each folder carries a `README.md` indexing its own pages. Nothing in `dev/` restates what `manual/` covers. Install, the commands and the skills live in `manual/reference.md`, and every folder Flow puts on a machine lives in `manual/where-everything-lives.md`. Every settings key lives in `manual/settings.md`. Both folders are authored here and never moved in from `lab/`. Symlinked as `~/.flow/docs`, so `/flow:help` names a page by a path that is the same on every machine.

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
- **`scripts/`**: scripts serving this repository's development, installed nowhere. `repos.sh` clones the reference repositories, `try.sh` builds [the scratch session](scratch-session.md), and `save-computer.sh` keeps a copy of this computer for it to start from.
- **`research/`**: evidence behind the skills, and cached upstream documentation.

## What is gitignored

- **`repos/`**: clones of other people's repositories. `bash lab/scripts/repos.sh` restores them. Nothing here is yours and nothing here is ever edited.
- **`tmp/`**: scratch. `tmp/try/<name>/` is one run of the scratch session from `try.sh`, kept until `try.sh --delete` removes it: `home/`, the pretend computer's home folder with the project in `home/code/`, `remote.git`, the stand-in for the repository `~/.flow/` lives in, and `sandbox.sh`, the line that starts the session. `tmp/computers/` holds the computers `save-computer.sh` saved, never rewritten. `tmp/tests/` is where both test suites write.

Neither survives a fresh clone, and nothing at runtime reads either one.

## Where a new file goes

- A note about why something was decided → `lab/context/`, flat, one file per decision
- An open item → `backlog.md`, one line, with a pointer to the argument. An item about a submodule alone → that submodule's `backlog.md`
- A shipped script → `scripts/`, once. A script that serves only this repository → `lab/scripts/`. `lab/scripts/seeds/<name>/` is a board for the scratch project, `files/` copied in and `seed.sh` run, picked with `try.sh --project <name>`
- A rule check → `scripts/rule-checks/<rule-id>.js`, named after the rule it enforces. Nothing registers it
- A change in how Flow behaves, once Flow is installed somewhere → one entry in `CHANGELOG.md`, plus `upgrades/<number>.md` where the change moves a path on a machine
- A scratch file → `tmp/`, never the repository root
- A skill → `skills/<group>/<name>/SKILL.md`. [Adding a skill](skills.md) covers the rest.

Two rules bind the design record. Nothing under `lab/` is a Flow skill, even where a folder there holds a `SKILL.md`: Flow's own skills live in `skills/` alone, and `domain-skills/` is another repository's. And no path inside `lab/` may appear in a skill, in `home/`, or in `project-template/`, because none of those can see `lab/` once installed.
