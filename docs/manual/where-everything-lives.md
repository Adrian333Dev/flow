# Where everything lives

Flow puts files in 5 places on a machine, keeps every clone it reads in one folder, and keeps a working store inside each project. This page shows every folder in one tree, then says what each entry holds and what writes it. Flow does not support Codex yet, and writes nothing into `~/.codex/`.

## Table of contents

- [The whole tree](#the-whole-tree)
- [On the machine](#on-the-machine)
- [The clones](#the-clones)
- [In a project](#in-a-project)
- [What stays on one machine](#what-stays-on-one-machine)

## The whole tree

`→` marks a symlink and where it points. `<clone>` is wherever you cloned Flow.

```text
~/
├─ .agents/                       the one real copy of each file Flow keeps
│  ├─ AGENTS.md                   the rules
│  └─ skills/flow/
│     ├─ .claude-plugin/          the manifest, a real file, naming the set flow
│     └─ skills/<name>            → <clone>/skills/<group>/<name>
├─ .claude/                       what Claude Code reads
│  ├─ CLAUDE.md                   one line: @~/.agents/AGENTS.md
│  ├─ settings.json
│  ├─ skills/flow                 → ~/.agents/skills/flow
│  ├─ skills/<name>               → a skill switched on for the machine
│  ├─ agents/<file>.md            → <clone>/agents/<file>.md
│  ├─ rules/<file>.md             → <clone>/rules/<file>.md
│  └─ projects/                   session transcripts
├─ .flow/                         what only Flow reads
│  ├─ scripts                     → <clone>/scripts
│  ├─ references                  → <clone>/references
│  ├─ docs                        → <clone>/docs
│  ├─ repos/                      every clone Flow reads
│  │  ├─ flow                     → <clone>
│  │  ├─ util/
│  │  ├─ toolbox/
│  │  └─ sources/<owner>_<repo>/  one per skill repository
│  ├─ settings.json
│  ├─ settings.local.json
│  ├─ version
│  ├─ logs/                       what happened on this machine
│  │  ├─ install.log
│  │  ├─ history/<month>.jsonl
│  │  ├─ failures/<month>.jsonl
│  │  └─ scorecards/<session>.jsonl
│  ├─ skills-update.json
│  ├─ workflow-notes.md
│  ├─ study-cases/<issue>/
│  ├─ audit/
│  ├─ changes/<session>/
│  ├─ private-skills/<name>/
│  ├─ wiki/<tool>/                one folder per outside tool
│  ├─ research/<question>.md
│  ├─ migrations/<place>/<time>/
│  ├─ originals/<place>/
│  ├─ groundwork/<slug>/
│  └─ tickets/
├─ .util/sources
└─ .local/bin/
   ├─ flow, fw                    → <clone>/scripts/flow/flow.js
   └─ util, u                     → ~/.flow/repos/util

<clone>/                          Flow itself, anywhere you like

<project>/
├─ AGENTS.md
├─ CLAUDE.md                      one line: @AGENTS.md
├─ .gitignore
├─ .uncommitted-include
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
│  └─ settings.json
└─ docs/
   ├─ spec/
   ├─ context/
   └─ research/
```

## On the machine

### `~/.agents/`, the one real copy of each file

The folder belongs to no one tool. Claude Code reaches it through an import and a link.

- **`AGENTS.md`**: the rules every session loads, as a link to `~/.flow/AGENTS.md`. The link is there so `flow sync` carries your rules to your other machines with the rest of `~/.flow/`. `flow setup` makes it.
- **`skills/flow/`**: every Flow skill switched on, one symlink each, named for the skill with no group folder. They sit inside a folder of their own because of the file beside them, `.claude-plugin/plugin.json`, which holds the one word `flow`. Claude Code offers each skill as `flow:<name>`, so you type `/flow:groundwork`. `flow install` copies the manifest and makes the links. The 2 skills in `skills/dev/` start with no link, and `flow skills on <name> --machine` adds one.

`skills/` may also hold skills from other tools. `flow install` touches only `flow/`.

### `~/.claude/`, what Claude Code reads

- **`CLAUDE.md`**: one line, `@~/.agents/AGENTS.md`. Claude Code never reads anything under `~/.agents/` by itself, so the `@` line pulls the rules in. `flow setup` writes it in place of what it held, after moving anything worth keeping into the rule file.
- **`settings.json`**: Claude Code's settings. `flow install` never writes it. `flow setup` merges Flow's hooks and permissions into it. [Settings](settings.md) explains every key.
- **`skills/flow`**: a symlink to `~/.agents/skills/flow/`. Claude Code never reads `~/.agents/`, so this link is how it finds the same skills. `flow install` makes it.
- **`skills/<name>`**: a symlink for each skill from a skill repository or `~/.flow/private-skills/` switched on for the whole machine. `flow skills on --machine` or `--global` makes it, and so does the next session start on your other machines.
- **`agents/<file>.md`**: one symlink per subagent definition, such as `haiku-worker.md`. `flow install` makes them.
- **`rules/<file>.md`**: one symlink per rules file. `flow install` makes them.
- **`projects/`**: every session's transcript. Claude Code writes it, and `flow audit` reads it.

Each of these folders may also hold entries from other tools. `flow install` never replaces an entry that is not a symlink.

### `~/.flow/`, what only Flow reads

- **`scripts`**: a symlink to the clone's `scripts/`: the CLI, every hook, `apply-migration.js`, which carries out a migration, `skills-pull.js`, which updates every skill repository in the background, and `file-suggestion.js`, which builds the list `@` opens. `flow install` makes it.
- **`references`**: a symlink to the clone's `references/`: the house style, the workflow map, the map of skills, plugins, MCP servers and findings, the line the reminder hook prints, and `harnesses/`, where each harness keeps its own files. `flow install` makes it.
- **`docs`**: a symlink to the clone's `docs/`: the manual you are reading, under `manual/`, and the pages for whoever changes Flow, under `dev/`. `/flow:help` answers a question by naming a page under `~/.flow/docs/manual/`, which is the same path on every machine whatever your clone is called. `flow install` makes it.
- **`AGENTS.md`**: the rules every session loads, reached through the link `~/.agents/AGENTS.md`. `flow setup` writes it from `home/AGENTS.md`, with what it kept from your old rule files in `## Preferences` and `## The user`, and from then on the file is yours. Sessions write what they learn about you into it.
- **`setup-prompt.md`**: the text a setup session starts with, Flow's rules followed by the setup's instructions. `flow setup` writes it each time it opens that session, and `flow setup finish` deletes it, so it exists only while a setup is running. git ignores it.
- **`migrate-prompt.md`**: the instructions an update session starts with. `flow up` writes it each time it opens that session, and `flow up finish` deletes it, so it exists only while an update is running. git ignores it.
- **`settings.json`**: the settings both your machines share. `reminder` is whether the reminder prints beside every message, `sessionCheck` whether a session opens with a line about what needs attention, `setupReminder` whether a git repository without Flow gets a line suggesting it, and `wrapUp` whether the agent is told to hand off once the conversation passes `wrapUpAt` tokens: one key per line Flow prints by itself. `sources` lists the skill repositories, and `skills` the skills switched on or off for every machine. `skillsAutoUpdate` is whether each skill repository pulls itself when a session opens.
- **`settings.local.json`**: the settings this machine keeps to itself, which git ignores. `skills` here is the skills switched on or off for this machine alone, written by `flow skills --machine`. `setupReminderSkip` lists the folders the setup suggestion never shows in.
- **`repos/`**: every clone Flow reads, each described under [The clones](#the-clones).
- **`logs/`**: what happened on this machine, which git ignores. Nothing here is ever rewritten. A log that grows gets one file per month, such as `history/2026-09.jsonl`: the newest file is the current month, and nothing moves or trims an old one.
  - **`install.log`**: every line of this machine's last `flow install`, where the screen showed a summary.
  - **`history/<month>.jsonl`**: one JSON line per change Flow made to this machine: a clone, a pull, a skill switched, an install, a setup, a migration applied or a restore. `flow skills`, `flow install`, `apply-migration.js`, `flow restore` and the background pull write it.
  - **`failures/<month>.jsonl`**: one JSON line per failure of something Flow built or chose: an MCP tool, a Flow command or script, an API error that ended a turn. The `failures.js` hook writes most of them, the install, `flow sync` and the background pull the ones no session sees, and the agent what no hook can see. A line from a session names the session and the tool call, so the whole failure is one lookup away in its transcript. [The failure log](reference.md#the-failure-log) has an example.
  - **`scorecards/<session>.jsonl`**: one file per session. `rule-check.js` adds a line for every rule check that ran, and `instructions-loaded.js` a line for every instruction file that loaded. `flow scorecard` reads them.
- **`skills-update.json`**: what the last background pull of each skill repository found, such as the skills a fetch left waiting. `skills-pull.js` writes it and the session check prints it, and it is gone whenever there is nothing to say.
- **`version`**: one line, the number of the newest `CHANGELOG.md` entry this machine has applied. A `flow` command refuses while it is missing, since that means `flow setup` never finished.
- **`machines/<name>.json`**: one record per machine sharing this Flow home, such as `{ "name": "laptop-mac", "joined": "2026-09-27", "flowVersion": 12 }`. `flowVersion` is the entry that machine is on. `flow install` sends this machine's up when it joins, `flow setup finish` and `flow up finish` rewrite it, and `flow sync` refuses while another machine's is higher. [`flow sync`](reference.md#flow-sync) has the whole of it.
- **`README.md`**: a warning for whoever opens the repository on GitHub: Flow manages it, and a hand edit can break sync on every machine. The first install sends it, and `flow up` rewrites it.
- **`.gitignore`**: what stays on this machine. `flow install` rewrites it every run, and its first line, `# What belongs to this machine alone.`, is how the install tells a Flow home from another repository.
- **`workflow-notes.md`**: one dated line per bit of friction worth remembering. Sessions append to it.
- **`study-cases/<issue>/<date>-<slug>.md`**: one file per recorded failure, filed under the name of the failure. Sessions write them through `flow cases new`.
- **`audit/`**: `audit.db`, the index of every transcript. `flow audit index` builds it, and it can be rebuilt from `~/.claude/projects/` at any time.
- **`changes/<session>/`**: what each subagent changed, filed under its agent id. `changes.js` writes it, and deletes a session's folder once nothing has touched it for 7 days.
- **`private-skills/<name>/`**: skills you write for yourself and never share. You write them, and `flow skills on` switches one on.
- **`wiki/<tool>/`**: what Flow knows about one outside tool, such as `next.js`, shared by every project. `index.md` holds shortcuts into the tool's docs: its Context7 id, and which page answers what. `research/` holds reports about the tool alone. `findings/` holds what sessions learned using the tool, waiting to be written into its skill. `downloads/` holds the docs and the source this machine downloaded, which git ignores. `/flow:research` and capture write it. [Research and capture](research-and-capture.md) has the whole of it.
- **`research/<question>.md`**: research reports about no single tool, true in any project, such as a comparison of services. `/flow:research` writes them.
- **`migrations/<place>/<time>/`**: one folder per migration, a change to where Flow and Claude Code keep their files. It holds `migration.md`, one line per change, and `files/`, the new version of each file it writes. `flow setup`, `flow setup project` and `flow up` write it. `<place>` is `machine`, or the project's full path with every character that is not a letter or a digit turned into `-`, and `<time>` is when it was written. [Migrations and the original](reference.md#migrations-and-the-original) has the whole of it.
- **`originals/<place>/`**: every path as it was before Flow first touched that place, one folder per place and no date anywhere. `flow install` writes the machine's, the first `flow setup` or `flow setup project` finishes it, and nothing is added after that. `flow restore` puts one back.
- **`groundwork/<slug>/`**: groundwork run outside any project. `/flow:groundwork` writes it.
- **`tickets/`**: tickets made outside any project, with `FLOW_PROJECT=$HOME flow new "<title>"`. Same shape as a project's.

### `~/.util/` and `~/.local/bin/`

- **`~/.util/sources`**: one folder per line, each holding `util` commands. `util install` and `util source add` write it.
- **`~/.local/bin/flow`** and **`fw`**: symlinks to `flow.js` in the clone. `flow install` makes them.
- **`~/.local/bin/util`** and **`u`**: symlinks into `~/.flow/repos/util/`. `util install` makes them, and `flow install` runs it.

## The clones

Every clone lives in `~/.flow/repos/`. `flow install` clones each one that is missing, and nothing else clones.

- **`flow`**: a symlink to your Flow clone, which sits anywhere you like. Everything Flow installs lives there once, and every path above points into it. `git pull` updates every machine path at once. [The repository layout](../dev/layout.md) maps it.
- **`util/`**: util, the command-line tools behind `util` and `u`.
- **`toolbox/`**: the catalog of outside tools `/flow:research` reads. It is never pulled.
- **`sources/<owner>_<repo>/`**: one per skill repository in `sources` in `~/.flow/settings.json`, the [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) repository being the first. Each pulls itself when a session opens, so a skill linked anywhere is current. `flow contribute` sends a project's findings about a domain skill back to its repository as pull requests.

## In a project

### The files at the root

- **`AGENTS.md`**: rules for this project alone. It starts from `project-template/`, and you and the sessions fill it in.
- **`CLAUDE.md`**: one line, `@AGENTS.md`, from the template, so Claude Code loads the same rules.
- **`.gitignore`**: from the template. It ignores the skill symlinks, and keeps everything in `.flow/` committed.
- **`.uncommitted-include`**: from the template, empty. It names the gitignored files that travel with `util git uncommitted send`.

### `.claude/`

- **`settings.json`**: this project's Claude Code settings, merged key by key over `~/.claude/settings.json`. You write it.
- **`skills/<name>`**: a real folder for a skill belonging to this project alone, committed. A symlink for each skill switched on for this project, gitignored, since it holds this machine's path.

### `.flow/`, Flow's working store

- **`tickets/<id>-<slug>/`**: one folder per ticket, holding `ticket.md`, `groundwork/`, and whatever the work writes. `flow new` makes it, and sessions fill it. [Tickets](tickets.md) shows the shape.
- **`tickets/archive/`**: finished tickets, moved whole. Nothing is deleted.
- **`groundwork/<slug>/`**: groundwork that is not a ticket yet, holding `map.md`. `/flow:groundwork` writes it, and `flow new --from-groundwork` moves it into a ticket. A session that stops halfway moves it the same way, since a handoff in a project always goes into a ticket.
- **`inbox.md`**: raw notes with no obvious home yet. Sessions append to it, and `/flow:file-findings` drains it.
- **`findings/`**: one file per lesson a session learned, other than a lesson about an outside tool, which goes to `~/.flow/wiki/<tool>/findings/`. `/flow:file-findings` files each into a skill or a rule. A finding about a domain skill waits in `findings/<skill>/` for Flow's sharing command, due after V1.
- **`overlays/<skill>.md`**: text this project adds to a skill, Flow's or anyone's, handed to the agent each time the skill loads. You or a session write it.
- **`settings.json`**: the skills switched on or off for this project, committed, so a fresh clone gets them back. `flow skills on` and `off` write it with no flag.

### `docs/`, the project's own

Flow sessions write into these and own none of them.

- **`spec/`**: what the product is.
- **`context/`**: verified facts about this repository that outlive any ticket.
- **`research/<question>.md`**: `/flow:research` reports true only for this project, and the reports nobody could place. Flat, shared by the whole project.

## What stays on one machine

These exist on one machine and nothing copies them to another: `~/.claude/projects/`, `~/.flow/repos/`, `~/.flow/logs/`, `~/.flow/run.json`, `~/.flow/setup-prompt.md`, `~/.flow/migrate-prompt.md`, `~/.flow/audit/`, `~/.flow/changes/`, `~/.flow/originals/`, `~/.flow/settings.local.json`, `~/.flow/version`, `~/.flow/skills-update.json`, and every `~/.flow/wiki/<tool>/downloads/`. `flow sync` carries everything else under `~/.flow/` to your other machines, `~/.flow/wiki/`, `~/.flow/research/`, `~/.flow/study-cases/`, `~/.flow/workflow-notes.md`, `~/.flow/migrations/` and `~/.flow/machines/` included. Each machine makes its own clones from the same `sources` list. Everything in a project's `.flow/` is committed, so it travels with the repository.
