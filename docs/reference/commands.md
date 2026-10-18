# Commands

Every `flow` command (`fw` for short) and its flags. `flow --help` lists them in the terminal, and `flow <command> --help` shows one.

## Table of contents

- [Setting up](#setting-up): put Flow on your computer and your projects, and keep it current
  - [`flow install`](#flow-install): put Flow on this computer
  - [`flow init`](#flow-init): set up the project you are in
  - [`flow doctor`](#flow-doctor): check that Flow is installed correctly
  - [`flow sync`](#flow-sync): back up your workflow and share it between your computers
- [The board](#the-board): see all your tickets and what to work on next
  - [`flow next`](#flow-next): what to work on next
  - [`flow ls`](#flow-ls): every ticket in a table, or the ones matching a few words
  - [`flow tree`](#flow-tree): tickets nested under the ticket they were split from
  - [`flow check`](#flow-check): find broken links between tickets
- [One ticket](#one-ticket): show, create, change or remove one ticket
  - [`flow get`](#flow-get): show one ticket
  - [`flow new`](#flow-new): create a ticket
  - [`flow edit`](#flow-edit): change a ticket's title, description, labels or links
  - [`flow rank`](#flow-rank): put a ticket before or after another
  - [`flow file`](#flow-file): mark finished tickets as checked for lessons
  - [`flow drop`](#flow-drop): remove a ticket that will never be done
  - [`flow move`](#flow-move): move tickets to another project, or to your Flow home- [Ticket status](#ticket-status): move a ticket from one stage to the next
- [Settings](#settings): turn Flow's own settings on or off
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
  - [`flow audit context`](#flow-audit-context): how full the context was at each request
  - [`flow audit permissions`](#flow-audit-permissions): the permission questions, counted
  - [`flow audit sql`](#flow-audit-sql): any other question, in SQL
  - [`flow audit schema`](#flow-audit-schema): every table and its columns
  - [`flow audit keep`](#flow-audit-keep): save a session before Claude Code deletes it
  - [`flow audit where`](#flow-audit-where): where the sessions and the index are

## Setting up

### `flow install`

Put Flow on this computer. It links Flow's skills, rules and scripts, downloads the tools Flow uses, and connects your Flow home. Your Flow home is `~/.flow/`, the folder where Flow keeps your notes, settings and tickets. It is backed up to a private GitHub repository, `flow-home`, which your other computers join. Run again, `flow install` puts back anything missing, which is also how a computer takes a newer Flow: pull the clone, then run it.

```console
$ flow install
Flow is installed: 10 skills, each typed under the plugin name, as /flow:groundwork.
named: this machine is pc-wsl
started: your Flow home, sent up so your other machines join it
Every line of the install is in ~/.flow/logs/install.log.
```

### `flow init`

Set up the project you are in. It links `.flow/` into your Flow home, where the project's tickets live, and writes Flow's project files wherever one is missing. A file the project already has stays as it is.

```console
$ flow init --prefix shop
.flow/: a link to ~/.flow/projects/shop, in your Flow home, listed in .git/info/exclude so git never sees it
wrote: .claude/settings.json
wrote: .gitignore
wrote: .uncommitted-include
wrote: CLAUDE.md

set up: ~/code/shop. Nothing in the code is committed: CLAUDE.md, .gitignore and .claude/ wait for your next commit.
```

- **`--prefix <word>`**: the start of every ticket id, 2 to 8 lowercase letters, as `shop` in `shop-4`. Asked when left out, offering the folder's name: `shop` for `~/code/shop`, or the first 3 letters of a name over 8, `exp` for `expense-tracker`.

### `flow doctor`

Check that Flow is installed correctly. It changes nothing, names the fix on each failing line, and exits 1 on any failure.

```console
$ flow doctor
ok    issues: every job running in the background worked last time
ok    clone: 3 submodules on the commit this clone points at
ok    programs: node, git, claude, gh all resolve
ok    claude code: 2.1.289, and Flow needs 2.1.287 or later
fail  names:
        util is not linked: run flow install
        u is not linked: run flow install
fail  util:
        util fs tree does not run, and it is called by home/CLAUDE.md, in tree-for-structure
        util fs open does not run, and it is called by flow get --files, through tickets.js
        /home/me/.util/sources does not exist, so no source is registered: run flow install
ok    ~/.agents: 12 skills linked under skills/flow/
ok    ~/.claude: skills/flow, 1 agent, 1 rule and CLAUDE.md linked
fail  settings.json:
        /home/me/.claude/settings.json does not exist, so none of Flow's hooks run: run flow update, whose setup session fixes settings.json from /home/me/code/flow/home/settings.json
ok    ~/.flow: scripts, references and docs resolve into this clone
ok    skills: 1 skill on everywhere, 1 more for shop

3 of 11 checks failed.
```

- **`--prereq`**: check only the programs Flow needs and never installs, `node`, `git`, `claude` and `gh`, and that Claude Code is 2.1.287 or later. It works before Flow is installed.

### `flow sync`

Back up your workflow and share it between your computers. It sends your Flow home up and brings your other computers' work down. Inside a project, it syncs the project's tickets too.

```console
$ flow sync
nothing new came down.
went up: pc-wsl: 1 file
shop's tickets: nothing new came down, 1 commit went up.
```

It runs by itself when a session ends, and every 30 minutes while you work, so you rarely type it.

## The board

A ticket is one piece of work, kept as a folder in the project's `.flow/tickets/`. [Tickets](../tickets.md) covers labels and statuses.

**Tickets come in rank order.** Tickets with the same parent are siblings, and top-level tickets share the empty parent. Among siblings, a ticket with a `rank:` number comes first, by number. The tickets without one follow by id, so a new ticket lands last. [`flow rank`](#flow-rank) moves a ticket.

### `flow next`

What to work on next: tickets in progress first, then ready tickets in rank order. Blocked tickets show only when nothing is in progress or ready.

```console
$ flow next
tickets: 6   todo 4   in-progress 1   done 1

last closed  shop-5-chart-library

in flight (1), finish these before starting more:
  TICKET                STATUS       LABELS      PARENT
  shop-4-safari-cookie  in-progress  bug,urgent  -

ready (2):
  TICKET               STATUS  LABELS           PARENT
  shop-6-dark-mode     todo    feature,post-v1  -
  shop-2-budget-store  todo    feature          shop-1

waiting for /flow:upkeep: 1 closed ticket, 2 notes, 3 findings
```

- **`--limit <n>`**: at most `n` ready tickets. 10 by default.
- **`--all`**: every ready ticket.

### `flow ls`

Every ticket in a table, finished and dropped ones included.

```console
$ flow ls
TICKET                STATUS       LABELS           PARENT
shop-4-safari-cookie  in-progress  bug,urgent       -
shop-6-dark-mode      todo         feature,post-v1  -
shop-1-budget-page    todo         feature,v1       -
shop-2-budget-store   todo         feature          shop-1
shop-3-csv-export     todo         feature,v1       -
shop-5-chart-library  done         topic,post-v1    -

6 of 6.
```

**Words narrow the table to the tickets that hold every one.** A word matches anywhere in the title, description, id, labels or body. A word of 5 letters or more also matches a word in the text that is one typo away:

```console
$ flow ls safary
TICKET                STATUS       LABELS      PARENT
shop-4-safari-cookie  in-progress  bug,urgent  -

1 of 6.
```

- **`[words...]`**: the words to match, such as `flow ls budget feature`.
- **`--status <status>`**: `todo`, `groundwork`, `planning`, `building`, `review`, `done`, `parked` or `dropped`.
- **`--parent <id>`**: the tickets split from one ticket.
- **`--label <label>`**: the tickets carrying one label.
- **`--unfiled`**: finished tickets not yet checked for lessons. [`flow file`](#flow-file) marks them.

### `flow tree`

Tickets nested under the ticket they were split from, with what each one waits on. Finished and dropped tickets are hidden.

```console
$ flow tree
shop-3-csv-export             todo         blocked by shop-2
shop-7-pdf-export             todo         blocked by shop-2
shop-6-dark-theme             todo
shop-4-safari-cookie          in-progress
shop-1-budget-page            todo         0/1 done
└── shop-2-budget-store       todo

6 tickets, 1 done or dropped hidden: flow tree --all
```

- **`--parent <id>`**: one ticket and everything under it.
- **`--all`**: include finished and dropped tickets.

### `flow check`

Find broken links between tickets: tickets waiting on each other in a loop, a link to a ticket that does not exist, a wait on a dropped ticket, an open ticket under a closed one, a misspelled status, a ticket with no title or description. It exits 1 when it finds one, and `flow next` says when to run it.

```console
$ flow check
no problems: no cycles, no dangling ids, no dropped blockers, no closed parents, no unknown statuses, every ticket has a title and a description.
```

## One ticket

A ticket's id is the project's prefix and a number, `shop-4`. Its title is up to 4 hyphenated words, `safari-cookie`, and the two together name it everywhere: `shop-4-safari-cookie`. Its description is one sentence saying what the work is, opening with the short name. Any of these finds a ticket: `4`, `shop-4`, `shop-4-safari-cookie`, or a title word that matches one ticket alone, such as `safari`. Only the id part counts, so a name from before a rename, `shop-4-old-words`, still finds it. An id starting `home-` names a ticket kept in your Flow home, for work that belongs to no project.

### `flow get`

`flow get <id>`, or just `flow <id>`: one ticket's fields, then its text, then the command that starts work on it.

A `rank:` line shows only on a ticket that has a number.

```console
$ flow get 4
shop-4-safari-cookie
Safari loses the session cookie after login
status: todo   parent: -
rank:       0
labels:     bug, urgent
deps:       -
dependents: -
ready:      yes
path:       .flow/tickets/shop-4/ticket.md

pick up with: flow start shop-4
------------------------------------------------------------
<!-- What changes and why. One paragraph. -->


## Done when

<!-- One observable check. Write it now. -->
```

- **`--files`**: also print the files the last session listed for the next one to open.

### `flow new`

`flow new "<description>"`: create a ticket. The description is one sentence that opens with the ticket's short name, then a colon: `Export the budget as a PDF: ...`. The title is cut from it, up to 4 words before the colon, or the first 4 words where there is no colon. The ticket's folder is its id alone.

```console
$ flow new "PDF export: the budget page as a PDF" --deps shop-2 --label feature,v1 --after shop-3
created shop-7-pdf-export
        .flow/tickets/shop-7/ticket.md
        rank: after shop-3
        labels: feature, v1
        deps: shop-2

pick up with: flow start shop-7
```

A description with no words to cut a title from, such as `!!!`, is refused.

A new ticket carries no rank and lands last. Add a place to put it elsewhere.

When 2 computers take one number at the same moment, the later one makes no ticket and says so. Run `flow new` again, and it takes the next number:

```console
$ flow new "PDF export: the budget page as a PDF"
flow: no ticket was made: another machine took shop-7 first. Run it again.
```

- **`--title <words>`**: the title in place of the cut one. Lowercase letters, digits and single hyphens, 40 characters at most, such as `login-redirect-loop`.
- **`--before <id>`**, **`--after <id>`** or **`--first`**: where the ticket goes among its siblings. [`flow rank`](#flow-rank) explains the order.
- **`--parent <id>`**: the ticket this one was split from.
- **`--deps <id,id>`**: tickets that must reach `review` or `done` before this one can start.
- **`--label <label,label>`**: tags in lowercase letters, digits and hyphens, 24 characters at most. Flow suggests 9: `feature`, `bug`, `chore`, `docs`, `refactor`, `research`, `topic`, `new-project` and `urgent`. Any other name works too, such as `v1` or `post-v1`.
- **`--body <text>`**: the ticket's text, in place of the template. `--body -` reads it from standard input.

### `flow edit`

`flow edit <id>`, with one flag per field to change. The status changes through its own commands, under [Ticket status](#ticket-status).

```console
$ flow edit shop-6 --title dark-theme --description "Dark theme for every page" --label feature,v1
shop-6
  title: dark-mode → dark-theme
  description: "Dark mode for every page" → "Dark theme for every page"
  labels: [feature, post-v1] → [feature, v1]

$ flow edit shop-3 --deps shop-5
shop-3
  deps: [shop-2, shop-5] → [shop-5]
```

- **`--title <words>`**: the short name, as in [`flow new`](#flow-new). The folder and its path stay, so a rename breaks no link.
- **`--description "<text>"`**: the one-sentence description. The title stays.
- **`--label <label,label>`**: the ticket's labels, replacing the whole list. An empty value clears it.
- **`--parent <id>`**: the ticket this one was split from. An empty value removes it.
- **`--deps <id,id>`**: the tickets this one waits on, replacing the whole list. An empty value clears it. A wait that would make a loop is refused.

The order changes through [`flow rank`](#flow-rank), never through `flow edit`.

### `flow rank`

`flow rank <id>`, with one place: put an open ticket among its siblings. Siblings are the tickets that share a parent, and top-level tickets share the empty parent.

```console
$ flow rank shop-4 --before shop-1
shop-4-safari-cookie  before shop-1
      numbered 3 other tickets too, in their current order

$ flow rank shop-3 --first
shop-3-csv-export  first
```

A move writes a `rank:` number on the moved ticket alone, halfway between its new neighbours. **The first move among tickets with no number numbers all of them once**, in their current order, as the first example shows. A move into a gap too small to split numbers the group again.

```console
$ flow rank shop-2 --before shop-4
flow: shop-4 is not an open ticket with the same parent: a ticket is ranked among its siblings.
```

- **`--before <id>`**, **`--after <id>`**: beside that sibling.
- **`--first`**, **`--last`**: at the front or the back.

Give one place. A `done` or `dropped` ticket has none.

### `flow file`

`flow file <id>...`: mark finished tickets as checked for lessons. `/flow:upkeep` runs it once it has written what a ticket taught into the wiki, your rules and your skills. Mark a ticket that taught nothing too, so it leaves `flow ls --unfiled`.

```console
$ flow file shop-1 shop-2
shop-1-budget-page   filed 2026-10-02
shop-2-budget-store  filed 2026-10-02

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
shop-6-old-layout  todo → dropped
      reason: replaced by the new layout
      moved → .flow/tickets/archive/shop-6

re-pointed to shop-5-chart-library:
  shop-3  deps → [shop-2, shop-5]
```

### `flow move`

`flow move <id>... <place>`: move tickets to another project's folder, or to `home`, your Flow home. Each ticket takes the next free number there. Its old id still finds it from the project it left.

```console
$ flow move shop-4 home
shop-4 → home-1-safari-cookie

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
flow revive --label <label>       bring back every parked ticket with a label
```

The skills move tickets for you. [Phases](../phases.md) covers which skill moves a ticket, and when. A move lists the tickets it unblocked:

```console
$ flow review shop-2
shop-2-budget-store  building → review

now ready:
  TICKET             STATUS  LABELS      PARENT
  shop-3-csv-export  todo    feature,v1  -
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
  shop-2-budget-store  review
  Or override with: flow done shop-1 --force
```

**A parked ticket comes back through the command for the status it left.** A ticket parked while `building` returns with `flow build`:

```console
$ flow park shop-4 --reason "waiting on a Safari machine"
shop-4-safari-cookie  building → parked
      reason: waiting on a Safari machine

revive with: flow build shop-4
```

**A label parks a set.** `flow park --label` parks every open ticket carrying it, in one commit, and `flow revive --label` returns each parked one to the status it left. A label no ticket carries changes nothing and lists the labels in use.

```console
$ flow park --label post-v1 --reason "after V1 ships"
shop-8-dark-mode  todo → parked
shop-9-pdf-export  building → parked

parked 2 tickets labelled post-v1: after V1 ships

$ flow revive --label post-v1
shop-8-dark-mode  parked → todo
shop-9-pdf-export  parked → building

revived 2 tickets labelled post-v1
```

## Settings

`flow settings` turns Flow's 4 on/off settings on or off, without opening a file. [Reference: settings](settings.md) explains each one.

```console
$ flow settings ls
setting           state  level
reminder          on     everywhere   a line beside every message, pointing Claude at the reply rules
sessionCheck      on                  the flow init suggestion, when a session opens
setupReminder     off    this folder  suggests flow init where a repository has no .flow/
wrapUp            on                  tells Claude to hand off once the conversation passes wrapUpAt tokens

value             default  yours
wrapUpAt          150000   200000  the conversation size in tokens at which wrapUp speaks
```

- **`flow settings ls`**: every setting, and the level that decides it, then each number setting with its default and your value. `yours` is blank while the default decides. A bare `flow settings` prints the same.
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
  fix: home/CLAUDE.md

Claimed a config key existed without opening the file.
```

### `flow cases edit`

`flow cases edit <ref>`: change a field. A case is never deleted.

```console
$ flow cases edit answered --status fixed --by home/CLAUDE.md
answered-unread/2026-10-02-answered-before-reading-the-file
  status: open → fixed
  fix: - → home/CLAUDE.md
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

A transcript names no machine, so the index tags each session with the name `flow install` saved for this computer, or `unnamed` before one is saved. Every answer from the index opens with one line per machine, its session count and its newest day. That line counts the whole index, whatever `--project` or `--since` narrows. The examples below leave it out.

```console
$ flow audit ls
pc-wsl: 1 session, newest 2026-10-02

SESSION   PROJECT  FROM        TO          SEG  TURNS  TOOLS  ERR  OUT  CACHE   COST
a1b2c3d4  shop     2026-10-02  2026-10-02  1    2      6      1    840  330.0k  -
```

`ls`, `get`, `turns`, `read`, `summary`, `timeline`, `context` and `sql` print it. `index`, `schema`, `keep`, `where` and `permissions` do not, since none of them answers from the sessions indexed. Release 1 copies no sessions between machines.

### `flow audit index`

Read every new transcript line into the index. A second run reads only what changed.

```console
$ flow audit index
  a1b2c3d4  -home-me-code-shop  +16 lines
1 transcripts read, 0 unchanged, 16 new lines, 1 sessions: 0.1s
/home/me/.flow/audit/audit.db
```

- **`--project <name>`**: one project's transcripts.
- **`--rebuild`**: delete the index and read everything again. Nothing is lost. It also tags every session with the machine's current name, which a rename does not change in rows already indexed.
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

### `flow audit context`

`flow audit context <id>`: how full the context was at each request to the model, and where the first file edit came.

```console
$ flow audit context a1b2
first edit: request 4, turn 2, line 41, context 52.3k
peak: 61.0k · 6 requests

#  TURN  LINE  AT     CONTEXT  OUT  TOOLS
1  1     3     09:00  48.1k    40   Bash
2  1     6     09:00  49.7k    25   Read Read
3  1     11    09:01  51.9k    30   Bash
4  2     41    09:01  52.3k    90   Edit   ← first edit
5  2     44    09:01  58.2k    20   Bash
6  2     47    09:02  61.0k    120  -
```

- **`--limit <n>`**: at most `n` requests. 200 by default.

### `flow audit permissions`

`flow audit permissions [id]`: count the permission questions Flow asked you, by where each came from and by what it said. A normal ticket build asks nothing except before a push or a publish, so the last section lists every other ask. Each of those is a rule to narrow.

This reads the permission log in `~/.flow/logs/permissions/`, never the index, so `flow audit index` is not needed first. A line that does not parse is skipped and counted. A missing log is an error, since `0 asks` there would read as a pass.

```console
$ flow audit permissions
permission log: 3 lines, 0 skipped (did not parse)
2 asks · 1 auto-allowed

BY SOURCE
SOURCE  ASKS  AUTO-ALLOWED
guard   1     0
rule    1     0
core    0     1

BY HEADLINE
ASKS  AUTO  HEADLINE
1     0     Pushes 3 commits to origin/main
1     0     Writes into ~/.claude/settings.json, which could switch the guard off
0     1     Writes .claude/skills/x/SKILL.md

THE TARGET: asks other than push and publish
1 ask outside the list:
AT                PROJECT  SOURCE  ANSWER  HEADLINE
2026-10-13 09:31  shop     guard   refuse  Writes into ~/.claude/settings.json, which could switch the guard off
```

`guard` is an ask from Flow's guard, `rule` one from a `permissions.ask` rule, and `core` one Claude Code raises on its own. An auto-allowed line is a core ask on a protected path that Flow allowed without a question, so it is counted apart. `AT` is UTC.

- **`[id]`**: one session, by the start of its id.
- **`--project <name>`**: one project's asks.
- **`--since <date>`**, **`--until <date>`**: from and to a date, both included, such as `2026-10-13`.
- **`--limit <n>`**: at most `n` headlines, and `n` asks outside the list. 20 by default.

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
