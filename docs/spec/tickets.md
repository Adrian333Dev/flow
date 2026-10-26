# Tickets

How Flow holds a project's work. A ticket is one piece of work: its status, its plan and its history, in one folder. A project's tickets live in the Flow home, and `.flow/` in the project is a link to them, so every code branch sees the same tickets. The `flow` command creates, moves and ranks them. Each open ticket is also a skill the user types, `/exp-47`, which loads it into a phase.

## Scope

- **In**: the ticket's folder and fields, ids, where a project's tickets live, sync of tickets, the `flow` ticket and board commands, the ticket skills, the status moves the agent makes, and what a ticket records about its sessions.
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
- `V1` **One folder per ticket**, `.flow/tickets/<id>/`: `ticket.md`, `context.md`, `history.md`, and what the work writes, such as `reports/`, `protos/<name>/` and `jobs/<job>.md`. A ticket made earlier still holds its `groundwork/map.md`, `plan.md` and `issues.md`, until `/flow:upkeep` reads them.
- `V1` **`ticket.md` says what the ticket is for and how you know it is done**, then `## Questions` if the work needs design and `## Tasks` if it needs building. Both lists are optional. `## Questions` nests as deep as the subject needs, and `flow <id>` counts every box at every indent (`scripts/lib/tickets/store.js`). `flow <id>` counts the boxes in each, `questions: 3/7 answered` and `tasks: 2/5 done`, and skips a box inside an HTML comment. `flow new` writes no `map.md`, no `plan.md` and no `issues.md`.
- `V1` **A ticket holds its work in 2 files: `ticket.md`, the index, and `context.md`, the sections** (`fw-204`, the user 2026-10-24, built by `fw-267`). `flow new` writes both, `context.md` holding only `## Loose`. `flow <id>` prints the index and a `context:` line naming the sections, `context: context.md 0, 0.1, Loose`. `ticket.md` holds current truth: what the ticket is for, the `## Questions` tree, each answered line with its one-line answer, each decision in short (what, a one-line why), `## Tasks` and `## References`. No line cap. `context.md` has one `##` section per question handle (`## 1.2`), edited in place: what was decided, found and rejected with reasons, and a pointer to the report holding the detail. A heading that fits no handle goes under `## Loose`, moved when its topic settles. Everything needed to continue after a restart, a clear or a handoff sits in the 2 files, written as each answer locks. Why: one piece of work sat in about 29 files, and decisions filed by subject did not suit groundwork, where many topics move at once.
  - `next` **One test sorts a line into the 2 files, in every phase: who needs it** (`fw-284`, the user 2026-10-25). `ticket.md` holds what anyone resuming needs before doing anything: what it is for, what is decided (short), what is open, the plan, a trap that would bite again. `context.md` holds what one question or task needs while it is worked: the why, the evidence, what was rejected, a dead end's story, implementation detail. Headings in `ticket.md` are optional, `## Decisions` included, for a decision with no question or task to hang on. The shape of both files lives in `references/write-tickets.md`, sent on any touch of a ticket file (`docs/spec/rules.md` `### Guides sent by situation`). Groundwork, execute and handoff point to it, and it takes over `references/workflow.md`'s section list. Why: every rule by phase or by kind broke on a case, and the shape sat in 5 copies that disagreed. Refused: one build section in `context.md`, which grows into the journal refused below.
  - Refused: a journal appended in order and never rewritten (proposed 2026-10-24). A flat log reads as scratch, not context, and a restart would need a marker saying how far the index reflects it.
  - Refused: a line cap on `ticket.md`, 100 proposed.
  - `never` **Decisions moved to `decisions/<subject>.md` once they outgrew `ticket.md`**, past about 300 lines. Replaced 2026-10-24 by `context.md` (`fw-267`): a file per subject did not suit groundwork, where many topics move at once. An older ticket keeps its files, and `flow <id>` still lists them.
- `V1` **A section is written with `Edit` under its heading, and read alone**: `context.md#1.2` in the restart tool's `files`, or one `sed` from the heading to the next.
- `V1` **The agent keeps `## References` in every phase**, from pickup to done: the tools, files and folders the ticket needs, each with a short note where it matters. A restart or a new session starts from them.
- `V1` **One active ticket per session.** In a parent and child pair the child is active, and the parent's index is read for the decisions they share.
- `V1` **Big work is cut into children.** A child names its parent in `parent:`. The parent's `## Tasks` lists its children in build order, one line each that starts with the child's id: `- [ ] fw-127: …`. `flow done` on a child ticks that line, and reopening the child clears it. A parent closes after its last child. `deps` stays for the rare wait outside the family.
- `V1` **Labels are tags**: `labels: [feature, v1]` in the frontmatter, several per ticket, each in lowercase letters, digits and hyphens, 24 characters at most. Flow works in full on a ticket with no label, and nothing in its code reads a label to decide what to do.
- `V1` **`activity:` is the kind of work under way on an in-progress ticket**, one word of 1 to 8 lowercase letters: `design`, `build` or `debug`. The word is open, and `refine` and `ideate` are `design`. `flow start <id> --activity <word>` sets it at pickup, also on a ticket already in progress, so naming the work costs no extra call. `flow edit <id> --activity <word>` changes it by hand, and an empty value clears it. Any status move clears it, and a ticket that is not in progress refuses it. Only `/flow:groundwork` (`design`), `/flow:execute` (`build`) and `/flow:debug` (`debug`) set it. No skill switches it mid-work: `proto` and `research` were dropped on 2026-10-18 because each switch and its reset cost 2 calls, for words that seldom apply. The agent may still set any word by hand. `flow <id>` prints an `activity:` line while one is set. The band (`fw-137`) shows it in capitals and reads it before any word derived from the ticket. Decided with the user 2026-10-18.
- `V1` **Flow suggests 9 labels**: `feature`, `bug`, `chore`, `docs`, `refactor`, `research`, `topic`, `new-project` and `urgent`. They are named in docs and skills only. No list sits in the code, and every label is free, such as `v1`, `post-v1` or `security`. `new-project` marks a whole project brainstormed from scratch. Not suggested, on purpose: `wontfix`, `duplicate`, `invalid` (that is `dropped` with a reason), `blocked` (that is `deps`), `question` (that is a `topic`), `idea` (a note holds a raw idea, and `parked` holds put-off work), `epic` (children already show a big parent), and `enhancement`, `help wanted`, `good first issue`.
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
- `V1` **A ticket's files hold no prefix.** The folder is `.flow/tickets/<n>/`, and `id`, `parent` and `deps` are bare numbers, or `word-n` for a ticket of another project. The prefix lives in `ticketPrefix` alone, so changing it renames every id with no file touched. Prose that mentions an id (`fw-16` in a doc or a ticket body) stays as written. A parent's `## Tasks` line for a child is matched by the child's number and ignores the word, so a rename keeps its tick. Decided with the user 2026-10-19 (`fw-111` 1.2, built in `fw-208`).
- `V1` **A clashing prefix is one edit, with no rename command.** The first project registered keeps a prefix; a clone that claims the same one works inside its own folder, stays unregistered, and `flow doctor` names the clash and the setting to change. Changing `ticketPrefix` moves the project's registry line on its next ticket write, and the old prefix stops routing. `scripts/tests/projects.test.js` walks making, routing, listing and renaming a prefix across 2 projects and home.
- `V1` **Tickets outside any project use `home`**, live in `~/.flow/tickets/`, and their ids work from anywhere: `home-4`.
- `V1` **A project's id works from any folder, through the registry.** `locate()` reads the id's word: `home` goes home, the word of the project you stand in (or no word) is that project, and any other word is looked up in `registry.json`. The folder you stand in wins, so a clash never changes what a project sees of itself. An unknown prefix fails naming `flow doctor` and saying a project registers by its first ticket write. A registered folder with no `.flow/` or another `ticketPrefix` is refused with the cause. Decided with the user 2026-10-19 (`fw-111` 0.0, 2.0).
- `V1` **Outside a project a read shows the home place and a write refuses.** `flow ls` and `flow next` show the tickets in `~/.flow/tickets`, under the header `home  ~/.flow`, and create nothing. `flow new`, `flow note` and a status move on a bare number refuse, naming `flow init` here and `--project home`. An id that names its place (`home-4`, `bee-1`) needs no project, so it works and prints no header. Decided with the user 2026-10-19 (`fw-111` 2.1).
- `V1` **Every `ls` and `next` list begins with one header line**: `fw  ~/code/flow-dev`, the prefix and the project's folder, with `~` for the home folder. It is the same inside a project, with `-p`, and in a folder that is no project (`home  ~/.flow`). It replaced `outside a project: showing ~/.flow/tickets`, which read as unclear. The user asked for one structure everywhere, 2026-10-20, and `fw-212` built it. `flow <id>` prints no header, since its id names the place.
- `V1` **`--project <prefix>`, short `-p`, reaches another project on `new`, `ls`, `next` and `note`.** One resolver, `projectNamed`, reads it: `home`, the prefix of the project you stand in, or a registered prefix. A command with an id reads the project from the id and takes no flag. `global`, `all` and a folder are refused, a folder with the prefix the registry holds for it. Short flags are a `short:` property of a value flag in `parseArgs`; `-p` is the only one so far (`fw-149` rule 6 assigns the rest). Decided with the user 2026-10-19 (`fw-111` 2.0, built in `fw-211`).
- `V1` **`home`, `global`, `all` and `here` are no prefix.** `flow init` refuses them and `offerWord` steps round them: a folder named `global` is offered `glo`, `home` is offered `hom`, `all` is offered `flow`. Merges `fw-163`.
- `V1` **A note names its project by prefix, `home` for the Flow home.** `project: shop` in its header, never the folder name, and `global` is gone. `--project` on a note needs a prefix registered on this machine, as a typo guard. A `project:` query term checks the prefix's shape alone, since notes travel between machines and the registry does not. Notes filed before this carried the folder name or `global`; `lab/scripts/convert-notes.js` rewrote them once on the main machine, and a note on another machine meets it by running the script there. There is no read-time shim for the old words.
- `V1` **A number is never given out twice in one place.** `ticket-counter`, beside `version`, holds the highest number the place ever gave out, committed with its tickets. The next number is the higher of the counter and the highest ticket, plus 1. Ruled with the user 2026-10-07: numbering from the tickets on disk freed the number of a ticket deleted, moved away or taken back, and `fw-16` went to a second ticket.
- `V1` **A bare number means the current place's ticket**: `12` inside the expense app is `exp-12`.
- `V1` **A typed name is read by its id alone.** `exp-47-old-words` finds `exp-47` after any rename. A title word that matches one ticket finds it too. A ticket made before the title moved out of the folder keeps its old folder name, and the same lookup finds it.
- `V1` **`flow move <id> <home|prefix>` renumbers into the target**, and the ticket keeps `was: exp-12`, so the old id still finds it, from any project that routes the old prefix. The destination is a prefix looked up in the registry; a folder is refused with a message naming the prefix. A link to a ticket staying behind refuses the move.

### Where a project's tickets live

- `V1` **In the Flow home.** `.flow/` in the project is a link to `~/.flow/projects/<name>/`, made by `flow init` and hidden by `.git/info/exclude`, so the code's history never holds a ticket. `flow sync` carries the folder. The folder's `settings.json` holds the repository's address, so `flow init` in another clone finds it. Ruled 2026-09-29: a `.flow/` committed with the code gave each branch its own copy, so 2 branches invented one number, and a status moved on one branch stayed old on the other.
- `V1` **An older project keeps working.** A `.flow/` that is a checkout of the branch `flow`, or a plain folder, is still read. No command makes either, and `flow init` makes the link alone.
- `V1` **Tickets cannot conflict across code branches**, since every branch shares one checkout. 2 people conflict only on the same ticket, since each ticket is its own folder.
- `never` **A place on one machine alone**, built and removed 2026-10-01: the user ruled the case not worth a flag in V1.
- `never` **Flow's project rules kept in the Flow home, loaded through `CLAUDE.local.md`**: machinery for an isolation V1 does not need.

### Sync

- `V1` **Every command writing a ticket commits**, the whole folder, so the user's hand edits ride along.
- `V1` **A push follows a status move or a drop, in the background**, and after a reply once 30 minutes have passed with something changed, and at session end. The user asked for more than session end, and at most every half hour.
- `V1` **A pull runs at session start, in the background, and right before a new ticket takes its number.**
- `V1` **`flow new` pushes at once, or makes no ticket.** Offline, no ticket is made, and git's own words are printed. A number shown and then changed would stay wrong in every plan, commit message and conversation that already used it. Decided with the user 2026-09-29.
- `V1` **2 machines taking one number: the later `flow new` makes no ticket**, prints `no ticket was made: another machine took exp-5 first. Run it again.`, and leaves no trace. The retry takes the next number. Both folders are now `exp-5`, so the 2 tickets meet on the same file, and git cannot tell them apart or renumber one. A rebase replays every commit, so a ticket made and later removed would stop each later pull.
- `V1` **The Flow home claims a number the same way**, for a home ticket and a project's. `flow new` runs `flow sync` on `~/.flow/` before taking the number. Then it commits every changed file there, merges, and pushes before the id shows. Offline, or on a clash in another file, no ticket is made. Decided with the user 2026-10-07: a number taken on the spot was renumbered at the next sync, mostly in the background, and the new id printed nowhere. Every changed file goes up, not the ticket alone, since git refuses to merge in the other machine's work over an uncommitted file it changed.
- `V1` **`flow sync` still renumbers a clash in the Flow home, keeping `was:`**, and prints `home-4 is now home-5: another machine took home-4 first.` Only a ticket made before claims existed, or while the Flow home had no remote, meets it. A Flow home with no remote numbers on the spot.
- `V1` **A pull meeting the same lines of one ticket changed on both sides is put back**, with the local version committed for a merge by hand.

### The board

- `V1` **`flow next` prints what to work on, in rank order**: in flight first, then what could start, then what was set aside. A parent with open children stays out of `in flight`. The tables show a `LABELS` column.
- `V1` **`flow tree` shows a split feature whole**: every level, each parent's count of children done, and what blocks each ticket. Parked tickets show, with their reason, under `--all` only. Kept by the user 2026-10-01, parked rows cut 2026-10-19.
- `next` **`flow next` and `flow ls` print children under their parent, to any depth; `flow tree` goes** (`fw-234`, decided by the user 2026-10-20). A ticket sits under its parent with the parent visible and its count, `26/35` (done of total), the same short form as the band. `--flat` gives the plain table. Everything `tree` did has a counterpart in `ls`: `--all` is `status:all`, `--parent <id>` is `parent:<id>`.
- `next` **Every `flow` command but `install`, `update`, `init` and `sync` takes `--json`** (`fw-234`). Lists are flat, in display order, one record per ticket with `parent` and `depth`. The mod and the hooks read the commands, so one parser stays in `scripts/`.
- `next` **A label with a card is a group** (`fw-235`, decided by the user 2026-10-21). The card is `.flow/groups/<label>.md` with `title`, `rank`, `parked:` (the reason, once) and optionally `group_by: label`; membership is carrying the label. Groups are made on purpose, never automatically, and do not nest. A ticket is placed once, under its highest-ranked active group. Any parked group holds a ticket: the stored `status` stays, the one ticket loader computes the effective status, and `flow <id>` prints `todo (held by post-v1)`. Refused: a labels file, a field on the ticket, parent tickets as groups (`v1` and `post-v1` cut across parents, and `seo` gets new tickets after it looks finished).
- `V1` **`flow check` finds cycles, dangling ids, dropped blockers, orphaned parents, unknown statuses, and a ticket with no title or description.**
- `V1` **A one-time script converts the old tickets**, `lab/scripts/convert-tickets.js`, never a `flow` command, archived to `lab/archive/` after its real run. It rewrites only the frontmatter of each `ticket.md`: the old `title` becomes the `description`, the new `title` is the folder's words, `type` becomes a label, the old statuses become `in-progress`, and `priority` goes. A live `priority: high` ticket takes a `rank` among its siblings, so it keeps its place ahead of the unranked ones. Every other priority just goes. Maps, plans, reports, prototypes and folder names are not touched, and a second run changes nothing. Decided with the user 2026-10-14: a harvest into new tickets would break every id and link, for what a frontmatter rewrite does at no loss. A script, since no one but the user holds old-shape tickets.
- `V1` **`flow ls "<query>"` takes one quoted query**, the grammar `flow notes` reads (`scripts/lib/query.js`). Fields: `label`, `status`, `parent`, `filed` (`filed:no` is a closed ticket `/flow:upkeep` has not filed) and words. A comma inside a value means either, a repeated field means both: `"label:flow-issue label:rework-loop"`. Rank order. The flags `--status`, `--label`, `--parent` and `--unfiled` are gone, with no migration. Decided with the user 2026-10-19: one grammar for notes and tickets, and drilling down is label intersection, so no label has to sit in one place of a tree.
- `V1` **`flow ls` hides parked, done and dropped tickets unless the query names a `status:` term.** `status:all` shows every status, as `project:all` does in notes, and the count line says how many are hidden. `flow next` and `flow tree` keep their `--all` flags. Decided with the user 2026-10-19.
- `V1` **`flow next` is small: name and labels per ticket, parked as a count, and a `take:` line.** Every session opens on it and pays for each line in context. A section holds 3 (continuing) or 5 (ready) rows, then says how many it left out. `take:` is the first continuing or ready ticket, never one in flight. Decided with the user 2026-10-19.
- `V1` **`flow labels "<query>"` counts the other labels on the matching tickets**, and lists the tickets (id, status, title) when 10 or fewer match, so one call reaches the leaf. Decided with the user 2026-10-19.
- `V1` **A new label one typo from an existing one is refused** unless `--force`, for labels of 5 letters or more, on `flow new` and `flow edit`. A misspelt label would split a set the way a misspelt case type split a count. Decided with the user 2026-10-19.
- `V1` **Every fault in Flow and every rejected output is a ticket labelled `flow-issue` plus a type label** such as `rework-loop`, found with `flow labels "label:flow-issue"`. It replaces the study cases: `flow cases` was retired 2026-10-19 by `fw-181`, its 14 cases are `fw-182` to `fw-195`, and the code is in `lab/archive/cases/`. A query with a `label:flow-issue` term, in `flow ls` and `flow labels`, reads every registered project and `home`. `flow ls` prints one group per project (header, table, `no tickets.` where none match), the project you stand in first and `home` last, then one count line. `flow labels` stays merged, one count line and one flat list with prefixed ids, since the repeat check needs counts across projects. `-p` limits either to one project, and a registered path that is gone is skipped. Every other query reads the current project. Hiding `flow-issue` tickets in other projects is not built (`hideLabels` is the one-line fix). Decided with the user 2026-10-19, built in `fw-212`.
- `V1` **A word in the query matches loosely.** Every word must appear in the title, description, id, labels or body, and a word of 5 letters or more may be one typo away: `flow ls "safary"` finds "Safari". Backlog.md's search does this with Fuse.js, which Flow did not take as a dependency at the time (the no-dependencies rule was dropped by the user 2026-10-21), so `scripts/lib/tickets/search.js` is the small version.
- `V1` **A status move is the command**: `flow start exp-47`, `flow done`, `flow park --reason "<why>"`, `flow todo`. `dropped` has only `flow drop`. `flow done` refuses a parent with open children, and `flow drop` refuses while live dependents exist.
- `next` **A ticket closes through `/flow:file`, which sends its lessons out**: facts to findings, ideas to notes, decisions to the spec, corrections to the rule they break. It only adds files and lines, so the agent runs it itself, at done, park and drop alike, since many tickets never reach done. It ends with `flow file <id>`, which sets `filed`. `flow done`, `flow park` and `flow drop` refuse a ticket with no `filed` stamp, `--force` overriding. A delete after a merge is exempt, since its content was copied. What stays in `context.md` archives with the ticket. Decided 2026-10-24 (`fw-204`): a closing step the agent can skip is a step that does not fire.
- `next` **A merge is the agent's work, then a real delete.** Merges happen early, before groundwork or while only one ticket has started. The agent reads both, copies each section of the source under the target's matching handle or into `## Loose`, then deletes the source ticket, not `flow drop`. The delete is its own ticket: a ticket with a decision or a design is never deleted.
- `next` **`flow new` shows the closest tickets and makes none on a near-duplicate**, `--force` overriding, with the ranking `flow findings new` uses (`docs/spec/knowledge-base.md`). `flow ls` ANDs every word, so the check ranks by shared words and rare labels instead. The drifted `flow-issue` types are renamed once (`rework-loop`, `unverified-claim`, `stale-source-used`, `sync-skipped`, `wrong-tool`). A child ticket of `fw-204`.
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
- `V1` **The skill holds a label and one rule.** It runs `flow exp-47` when typed, so a stale skill shows an old row and never old data. The rule: on what exists the files win, and on decisions and what is still open `ticket.md` wins over `context.md`.
- `V1` **`flow <id>` takes an id and nothing else.** `exp-47`, `47` and `exp-47-old-words` all find the ticket. A word that is no command and holds no id is refused, so a mistyped command never reads as a title word. `flow ls <words>` finds a ticket by its words.
- `V1` **A ticket reaches a phase through its own skill alone**: `/flow:execute /exp-47` loads both, the phase first. `/exp-47` alone prints the ticket. A typed id is plain text the agent looks up. Approved by the user 2026-09-30.
- `V1` **The skills stay current**: rewritten after every `flow` command that writes a ticket, and at session start, which reloads the skill list.
- `V1` **A user-only skill's description costs no context**, confirmed with `/context`.
- `never` **Tickets offered in the `@` list**: Claude Code inserts the picked line as a path, so a description would attach nothing.
- `next` **The ticket header (next line) also carries the wiki folders this ticket, its parent and its children used most** (`fw-204`), from their `usage.json` counters (`docs/spec/knowledge-base.md`). The same hook attaches a wiki folder's findings when its `index.md` is read. Agents stop running `flow <id>`, since the header hands them the ticket; the command stays as the hook's data source, `flow <id> --json`.
- `next` **A `#` ticket list replaces the `/fw-NN` skills** (`fw-236`, decided by the user 2026-10-21). Typing `#fw-17` lists open tickets by id, title and label, as `#` lists notes. A picked row writes an `@` mention of `ticket.md`, and a hook on that mention attaches a short generated header: effective status, activity, labels, parent and children progress, waits-on and blocks, open questions. A Read of a `ticket.md` gets the same header through the hook's model-only `context`, fenced and never part of the file text. It attaches once per ticket per session for each agent, again when its text changes, and after a compaction or a restart. This turns the `never` above around: the mention hook, not the list row, carries the facts. The ticket-skill generator and its skill folders are archived to `lab/archive/`, not deleted.
- `later` **A hook rewriting the skills on a hand edit to `ticket.md`.**
- `later` **The skills rewritten after a pull**, by the background sync and `flow sync`.
- `later` **A `ticketSkills` setting turning the list off.**
- `later` **A hook moving the status before the phase skill loads.**

### Status moves the agent makes

- `V1` **The agent moves the ticket as the work moves, and no skill types a phase command.** It runs `flow start` once it has read the ticket, and `flow done` when its own check passes. A `topic` reaches `done` only on the user's word.
- `V1` **A ticket waiting on the user stays `in-progress`.** The user reopens a `done` ticket in a word, and the agent runs `flow start`.
- `V1` **`/flow:start` moves no ticket.**
- `V1` **A prototype lives in its ticket**, `.flow/tickets/<id>/protos/<name>/`. Inside a project with no ticket, `flow new "<question>"` comes first.
- `next` **Every prototype in the general sense lives in `protos/`: code, drawings and mockups** (`fw-204`, 2026-10-20). Output a script can reproduce goes to the gitignored `tmp/`, since `.flow` syncs between machines and heavy output would travel with every sync. A drawing that outlives the ticket is promoted into the spec before the ticket archives. The line sending drawings to `.flow/research/<topic>/` (repo `CLAUDE.md`, `scratch-in-tmp`) and groundwork's "no ticket: scratch in `tmp/`" change with it.
- `later` **2 tickets at once, in 2 sessions**, which needs a second checkout of the code, a git worktree. Flow's settings deny an agent one today. Parked.
- `never` **2 sessions on one ticket at once**: a decision changed in one would have to reach the other (the user, 2026-10-24). Two children editing their parent's `ticket.md` is the one overlap, covered by `Edit` matching the file's current text.
- `later` **Resuming after `/clear` with no id typed**: `/flow:handoff` leaves a marker, and the session start loads that ticket. Ruled after V1 by the user 2026-10-01.

## The parts

- **`scripts/lib/tickets/store.js`**: the only code that reads or writes a ticket's folder, every status move included. Fields.
- **`scripts/lib/tickets/statuses.js`**: the status table. Adding a status adds a row, and the row brings its command.
- **`scripts/lib/tickets/graph.js`**: dependencies, what is ready, the tree.
- **`scripts/lib/tickets/rank.js`**: the order of tickets, and the number a move gives.
- **`scripts/lib/tickets/search.js`**: the loose word match behind `flow ls <words>`.
- **`scripts/lib/tickets/records.js`**: commits, pushes and pulls of a project's tickets, and the checkout of the older branch `flow` that a project may still have. **`records-place.js`**: the Flow home, where every new project's tickets live.
- **`scripts/jobs/records-sync.js`**: every send nobody typed.
- **`scripts/lib/tickets/ticket-skills.js`**: writes and deletes the ticket skills.
- **`scripts/lib/tickets/ticket-history.js`**: `history.md` lines.
- **`scripts/commands/tickets.js`**, **`scripts/commands/board.js`**: the commands.

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

On what exists, the files win. On decisions and what is still open, `ticket.md` wins over `context.md`.
```

## One real case: working a ticket

1. The user types `/flow:execute /exp-47`. Both skills load, and `flow exp-47` prints the ticket.
2. `/flow:execute` reads the ticket, then runs `flow start exp-47`. `history.md` gains a line with the session id, and `branch: feature/budgets` is recorded. The move commits and pushes in the background.
3. The user approves the plan, and the agent builds it with the ticket still `in-progress`. Each task ticks in `## Tasks`, and a trap hit gets its section in `context.md`.
4. The context fills, and the agent restarts the window.
5. After `/clear`, the user types `/exp`, picks `/exp-47   Ticket, in-progress: …`, and the next session starts from `ticket.md` and the sections it names.
6. The tests pass. `flow done exp-47` unblocks `exp-48`, which depended on it, and `flow next` ranks `exp-48` first.

## How it fails

- **Offline, `flow new`** → no ticket, and git's words printed.
- **2 people take one number at once** → the later `flow new` makes no ticket, leaves no trace, and says to run it again.
- **2 machines take one `home-` number at once** → the later `flow new` merges, finds the clash, makes no ticket, and says to run it again.
- **A home ticket made before claims existed clashes** → `flow sync` renumbers it, with `was:`.
- **The same ticket changed on both sides** → the pull is put back, the local version stays committed, and the user merges by hand.
- **A typed `/exp-99` for no such ticket** → plain text reaches the phase, and the agent finds no ticket.
- **A ticket pulled by the background sync** → its skill shows the old row until the next command that writes, or the next session.
- **`.flow/` deleted by hand** → the next `flow init` links it again. The tickets sit in the Flow home and are untouched.

## How you know it worked

- **`npm test` covers the ticket commands, a same-moment clash and `flow move`**, against bare repositories on disk.
- **The `Stop` and `SessionEnd` sends run in a live session.** Not yet seen.
- **2 real machines claiming one home number in the same minute, against GitHub.** Not yet: run against repositories on disk alone, `fw-76`.

## What is locked

- **Tickets live in the Flow home, not with the code.** One folder for every code branch is what makes ids and statuses agree across branches.
  - Refused: a branch of the project's repository (`lab/archive/branch-storage/`). Its one gain was that a teammate who could read the project could read its tickets, and Flow is a personal workflow.
  - The risk named: Beads ran a sync branch and deleted it, 5,720 lines of repair, because every issue sat in one file. One folder per ticket is the answer.
- **An id carries its place's word**, so 2 places never produce one id. A letter per place, `g4`, was refused: `t` reads as ticket and `g` does not.
- **One way to name a ticket to a skill: its ticket skill.** Approved by the user 2026-09-30. The skill shows the title and status in the list, which a typed id cannot.
  - Refused: 20 declared arguments so a short instruction expands to nothing. Nobody reading the skill would understand it, and it rests on behavior the docs never promise.
