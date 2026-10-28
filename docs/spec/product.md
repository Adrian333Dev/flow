# Flow

What Flow is, who it is for, what it rests on, and the index of every other spec file. Each part of Flow has its own file under `docs/spec/`, holding what the part does and how it is built. A behavior carries one mark: `V1`, `next` (committed, no release picked), `later` (wanted, no commitment) or `never` (refused, with the reason).

## What Flow is, and who it is for

Flow is a complete development workflow for Claude Code, built for one developer working alone. It takes a raw idea and finds every decision the project needs, including the ones nobody raised. It researches the open ones, settles each one with the user, and tests the design against real cases before any code exists. It cuts the design into tickets, then plans, builds and reviews each one. It carries the work from one session to the next. Everything it learns about the user's preferences, their tools and its own mistakes goes back into its skills, its rules and a wiki every project shares. Each project starts with what the last one taught it.

It runs in Claude Code alone, on Linux, macOS and Windows through WSL, and needs a GitHub account. It is free, under the MIT license.

## The problem, and why now

- **A session starts from nothing.** Claude Code reads the rule files and the code. The decisions behind the code, the work in progress and what went wrong last week sit in no place it reads.
- **The agent settles open questions silently.** A decision nobody raised gets made mid-build, by whatever the agent guessed.
- **Long work outruns one session.** Answers degrade past about 140,000 tokens of context, so real work spans many sessions, each needing the state the last one left.
- **A correction is forgotten.** Memory tools store what went wrong. Nothing changes what the agent does next time.
- **Skill sets teach each step and stop there.** Nothing runs the work between the steps: which ticket is next, what state it is in, what was learned on it.

**Why now**: Claude Code ships skills, plugins and hooks, enough to build a whole workflow without changing Claude Code itself. Since 2.1.287 its mods let Flow run inside Claude Code and draw on its screen.

## Flow as a whole

Flow lives in 3 places:

- **A Claude Code session**: the rule file, Flow's skills and Flow's hooks are loaded, and the work runs there.
- **The project**: `.flow/` is a link to the project's folder in the Flow home, `~/.flow/projects/<name>/`, which holds its tickets and findings. Git hides the link, so no code branch carries it. `flow sync` carries the folder to GitHub.
- **The machine**: `~/.flow/` holds the rule file, Flow's clone, the skills, the wiki of outside tools and the logs. `flow sync` carries it to the Flow home, a private GitHub repository each user has one of, so every machine shares it.

The work runs as one loop across them:

```text
Design    idea → every decision mapped → researched → settled with you → tested on real cases → design written down
Build     tickets → plan → build → review → handoff to the next session
Improve   preferences, tool knowledge, mistakes → filed into skills, rules and the wiki ↺ the next project
```

```text
┌────────────────────────────────────────────────────────────────┐
│                     A CLAUDE CODE SESSION                      │
│                                                                │
│                Design  ──►  Build  ──►  Improve                │
│                                                                │
│          loaded: the rules, Flow's skills, the hooks           │
└────────────────────────────────────────────────────────────────┘
    │ tickets,    ▲ the ticket        │ lessons     ▲ rules,
    │ handoffs    │ in work           │             │ skills,
    │             │                   │             │ the wiki
    ▼             │                   ▼             │
┌────────────────────────────┐      ┌────────────────────────────┐
│        THE PROJECT         │      │        THE MACHINE         │
│                            │      │                            │
│  .flow/: a link into the   │─────►│  ~/.flow/: rules, skills,  │
│  Flow home, its tickets    │      │  the wiki, the logs,       │
└────────────────────────────┘      │  projects/<name>/          │
                                    └────────────────────────────┘
                                                  ▲
                                                  │ flow sync
                                                  ▼
                                    ┌────────────────────────────┐
                                    │           GITHUB           │
                                    │                            │
                                    │  the Flow home, one        │
                                    │  private repository        │
                                    └────────────────────────────┘
```

## The parts, one file each

- `docs/spec/setup.md`: installing Flow on a machine, setting up a project, updating by a pull and `flow install`, and syncing machines.
- `docs/spec/tickets.md`: the ticket store, the `flow` ticket commands, the `#` ticket list and the ticket header, and the status moves each phase makes.
- `docs/spec/skills.md`: Flow's skills and its 3 phases, how skills install, outside skills and their sources, and overlays.
- `docs/spec/permissions.md`: what runs without asking, what asks, the guard, the dialog that asks, and the log of asks.
- `docs/spec/rules.md`: the rule file, how a rule is written, the rule checks and the scorecard.
- `docs/spec/knowledge-base.md`: research, the wiki of outside tools and fields, Context7, capture, findings, notes and the session start view.
- `docs/spec/drawing.md`: `/flow:visualize`, and how a diagram is drawn and checked.
- `docs/spec/failure-log.md`: the failure log and `~/.flow/logs/`.

## Behaviors with no part file

### Hooks and guardrails

10 hook scripts, registered 18 times in `home/settings.json`.

- `V1` **Permissions have their own file**: what runs unasked, the guard, the dialog and the log, in `docs/spec/permissions.md`.
- `V1` **The session restarts at 170,000 tokens, with no handoff.** The `flow-session` mod sends the agent one line at 170,000 (finish this step, then call the restart tool with your note) and one at 100,000 past the limit (stop now and call it; 30,000 past until 2026-10-27, when the user widened it so a long step can finish, and set their own limit to 200,000, a stop at 300,000). The size notices every 10,000 and the repeat every 20,000 are gone. A running helper agent delays the restart until its finished notice. The band above the prompt shows a green Restart button from 30,000 under the limit, for restarting by hand: a press submits one prompt asking for the note, so it costs one model request. Decided 2026-10-21 (`fw-228`, `2.0 and 2.1`), built by `fw-245`. `"idleCompaction": false` in the settings file stops Claude Code's own summary of an idle conversation. The button shows only between turns, and a press hides it until the restart ends (or until the turn the press started ends with no restart), so a click mid-run cannot restart by accident. The user set the limit 2026-09-27 at 150,000, since answers degrade past about 140,000, and moved it to 170,000 on 2026-10-19: a session starts near 25,000 with `CLAUDE.md` and the tools.
- `V1` **Flow never lets Claude Code write the summary: the mod builds the new window from the disk.** The agent calls the mod's restart tool with `message` (its note), `files` and `skills`. The mod compacts in place and answers the compaction with: the fixed part Claude Code adds; an opening line; each ticket in flight, its `ticket.md` followed by its `context.md`, whole for a ticket in groundwork (activity `design`, where every topic stays in play) and the sections of its questions still open otherwise; the files the agent names for its next edit, with line ranges, and the skills; the note; and the user's unanswered messages, each whole and word for word, never cut into points. The opening holds instructions alone: continue from the note (left out after a typed `/restart`), answer every point of the unanswered messages, which source wins a conflict, and the capture pass. The note's guide asks for each point of those messages, done or open: the user's words arrive whole, the agent's list of what is open beside them. A `files` entry whose heading or range misses loads the whole file: a refusal would cost the old window another full request (the user, 2026-10-25). Files and skills together stay under 40k tokens, estimated at 4 bytes a token, and tickets stand outside the cap: past it the tool refuses with each part's size, and the agent names fewer files or parts of them. Why: a restart starts light, and 40k still leaves the new window far under the 170k wrap-up mark while a step needing 2 large files and a skill loads them whole (the user, 2026-10-26). Refused: the 80 KB cap (about 20k tokens) set in `fw-228`, which refused such a step. Tickets, sections, files and skills are each a `Read` or `Skill` call with its text from disk, so the agent edits at once and never re-reads. The note holds what is filed nowhere, each lesson with its exact detail, then the first edit and the next steps. On what exists, the files win. On decisions and what is still open, `ticket.md` wins over `context.md`. The old window's turns stay in the session's transcript, and the opening never points at them: every pointer invites reads before the first edit (the user, 2026-10-25). The restart guide (`mods/flow-session/features/restart/restart-guide.md`, read from the mod's folder in `CLAUDE_CODE_PLUGIN_DIRS`) rides the 2 wrap-up lines and the `/restart` prompt, so it reaches the agent just before it writes the note and costs nothing earlier: update `ticket.md` and `context.md` with everything the window learned, pick the files (whole by default) and skills, write the note in a fixed order, call `restart` last. The tool's own description stays one line per input: a guide inside a tool definition sits in every request and stays too short to be clear. Why: a restart opened at 90.6k tokens (`fw-256`), the dialogue about 18k of it, and the sections already hold what the dialogue decided. The goal kept: the new agent needs few reads before its first edit and rereads nothing the old one read. Checked as restarts run: reads before the first edit, about 3. Refused: Claude Code's own summary. Decided 2026-10-21 (`fw-228`), built by `fw-244` and `fw-246`. The attach decided 2026-10-24 (`fw-204`), built by `fw-268`.
  - `never` **The old window's dialogue word for word in the new window,** plus the window before it while a window held fewer than 5 of the user's messages. Replaced 2026-10-24 by `fw-268`: this user dictates long messages, so the dialogue cost about 18k tokens a restart, not the 5,000 assumed. The old code is in `lab/archive/mod-restart-dialogue/`.
  - `never` **The old window's dialogue in a file, `.flow/restarts/<session>-<window>.md`.** Dropped 2026-10-25 by the user (`fw-268`): nothing read it, and `flow audit` reads the transcript, which a restart keeps.
  - `never` **The user's last 2 messages with the last reply, as answered.** Built and dropped 2026-10-25 (`fw-268`): the case it served, feedback sent just before a restart, is an unanswered message, carried whole.
  - A typed `/restart` stops after the compaction. An automatic restart submits `Continue from the note.`. The session and its transcript stay. Decided 2026-10-19 (`fw-177`). Every other compaction is refused, a typed `/compact` included, and Claude Code's own compacting is off. Decided 2026-10-10 (`fw-16`, `## 17.1`).
- `V1` **One reminder line beside every message the user sends**, naming `## The reply` and `## Capture`. `"reminder": false` turns it off.
  - **One file per version of the line, in `scripts/hooks/reminders/<name>.md`**, and `"reminder": "<name>"` picks one, `flow settings set reminder <name>` writing it (`fw-173`, 2026-10-28). Absent, `true` or a name that is no file name reads `default.md`. A name with no file prints nothing. The hook reads the setting on every message, so a switch applies from the next one with no restart. Why: the reply rules are still being tuned, and versions get tried mid-session (the user, 2026-10-17). `flow settings on reminder` goes back to `default`.
- `V1` **2 keys copy the agent's words, and every reply is kept.** The mod's `/copy-v2`, bound to Alt+C in `~/.claude/keybindings.json`, copies the agent's last message as raw markdown, as Claude Code's `/copy` does: the common case. `/copy-all`, bound to Alt+A, copies every message of words the agent wrote since the user's last message, as markdown with a `---` line between them. Tool calls are left out: a run of them as one line a call was tried and was unreadable (the user, 2026-10-24). Each turn's end also saves that same text to `.flow/replies/<session>-<n>.md`, and the newest 100 files stay. They stay on one computer. Why: `/copy` takes the last message only, so an explanation buried under a label or a notification is lost, and it writes one file, `/tmp/claude-1000/response.md`, that every session overwrites. Refused: Ctrl+C, which Claude Code reserves for interrupt and no mod can rebind. Refused: telling narration from an answer by position or length, since it depends on how the agent writes and the user means to loosen the one-answer rule. Decided 2026-10-24.
- `V1` **`/keepwarm` renews a session's prompt cache while the user is away.** Decided 2026-10-24. Per session, off until `/keepwarm on`, and the switch survives an in-place restart and a hot reload (the host holds it). Closing the session (exit, `/clear`, resume) turns it off, decided 2026-10-24: a session opened again starts off and the user switches it on again. Shortly before the cache expires (`keepWarmLead`, 3 minutes) the mod calls `$.model.fork` with one tiny question: it sends the main thread's last request again, so the API serves the same prefix from the cache and the expiry clock starts over, and nothing reaches the transcript. `$.model.complete` cannot do this, because it has its own system prompt and no history, so its prefix differs and warms nothing. Every ping is judged by `cache_read_input_tokens` (a hit serves at least 90% of the prompt); the first ping that is not a hit, or fails, turns the switch off and says why, so a bug costs one miss and never repeats. The pings stop `keepWarmMaxIdle` (4 hours) after the user's last request, and after 12 pings for one request. A hit sets the meters row's cache countdown, since the transcript shows no fork. `/keepwarm status` says when the next ping goes out, and `/keepwarm ping` sends one now and reports the figures. A ping costs about $0.03 at 150,000 tokens and a miss about $1 (ticket `fw-100`, `token-costs.md`): with a 1-hour cache, pings pay off for gaps up to about a day, and with a 5-minute cache the break-even is about 2 hours.
- `never` **A ping that runs while the user works, or at a cache that is cold or empty**, refused 2026-10-24. The mod pings only from idle: no main turn, restart or helper agent running, and a timer only wakes a fresh read of the facts, so a user who keeps working moves the due time and nothing is sent. It never pings a cache past its expiry (that ping would pay the whole prefix), nor one a model switch or a restart emptied.
- `V1` **`@` lists every file, git-ignored ones included, most recently changed first**, answered from a saved walk in about 50 ms.
- `V1` **The session start prints one line to the user only when something needs attention**: a git repository with no Flow. It gives the agent the session start view (`docs/spec/knowledge-base.md`). It also makes every skill link match the settings, and starts the background pull and sync.
- `never` **A typed `/compact` let through on the second try**, refused 2026-10-01: people learn to type it twice. The mod refuses it every time, with no override setting.

### Subagents

- `V1` **A subagent's changes reach the main session as a change record**: the files its own tool calls changed, recorded by `changes.ts` under its id. The main session judges the work by the record, never by the subagent's report.
- `V1` **A subagent is warned at its own size and finishes with its state in files. It never restarts in place.** The mod measures each subagent at every model request (`turn.step`) and sends it one message at `wrapUpAt` (170,000 by default, the session's own limit) and a `Stop now` message at 100,000 past, each saying it replaces the brief's stopping point: save the sources read, the findings and what is left to its report files, then begin the reply with `UNFINISHED:` and their paths. Within a few steps of its final report it finishes instead. The session that sent it starts a new subagent from the files. Why not a restart: the mod ends a turn and compacts through `$.turn.abort` and `$.session.compact`, and both act on the main conversation alone; the only compaction of a subagent is Claude Code's own, which `"autoCompactEnabled": false` switches off, and switching it on would also switch on the main session's. Why a message and not a line in a tool result: a probe showed a subagent ignores that as injected text. Why it pays: in the measured run (`fw-253`) 82% of the cache reads came after 150,000, and a restart costs about 4 requests of a full window. Decided 2026-10-21 (`fw-253`).
- `V1` **The main session sizes a job so a subagent seldom reaches its limit.** It keeps the plan, the decisions, the small reads and the synthesis. A subagent gets one unit of evidence and a report file. A job that would read over about 100,000 tokens of sources is split by source group. Decided 2026-10-21 (`fw-253`).
- `V1` **Review runs in the session that built the work**, never in a subagent.
- `V1` **Every brief ends with a stopping point**, such as "stop after these 3 sources and write the file", never a time: agents see no clock. Decided 2026-10-12 (`fw-100`): briefs saying "about 10 minutes" changed nothing.
- `V1` **Claude Code's Explore and Plan agents switched off**, by `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`. Explore skips every `CLAUDE.md`, so no Flow rule reaches the searches Claude Code sends it unasked; Plan has no use while plan mode is denied. Decided 2026-10-12 (`fw-100`).
- `never` **A fork, the subagent that starts with a copy of the whole conversation.**
- `later` **A fixed output, tool list and model per subagent**, so a report comes back in a known shape.
- `later` **Measuring the 2 snapshots taken per command a worker runs**, slow on a very large repository.

### The meters

- `V1` **The `flow-session` mod draws the meters on the row under the prompt** (`fw-138`): model with effort, context against `wrapUpAt` (`74k/170k`, never the 1M window), the 5-hour and weekly limits, and the prompt cache's countdown. A narrow row drops whole meters, never part of one. The old status line (`flow status-line`) is in `lab/archive/status-line/`.
- `V1` **Claude Code's agent panel shows one row per agent in the same style**, through `subagentStatusLine` in the mod's `settings.json`: what the agent does, model and effort, time running, tokens (green, amber from 100k, red past 170k, the wrap-up mark).
- `next` **Every session named by itself**, so the right one is easy to find after `/clear`: `fw-38`.

### The audit and issue tickets

- `V1` **`flow audit` indexes Claude Code's transcripts into SQLite** and answers queries over it. `/flow:upkeep` reads it, and `/flow:audit` (`next`, `docs/spec/skills.md`) answers questions from it.
- `V1` **Every indexed session carries its machine's name, and every audit answer opens with one coverage line per machine**: its session count and newest day. A split between machines never misleads an agent. A second line says how long ago the index was read: every read refreshes an index over 30 minutes old first. Set 2026-10-11; refresh 2026-10-19 (`fw-177`).
- `V1` **An issue ticket keeps the exact output the user reacted to, for good**: a ticket labelled `flow-issue` plus a type, so `flow tickets labels -- "label:flow-issue"` groups the failures by kind. The third ticket of a type is the evidence a rule is needed. Replaced `flow cases` 2026-10-19 (`fw-180`, `fw-181`): the 14 study cases became tickets `fw-182` to `fw-195`, and the code is in `lab/archive/cases/`.
- `V1` **Issue tickets and workflow notes keep the output word for word, and the project's name**, though both sync to GitHub. Set 2026-09-30.
- `later` **A session sync between machines**, its own ticket after release 1: rclone sends each machine's `~/.claude/projects/` to a folder named for the machine. Until then the PC's folder is copied by hand before it is wiped for Linux.
- `later` **`flow audit prune`**, by run rather than by age, never touching what a case cites.
- `later` **A subagent's transcript joined to its parent's**, and its tool calls counted in the parent's totals.
- `later` **A run wired to the sessions it spans**, and a daily sweep over every session since yesterday.

### The `flow` command

- `V1` **Every command sits under a noun, and a noun typed alone lists** (`fw-149`, the user 2026-10-26): `flow tickets`, `flow notes`, `flow audit`, `flow settings`, `flow scorecard`, then `flow findings` with `fw-270` and `flow groups` with `fw-235`. Bare stay `flow next` and the 5 setup commands (`install`, `update`, `init`, `sync`, `doctor`). Bare `flow` prints the help. Why: one form per job, and the agent is taught the full form alone. The board carries the quick actions a shortcut would.
  - Refused: `flow tickets next`. `flow next` answers what comes next for Flow as a whole, tickets and more, never one noun's list.
  - Refused: `flow ls`, `flow tree`, `flow note <text>` and the bare ticket verbs (`flow new`). A short form beside the full one is a second way to do one job.
  - Refused: renaming `scorecard` to `checks`, which reads as `flow tickets check`.
- `V1` **Every search query follows `--`**: `flow notes -- "cache bug"`, `flow tickets -- "label:ui" --project fw` (`fw-149`, the user 2026-10-26). `--` marks the one argument after it, so a flag may still follow. A word after a noun is then always a verb. Why: the shell strips quotes, so `flow notes "new"` reaches `flow` as `flow notes new`, and no quoting tells a search from a verb.
  - Refused: `--` only before a one-word query equal to a verb, a second form to learn.
  - Refused: `--` ending every option, POSIX's meaning. An agent puts `--json` last by habit, and it would read as a second search.
- `V1` **A query selects, a flag sets a value or changes behaviour, and a list is one comma-joined argument** (approved by the user 2026-10-16, `fw-149`). `flow audit -- "project:fw since:2026-10-01"` replaces `--project`, `--since` and `--until`; `flow tickets file fw-1,fw-2` replaces space-separated ids. Query terms are `field:value`, parsed by `scripts/shared/query.ts`.
- `V1` **Every command but `install`, `update`, `init` and `sync` takes `--json`** (`fw-234`, the user 2026-10-20). `scripts/shared/cli.ts` adds the flag to each action unless it declares `json: false`, and the help says so once under its title. Why: the mod and the hooks read the commands, and an opt-out keeps a new command from forgetting it.
  - **One JSON result per run, printed after it, with no text.** A command calling another prints the outer one's: `flow notes promote` runs `flow tickets new` and prints the promote result.
  - **A refusal prints `{"error": "<message>"}` on stdout and exits 1.** Why: a reader parses stdout either way.
  - **A list's JSON is whole; `--limit` cuts the text alone.** Why: a reader gets the whole list from one call. The ticket record is in `docs/spec/tickets.md`, section "The board".
- `V1` **A query split across arguments is refused, naming the quoted form**: `flow notes -- cache bug` → `quote the query: flow notes -- "cache bug"`. Every example in docs and skills writes a query in double quotes. Why: a missing quote is the one slip `flow` can see.
- `V1` **An unknown command, a removed one included, exits 1 with one error line and its noun's help, or the whole help at the top.** Why: the plain rejection every CLI gives. A removed command reaching `flow` means a file still names it, and the switch-over sweep removes every such line. Refused: a table of old forms naming the new one.
- `V1` **Most flags get a short form of 1 to 3 letters, for typing by hand**: 1 where free, 2 on a clash (`-p` project, `-pa` parent). The same form means the same flag in every command. Docs and skills always use the long name. Why: the user types commands by hand, and `parseArgs` matches a short form whole, with no bundling. Widened from one letter by the user 2026-10-26. Refused: no short forms at all.

### Mods

- `V1` **The `flow-session` mod, in `mods/flow-session/`, owns the restart and the wrap-up warning** (`fw-136`). `CLAUDE_CODE_PLUGIN_DIRS` in `home/settings.json` loads it. It replaced `context-check.js` and `compact-check.js`, which sit in `lab/archive/`. It also turns a file dragged into the prompt box into an `@` mention, and removes a note left in `.flow/handoffs/` once the session that opened it answers.
- `V1` **A few mods by area, a folder per feature in each** (the user 2026-10-26, `fw-233`, built 2026-10-27). Features that share state or the order of one event share a mod. Today that gives 2: `flow-permissions` holds the permission dialog and its log, and `flow-session` the rest. `flow-session` keeps its name, so the restart tool stays `mcp__flow-session__restart`. Each mod holds `features/<name>/` with its code and tests, `shared/` for what 2 or more features use, and `register.ts`, which only lists the feature handlers run per event: a mod registers each event once per matcher (probed on 2.1.310). Nothing is shared between mods. Refused: one mod, since a feature failing validation freezes every feature at its old version and no area switches off alone; a mod per feature, since the restart, the band, the meters and keepwarm read one state, and the order of 2 mods' hooks on one event is unknown.
- `next` **A board in a pane, `/board`**, after release 1 (`fw-172`, children `fw-237` to `fw-240`). It is the graphical version of the `flow` ticket commands, with a Board, a Ticket, an All tickets and a Session page. It reads its width from the pane and drops columns; Claude Code 2.1.305 keeps a docked pane within 45% of the terminal.
- `next` **Flow built into Claude Code through mods.** Ruled by the user 2026-10-02: the beta ships on command hooks, and mods get built during the beta, in this repo. First the 4 open questions get probed, then watch-only mods replace the status line. Later steps bring a ticket board in its own pane, every reply checked against the rules before the user reads it, sessions on one repository kept from editing over each other, and a rule loaded the moment a matching file is written. `fw-14`, and `.flow/research/claude-code-mods/flow-fixes-and-ideas.md` → `## Build order`.

### Dates in files

- `next` **One date format in every file Flow writes: `2026-10-21 14:05`, local, to the minute** (`fw-204`, 2026-10-21). A command that writes a date stamps it, and a hand edit uses `date '+%F %H:%M'`. Today tickets carry seconds, notes the day alone, findings `checked:` and the failure log ISO in UTC. The failure log keeps ISO UTC, a machine record no one reads by hand. No migration: a day-only date is a prefix of the full form, so old values sort correctly and are fixed when rewritten. Why: `fw-205` and `fw-207` closed 14 minutes apart the same day.

### Pace

- `next` **A fast mode across every phase**, keeping tickets and skipping the ceremony the user does not want: `fw-16`. A pace fixed per machine and 2 versions of one rule were rejected by the user 2026-09-29.

### Working on Flow itself

- `V1` **One copy: `~/.flow/repos/flow` is a link to the dev checkout, `~/code/flow-dev`.** Every session on the machine runs it. A skill edit reaches a session at once, a hook and the `flow` command on their next call, and the mod when a hook file is saved. `flow update` leaves a linked clone alone, and another machine pulls from GitHub. Ruled by the user 2026-10-18, replacing the release copy and the `claude-dev` alias (2026-10-06): the user alone runs Flow, so a stable release protected no one. Costs: a half-edited hook breaks every project's session until it is fixed, and the checked-out branch is what runs. Rejected: working inside the old release clone, which would move the project record, the session history keyed by folder, `repos/`, `tmp/` and the uncommitted work to a new folder.
- `V1` **A test of a command that exists to print compares its whole output against a literal**, set 2026-09-11. A test reading only the filesystem passed over a command that described the filesystem wrongly.
- `V1` **One layout and one language for all of Flow's code** (the user 2026-10-26 and 27, `fw-233`, built 2026-10-27). Entry files sit where a different caller runs them: `commands/`, `hooks/` and `jobs/` in `scripts/`, `register.ts` in a mod. An area's code sits in `features/<name>/` with its tests beside it, and what 2 or more features use in `shared/`. Every file is TypeScript, run by Node directly with no build step, so only syntax that erases is used (no `enum`). Refused: `lib/`, which held area folders, area files and helpers side by side and named none of them.
- `later` **Flow in a plugin marketplace**, the plugin shipping the install script.

### Flow for teams

- `later` **A version of Flow any software team can use**, of any size, the user's biggest goal after V1. Research comes first, through `/flow:groundwork` and `/flow:research`: how teams work, and what they want from coding agents. The vision: a ticket system with the fields a team needs, a secured server with roles, a dashboard starting with a Kanban board, and a lead seeing who works on what.
- `later` **2 modes, set by the user 2026-09-28.** A team fully on Flow keeps each ticket's record on a server with a database, since tickets shared through git break past 2 people, while the plan and the groundwork stay in the repository. A team keeping its tracker keeps a thin Flow record per tracker id, GitHub Issues the best fit. A two-way sync of a full Flow ticket and a full tracker item was rejected: 2 records that never quite match.
- `later` **Free means self-hosted open source.** A free hosted server means paying for servers and answering for its security indefinitely.

### Kept in the final sweep

Each piece below was proposed for removal on 2026-10-01 and kept. Raise one again only with new evidence.

- `V1` **The guard**, the safety net against destructive commands.
- `V1` **`changes.ts`**, which lets subagents edit at once without mixing their changes. Uncommitted work makes `git diff` mix them.
- `V1` **`flow audit`**, read by `/flow:upkeep`.
- `V1` **`flow cases`**, retired 2026-10-19 into issue tickets (`fw-181`). A case kept the output for good and closed naming the file that fixed it, so a rule shortened later still shows why it exists. A ticket does the same.
- `V1` **The settings levels and the overlays**, which make Flow flexible.
- `V1` **The `#` ticket list and the `@` file list**: each small and asked for. The ticket skills they replaced went 2026-10-27 (`fw-236`). The skill updater and the restore and uninstall forms left 2026-10-14 (`fw-124`).

### Other harnesses, models and platforms

- `later` **Codex, then open models**, ruled by the user 2026-09-18: nothing ports until Flow ships on Claude Code. Each harness may get its own mechanisms rather than one bent to fit both. `.flow/research/models/which-model-and-other-harnesses.md` holds the port's costs.
- `later` **Native Windows**, where hooks run in PowerShell. Every hook today is a shell line.
- `later` **Flow without a GitHub account**, parked by the user 2026-10-01. Without GitHub there is no `flow sync` and no Flow home.
- `later` **One folder holding what must survive a machine change across harnesses**, `~/.flow/` the candidate, never the whole of `~/.claude/` moved under it.

## How you know it worked

- **The README's install line sets up a real machine**, the acceptance test: done, `fw-1`.
- **`npm test` in `scripts/` passes**: 292 tests.
- **Flow carries real work on this machine for 2 to 3 weeks of beta**, and each checklist ticket, `fw-2` to `fw-14`, is tried once in real use.
- **A second project starts with what the first one learned**: a finding about a tool, filed in one project, is read by `/flow:research` or `/flow:execute` in the next.
- **A correction is filed once.** The same rejected reply does not come back after its rule lands, which issue tickets and `flow audit` show.

## What it competes against

- **Skill sets**: Superpowers, Agent Skills and mattpocock/skills, compared in a README table that `fw-141` removed with the README's pitch to strangers. Flow leads on design before code, task tracking, long sessions, self-improvement, rule enforcement, sync across machines, skill management, installation and hooks. It trails on supported agents, Claude Code alone against up to 70. Plan, build, review and debug are a tie, so the table had given them no row.
- **Compound Engineering and gstack**, whole workflows. Compound Engineering trails Flow on every row but supported agents. gstack has about 135,000 stars.
- **Memory tools** remember what went wrong. Flow changes what the agent does next time.
- **The cost**: Flow loads about 4,000 tokens at session start, against 1,000 to 2,200 for its contenders.

`.flow/research/workflows/does-any-tool-match-flow.md` holds the survey.

## Bets

What Flow rests on that nobody has checked, and what happens if each one fails.

- **A lesson filed into a rule or a skill changes what the agent does.** `## The turn` and `## The reply` have never been measured, and the one rule check only counts. If it fails, self-improvement is a memory tool with more steps. Scoring sessions against the rules, in `docs/spec/rules.md`, is what checks it.
- **Walking every decision before code is worth its time to a solo developer.** If it fails, the user skips `/flow:groundwork`, and the fast mode (`fw-16`) is the answer.
- **The rules are worth what they cost**: `home/CLAUDE.md` alone is about 3,600 tokens in every session. If it fails, rules repeating Claude Code's own system prompt go first.
- **A handoff carries what the next session needs.** A fresh session picks up from the ticket alone. If it fails, sessions re-derive what the last one knew, and reading the old transcript through `flow audit` is the fallback.
- **Claude Code keeps the surface Flow builds on**: hooks, a plugin loaded from a skills folder, the settings keys. Flow has 6 issues open with Anthropic for what it lacks. If it fails, a release breaks Flow until each release is read against Flow, which `check-claude-code-updates` in `CLAUDE.md` does.
- **Nothing in Flow needs a particular model.** It is built and tested on Claude's 5.5 models, and no skill or setting is tuned to them. If it fails, a base rule set plus a per-model overlay is the shape.

## Glossary

- **Ticket**: one piece of work, its status, its plan and its history, in `.flow/tickets/<id>/`. An id is the project's prefix and a number, `fw-28`.
- **Phase**: one of 3 kinds of work, each a skill: `/flow:groundwork`, `/flow:execute` and `/flow:debug`.
- **Groundwork**: the phase that maps every decision an idea needs and settles each one before any code. A prototype that answers one question is a step inside it.
- **Handoff**: the state a ticket's next session needs, written into the ticket by `/flow:handoff`.
- **Capture**: the sweep at each checkpoint that files what the conversation taught into tickets, rules, the wiki or findings.
- **Finding**: one lesson, in one file, waiting for `/flow:upkeep` to fold it into a skill or a rule. Next (`fw-204`): the one kind of entry for anything Flow learned, reachable the moment it is written.
- **Session start view**: the generated lines of label groups, folders and spec files that a hook prints at each session start (`docs/spec/knowledge-base.md`).
- **The wiki**: `~/.flow/wiki/<tool>/`, one folder per outside tool, shared by every project.
- **The Flow home**: the private GitHub repository holding `~/.flow/`, one per user.
- **The guard**: the hook that reads each shell command and asks before one that can do harm.
- **Change record**: the list of files one subagent's own tool calls changed.
- **Issue ticket**: a ticket labelled `flow-issue` plus a type, holding the exact output the user rejected, kept for good, with the file that fixed it.
