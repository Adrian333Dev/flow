# The audit — a full record of what Claude Code did

Decided 2026-09-01, designed 2026-09-02, nothing built. This file is the whole conversation, written
down because it ran on verified facts that die with the session that found them.

`lab/research/claude-audit.md` is the earlier research report. **Its architecture is superseded** —
it proposed a hook pipeline writing to `~/.claude-audit/`, and both halves are wrong. It was written
before that conversation could see this repo, so it also names no Flow path correctly. Read it only
for the Agent SDK and OpenTelemetry sections, which nothing here reopens.

Open items are in `backlog.md` → `## The audit` and `## The Claude Code reference`.

## What the audit is

A record of everything Claude Code did during a piece of work, kept outside the session and read on
demand, so a later pass can find problems nobody noticed at the time.

**It is a log, never a fixed report.** The first proposal was a one-page report ranking waste, and
the user rejected it: too fixed, built for one scenario. What counts as an issue is not known ahead
of time, so the question gets composed when it is asked. Waste and workflow faults were two examples,
never the taxonomy.

Three requirements the user set:

- **Works with no ticket**, and in no project at all.
- **Read at any point**, in any phase — start of a session, middle, 3 sessions later. Nothing
  produces anything on a schedule.
- **Query, never bulk read.** Reading the log into context is the exact waste the audit exists to
  find.

## Claude Code already writes the record

Verified against `claude-directory.md`, `sessions.md`, `hooks.md` and this machine's own transcripts.
**The audit is a reader over files that already exist, not a recorder.** Nothing intercepts anything,
and no wrapper sits in any path.

What is on disk without Flow doing anything:

- `~/.claude/projects/<project>/<session-id>.jsonl` — the docs call it "Full conversation transcript:
  every message, tool call, and tool result". `<project>` is the working directory with every
  non-alphanumeric character replaced by `-`, truncated at 200 characters plus a hash of the full
  path.
- `~/.claude/projects/<project>/<session-id>/subagents/` — one transcript per subagent. `SubagentStop`
  hands a hook the same path as `agent_transcript_path`.
- `~/.claude/projects/<project>/<session-id>/tool-results/` — large tool outputs spilled to separate
  files.

### What a transcript line carries

Read off disk 2026-09-02, from `c5612fb1` — 23,671 lines, 61 MB, the largest session on this machine.

**Every line** carries `sessionId`, `promptId`, `parentUuid`, `uuid`, `isSidechain`, `cwd`,
`gitBranch`, `timestamp`, `version` and `type`.

**Event types**, with that session's counts: `assistant` 6,513, `user` 5,040, `attachment` 3,999,
`last-prompt` 1,464, `ai-title` 1,367, `mode` 1,366, `permission-mode` 1,348, `atis-latch` 956,
`file-history-snapshot` 740, `system` 715, `file-history-delta` 137, `cost-state` 48,
`queue-operation` 36.

**A read records its line range.** `toolUseResult.file` carries `filePath`, `startLine`, `numLines`
and `totalLines`, even when the call passed no `offset` — the result records what was delivered. An
edit writes `structuredPatch` beside `oldString`, `newString` and `originalFile`. A Bash result
carries `stdout`, `stderr` and `interrupted`, and names no file.

**Tool calls skew hard to Bash.** That session ran Bash 2,645 times, Edit 432, Read 198, Write 84,
WebFetch 13, ToolSearch 7. **The Read tool is 7% of tool calls**, so counting `toolUseResult.file`
alone measures a corner and calls it the room.

**`attachment` records content entering context with no tool call.** Its subtypes, same session:
`total_tokens_reminder` 3,022, `file` 163 (with `content` and `displayPath`), `opened_file_in_ide`
150, `edited_text_file` 113, `skill_listing` 75, `compact_file_reference` 66, `deferred_tools_delta`
64, `hook_success` 60, `hook_additional_context` 60, `agent_listing_delta` 60, `auto_mode` 45,
`selected_lines_in_ide` 41 (with `lineStart` and `lineEnd`), `task_reminder` 36, `nested_memory` 24
(a `CLAUDE.md` loading, with its path), `date_change` 15, `diagnostics` 3.

**Every assistant message carries full token accounting** — `input_tokens`, `output_tokens`,
`cache_creation_input_tokens`, `cache_read_input_tokens`, `thinking_tokens`, the model id and a
`requestId`.

**`cost-state` carries the session total.** From that session, verbatim: `totalCostUSD` 159.95,
`cacheReadInputTokens` 137,573,810, `cacheCreationInputTokens` 5,445,010, `outputTokens` 1,513,353,
`totalLinesAdded` 1,642, `totalLinesRemoved` 858.

### A session ends at `/clear`, and survives compaction

The question that started this: does a session id change when the context compacts? **It does not.**

- **Compaction stays inside one session.** `SessionEnd`'s reason list is `clear`, `resume`, `logout`,
  `prompt_input_exit`, `bypass_permissions_disabled`, `other` — compaction is absent, and the docs
  file `/compact` under managing context within a session. Proven on disk: `c5612fb1` holds **58
  compaction summaries under one `sessionId`**.
- **`/clear` ends the session and starts a new one.** `SessionEnd` with reason `clear`, `SessionStart`
  with source `clear`, and the previous conversation saved for `/resume`. New id.
- **`/branch` and `--fork-session` get their own ids**, stated outright in `sessions.md`.
- **`--resume` and `--continue` keep the id and the file.** Resume the same session in 2 terminals
  and the messages interleave into one transcript.

### Other facts that decide something

- **Compaction is marked twice.** A `type: user` line carries `isCompactSummary: true`, and a
  `type: system` line carries `subtype: compact_boundary`. That session holds 58 of the first and 59
  of the second.
- `SessionStart` receives `source`: `startup`, `resume`, `clear`, `compact`, `fork`. It fires on
  compaction too, so a hook counting sessions per ticket counts one session several times.
- Hooks receive `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `effort`,
  `hook_event_name`, plus `agent_id` and `agent_type` inside a subagent.
- `cleanupPeriodDays` sweeps at 30 days by default, minimum 1, and `0` fails validation. It takes the
  transcripts, `subagents/`, `tool-results/`, `file-history/`, `plans/`, `debug/` and `paste-cache/`.
- `claude project purge <path>` deletes one project's state whole, with `--dry-run` and `--yes`.
- `/cd` relocates a session's storage to the new directory's project folder, so one session id can
  appear under 2 project folders.
- Transcripts compress poorly — gzip took `c5612fb1` from 63.5 MB to 19.4 MB, a ratio of 3.3. They
  are mostly file content, which is already near-incompressible.
- The docs disclaim the JSONL format: "internal to Claude Code and changes between versions". It
  survives here because the raw file is always kept, the index is derived and rebuildable, and every
  line carries `version`.

## Segment is the grouping unit, never session

**A segment is one unbroken context window, from empty to ended.** What ends it is either a
compaction or a `/clear`. Same boundary, different cause.

The user is moving off `/compact`. Once the workflow is finished, work will cross context boundaries
through `/handoff` and `/clear` instead, and `/compact` becomes rare. Both paths have to behave the
same, and segment is what makes them.

```
  TODAY — /compact                             SOON — handoff + /clear
  one session id                               three session ids

  ┌───────────┬───────────┬───────────┐        ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ segment 1 │ segment 2 │ segment 3 │        │ segment 1 │  │ segment 2 │  │ segment 3 │
  └───────────┴───────────┴───────────┘        └───────────┘  └───────────┘  └───────────┘
              ▲           ▲                                 ▲              ▲
          /compact    /compact                           /clear         /clear

  segment count is identical. only the session grouping differs.
```

**So nothing groups by session.** Session means one thing under compaction and another under
`/clear`, so every query groups by segment or by run.

The 4 levels:

- **Turn** — `promptId`, native, one per user prompt.
- **Segment** — derivable with no hook under compaction, from `compact_boundary`. Under `/clear` it
  is the whole session.
- **Session** — `sessionId`, native, and load-bearing for nothing.
- **Run** — the piece of work, spanning segments. Nothing in Claude Code has this, and it is the only
  level Flow supplies.

**The run needs an explicit record, and `/clear` is why.** Under compaction the segments share a
session id, so a run reassembles itself. Under `/clear` nothing links 3 sessions but the handoff,
which the database cannot see. A `SessionStart` hook writes the new session id into the project's
`.flow/`, **upserting on session id** — the hook also fires on compaction with `source: compact`, and
an append would record one session 5 times.

## The shape

```
  ┌─  ALREADY ON DISK ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
  ¦                                                                    ¦
  ¦   Claude Code writes this with or without us:                      ¦
  ¦                                                                    ¦
  ¦   ~/.claude/projects/<project>/<session-id>.jsonl                  ¦
  ¦   one line per event · 239 MB on this machine                      ¦
  ¦                                                                    ¦
  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ALREADY ON DISK  ─┘
                       │
                       │  we only ever read these files
                       ▼
  ┌─  WE BUILD ─ ─ ─ ─ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  ¦                                                                    ¦
  ¦      ┌────────────────────────────┐                                ¦
  ¦      │ flow audit index           │   walks each transcript once   ¦
  ¦      └────────────────────────────┘                                ¦
  ¦                     │                                              ¦
  ¦                     ▼                                              ¦
  ¦      ┌────────────────────────────┐                                ¦
  ¦      │ audit.db                   │   one SQLite file, rebuildable ¦
  ¦      └────────────────────────────┘                                ¦
  ¦                     │                                              ¦
  ¦                     ▼                                              ¦
  ¦      ┌────────────────────────────┐                                ¦
  ¦      │ flow audit sql "…"         │   narrows 23,671 events to 40  ¦
  ¦      └────────────────────────────┘                                ¦
  ¦                     │                                              ¦
  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  WE BUILD  ─┘
                       │
                       │  "open turns 412-460 of session c5612fb1"
                       ▼
                       the agent opens that slice of the original transcript
                       and reads it in full — every tool call, every result
```

Drawn 2026-09-02 after a first attempt failed. The fault: it never said which boxes exist today and
which get written, so `reader` read as something Claude Code might already ship.

## What the database holds

One table per word defined above, plus one for bookkeeping. Every row is derived and rebuildable —
delete the file and `flow audit index` writes it again.

- **`session`** — where it ran, which git branch, start and end, Claude Code version.
- **`segment`** — one row per unbroken context window.
- **`turn`** — one row per `promptId`, with the tokens the turn spent.
- **`event`** — one row per transcript line, **including its line number in the file**. That number is
  what makes reading one turn cost nothing. Without it, reaching turn 412 means re-parsing 61 MB —
  the exact waste the audit exists to catch.
- **`tool_call`** — which tool, its input, whether it errored, how long it took.
- **`file_touch`** — which file entered or left context, which lines, and how sure the path is. Two
  path columns: the absolute one, resolved against the directory the event ran in, and the one the
  command actually wrote. Without the first, `cat backlog.md` and `Read /home/…/backlog.md` are 2
  different files.
- **`run`** and **`run_session`** — the piece of work. Both stay empty with no project, and every
  query treats run as optional. That is what makes the audit work with no ticket. Built and empty as
  of 2026-09-02: nothing writes a row yet.
- **`transcript`** — the reader's bookmark: which files it has read and **the byte offset it stopped
  at**. Transcripts only ever grow, so re-indexing reads the new tail instead of 61 MB again. Store
  the inode too, to catch a file replaced rather than extended, and the turn and segment the walk
  stopped inside, so the next walk continues them instead of opening new ones.

Two ordering rules found by walking real cases:

- **Order by file position, never by timestamp.** One session resumed in 2 terminals interleaves its
  messages into one transcript.
- **Union by session id across project folders.** `/cd` moves storage mid-session.

## The skill on top

**A normal skill, not an orchestration.** `/insights` runs parallel model calls because it renders a
fixed report over up to 50 sessions at once. That machinery serves batch report generation, and
nothing here is batch.

The skill's steps run in the main session. That matches the standing decision that review runs in the
session rather than a subagent — `## Authoring a skill` in `CLAUDE.md`, the reason `code-review` was
never built.

**It hands the agent 3 tools and says when each is worth reaching for. The agent picks.** Settled
2026-09-02, after a draft that made transcript reading the ground truth and demoted the rest.

1. **Query the index** — counts, costs, rankings, error rates. Enough alone for most waste questions.
   A file pulled 14 times is a finding with nothing else read.
2. **Read the tool calls for a turn range** — what ran, what came back. Where `cat`, `util fs merge`
   and anything a parser missed become visible.
3. **Read the conversation** — reasoning, the user's corrections, where it went sideways. The
   expensive one, for when the first 2 show something is wrong but not why.

The agent works down that list as far as the question needs, then stops. Nothing is fed to it up
front; it plans what to open, the way it would explore a codebase.

**Nothing ever reads a whole session.** `c5612fb1` is roughly 15 million tokens. One segment averages
1 MB, about 270,000 tokens, still over any context window. Every read is a bounded turn range,
trimmed of tool output nobody is examining.

**Attribution is best-effort, and cost is exact.** No extractor set covers every way a file reaches
context: `Read` is exact, `util fs merge` names every file in its own fenced output, `cat` and
`sed -n` need the command parsed, `util fs tree` is a listing and not a read at all, and a script
that opens files internally is invisible. Token and dollar figures need no attribution and stay
exact, so a query that finds an expensive turn is trustworthy on its own.

**The facet prompt is the model to copy, with Flow's categories instead of generic ones.** `/insights`
scores friction as `misunderstood_request`, `wrong_approach`, `buggy_code`, `user_rejected_action`,
`excessive_changes`. Ours scores against the rules in `CLAUDE.md`: edited before approval, writing
pass skipped, stopped at a checkpoint waiting for a second go, `ls` where `util fs tree` is mandated.

**The daily sweep is a second mode and waits.** Analysing every session since yesterday is batch, and
batch is what wants parallel dispatch — which is blocked on git worktrees and the git toggle. It also
mostly needs no model: the deterministic pass runs over every new session at zero token cost and
escalates only what it flags. Build the focused audit first.

## Where the data lives

Three tiers, and size decides each one.

- **The database** — machine-local, never synced, never in a repo. `~/.flow/audit/`, excluded if
  `~/.flow` ever becomes a synced repo. It describes work that happened on one machine.
- **The run-to-session mapping** — which sessions worked a ticket. A few dozen bytes, written into the
  ticket, travels with the project.
- **Evidence a study case cites** — extracted and committed with the case. The transcripts are swept
  and machine-local, so a case that only points at them is empty on the other machine.
  `references/study-cases.md` already demands the artifact verbatim, and that rule stands unchanged.

**Raw transcripts are never copied in bulk.** Copying would protect against `cleanupPeriodDays` and
`claude project purge` destroying evidence. It costs a second copy of 239 MB that grows monthly, and
gzip only cuts it to a third, because a transcript is mostly file content and barely compresses. The
index keeps every derived fact at a fraction of the size and survives the sweep, so what a bulk copy
actually buys is asking a *new* question of old chat text. **`flow audit keep <session>` gzips one
transcript into the archive** for the sessions where that matters, and a study case extracts and
commits its own quotes either way.

**Nothing prunes for now.** `cleanupPeriodDays` at 365 bounds the transcripts, and 78,430 events a
month means the index reaches a few hundred megabytes a year. Rebuilding is deleting the file.
`flow audit prune` gets built when the folder is a real problem, and it deletes only transcripts the
index has fully read and no study case cites.

## `/insights`, read in full

Claude Code ships `/insights`, which writes an HTML report on how you work to
`~/.claude/usage-data/report.html`. Its source is at `repos/claude-code/src/commands/insights.ts`,
dated May 2026 and therefore old, but its pipeline is confirmed by the files it wrote on this machine
on 2026-09-01.

Four phases:

1. **Lite scan** — walks `~/.claude/projects/` reading filesystem metadata only, no parsing.
2. **Deterministic extract** — a `SessionMeta` per session, no model involved: project path, start
   time, duration, message counts, `tool_counts` per tool name, `languages` by extension, git commits
   and pushes, token counts, first prompt, user interruptions, response times, tool errors with
   categories, whether subagents, MCP, WebSearch or WebFetch were used, lines added and removed, files
   modified, message hours. Cached at `~/.claude/usage-data/session-meta/<session-id>.json`.
3. **LLM facets** — a model returns underlying goal, goal categories, outcome, satisfaction counts,
   helpfulness, session type, friction counts, friction detail, primary success, brief summary. Capped
   at 50 extractions a run. Cached at `~/.claude/usage-data/facets/<session-id>.json`.
4. **Aggregate and render** — 8 sections, each its own parallel model call, into HTML.

**Two mechanisms worth taking.** Both caches key on session id and carry `transcript_mtime`, so a
re-run pays only for what changed. And it already solves 2 problems we hit:
`deduplicateSessionBranches` keeps one record per session id when branching made several, and
`detectMultiClauding` finds overlapping sessions from message timestamps.

**Why it cannot be the audit**, found in the source rather than the docs. `formatTranscriptForFacets`
truncates every user message to 500 characters and every assistant message to 300, and **includes no
tool calls at all**; past 30,000 characters that text is chunked and summarized before analysis. So
the model judging a session never sees a single tool call. The deterministic layer does see tool
calls and keeps only counts — `tool_counts` says `Read: 58`, never which files; the source builds a
set of modified paths and then discards it, storing a number. No line ranges anywhere. Both layers are
per-session aggregates with no turn, segment, run or ticket.

**It stays.** It is a different question, cheaply answered, and running it monthly costs a few tokens.

**Its report is also evidence.** Over 14 analyzed sessions it reported `wrong_approach` 11 times and
`excessive_changes` 5, and named premature editing, the writing-style rules going unapplied, and a
decided migration left unexecuted. Three of this repo's hard rules, arrived at independently from the
transcripts.

## Built

No audit code exists. Everything below is retention and writing.

**2026-09-01**

- `~/.claude/settings.json` — `cleanupPeriodDays: 365`. The machine was on the 30-day default with its
  oldest transcript 28 days old, so August's start was days from deletion.
- `home/settings.json` — the same key, so every install carries it.
- `home/settings.md` — a `## cleanupPeriodDays` section: what the sweep takes, why Flow raises it, why
  365 and not more. A month of real work is about 305 MB, so a year costs a few gigabytes and a decade
  costs tens with nothing pruning.
- `CLAUDE.md` → `## Hard rules` — **never run an experiment to answer what the documentation answers.**
  Added at the user's instruction after a design ran on guesses that `claude-directory.md` and
  `sessions.md` had already answered. It covers any tool, not Claude Code alone.

**2026-09-02**

- **`flow audit` — the whole of it.** `scripts/flow/commands/audit.js` is the surface;
  `scripts/flow/lib/audit/` holds `store.js` (the schema), `scan.js` (the reader), `files.js` (which
  file a call touched), `query.js` (the named queries) and `read.js` (a turn range of the
  conversation). `skills/commands/audit/SKILL.md` is the skill, filed under `commands/` because that
  group wins wherever 2 fit. 6 tests in `scripts/tests/audit.test.js`; the suite is 27 and passes.

- `lab/context/design-audit.md` — **the Claude Code reference pages go to `docs/dev/`, not
  `references/`.** Reversed by the user: `lab/research/claude-code-docs/` is a clone that will be
  deleted, so no maintained page may sit beside it or point into it, and a published URL is the only
  citation that survives.

- `backlog.md` → `## Other people, other models` — a new section, 4 items: naming what in Flow is
  Claude Code and what is portable, running Flow on GPT, Qwen and GLM, surveying the harnesses that
  could host Flow, and building Flow for a stranger. The `deepseek-harness` research line lost the
  portability question it had been carrying and now points at the section.
- `home/CLAUDE.md` → `## Hard rules` — **never run an experiment to answer what the documentation
  answers**, carried across from this repo's `CLAUDE.md` at the user's approval. The two wordings
  differ on purpose: the repo copy names `lab/research/claude-code-docs/`, and no `lab/` path may
  leak into `home/`.
- `CLAUDE.md` → `## Hard rules` — **never re-ask a settled point, and never list one as open.** The
  existing "silence on a decision is a yes" rule covered delay and said nothing about re-asking, so
  settled points kept reappearing under `## Open`. Set by the user after 2 of them were re-raised
  across 3 messages.
- **`~/.flow/notes.md` renamed to `~/.flow/workflow-notes.md`** across every live file — this repo's
  `CLAUDE.md`, `home/CLAUDE.md`, `references/study-cases.md`,
  `skills/commands/file-findings/SKILL.md`, `docs/dev/README.md` and 2 lines in `backlog.md`. The
  backlog item requesting the rename was deleted, per that file's rule that a finished item is
  deleted rather than checked off. `references/style.md` §9 still quotes the older
  `~/.claude/flow/notes.md` inside a worked example, and stays as written: the path appears only in
  the rejected "before" text.

## What building it changed

The 3 steps ran in order on 2026-09-02: the reader and the schema, then the queries, then the skill.
Nothing in the design above was overturned. 5 things it did not say came out of running it.

**No assistant line carries a `promptId`.** Only user lines do, so a turn cannot be assembled by
grouping on the field. It runs from a user line bearing a new `promptId` to the next such line, in
file order. Counted on the largest session here: 6,608 assistant lines, none with the field.

**A `cost-state` line carries no `timestamp`.** Writing one into the session row emptied `started_at`
for every session, and both dates then came from the last line of the file. Token totals now come
from the turn sums, which exist for all 51 sessions; `cost-state` exists for 9 and supplies the
dollar figure alone.

**A shell command is prose as often as it is a command.** The first pass over this machine recorded
`the`, `a` and `and` as files read, out of heredoc bodies — a line reading `tail the log` parses as a
`tail`. Every heredoc body is stripped before parsing now, redirections are dropped, a path needs a
slash or an extension, and sed's own grammar decides which argument is the script.

**One file needs one name.** `Read` reports an absolute path and `cat backlog.md` reports a relative
one, so the index held 2 rows for one file until every path was resolved against the directory the
event carries.

**A walk has to hand the next walk its open turn and segment.** Reading resumes from a byte offset,
and the turn and segment it stopped inside are already written as closed. Without their ids in the
bookmark, an appended tail opened a second segment where the conversation had one — and nothing
about the output looked wrong. `scripts/tests/audit.test.js` guards it by indexing a file whole, then
in 2 halves, and comparing every count.

Measured, 2026-09-02: 51 transcripts and 241 MB walked in 3 seconds into a 44 MB index — 79,676
events, 3,189 turns, 276 segments, 12,278 tool calls, 10,294 file touches. A second run over
unchanged files opens nothing.

## The Claude Code reference pages go in `docs/dev/`

`docs/dev/claude-code.md` is the first page. Reversed by the user 2026-09-02, against an earlier
recommendation of `references/`.

**The argument that decides it: `lab/research/claude-code-docs/` is a clone of Anthropic's published
documentation, and it gets deleted.** A page that distils it must not sit beside it, and must not
point into it either. Anything durable cites the published URL instead, which survives the clone.

`lab/` is wrong for the same reason twice over — every record there is history, and a facts page
about Claude Code is maintained. `references/` is wrong because it installs to `~/.flow/references/`
and loads mid-work; these are pages a person reads while changing Flow, which is what `docs/dev/`
already holds.

`docs/manual/` is the other half of the docs tree and does not exist yet. It waits on the workflow
being finished, and it is about using Flow rather than building it. `backlog.md` → `## Next` item 4
is a manual page on features Claude Code already ships that would have replaced things Flow built —
a different subject, and no collision with this one.

**Two consequences, neither one handled yet.** This repo's `CLAUDE.md` hard rule on reading the docs
names `lab/research/claude-code-docs/` and its `llms.md` index, and 2 backlog lines cite pages inside
that clone. Every one of them goes stale on the day the clone is deleted. `backlog.md` →
`## The Claude Code reference` carries the item.
