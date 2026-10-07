# Tickets

How Flow holds a project's work. A ticket is one piece of work: its status, its plan and its history, in one folder. A project's tickets live on an orphan branch `flow`, checked out once at `.flow/`, so every code branch sees the same tickets. The `flow` command creates, moves and ranks them. Each open ticket is also a skill the user types, `/exp-47`, which loads it into a phase.

## Scope

- **In**: the ticket's folder and fields, ids, the 2 places a project's tickets live, sync of tickets, the `flow` ticket and board commands, the ticket skills, the status moves each phase makes, and what a ticket records about its sessions.
- **Out**: `flow init` and the rest of setup, in `docs/spec/setup.md`. What `/flow:handoff` writes into a ticket, in `docs/spec/skills.md`.

## A ticket's life

Each status, and what moves a ticket into it:

```text
   todo                 waiting
     │  /flow:groundwork enters it
     ▼
   groundwork           the questions are still open
     │  /flow:execute enters it, from todo or groundwork
     ▼
   planning             the plan is being written
     │  the user approves the plan
     ▼
   building             the plan is approved, and code starts
     │  every step done, and the tests pass
     ▼
   review               built and checked: a dependent ticket unblocks
     │  the user's word
     ▼
   done

   parked and dropped sit beside the line, each with a reason.
```

## Behaviors

### The ticket

- `V1` **One folder per ticket**, `.flow/tickets/<id>-<words>/`: `ticket.md`, `history.md`, and what its phases write, such as `groundwork/map.md`, `plan.md`, `issues.md`, `reports/` and `protos/<name>/`.
- `V1` **5 types**: `feature`, `issue`, `chore`, `topic`, `prototype`. Every type uses part of the one status order, never a different order.
- `V1` **8 statuses**: `todo`, `groundwork`, `planning`, `building`, `review`, `done`, `parked`, `dropped`. One field says where the work is, since no file says groundwork finished or the plan was approved. Kept by the user 2026-10-01.
- `V1` **`review` or `done` satisfies a dependency.** Built and checked is enough to unblock work on top of it.
- `V1` **3 priorities, `high`, `normal`, `low`, and a parent's priority passes to its children.** A parent cannot be picked up until its children close, so its priority acts only through them.
- `V1` **Frontmatter changes only through `flow`.** A hand edit to the body rides along with the next commit.
- `V1` **No ticket for 3 kinds of work**: a small task asked in chat, a `/flow:research` question, and a subagent's job, which works under the ticket that sent it. Agreed by the user 2026-10-01: the board would fill with 2-minute tickets.

### Ids

- `V1` **An id is a short word and a number**: `exp-47`. The word is `ticketPrefix` in the project's `.flow/settings.json`, 2 to 8 lowercase letters, asked once by `flow init`. The pattern is Backlog.md's, Linear's and Jira's.
- `V1` **Tickets outside any project use `home`**, live in `~/.flow/tickets/`, and their ids work from anywhere: `home-4`.
- `V1` **A number is never given out twice in one place.** `ticket-counter`, beside `version`, holds the highest number the place ever gave out, committed with its tickets. The next number is the higher of the counter and the highest ticket, plus 1. Ruled with the user 2026-10-07: numbering from the tickets on disk freed the number of a ticket deleted, moved away or taken back, and `fw-16` went to a second ticket.
- `V1` **A bare number means the current place's ticket**: `12` inside the expense app is `exp-12`.
- `V1` **`flow move <id> <home|folder>` renumbers into the target**, and the ticket keeps `was: exp-12`, so the old id still finds it. A link to a ticket staying behind refuses the move.

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
- `V1` **`flow new` pushes at once, or makes no ticket.** A refused push pulls, renumbers and tries again, up to 5 times, and the id shows only after the push lands. Offline, no ticket is made, and git's own words are printed. A number shown and then changed would stay wrong in every plan, commit message and conversation that already used it. Decided with the user 2026-09-29.
- `V1` **Tickets in the Flow home get their number on the spot**, and `flow sync` renumbers a clash with `was:`, printing `home-4 is now home-5: another machine took home-4 first.`
- `V1` **A pull meeting the same lines of one ticket changed on both sides is put back**, with the local version committed for a merge by hand.

### The board

- `V1` **`flow next` prints what to work on, ranked**: in flight first, then what could start, then what was set aside. A parent with open children stays out of `in flight`.
- `V1` **`flow tree` shows a split feature whole**: every level, each parent's count of children done, what blocks each ticket, and why one is parked. Kept by the user 2026-10-01.
- `V1` **`flow check` finds cycles, dangling ids, dropped blockers, orphaned parents and unknown statuses.**
- `V1` **`flow ls` lists tickets filtered** by status, type, parent, or not yet filed by `/flow:file-findings`.
- `V1` **A status move is the command**: `flow build exp-47`. `flow done` refuses a parent with open children, and `flow drop` refuses while live dependents exist.
- `later` **Colour in `flow`'s output**, only to a terminal and never with `NO_COLOR` set. Moved after V1 by the user 2026-10-04.
- `later` **Box tables around command output.** Parked by the user 2026-10-03: their borders cost the agent tokens each time it reads `flow next`.
- `later` **Wider tests over the ticket commands.** Moved after V1 by the user 2026-10-04.

### What a ticket records about its sessions

- `V1` **`branch:` records the code branch** checked out when the ticket first reaches `building` or `review`, written once. `flow <id>` prints `branch: feature/budgets   (checked out here: main)` where they differ, and `/flow:start` stops on that line.
- `V1` **`history.md` gets one line per status move and per handoff**: `2026-09-29 14:02  todo → building  <session id>  "<title>"  feature/budgets`. In the folder rather than in commit messages, so it travels with `flow move`.
- `V1` **The session id is `CLAUDE_CODE_SESSION_ID`**, and the title is the transcript's `/rename` title, else its generated one.

### Ticket skills

- `V1` **Each open ticket is a skill only the user can start**, `<project>/.claude/skills/exp-47/`, and `~/.claude/skills/home-4/` for home tickets. Typing `/exp` lists each with its status and title: `/exp-1   Ticket, building: Daemon detection (project)`. A ticket that is `parked`, `done` or `dropped` gets none.
- `V1` **The skill holds a label only.** It runs `flow get exp-47 --files` when typed, so a stale skill shows an old row and never old data.
- `V1` **A ticket reaches a phase through its own skill alone**: `/flow:execute /exp-47` loads both, the phase first. `/exp-47` alone prints the ticket. A typed id is plain text the agent looks up. Approved by the user 2026-09-30.
- `V1` **The skills stay current**: rewritten after every `flow` command that writes a ticket, and at session start, which reloads the skill list.
- `V1` **A user-only skill's description costs no context**, confirmed with `/context`.
- `never` **Tickets offered in the `@` list**: Claude Code inserts the picked line as a path, so a description would attach nothing.
- `later` **A hook rewriting the skills on a hand edit to `ticket.md`.**
- `later` **The skills rewritten after a pull**, by the background sync and `flow sync`.
- `later` **A `ticketSkills` setting turning the list off.**
- `later` **A hook moving the status before the phase skill loads.**

### Status moves the phases make

- `V1` **`/flow:groundwork` enters `groundwork` and never moves a ticket forward.** A finished map points to `/flow:execute`. A `topic` reaches `done` only on the user's word.
- `V1` **`/flow:execute` enters `planning` from `todo` or `groundwork`**, `building` on the user's approval of the plan, `review` when every step is done and the tests pass, and `done` on the user's word.
- `V1` **`/flow:debug` and `/flow:prototype` enter `building`.** `/flow:debug` moves its own ticket to `review` once the failing check passes after the fix, and to `done` once the user confirms.
- `V1` **`/flow:start` moves no ticket.**
- `V1` **A prototype lives in its ticket**, `.flow/tickets/<id>/protos/<name>/`. Inside a project with no ticket, `flow new "<question>" --type prototype` comes first.
- `later` **2 tickets at once, in 2 sessions**, which needs a second checkout of the code, a git worktree. Flow's settings deny an agent one today. Parked.
- `later` **Resuming after `/clear` with no id typed**: `/flow:handoff` leaves a marker, and the session start loads that ticket. Ruled after V1 by the user 2026-10-01.

## The parts

- **`scripts/lib/tickets/store.js`**: the only code that reads or writes a ticket's folder, every status move included. Types, priorities and fields.
- **`scripts/lib/tickets/statuses.js`**: the status table. Adding a status adds a row, and the row brings its command.
- **`scripts/lib/tickets/graph.js`**: ranking, dependencies, priority passed to children.
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
description: "Ticket, building: Daemon detection"
disable-model-invocation: true
---
<!-- flow: ticket exp-47, rewritten by flow on every ticket change -->
!`flow get exp-47 --files 2>&1 || true`
```

The `open` block in a ticket's `## State`, which `flow get --files` reads to load each file named:

````markdown
```open
plan.md
src/parser.js:40-120   # where step 4 stopped
```
````

## One real case: building a ticket

1. The user types `/flow:execute /exp-47`. Both skills load, and `flow get exp-47 --files` prints the ticket and its open files.
2. `/flow:execute` moves it to `planning`. `history.md` gains a line with the session id. The move commits and pushes in the background.
3. The user approves the plan. `flow build exp-47` records `branch: feature/budgets`.
4. The context fills. `/flow:handoff` writes `## State` and runs `flow handoff exp-47`, adding a `history.md` line.
5. After `/clear`, the user types `/exp`, picks `/exp-47   Ticket, building: …`, and the next session starts from the state.
6. The tests pass. `flow review exp-47` unblocks `exp-48`, which depended on it, and `flow next` ranks `exp-48` first.

## How it fails

- **Offline, `flow new`** → no ticket, and git's words printed.
- **2 people take one number at once** → the later push is refused, pulls, renumbers, and shows its id only after it lands.
- **2 machines give out one `home-` number** → `flow sync` renumbers the later one, with `was:`.
- **The same ticket changed on both sides** → the pull is put back, the local version stays committed, and the user merges by hand.
- **A remote refusing the user's pushes** → `flow init` stops before making the branch, and offers `--private`.
- **A typed `/exp-99` for no such ticket** → plain text reaches the phase, and the agent finds no ticket.
- **A ticket pulled by the background sync** → its skill shows the old row until the next command that writes, or the next session.
- **`.flow/` deleted by hand** → the next `flow init` prunes git's stale checkout and checks it out again.

## How you know it worked

- **`npm test` covers the branch, a teammate joining, the refused push, a same-moment clash, `flow store` both ways and `flow move`**, against bare repositories on disk.
- **A project's branch `flow` works against GitHub.** Not yet: run against repositories on disk alone. This repo's own tickets are the first real use.
- **The `Stop` and `SessionEnd` sends run in a live session.** Not yet seen.

## What is locked

- **Tickets live on an orphan branch, not with the code.** One checkout for every code branch is what makes ids and statuses agree across branches.
  - Refused: the Flow home as the only place. It is one person's private repository, so a project shared with a teammate could never live there.
  - The risk named: Beads ran a sync branch and deleted it, 5,720 lines of repair, because every issue sat in one file. One folder per ticket is the answer.
- **An id carries its place's word**, so 2 places never produce one id. A letter per place, `g4`, was refused: `t` reads as ticket and `g` does not.
- **`--private` names the Flow home flag**, over `--home`: the one reason to pick it is keeping tickets out of the repository. Set by the user 2026-10-01.
- **One way to name a ticket to a skill: its ticket skill.** Approved by the user 2026-09-30. The skill shows the title and status in the list, which a typed id cannot.
  - Refused: 20 declared arguments so a short instruction expands to nothing. Nobody reading the skill would understand it, and it rests on behavior the docs never promise.
