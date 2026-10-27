# Commands

Every `flow` command (`fw` for short) and its flags. `flow --help` lists them in the terminal, `flow tickets --help` lists one noun's, and `flow tickets new --help` shows one command.

**Commands sit under a noun**: `tickets`, `notes`, `audit` and `settings`. A noun typed alone lists, so `flow tickets` is the ticket table. `flow next` and the setup commands stay bare, and a bare `flow` prints the help.

**A query follows `--`, in double quotes**: `flow notes -- "cache"`. The `--` keeps a query such as `new` from reading as a command. A query the shell split into several words is refused, naming the quoted form.

**An unknown command exits 1** with one error line, then the help of the noun it was typed under, or the whole help.

**`--json` prints the result as JSON**, on every command but `install`, `update`, `init` and `sync`. Flow's own parts read it: the band and the hooks. A list is flat, one record per ticket in the order the text shows, each with its `parent` and its `depth` in the tree. A refusal prints `{"error": "<message>"}` and exits 1.

```console
$ flow tickets start shop-2 --json
{
  "ticket": {
    "id": "shop-2",
    "name": "shop-2-budget-store",
    "status": "in-progress",
    "parent": "shop-1",
    …
  },
  "from": "todo",
  "to": "in-progress",
  …
}
```

## Table of contents

- [Setting up](#setting-up): put Flow on your computer and your projects, and keep it current
  - [`flow install`](#flow-install): put Flow on this computer
  - [`flow update`](#flow-update): take a newer Flow
  - [`flow init`](#flow-init): set up the project you are in
  - [`flow doctor`](#flow-doctor): check that Flow is installed correctly
  - [`flow sync`](#flow-sync): back up your workflow and share it between your computers
- [The board](#the-board): see all your tickets and what to work on next
  - [`flow next`](#flow-next): what to work on next
  - [`flow tickets`](#flow-tickets): the open tickets as a tree, or the ones a quoted query names
  - [`flow tickets labels`](#flow-tickets-labels): the labels on the tickets a query names, to narrow by
  - [`flow tickets check`](#flow-tickets-check): find broken links between tickets
- [One ticket](#one-ticket): show, create, change or remove one ticket
  - [`flow tickets get`](#flow-tickets-get): show one ticket
  - [`flow tickets new`](#flow-tickets-new): create a ticket
  - [`flow tickets edit`](#flow-tickets-edit): change a ticket's title, description, labels or links
  - [`flow tickets rank`](#flow-tickets-rank): put a ticket before or after another
  - [`flow tickets file`](#flow-tickets-file): mark finished tickets as checked for lessons
  - [`flow tickets drop`](#flow-tickets-drop): remove a ticket that will never be done
  - [`flow tickets move`](#flow-tickets-move): move tickets to another project by its prefix, or to your Flow home
- [Notes](#notes): ideas and put-off work, each filed under a project's prefix
- [Ticket status](#ticket-status): move a ticket from one stage to the next
- [Settings](#settings): turn Flow's own settings on or off
- [Audit](#audit): read back what Claude Code did in past sessions
  - [`flow audit`](#flow-audit): every session, with its totals
  - [`flow audit index`](#flow-audit-index): read new sessions in
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

Put Flow on this computer. It links Flow's skills and scripts, downloads the tools Flow uses, and connects your Flow home. Your Flow home is `~/.flow/`, the folder where Flow keeps your notes, settings and tickets. It is backed up to a private GitHub repository, `flow-home`, which your other computers join. Run again, `flow install` puts back anything missing.

```console
$ flow install
Flow is installed: 12 skills, each typed under the plugin name, as /flow:groundwork.
named: this machine is pc-wsl
started: your Flow home, sent up so your other machines join it
Every line of the install is in ~/.flow/logs/install.log.
```

### `flow update`

Take a newer Flow: it pulls Flow's clone, then runs `flow install` again. A clone you linked yourself is a checkout of your own, so `flow update` refuses it and changes nothing. [Developing Flow](developing-flow.md) covers that setup.

```console
$ flow update
flow: ~/.flow/repos/flow is a link to /home/me/code/flow-dev, a checkout of your own that update leaves alone. Pull it yourself, then run flow install.
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

- **`--prefix <word>`**: the start of every ticket id, 2 to 8 lowercase letters, as `shop` in `shop-4`. Asked when left out, offering the folder's name: `shop` for `~/code/shop`, or the first 3 letters of a name over 8, `exp` for `expense-tracker`. A word another project on this computer already uses is refused, and the next free one is named:

  ```console
  $ flow init --prefix shop
  "shop" is the prefix of ~/code/shop-old, another project on this machine. Run flow init --prefix shopa.
  ```

  **Four words name a place, so none is a prefix:** `home`, `global`, `all` and `here`. A folder named `global` is no problem: the offer steps round the word and proposes `glo`. `--prefix global` is refused.

### `flow doctor`

Check that Flow is installed correctly. It changes nothing, names the fix on each failing line, and exits 1 on any failure.

```console
$ flow doctor
ok    issues: every job running in the background worked last time
ok    clone: 1 submodule on the commit this clone points at
ok    programs: node, git, claude, gh all resolve
ok    claude code: 2.1.304, and Flow needs 2.1.287 or later
ok    names: flow, fw, util, u all resolve
ok    util: fs tree runs
ok    ~/.agents: 12 skills linked under skills/flow/
ok    ~/.claude: skills/flow, 0 agents, 0 rules, 0 commands and CLAUDE.md linked
ok    settings.json: 18 hooks registered, every file they name on disk, sessions start in "default" mode
ok    ~/.flow: scripts, guides and docs resolve into this clone
ok    projects: fw ~/code/flow-dev
ok    tickets: 220 tickets in the current format

nothing to fix.
```

A failing line names the fix beneath it, such as `util is not linked: run flow install`.

- **`projects`**: the prefix and folder of each project on this computer. It names a registered folder that is gone, the current folder's prefix when another folder holds it (the fix is `ticketPrefix` in `.flow/settings.json`), a line whose folder has since changed its `ticketPrefix`, and the current project missing from the list. With any of these it adds a note listing every registered project. It reads the file and scans nothing.
- **`tickets`**: inside a project, names each ticket made before the current format: a folder named with more than its id, a `groundwork/map.md` that is only the empty template, and a title that is one of the ticket's own labels. Outside a project it is skipped.

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

A ticket is one piece of work, kept as a folder in the project's `.flow/tickets/`. Its status is `todo`, `in-progress`, `done`, `parked` or `dropped`, and its labels name the kind of work.

**Tickets come in rank order.** Tickets with the same parent are siblings, and top-level tickets share the empty parent. Among siblings, a ticket with a `rank:` number comes first, by number. The tickets without one follow by id, so a new ticket lands last. [`flow tickets rank`](#flow-tickets-rank) moves a ticket.

**Outside a project, a read shows your Flow home.** In a folder that is no project, `flow tickets`, `flow next` and the other reads run on the tickets in `~/.flow/tickets/`. They create nothing. A command that writes (`flow tickets new`, `flow notes new`, a status move on a bare number) refuses and names the choices: `flow init` here, or `--project home`.

**Every `flow tickets` and `flow next` list begins with one line naming its project**: the prefix, then the project's folder. It is the same in a project, with `-p`, and in a folder that is no project, where it names your Flow home.

```console
$ flow tickets -p home
home  ~/.flow
home-3-backup-notes  todo  chore

1 of 1.
```

**`-p <prefix>` runs a command in another project.** `flow tickets new`, `flow tickets`, `flow next` and `flow notes new` take `-p`, or `--project`, with the prefix of any project on this computer, from any folder. `home` is your Flow home. A command with an id reads the project from the id and takes no flag.

```console
$ flow tickets new "Dark mode: a theme switch" -p shop
created shop-7-dark-mode
```

**Only a prefix works.** `-p global` is refused, naming `home`. A folder name is refused too, naming the prefix the folder has when it is a project here, and so are `all` and a prefix no project has.

```console
$ flow tickets -p ~/code/shop
flow: /home/me/code/shop is not a project prefix. --project takes the prefix of a project, such as fw or home, never its folder.
  The project in /home/me/code/shop has the prefix shop.
  flow doctor lists the prefixes on this machine.
```

### `flow next`

What to work on next: the work in progress as a tree, then the ready tickets in rank order. Blocked tickets show only when nothing is in progress or ready.

```console
$ flow next
shop  ~/code/shop
last closed  shop-5-chart-library

in progress
  shop-1-budget-page       0/2
  ├── shop-2-budget-store
  └── shop-3-csv-export    blocked by shop-2
  shop-4-safari-cookie     in progress

ready (3)
  shop-6-dark-mode   feature,post-v1
  shop-7-pdf-export  feature
  shop-8-search-bar  feature

take: shop-2-budget-store
1 parked · waiting: 1 closed ticket
```

Each session opens on this screen, so it prints only what the next step needs.

**`in progress` shows each ticket in progress with every open child under it, to any depth.** A parent shows how many of its children are done, `0/2`. A started child sorts before its todo siblings. A child waiting on another ticket says what blocks it.

**`ready` holds the tickets that could start, outside the tree.** It shows 3, then `and N more (flow next --all)`. A ticket here is its name and labels. Parked tickets are a count, with no reasons: `flow tickets -- "status:parked"` shows them.

**`take:` names the ticket to start.** It is the first ticket in the tree, from the top, that could start, else the first ready one. A blocked ticket is never named, and neither is one in progress, since a running session owns those.

- **`--all`**: every ready ticket.
- **`-p`, `--project <prefix>`**: another project's tickets, or `home`'s.

### `flow tickets`

The open tickets as a tree: each ticket under the one it was split from, to any depth. Parked, done and dropped ones stay out, as a count, until the query names a status.

```console
$ flow tickets
shop  ~/code/shop
shop-1-budget-page       in-progress  feature,v1       0/2
├── shop-2-budget-store  todo         feature
└── shop-3-csv-export    todo         feature          blocked by shop-2
shop-4-safari-cookie     in-progress  bug,urgent
shop-6-dark-mode         todo         feature,post-v1
shop-7-pdf-export        todo         feature
shop-8-search-bar        todo         feature

7 of 9, 1 parked, 1 done or dropped hidden: "status:all".
```

**The last column holds what each ticket needs said.** A parent shows how many of its children are done, `0/2`. A ticket waiting on another says what blocks it. A parked ticket shows the first words of its reason, so a reason opens with its most important words. Siblings come in progress first, then in rank order.

**One quoted query narrows the tree.** It is the same query `flow notes` reads, after `--`. A word matches anywhere in the title, description, id, labels or body, and a word of 5 letters or more also matches a word one typo away. `field:value` terms narrow by a field:

```console
$ flow tickets -- "safary"
shop  ~/code/shop
shop-4-safari-cookie  in-progress  bug,urgent

1 of 9.
```

**A ticket whose parent the query left out stands at the top**, and names the parent it sits under:

```console
$ flow tickets -- "csv"
shop  ~/code/shop
shop-3-csv-export  todo  feature  blocked by shop-2, under shop-1

1 of 9.
```

**A comma inside a value means or, and a repeated field means and.** `"label:v1,post-v1"` finds a ticket with either label. `"label:feature label:v1"` finds a ticket with both.

- **`-- "<query>"`**: words and the fields below, in double quotes as one argument, such as `flow tickets -- "budget label:feature"`.
- **`label:<label>`**: the tickets carrying a label.
- **`status:<status>`**: `todo`, `in-progress`, `done`, `parked` or `dropped`. `status:all` shows every status.
- **`parent:<id>`**: one ticket and everything split from it, to any depth.
- **`filed:no`**: finished tickets not yet checked for lessons. [`flow tickets file`](#flow-tickets-file) marks them, and `filed:yes` finds the ones it marked.
- **`-p`, `--project <prefix>`**: another project's tickets, or `home`'s. This is a flag beside the query, never a term inside it.
- **`--flat`**: the plain table, one row per ticket with a `PARENT` column, in progress first.

**A query with `label:flow-issue` reads every project on this computer, and `home`.** A Flow issue is filed in the project where the fault arose, so the list gathers them all, one group per project: the header line, then that project's table. The project you stand in comes first and `home` last. A project with no match shows `no tickets.`. One count line closes the list. `-p` limits it to one project. Every other query reads the project you stand in. A project whose folder is gone is skipped, and `flow doctor` names it.

```console
$ flow tickets -- "label:flow-issue"
shop  ~/code/shop
shop-9-wrong-total  todo  flow-issue,wrong-output

fw  ~/code/flow-dev
fw-214-hand-run-in-tmp  todo  flow-issue,rework-loop

home  ~/.flow
no tickets.

2 of 21, 4 done or dropped hidden: "status:all".
```

### `flow tickets labels`

`flow tickets labels -- "<query>"`: the labels on the tickets a query names, each with how many of those tickets carry it. Add a label to the query to narrow the set, until it is small enough to read. The labels in the query itself are left out of the count. A query with `label:flow-issue` counts the tickets of every project and `home` together, in one count line and one list, since the repeat check asks whether a type is filed anywhere. Each id starts with its project's prefix, such as `shop-9`.

```console
$ flow tickets labels -- "label:flow-issue"
3 tickets, 3 open
more labels: rework-loop 2, hook 1
exp-12  todo         Agent restated the plan instead of building
exp-14  in-progress  Hook printed the wrong ticket
exp-15  todo         Asked for a go after the user said go
```

**The tickets are listed when 10 or fewer match.** More than that and the command says to add a `label:` term.

- **`-- "<query>"`**: the same query `flow tickets` reads. Done and dropped tickets stay out, with a count of them, until the query names a `status:`.

### `flow tickets check`

Find broken links between tickets: tickets waiting on each other in a loop, a link to a ticket that does not exist, a wait on a dropped ticket, an open ticket under a closed one, a misspelled status, a ticket with no title or description. It exits 1 when it finds one, and `flow next` says when to run it.

```console
$ flow tickets check
no problems: no cycles, no dangling ids, no dropped blockers, no closed parents, no unknown statuses, every ticket has a title and a description.
```

## One ticket

A ticket's id is the project's prefix and a number, `shop-4`. Its title is up to 4 hyphenated words, `safari-cookie`, and the two together name it everywhere: `shop-4-safari-cookie`. Its description is one sentence saying what the work is, opening with the short name. Any of these finds a ticket: `4`, `shop-4`, `shop-4-safari-cookie`, or a title word that matches one ticket alone, such as `safari`. Only the id part counts, so a name from before a rename, `shop-4-old-words`, still finds it. An id starting `home-` names a ticket kept in your Flow home, for work that belongs to no project.

**An id works from any folder.** Its prefix names the project, read through the list of projects on this machine (`registry.json` in your Flow home). From inside `app`, `flow tickets get shop-4` shows the ticket of the `shop` project, and `flow tickets start shop-4` starts it. The folder you stand in wins when its own prefix matches, and a bare number is always the current project's.

A project joins the list by its first ticket write (`flow init`, `flow tickets new`, `flow tickets start` and the like), and a read never adds one. An unknown prefix fails with a message that names `flow doctor`, which lists the projects.

### `flow tickets get`

`flow tickets get <id>`: one ticket's fields, then its text, then the command that starts work on it. It takes no flags.

A `rank:` line shows only on a ticket that has a number. An `activity:` line shows on a ticket a phase has started.

```console
$ flow tickets get 4
shop-4-safari-cookie
Safari loses the session cookie after login
status: todo   parent: -
rank:       0
labels:     bug, urgent
deps:       -
dependents: -
ready:      yes
path:       .flow/tickets/shop-4/ticket.md

pick up with: flow tickets start shop-4
------------------------------------------------------------
<!-- What changes and why. One paragraph. -->


## Done when

<!-- One observable check. Write it now. -->
```

### `flow tickets new`

`flow tickets new "<description>"`: create a ticket. The description is one sentence that opens with the ticket's short name, then a colon: `Export the budget as a PDF: ...`. The title is cut from it, up to 4 words before the colon, or the first 4 words where there is no colon. The ticket's folder is its id alone. `flow tickets edit --title` renames it.

```console
$ flow tickets new "PDF export: the budget page as a PDF" --deps shop-2 --label feature,v1
created shop-7-pdf-export
        .flow/tickets/shop-7/ticket.md
        labels: feature, v1
        deps: shop-2

pick up with: flow tickets start shop-7
```

A description with no words to cut a title from, such as `!!!`, is refused.

A new ticket carries no rank and lands last. [`flow tickets rank`](#flow-tickets-rank) puts it elsewhere.

When 2 computers take one number at the same moment, the later one makes no ticket and says so. Run `flow tickets new` again, and it takes the next number:

```console
$ flow tickets new "PDF export: the budget page as a PDF"
flow: no ticket was made: another machine took shop-7 first. Run it again.
```

- **`--parent <id>`**: the ticket this one was split from.
- **`--deps <id,id>`**: tickets that must reach `done` before this one can start.
- **`--label <label,label>`**: tags in lowercase letters, digits and hyphens, 24 characters at most. Flow suggests 9: `feature`, `bug`, `chore`, `docs`, `refactor`, `research`, `topic`, `new-project` and `urgent`. Any other name works too, such as `v1` or `post-v1`.
- **`--body <text>`**: the ticket's text, in place of the template. `--body -` reads it from standard input.
- **`-p`, `--project <prefix>`**: the project that gets the ticket, from any folder. `home` files it in `~/.flow/tickets/`, numbered `home-1`.

### `flow tickets edit`

`flow tickets edit <id>`, with one flag per field to change. The status changes through its own commands, under [Ticket status](#ticket-status).

```console
$ flow tickets edit shop-6 --title dark-theme --description "Dark theme for every page" --label feature,v1
shop-6
  title: dark-mode → dark-theme
  description: "Dark mode for every page" → "Dark theme for every page"
  labels: [feature, post-v1] → [feature, v1]

$ flow tickets edit shop-3 --deps shop-5
shop-3
  deps: [shop-2, shop-5] → [shop-5]
```

- **`--title <words>`**: the short name in place of the one cut from the description. Lowercase letters, digits and single hyphens, 40 characters at most, such as `login-redirect-loop`. The folder and its path stay, so a rename breaks no link.
- **`--description "<text>"`**: the one-sentence description. The title stays.
- **`--label <label,label>`**: the ticket's labels, replacing the whole list. An empty value clears it.
- **`--parent <id>`**: the ticket this one was split from. An empty value removes it.
- **`--deps <id,id>`**: the tickets this one waits on, replacing the whole list. An empty value clears it. A wait that would make a loop is refused.
- **`--activity <word>`**: the kind of work in flight, `design`, `build` or `debug`.

The order changes through [`flow tickets rank`](#flow-tickets-rank), never through `flow tickets edit`.

### `flow tickets rank`

`flow tickets rank <id>`, with one place: put an open ticket among its siblings. Siblings are the tickets that share a parent, and top-level tickets share the empty parent.

```console
$ flow tickets rank shop-4 --before shop-1
shop-4-safari-cookie  before shop-1
      numbered 3 other tickets too, in their current order

$ flow tickets rank shop-3 --first
shop-3-csv-export  first
```

A move writes a `rank:` number on the moved ticket alone, halfway between its new neighbours. **The first move among tickets with no number numbers all of them once**, in their current order, as the first example shows. A move into a gap too small to split numbers the group again.

```console
$ flow tickets rank shop-2 --before shop-4
flow: shop-4 is not an open ticket with the same parent: a ticket is ranked among its siblings.
```

- **`--before <id>`**, **`--after <id>`**: beside that sibling.
- **`--first`**, **`--last`**: at the front or the back.

Give one place. A `done` or `dropped` ticket has none.

### `flow tickets file`

`flow tickets file <id,id>`: mark finished tickets as checked for lessons. `/flow:upkeep` runs it once it has written what a ticket taught into the wiki, your rules and your skills. Mark a ticket that taught nothing too, so it leaves `flow tickets -- "status:done filed:no"`.

```console
$ flow tickets file shop-1,shop-2
shop-1-budget-page   filed 2026-10-02
shop-2-budget-store  filed 2026-10-02

nothing left unfiled.
```

- **`--force`**: mark again a ticket already marked, with today's date.

### `flow tickets drop`

`flow tickets drop <id> --reason "<why>"`: remove a ticket that will never be done. Its folder moves to `.flow/tickets/archive/`.

**A drop refuses while an open ticket waits on this one**, and lists each. Add one of these:

- **`--by <id>`**: make the waiting tickets wait on a replacement.
- **`--force`**: drop the waiting tickets too, all the way down.

```console
$ flow tickets drop shop-6 --reason "replaced by the new layout" --by shop-5
shop-6-old-layout  todo → dropped
      reason: replaced by the new layout
      moved → .flow/tickets/archive/shop-6

re-pointed to shop-5-chart-library:
  shop-3  deps → [shop-2, shop-5]
```

### `flow tickets move`

`flow tickets move <id,id> <place>`: move tickets to another project, or to `home`, your Flow home. The place is the project's prefix, such as `shop`, never its folder. Each ticket takes the next free number there. Its old id still finds it from the project it left.

```console
$ flow tickets move shop-4 home
shop-4 → home-1-safari-cookie

the old id still finds it from the project (flow tickets get shop-4)
```

**A link to a ticket staying behind refuses the whole move.** Move the linked tickets in the same command, or remove the link first with `flow tickets edit --deps` or `--parent`.

## Notes

A note is an idea or put-off work, one small file in `~/.flow/notes/`. It belongs to a project, named by that project's prefix: `shop`, or `home` for a note that holds in every project. A note shows its project's prefix, never its folder's name.

```console
$ flow notes new "Export the budget as a CSV too" --label idea
created export-the-budget-as-a-csv-too
        ~/.flow/notes/export-the-budget-as-a-csv-too.md
        project: shop
        labels: idea
```

- **`flow notes new "<text>"`**: add a note to the project you are in.
- **`--label <label,label>`**: tags, with the rules a ticket's labels follow.
- **`-p`, `--project <prefix>`**: the project that gets the note, which must be a project on this computer, or `home`. Outside a project the note is refused without it.
- **`flow notes -- "<query>"`**: the notes the query names, as JSON, newest change first. The query reads words, `label:` and `project:`. `project:<prefix>` takes a prefix, `project:home` the home notes, `project:here` this project's, and `project:all` every note. With no `project:` term, a query shows this project's notes and the home ones.
- **`flow notes get <name>`**, **`drop <name>`**, **`promote <name>`**: show a note, delete it, or turn it into a ticket in the project it belongs to.

**A `project:` term needs only a prefix's shape**, since notes travel between your computers and the list of projects does not. `project:global` is refused, naming `home`, and so is a folder name.

## Ticket status

Each status has a command named for where the ticket lands:

```text
flow tickets todo <id>                    back in the queue
flow tickets start <id> --activity <word> start working on it
flow tickets done <id>                    close it, and move its folder to the archive
flow tickets park <id> --reason "<why>"   set it aside
```

The skills move tickets for you. `--activity` is `design`, `build` or `debug`, and names the kind of work in flight. A move lists the tickets it unblocked:

```console
$ flow tickets done shop-2
shop-2-budget-store  in-progress → done
      moved → .flow/tickets/archive/2

now ready:
  TICKET             STATUS  LABELS      PARENT
  shop-3-csv-export  todo    feature,v1  -
```

**A move refuses**:

- starting a ticket whose waits have not reached `done`;
- starting a parent while one of its children is open;
- closing a parent while one of its children is open;
- `flow tickets park` without `--reason`.

`--force` overrides all but the last.

```console
$ flow tickets done shop-1
flow: shop-1 has 1 open child ticket, its work is theirs:
  shop-2-budget-store  in-progress
  Finish those, or close it anyway with: flow tickets done shop-1 --force
```

**A reason opens with the words that matter most**, since a narrow list (the board's) shows only the first ones.

**A parked ticket comes back through the command for the status it left.** A ticket parked while `in-progress` returns with `flow tickets start`, and one parked from `todo` with `flow tickets todo`:

```console
$ flow tickets park shop-4 --reason "waiting on a Safari machine"
shop-4-safari-cookie  in-progress → parked
      reason: waiting on a Safari machine

revive with: flow tickets start shop-4
```

## Settings

`flow settings` turns Flow's 4 on/off settings on or off, without opening a file. [Reference: settings](settings.md) explains each one.

```console
$ flow settings
setting        state  level
reminder       on            a line beside every message, pointing Claude at the reply rules
sessionCheck   on            the flow init suggestion, when a session opens
setupReminder  on            suggests flow init where a repository has no .flow/
wrapUp         on            tells Claude to hand off once the conversation passes wrapUpAt tokens

value            default  yours
wrapUpAt         170000           the conversation size in tokens at which wrapUp speaks
keepWarmLead     3                minutes before the prompt cache expires that /keepwarm pings
keepWarmMaxIdle  4                hours after your last request that /keepwarm stops pinging
```

- **`flow settings`**: every setting, and the level that decides it, then each number setting with its default and your value. `yours` is blank while the default decides.
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

## Audit

`flow audit` reads the transcripts Claude Code keeps of every session into an index, `~/.flow/audit/audit.db`, and answers questions from it. A read refreshes the index first when the last full run is over 30 minutes old, and the line under the coverage line says how old it is. The first build is `flow audit index`. A session id can be any start of it that matches one session alone, such as `a1b2`. A segment is one unbroken context window, and a turn is one prompt with everything it set off.

A transcript names no machine, so the index tags each session with the name `flow install` saved for this computer, or `unnamed` before one is saved. Every answer from the index opens with one line per machine, its session count and its newest day. That line counts the whole index, whatever a `project:` or `since:` term narrows. The examples below leave it out.

```console
$ flow audit
pc-wsl: 1 session, newest 2026-10-02

SESSION   PROJECT  FROM        TO          SEG  TURNS  TOOLS  ERR  OUT  CACHE   COST
a1b2c3d4  shop     2026-10-02  2026-10-02  1    2      6      1    840  330.0k  -
```

`flow audit` itself, `get`, `turns`, `read`, `summary`, `timeline`, `context` and `sql` print it. `index`, `schema`, `keep`, `where` and `permissions` do not, since none of them answers from the sessions indexed. Release 1 copies no sessions between machines.

### `flow audit index`

Read every new transcript line into the index. A second run reads only what changed.

```console
$ flow audit index
  a1b2c3d4  -home-me-code-shop  +16 lines
1 transcripts read, 0 unchanged, 16 new lines, 1 sessions: 0.1s
/home/me/.flow/audit/audit.db
```

- **`-- "project:<name>"`**: one project's transcripts.
- **`--rebuild`**: delete the index and read everything again. Nothing is lost. It also tags every session with the machine's current name, which a rename does not change in rows already indexed.
- **`--quiet`**: print the totals alone.

### `flow audit`

Every session in the index, newest first.

```console
$ flow audit
SESSION   PROJECT  FROM        TO          SEG  TURNS  TOOLS  ERR  OUT  CACHE   COST
a1b2c3d4  shop     2026-10-02  2026-10-02  1    2      6      1    840  330.0k  -
```

- **`-- "<query>"`**: `project:<name>` for one project's sessions, `since:<date>` for sessions from that date on, such as `flow audit -- "project:shop since:2026-10-01"`.
- **`--limit <n>`**: at most `n` sessions. 30 by default.

### `flow audit get`

`flow audit get <id>`: one session in full, ending with the command to read its heaviest turn. `flow audit <id>` is an unknown command, and prints the audit help.

```console
$ flow audit get a1b2
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
   → Bash {"command":"flow tickets get shop-4"}
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

`flow audit summary [id] [-- "<query>"]`: a few lines of totals, for one session, or for every session when no id is given.

```console
$ flow audit summary a1b2
a1b2c3d4  shop  2026-10-02 09:00 → 2026-10-02 09:01
2 turns · 1 segments · 6 tools · 1 errors · 2 files · -
out 840 · cache read 330.0k · cache write 3.0k

Bash 3 (1 err)  Read 2  Edit 1
```

- **`-- "<query>"`**: `project:<name>` for one project's sessions, `since:<date>` for sessions from that date on.

### `flow audit timeline`

`flow audit timeline <id>`: every tool call in one session, in order.

```console
$ flow audit timeline a1b2
TURN  TOOL  OK   CALL
1     Bash  ok   flow tickets get shop-4
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

`flow audit permissions [id] [-- "<query>"]`: count the permission questions Flow asked you, by where each came from and by what it said. A normal ticket build asks nothing except before a push or a publish, so the last section lists every other ask. Each of those is a rule to narrow.

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
1     0     Write ~/.claude/settings.json · can switch the guard off
0     1     Writes .claude/skills/x/SKILL.md

THE TARGET: asks other than push and publish
1 ask outside the list:
AT                PROJECT  SOURCE  ANSWER  HEADLINE
2026-10-13 09:31  shop     guard   refuse  Write ~/.claude/settings.json · can switch the guard off
```

`guard` is an ask from Flow's guard, `rule` one from a `permissions.ask` rule, and `core` one Claude Code raises on its own. An auto-allowed line is a core ask on a protected path that Flow allowed without a question, so it is counted apart. `AT` is UTC.

- **`[id]`**: one session, by the start of its id.
- **`-- "<query>"`**: `project:<name>` for one project's asks, `since:<date>` and `until:<date>` for a span, both days included, such as `flow audit permissions -- "since:2026-10-13"`.
- **`--limit <n>`**: at most `n` headlines, and `n` asks outside the list. 20 by default.

### `flow audit sql`

`flow audit sql "<sql>"`: any other question, as SQL against the index. Only `SELECT` and `WITH` run.

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
