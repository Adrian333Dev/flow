# Files

Every folder and file Flow puts on your computer and in a project, and what writes each one. `→` marks a link and where it points. `<clone>` is the folder you downloaded Flow into.

## Table of contents

- [The whole tree](#the-whole-tree): every folder on one screen
- [`~/.agents/`](#agents): the skills
- [`~/.claude/`](#claude): what Claude Code reads
- [`~/.flow/`](#flow): your Flow home
- [`~/.local/bin/`](#localbin): the commands you type
- [In a project](#in-a-project): the files at the top, `.claude/`, `.flow/` and `docs/`
- [What stays on one computer](#what-stays-on-one-computer): what `flow sync` never carries

## The whole tree

```text
~/
├─ .agents/
│  └─ skills/flow/skills/<name>   → <clone>/skills/<group>/<name>
├─ .claude/
│  ├─ CLAUDE.md                   → ~/.flow/CLAUDE.md
│  ├─ settings.json
│  ├─ skills/flow                 → ~/.agents/skills/flow
│  ├─ skills/<name>               a skill of your own, for every project
│  └─ projects/                   Claude Code's record of every session
├─ .flow/
│  ├─ CLAUDE.md                   your rules
│  ├─ scripts, guides, docs,
│  │  prompts                     → folders in <clone>
│  ├─ repos/                      every repository Flow downloads
│  ├─ settings.json
│  ├─ settings.local.json
│  ├─ machines/<name>.json
│  ├─ registry.json               the projects on this computer
│  ├─ tickets/
│  ├─ ticket-counter
│  ├─ projects/<project>/         a project's tickets, kept privately
│  ├─ notes/                      ideas and put-off work, every project
│  ├─ findings/                   what sessions learned outside any project or tool
│  ├─ skill-overlays/<skill>.md   lines you add to a skill
│  ├─ wiki/<tool>/
│  ├─ research/<topic>/
│  ├─ logs/
│  ├─ audit/
│  └─ changes/<session>/
└─ .local/bin/
   ├─ flow, fw                    → <clone>/scripts/flow.ts
   └─ util, u                     → ~/.flow/repos/util

<project>/
├─ CLAUDE.md                      the project's rules
├─ .gitignore
├─ .uncommitted-include
├─ .claude/
│  ├─ settings.json
│  └─ skills/<name>
├─ .flow/
│  ├─ tickets/<number>/
│  ├─ tickets/archive/
│  ├─ ticket-counter
│  ├─ findings/
│  ├─ replies/
│  ├─ research/<topic>/
│  └─ settings.json
└─ docs/
   ├─ spec/
   └─ context/
```

## `~/.agents/`

A folder no single tool owns. `flow install` touches only this entry, and leaves anything else there alone.

- **`skills/flow/`**: a link for each Flow skill, beside the file that names the set `flow`, so each one is typed `/flow:<name>`.

## `~/.claude/`

Each folder here can also hold entries from other tools. `flow install` never replaces an entry that is not one of its links.

- **`CLAUDE.md`**: the rules every session loads. A link to `~/.flow/CLAUDE.md`, so `flow sync` carries your rules to your other computers.
- **`settings.json`**: Claude Code's settings. No Flow command writes it: a setup session adds Flow's keys and keeps yours. [Settings](settings.md#claude-codes-settings-file) covers each key.
- **`skills/flow`**: a link to `~/.agents/skills/flow/`, which is how Claude Code finds Flow's skills.
- **`skills/<name>`**: a skill of your own, loaded in every project. Claude Code reads it, and Flow never writes it.
- **`projects/`**: Claude Code's record of every session. `flow audit` reads it.

## `~/.flow/`

Your Flow home: the folder where Flow keeps your rules, notes, settings and tickets. It is a git repository, backed up to a private GitHub repository named `flow-home`, and `flow sync` shares it between your computers.

### Your rules and settings

- **`CLAUDE.md`**: your rules. `~/.claude/CLAUDE.md` links to it. It starts from Flow's template and is yours after that.
- **`skill-overlays/<skill>.md`**: lines you add to a skill, such as `execute.md` for `/flow:execute`. A hook adds the file to the agent's context each time the skill loads, in every project. A fact true for one project belongs in that project's `CLAUDE.md`.
- **`settings.json`** and **`settings.local.json`**: Flow's settings. [Settings](settings.md) covers every key.
- **`machines/<name>.json`**: one record per computer sharing this Flow home, saying when it joined: `{ "name": "macbook-pro", "joined": "2026-09-27" }`.
- **`registry.json`**: the projects on this computer, one line each, prefix and folder: `{ "exp": "/home/me/code/expense", "shop": "/home/me/code/shop" }`. `flow init` adds a project, and so does the first command that writes a ticket in a project that arrived with `.flow/`, such as a clone. A prefix is held by one folder: `flow init` refuses a taken one. `flow doctor` reads the file. A folder path differs on each computer, so the file stays on this one.
- **`README.md`** and **`.gitignore`**: a warning for anyone opening the repository on GitHub, and the list of what stays on this computer.

### Links into your clone

- **`scripts`**: the `flow` command, every hook, and the jobs that run in the background.
- **`guides`**: the writing guides: the house style, and how each kind of file is written.
- **`docs`**: these pages, at the same path on every computer.
- **`prompts`**: the text Flow sends the agent: the reminder beside each message, the restart guide and the setup session's instructions.

### Tickets

- **`tickets/`**: tickets that belong to no project, with ids starting `home-`, such as `home-4` in the folder `4/`. Same shape as a project's.
- **`ticket-counter`**: the highest `home-` number ever given out, so a deleted or moved ticket's number never goes to a new one.
- **`projects/<project>/`**: the tickets of a project kept privately, which the project's `.flow/` links to. `flow init` makes it.

### What sessions learn

- **`notes/`**: one small file per idea or put-off piece of work, for every project. `flow notes new` writes it, and each note names the project it belongs to.
- **`findings/`**: one file per thing a session learned that belongs to no project and no tool: you, a computer, a way of working. `flow findings new --project home` writes it. [Findings](commands.md#findings) covers all 3 places a finding lives.
- **`wiki/<tool>/`**: what Flow knows about one outside tool, shared by every project. `/flow:research` writes its pages, and `flow findings new --wiki <tool>` its `findings/`.
- **`research/<topic>/`**: research reports asked outside any project, one folder per topic and one file per question. Empty until one is asked.

### Records of what happened

- **`logs/install.log`**: every line of this computer's last `flow install`.
- **`logs/history/<month>.jsonl`**: one line per change Flow made to this computer: a repository downloaded, an install.
- **`logs/failures/<month>.jsonl`**: one line per failure of a Flow command, a hook, a tool from a plugin, or the API.
- **`logs/scorecards/<session>.jsonl`**: which rule files entered each session.
- **`audit/`**: the index `flow audit` searches, built from `~/.claude/projects/`. `audit/kept/` holds the sessions `flow audit keep` saved.
- **`changes/<session>/`**: what each helper agent changed. Deleted after 7 days untouched.

### Downloaded repositories

`repos/` holds every repository Flow downloads. `flow install` downloads each one that is missing.

- **`repos/flow`**: Flow itself, as the install line downloaded it. Installed from a clone of your own, it is a link to that clone, and `flow update` leaves it alone: [Developing Flow](developing-flow.md) covers it. Its `mods/flow-session/` folder holds the mod Claude Code loads, named by `CLAUDE_CODE_PLUGIN_DIRS` in [`env`](settings.md#env).
- **`repos/util/`**: `util`, the second command-line tool Flow uses, for file trees and git shortcuts.

## `~/.local/bin/`

- **`flow`** and **`fw`**: links to `scripts/flow.ts` in your clone. `flow install` makes them.
- **`util`** and **`u`**: links into `~/.flow/repos/util/`. `flow install` makes them.

## In a project

### The files at the top

- **`CLAUDE.md`**: what every session in this project needs. It starts with 2 sections, `## Project` and `## Rules`, and sessions fill it in.
- **`.gitignore`**: ignores `node_modules/` and what a prototype generates. `.flow/` is hidden by `.git/info/exclude` instead, git's ignore list for this clone alone.
- **`.uncommitted-include`**: files git ignores that should still travel with your uncommitted work. Empty to start.

`flow init` writes all 4. Your next commit takes them, and none is Flow's alone after that.

### `.claude/`

- **`settings.json`**: this project's Claude Code settings, added on top of `~/.claude/settings.json`.
- **`skills/<name>`**: a skill this project keeps for itself, loaded in this project alone.

### `.flow/`

The project's tickets and what sessions learn in it. It is a link into `~/.flow/projects/<project>/`, in your Flow home, so the tickets never touch your code's history and `flow sync` carries them.

- **`tickets/<number>/`**: one folder per ticket, named by its number alone, such as `7/` for `shop-7`. The files hold no prefix either: `id`, `parent` and `deps` are numbers, so changing `ticketPrefix` keeps every ticket. Each holds a `ticket.md`, the index of its questions, decisions and tasks, and a `context.md`, one section per question or task. `reports/`, `protos/`, `jobs/` and `history.md` appear once the work writes them.
- **`tickets/archive/`**: finished and dropped tickets, moved here whole.
- **`ticket-counter`**: the highest ticket number this project ever gave out, such as `75`, so a deleted or moved ticket's number never goes to a new one.
- **`findings/`**: one file per thing a session learned about this project. `flow findings new` writes it.
- **`replies/`**: every message the agent wrote since your last message, saved at the end of each turn as `<session>-<n>.md`, where `n` counts your messages in the window. It holds a `---` between the messages and no tool calls, the same text `/copy-all` copies. The mod keeps the newest 100 files. They stay on this computer.
- **`research/<topic>/`**: the research reports this project asked for, one folder per topic. `/flow:research` writes them.
- **`settings.json`**: this project's [`ticketPrefix`](settings.md#ticketprefix).

### `docs/`

Sessions write here, and Flow owns none of it.

- **`intake/`**: notes, brainstorms and drafts you drop in. `/flow:groundwork` reads them before designing.
- **`spec/`**: what the product is. `product.md` always, plus a file per large part of it, which `product.md` lists. `/flow:tickets-from-spec` cuts tickets from it.
- **`context/`**: facts about this project that some work needs and most does not.

## What stays on one computer

`flow sync` carries everything else in `~/.flow/` to your other computers. These stay:

- `settings.local.json`, `logs/`, `audit/` and `changes/`
- each project's `replies/`
- `repos/`: each computer downloads its own
- each tool's `wiki/<tool>/downloads/`
- `registry.json`: where each project sits on this computer
- the small files Flow keeps while it works, such as `records-sync.json`

Claude Code's `~/.claude/projects/` stays too. A project's `.flow/` travels inside your Flow home.
