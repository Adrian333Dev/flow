# Files

Every folder and file Flow puts on your computer and in a project, and what writes each one. `→` marks a link and where it points. `<clone>` is the folder you downloaded Flow into.

## Table of contents

- [The whole tree](#the-whole-tree): every folder on one screen
- [`~/.agents/`](#agents): the rules and the skills
- [`~/.claude/`](#claude): what Claude Code reads
- [`~/.flow/`](#flow): your Flow home
- [`~/.local/bin/`](#localbin): the commands you type
- [In a project](#in-a-project): the files at the top, `.claude/`, `.flow/` and `docs/`
- [What stays on one computer](#what-stays-on-one-computer): what `flow sync` never carries

## The whole tree

```bash
~/
├─ .agents/
│  ├─ AGENTS.md                   → ~/.flow/AGENTS.md
│  └─ skills/flow/skills/<name>   → <clone>/skills/<group>/<name>
├─ .claude/
│  ├─ CLAUDE.md                   one line: @~/.agents/AGENTS.md
│  ├─ settings.json
│  ├─ skills/flow                 → ~/.agents/skills/flow
│  ├─ skills/<name>               → a skill switched on everywhere
│  ├─ skills/home-<n>/            a ticket skill
│  ├─ agents/, rules/, commands/  → files in <clone>/claude/
│  └─ projects/                   Claude Code's record of every session
├─ .flow/
│  ├─ AGENTS.md                   your rules
│  ├─ scripts, references, docs   → folders in <clone>
│  ├─ repos/                      every repository Flow downloads
│  ├─ settings.json
│  ├─ settings.local.json
│  ├─ version
│  ├─ machines/<name>.json
│  ├─ tickets/
│  ├─ projects/<project>/         a project's tickets, kept privately
│  ├─ workflow-notes.md
│  ├─ study-cases/<issue>/
│  ├─ wiki/<tool>/
│  ├─ research/
│  ├─ private-skills/<name>/
│  ├─ logs/
│  ├─ audit/
│  ├─ changes/<session>/
│  ├─ migrations/<place>/<time>/
│  └─ originals/<place>/
└─ .local/bin/
   ├─ flow, fw                    → <clone>/scripts/flow.js
   └─ util, u                     → ~/.flow/repos/util

<project>/
├─ AGENTS.md
├─ CLAUDE.md                      one line: @AGENTS.md
├─ .gitignore
├─ .uncommitted-include
├─ .claude/
│  ├─ settings.json
│  ├─ skills/<name>
│  └─ skills/<id>/                a ticket skill
├─ .flow/
│  ├─ tickets/<id>-<label>/
│  ├─ tickets/archive/
│  ├─ inbox.md
│  ├─ findings/
│  ├─ overlays/<skill>.md
│  ├─ settings.json
│  └─ version
└─ docs/
   ├─ spec/
   ├─ context/
   └─ research/
```

## `~/.agents/`

A folder no single tool owns. `flow install` touches only these 2 entries, and leaves anything else there alone.

- **`AGENTS.md`**: the rules every session loads. A link to `~/.flow/AGENTS.md`, so `flow sync` carries your rules to your other computers.
- **`skills/flow/`**: a link for each Flow skill that is on, beside the file that names the set `flow`, so each one is typed `/flow:<name>`.

## `~/.claude/`

Each folder here can also hold entries from other tools. `flow install` never replaces an entry that is not one of its links.

- **`CLAUDE.md`**: one line pulling in `~/.agents/AGENTS.md`, since Claude Code never reads `~/.agents/` by itself.
- **`settings.json`**: Claude Code's settings, with Flow's keys added. [Settings](settings.md#claude-codes-settings-file) covers each key.
- **`skills/flow`**: a link to `~/.agents/skills/flow/`, which is how Claude Code finds Flow's skills.
- **`skills/<name>`**: a link for each skill from a skill repository switched on everywhere. `flow skills on <name> --global` makes it.
- **`skills/home-<n>/`**: a [ticket skill](skills.md#ticket-skills) for each open ticket in your Flow home.
- **`agents/haiku-worker.md`**: the helper agent Flow hands simple jobs to. [Subagents](../subagents.md) covers it.
- **`rules/comments.md`**: the rules for code comments, loaded only while the agent works on code.
- **`commands/capture.md`**: [`/capture`](skills.md#capture).
- **`projects/`**: Claude Code's record of every session. `flow audit` reads it.

## `~/.flow/`

Your Flow home: the folder where Flow keeps your rules, notes, settings and tickets. It is a git repository, backed up to a private GitHub repository named `flow-home`, and `flow sync` shares it between your computers. [Two machines](../two-machines.md) covers how.

### Your rules and settings

- **`AGENTS.md`**: your rules. The setup session writes it from Flow's template and what it kept from your old rule files. After that it is yours, and sessions add what they learn about you.
- **`settings.json`** and **`settings.local.json`**: Flow's settings. [Settings](settings.md) covers every key.
- **`version`**: the newest Flow change this computer has applied. `flow` refuses to run while it is missing, since that means the install never finished.
- **`machines/<name>.json`**: one record per computer sharing this Flow home, saying which version of Flow it is on: `{ "name": "laptop-mac", "joined": "2026-09-27", "flowVersion": 12 }`.
- **`README.md`** and **`.gitignore`**: a warning for anyone opening the repository on GitHub, and the list of what stays on this computer.

### Links into your clone

- **`scripts`**: the `flow` command, every hook, and the jobs that run in the background.
- **`references`**: the house style, and the line the reminder prints.
- **`docs`**: these pages, at the same path on every computer.

### Tickets

- **`tickets/`**: tickets that belong to no project, with ids starting `home-`, such as `home-4`. Same shape as a project's.
- **`projects/<project>/`**: the tickets of a project kept privately, which the project's `.flow/` links to. `flow init --private` and `flow store private` make it.

### What sessions learn

[Learning](../learning.md) covers each of these.

- **`workflow-notes.md`**: one dated line per bit of friction worth remembering.
- **`study-cases/<issue>/`**: one file per recorded mistake, filed under the kind of mistake. `flow cases new` writes them.
- **`wiki/<tool>/`**: what Flow knows about one outside tool, shared by every project. `/flow:research` writes it.
- **`research/`**: research reports true in any project, such as a comparison of services.
- **`private-skills/<name>/`**: skills you write for yourself and never share. [Extend](../extend.md) covers writing one.

### Records of what happened

- **`logs/install.log`**: every line of this computer's last `flow install`.
- **`logs/history/<month>.jsonl`**: one line per change Flow made to this computer: a skill switched, a repository downloaded, an install, a restore.
- **`logs/failures/<month>.jsonl`**: one line per failure of a Flow command, a hook, a tool from a plugin, or the API.
- **`logs/scorecards/<session>.jsonl`**: one line per rule check that ran. `flow scorecard` reads them.
- **`audit/`**: the index `flow audit` searches, built from `~/.claude/projects/`. `audit/kept/` holds the sessions `flow audit keep` saved.
- **`changes/<session>/`**: what each helper agent changed. Deleted after 7 days untouched.
- **`migrations/<place>/<time>/`**: each change a setup or an update session made, as a list of changes and the new files.
- **`originals/<place>/`**: every path as it was before Flow first touched this computer or a project. `flow restore` puts them back.

### Downloaded repositories

`repos/` holds every repository Flow downloads. `flow install` downloads each one that is missing.

- **`repos/flow`**: a link to your clone.
- **`repos/util/`**: `util`, the second command-line tool Flow uses, for file trees and git shortcuts.
- **`repos/toolbox/`**: a catalog of outside tools that `/flow:research` reads.
- **`repos/sources/<owner>_<repo>/`**: one per skill repository in [`sources`](settings.md#sources). Each updates itself when a session opens.

## `~/.local/bin/`

- **`flow`** and **`fw`**: links to `scripts/flow.js` in your clone. `flow install` makes them.
- **`util`** and **`u`**: links into `~/.flow/repos/util/`. `flow install` makes them.

## In a project

### The files at the top

- **`AGENTS.md`**: what every session in this project needs. It starts with 2 sections, `## Project` and `## Rules`, and sessions fill it in.
- **`CLAUDE.md`**: one line pulling in `AGENTS.md`.
- **`.gitignore`**: ignores `tmp/`, `node_modules`, the links to skills, and `.flow/`.
- **`.uncommitted-include`**: files git ignores that should still travel with your uncommitted work. Empty to start.

`flow init` writes all 4. Your next commit takes them, and none is Flow's alone after that.

### `.claude/`

- **`settings.json`**: this project's Claude Code settings, added on top of `~/.claude/settings.json`.
- **`skills/<name>`**: a link for each skill switched on for this project, or a real folder for a skill this project keeps for itself.
- **`skills/<id>/`**: a [ticket skill](skills.md#ticket-skills) for each open ticket. git never sees them.

### `.flow/`

The project's tickets and what sessions learn in it. It is the project's `flow` branch checked out here, sharing no history with your code. In a project kept privately, it is a link into `~/.flow/projects/` instead. [New project](../new-project.md) covers both.

- **`tickets/<id>-<label>/`**: one folder per ticket, such as `shop-7-safari-cookie/`. [Tickets](../tickets.md) shows what it holds.
- **`tickets/archive/`**: finished and dropped tickets, moved here whole.
- **`inbox.md`**: notes with no home yet. `/flow:file-findings` sorts them.
- **`findings/`**: one file per lesson a session learned, waiting for `/flow:file-findings`.
- **`overlays/<skill>.md`**: lines this project adds to a skill. [Configure](../configure.md) covers overlays.
- **`settings.json`**: this project's skill lines and [`ticketPrefix`](settings.md#ticketprefix).
- **`version`**: the newest Flow change this project has applied.

### `docs/`

Sessions write here, and Flow owns none of it.

- **`spec/`**: what the product is. `/flow:tickets-from-spec` cuts tickets from it.
- **`context/`**: facts about this project that some work needs and most does not.
- **`research/`**: research reports true only for this project.

## What stays on one computer

`flow sync` carries everything else in `~/.flow/` to your other computers. These stay:

- `settings.local.json`, `version`, `logs/`, `audit/`, `changes/` and `originals/`
- `repos/`: each computer downloads its own, from the same `sources` list
- each tool's `wiki/<tool>/downloads/`
- the small files Flow keeps while it works: `run.json`, `records-sync.json`, `skills-update.json` and `status-line.json`

Claude Code's `~/.claude/projects/` stays too. A project's `.flow/` travels with the project: on its `flow` branch, or inside your Flow home.
