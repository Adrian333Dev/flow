# Where everything lives

Flow puts files in 6 places on a machine, reads 2 clones, and keeps a working store inside each project. This page shows every folder in one tree, then says what each entry holds and what writes it.

## Table of contents

- [The whole tree](#the-whole-tree)
- [On the machine](#on-the-machine)
- [The 2 clones](#the-2-clones)
- [In a project](#in-a-project)
- [What stays on one machine](#what-stays-on-one-machine)

## The whole tree

`→` marks a symlink and where it points. `<clone>` is wherever you cloned Flow.

```text
~/
├─ .agents/                       the one real copy of each file Flow keeps
│  ├─ AGENTS.md                   the rules, for both Claude Code and Codex
│  └─ skills/flow/
│     ├─ .claude-plugin/          the manifest, a real file, naming the set flow
│     └─ skills/<name>            → <clone>/skills/<group>/<name>
├─ .claude/                       what Claude Code reads
│  ├─ CLAUDE.md                   one line: @~/.agents/AGENTS.md
│  ├─ settings.json
│  ├─ skills/flow                 → ~/.agents/skills/flow
│  ├─ agents/<file>.md            → <clone>/agents/<file>.md
│  ├─ rules/<file>.md             → <clone>/rules/<file>.md
│  └─ projects/                   session transcripts
├─ .codex/                        what Codex reads
│  ├─ AGENTS.md                   → ~/.agents/AGENTS.md
│  └─ sessions/                   session transcripts
├─ .flow/                         what only Flow reads
│  ├─ scripts                     → <clone>/scripts
│  ├─ references                  → <clone>/references
│  ├─ settings.json
│  ├─ workflow-notes.md
│  ├─ study-cases/<issue>/
│  ├─ scorecards/<session>.jsonl
│  ├─ audit/
│  ├─ changes/<session>/
│  ├─ private-skills/<name>/
│  ├─ migrations/<place>/<time>/
│  ├─ snapshots/<place>/<time>/
│  ├─ groundwork/<slug>/
│  └─ tickets/
├─ .util/sources
└─ .local/bin/
   ├─ flow, fw                    → <clone>/scripts/flow/flow.js
   └─ util, u                     → the util clone

<clone>/                          Flow itself
<domain-skills clone>/skills/     one folder per domain skill

<project>/
├─ AGENTS.md
├─ CLAUDE.md                      one line: @AGENTS.md
├─ .gitignore
├─ .work-include
├─ .claude/
│  ├─ settings.json
│  └─ skills/<name>
├─ .flow/
│  ├─ tickets/<id>-<slug>/
│  ├─ tickets/archive/
│  ├─ groundwork/<slug>/
│  ├─ inbox.md
│  ├─ findings/
│  ├─ overlays/<skill>.md
│  ├─ domain-skills.txt
│  ├─ private-skills.txt
│  └─ settings.json
└─ docs/
   ├─ spec/
   ├─ context/
   └─ research/
```

## On the machine

### `~/.agents/`, the one real copy of each file

Claude Code and Codex each keep a folder of their own, and each reaches this one the way it can: Claude Code through an import and a link, Codex through a link. The folder belongs to neither of them, and Codex already reads skills from it.

- **`AGENTS.md`**: the rules every session loads, in Claude Code and in Codex. `flow install` copies `home/AGENTS.md` here once, when no file exists or the one there is empty, and from then on the file is yours. Sessions write what they learn about you into it.
- **`skills/flow/`**: every Flow skill, one symlink each, named for the skill with no group folder. They sit inside a folder of their own because of the file beside them, `.claude-plugin/plugin.json`, which holds the one word `flow`. Both harnesses offer each skill as `flow:<name>`, so you type `/flow:groundwork` in Claude Code and `$flow:groundwork` in Codex. `flow install` copies the manifest and makes the links.

`skills/` may also hold skills from other tools. `flow install` touches only `flow/`.

### `~/.claude/`, what Claude Code reads

- **`CLAUDE.md`**: one line, `@~/.agents/AGENTS.md`. Claude Code reads `CLAUDE.md` and never `AGENTS.md`, and the `@` line pulls the rules in. `flow install` copies it from `home/CLAUDE.md` in the clone when no file exists or the one there is empty. A `CLAUDE.md` you wrote yourself is left alone, and `flow install` prints the line to add to it.
- **`settings.json`**: Claude Code's settings. `flow install` never writes it. It prints the hooks and permissions to merge, and you merge them by hand. [Settings](settings.md) explains every key.
- **`skills/flow`**: a symlink to `~/.agents/skills/flow/`. Claude Code never reads `~/.agents/`, so this link is how it finds the same skills. `flow install` makes it.
- **`agents/<file>.md`**: one symlink per subagent definition, such as `haiku-worker.md`. `flow install` makes them.
- **`rules/<file>.md`**: one symlink per rules file. `flow install` makes them.
- **`projects/`**: every session's transcript. Claude Code writes it, and `flow audit` reads it.

Each of these folders may also hold entries from other tools. `flow install` never replaces an entry that is not a symlink.

### `~/.codex/`, what Codex reads

- **`AGENTS.md`**: a symlink to `~/.agents/AGENTS.md`. Codex has no import, so it gets a link. `flow install` makes it, and leaves alone an `AGENTS.md` you wrote yourself.
- **`sessions/`**: every Codex session's transcript. Codex writes it, and `flow audit` does not read it yet.

The rest of `~/.codex/` is Codex's own: its settings, its login, its subagents. `flow install` touches none of it.

**Flow does not support Codex yet.** Codex reads Flow's rules and skills, and none of Flow's hooks run there, so the git switch, the change record and the reminder are missing from a Codex session.

### `~/.flow/`, what only Flow reads

- **`scripts`**: a symlink to the clone's `scripts/`: the CLI, every hook, and `apply-migration.js`, which carries out a migration. `flow install` makes it.
- **`references`**: a symlink to the clone's `references/`: the house style, the workflow map, and the line the reminder hook prints. `flow install` makes it.
- **`settings.json`**: 2 keys. `git` is the git write state, which `flow git` writes. `domainSkills` is the path to your domain-skills clone, which you write.
- **`workflow-notes.md`**: one dated line per bit of friction worth remembering. Sessions append to it.
- **`study-cases/<issue>/<date>-<slug>.md`**: one file per recorded failure, filed under the name of the failure. Sessions write them through `flow cases new`.
- **`scorecards/<session>.jsonl`**: one file per session. `rule-check.js` adds a line for every rule check that ran, and `instructions-loaded.js` a line for every instruction file that loaded. `flow scorecard` reads them.
- **`audit/`**: `audit.db`, the index of every transcript. `flow audit index` builds it, and it can be rebuilt from `~/.claude/projects/` at any time.
- **`changes/<session>/`**: what each subagent changed, filed under its agent id. `changes.js` writes it, and deletes a session's folder once nothing has touched it for 7 days.
- **`private-skills/<name>/`**: skills you write for yourself and never share. You write them. `flow private-skills` links one into a project.
- **`migrations/<place>/<time>/`**: one folder per migration, a change to where Flow, Claude Code and Codex keep their files. It holds `migration.md`, one line per change, and `files/`, the new version of each file it writes. `/flow:setup-machine`, `/flow:setup-project` and `/flow:migrate` write it. `<place>` is `machine`, or the project's full path with every character that is not a letter or a digit turned into `-`, and `<time>` is when it was written. [Migrations and snapshots](reference.md#migrations-and-snapshots) has the whole of it.
- **`snapshots/<place>/<time>/`**: a copy of every path one migration changed, taken just before it changed, filed the same way. `apply-migration.js` writes it, and `flow snapshot restore` puts every path back from it.
- **`groundwork/<slug>/`**: groundwork run outside any project. `/flow:groundwork` writes it.
- **`tickets/`**: tickets made outside any project, with `FLOW_PROJECT=$HOME flow new "<title>"`. Same shape as a project's.

### `~/.util/` and `~/.local/bin/`

- **`~/.util/sources`**: one folder per line, each holding `util` commands. `util install` and `util source add` write it.
- **`~/.local/bin/flow`** and **`fw`**: symlinks to `flow.js` in the clone. `flow install` makes them.
- **`~/.local/bin/util`** and **`u`**: symlinks into the util clone. `util install` makes them.

## The 2 clones

- **The Flow clone**, anywhere you like: everything Flow installs lives here once, and every path above points into it. `git pull` updates every machine path at once. [The repository layout](../dev/layout.md) maps it.
- **The domain-skills clone**, anywhere you like: one folder per domain skill under `skills/`. `domainSkills` in `~/.flow/settings.json` names that folder. `flow domain-skills add` links a skill from it into a project, and `flow contribute` sends a project's findings back to its repository as pull requests.

## In a project

### The files at the root

- **`AGENTS.md`**: rules for this project alone. It starts from `project-template/`, and you and the sessions fill it in. Codex reads it as it is.
- **`CLAUDE.md`**: one line, `@AGENTS.md`, from the template, so Claude Code loads the same rules.
- **`.gitignore`**: from the template. It ignores the skill symlinks and `.flow/settings.json`, and keeps everything else in `.flow/` committed.
- **`.work-include`**: from the template, empty. It names the gitignored files that travel with `util git work send`.

### `.claude/`

- **`settings.json`**: this project's Claude Code settings, merged key by key over `~/.claude/settings.json`. You write it.
- **`skills/<name>`**: a real folder for a skill belonging to this project alone, committed. A symlink for each domain or private skill added here, gitignored, since it holds this machine's path.

### `.flow/`, Flow's working store

- **`tickets/<id>-<slug>/`**: one folder per ticket, holding `ticket.md`, `groundwork/`, and whatever the work writes. `flow new` makes it, and sessions fill it. [Tickets](tickets.md) shows the shape.
- **`tickets/archive/`**: finished tickets, moved whole. Nothing is deleted.
- **`groundwork/<slug>/`**: groundwork that is not a ticket yet, holding `map.md` and a `handoff.md` when a session stopped halfway. `/flow:groundwork` writes it, and `flow new --from-groundwork` moves it into a ticket.
- **`inbox.md`**: raw notes with no obvious home yet. Sessions append to it, and `/flow:file-findings` drains it.
- **`findings/`**: one file per lesson a session learned. `/flow:file-findings` files each into a skill or a rule. A finding about a domain skill waits in `findings/<skill>/` for `flow contribute`.
- **`overlays/<skill>.md`**: text this project adds to the end of a global skill when it loads. You or a session write it.
- **`domain-skills.txt`** and **`private-skills.txt`**: the names of the skills added to this project, committed, so a second machine can relink them. `flow domain-skills` and `flow private-skills` write them.
- **`settings.json`**: a git unlock for this project alone, with its expiry time. `flow git allow --project` writes it, and the guard removes the entry once it expires. Gitignored.

### `docs/`, the project's own

Flow sessions write into these and own none of them.

- **`spec/`**: what the product is.
- **`context/`**: verified facts about this repository that outlive any ticket.
- **`research/<question>.md`**: `/flow:research` reports, flat, shared by the whole project.

## What stays on one machine

These exist on one machine and nothing copies them to another: `~/.claude/projects/`, `~/.codex/sessions/`, `~/.flow/scorecards/`, `~/.flow/audit/`, `~/.flow/changes/`, `~/.flow/study-cases/`, `~/.flow/migrations/`, `~/.flow/snapshots/`, `~/.flow/workflow-notes.md`, and each project's `.flow/settings.json`. Everything in a project's `.flow/` except that one file is committed, so it travels with the repository.
