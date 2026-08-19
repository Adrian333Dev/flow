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
