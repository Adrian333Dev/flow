# The audit — a full record of what Claude Code did

Decided 2026-09-01, undesigned, nothing built. This file is the whole conversation, written down
because it ran on verified facts that die with the session that found them.

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
- **Read at any point**, in any phase — start of a session, middle, three sessions later. Nothing
  produces anything on a schedule.
- **Query, never bulk read.** Reading the log into context is the exact waste the audit exists to
  find.

## Claude Code already writes the record

Verified 2026-09-01 against `claude-directory.md`, `sessions.md`, `hooks.md` and this machine's own
transcripts. **The audit is a reader over files that already exist, not a recorder.** Nothing
intercepts anything, and no wrapper sits in any path.

What is on disk without Flow doing anything:

- `~/.claude/projects/<project>/<session-id>.jsonl` — the docs call it "Full conversation transcript:
  every message, tool call, and tool result". `<project>` is the working directory with every
  non-alphanumeric character replaced by `-`, truncated at 200 characters plus a hash of the full
  path.
- `~/.claude/projects/<project>/<session-id>/subagents/` — one transcript per subagent. `SubagentStop`
  hands a hook the same path as `agent_transcript_path`.
- `~/.claude/projects/<project>/<session-id>/tool-results/` — large tool outputs spilled to separate
  files.

Real transcript fields, read off disk: `sessionId`, `promptId`, `parentUuid`, `isSidechain`, `cwd`,
`gitBranch`, `timestamp`, `version`, `toolUseResult`, `message`, `type`.

### A session ends at `/clear`, and survives compaction

The question that started this: does a session id change when the context compacts? **It does not.**

- **Compaction stays inside one session.** `SessionEnd`'s reason list is `clear`, `resume`, `logout`,
  `prompt_input_exit`, `bypass_permissions_disabled`, `other` — compaction is absent, and the docs
  file `/compact` under managing context within a session. Proven on disk:
  `c5612fb1-a99e-4a88-8c12-61bdd4221cd7.jsonl` holds **58 compaction summaries under one `sessionId`**.
- **`/clear` ends the session and starts a new one.** `SessionEnd` with reason `clear`, `SessionStart`
  with source `clear`, and the previous conversation saved for `/resume`. New id.
- **`/branch` and `--fork-session` get their own ids**, stated outright in `sessions.md`.
- **`--resume` and `--continue` keep the id and the file.** Resume the same session in two terminals
  and the messages interleave into one transcript.

So `session_id` alone groups nothing: one id can cover 58 compactions.

### Other facts that decide something

- `SessionStart` receives `source`: `startup`, `resume`, `clear`, `compact`, `fork`. It fires on
  compaction too, so a hook counting sessions per ticket counts one session several times.
- Hooks receive `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `effort`,
  `hook_event_name`, plus `agent_id` and `agent_type` inside a subagent.
- `cleanupPeriodDays` sweeps at 30 days by default, minimum 1, and `0` fails validation. It takes the
  transcripts, `subagents/`, `tool-results/`, `file-history/`, `plans/`, `debug/` and `paste-cache/`.
- `claude project purge <path>` deletes one project's state whole, with `--dry-run` and `--yes`.
- `/cd` relocates a session's storage to the new directory's project folder, so a path recorded at
  session start can be stale by session end.
- The docs disclaim the JSONL format: "internal to Claude Code and changes between versions". It
  survives here because the raw file is always kept, the index is derived and rebuildable, and every
  entry carries `version`.

## Four levels, and only one needs building

- **Turn** — `promptId`, native, one per user prompt.
- **Segment** — a stretch between compaction boundaries. **Derivable with no hook**: compaction writes
  `isCompactSummary` into the transcript.
- **Session** — `sessionId`, native.
- **Run** — the piece of work, spanning sessions. Nothing in Claude Code has this, and it is the only
  level Flow supplies.

The two shapes the user named map onto these. One phase across three parallel sessions is a run
query. One phase across several compactions is a segment query inside one session.

## Where the data lives

Three tiers, and size decides each one.

- **The archive** — raw transcripts plus the index. Machine-local, never synced, never in a repo. It
  is already 238 MB after a month and describes work that happened on one machine. `~/.flow/audit/`,
  excluded if `~/.flow` ever becomes a synced repo.
- **The run-to-session mapping** — which sessions worked a ticket. A few dozen bytes, written into the
  ticket, travels with the project.
- **Evidence a study case cites** — extracted and committed with the case. The archive is swept and
  machine-local, so a case that only points at it is empty on the other machine. `references/study-cases.md`
  already demands the artifact verbatim, and that rule stands unchanged.

## `/insights`, read in full

Claude Code ships `/insights`, which writes an HTML report on how you work to
`~/.claude/usage-data/report.html`. Its source is at `repos/claude-code/src/commands/insights.ts`,
dated May 2026 and therefore old, but its pipeline is confirmed by the files it wrote on this machine
today.

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
re-run pays only for what changed. And it already solves two problems we hit:
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

## The skill on top

Decided 2026-09-01: **a normal skill, not an orchestration.** `/insights` runs parallel model calls
because it renders a fixed report over up to 50 sessions at once; that machinery serves batch report
generation and nothing here is batch.

The skill's own steps run in the main session, and the expensive reads never reach the model: it runs
queries, gets small tables back, picks the spans those tables flag, and reads only those transcript
slices. That matches the standing decision that review runs in the session rather than a subagent —
`## Authoring a skill` in `CLAUDE.md`, the reason `code-review` was never built.

**The facet prompt is the model to copy, with Flow's categories instead of generic ones.** `/insights`
scores friction as `misunderstood_request`, `wrong_approach`, `buggy_code`, `user_rejected_action`,
`excessive_changes`. Ours scores against the rules in `CLAUDE.md`: edited before approval, writing
pass skipped, stopped at a checkpoint waiting for a second go, `ls` where `util fs tree` is mandated.
Same mechanism, far sharper instrument.

**The daily sweep is a second mode and waits.** Analysing every session since yesterday is batch, and
batch is what wants parallel dispatch — which is blocked on git worktrees and the git toggle. It also
mostly does not need a model: the deterministic extract can run over every new session at zero token
cost and escalate only what it flags. Build the focused audit first.

## Built 2026-09-01

Only the retention change and the writing. No audit code exists.

- `~/.claude/settings.json` — `cleanupPeriodDays: 365`. The machine was on the 30-day default with its
  oldest transcript 28 days old, so August's start was days from deletion.
- `home/settings.json` — the same key, so every install carries it.
- `home/settings.md` — a `## cleanupPeriodDays` section: what the sweep takes, why Flow raises it, why
  365 and not more. A month of real work is about 305 MB, so a year costs a few gigabytes and a decade
  costs tens with nothing pruning.
- `CLAUDE.md` → `## Hard rules` — **never run an experiment to answer what the documentation answers.**
  Added at the user's instruction after a design ran on guesses that `claude-directory.md` and
  `sessions.md` had already answered. It covers any tool, not Claude Code alone.

## Open

- **Where the Claude Code reference pages live.** `lab/research/claude-code/` sits beside the cloned
  docs it distills and collides with the rule that every record under `lab/` is history — that file
  would be maintained, like `lab/context/state.md`. `backlog.md` → `## The Claude Code reference`.
- **Whether the docs-before-experiments rule also belongs in `home/CLAUDE.md`.** It reads as a general
  research rule rather than a Flow-development one. Asked, unanswered.
- **Renaming `~/.flow/notes.md` to `workflow-notes.md`.** It holds workflow faults and the name says
  notes. 4 live files name it.
- **The index and its query surface.** Named queries plus a raw one, over a store nobody has designed.
- **Pruning.** `cleanupPeriodDays` at 365 means nothing bounds the folder for a year.
