# Resume — Flow

The list under **What to open** is complete. Read it in one batch, then start on the first action.

## The job

Designing Flow in plain conversation, one topic at a time. The `handoff` rewrite just landed. Next is a queue of topics the user deferred on purpose, to be discussed — not built.

## Where it stands

Two pieces of work finished this session, both approved and verified.

**The `description:` feature.** `global/scripts/ptree.js` replaces `ptree.sh` and drops the `tree` dependency. It prints each entry's own description beside its name. One marker, `description:`, found anywhere in the first 50 lines but only on a comment line — that restriction is what keeps a SQL column of that name out. Markdown uses frontmatter instead. Multi-line reads to the paragraph break; display cuts to one sentence, then 60 characters. A folder describes itself in a `.info` file it carries, README as fallback. Measured at 21 ms across 2,947 files, so a cache was rejected — the freshness check alone would cost 9 ms of that.

**The `handoff` rewrite**, four changes to `skills/handoff/SKILL.md`, 99 → 108 lines:

1. The pointer rule inverted. Write the state out; a path is only for a file the first action opens.
2. New slot, **what is still open** — unresolved threads and the position you were leaning toward.
3. The hard rule re-aimed from "never summarize the conversation" to **write what is true now**. The old wording banned the payload along with the narration.
4. Every list entry bounded — path, line range, what the reader gets. Plus **"the list is complete"** on the reader's side.

Other files touched: `project-template/CLAUDE.md` (lost `### Layout`, `## Project rules` → `## Rules`), `project-template/CLAUDE-directory.md` and `global/scripts/ptree.sh` (both deleted), `global/CLAUDE.md` (new hard rule about `description:`, `## Scripts` entry rewritten), `CLAUDE.md` and `README.md` (swept for `ptree.js` and the single template), and three record corrections in `wip/context/`.

## What binds it

- **Never install anything, and never propose it.** Nothing in Flow loads in any session; this repo's `CLAUDE.md` is the whole rule set in force. A skill being untypeable is not a reason to install — read the file and follow it.
- **Never run a git mutation**, and never run `git status` here. The tree has been uncommitted since 2026-08-09 and that is the expected state.
- **Design Flow in plain conversation.** Never invoke a brainstorming skill for it.
- **Every file gets the writing pass** — `global/refs/writing.md`, read in full, plan the whole file's sections before typing. The user calls this the failure that repeats most.
- **⛔ Changelogs: stop raising the subject** (user, 2026-08-15, emphatically). `skills/debug-web-pages/CHANGELOG.md` exists and stays. `CLAUDE.md` says every changelog was deleted on 2026-08-09; that sentence is wrong, the user knows, and it is deliberately not being fixed.
- **Handoff files are tracked, never gitignored.** The gitignore experiment ran 2026-08-14 and was reversed the next day. The user restated the rule 2026-08-15. Do not raise it again.
- **One marker word: `description:`.** No `desc:`, no `info:` — markdown frontmatter forces the full word, so every language matches it (user, 2026-08-15).

## What is still open

Three topics, all deferred by the user rather than unfinished. Nothing here is decided.

1. **assignments** — delete the assign half of `handoff`. A job handed to another session is work, and Flow already has a place for work, so the dispatched job becomes a child ticket of the ticket that dispatched it, with the brief as the ticket body. `handoff` would shrink to one job, resume. Four questions are written up for a cold reopen: whether a brief and a ticket body are the same document, what happens where there is no ticket system, who closes it, and where the report lands.
2. **install** — `setup-flow-globals` and `migrate-to-flow` collapse into one skill. The user's reason: the starting states are open-ended and there is no clean line to cut two skills along. **This is the last gate.** Nothing installs until Flow is finished, so this skill's design closes the project.
3. **The remaining essentials**, agreed this session: the install skill, a test suite for `flow`, then a writing pass over `brainstorm`, `research`, `execute`, `debug-web-pages`. Everything else — the `visualize` mockups, `debug-web-pages`, a `testing` skill, excalidraw, the `flow` simplification, the `PreCompact` hook — was cut from essential on one argument: each needs a real case to decide, and Flow has never produced one.

**Recommendation for order: assignments first.** It edits `skills/handoff/SKILL.md`, which was just rewritten, so settling it now avoids a second pass over the same file.

## What was found

- **`execute` was already rewritten and is current.** `remaining.md:1069` says the rewrite is "not started, no scope agreed" — written 2026-08-11, four days stale. The agent quoted it and the user corrected them. This repo's `CLAUDE.md` says in bold that the skills on disk are current and `remaining.md` is the stale one. Trust the skill.
- **`remaining.md` is 1,272 lines and stale by its own header.** Not worth cleaning: `wip/` gets deleted when the build lands.
- **Past sessions are searchable and settle "did we decide this" questions.** Transcripts sit at `~/.claude/projects/-home-me-code-flow/*.jsonl`, one per session, greppable. That is how the second handoff complaint was found — announced 2026-08-14 22:07, detailed at 23:00, and recorded in `threads.md` as never detailed. The record was wrong; the transcript was not.
- **Two record files disagreed about the handoff gitignore, in opposite directions.** Both corrected. Where the record fights itself, check the disk.

## What to open

- **`wip/context/threads.md:378-428`** — the `assignments` thread, then the `install` thread. Both written to be read cold, and they are the whole agenda.
- **`skills/handoff/SKILL.md`** — 108 lines. The file the `assignments` discussion would change.

## The first action

Open the `assignments` thread with the user and walk its four questions. Nothing gets edited until a specific plan is approved — feedback is not approval, and hedging is a no.
