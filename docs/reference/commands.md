# Commands

Every `flow` command and each of its flags. `fw` is a shorter name for `flow`.

## Table of contents

- [Typing a command](#typing-a-command): ticket ids in place of a command, groups, help, `--root`
- [The board](#the-board): what to work on, and every ticket at a glance
  - [`flow next`](#flow-next): the work to pick up next
  - [`flow check`](#flow-check): broken links between tickets
  - [`flow ls`](#flow-ls): tickets in a table, filtered
  - [`flow tree`](#flow-tree): tickets nested under their parents
- [One ticket](#one-ticket): show, make, change, file, drop or move a ticket
  - [`flow get`](#flow-get): one ticket in full
  - [`flow new`](#flow-new): make a ticket
  - [`flow edit`](#flow-edit): change a ticket's title, label, type, priority or parent
  - [`flow dep`](#flow-dep): add or remove a ticket this one waits on
  - [`flow file`](#flow-file): mark closed tickets as filed
  - [`flow drop`](#flow-drop): kill a ticket that will never be done
  - [`flow move`](#flow-move): move tickets to another project or to your Flow home
  - [`flow handoff`](#flow-handoff): note in a ticket's history that a session handed it on
- [Ticket status](#ticket-status): one command per status, what a move refuses, parking
- [Setting up](#setting-up): put Flow on a machine or a project, keep it current, take it off
  - [`flow install`](#flow-install): put Flow on this machine
  - [`flow init`](#flow-init): set up the project you are in
  - [`flow store`](#flow-store): show or change where a project's tickets live
  - [`flow update`](#flow-update): bring Flow, this machine and this project up to date
  - [`flow sync`](#flow-sync): carry your Flow home between machines
  - [`flow doctor`](#flow-doctor): check this machine's install
  - [`flow uninstall`](#flow-uninstall): take Flow off this machine
- [Restore](#restore): put a machine or a project back the way it was before Flow
  - [`flow restore ls`](#flow-restore-ls): every saved original
  - [`flow restore machine` and `project`](#flow-restore-machine-and-project): put one back, path by path
- [Skills](#skills): where skills come from, and the 3 levels a switch works at
  - [`flow skills ls`](#flow-skills-ls): every skill and whether it is on
  - [`flow skills on`, `off` and `reset`](#flow-skills-on-off-and-reset): switch a skill
  - [`flow skills add` and `drop`](#flow-skills-add-and-drop): add or remove a skill repository
- [Settings](#settings): switch Flow's 5 on/off settings
- [Cases](#cases): record the agent's failures, filed by kind
  - [`flow cases new`](#flow-cases-new): record a case
  - [`flow cases ls`](#flow-cases-ls): cases grouped by issue
  - [`flow cases get`](#flow-cases-get): one case in full
  - [`flow cases edit`](#flow-cases-edit): mark a case fixed, or change its rule
  - [`flow cases issues`](#flow-cases-issues): every kind of failure, counted
- [Audit](#audit): what Claude Code did in past sessions, read from its transcripts
  - [`flow audit index`](#flow-audit-index): read new transcript lines into the index
  - [`flow audit ls`](#flow-audit-ls): every session, with its totals
  - [`flow audit get`](#flow-audit-get): one session in full
  - [`flow audit turns`](#flow-audit-turns): one session, prompt by prompt
  - [`flow audit read`](#flow-audit-read): the conversation itself, for a range of turns
  - [`flow audit summary`](#flow-audit-summary): a few lines of totals
  - [`flow audit timeline`](#flow-audit-timeline): every tool call in order
  - [`flow audit sql`](#flow-audit-sql): any other question, in SQL, and the tables it reads
  - [`flow audit schema`](#flow-audit-schema): every table and its columns
  - [`flow audit keep`](#flow-audit-keep): save a transcript before Claude Code deletes it
  - [`flow audit where`](#flow-audit-where): the 2 paths the audit uses
  - [`flow audit scorecard`](#flow-audit-scorecard): how the rule checks are doing
- [`flow status-line`](#flow-status-line): the line under the box you type in

## Typing a command

- **A word naming no command is read as a ticket id.** `flow shop-4` is `flow get shop-4`.
- **5 groups take an action after their name**: `skills`, `settings`, `cases`, `audit` and `restore`, as in `flow cases ls`. Each group's default action can be left out: `flow audit a1b2` is `flow audit get a1b2`.
- **Flags are written whole, with 2 dashes**: `--status`, never `-s`. `flow init -y` is the one exception.
- **`flow help` lists every command and flag.** `flow <group> help` lists one group's. `flow new --help` is refused as an unknown flag.
- **Before Flow is set up, only `install`, `doctor`, `restore` and `uninstall` run.** Before the first install, `flow` is not on your `PATH` yet: type `node <clone>/scripts/flow.js install`.
- **`--root <dir>` stands in for your home folder** on the setup commands and on `restore`. Everything the command touches then sits under `<dir>`, which is how a test builds a pretend machine.

## The board

A ticket is one piece of work, kept as a folder in the project's `.flow/tickets/`. [Tickets](../tickets.md) covers its types and statuses.

### `flow next`

The work to pick up next: tickets in progress first, then tickets continuing an open parent, then ready tickets by priority. Blocked tickets show only when nothing is in progress or ready.

```console
$ flow next
tickets: 5   todo 2   groundwork 0   planning 0   building 1   review 0   done 2   parked 0   dropped 0

last closed  shop-1  Budget page

in flight (1), finish these before starting more:
  ID      STATUS    TYPE   PRI  PARENT  TITLE
  shop-4  building  issue  -    -       Login fails on Safari

ready (2):
  ID      STATUS  TYPE     PRI   PARENT  TITLE
  shop-3  todo    feature  high  -       CSV export
  shop-5  todo    topic    -     -       Choose a chart library

unfiled: 2 closed tickets not yet filed   (flow ls --unfiled)
         run file-findings to sweep them
```

- **`--limit <n>`**: at most `n` ready tickets. 10 by default.
- **`--all`**: every ready ticket.

### `flow check`

Broken links between tickets: a dependency loop, a dependency or parent that does not exist, a dependency on a dropped ticket, an open ticket under a closed parent, a misspelled status. It exits 1 when it finds one. `flow next` ends with a line naming `flow check` whenever it would find one.

```console
$ flow check
no problems: no cycles, no dangling ids, no dropped blockers, no closed parents, no unknown statuses.
```

### `flow ls`

Tickets in a table. Bare, it lists every ticket, done and dropped included.

```console
$ flow ls
ID      STATUS    TYPE     PRI   PARENT  TITLE
shop-7  building  issue    -     -       Safari loses the session cookie
shop-3  todo      feature  high  -       CSV export
shop-5  todo      topic    -     -       Choose a chart library
shop-1  done      feature  -     -       Budget page
shop-2  done      feature  -     shop-1  Budget store
shop-6  dropped   feature  -     -       Old budget layout

6 of 6.
```

- **`--status <status>`**: `todo`, `groundwork`, `planning`, `building`, `review`, `done`, `parked` or `dropped`.
- **`--type <type>`**: `feature`, `issue`, `chore`, `topic` or `prototype`.
- **`--parent <id>`**: one ticket's children.
- **`--unfiled`**: done tickets `/flow:file-findings` has not swept yet.

### `flow tree`

Tickets nested under their parents, with what each one waits on. Done and dropped tickets are hidden.

```console
$ flow tree
shop-3  CSV export             todo  high  blocked by shop-2
shop-1  Budget page            todo  -     0/1 done
└── shop-2  Budget store       todo  -
shop-4  Login fails on Safari  todo  -
shop-5  Pick a chart library   todo  low

5 tickets
```

- **`--parent <id>`**: one ticket and everything under it.
- **`--all`**: include done and dropped tickets.

## One ticket

A ticket's id is the project's prefix and a number, `shop-4`. Any part of its folder name that matches one ticket alone also finds it: `4`, or `safari` for `shop-4-login-fails-safari`. An id starting `home-` names a ticket in your Flow home, `~/.flow/`, where Flow keeps the tickets that belong to no project.

### `flow get`

`flow get <id>`, or just `flow <id>`: one ticket's fields, then its text. It prints the command that picks the ticket up, and never runs it.

```console
$ flow get 2
shop-2  Budget store
status: todo   type: feature   parent: shop-1
priority:   normal
deps:       -
dependents: shop-3 (todo)
ready:      yes
path:       .flow/tickets/shop-2-budget-store/ticket.md

pick up with: flow groundwork shop-2
------------------------------------------------------------
# Budget store

<!-- What changes and why. One paragraph. -->

## Done when

<!-- One observable check. Write it now. -->
```

- **`--files`**: also print the files the ticket's `open` block lists, which `/flow:handoff` writes for the next session. A path such as `src/parser.js:40-120` prints those lines alone. It needs `util`, the file tool the install brings.

### `flow new`

`flow new "<title>"`: make a ticket.

```console
$ flow new "CSV export" --deps shop-2 --priority high
created shop-3  CSV export
        .flow/tickets/shop-3-csv-export/ticket.md
        .flow/tickets/shop-3-csv-export/groundwork/map.md
        priority: high
        deps: shop-2

pick up with: flow groundwork shop-3
```

- **`--type <type>`**: `feature` (the default), `issue`, `chore`, `topic` or `prototype`. An issue or a prototype starts at `building`, the others at `groundwork`.
- **`--priority <level>`**: `high`, `normal` (the default) or `low`. A ticket without one takes its parent's.
- **`--parent <id>`**: the ticket this one was split from.
- **`--deps <id,id>`**: tickets that must reach `review` or `done` before this one can start.
- **`--label <1-3 words>`**: the words in the folder name. Made from the title when left out.
- **`--body <text>`**: the ticket's text, in place of the template. `--body -` reads it from standard input.

**Offline, a project keeping its tickets on its `flow` branch makes no ticket.** The number is given out only once the remote has the ticket, so a number never changes after you see it. [New project](../new-project.md) covers where tickets can live.

### `flow edit`

`flow edit <id>`, with one flag per field to change. A status never changes here: [Ticket status](#ticket-status) has a command for each.

```console
$ flow edit shop-5 --title "Choose a chart library" --priority normal
shop-5
  title: "Pick a chart library" → "Choose a chart library"
  priority: low → normal
```

- **`--title "<title>"`**: the title. The folder name stays.
- **`--label <1-3 words>`**: the folder's label, which renames the folder. Links name the id alone, so none break.
- **`--type <type>`**: the type.
- **`--priority <level>`**: the priority. `normal` removes it, so the parent's applies again.
- **`--parent <id>`**: the parent. An empty value removes it.

### `flow dep`

`flow dep <id> --on <id>` adds a ticket this one waits on, and `--off <id>` removes one. A dependency that would make a loop is refused.

```console
$ flow dep shop-5 --on shop-3
shop-5  deps → [shop-3]
```

### `flow file`

`flow file <id>...`: mark closed tickets as filed, meaning `/flow:file-findings` has moved what they taught into skills and rules. File a ticket that taught nothing too, so it leaves the queue `flow ls --unfiled` shows.

```console
$ flow file shop-1 shop-2
shop-1  filed 2026-10-02   Budget page
shop-2  filed 2026-10-02   Budget store

nothing left unfiled.
```

- **`--force`**: write today's date again on a ticket already filed.

### `flow drop`

`flow drop <id> --reason "<why>"`: kill a ticket that will never be done. `--reason` is required. Its folder moves to `.flow/tickets/archive/`.

**A drop refuses while an open ticket waits on the dropped one**, and lists every such ticket. Add one of these:

- **`--by <id>`**: point the waiting tickets at a replacement.
- **`--force`**: drop the waiting tickets too, all the way down.

```console
$ flow drop shop-6 --reason "replaced by the new layout" --by shop-5
shop-6  todo → dropped   Old budget layout
      reason: replaced by the new layout
      moved → .flow/tickets/archive/shop-6-old-budget-layout

re-pointed to shop-5 (Choose a chart library):
  shop-3  deps → [shop-2, shop-5]
```

### `flow move`

`flow move <id>... <place>`: move tickets to another project's folder, or to `home`, your Flow home. Each ticket takes the next free number there. Its old id still finds it from the project it left.

```console
$ flow move shop-4 home
shop-4 → home-1   Login fails on Safari

the old id still finds it from the project: flow shop-4
```

**A link to a ticket staying behind refuses the whole move**, since a link between 2 places could never be followed. Move the linked tickets in the same command, or remove the link first with `flow dep` or `flow edit --parent`.

### `flow handoff`

`flow handoff <id>`: note in the ticket's `history.md` that this session handed the work on. `/flow:handoff` runs it for you.

```console
$ flow handoff shop-4
shop-4  handoff noted in .flow/tickets/shop-4-login-fails-safari/history.md
```

## Ticket status

Each status has a command named for where the ticket lands:

```text
flow todo <id>                    back in the queue
flow groundwork <id>              settle the open questions
flow plan <id>                    write the plan
flow build <id>                   build it
flow review <id>                  hand the work over
flow done <id>                    close it, and move its folder to the archive
flow park <id> --reason "<why>"   set it aside
```

The skills move tickets for you. [Phases](../phases.md) covers which skill moves a ticket, and when. A move lists the tickets it unblocked:

```console
$ flow review shop-2
shop-2  building → review   Budget store

now ready:
  ID      STATUS  TYPE     PRI   PARENT  TITLE
  shop-3  todo    feature  high  -       CSV export
```

**A ticket in `review` already counts as met** for the tickets waiting on it.

**A move refuses**:

- starting a ticket whose dependencies have not reached `review` or `done`;
- starting a parent while one of its children is open;
- closing a parent while one of its children is open;
- `flow park` without `--reason`.

`--force` overrides all but the last.

```console
$ flow done shop-1
flow: shop-1 has 1 open child ticket, finish those first:
  shop-2  review     Budget store
  Or override with: flow done shop-1 --force
```

**A parked ticket comes back through the command for the status it left.** A ticket parked while `building` returns with `flow build`, at `building` rather than back at the start:

```console
$ flow park shop-4 --reason "waiting on a Safari machine"
shop-4  building → parked   Login fails on Safari
      reason: waiting on a Safari machine

revive with: flow build shop-4
```

## Setting up

`install`, `init` and `update` end by opening a Claude Code session. It reads what is already there, and shows every change in one form for you to approve. The session runs those commands' `--check` and `--finish` flags itself, so you never type them. Every setup command takes `--root <dir>`, described under [Typing a command](#typing-a-command).

### `flow install`

Put Flow on this machine. It links Flow's skills, rules and scripts, clones the tools Flow uses, connects your Flow home, then opens the setup session. Your Flow home, `~/.flow/`, is kept in a private GitHub repository called `flow-home`, which your other machines join. Typed again, `flow install` puts back anything missing. [Install](../install.md) covers each step.

```console
$ flow install
Flow is installed: 10 skills, each typed under the plugin name, as /flow:groundwork.
wrote: ~/.flow/originals/machine, this machine as it was before Flow
named: this machine is desktop-wsl
started: your Flow home, sent up so your other machines join it
Every line of the install is in ~/.flow/logs/install.log.
```

- **`--no-bin`**: put nothing in `~/.local/bin`, so `flow` is not on your `PATH`.
- **`--no-clone`**: clone nothing, neither `util`, `toolbox` nor any skill repository.
- **`--drafts`**: also link the unfinished skills in `skills/drafts/`.
- **`--root <dir>`**: never opens the setup session.

### `flow init`

Set up the project you are in. An empty folder gets Flow's project template at once. A folder already holding files gets the setup session, which reads them first.

```console
$ flow init --prefix shop
.flow/: a new flow branch, sharing no history with the code, checked out
.gitignore: .flow/ added
wrote: .claude/settings.json
wrote: .gitignore
wrote: .uncommitted-include
wrote: AGENTS.md
wrote: CLAUDE.md

set up: ~/code/shop is on entry 1. Nothing in the code is committed: AGENTS.md, CLAUDE.md, .gitignore and .claude/ wait for your next commit.
```

- **`--prefix <word>`**: the ticket prefix, 2 to 8 lowercase letters. Asked when left out.
- **`--private`**: keep the tickets in your Flow home, so nobody reading the repository sees them. They go on the project's `flow` branch otherwise.
- **`-y`**: let the setup session read the files already there, without asking.

[New project](../new-project.md) covers where tickets can live, and the setup session.

### `flow store`

Bare, it says where the project's tickets live. `flow store private` moves them into your Flow home, and `flow store branch` moves them onto the project's `flow` branch.

```console
$ flow store private
moved: shop's tickets now live in ~/.flow/projects/shop.
The flow branch keeps the tickets as they were, here and on the remote, and anyone who read the repository may hold a copy.
To delete it: git branch -D flow, then git push origin --delete flow.
```

**`flow store branch` refuses where the branch holds a ticket the moving tickets lack**, since the move would delete that ticket.

### `flow update`

Pull Flow's clone, then bring this machine and the project you are in up to date. Each change to how Flow behaves gets a numbered entry in Flow's `CHANGELOG.md`. Anything behind the newest entry gets the update session, which reads that entry's upgrade guide and shows the changes in one form.

```console
$ flow update
Flow was already at its newest commit.
Flow is up to date: this machine is at entry 1, and so is ~/code/shop.
```

- **`--root <dir>`**: never pulls, and never opens the session.

### `flow sync`

Send this machine's Flow home up, and bring the other machines' work down. Inside a project keeping its tickets on its `flow` branch, it syncs the tickets too.

```console
$ flow sync
nothing new came down.
went up: desktop-wsl: 1 file
shop's tickets: nothing new came down, 1 commit went up.
```

It runs by itself at session end, and after a reply once 30 minutes have passed since the last send, so you rarely type it. [Two machines](../two-machines.md) covers what travels and what stops a sync.

### `flow doctor`

Check this machine's install. It writes nothing, names the fix on each failing line, and exits 1 on any failure.

```console
$ flow doctor
ok    run.json: no run stopped part-way
ok    issues: every job running in the background worked last time
ok    version: this machine is at entry 1, the newest one written, shop is at entry 1
ok    clone: 3 submodules on the commit this clone points at, the remote is not read without --updates
ok    programs: node, git, claude, gh all resolve
fail  names:
        util is not linked: run flow install
        u is not linked: run flow install
fail  util:
        util fs tree does not run, and it is called by home/AGENTS.md, in tree-for-structure
        util fs open does not run, and it is called by flow get --files, through tickets.js
        /home/me/.util/sources does not exist, so no source is registered: run flow install
ok    ~/.agents: 10 skills linked under skills/flow/, 2 switched off, AGENTS.md present
ok    ~/.claude: skills/flow, 1 agent, 1 rule, 1 command linked, CLAUDE.md imports the rules
fail  settings.json:
        /home/me/.claude/settings.json does not exist, so none of Flow's hooks run: run flow install, which merges /home/me/code/flow/home/settings.json into it
ok    ~/.flow: scripts, references and docs resolve into this clone
ok    originals: 3 paths recorded before Flow, still open, and 1 project beside it
note  originals: the machine's original is still open, so flow install has not run to the end. It closes the original on its way out
fail  skills:
        Adrian333Dev/domain-skills is a source and is not cloned, so none of its skills can load: run flow install
skip  tests: add --tests to run both suites

4 of 13 checks failed.
```

- **`--prereq`**: check only the programs Flow needs and never installs: `node`, `git`, `claude` and `gh`. It works before Flow is installed.
- **`--tests`**: also run Flow's test suite and util's.
- **`--updates`**: also ask the clone's remote for the newest release. It is the one check that uses the network.
- **`--no-bin`**: skip the `~/.local/bin` check, for a machine installed with `--no-bin`.

### `flow uninstall`

Take Flow off this machine. It puts back what Flow changed on the machine and in each project, through the form [`flow restore machine`](#flow-restore-machine-and-project) shows, then deletes `~/.flow/` and the clone.

- **Work in `~/.flow/` that no sync has sent stops it**, before anything is removed. Run `flow sync` first.
- **The clone stays when deleting it would lose work**: a change not committed, or a commit no remote has. Its path is printed for you to delete.
- **`--root <dir>`**: the clone is never deleted.

The 4 locks under [`flow restore machine`](#flow-restore-machine-and-project) guard it too.

## Restore

Before Flow first changes a path, it saves a copy in `~/.flow/originals/`: one original for the machine, and one per project. `flow restore` puts an original back. [Install](../install.md) covers how the originals are written.

### `flow restore ls`

Every original on this machine. A bare `flow restore` prints the same.

```console
$ flow restore
machine  3 paths  written 2026-10-02T22:42:53  still being written
~/code/shop  7 paths  written 2026-10-02T22:44:40  closed
```

### `flow restore machine` and `project`

Put one original back. `project` restores the project you are in. `machine` restores the machine, and offers each project in the same form. Neither deletes `~/.flow/`: only `flow uninstall` does.

**You pick each path first.** The command writes `~/.flow/restore.md`, one box per path, and waits for you:

- **A ticked path** goes back to how it was, or is deleted where Flow created it.
- **An unticked path** stays as it is.
- **A project's `AGENTS.md`, `CLAUDE.md` and `docs/` start unticked**, since they hold what you learned about the project and work without Flow.

**4 locks make sure only you run it**, and they guard `flow uninstall` too:

1. **Every Claude Code and Codex session must be closed:**

   ```console
   $ flow restore project
   flow: Close these sessions first: claude 731544.
   ```

2. **You type `restore` or `uninstall` at the terminal.** A pipe, a script or an agent cannot type it.
3. **No flag skips that word.**
4. **Deny rules in `~/.claude/settings.json`** stop an agent from running the command at all.

## Skills

A skill is a folder of instructions Claude Code loads when its job comes up. `flow skills` lists skills from 4 sources:

- **`flow`**: Flow's own. They are always on, except `/flow:review` and `/flow:apply-domain-findings`, which are for working on Flow itself.
- **A skill repository**: a GitHub repository of skills, cloned into `~/.flow/repos/sources/`. `domain-skills`, Flow's collection of skills for outside tools, is the first. Its skills start off.
- **`private`**: skills you write, in `~/.flow/private-skills/<name>/`. They start off.
- **`outside`**: plugins, and skills another tool put in `~/.claude/skills/`. Flow lists them and never switches them. Claude Code's `/plugin` and `/skills` menus do.

**A switch works at one of 3 levels**, and the nearest level wins:

- **No flag**: this project.
- **`--machine`**: this machine.
- **`--global`**: every machine, carried by `flow sync`.

[Configure](../configure.md) covers the levels, [Reference: skills](skills.md) lists Flow's skills, and [Extend](../extend.md) covers adding your own.

### `flow skills ls`

Every skill by source, whether it is on, and the level that says so. A blank level means the source's default. A skill repository lists only the skills a level names, and counts the rest. `flow skills <pattern>` is `flow skills ls <pattern>`.

```console
$ flow skills ls
                         state   level
flow
  apply-domain-findings  off
  review                 on      global
domain-skills            1 more
  react                  on      project
  vitest                 on      machine
private
  my-notes               on      global
outside
  flow                   plugin
```

- **`[pattern...]`**: regular expressions, matched against each skill's name and description, ignoring case. A skill shows when it matches every pattern.
- **`--source <name>`**: one source in full, by its name or its `owner/repo`.

### `flow skills on`, `off` and `reset`

`on` and `off` switch skills at one level. `reset` removes that level's switch, so the level above decides again.

```console
$ flow skills on react
on: react, this project.
linked: ~/code/shop/.claude/skills/react

$ flow skills on vitest --machine
on: vitest, this machine. Every session on this machine now loads its description, in a project it has nothing to do with too.
linked: ~/.claude/skills/vitest
```

- **`--machine`**: this machine.
- **`--global`**: every machine.

What each refuses:

- **A Flow skill with no flag.** Flow's skills load for the whole machine: add `--machine` or `--global`.
- **Switching a skill off for a project when it is on for the machine.** The machine's link loads it in every project, so switch it off with `--machine`.
- **A name 2 skill repositories share.** Write it as `owner/repo:name`.

**A skills folder Flow had to create needs Claude Code restarted.** Claude Code watches only the skills folders that existed when the session started.

### `flow skills add` and `drop`

`flow skills add <owner/repo>` clones a skill repository and lists its skills. It switches none of them on.

```console
$ flow skills add mattpocock/skills
cloned: mattpocock/skills into ~/.flow/repos/sources/mattpocock_skills
added: mattpocock/skills to sources in ~/.flow/settings.json

2 skills, none switched on by this:
  grill-me  Interview the user about a plan until every branch is resolved.
  tdd       Test-driven development, red green refactor.

flow skills on <name> turns one on here, --machine or --global more widely.
```

`flow skills drop <owner/repo>...` removes a repository and deletes its clone. Each clone updates itself when a session opens, unless the [`skillsAutoUpdate`](settings.md#skillsautoupdate) setting is off.

## Settings

`flow settings` switches the 5 on/off settings Flow reads, without opening a file. [Reference: settings](settings.md) explains each one.

```console
$ flow settings ls
setting           state  level
reminder          on     every machine  a line beside every message, pointing Claude at the reply rules
sessionCheck      on                    what needs attention, when a session opens
setupReminder     off    this folder    suggests flow init where a repository or old memory needs it
skillsAutoUpdate  on                    each skill repository updates itself when a session opens
wrapUp            on                    tells Claude to hand off once the conversation passes wrapUpAt tokens
```

- **`flow settings ls`**: every setting, and the level that decides it. It is the default.
- **`flow settings on <name>`** and **`off <name>`**: switch a setting at one level.
- **`flow settings reset <name>`**: remove that level's switch, so the level above decides.
- **`--machine`** and **`--global`**: the level, as for [skills](#skills).

**With no flag, the level is this folder, not this project.** Only `setupReminder` has a per-folder switch, so every other setting needs `--machine` or `--global`.

**A switch another level still overrides says so:**

```console
$ flow settings on reminder --global
on: reminder, every machine.
reminder is still off here, since this machine says so.
```

## Cases

A study case records one failure of the agent: what went wrong, the rule it broke, and the fix once there is one. Cases are filed by issue, the kind of failure, in `~/.flow/study-cases/<issue>/`, so a failure that repeats shows as a count. Any part of a case's name that matches it alone finds it. [Learning](../learning.md) covers how cases get used.

### `flow cases new`

`flow cases new "<title>" --issue <issue>`: record a case.

```console
$ flow cases new "Answered before reading the file" --issue answered-unread --rule read-before-answering --body "Claimed a config key existed without opening the file."
created answered-unread/2026-10-02-answered-before-reading-the-file
        /home/me/.flow/study-cases/answered-unread/2026-10-02-answered-before-reading-the-file.md
        project: shop
        rule: read-before-answering
```

**An issue spelled close to an existing one is refused**, since a second spelling would split the count:

```console
$ flow cases new "Guessed instead of reading" --issue answered-unreed
flow: "answered-unreed" is close to an issue that already exists:
  answered-unread

One failure, one folder: a second spelling splits the count and nothing errors.
  Reuse it:           flow cases new "Guessed instead of reading" --issue answered-unread
  A new kind, really: flow cases new "Guessed instead of reading" --issue answered-unreed --force
```

- **`--issue <issue>`**: required. The kind of failure.
- **`--force`**: make the new issue anyway.
- **`--rule "<rule>"`**: the id of the rule that failed.
- **`--body <text>`**: the case's text. `--body -` reads it from standard input.

Run inside Claude Code, a case also records the session's model and effort level.

### `flow cases ls`

Cases, grouped by issue.

```console
$ flow cases ls --status open
skipped-walk (1)
  DATE        STATUS  CASE              RULE              PROJECT
  2026-10-02  open    skipped-the-walk  walk-a-real-case  shop

1 of 2.
```

- **`--issue <issue>`**: one issue's cases.
- **`--status <status>`**: `open` or `fixed`.

### `flow cases get`

`flow cases get <ref>`, or `flow cases <ref>`: one case in full.

```console
$ flow cases answered
answered-unread/2026-10-02-answered-before-reading-the-file   fixed
  /home/me/.flow/study-cases/answered-unread/2026-10-02-answered-before-reading-the-file.md
  rule: read-before-answering
  project: shop
  effort: high
  fix: home/AGENTS.md

Claimed a config key existed without opening the file.
```

### `flow cases edit`

`flow cases edit <ref>`: change a field. A case is never deleted.

```console
$ flow cases edit answered --status fixed --by home/AGENTS.md
answered-unread/2026-10-02-answered-before-reading-the-file
  status: open → fixed
  fix: - → home/AGENTS.md
```

- **`--status <status>`**: `open` or `fixed`. `fixed` needs `--by`, unless the case already names its fix.
- **`--by <file>`**: the file that changed to fix it.
- **`--rule "<rule>"`**: the rule that failed.

### `flow cases issues`

Every issue, counted. Read it before recording a case, so a repeat lands in its existing issue.

```console
$ flow cases issues
ISSUE            CASES  OPEN  LATEST      RULES
answered-unread  1      1     2026-10-02  read-before-answering
skipped-walk     1      1     2026-10-02  walk-a-real-case

2 issues, 2 cases  /home/me/.flow/study-cases
```

## Audit

Claude Code writes a transcript of every session under `~/.claude/projects/`. `flow audit` reads those transcripts into an index, a SQLite database at `~/.flow/audit/audit.db`, and answers questions from it. Sessions from before Flow was installed read the same.

- **A segment** is one unbroken context window. Compacting a conversation starts a new segment inside the same session.
- **A turn** is one prompt and everything it caused.
- **A session id** can be any start of it that matches one session alone, such as `a1b2`.
- **Every file count is a floor.** A transcript records the command a session ran, never the files that command opened.

Run `flow audit index` first. Then read the cheapest view that answers the question: `summary`, then `timeline`, then `ls` or `sql`, and `read` last. [Learning](../learning.md) covers what the audit is for.

### `flow audit index`

Read every new transcript line into the index. A second run reads only what changed.

```console
$ flow audit index
  a1b2c3d4  -home-me-code-shop  +16 lines
1 transcripts read, 0 unchanged, 16 new lines, 1 sessions: 0.1s
/home/me/.flow/audit/audit.db
```

- **`--project <name>`**: one project's transcripts.
- **`--rebuild`**: delete the index and read everything again. The transcripts hold everything, so nothing is lost.
- **`--quiet`**: print the totals alone.

### `flow audit ls`

Every session in the index, newest first.

```console
$ flow audit ls
SESSION   PROJECT  FROM        TO          SEG  TURNS  TOOLS  ERR  OUT  CACHE   COST
a1b2c3d4  shop     2026-10-02  2026-10-02  1    2      6      1    840  330.0k  -
```

- **`--project <name>`**: one project's sessions.
- **`--since <date>`**: sessions from that date on, such as `2026-10-01`.
- **`--limit <n>`**: at most `n` sessions. 30 by default.

### `flow audit get`

`flow audit get <id>`, or `flow audit <id>`: one session in full, ending with the command to read its heaviest turn.

```console
$ flow audit a1b2
a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d
  project     shop   /home/me/code/shop
  branch      main   Claude Code 2.1.290
  ran         2026-10-02 09:00 → 2026-10-02 09:01
  size        16 events · 1 segments · 2 turns · 6 tool calls · 1 errors
  spend       - · out 840 · cache read 330.0k · cache write 3.0k

SEGMENTS: one unbroken context window each
#  LINES  TURNS  ENDED  TRIGGER  BEFORE  AFTER  DROPPED
1  1-16   2      end    -        0       0      0

TOOLS
TOOL  CALLS  ERRORS  RETURNED
Bash  3      1       212 B
Read  2      0       338 B
Edit  1      0       85 B

FILES: every route into context, exact and parsed alike
TOUCHES  READS  WRITES  PATH
2        1      1       /home/me/code/shop/src/auth/session.ts
1        1      0       /home/me/code/shop/src/auth/login.ts

HEAVIEST TURNS: by context read, which is what a turn actually costs
TURN  LINES  TOOLS  OUT  CACHE   PROMPT
1     1-10   4      460  206.0k  /flow:execute /shop-4
2     11-16  2      380  124.0k  fix it

read one: flow audit read a1b2c3d4 --turns 1
```

### `flow audit turns`

`flow audit turns <id>`: one session, a line per turn.

```console
$ flow audit turns a1b2
TURN  SEG  LINES  AT     TOOK  TOOLS  ERR  OUT  CACHE   SOURCE  PROMPT
1     1    1-10   09:00  -     4      1    460  206.0k  typed   /flow:execute /shop-4
2     1    11-16  09:01  -     2      0    380  124.0k  typed   fix it
```

- **`--from <turn>`**: start at that turn.
- **`--limit <n>`**: at most `n` turns. 60 by default.

### `flow audit read`

`flow audit read <id> --turns <range>`: the conversation itself: each prompt, each tool call and whether it worked, and each reply.

```console
$ flow audit read a1b2 --turns 1-1
a1b2c3d4 turns 1-1 · transcript lines 1-10

── user 09:00:07
  /flow:execute /shop-4
   → Bash {"command":"flow get shop-4 --files"}
   ← Bash ok 2 B
   → Read {"file_path":"/home/me/code/shop/src/auth/login.ts"}
   ← Read ok 2 B
   → Read {"file_path":"/home/me/code/shop/src/auth/session.ts"}
   ← Read ok 2 B
   → Bash {"command":"npm test -- auth"}
   ← Bash ERROR 2 B: ok

── assistant 09:01:10
  The cookie is set with SameSite=None and no Secure flag, which Safari rejects.
```

- **`--turns <range>`**: required, such as `412-460`, or `412` for one turn. A whole session is refused, since one segment averages about 270,000 tokens.
- **`--full`**: also print each tool's result, up to 1,200 characters per call.
- **`--thinking`**: also print the model's reasoning.

Output stops at 400,000 characters, and says to narrow the range.

### `flow audit summary`

`flow audit summary [id]`: a few lines of totals, for one session, or for every session when no id is given.

```console
$ flow audit summary a1b2
a1b2c3d4  shop  2026-10-02 09:00 → 2026-10-02 09:01
2 turns · 1 segments · 6 tools · 1 errors · 2 files · -
out 840 · cache read 330.0k · cache write 3.0k

Bash 3 (1 err)  Read 2  Edit 1
```

- **`--project <name>`**: one project's sessions.
- **`--since <date>`**: sessions from that date on.

### `flow audit timeline`

`flow audit timeline <id>`: every tool call in one session, in order.

```console
$ flow audit timeline a1b2
TURN  TOOL  OK   CALL
1     Bash  ok   flow get shop-4 --files
1     Read  ok   /home/me/code/shop/src/auth/login.ts
1     Read  ok   /home/me/code/shop/src/auth/session.ts
1     Bash  ERR  npm test -- auth
2     Edit  ok   /home/me/code/shop/src/auth/session.ts
2     Bash  ok   npm test -- auth
```

- **`--limit <n>`**: at most `n` calls. 500 by default.

### `flow audit sql`

`flow audit sql "<query>"`: any other question, as SQL against the index. Only `SELECT` and `WITH` run.

```console
$ flow audit sql "select name, count(*) n from tool_call group by name order by n desc"
NAME  N
Bash  3
Read  2
Edit  1
```

The tables:

- **`session`**: one row per session, with its project, branch, dates and totals.
- **`segment`**: one row per context window, with what ended it and the tokens before and after a compaction.
- **`turn`**: one row per prompt, with its lines, tokens, tool calls and errors.
- **`event`**: one row per transcript line.
- **`tool_call`**: one row per tool call, with its input and whether it failed.
- **`file_touch`**: one row per file read, written, edited or listed.
- **`transcript`**: how far the index has read each transcript file.
- **`run`** and **`run_session`**: empty for now.
- **`meta`**: the index's version.

`file_touch.confidence` says how a path was learned:

- **`exact`**: the tool reported it, as `Read`, `Edit` and `Write` do.
- **`parsed`**: it was read out of a shell command, such as `cat` or `sed -n`.
- **`declared`**: Claude Code named it as it loaded the file, such as a `CLAUDE.md`.

**Compare pieces of work by segment, never by session.** The same work is 1 session if it was compacted twice, 3 sessions if it was cleared twice, and 3 segments either way.

### `flow audit schema`

Every table and its columns, one line per table, for writing a query.

### `flow audit keep`

`flow audit keep <id>`: save a compressed copy of one session's transcript in `~/.flow/audit/kept/`. Claude Code deletes old transcripts after a set number of days, and the index keeps their counts, never the conversation. Keep one you will want to read again, such as one a study case rests on.

```console
$ flow audit keep a1b2
  /home/me/.flow/audit/kept/a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d.jsonl.gz  1 kB
```

### `flow audit where`

The 2 paths the audit uses.

```console
$ flow audit where
transcripts  /home/me/.claude/projects
index        /home/me/.flow/audit/audit.db
```

### `flow audit scorecard`

How the rule checks are doing, across every session. A rule check is a script that tests each edit against one rule and records the result. The scorecard lists:

- checks that fail to load;
- checks naming a rule no file defines;
- the rules broken most;
- checks ready to start warning: broken at least 5 times, in at least 60% of their results;
- rules loaded in every session that never once applied.

It ends with how many rules have a check at all, so a clean report never reads as a clean session.

```console
$ flow audit scorecard
never applied: loaded every session, never once relevant
  js-and-ts

1 rules measured, 147 not measurable. 0 results over 0 days.
```

[Rule checks](../rule-checks.md) covers the checks.

## `flow status-line`

Prints the line Claude Code shows under the box you type in: the ticket this session works on, and its status. Claude Code runs it, so `flow help` leaves it out. Nothing it prints reaches Claude.

```text
shop-7 building
```

The ticket is the last one you typed a skill for in the session, such as `/flow:execute /shop-7`. Without one, it is the ticket a skill last moved. Outside a Flow project, the line is empty.

- **`--context`**: also show how full the conversation is, against `wrapUpAt`, the size at which Flow asks for a handoff:

  ```text
  shop-7 building · 98k of 150k
  ```

A background job that failed adds `⚠ 1 Flow issue: ask Claude to fix them` in every folder, until the job next works. [Reference: settings](settings.md#statusline) shows how to add the line to another status line tool.
