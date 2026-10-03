# Commands

Every `flow` command (`fw` for short) and its flags. `flow --help` lists them in the terminal, and `flow <command> --help` shows one.

## Table of contents

- [Setting up](#setting-up): put Flow on your computer and your projects, and keep it current
  - [`flow install`](#flow-install): put Flow on this computer
  - [`flow init`](#flow-init): set up the project you are in
  - [`flow update`](#flow-update): get the newest Flow, and bring this computer and project up to date
  - [`flow doctor`](#flow-doctor): check that Flow is installed correctly
  - [`flow sync`](#flow-sync): back up your workflow and share it between your computers
  - [`flow store`](#flow-store): choose where a project's tickets are kept
- [The board](#the-board): see all your tickets and what to work on next
  - [`flow next`](#flow-next): what to work on next
  - [`flow ls`](#flow-ls): every ticket in a table
  - [`flow tree`](#flow-tree): tickets nested under the ticket they were split from
  - [`flow check`](#flow-check): find broken links between tickets
- [One ticket](#one-ticket): show, create, change or remove one ticket
  - [`flow get`](#flow-get): show one ticket
  - [`flow new`](#flow-new): create a ticket
  - [`flow edit`](#flow-edit): change a ticket's title, type, priority or links
  - [`flow file`](#flow-file): mark finished tickets as checked for lessons
  - [`flow drop`](#flow-drop): remove a ticket that will never be done
  - [`flow move`](#flow-move): move tickets to another project, or to your Flow home
- [Ticket status](#ticket-status): move a ticket from one stage to the next
- [Skills](#skills): see which skills are on, and turn them on or off
  - [`flow skills ls`](#flow-skills-ls): every skill, and whether it is on
  - [`flow skills on`, `off` and `reset`](#flow-skills-on-off-and-reset): turn a skill on or off
  - [`flow skills add` and `drop`](#flow-skills-add-and-drop): add or remove a repository of skills
- [Settings](#settings): turn Flow's own settings on or off
- [Taking Flow off](#taking-flow-off): remove Flow, and put back what it changed
  - [`flow uninstall`](#flow-uninstall): remove Flow from this computer
  - [`flow restore`](#flow-restore): put this computer or a project back the way it was before Flow
- [Rule checks](#rule-checks): see how well the agent follows your rules
- [Cases](#cases): record the agent's mistakes, grouped by kind
  - [`flow cases new`](#flow-cases-new): record a mistake
  - [`flow cases ls`](#flow-cases-ls): every recorded mistake
  - [`flow cases get`](#flow-cases-get): one mistake in full
  - [`flow cases edit`](#flow-cases-edit): mark a mistake fixed
  - [`flow cases issues`](#flow-cases-issues): every kind of mistake, counted
- [Audit](#audit): read back what Claude Code did in past sessions
  - [`flow audit index`](#flow-audit-index): read new sessions in
  - [`flow audit ls`](#flow-audit-ls): every session, with its totals
  - [`flow audit get`](#flow-audit-get): one session in full
  - [`flow audit turns`](#flow-audit-turns): one session, prompt by prompt
  - [`flow audit read`](#flow-audit-read): the conversation itself
  - [`flow audit summary`](#flow-audit-summary): a few lines of totals
  - [`flow audit timeline`](#flow-audit-timeline): every tool call in order
  - [`flow audit sql`](#flow-audit-sql): any other question, in SQL
  - [`flow audit schema`](#flow-audit-schema): every table and its columns
  - [`flow audit keep`](#flow-audit-keep): save a session before Claude Code deletes it
  - [`flow audit where`](#flow-audit-where): where the sessions and the index are

## Setting up

`install`, `init` and `update` end by opening a Claude Code session, which shows every change in one form for you to approve. The session runs their `--check` and `--finish` flags itself: you never type them.

### `flow install`

Put Flow on this computer. It links Flow's skills, rules and scripts, downloads the tools Flow uses, and connects your Flow home, then opens the setup session. Your Flow home is `~/.flow/`, the folder where Flow keeps your notes, settings and tickets. It is backed up to a private GitHub repository, `flow-home`, which your other computers join. Run again, `flow install` puts back anything missing. [Install](../install.md) covers each step.

```console
$ flow install
Flow is installed: 10 skills, each typed under the plugin name, as /flow:groundwork.
wrote: ~/.flow/originals/machine, this machine as it was before Flow
named: this machine is desktop-wsl
started: your Flow home, sent up so your other machines join it
Every line of the install is in ~/.flow/logs/install.log.
```

### `flow init`

Set up the project you are in. An empty folder gets Flow's project files at once. A folder already holding files gets the setup session, which reads them first.

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

- **`--prefix <word>`**: the start of every ticket id, 2 to 8 lowercase letters, as `shop` in `shop-4`. Asked when left out, offering the folder's name: `shop` for `~/code/shop`, or the first 3 letters of a name over 8, `exp` for `expense-tracker`.
- **`--private`**: keep the tickets in your Flow home, so nobody reading the repository sees them. Otherwise they go on the project's `flow` branch.
- **`-y`**: let the setup session read the files already there, without asking.

[New project](../new-project.md) covers where tickets can live.

### `flow update`

Get the newest Flow, then bring this computer and the project you are in up to date. Anything behind gets the update session, which shows what changes in one form.

```console
$ flow update
Flow was already at its newest commit.
Flow is up to date: this machine is at entry 1, and so is ~/code/shop.
```

### `flow doctor`

Check that Flow is installed correctly. It changes nothing, names the fix on each failing line, and exits 1 on any failure.

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
ok    ~/.agents: 11 skills linked under skills/flow/, 1 switched off, AGENTS.md present
ok    ~/.claude: skills/flow, 1 agent, 1 rule, 1 command linked, CLAUDE.md imports the rules
fail  settings.json:
        /home/me/.claude/settings.json does not exist, so none of Flow's hooks run: run flow install, which merges /home/me/code/flow/home/settings.json into it
ok    ~/.flow: scripts, references and docs resolve into this clone
ok    originals: 3 paths recorded before Flow, still open, and 1 project beside it
note  originals: the machine's original is still open, so flow install has not run to the end. It closes the original on its way out
ok    skills: 1 source cloned, 2 skills on everywhere, 1 more for shop

3 of 13 checks failed.
```

- **`--prereq`**: check only the programs Flow needs and never installs, `node`, `git`, `claude` and `gh`, and that Claude Code is 2.1.287 or later. It works before Flow is installed.
- **`--updates`**: also check whether a newer Flow is out. The one check that uses the network.

### `flow sync`

Back up your workflow and share it between your computers. It sends your Flow home up and brings your other computers' work down. Inside a project keeping its tickets on its `flow` branch, it syncs the tickets too.

```console
$ flow sync
nothing new came down.
went up: desktop-wsl: 1 file
shop's tickets: nothing new came down, 1 commit went up.
```

It runs by itself when a session ends, and every 30 minutes while you work, so you rarely type it. [Two machines](../two-machines.md) covers what travels.

### `flow store`

Bare, it says where the project's tickets are kept. `flow store private` moves them into your Flow home, and `flow store branch` onto the project's `flow` branch.

```console
$ flow store private
moved: shop's tickets now live in ~/.flow/projects/shop.
The flow branch keeps the tickets as they were, here and on the remote, and anyone who read the repository may hold a copy.
To delete it: git branch -D flow, then git push origin --delete flow.
```

**`flow store branch` refuses when the branch holds a ticket the moving tickets lack**, since the move would delete that ticket.

## The board

A ticket is one piece of work, kept as a folder in the project's `.flow/tickets/`. [Tickets](../tickets.md) covers types and statuses.

### `flow next`

What to work on next: tickets in progress first, then ready tickets by priority. Blocked tickets show only when nothing is in progress or ready.

```console
$ flow next
tickets: 6   todo 2   building 1   done 2   dropped 1

last closed  shop-6  Old budget layout

in flight (1), finish these before starting more:
  ID      STATUS    TYPE   PRI  PARENT  TITLE
  shop-7  building  issue  -    -       Safari loses the session cookie

ready (1):
  ID      STATUS  TYPE   PRI  PARENT  TITLE
  shop-5  todo    topic  low  -       Choose a chart library
```

- **`--limit <n>`**: at most `n` ready tickets. 10 by default.
- **`--all`**: every ready ticket.

### `flow ls`

Every ticket in a table, finished and dropped ones included.

```console
$ flow ls
ID      STATUS    TYPE     PRI   PARENT  TITLE
shop-7  building  issue    -     -       Safari loses the session cookie
shop-3  todo      feature  high  -       CSV export
shop-5  todo      topic    low   -       Choose a chart library
shop-1  done      feature  -     -       Budget page
shop-2  done      feature  -     shop-1  Budget store
shop-6  dropped   feature  -     -       Old budget layout

6 of 6.
```

- **`--status <status>`**: `todo`, `groundwork`, `planning`, `building`, `review`, `done`, `parked` or `dropped`.
- **`--type <type>`**: `feature`, `issue`, `chore`, `topic` or `prototype`.
- **`--parent <id>`**: the tickets split from one ticket.
- **`--unfiled`**: finished tickets not yet checked for lessons. [`flow file`](#flow-file) marks them.

### `flow tree`

Tickets nested under the ticket they were split from, with what each one waits on. Finished and dropped tickets are hidden.

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
- **`--all`**: include finished and dropped tickets.

### `flow check`

Find broken links between tickets: tickets waiting on each other in a loop, a link to a ticket that does not exist, a wait on a dropped ticket, an open ticket under a closed one, a misspelled status. It exits 1 when it finds one, and `flow next` says when to run it.

```console
$ flow check
no problems: no cycles, no dangling ids, no dropped blockers, no closed parents, no unknown statuses.
```

## One ticket

A ticket's id is the project's prefix and a number, `shop-4`. Any part of its folder name that matches one ticket alone finds it too: `4`, or `safari` for `shop-4-login-fails-safari`. An id starting `home-` names a ticket kept in your Flow home, for work that belongs to no project.

### `flow get`

`flow get <id>`, or just `flow <id>`: one ticket's fields, then its text, then the command that starts work on it.

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

- **`--files`**: also print the files the last session listed for the next one to open.

### `flow new`

`flow new "<title>"`: create a ticket.

```console
$ flow new "CSV export" --deps shop-2 --priority high
created shop-3  CSV export
        .flow/tickets/shop-3-csv-export/ticket.md
        .flow/tickets/shop-3-csv-export/groundwork/map.md
        priority: high
        deps: shop-2

pick up with: flow groundwork shop-3
```

- **`--type <type>`**: `feature` (the default), `issue`, `chore`, `topic` or `prototype`. [Tickets](../tickets.md) covers each.
- **`--priority <level>`**: `high`, `normal` (the default) or `low`. A ticket without one takes its parent's.
- **`--parent <id>`**: the ticket this one was split from.
- **`--deps <id,id>`**: tickets that must reach `review` or `done` before this one can start.
- **`--label <1-3 words>`**: the words in the folder name. Made from the title when left out.
- **`--body <text>`**: the ticket's text, in place of the template. `--body -` reads it from standard input.

**Offline, a project keeping its tickets on its `flow` branch creates no ticket.** A number is given out only once the remote has it, so the number you see never changes.

### `flow edit`

`flow edit <id>`, with one flag per field to change. The status changes through its own commands, under [Ticket status](#ticket-status).

```console
$ flow edit shop-5 --title "Choose a chart library" --priority normal
shop-5
  title: "Pick a chart library" → "Choose a chart library"
  priority: low → normal

$ flow edit shop-3 --deps shop-5
shop-3
  deps: [shop-2, shop-5] → [shop-5]
```

- **`--title "<title>"`**: the title. The folder name stays.
- **`--label <1-3 words>`**: renames the folder. Links use the id alone, so none break.
- **`--type <type>`**: the type.
- **`--priority <level>`**: the priority. `normal` removes it, so the parent's applies again.
- **`--parent <id>`**: the ticket this one was split from. An empty value removes it.
- **`--deps <id,id>`**: the tickets this one waits on, replacing the whole list. An empty value clears it. A wait that would make a loop is refused.

### `flow file`

`flow file <id>...`: mark finished tickets as checked for lessons. `/flow:file-findings` runs it once it has moved what a ticket taught into your skills and rules. Mark a ticket that taught nothing too, so it leaves `flow ls --unfiled`.

```console
$ flow file shop-1 shop-2
shop-1  filed 2026-10-02   Budget page
shop-2  filed 2026-10-02   Budget store

nothing left unfiled.
```

- **`--force`**: mark again a ticket already marked, with today's date.

### `flow drop`

`flow drop <id> --reason "<why>"`: remove a ticket that will never be done. Its folder moves to `.flow/tickets/archive/`.

**A drop refuses while an open ticket waits on this one**, and lists each. Add one of these:

- **`--by <id>`**: make the waiting tickets wait on a replacement.
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

**A link to a ticket staying behind refuses the whole move.** Move the linked tickets in the same command, or remove the link first with `flow edit --deps` or `--parent`.

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

**A ticket in `review` already counts as finished** for the tickets waiting on it.

**A move refuses**:

- starting a ticket whose waits have not reached `review` or `done`;
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

**A parked ticket comes back through the command for the status it left.** A ticket parked while `building` returns with `flow build`:

```console
$ flow park shop-4 --reason "waiting on a Safari machine"
shop-4  building → parked   Login fails on Safari
      reason: waiting on a Safari machine

revive with: flow build shop-4
```

## Skills

A skill is a folder of instructions Claude Code loads when its job comes up. Flow's own skills are always on, except 2 for working on Flow itself. Skills from a repository you added, and your private ones, start off. [Extend](../extend.md) covers where skills come from, and [Reference: skills](skills.md) lists Flow's.

**A switch works at one of 2 levels:**

- **No flag**: this project.
- **`--global`**: every project, on every computer.

### `flow skills ls`

Every skill, grouped by where it comes from, whether it is on, and the level that says so. A blank level means the skill's default. A skill repository lists only the skills switched at some level, and counts the rest. `outside` lists what another tool installed, which Flow never switches. `flow skills <pattern>` is `flow skills ls <pattern>`.

```console
$ flow skills ls
                         state   level
flow
  apply-domain-findings  off
  review                 on      global
domain-skills            1 more
  react                  on      project
  vitest                 on      global
private
  my-notes               on      global
outside
  flow                   plugin
```

- **`[pattern...]`**: words or regular expressions, matched against each skill's name and description. A skill shows when it matches every one.
- **`--source <name>`**: one source in full, by its name or its `owner/repo`.

### `flow skills on`, `off` and `reset`

`on` and `off` switch skills at one level. `reset` removes that level's switch, so the default decides again.

```console
$ flow skills on react
on: react, this project.
linked: ~/code/shop/.claude/skills/react

$ flow skills on vitest --global
on: vitest, everywhere. Every session now loads its description, in projects it has nothing to do with too.
linked: ~/.claude/skills/vitest
```

What each refuses:

- **A Flow skill with no flag.** Flow's skills load in every project: add `--global`.
- **Turning a skill off for one project while it is on everywhere:**

  ```console
  $ flow skills off vitest
  flow: vitest is on everywhere (--global), and a project cannot hide a skill linked for the whole machine yet.
    flow skills off vitest --global switches it off everywhere.
  ```

- **A name 2 skill repositories share.** Write it as `owner/repo:name`.

**A skills folder Flow had to create needs Claude Code restarted**, and the command says so.

### `flow skills add` and `drop`

`flow skills add <owner/repo>` downloads a GitHub repository of skills and lists them. It turns none of them on.

```console
$ flow skills add mattpocock/skills
cloned: mattpocock/skills into ~/.flow/repos/sources/mattpocock_skills
added: mattpocock/skills to sources in ~/.flow/settings.json

2 skills, none switched on by this:
  grill-me  Interview the user about a plan until every branch is resolved.
  tdd       Test-driven development, red green refactor.

flow skills on <name> turns one on here, --global everywhere.
```

`flow skills drop <owner/repo>...` removes a repository and deletes its download. Each repository updates itself when a session opens, unless the [`skillsAutoUpdate`](settings.md#skillsautoupdate) setting is off.

## Settings

`flow settings` turns Flow's 5 on/off settings on or off, without opening a file. [Reference: settings](settings.md) explains each one.

```console
$ flow settings ls
setting           state  level
reminder          on     everywhere   a line beside every message, pointing Claude at the reply rules
sessionCheck      on                  what needs attention, when a session opens
setupReminder     off    this folder  suggests flow init where a repository or old memory needs it
skillsAutoUpdate  on                  each skill repository updates itself when a session opens
wrapUp            on                  tells Claude to hand off once the conversation passes wrapUpAt tokens
```

- **`flow settings ls`**: every setting, and the level that decides it. A bare `flow settings` prints the same.
- **`flow settings on <name>`** and **`off <name>`**: switch a setting.
- **`flow settings reset <name>`**: remove that level's switch, so the default decides.
- **`--global`**: every project, on every computer. With no flag, the switch is for this folder.

**Only `setupReminder` can be switched for one folder.** Every other setting needs `--global`.

**A folder switch wins over `--global`, and the command says so:**

```console
$ flow settings on setupReminder --global
on: setupReminder, everywhere.
setupReminder is still off here, since this folder says so.
```

## Taking Flow off

Before Flow first changes a file, it saves a copy of the original in `~/.flow/originals/`: one set for the computer, and one per project. Both commands below put those copies back. [Install](../install.md) covers what gets saved.

**4 locks make sure only you run them:**

1. **Every Claude Code and Codex session must be closed:**

   ```console
   $ flow restore project
   flow: Close these sessions first: claude 731544.
   ```

2. **You type `restore` or `uninstall` at the terminal.** A pipe, a script or an agent cannot type it.
3. **No flag skips that word.**
4. **Rules in `~/.claude/settings.json`** stop an agent from running either command at all.

### `flow uninstall`

Remove Flow from this computer. It puts back what Flow changed on the computer and in each project, through the same form as [`flow restore machine`](#flow-restore), then deletes `~/.flow/` and the folder holding Flow's code.

- **Work in `~/.flow/` not yet backed up stops it**, before anything is removed. Run `flow sync` first.
- **The folder holding Flow's code stays when deleting it would lose changes you made to Flow.** Its path is printed for you to delete.

### `flow restore`

Bare, or as `flow restore ls`, it lists the saved originals:

```console
$ flow restore
machine  3 paths  written 2026-10-02T22:42:53  still being written
~/code/shop  7 paths  written 2026-10-02T22:44:40  closed
```

`flow restore project` puts back the project you are in. `flow restore machine` puts back the computer, and offers each project in the same form. Neither deletes `~/.flow/`.

**You pick each file first.** The command writes `~/.flow/restore.md`, one box per file, and waits:

- **A ticked file** goes back to how it was, or is deleted where Flow created it.
- **An unticked file** stays as it is.
- **A project's `AGENTS.md`, `CLAUDE.md` and `docs/` start unticked**, since they hold what you learned about the project, and work without Flow.

## Rule checks

### `flow scorecard`

How well the agent follows your rules, across every session. A rule check is a small script that tests each change the agent makes against one rule, and records the result. [Rule checks](../rule-checks.md) covers writing one.

The scorecard lists checks that fail to load, checks naming a rule that no longer exists, the rules broken most, checks broken often enough to start warning, and rules that never once applied. It ends with how many rules have a check at all, so a clean report never reads as a clean session.

```console
$ flow scorecard
never applied: loaded every session, never once relevant
  js-and-ts

1 rules measured, 147 not measurable. 0 results over 0 days.
```

## Cases

A study case records one mistake the agent made: what went wrong, the rule it broke, and the fix once there is one. Cases are grouped by issue, the kind of mistake, so a repeat shows as a count. Any part of a case's name that matches it alone finds it. [Learning](../learning.md) covers how cases get used.

### `flow cases new`

`flow cases new "<title>" --issue <issue>`: record a mistake.

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

- **`--issue <issue>`**: required. The kind of mistake.
- **`--force`**: create the new issue anyway.
- **`--rule "<rule>"`**: the id of the rule that was broken.
- **`--body <text>`**: the case's text. `--body -` reads it from standard input.

### `flow cases ls`

Every case, grouped by issue.

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
- **`--by <file>`**: the file changed to fix it.
- **`--rule "<rule>"`**: the rule that was broken.

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

`flow audit` reads the transcripts Claude Code keeps of every session into an index, `~/.flow/audit/audit.db`, and answers questions from it. Run `flow audit index` first. A session id can be any start of it that matches one session alone, such as `a1b2`. [Learning](../learning.md) covers segments, turns and what the audit is for.

### `flow audit index`

Read every new transcript line into the index. A second run reads only what changed.

```console
$ flow audit index
  a1b2c3d4  -home-me-code-shop  +16 lines
1 transcripts read, 0 unchanged, 16 new lines, 1 sessions: 0.1s
/home/me/.flow/audit/audit.db
```

- **`--project <name>`**: one project's transcripts.
- **`--rebuild`**: delete the index and read everything again. Nothing is lost.
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

**Every file count is a floor.** A transcript records the command a session ran, never the files that command opened.

### `flow audit turns`

`flow audit turns <id>`: one session, a line per prompt.

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

- **`--turns <range>`**: required, such as `412-460`, or `412` for one turn. A whole session is refused: it is too long to read at once.
- **`--full`**: also print what each tool returned, up to 1,200 characters per call.
- **`--thinking`**: also print the model's reasoning.

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

**Compare pieces of work by segment, never by session.** A segment is one unbroken conversation: compacting starts a new one inside the same session, and clearing starts a new session.

### `flow audit schema`

Every table and its columns, one line per table, for writing a query.

### `flow audit keep`

`flow audit keep <id>`: save a compressed copy of one session's transcript in `~/.flow/audit/kept/`. Claude Code deletes old transcripts after a set number of days, and the index keeps only their counts. Keep one you will want to read again.

```console
$ flow audit keep a1b2
  /home/me/.flow/audit/kept/a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d.jsonl.gz  1 kB
```

### `flow audit where`

Where the transcripts and the index are.

```console
$ flow audit where
transcripts  /home/me/.claude/projects
index        /home/me/.flow/audit/audit.db
```
