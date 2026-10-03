# The repository layout

One clone holds everything Flow is. This page says what is in each folder, and where a new file goes.

## Table of contents

- [The 4 parts](#the-4-parts): what installs, what stays in the repository, the design record, and scratch
- [What installs on a machine](#what-installs-on-a-machine): the 6 folders and every file in `scripts/`
- [What belongs to the repository](#what-belongs-to-the-repository): the files that install nowhere, the docs among them
- [The design record under lab](#the-design-record-under-lab): the reasoning, the backlog and the submodules
- [What is gitignored](#what-is-gitignored): other people's clones and scratch
- [Where a new file goes](#where-a-new-file-goes): one line per kind of file

## The 4 parts

Installing creates symlinks from your machine into this clone, so most files are reachable from 2 paths at once: one in the repository, one on the machine. [Trying a change](trying-changes.md#two-checkouts) says how to edit safely when every link points here.

When you first open the repository, the split that matters has 4 parts:

- **6 folders install**: `home/`, `scripts/`, `references/`, `skills/`, `claude/`, and `project-template/`
- **7 entries belong to the repository**: `CLAUDE.md`, `README.md`, `install.sh`, `CHANGELOG.md`, `upgrades/`, `.claude/settings.json`, and `docs/`
- **`lab/` is the design record**: installed nowhere, never deleted
- **`repos/` and `tmp/` are gitignored**: either can be thrown away at any moment

`.gitignore`, `.gitmodules`, and `.vscode/` belong to git and the editor. Flow reads none of them. `.vscode/` is gitignored, since it holds one person's editor settings.

## What installs on a machine

**`home/AGENTS.md`** is the rules that apply in every directory, project or not. `flow install` writes it to `~/.flow/AGENTS.md` once the user has checked its form, links `~/.agents/AGENTS.md` to that file, and it is personalized there. The copy here is the template: placeholders and rules, never personal content.

**`home/CLAUDE.md`** is one line, `@~/.agents/AGENTS.md`, written into `~/.claude/CLAUDE.md` by the same session, so Claude Code loads the same rules. Claude Code never reads anything under `~/.agents/` by itself. `project-template/` holds the same pair for a project, where the `CLAUDE.md` stays even though Claude Code could read the `AGENTS.md` alone: [`claude-code.md`](../../lab/context/claude-code.md#how-an-instruction-file-loads) in the design record says why.

**`home/settings.json`** is the permissions, the hooks, feature flags, and `skillOverrides` (the off list, which reaches outside skills only). [Settings](../reference/settings.md) explains every key. The setup session `flow install` opens merges it into `~/.claude/settings.json` key by key. The links `flow install` makes before that session write none of the 3 above: a rule file copied before the interview holds nothing of the user.

**`scripts/`** holds the CLI, the hooks, and the script that carries out a migration. Symlinked as `~/.flow/scripts`. `flow.js` gets 2 more symlinks in `~/.local/bin/` named `flow` and `fw`.

- `flow.js` is the entry point. It names the commands and hands what was typed to `lib/cli.js`, the argument layer. [Designing a flow command](commands.md) holds the rules every command follows.
- `commands/` holds one file per command or group: `init.js` is `flow init`, `store.js` is `flow store`, `update.js` is `flow update`, and `status-line.js` is `flow status-line`.
- `lib/` holds everything the commands, the hooks and the jobs share. A folder groups one subject, and the files loose in `lib/` serve every subject:
  - `tickets/`: the tickets. `store.js` is the only file that reads or writes a ticket's folder. `records.js` keeps a project's tickets on its branch `flow`: the commit, the pull, the push, the renumbering after a clash, and checking the branch out at `.flow/`. `records-place.js` keeps them in the Flow home instead: the folder under `~/.flow/projects/`, the link `.flow/` to it, and the repository's address that finds it from another clone. `ticket-history.js` sets a ticket's `branch:` and words the lines of its `history.md`. `ticket-skills.js` writes one user-only skill per open ticket, after every command that writes a ticket.
  - `machine/`: this machine. What Flow installed, its links, the originals a restore puts back, the migrations, the version stamp, and `~/.flow/` as a private git repository.
  - `skills/`: the skill links, the skill repositories, and their updates.
  - `logs/`: the one file per month every log under `~/.flow/logs/` uses, and which failed calls count.
  - `checks/`: the rule checks and their scorecard.
  - `audit/`: Claude Code's transcripts, read into the index `flow audit` answers from.
  - `guard/`: the guard's judgment. `world.js` alone reads the disk, git and the environment. Every other file there turns a command into a decision.
  - `setup.js` holds the setup sessions `flow install`, `flow init` and `flow update` open. `paths.js` finds every Flow folder, `project.js` the project around a folder, `git.js` runs git and `gh`, and `hook.js` reads a hook's event and writes its answer.
- `hooks/` holds one file per hook Claude Code runs. Each reads the event, calls `lib/`, and writes the answer:
  - `guard.js` is the `PreToolUse` hook on Bash. It reads each command the way bash splits it, asks before 5 kinds of harm, and never allows anything. `scripts/tests/guard.test.js` holds a case for each kind.
  - `changes.js` records what each subagent changed, under its agent id, and hands the parent a diff per file when the subagent finishes. `lib/changes.js` holds the logic.
  - `rule-check.js` is the `PreToolUse` hook on Edit and Write. It runs every check in `rule-checks/` and records the results.
  - `instructions-loaded.js` is the `InstructionsLoaded` hook, recording which rule files entered context.
  - `failures.js` is the `PostToolUseFailure` and `StopFailure` hook. It writes a line into `~/.flow/logs/failures/<month>.jsonl` for a failed MCP tool, a failed Flow command or bundled script, and an API error that ended a turn. `lib/logs/failures.js` holds which calls count.
  - `check-ticket.js` is the `UserPromptExpansion` hook that refuses a typed phase skill before it loads on a machine not set up, and a bare `/flow:start` in a folder with no project.
  - `overlays.js` is the `UserPromptExpansion` hook and the `PostToolUse` hook on `Skill`. Each time a skill loads, typed or loaded by the agent, it hands the agent the project's `.flow/overlays/<name>.md`, for every skill, Flow's or not.
  - `reminder.js` is the `UserPromptSubmit` hook that prints `references/reminder.md` beside every message, unless `"reminder": false` in `~/.flow/settings.json` silences it.
  - `compact-check.js` is the `PreCompact` hook on a typed `/compact`. It refuses with exit 2 and names `/flow:handoff`, then `/clear`. `"compact": true` lets it run.
  - `context-check.js` is the `PostToolBatch` and `UserPromptSubmit` hook that tells the agent to hand off once the conversation passes `"wrapUpAt"` tokens, 150,000 by default, and again every 20,000 past it. It reads the size off the session file. `"wrapUp": false` silences it.
  - `session-check.js` is the `SessionStart` hook that names what needs attention, reading `~/.flow/run.json`, `~/.flow/version` and the project's `.flow/version`, and printing nothing when all 3 are fine. `"sessionCheck": false` silences it. In a git repository with no `.flow/` it suggests `flow init` through `systemMessage`, to the user alone. It also makes every skill link match the `skills` lines, makes every ticket skill match the tickets, and starts `jobs/records-sync.js` for a project on its branch `flow`. `lib/session-start.js` holds the logic.
  - `file-suggestion.js` builds the list `@` opens, named by `fileSuggestion` in `home/settings.json`. It saves each project's walk in the system's temp folder and answers every keystroke from it.
- `jobs/` holds the 2 scripts that run in the background, never typed:
  - `records-sync.js` saves and sends a project's tickets, and `~/.flow/` with the projects kept in it, where nobody typed `flow sync`: the `Stop` hook after a reply once 30 minutes have passed, the `SessionEnd` hook, a status move and the session check. `lib/tickets/records.js` holds the logic.
  - `skills-pull.js` updates every skill repository in `~/.flow/repos/sources/`, started by the session check. It pulls each one. With `"skillsAutoUpdate": false` it only fetches, and writes what is waiting into `~/.flow/skills-update.json`. `lib/skills/skills-update.js` holds the logic.
- `sessions/` holds what the sessions Flow opens follow: `machine.md` and `form.md` for `flow install`, `project.md` and `project-form.md` for `flow init`, and `migrate.md`, instructions and form in one file, for `flow update`. Not skills: `lib/setup.js` hands the text over as a system prompt, and the machine's setup runs in safe mode, which loads no skill.
- `templates/` holds what Flow writes a new file from: a ticket, a map, a study case, and the `README.md` of `~/.flow/`.
- `apply-migration.js` carries out a migration that `flow install`, `flow init` or `flow update` wrote. During a place's first setup, it copies each path into the place's originals before changing it. `flow restore` puts those back. Later migrations record nothing. It is not a `flow` command, so nobody types it by accident. `lib/machine/migrations.js` and `lib/machine/originals.js` hold the logic.
- `rule-checks/` holds one file per rule check, named after the rule id it enforces. The folder is the whole registry, and `/flow:file-findings`' `references/write-checks.md` states the export contract.
- `package.json` and `tests/` sit here: this is the Node package root.

**`references/`** holds files Flow ships and rarely loads: `style.md` is the house style, with `cut-loaded-files.md` beside it for a file an agent loads, `write-rules.md` for a rule file and `write-docs.md` for a documentation page, `workflow.md` describes how the pieces fit, `knowledge.md` maps how skills, plugins, MCP servers and findings arrive and grow, `study-cases.md` says how to record a failure, `reminder.md` is the line the `UserPromptSubmit` hook prints beside every message, and `harnesses/<name>.md` says where one harness keeps its own files, Claude Code's first. Symlinked as `~/.flow/references`.

**`skills/`** holds every skill, one folder each, filed under a group: `phases/`, `tools/`, `dev/`, or `drafts/`. [Adding a skill](skills.md) covers the groups. The symlinks `flow install` builds are flat and named for the skill, inside `~/.agents/skills/flow/skills/`, so the only group names read outside this tree are `drafts/`, which never installs, and `dev/`, whose skills switch.

**`skills/.claude-plugin/plugin.json`** is 2 lines naming Flow and describing it, and it is what makes every skill typed `/flow:groundwork` instead of `/groundwork`. Codex reads it here, because it follows each skill's link into this tree and looks above the real folder. `flow install` copies it into `~/.agents/skills/flow/.claude-plugin/`, where Claude Code reads it. Copied rather than linked, because Codex ignores a symlinked manifest. That copy and `~/.flow/settings.local.json` are the only things `flow install` writes that are not symlinks.

**`claude/`** holds what Claude Code alone reads, each file symlinked into the folder of the same name under `~/.claude/`:

- `agents/` holds subagent definitions, one markdown file each: a system prompt, a tool allowlist, and a model.
- `rules/` holds prescriptive rules, one markdown file per topic. Rules without `paths:` frontmatter load every session; rules with `paths:` load only when the agent reads a matching file. Populated by `/flow:file-findings` when knowledge is promoted from `.flow/findings/`.
- `commands/` holds commands, one markdown file each, typed by the file name with no `flow:` prefix: `capture.md` is `/capture`. A command is for a manual trigger only the user types, so each carries `disable-model-invocation: true` and costs no context until typed.

**`project-template/`** is what a new project starts with: an `AGENTS.md` with 2 sections (`## Project`, `## Rules`), each holding a placeholder comment, a `CLAUDE.md` holding the one line `@AGENTS.md`, an empty `.claude/settings.json`, a `.gitignore` and a `.uncommitted-include`. Nothing else. It is copied into a project as-is. A directory that is not a project deletes `## Project`. `.uncommitted-include` ships empty, with a comment explaining that it names the gitignored files that travel with `util git uncommitted send`.

## What belongs to the repository

**`CLAUDE.md`** is the rules for working on Flow itself. It installs nowhere. While Flow is not installed on a machine, this file is the only rule set any session here loads.

**`README.md`** introduces Flow and links to everything else.

**`install.sh`** is what the one pasted install line runs, `curl -fsSL <address>/install.sh | bash`. It checks for git, node, claude and gh, clones Flow into `~/.flow/repos/flow/`, then hands over to `flow install`, which does every other step. A clone that exists is never cloned again, so running it twice changes nothing. `--use <folder>` skips the clone and uses that folder as Flow.

**`CHANGELOG.md`** holds one entry per change in how Flow behaves, numbered from 1, newest first. An entry's number is Flow's version, and `~/.flow/version` holds the number a machine last applied. Nothing is written into it until Flow is installed on a machine, since a migration is the only reader an entry has.

**`upgrades/`** holds one guide per entry, `12.md` being the step from 11 to 12. The session `flow update` opens reads every guide above the machine's number and writes one migration from them, and `upgrades/README.md` says what a guide holds. Nothing here is symlinked: the session reads the guides out of this clone, through `~/.flow/repos/flow`.

**`.claude/settings.json`** is this repository's own Claude Code settings, committed. It carries `claudeMdExcludes`, which stops every `CLAUDE.md` under `lab/`, `repos/`, and `project-template/` from loading when a file beside one is read.

**`docs/`** holds Flow's published documentation. The pages at its top are guides for whoever uses Flow, one per subject, such as `tickets.md` or `safety.md`. `reference/` holds the 4 lookup pages: commands, settings, skills and files. `dev/` is this folder, for whoever changes Flow. `docs/README.md` and `dev/README.md` each index their own pages. Nothing in `dev/` restates what the user pages cover, and nothing in the user pages names a hidden command or flag. Symlinked as `~/.flow/docs`, so `/flow:help` names a page by a path that is the same on every machine.

## The design record under `lab/`

`lab/` holds the reasoning this repository was built from. It ships nowhere and is never deleted. It shrinks to what is still live.

**Every record under `lab/` is history, and the skills on disk win wherever the 2 disagree.** Git holds the change history, which nothing here restates. `context/state.md` and `backlog/` are the exceptions: both are maintained as the work moves, so where one disagrees with disk, the record is the bug.

Every context file sits in `lab/context/`, flat:

- **`state.md`**: what is built, where each piece stands, and which record covers what. The only status file.
- **`handoff.md`**: the latest handoff between sessions, rewritten whole each time.
- **Every other file**: the reasoning behind one subject, such as `management.md`. `state.md` says which one covers what.

Everything beside `context/` is a folder:

- **`backlog/`**: every open item, for Flow and for the 3 submodules below, one file per phase. The only place an open item lives, and `context/` holds the reasoning behind each.
  - `before-beta.md`: what has to be true before Flow installs on the author's machine, in build order.
  - `beta.md`: `## Checklist`, what real use tries once, and `## Found in use`, what it turns up. Notes from `~/.flow/workflow-notes.md` land in the second.
  - `after-v1.md`: the rest, one section per area, the lowest priority last.

  An item is one line: what it is, then the file in `context/` holding the argument. A finished item is deleted, never checked off. An item about a submodule opens with its name, as in `**util**:`. A marker on the line says what else holds it back: **talk first** needs its own conversation, **parked** waits for a real case, and **half done** marks a started item.
- **`util/`**: the `util` CLI, a submodule: [Adrian333Dev/util](https://github.com/Adrian333Dev/util). Edited here, committed from inside the folder, and the new pointer committed here afterwards.
- **`toolbox/`**: outside tools filed by who they are for, AI agents or everything else, then by what they help with, one file per tool, a submodule: [Adrian333Dev/toolbox](https://github.com/Adrian333Dev/toolbox). It installs nowhere. `/flow:research` clones it into `tmp/` to search it.
- **`domain-skills/`**: the shared skills about one field or tool each, a submodule: [Adrian333Dev/domain-skills](https://github.com/Adrian333Dev/domain-skills). Committed the same way as `util/`.
- **`scripts/`**: scripts serving this repository's development, installed nowhere. `repos.sh` clones the reference repositories, `try.sh` builds [the scratch session](trying-changes.md#the-scratch-session), and `save-computer.sh` saves this computer as a seed for it to start from. `test-projects/<name>/` builds each run's practice project: `files/` copied in, then `build.sh` making the tickets, or no `build.sh` for a project not set up.
- **`research/`**: evidence behind the skills, and cached upstream documentation.
- **`archive/`**: pages taken out of `docs/` whole, kept as history. `manual/` is the old manual the user pages replaced.

## What is gitignored

- **`repos/`**: clones of other people's repositories. `bash lab/scripts/repos.sh` restores them. Nothing here is yours and nothing here is ever edited.
- **`tmp/`**: scratch. `tmp/try/<name>/` is one run of the scratch session from `try.sh`, kept until `try.sh --delete` removes it: `home/`, the pretend computer's home folder with the project in `home/code/`, `remote.git`, the stand-in for the repository `~/.flow/` lives in, and `sandbox.sh`, the line that starts the session. `tmp/computers/` holds the seeds, saved computers a run starts from: `save-computer.sh` saves this one, `try.sh --save` a run's. None is ever rewritten. `tmp/tests/` is where both test suites write.

Neither survives a fresh clone, and nothing at runtime reads either one.

## Where a new file goes

- A note about why something was decided → `lab/context/`, flat, one file per decision
- An open item → the file in `lab/backlog/` for its phase, one line, with a pointer to the argument
- A shipped script → `scripts/`, once. A script that serves only this repository → `lab/scripts/`. `lab/scripts/test-projects/<name>/` is a board for the practice project, `files/` copied in and `build.sh` run, picked with `try.sh --project <name>`
- A rule check → `scripts/rule-checks/<rule-id>.js`, named after the rule it enforces. Nothing registers it
- A change in how Flow behaves, once Flow is installed somewhere → one entry in `CHANGELOG.md`, plus `upgrades/<number>.md` where the change moves a path on a machine
- A scratch file → `tmp/`, never the repository root
- A skill → `skills/<group>/<name>/SKILL.md`. [Adding a skill](skills.md) covers the rest.

Two rules bind the design record. Nothing under `lab/` is a Flow skill, even where a folder there holds a `SKILL.md`: Flow's own skills live in `skills/` alone, and `domain-skills/` is another repository's. And no path inside `lab/` may appear in a skill, in `home/`, or in `project-template/`, because none of those can see `lab/` once installed.
