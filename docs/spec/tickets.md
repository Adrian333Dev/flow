# Tickets

How Flow holds a project's work. A ticket is one piece of work: its status, its plan and its history, in one folder. A project's tickets live on an orphan branch `flow`, checked out once at `.flow/`, so every code branch sees the same tickets. The `flow` command creates, moves and ranks them. Each open ticket is also a skill the user types, `/exp-47`, which loads it into a phase.

## Scope

- **In**: the ticket's folder and fields, ids, the 2 places a project's tickets live, sync of tickets, the `flow` ticket and board commands, the ticket skills, the status moves the agent makes, and what a ticket records about its sessions.
- **Out**: `flow init` and the rest of setup, in `docs/spec/setup.md`. What `/flow:handoff` writes into a ticket, in `docs/spec/skills.md`.

## A ticket's life

Each status, and what moves a ticket into it:

```text
   todo           ready to work, nothing else
     │  flow start: the agent, once it has read the ticket
     ▼
   in-progress    someone is on it, from the first question to the last check
     │  flow done: the agent, once its own check passes
     ▼
   done           a dependent ticket unblocks here, and only here

   flow start on a done ticket reopens it.
   parked (put off) and dropped (cancelled) sit beside the line, each with a reason.
```

## Behaviors

### The ticket

- `V1` **A ticket has a short `title` and a `description`.** The title is up to 4 hyphenated words, `login-redirect-loop`. The description is one sentence that opens with the short name and a colon: `Login redirect loop: the page reloads after a wrong password`. `flow new` cuts the title from the words before the first colon, else the first 4 words, and `--title` overrides the cut. `flow edit <id> --title` renames. Flow joins the id and the title as the ticket's name, `exp-47-login-redirect-loop`, in every list, message and badge. A title with capitals, spaces or over 40 characters is refused. Decided with the user 2026-10-14: a required `--title` made the agent write the same idea twice. Renames will be frequent, so the name leaves the folder (`fw-16` map `## 20.5.4`).
- `V1` **One folder per ticket**, `.flow/tickets/<id>/`: `ticket.md`, `history.md`, and what the work writes, such as `decisions/<subject>.md`, `reports/` and `protos/<name>/`. A ticket made earlier still holds its `groundwork/map.md`, `plan.md` and `issues.md`, until `/flow:file-findings` reads them.
- `V1` **A ticket is one file, `ticket.md`**: what it is for and how you know it is done, then `## Questions` if the work needs design, `## Tasks` if it needs building, and `## State`. Both lists are optional and flat, except `## Questions`, which keeps Title Case group headings. `flow <id>` counts the boxes in each, `questions: 3/7 answered` and `tasks: 2/5 done`, and skips a box inside an HTML comment. `flow new` writes no `map.md`, no `plan.md` and no `issues.md`.
- `V1` **Decisions move to `decisions/<subject>.md` once they outgrow `ticket.md`**, past about 300 lines. `ticket.md` keeps the questions, the state and a line per file, and `flow <id>` lists the files.
- `V1` **Big work is cut into children.** A child names its parent in `parent:`. The parent's `## Tasks` lists its children in build order, one line each that starts with the child's id: `- [ ] fw-127: …`. `flow done` on a child ticks that line, and reopening the child clears it. A parent closes after its last child. `deps` stays for the rare wait outside the family.
- `V1` **Labels are tags**: `labels: [feature, v1]` in the frontmatter, several per ticket, each in lowercase letters, digits and hyphens, 24 characters at most. Flow works in full on a ticket with no label, and nothing in its code reads a label to decide what to do.
- `V1` **`activity:` is the kind of work under way on an in-progress ticket**, one word of 1 to 8 lowercase letters: `design`, `build` or `debug`. The word is open, and `refine` and `ideate` are `design`. `flow start <id> --activity <word>` sets it at pickup, also on a ticket already in progress, so naming the work costs no extra call. `flow edit <id> --activity <word>` changes it by hand, and an empty value clears it. Any status move clears it, and a ticket that is not in progress refuses it. Only `/flow:groundwork` (`design`), `/flow:execute` (`build`) and `/flow:debug` (`debug`) set it. No skill switches it mid-work: `proto` and `research` were dropped on 2026-10-18 because each switch and its reset cost 2 calls, for words that seldom apply. The agent may still set any word by hand. `flow <id>` prints an `activity:` line while one is set. The band (`fw-137`) shows it in capitals and reads it before any word derived from the ticket. Decided with the user 2026-10-18.
- `V1` **Flow suggests 9 labels**: `feature`, `bug`, `chore`, `docs`, `refactor`, `research`, `topic`, `new-project` and `urgent`. They are named in docs and skills only. No list sits in the code, and every label is free, such as `v1`, `post-v1` or `security`. `new-project` marks a whole project brainstormed from scratch. Not suggested, on purpose: `wontfix`, `duplicate`, `invalid` (that is `dropped` with a reason), `blocked` (that is `deps`), `question` (that is a `topic`), `idea` (the inbox holds raw ideas, and `parked` holds put-off work), `epic` (children already show a big parent), and `enhancement`, `help wanted`, `good first issue`.
- `V1` **`type` and `priority` are gone.** The kind of work is a label, and an urgent mark is the label `urgent`. Decided with the user 2026-10-11 and 2026-10-14: `type` was redundant, since a ticket's contents already say what kind of work it is.
- `V1` **5 statuses**: `todo` is ready to work and nothing else. `in-progress` is under way, and a ticket waiting on the user stays there. `done` is closed by the agent once its own check passes, and the user reopens it in a word. `parked` is put off, with a reason saying what brings it back. `dropped` is cancelled, with a reason. No project adds a status. One field says where the work is.
- `V1` **Only `done` satisfies a dependency.** A ticket still `in-progress` can change under the work built on top of it.
- `V1` **A new ticket always starts `todo`.**
- `V1` **One rule orders every ticket.** Tickets with the same parent are siblings, and top-level tickets share the empty parent. Among siblings, a ticket with `rank:` comes first, by number, and the tickets without one follow by id. A new ticket has no rank, so it lands last. A list across parents sorts level by level from the top parent down, so a child sits where its parent sits.
- `V1` **`flow rank <id> --before <id>` (or `--after`, `--first`, `--last`) writes a number on the moved ticket alone.** The number is the middle of its new neighbours, after Backlog.md's `ordinal`. The first move in a group with unranked tickets numbers the whole group once (1000, 2000, …), then places the ticket. A gap too small to split numbers the group again. `flow new` takes `--before`, `--after` and `--first` too. Decided with the user 2026-10-14. Refused: an order field beside priority, a list file holding the order, and `flow move` as the command name.
- `V1` **Frontmatter changes only through `flow`.** A hand edit to the body rides along with the next commit.
- `V1` **No ticket for 3 kinds of work**: a small task asked in chat, a `/flow:research` question, and a subagent's job, which works under the ticket that sent it. Agreed by the user 2026-10-01: the board would fill with 2-minute tickets.

### Ids

- `V1` **An id is a short word and a number**: `exp-47`. The word is `ticketPrefix` in the project's `.flow/settings.json`, 2 to 8 lowercase letters, asked once by `flow init`. The pattern is Backlog.md's, Linear's and Jira's.
- `V1` **Tickets outside any project use `home`**, live in `~/.flow/tickets/`, and their ids work from anywhere: `home-4`.
- `V1` **A project's id works from any folder, through the registry.** `locate()` reads the id's word: `home` goes home, the word of the project you stand in (or no word) is that project, and any other word is looked up in `registry.json`. The folder you stand in wins, so a clash never changes what a project sees of itself. An unknown prefix fails naming `flow doctor` and saying a project registers by its first ticket write. A registered folder with no `.flow/` or another `ticketPrefix` is refused with the cause. Decided with the user 2026-10-19 (`fw-111` 0.0, 2.0).
- `V1` **Outside a project a read shows the home place and a write refuses.** `flow ls` and `flow next` print `outside a project: showing ~/.flow/tickets` and create nothing. `flow new`, `flow note` and a status move on a bare number refuse, naming `flow init` here and `--project home`. An id that names its place (`home-4`, `bee-1`) needs no project, so it works and prints no line. Decided with the user 2026-10-19 (`fw-111` 2.1).
- `V1` **`--project <prefix>`, short `-p`, reaches another project on `new`, `ls`, `next` and `note`.** One resolver, `projectNamed`, reads it: `home`, the prefix of the project you stand in, or a registered prefix. A command with an id reads the project from the id and takes no flag. `global`, `all` and a folder are refused, a folder with the prefix the registry holds for it. Short flags are a `short:` property of a value flag in `parseArgs`; `-p` is the only one so far (`fw-149` rule 6 assigns the rest). Decided with the user 2026-10-19 (`fw-111` 2.0, built in `fw-211`).
- `V1` **`home`, `global`, `all` and `here` are no prefix.** `flow init` refuses them and `offerWord` steps round them: a folder named `global` is offered `glo`, `home` is offered `hom`, `all` is offered `flow`. Merges `fw-163`.
- `V1` **A note names its project by prefix, `home` for the Flow home.** `project: shop` in its header, never the folder name, and `global` is gone. `--project` on a note needs a prefix registered on this machine, as a typo guard. A `project:` query term checks the prefix's shape alone, since notes travel between machines and the registry does not. Notes filed before this carried the folder name or `global`; `lab/scripts/convert-notes.js` rewrote them once on the main machine, and a note on another machine meets it by running the script there. There is no read-time shim for the old words.
- `V1` **A number is never given out twice in one place.** `ticket-counter`, beside `version`, holds the highest number the place ever gave out, committed with its tickets. The next number is the higher of the counter and the highest ticket, plus 1. Ruled with the user 2026-10-07: numbering from the tickets on disk freed the number of a ticket deleted, moved away or taken back, and `fw-16` went to a second ticket.
- `V1` **A bare number means the current place's ticket**: `12` inside the expense app is `exp-12`.
- `V1` **A typed name is read by its id alone.** `exp-47-old-words` finds `exp-47` after any rename. A title word that matches one ticket finds it too. A ticket made before the title moved out of the folder keeps its old folder name, and the same lookup finds it.
- `V1` **`flow move <id> <home|prefix>` renumbers into the target**, and the ticket keeps `was: exp-12`, so the old id still finds it, from any project that routes the old prefix. The destination is a prefix looked up in the registry; a folder is refused with a message naming the prefix. A link to a ticket staying behind refuses the move.

### Where a project's tickets live

- `V1` **On the project's own branch `flow`, by default.** It shares no history with the code, and each clone checks it out once at `<repo>/.flow` through `git worktree`. Every code branch ignores `.flow/`. Anyone who can read the project gets its tickets. Ruled 2026-09-29: a `.flow/` committed with the code gave each branch its own copy, so 2 branches invented one number, and a status moved on one branch stayed old on the other.
- `V1` **In the Flow home, with `flow init --private`**: `.flow/` is a link to `~/.flow/projects/<name>/`, hidden by `.git/info/exclude`, and `flow sync` carries it. For a public repository, which would publish its tickets, and a repository that refuses the user's pushes. The folder's `settings.json` holds the repository's address, so `flow init` in another clone finds it.
- `V1` **`flow init` picks the place in order**: `--private`, a Flow home folder for this repository, an existing `flow` branch, then the repository's visibility. Public, or unreadable, asks with the Flow home the default. Private, outside GitHub, or no remote takes the branch.
- `V1` **`flow store` says where the tickets live. `flow store private` and `flow store branch` move them.** Moving off the branch leaves it in place and prints how to delete it. Moving onto it refuses where the branch holds a ticket the move would delete.
- `V1` **Tickets cannot conflict across code branches**, since every branch shares one checkout. 2 people conflict only on the same ticket, since each ticket is its own folder.
- `never` **A place on one machine alone**, built and removed 2026-10-01: the user ruled the case not worth a flag in V1.
- `never` **Flow's project rules kept in the Flow home, loaded through `CLAUDE.local.md`**: machinery for an isolation V1 does not need.

### Sync

- `V1` **Every command writing a ticket commits**, the whole folder, so the user's hand edits ride along.
- `V1` **A push follows a status move or a drop, in the background**, and after a reply once 30 minutes have passed with something changed, and at session end. The user asked for more than session end, and at most every half hour.
- `V1` **A pull runs at session start, in the background, and right before a new ticket takes its number.**
- `V1` **`flow new` pushes at once, or makes no ticket.** Offline, no ticket is made, and git's own words are printed. A number shown and then changed would stay wrong in every plan, commit message and conversation that already used it. Decided with the user 2026-09-29.
- `V1` **2 machines taking one number: the later `flow new` makes no ticket**, prints `no ticket was made: another machine took exp-5 first. Run it again.`, and leaves no trace on the branch. The retry takes the next number. Both folders are now `exp-5`, so the 2 tickets meet on the same file, and git cannot tell them apart or renumber one. A rebase replays every commit, so a ticket made and later removed would stop each later pull.
- `V1` **The Flow home claims a number the same way**, for a home ticket and a private project's. `flow new` runs `flow sync` on `~/.flow/` before taking the number. Then it commits every changed file there, merges, and pushes before the id shows. Offline, on a clash in another file, or behind another machine's changelog entry, no ticket is made. Decided with the user 2026-10-07: a number taken on the spot was renumbered at the next sync, mostly in the background, and the new id printed nowhere. Every changed file goes up, not the ticket alone, since git refuses to merge in the other machine's work over an uncommitted file it changed.
- `V1` **`flow sync` still renumbers a clash in the Flow home, keeping `was:`**, and prints `home-4 is now home-5: another machine took home-4 first.` Only a ticket made before claims existed, or while the Flow home had no remote, meets it. A Flow home with no remote numbers on the spot, as a branch with no remote does.
- `V1` **A pull meeting the same lines of one ticket changed on both sides is put back**, with the local version committed for a merge by hand.

### The board

- `V1` **`flow next` prints what to work on, in rank order**: in flight first, then what could start, then what was set aside. A parent with open children stays out of `in flight`. The tables show a `LABELS` column.
- `V1` **`flow tree` shows a split feature whole**: every level, each parent's count of children done, and what blocks each ticket. Parked tickets show, with their reason, under `--all` only. Kept by the user 2026-10-01, parked rows cut 2026-10-19.
- `V1` **`flow check` finds cycles, dangling ids, dropped blockers, orphaned parents, unknown statuses, and a ticket with no title or description.**
- `V1` **A one-time script converts the old tickets**, `lab/scripts/convert-tickets.js`, never a `flow` command, archived to `lab/archive/` after its real run. It rewrites only the frontmatter of each `ticket.md`: the old `title` becomes the `description`, the new `title` is the folder's words, `type` becomes a label, the old statuses become `in-progress`, and `priority` goes. A live `priority: high` ticket takes a `rank` among its siblings, so it keeps its place ahead of the unranked ones. Every other priority just goes. Maps, plans, reports, prototypes and folder names are not touched, and a second run changes nothing. Decided with the user 2026-10-14: a harvest into new tickets would break every id and link, for what a frontmatter rewrite does at no loss. A script, since no one but the user holds old-shape tickets.
- `V1` **`flow ls "<query>"` takes one quoted query**, the grammar `flow notes` reads (`scripts/lib/query.js`). Fields: `label`, `status`, `parent`, `filed` (`filed:no` is a closed ticket `/flow:upkeep` has not filed) and words. A comma inside a value means either, a repeated field means both: `"label:flow-issue label:rework-loop"`. Rank order. The flags `--status`, `--label`, `--parent` and `--unfiled` are gone, with no migration. Decided with the user 2026-10-19: one grammar for notes and tickets, and drilling down is label intersection, so no label has to sit in one place of a tree.
- `V1` **`flow ls` hides parked, done and dropped tickets unless the query names a `status:` term.** `status:all` shows every status, as `project:all` does in notes, and the count line says how many are hidden. `flow next` and `flow tree` keep their `--all` flags. Decided with the user 2026-10-19.
- `V1` **`flow next` is small: name and labels per ticket, parked as a count, and a `take:` line.** Every session opens on it and pays for each line in context. A section holds 3 (continuing) or 5 (ready) rows, then says how many it left out. `take:` is the first continuing or ready ticket, never one in flight. Decided with the user 2026-10-19.
- `V1` **`flow labels "<query>"` counts the other labels on the matching tickets**, and lists the tickets (id, status, title) when 10 or fewer match, so one call reaches the leaf. Decided with the user 2026-10-19.
- `V1` **A new label one typo from an existing one is refused** unless `--force`, for labels of 5 letters or more, on `flow new` and `flow edit`. A misspelt label would split a set the way a misspelt case type split a count. Decided with the user 2026-10-19.
- `V1` **Every fault in Flow and every rejected output is a ticket labelled `flow-issue` plus a type label** such as `rework-loop`, found with `flow labels "label:flow-issue"`. It replaces the study cases: `flow cases` was retired 2026-10-19 by `fw-181`, its 14 cases are `fw-182` to `fw-195`, and the code is in `lab/archive/cases/`. Hiding `flow-issue` tickets in other projects, and filing from another project, wait on `fw-111`. Decided with the user 2026-10-19.
- `V1` **A word in the query matches loosely.** Every word must appear in the title, description, id, labels or body, and a word of 5 letters or more may be one typo away: `flow ls "safary"` finds "Safari". Backlog.md's search does this with Fuse.js, which Flow cannot take as a dependency, so `scripts/lib/tickets/search.js` is the small version.
- `V1` **A status move is the command**: `flow start exp-47`, `flow done`, `flow park --reason "<why>"`, `flow todo`. `dropped` has only `flow drop`. `flow done` refuses a parent with open children, and `flow drop` refuses while live dependents exist.
- `V1` **Only a pickup meets the refusals on unmet `deps` and open children**: a move into `in-progress` or `done`. Parking, and a move between `todo` and `parked`, start nothing, so parking a blocked ticket works.
- `V1` **`flow park --label post-v1 --reason "after V1 ships"` parks every open ticket carrying the label**, in one commit. `flow revive --label post-v1` returns each parked one to the status it left. A label no ticket carries changes nothing and prints the labels in use, since labels are free and a typo should show.
- `later` **Colour in `flow`'s output**, only to a terminal and never with `NO_COLOR` set. Moved after V1 by the user 2026-10-04. Labels get a colour when the board ships, chosen by the kind of label for a dark terminal. No list or group sits in the code, and any label can later be given a colour of its own.
- `later` **Box tables around command output.** Parked by the user 2026-10-03: their borders cost the agent tokens each time it reads `flow next`.
- `later` **Wider tests over the ticket commands.** Moved after V1 by the user 2026-10-04.

### What a ticket records about its sessions

- `V1` **`branch:` records the code branch** checked out when the ticket first reaches `in-progress`, written once. `flow <id>` prints `branch: feature/budgets   (checked out here: main)` where they differ, and `/flow:start` stops on that line.
- `V1` **`history.md` gets one line per status move**: `2026-09-29 14:02  todo → in-progress  <session id>  "<title>"  feature/budgets`. In the folder rather than in commit messages, so it travels with `flow move`.
- `V1` **The session id is `CLAUDE_CODE_SESSION_ID`**, and the title is the transcript's `/rename` title, else its generated one.

### Ticket skills

- `V1` **Each open ticket is a skill only the user can start**, `<project>/.claude/skills/exp-47/`, and `~/.claude/skills/home-4/` for home tickets. Typing `/exp` lists each with its status and description, else its title: `/exp-1   Ticket, in-progress: Daemon detection (project)`. A parked ticket gets one too, since typing its words is how it is found. A `done` or `dropped` ticket gets none.
- `V1` **The skill holds a label and one rule.** It runs `flow exp-47` when typed, so a stale skill shows an old row and never old data. The rule: on what exists the files win, and on decisions and what is still open `## State` wins over the rest of the ticket.
- `V1` **`flow <id>` takes an id and nothing else.** `exp-47`, `47` and `exp-47-old-words` all find the ticket. A word that is no command and holds no id is refused, so a mistyped command never reads as a title word. `flow ls <words>` finds a ticket by its words.
- `V1` **A ticket reaches a phase through its own skill alone**: `/flow:execute /exp-47` loads both, the phase first. `/exp-47` alone prints the ticket. A typed id is plain text the agent looks up. Approved by the user 2026-09-30.
- `V1` **The skills stay current**: rewritten after every `flow` command that writes a ticket, and at session start, which reloads the skill list.
- `V1` **A user-only skill's description costs no context**, confirmed with `/context`.
- `never` **Tickets offered in the `@` list**: Claude Code inserts the picked line as a path, so a description would attach nothing.
- `later` **A hook rewriting the skills on a hand edit to `ticket.md`.**
- `later` **The skills rewritten after a pull**, by the background sync and `flow sync`.
- `later` **A `ticketSkills` setting turning the list off.**
- `later` **A hook moving the status before the phase skill loads.**

### Status moves the agent makes

- `V1` **The agent moves the ticket as the work moves, and no skill types a phase command.** It runs `flow start` once it has read the ticket, and `flow done` when its own check passes. A `topic` reaches `done` only on the user's word.
- `V1` **A ticket waiting on the user stays `in-progress`.** The user reopens a `done` ticket in a word, and the agent runs `flow start`.
- `V1` **`/flow:start` moves no ticket.**
- `V1` **A prototype lives in its ticket**, `.flow/tickets/<id>/protos/<name>/`. Inside a project with no ticket, `flow new "<question>"` comes first.
- `later` **2 tickets at once, in 2 sessions**, which needs a second checkout of the code, a git worktree. Flow's settings deny an agent one today. Parked.
- `later` **Resuming after `/clear` with no id typed**: `/flow:handoff` leaves a marker, and the session start loads that ticket. Ruled after V1 by the user 2026-10-01.

## The parts

- **`scripts/lib/tickets/store.js`**: the only code that reads or writes a ticket's folder, every status move included. Fields.
- **`scripts/lib/tickets/statuses.js`**: the status table. Adding a status adds a row, and the row brings its command.
- **`scripts/lib/tickets/graph.js`**: dependencies, what is ready, the tree.
- **`scripts/lib/tickets/rank.js`**: the order of tickets, and the number a move gives.
- **`scripts/lib/tickets/search.js`**: the loose word match behind `flow ls <words>`.
- **`scripts/lib/tickets/records.js`**: the branch `flow`, its checkout, commits, pushes and pulls. **`records-place.js`**: the Flow home as the second place.
- **`scripts/jobs/records-sync.js`**: every send nobody typed.
- **`scripts/lib/tickets/ticket-skills.js`**: writes and deletes the ticket skills.
- **`scripts/lib/tickets/ticket-history.js`**: `history.md` lines.
- **`scripts/commands/tickets.js`**, **`scripts/commands/store.js`**: the commands.

## What passes between them

A ticket skill's `SKILL.md`:

```markdown
---
name: exp-47
description: "Ticket, in-progress: Daemon detection"
disable-model-invocation: true
---
<!-- flow: ticket exp-47, rewritten by flow on every ticket change -->
!`flow exp-47 2>&1 || true`

On what exists, the files win. On decisions and what is still open, `## State` wins over the rest of the ticket.
```

## One real case: working a ticket

1. The user types `/flow:execute /exp-47`. Both skills load, and `flow exp-47` prints the ticket.
2. `/flow:execute` reads the ticket, then runs `flow start exp-47`. `history.md` gains a line with the session id, and `branch: feature/budgets` is recorded. The move commits and pushes in the background.
3. The user approves the plan, and the agent builds it with the ticket still `in-progress`.
4. The context fills. `/flow:handoff` writes `## State`.
5. After `/clear`, the user types `/exp`, picks `/exp-47   Ticket, in-progress: …`, and the next session starts from the state.
6. The tests pass. `flow done exp-47` unblocks `exp-48`, which depended on it, and `flow next` ranks `exp-48` first.

## How it fails

- **Offline, `flow new`** → no ticket, and git's words printed.
- **2 people take one number at once** → the later `flow new` makes no ticket, leaves no trace, and says to run it again.
- **2 machines take one `home-` number at once** → the later `flow new` merges, finds the clash, makes no ticket, and says to run it again.
- **A home ticket made before claims existed clashes** → `flow sync` renumbers it, with `was:`.
- **The same ticket changed on both sides** → the pull is put back, the local version stays committed, and the user merges by hand.
- **A remote refusing the user's pushes** → `flow init` stops before making the branch, and offers `--private`.
- **A typed `/exp-99` for no such ticket** → plain text reaches the phase, and the agent finds no ticket.
- **A ticket pulled by the background sync** → its skill shows the old row until the next command that writes, or the next session.
- **`.flow/` deleted by hand** → the next `flow init` prunes git's stale checkout and checks it out again.

## How you know it worked

- **`npm test` covers the branch, a teammate joining, the refused push, a same-moment clash, `flow store` both ways and `flow move`**, against bare repositories on disk.
- **A project's branch `flow` works against GitHub.** Not yet: run against repositories on disk alone. This repo's own tickets are the first real use.
- **The `Stop` and `SessionEnd` sends run in a live session.** Not yet seen.
- **2 real machines claiming one home number in the same minute, against GitHub.** Not yet: run against repositories on disk alone, `fw-76`.

## What is locked

- **Tickets live on an orphan branch, not with the code.** One checkout for every code branch is what makes ids and statuses agree across branches.
  - Refused: the Flow home as the only place. It is one person's private repository, so a project shared with a teammate could never live there.
  - The risk named: Beads ran a sync branch and deleted it, 5,720 lines of repair, because every issue sat in one file. One folder per ticket is the answer.
- **An id carries its place's word**, so 2 places never produce one id. A letter per place, `g4`, was refused: `t` reads as ticket and `g` does not.
- **`--private` names the Flow home flag**, over `--home`: the one reason to pick it is keeping tickets out of the repository. Set by the user 2026-10-01.
- **One way to name a ticket to a skill: its ticket skill.** Approved by the user 2026-09-30. The skill shows the title and status in the list, which a typed id cannot.
  - Refused: 20 declared arguments so a short instruction expands to nothing. Nobody reading the skill would understand it, and it rests on behavior the docs never promise.
