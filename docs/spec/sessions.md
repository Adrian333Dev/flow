# Sessions

How Flow holds a session's own state, beside tickets. A Flow session is one Claude Code session id. Its folder holds what the session is discussing and doing now, written by the agent, and a record of everything that happened in it, written by the mod and `flow`. Topics are discussed and settled in the session, and tickets come out of it once a topic settles. The band above the prompt draws what is in hand from the record. Designed in `fw-321` (2026-10-28 and 29), whose `context.md` holds the reasoning behind each line.

## Scope

- **In**: the session folder and its files, the record and its events, who writes each, the `flow sessions` commands, naming, the band, what loads into a window, the line between a session and a ticket, wrap-up, storage and masking.
- **Out**: the board, designed in `fw-242`. Syncing sessions to a second machine, which waits for that machine (`fw-6`, `fw-158`). The ticket's own shape, in `docs/spec/tickets.md`. How the restart builds a window, in `docs/spec/product.md` `### Hooks and guardrails`.

## Why sessions exist

Before sessions, every piece of state lived in a ticket. A ticket was made before its subject was understood, so discussion split, merged, moved and renamed tickets again and again. A run of tickets needed a wrapper ticket (`fw-316`). An idea raised mid-discussion became a ticket and left the conversation. What the agent worked out over several steps was lost at a restart. The band showed nothing when the agent forgot `flow tickets start`.

## The folder

```text
~/.flow/sessions/<session id>/
├─ session.md            live state: Agenda, Now, Waiting on the user, Loose, then the agent's own
├─ record.jsonl          every event, one JSON line each: the mod's and flow's
├─ changes/              subagent change records
├─ topics/<topic>/
│  ├─ topic.md           ## Questions, then one section per question
│  └─ <any file>         this topic's reports, drawings, prototypes
└─ <any file>            scratch, opening with a description line
```

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     MOD      │     │     flow     │     │    AGENT     │
│              │     │              │     │              │
│  sees every  │     │ runs ticket  │     │ judges what  │
│  tool call   │     │  commands    │     │ is in flight │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │ all events         │ ticket events      │ edits
       │                    │                    │
       ▼                    ▼                    ▼
┌───────────────────────────────────┐     ┌──────────────┐
│           record.jsonl            │     │  session.md  │
│                                   │     │   topics/    │
└───────────────────────────────────┘     └──────────────┘
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
                  flow sessions get <id> [--json]
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
               the band        the board       the agent
```

## Behaviors

### What a session is

- `V1` **A Flow session is one Claude Code session id**, its folder `~/.flow/sessions/<id>/`. A restart, `/fresh` and a resume keep it, so a session lives for weeks over many topics and tickets. `/clear` starts a new session, and the old one stays open. Why: one root file can hold the whole context only if one session writes it (2026-10-28).
  - Refused: a workstream of several Claude Code sessions sharing one state. Shared state needs files split by fixed role and a joining step a session can miss.
- `V1` **Topics live in the session, and a ticket is made once a topic settles.** Why: a draft ticket per topic would be a second home for each topic, and a numbered file for every passing idea (2026-10-28).
- `V1` **The mod records every session from its first event, with no registration.** The folder exists from `session.start`. `session.md` waits for the agent's first live state, so a quick question leaves the record alone. Why: nothing is missed when nobody remembers to register (2026-10-29).
- `V1` **A session ends only when the user asks it to wrap up.** `/clear` and exit end nothing, since the old Claude Code session can still be opened.
- `V1` **One item in hand at a time, any number on the agenda.** The item in hand is the one picked up last. A change maps to the ticket picked up last before it. A child is the item in hand while its parent's `ticket.md` stays readable. 2 tickets at once are 2 sessions. This replaces "one active ticket per session" (`docs/spec/tickets.md`). Why: the agenda and the pickup events do both jobs the old rule did (2026-10-28). Overturned if one session builds 2 tickets interleaved edit by edit.

### The files

- `V1` **Each kind of information has one home, by how long it lives and who writes it.** Lasting decisions go to the ticket, then the spec. Lasting facts go to findings, the wiki and the rules. Live state, written by the agent's judgment, goes to `session.md`. What happened goes to `record.jsonl`, written by the mod and `flow` alone. Artifacts go in any file beside them. Why: in `fw-16`, `fw-172`, `fw-204` and `fw-242`, hand-kept state and copies drifted in every big redesign (2026-10-28, `fw-321` `reports/session-needs-*.md`).
  - Refused: files cut by fixed role (a queue, a findings file, a page per topic). Their roles get redesigned over and over.
  - Refused: a root file with fixed sections for everything (Focus, Topics, Learned, Files, Next). Not everything belongs in the root.
- `V1` **`session.md` holds only what is true now**, in 4 base sections, then any the agent adds. An empty section is left out.
  - `## Agenda`: a checklist in plan order, one line per topic or ticket. `- [ ] <name>: <one line>` open, `- [~] <name>: … (set aside: <why>)`. A line naming a ticket built in another session ends `(building: <session name>)`.
  - `## Now`: the item in hand and the next step, rewritten in place.
  - `## Waiting on the user`: each proposal or question sent and not yet answered, deleted once answered.
  - `## Loose`: chores found, a warning that holds until an event, a permission given. Each line leaves when done.
- `V1` **A settled agenda line leaves `## Agenda`.** The record keeps `topic.settled` with where it went. Why: the root holds only what is true now, so a session open for weeks carries only its open and set-aside lines (2026-10-28).
- `V1` **A topic is a folder, `topics/<topic>/`**, with `topic.md` and the topic's artifacts beside it. `topic.md` opens with `## Questions` in `/flow:groundwork`'s checklist format, then one `##` section per question. Groundwork on an existing ticket opens a topic too. `topic.md` stays once its tickets are made, and each ticket names it in `## References`.
- `V1` **Every other file in the folder opens with a `description:` line.**
- `V1` **The folder's index is never stored.** When `session.md` enters a window, by a read, a restart or `/fresh`, the mod adds one line per file in the folder beside it: its path, then its description. Why: a file already in the context does not change when something rewrites it on disk, so a stored copy stays stale until the next read anyway (2026-10-28).
  - Refused: a block in `session.md` the mod rewrites after each write, costing a write per change. Refused: a separate `index.md`, a second file to remember.
- `V1` **Nothing deletes a file in the folder automatically.** A file set aside stays until wrap-up sorts it.

### The record

- `V1` **One `record.jsonl` per session, one envelope per line**: `v` (the format version), `at`, `event` (`noun.verb`), `by` (`main`, a subagent's id, `user`, `mod`), `call` (the `tool_use_id` where a tool call caused it), `data` (owned by the event). No ticket field: a line maps to a ticket when read, from the item picked up at that moment. Why: a new event is a new name, never a new format, and one file needs no join by time (2026-10-28, after festival: `.flow/research/agent-event-records/how-festival-records-agent-work.md`).
  - Refused: 3 files by kind, as festival keeps them. Every reader would join them by time.
  - Refused: a restart starting a new record. A restart is a `session.restarted` line.

  ```json
  {"v":1,"at":"2026-10-28T14:02:11Z","event":"file.changed","by":"main","call":"toolu_01Hx…","data":{"tool":"Edit","path":".flow/tickets/321/context.md","added":9,"removed":2}}
  {"v":1,"at":"2026-10-28T14:03:40Z","event":"command.ran","by":"a75ae5fd","call":"toolu_01Ab…","data":{"command":"pnpm test","ok":false,"changed":[]}}
  {"v":1,"at":"2026-10-28T14:05:02Z","event":"topic.raised","by":"main","data":{"topic":"event-driven actions"}}
  ```

- `V1` **The events, and who writes each:**
  - The mod, from what it sees: `session.started`, `.resumed`, `.restarted`, `.fresh`, `.compacted`, `.wrapped`; `model.changed`; `message.sent`, `reply.finished`, `user.awaited`; one line per tool call by type, `file.read`, `search.ran`, `file.changed`, `command.ran`; `subagent.started`, `.ended`; `ticket.picked`.
  - The mod, from the agent's edits to `## Agenda`: `topic.raised`, `.set-aside`, `.settled`.
  - `flow`, as it runs each ticket command: `ticket.created`, `.started`, `.done`, `.parked`, `.dropped`, `.renamed`. A shell command sees `$CLAUDE_CODE_SESSION_ID`, so `flow` knows which record to append to.
  - The agent, by `flow event <name>`, for what nothing else sees. Never the only source of an event that matters.
  - Why: the program that acts writes the event, as festival's command line does, so nothing waits on the agent remembering a command (2026-10-28). Refused: the mod parsing `flow tickets` calls from their text.
- `V1` **Every tool call gets a line, reads and searches included.** A reader filters by type. Why: a search is often a `Bash` call (`grep`, `rg`), so no line between reads and commands can be drawn by tool (2026-10-28). A line points to its call in the transcript by `call`, never copies the output.
- `V1` **An item comes into hand only by a pickup**: a phase skill invoked on it, an edit in its ticket folder, an edit of its topic file. A read never picks up, since the agent reads other tickets for reference. A wrong pick shows in the tool result's line, and the agent corrects it by picking up the right item. Refused: lighting on a read, the fault `fw-179` was opened for (2026-10-29).
- `V1` **One line in the tool result when the item in hand changes**, never on progress. Why: the agent knows what the band now names, at the cost of one line.
- `V1` **Every count is computed from the record and the counted files when read, never stored.** The band's saved badges (`mods/flow-session/features/band/record.ts`) go.
- `V1` **Listeners on an event run actions**, and new events are added on demand. Why: today's starts, ends and counts cannot be defined or computed, and the band waits on the agent's `flow tickets start` (2026-10-28).

### Reading a session

- `V1` **One reader: `flow sessions get <id> [--json]`** folds the record with the counted files (`## Agenda`, each `topic.md`, each ticket) into the session's state: the tree of lists in plan order, each item's state and count, the item in hand. The band runs it on each event that changes the state, keeping only the spinner's item in memory. The board, the agent and `/flow:audit` read the same command or the same record. Why: one computation never drifts (2026-10-29). Refused: each reader folding the file itself.
- `V1` **`flow sessions` lists the sessions with their open agenda lines.** `flow sessions new` starts a session, needing no name. `flow sessions open <id|name>` resumes one, listing the matches with their ids when a name repeats.
- `V1` **A session is called by a number counting this machine's sessions plus an optional name**: `S14 · Oct 29` until named, then `S14 Session redesign`. The name is Claude Code's own (`-n`, `/rename`), its generated title filling it until someone sets one. Commands and tickets cite the number. Why: a name changes and repeats, a short number stays typeable (2026-10-29). Open: numbers collide once a second machine syncs (`fw-6`, `fw-158`).
- `V1` **A ticket names the session it came from**: `flow tickets new` writes `session: <id>` into the frontmatter. Every other session that worked a ticket is found from the records, since `flow` writes each ticket event into the acting session's record. `flow tickets get <id>` prints them.

### The band

- `V1` **The band shows what is happening now, as if no board existed**, and nothing when nothing is in hand. No session name, no Restart button, no issue count. Decided 2026-10-29 (`fw-321` `band-variants.md` J, drawn by `protos/band/band.mjs`).

  ```text
  1/3   ● FW-315_BATCH_RUNS 1/4   ○ Storage 0/3
        └─ ● FW-319_DISPATCH_EACH_TICKET 24/34 ⠹   ○ FW-320_MERGE_WORKTREES 0/6
  ```

- `V1` **A row is one list in plan order, read as time**: what is in progress (one or more), then what comes next, `+N` for the rest. Done items leave the row, and the list's count holds them. A child list hangs under its parent with `└─`. The agenda's count leads the top row, with no label, only from 2 items.
- `V1` **Each item: a mark, its name, its count.** Marks: `○` not started, `●` in progress, `✓` done, `✗` failing or debugged. The band's braille spinner sits on the item the agent acts on now, set from events, never merely while a turn runs.
- `V1` **Colour says the kind, case says what the text is.** Ticket names `#79c0ff`, topic names `#d2a8ff`, waiting names `#8b949e`. State colours (grey, yellow `#ffb703`, green, red) go on marks, counts and the spinner alone. A ticket is UPPERCASE, id and title joined by `_` (`FW-319_DISPATCH_EACH_TICKET`). A topic is its title with the first word capitalised, no prefix.
- `V1` **Counts are checkbox counts alone**: a topic's questions, a ticket's open questions then its tasks, a parent's children, the agenda's items (settled ones from the record). No activity word: the kind tells what is counted. Why: no text is parsed out of a file, and a count stays exact at 30 steps (2026-10-29).
- `V1` **A narrow screen drops titles**, keeping ids and counts.
- `V1` **The worktree shows on an item only when it is built outside the main checkout.**
- `never` **Badges with a step strip, a track of step names, or one activity sentence** (`band-variants.md` A to C): too wide for a laptop, one cell per step breaks at 30 tasks, and a step's text needs parsing.
- `never` **Progress as a badge's background fill** (D): it repeats the count.
- `later` **The band hides whole while the board runs.** Not designed.

### What loads into a window

- `V1` **A new session loads nothing of Flow's sessions.** Other sessions are reached on demand through `flow sessions`. Refused: listing the project's open sessions at every start.
- `V1` **A restart loads `session.md` with its index**, plus the ticket in hand, the files the old agent names and its note. `/fresh` loads `session.md` and the index, with no note. `/fresh-dialogue` loads the copied dialogue, `session.md` and the index (`fw-296`).
- `V1` **A subagent gets the folder's index at its start**, never `session.md` whole, and reads the rest by what its job needs. Subagents write to the session's record, each line naming its agent in `by`.
- `V1` **Topic files are always read on demand.** No cap on a session's size: settled agenda lines and answered questions leave `session.md`. Overturned if a restarted window reads the topic in hand before every step: then the restart attaches that topic's file.
- `V1` **The instructions live in a short `## Sessions` in `home/CLAUDE.md`**: where live state goes, the 4 base sections, who writes what. The format guide, `~/.flow/guides/write-sessions.md`, reaches the agent the first time it edits in the session folder, as `write-tickets.md` does on a ticket edit. Why: `CLAUDE.md` loads in every session, `/clear` and a session started by hand included (2026-10-29). Refused: instructions sent only by `flow sessions new`.

### Sessions and tickets

- `V1` **Groundwork always runs in a session, as topics.** One groundwork holds several related topics, each with its questions, never split into tickets to decide apart (`fw-323`). Locked decisions move to the ticket, at the latest when the groundwork completes. Execution runs on the ticket.
- `V1` **Work leaving the session becomes a ticket at once**:
  - a subject the user sets aside ("later, not here") → a `todo` ticket holding the question and the decisions here that bind it, nothing decided. Its groundwork runs as a topic in whichever session picks it up.
  - an issue hit mid-work → a ticket, as today. It joins the agenda only on the user's word.
  - a settled topic → its tickets, each holding every decision it needs.
  Why: the session holds only what it will discuss (2026-10-29).
- `V1` **The agent sets nothing aside unless the user asks.** A new topic waits on the agenda, discussed next.
- `V1` **A run of tickets is agenda lines in run order**, each naming its ticket, ticked as each closes. No wrapper ticket.
- `V1` **Each ticket from a settled topic is built here or dispatched.** A line with no builder is built here, in agenda order. A dispatched line names its building session, and that session's `session.started` line carries `from: <id>`. A build that finds a decision wrong settles it as a topic in its own session and rewrites the ticket's decision line. Why: the user mixes both (2026-10-29). Cutting the cost of switching between sessions belongs to the board.

### Wrap-up and storage

- `V1` **Wrap-up runs when the user asks.** Each open or set-aside agenda line becomes a ticket, a note or nothing, by the user's choice. Then `session.wrapped` closes the session.
- `V1` **A closed session's folder is kept, never deleted automatically.** `~/.flow/sessions/` is Flow's, so Claude Code never touches it, and tickets point into it. Claude Code deletes the transcript after 60 days, and only the record's `call` pointers go dead with it. Refused: keeping the folder while a ticket it names is open, which tied it to the transcript.
- `V1` **Subagent change records move into the session folder**, from `~/.flow/changes/<session>/` to `~/.flow/sessions/<session>/changes/` (`fw-161`).
- `V1` **The mod masks secrets in a line's `data` as it writes**, by a pattern list: API tokens, keys, `KEY=value` where the name says secret, token, key or password. Why: masking at write keeps every later copy clean, the local file and any backup included (2026-10-29). Refused: keeping records off the sync (`fw-97`), against the user's wish to sync them. Refused: masking at sync time.
- `later` **Sessions sync to the second machine with the Claude Code transcripts**, once it joins.
- `later` **A check of `## Agenda` and `## Questions` format on each edit**, joining the rule checks once the format settles.

## The parts

- **The mod's record writer** (`mods/flow-session/`): the session folder from `session.start`, every mod event, pickups, topic events from `## Agenda` edits, masking, the folder index beside `session.md`, the tool result line on a change of hand.
- **`flow`'s session code** (`scripts/features/sessions/`): appends ticket events and `flow event` lines, folds a session for `flow sessions get`, lists, starts and opens sessions, numbers them.
- **The band** (`mods/flow-session/features/band/`): runs `flow sessions get --json` and draws its rows.
- **The agent**: writes `session.md` and `topics/`, by `## Sessions` in `CLAUDE.md` and `write-sessions.md`.

## What passes between them

`flow sessions get 14 --json`, the state the band draws the example above from. What it holds is decided; the field names are the build's:

```json
{
  "id": "5f0c…", "number": 14, "name": "Session redesign",
  "agenda": { "done": 1, "total": 3 },
  "inHand": "fw-319",
  "actingOn": "fw-319",
  "rows": [
    [ { "type": "ticket", "id": "fw-315", "title": "batch-runs", "state": "in-progress", "done": 1, "total": 4 },
      { "type": "topic", "name": "storage", "state": "not-started", "done": 0, "total": 3 } ],
    [ { "type": "ticket", "id": "fw-319", "title": "dispatch-each-ticket", "parent": "fw-315", "state": "in-progress", "done": 24, "total": 34 },
      { "type": "ticket", "id": "fw-320", "title": "merge-worktrees", "parent": "fw-315", "state": "not-started", "done": 0, "total": 6 } ]
  ]
}
```

## One real case: a topic to a built ticket

1. The user starts Claude Code. The mod writes `session.started` into a new folder. The session is `S14 · Oct 29`.
2. The user raises session state. The agent writes `session.md` with an agenda line and opens `topics/session-state/topic.md`. The mod writes `topic.raised`, the edit of `topic.md` picks the topic up, and the band shows `○ Session state 0/9`, then `●` with a count as questions close.
3. The user raises an unrelated idea mid-discussion. The agent adds a second agenda line, and the band's top row gains `1/2`.
4. The context fills. The restart loads `session.md` with the folder index, and the topic file is read when needed.
5. The topic settles. The agent runs `flow tickets new` 3 times, each body holding its decisions and a `## References` line naming `topics/session-state/`. `flow` writes `ticket.created` and `session:` into each. The agenda line names the 3 tickets, and `topic.settled` lands in the record.
6. The user dispatches one ticket to another session and builds the rest here. `/flow:execute` on the first picks it up, and the band hangs it under its parent.
7. Days later the user asks to wrap up. The idea from step 3 becomes a note. `session.wrapped` closes the session, and the folder stays.

## How it fails

- **The agent edits `## Agenda` out of the checklist format** → the band's counts go wrong. The format check is `later`.
- **No pickup happens** (the agent works a ticket by reads and commands alone) → the band shows nothing in hand. The agent picks the item up by an edit or a phase skill.
- **A wrong pickup** → the tool result's line names the wrong item, and the agent picks up the right one.
- **`flow sessions get` fails or times out** → the band keeps its last state and the mod logs the cause.
- **A secret matches no pattern** → it is written to the record. A new pattern masks it from then on.
- **A transcript older than 60 days** → the record stands, and its `call` pointers lead nowhere.
- **2 machines number sessions alike** → left to `fw-6` and `fw-158`.

## How you know it worked

- **Fewer renames, splits, merges and drops per ticket, and no wrapper tickets**, over 2 weeks of real sessions after the build against the 2 weeks before it, counted by `/flow:audit` (`fw-294`).
- **The band names the item in hand**: how often, in the same audit.
- **`flow sessions get` runs on each change as fast as `flow tickets get` does today.**

## What is locked

- **A Flow session is a Claude Code session id**, never a workstream of several. One writer per root file.
- **The record is written by the program that acts.** The agent's command exists for what nothing else sees.
- **One envelope, `noun.verb` names, one file.** A new event never changes the format.
- **Counts come from checkboxes and events**, never from text in a file.
- **Live state lives in the session, decisions in the ticket.** A fresh agent holding only `ticket.md` can build it without re-proposing a refused option.

## References

- `.flow/tickets/321/context.md`: the reasoning behind each decision, by question
- `.flow/tickets/321/band-variants.md`: the band's 10 proposals and why each was refused
- `.flow/tickets/321/protos/band/band.mjs`: draws the band's cases
- `.flow/research/agent-event-records/how-festival-records-agent-work.md`: the envelope and `noun.verb` names this record follows
