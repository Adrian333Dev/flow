# How the audit index works

`flow audit` reads the transcripts Claude Code already writes and builds a SQLite index over them. This page is for whoever changes that code or writes a query against the index. It says what a transcript holds, which unit the index groups by, what each table holds, what the reader has to get right, and where the data lives. The commands themselves are in [Reference](../manual/reference.md#audit).

Checked against schema version 6 in `scripts/flow/lib/audit/store.js` on 2026-09-15. The transcript facts come from this machine's own transcripts and from Claude Code's [Sessions](https://code.claude.com/docs/en/sessions), [The .claude directory](https://code.claude.com/docs/en/claude-directory) and [Hooks](https://code.claude.com/docs/en/hooks) pages.

## Table of contents

- [What Claude Code writes](#what-claude-code-writes)
- [Segment is the unit, never session](#segment-is-the-unit-never-session)
- [The tables](#the-tables)
- [What the reader has to get right](#what-the-reader-has-to-get-right)
- [Where the data lives](#where-the-data-lives)

## What Claude Code writes

Flow records nothing and intercepts nothing. Claude Code writes a transcript for every session, with or without Flow:

- **`~/.claude/projects/<project>/<session-id>.jsonl`**: the whole conversation, one JSON object per line. `<project>` is the working directory with every character other than a letter or a digit replaced by `-`.
- **`~/.claude/projects/<project>/<session-id>/subagents/`**: one transcript per subagent.
- **`~/.claude/projects/<project>/<session-id>/tool-results/`**: tool output too large to keep in the line.

Every line carries `sessionId`, `uuid`, `parentUuid`, `cwd`, `gitBranch`, `timestamp`, `version` and `type`. The types the index reads:

- **`assistant`**: a model message, with the model id and its token counts: input, output, cache read, cache write and thinking.
- **`user`**: a prompt, or a tool's result. A read's result carries the file path and the line range delivered, even when the call asked for no range.
- **`attachment`**: content that entered context with no tool call, such as a file the editor opened or a `CLAUDE.md` that loaded.
- **`system`**: bookkeeping. A `compact_boundary` line marks a compaction.
- **`cost-state`**: the session's running total in dollars and tokens.

Claude Code's documentation calls the format internal and liable to change between versions. The index survives that because it is derived: the transcript stays the source, and every line names the version that wrote it.

## Segment is the unit, never session

**A segment is one unbroken context window**, from an empty context to the moment it ended. Two things end one:

- **A compaction** ends the segment and starts the next one inside the same session id.
- **`/clear`** ends the session itself. The next prompt starts a new session id.

So a piece of work that crossed 2 context boundaries is always 3 segments. It is 1 session if it crossed them by compacting and 3 sessions if it crossed them by clearing. A session count means different things depending on how the work was carried, so every query groups by segment.

`--resume` and `--continue` keep the session id and append to the same file. `/branch` and `--fork-session` start a new id.

The index has 4 levels:

- **Turn**: one prompt and everything it caused.
- **Segment**: one context window.
- **Session**: Claude Code's id. The index uses it to join rows and to nothing else.
- **Run**: the piece of work, which only Flow knows about. Nothing writes a run yet, so every query treats it as optional. That is what lets the audit work with no ticket and outside any project.

A real session from this machine, compacted by hand 4 times in a row:

```
$ flow audit sql "SELECT substr(session_id,1,8) AS session, ordinal, ended_by, trigger, pre_tokens, post_tokens, turns FROM segment WHERE session_id = ... ORDER BY ordinal LIMIT 4"
SESSION   ORDINAL  ENDED_BY  TRIGGER  PRE_TOKENS  POST_TOKENS  TURNS
51032a79  1        compact   manual   214793      16640        16
51032a79  2        compact   manual   141657      8576         18
51032a79  3        compact   manual   229977      9081         28
51032a79  4        compact   manual   222828      12599        26
```

## The tables

Every row is derived. Deleting `audit.db` loses nothing: `flow audit index --rebuild` writes it again, and raising `SCHEMA` in `store.js` does the same on the next run.

- **`session`**: one row per session id. The project, the working directory, the branch, the Claude Code version, the start and the end, and totals for tokens, cost and lines added and removed. One row per id and never per file, because `/cd` moves a session's storage to another project folder partway through.
- **`segment`**: one row per context window. What ended it (`compact` or `end`), whether a compaction was `manual` or `auto`, and the token count before and after it.
- **`turn`**: one row per prompt. Its segment, its first and last line in the file, its tokens, its tool calls and errors, and the opening text of the prompt.
- **`event`**: one row per transcript line, with its line number and byte offset. The offset is what lets `flow audit read` open turn 412 without parsing the lines before it.
- **`tool_call`**: one row per call. The tool, a one-line summary, the input as JSON, the lines holding the call and its result, whether it failed, and how long it took.
- **`file_touch`**: one row per file entering context or changed. The absolute path, the path as the command wrote it, `read`, `write`, `edit` or `list`, the line range, and how the path was learnt.
- **`transcript`**: the reader's bookmark, one row per file. How many bytes it has read, the file's inode, and the turn and segment a file stopped inside.
- **`run`** and **`run_session`**: the piece of work and the sessions that worked it. Both are empty.
- **`meta`**: the schema version.

`file_touch.confidence` says how far to trust a path:

- **`exact`**: the tool reported the path itself, as `Read`, `Edit` and `Write` do.
- **`parsed`**: the path was read out of a shell command, such as `cat` or `sed -n`, or out of `util fs merge`'s output.
- **`declared`**: Claude Code named the file in an attachment.

Every count is a floor. A script that opens files itself leaves one command in the transcript and no file. The same machine's touches, by how they were learnt:

```
$ flow audit sql "SELECT via, confidence, count(*) AS touches FROM file_touch GROUP BY via, confidence ORDER BY touches DESC LIMIT 8"
VIA                                CONFIDENCE  TOUCHES
Edit                               exact       3435
Read                               exact       2788
bash:sed                           parsed      2231
bash:cat                           parsed      1320
attachment:file                    declared    848
Write                              exact       768
attachment:opened_file_in_ide      declared    629
attachment:compact_file_reference  declared    485
```

## What the reader has to get right

`scripts/flow/lib/audit/scan.js` walks the transcripts, and `files.js` decides which file a call touched. Each case below broke the index once on real transcripts.

- **A turn is found by position.** Only user lines carry `promptId`, so a turn runs from one user line with a new `promptId` to the next one, in file order.
- **Order is file order, never timestamps.** One session resumed in 2 terminals mixes its messages into one file.
- **Shell text is not always a command.** A heredoc body holding the line `tail the log` parses as a `tail` of 2 files. Heredoc bodies are stripped before parsing, and a word counts as a path only with a slash or an extension.
- **One file gets one path.** `Read` reports an absolute path and `cat backlog.md` a relative one. Every path is resolved against the working directory of its line.
- **An appended tail continues the turn it stopped in.** The bookmark keeps the open turn and segment, so indexing a file whole or in 2 halves gives the same counts. `scripts/tests/audit.test.js` checks exactly that.
- **`cost-state` carries no timestamp.** Session dates come from the other lines, and token totals from the turn sums.
- **`SessionStart` fires on compaction too**, with `source: compact`. A hook writing runs from it has to update a session's row, or it records one session several times.

## Where the data lives

- **The index**: `~/.flow/audit/audit.db`, on one machine. Never synced and never committed, because it describes work that happened on that machine.
- **The transcripts**: Claude Code's own, under `~/.claude/projects/`. Claude Code deletes a transcript after `cleanupPeriodDays`, which Flow's `home/settings.json` sets to 365. [Settings](../manual/settings.md#cleanupperioddays) gives the reason.
- **Evidence a study case cites**: quoted into the case and committed with it. The transcript it came from exists on one machine and gets deleted.
- **Which sessions worked a ticket**: written into the ticket once runs are wired, so it travels with the project.

Transcripts are never copied in bulk. This machine holds 320 MB of them, and gzip shrinks a transcript only to about a third, since it is mostly file content. The index keeps every fact derived from them at a fraction of that size.
