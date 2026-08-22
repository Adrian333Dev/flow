# Compressing the skills

The compression pass, locked 2026-08-18. Read this instead of deriving it again.

## What compression means here

Never information loss, never shortening that costs clarity. Three moves:

- **Cut repetition** — content already loaded from somewhere else.
- **Cut dead words** — articles and filler the sentence reads fine without.
- **Shorter forms** — digits, common short words, grammar bent where meaning survives.

A rule, a reason and one example are never cut. `writing.md` §7 governs, and Anthropic's own guidance backs it: minimal does not mean short.

## The rules

Rules 1–4 are already in `writing.md` and were never applied to a file. 5–6 are new.

1. **Digits for every count from 2 up.** "four phases" → "4 phases". 136 spelled numerals from two to ten across the skills, 33 in `brainstorm` alone.
2. **Drop articles and dead words wherever the sentence still reads.** "A markdown checklist" → "Markdown checklist".
3. **Shorter common word over the longer one.** "will not resolve" → "won't resolve".
4. **Grammar bends for compression.** Clauses go, not only words: "The ones skipped most often, and the ones that cost most when skipped" → "Skipped most often, cost most when skipped".
5. **Read-only regions.** Commands, paths, inline code and fenced blocks are copied exactly, never tightened. `flow ticket new "<question>" --type prototype --parent <id>` breaks silently otherwise.
6. **Never restate what is already loaded.** Two tests that make `writing.md` §3 fire:
   - **The opener carries what the description could not.** `prototype`'s "then deleted" stays — the description never says the code gets deleted. `brainstorm`'s "Turn an open subject into written, settled decisions" goes, because its description already says it. 6 of 10 skills restate their description in the first body line.
   - **A section overlapping `global/CLAUDE.md` names only what is extra.** `brainstorm` Phase 3 repeats 4 rules from `## Judgment` near-verbatim.
7. **A skill is written `/name`.** `/write-tickets`, never `write-tickets`. Two things that look like skills and are not: a ticket type stays bare (`--type prototype`, `--type research`), and a sub-file is a file (`write-spec.md`).
8. **Point at a section by its name alone.** `## Judgment`, `## Capture` — never "in the global CLAUDE.md", never "already loaded". The file is in context and the heading is a unique address.

## The work

`brainstorm` first, complete, as the reference pass. The user judges that result before anything else is touched.

**Sub-files are part of the skill** and get the same pass in the same run:

- `brainstorm/` — `SKILL.md`, `write-spec.md`
- `execute/` — `SKILL.md`, `review-code.md`
- `file-findings/` — `SKILL.md`, `write-skills.md`
- `debug/`, `handoff/`, `prototype/`, `research/`, `visualize/`, `write-tickets/` — `SKILL.md` only
- `debug-web-pages/` — **excluded**, full rewrite pending

Then `global/refs/writing.md` takes rules 5–8, plus the enforcement note on rule 1.

**Compression is only part of it.** Every skill after `brainstorm` gets the whole `writing.md` pass — section shapes, the sentence tests, one home per fact. `brainstorm` had already had that pass, which is most of why compression alone returned so little there.

## Settled — do not re-raise

- **The behavior test is rejected.** Filtering lines by "would the agent do this differently without it" does not fit this workflow: every line in every skill was put there deliberately, out of a long brainstorm. A line that looks unnecessary is a line not yet understood.
- **`decisions.md` and `write-spec.md` do not conflict.** `docs/spec/decisions.md`, or another file under `docs/spec/`, is the right destination. `write-spec.md` is not a destination — it holds the instructions for writing to the spec files. `brainstorm` lines 168 and 202 are both correct.
- **Keep `write`, never `edit`**, for the act of writing a decision. `brainstorm` uses "write" 5 times; a second word for one concept costs more than it saves.
- **Prescription level is not a problem in `brainstorm`.** The widen procedure is heavily specified on purpose — line 50 says so. Withdrawn.
- **Dropped from the research entirely:** the AI-writing-tells guide, eval harnesses and test cases, skill-judge's 120-point score, caveman's caveman-speak register.
- **Still live, not built:** the negation split — a prohibition for a rule the agent breaks under pressure, a positive recipe where the output comes out the wrong shape, and no "unless it matters" clauses.

## Measured — `brainstorm`, applied 2026-08-19

Both files together: 4662 → 4474 words, −4.0%.

- **6 structural cuts gave 137 words. About 150 line-level edits gave 60**, over 380 lines.
- Phase 3 alone: 236 → 173. The rest is the opener, the description, and 3 cuts in `write-spec.md`.
- **The 12–15% estimate was wrong.** It came from measuring the 2 slackest sections and applying that rate to every line. Line level returns about 1% on a file that already had the `writing.md` pass.
- Expect ~4% where a skill duplicates nothing, and more only where a section overlaps the global CLAUDE.md or the skill's own description.

Originals: `tmp/compress/SKILL.before.md`, `tmp/compress/write-spec.before.md`.

## Sources read

Read once, in full. Do not read again.

- `wip/refs/guidelines/agentskills` — the Agent Skills spec and `docs/skill-creation/`. Authoritative on format: `name` ≤64 chars, `description` ≤1024, `SKILL.md` under 500 lines.
- `wip/refs/superpowers/skills/writing-skills` — skills as TDD, and the negation split above.
- `wip/refs/mattpocock-skills/skills/productivity/writing-for-agents` — context pointers, context load against cognitive load, pruning.
- `wip/refs/agent-toolkit/skills/skill-judge` — the rubric. Dimensions work as questions; the scoring is rejected.
- `wip/refs/agent-toolkit/skills/writing-clearly-and-concisely` — Strunk. `writing.md` §5 already exceeds it.
- `wip/refs/caveman/skills/caveman-compress` — thin. Only read-only regions ported.
- `wip/refs/agent-skills` — addyosmani, workflow skills, the same category as Flow. Unmined.
- Anthropic, *Effective context engineering for AI agents* — attention budget, context rot, "minimal does not necessarily mean short".

## Splitting a skill into `refs/` — measured 2026-08-22

The question: pull rarely-needed sections out of a `SKILL.md` so they load only when they fire. **Rejected for the process skills, on the numbers.**

- `execute` is ~3350 tokens. Its largest coherent conditional block — the 4 delegation sections, `Whether to delegate` through `Handing a job to a separate session` — is 776, or 23% of the file.
- Pulling all 776 out saves **0.4% of a 200k window**, and about 78 token-equivalents per turn at cache-read price.
- All 10 skills together are under 21k tokens, and a single 800-line source file read during a build costs more than the whole of `execute`.

Two arguments that do survive:

- **Attention.** 50 lines of delegation machinery between Phase 3's build loop and Phase 4 dilutes what fires on every run. That is the existing rewrite goal — instruct, do not justify — not a splitting goal.
- **Accumulation.** 2 to 10 skills loaded at once is realistic once domain skills exist. At `groundwork`'s size that is 8k–41k, and the top end is material.

**The lever is the size of the domain skills, not surgery on the process skills.** 15 domain skills written at 800 tokens instead of 3000 is the difference between 12k and 45k — 3 to 5 times what splitting returns, and it costs nothing because the files do not exist yet.

### The two shapes

- **Process skill** — `execute`, `groundwork`, `debug`. A loop with branches, read in order, and every run needs all of it because no run knows which branch fires. Naturally one file. Splitting buys extra reads, which `writing.md` §3 already rules against.
- **Domain skill** — how an ORM does migrations, how a framework's boundaries behave. A lookup table, where a run needs **one entry, not the file**. Naturally split: a thin `SKILL.md` index over `refs/`, fetched by name. `debug-web-pages` is already this — 504 tokens over 5k of `knowledge/`.

### Loading facts behind this

- **A skill body enters context once, on invocation, and stays for the session.** Claude Code does not re-read the file on later turns.
- **Re-invoking with identical rendered content adds a note, not a copy.** Different arguments or different `` !`cmd` `` output re-append the whole body.
- **`/clear` discards it entirely**, so the next cycle pays the full body again — 4152 tokens for `groundwork`, 4 cycles being ~16.6k. Small against the code and tool output refilling the window anyway.
- **Auto-compaction is not in play** — the user does not use it.
