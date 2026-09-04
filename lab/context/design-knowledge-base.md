# Knowledge system — design

Research is complete. The design discussion locked all decisions across four sessions. This file carries the locked decisions, the research inventory, and the build plan.

## Locked decisions — the knowledge system

### The name

The mechanism is the **knowledge system** — it captures, stores, surfaces, and maintains what the agent learns across sessions and projects. "Knowledge system" over "memory system" because memory is passive (store and recall); what Flow builds is active (capture, organize, promote, age, enforce).

### Capture — `.flow/findings/<subject>.md`

During work in any phase, the agent writes reusable knowledge directly to `.flow/findings/<subject>.md` — one file per subject, organized by topic, not chronologically. A Prisma finding goes to `.flow/findings/prisma.md`. A prompting technique goes to `.flow/findings/prompting.md`. Files can be 10 lines or 500 lines — research output, tool behavior details, library quirks, conventions discovered.

**Format**: plain markdown with sub-topic headings (`## Connection pooling`, `## Migration quirks`). No frontmatter, no metadata. File-findings routes by content, not by when something was captured. New findings on the same sub-topic update the existing section (topic-key upsert).

**Duplicate filter**: before writing to findings, check whether the loaded skill already covers it. If it does, skip. Contradictions and extensions are new knowledge — write them, and file-findings edits the skill when promoting.

The inbox (`.flow/inbox.md`) stays for work items: potential tickets, fragments, half-formed ideas. Knowledge and work items are different streams captured to different places.

The Capture section in `home/CLAUDE.md` needs one routing-rule addition: reusable knowledge → `.flow/findings/<subject>.md`, inserted between the project-fact line and the decisions line. The "everything else → inbox" catch-all stays. If the agent knows the knowledge is reusable and knows the subject, findings. If unclear, inbox.

### Promotion — `/file-findings`

`/file-findings` is the single mechanism that moves knowledge from project-local capture to its global destination. It reads three inputs:

- `.flow/inbox.md` — work items
- `.flow/findings/*.md` — knowledge captured during work
- Closed unfiled tickets

It routes each item:

- Descriptive knowledge with a matching skill → that skill's `references/`
- Universal prescriptive rule → `rules/<topic>.md` (symlinked to `~/.claude/rules/`)
- Stack/context prescriptive rule → `rules/<topic>.md` with `paths:` frontmatter
- Project-specific prescriptive rule → `.claude/rules/<topic>.md`
- Project-specific fact → `docs/context/<subject>.md`
- No matching skill → flag in inbox as `needs skill: <group>/<subject>`
- Work item → ticket or stays in inbox

Filed items are cleared from findings and inbox. Findings files fully drained are deleted, not emptied — an empty file with a subject name is noise.

**The input source determines routing behavior — no modes, no flags.** Inbox items need triage (what is this? where does it go?). Findings items are already identified as reusable knowledge and organized by subject — they skip triage and go straight to destination routing. Closed tickets and groundwork maps stay as they are.

**The ticket sweep is the safety net for capture.** With findings capture in place, most knowledge is already in `.flow/findings/` by ticket close. The sweep catches what the agent missed during the build and marks tickets as filed. The mechanism is unchanged; it produces fewer findings.

**File-findings never runs mid-session.** Promoting to skills writes through symlinks into the Flow repo, which invalidates the prompt cache. Capture happens during work (zero cache impact); promotion happens at session end or in a dedicated session.

### Surfacing — the loading ladder

Knowledge defaults to the lowest loading tier and is promoted only with evidence:

- **Skill `references/`** (default destination) — loaded only when the skill fires. Most knowledge stays here.
- **`.claude/rules/` with `paths:` frontmatter** — loaded when the agent reads a matching file. For rules tied to a file type or directory.
- **`.claude/rules/` without `paths:`** or **`home/CLAUDE.md`** — loaded every session. Only for universal rules that apply regardless of stack or context.

Promotion up the ladder requires evidence: repeated corrections, repeated violations measured by the compliance scorecard. Knowledge that loads every session but never applies is wasted context — every loaded token gets re-read on every message in the conversation.

### Aging — no scheduled maintenance

Three mechanisms, no timers or scheduled jobs:

1. **Default low, promote with evidence.** New knowledge enters at skill references. Promotion to rules requires the agent repeatedly violating a convention or the user repeatedly correcting the same thing.
2. **Demote via dead-rules-audit signal.** Rules that load but never apply get flagged for demotion — move back to skill references, or delete.
3. **Update on conflict.** New findings that contradict existing knowledge supersede the old record. The agent notices the contradiction during work and updates.

### What knowledge types exist

Four types, each with a different final destination:

- **Tool/library knowledge** (descriptive, detailed, 50-500 lines) — how a tool actually behaves. Goes to skill `references/`.
- **Rules and conventions** (prescriptive, short) — "always do X." Goes to `rules/` or project CLAUDE.md depending on scope.
- **Patterns and techniques** (instructional, medium) — "when doing X, approach it this way." Goes to skill `references/` or `rules/` depending on scope.
- **Project-specific facts** (descriptive, varies) — "this repo uses X." Goes to `docs/context/<subject>.md`. This already works today.

### What each project-level folder holds

- `.flow/inbox.md` — work items, fragments, ideas. Not knowledge. Drained by file-findings into tickets and project docs.
- `.flow/findings/<subject>.md` — reusable knowledge captured during work, organized by subject. Temporary staging. Drained by file-findings into skills and rules.
- `docs/context/<subject>.md` — project-specific facts. Permanent. Not promoted.
- `.claude/rules/<topic>.md` — project-specific prescriptive rules. Permanent in this project.

## Locked decisions — the enforcement bridge

### The three tiers

1. **Soft guidance** — the rule lives in CLAUDE.md, `rules/`, or skill references. The agent follows it or doesn't. Measured by the compliance scorecard.
2. **Warning hook** — a `PreToolUse` hook on Edit/Write that pattern-matches against violations. Shows a message, allows the edit. Catches mechanical mistakes without blocking.
3. **Blocking hook** — same as warning but rejects the edit. The agent must retry without the violation. Reserved for rules with zero false positives (e.g., never write credentials to a file).

Most rules never leave tier 1. Promotion from tier 1 to tier 2 happens when the scorecard shows chronic violations. Promotion from tier 2 to tier 3 is rare.

### The compliance scorecard

A PostToolUse hook on Edit/Write runs async (zero latency, zero API cost) and checks each edit against parsed rules using keyword/pattern heuristics. No model call. Tallies: how often each rule was relevant, followed, or violated. A SessionEnd hook renders the scorecard.

Rules with high violation rates are flagged for hook promotion. The threshold needs tuning for Flow's session patterns — start conservative (5+ violations, 60% violation rate).

### Hooks are local, not API calls

Every hook is a shell script (JavaScript or Bash) running on the user's machine. Pattern matching, text parsing, arithmetic. Zero API cost. Zero token usage. The entire enforcement bridge runs within normal session usage on a $20/month plan.

### What hooks can and cannot enforce

- **Mechanical rules** (pattern-matchable: banned patterns, naming conventions, forbidden commands) → hooks can enforce.
- **Semantic rules** (need code understanding: "always return typed results," "use the right abstraction") → stay as soft guidance, measured but never blocked.

Hooks cover roughly 20-30% of rules. That 20% is often the rules the agent violates most, because they're simple and repetitive.

### False positives

A `console.log` rule flags the logger's internals, which legitimately use `console.log`. Solutions:

- Path scoping — exclude `**/logger/**` from the rule
- Pattern refinement — more specific regex
- Warn mode — show the message, let the agent decide

Default to warn for everything. Promotion from warn to block only after false positives are eliminated through path scoping and pattern refinement.

## Locked decisions — supporting

### Standards skills are redundant

Path-scoped rules in `.claude/rules/` do the same job as standards skills — load contextually based on what the agent is working with — and they're a native Claude Code feature. The `standards/` skill group can be removed. If a case appears that rules can't handle, standards skills can return.

### The CLAUDE.md split

Topic-specific rules move from `home/CLAUDE.md` to `rules/<topic>.md` in the Flow repo, symlinked to `~/.claude/rules/` by `flow install`. Examples:

- Commenting rules → `rules/comments.md` with `paths:` scoped to code files
- TypeScript conventions → `rules/typescript.md` with `paths: "**/*.ts"`

`home/CLAUDE.md` shrinks to universal rules that apply regardless of stack or context.

### The `rules/` folder

Lives at the top level of the Flow repo, alongside `skills/`, `scripts/`, `references/`. Not under `home/`. `flow install` symlinks per file (never the folder) to `~/.claude/rules/`, same pattern as skills. Same safety: refuses to replace anything that isn't already a symlink. Handled by `--home` in the same pass as skills — no new flags.

### `.claude/rules/` is a standard Claude Code feature

- Project rules: `.claude/rules/<topic>.md` — loaded for this project
- User rules: `~/.claude/rules/<topic>.md` — loaded for every project
- Rules without `paths:` frontmatter load at session start
- Rules with `paths:` frontmatter load only when the agent reads a matching file
- Symlinks explicitly supported
- Plain markdown with optional YAML frontmatter

### Skill loading at scale

Claude Code loads a listing of skill names and descriptions at session start, not skill bodies. The listing has a character budget (default 1% of context window). When many skills exist:

- Every skill name is always listed
- Descriptions get trimmed starting with least-used skills
- Each description capped at 1,536 characters
- `skillOverrides` controls visibility: `"on"`, `"name-only"`, `"user-invocable-only"`, `"off"`

Flow already uses `skillOverrides` in `home/settings.json` to disable stack skills by default. This is the right mechanism. Backlog idea: set obvious stack skills (React, etc.) to `"name-only"` to save description budget.

### No separate compile step

File-findings is the promotion mechanism. No background compilation (like claude-memory-compiler's), no separate API calls, no spawned sessions. Everything runs within normal conversation.

### Cost

The entire knowledge system and enforcement bridge runs within normal session usage. No background agents, no separate API calls. Affordable on a $20/month plan.

## Research inventory

### Analysis files under `lab/research/`

Twelve files analyzing external repos, in two batches.

**Batch 1** (user-provided repos, analyzed first session):

- `browser-harness.md` — self-improvement through agent-authored helpers and domain skills. Learning is the work itself, zero overhead.
- `tencentdb-agent-memory.md` — server-side layered memory (L0 raw → L1 atoms → L2 scenarios → L3 personas). Heavy infrastructure, but the layering concept translates.
- `everything-claude-code.md` — first-generation solo-developer approach. Session lifecycle hooks, continuous learning via Stop hook, rules as separate files, strategic compact.
- `ecc.md` — ECC's instinct system (trigger + action + confidence + scope). Real-time observation via hooks, project-scoped by git hash, background Haiku observer, promotion from project → global.

**Batch 2** (cloned to `repos/batch1/`, analyzed second session):

- `claude-mem.md` — 93k stars. Progressive-disclosure retrieval (search → timeline → get), SQLite + FTS5, optional Chroma vector search. Heavy infrastructure (Bun worker, HTTP API).
- `claude-memory-compiler.md` — 1.3k stars. Simplest viable architecture: transcript → daily log → compiled wiki articles → `index.md`. No RAG at personal scale (Karpathy insight).
- `pro-workflow.md` — 2.8k stars. Self-correcting memory (corrections → rules → SQLite), persistent FTS5 wikis, correction heatmaps, adaptive quality gates. 37 hooks across 24 events.
- `codealmanac.md` — 993 stars, YC S26. Cleanest design. Wiki-as-code in `almanac/`, background sync/garden agents, notability bar, intelligence in prompts not pipelines.
- `claude-code-hooks-repo.md` — 498 stars + Anthropic's hookify. dead-rules-audit compliance scorecard (deterministic rule violation tracking, promote→hook flag). hookify creates hook rules from conversation analysis.
- `engram.md` — 6.3k stars. Go binary, agent-decides-what-to-save, topic-key upserts (evolving knowledge stays one record), conflict detection.
- `basic-memory.md` — 3.8k stars. Markdown + wikilinks as knowledge graph. `[category] content #tag (context)` observation syntax. Schema validation via Picoschema.
- `claude-diary.md` — 379 stars. Simplest complete loop: diary → reflection → CLAUDE.md updates. No infrastructure beyond two command files.

### Additional research

- `inspirational-repos.md` — broad sweep, unfiltered, includes low-quality repos.
- `filtered_agent_memory_repositories.md` — filtered to 200+ stars and recent maintenance. 35 repos retained.
- `agentic-atlas-refs.md` — Agentic Atlas pages on statelessness, deferred context, and reference data. Source of the loading-ladder and rent-test concepts used in the aging design.

### Repos cloned and analyzed

All at `repos/batch1/`. Anthropic's `claude-code` also cloned there for the hookify plugin at `plugins/hookify/`.

### Convergent pattern across all repos

The repos that work long-term land on the same three layers independently:

1. **Append-only raw layer** — transcripts, logs, observations. Cheap to capture, never edited.
2. **Derived structured layer** — typed facts, wiki pages, rules, instincts. Built by a separate extraction/compilation pass.
3. **Small always-loaded index** — points into the structured layer rather than containing it. Keeps the context budget intact.

### Mechanisms worth stealing — cross-repo synthesis

Six mechanisms that survive across implementations:

1. **Progressive disclosure for retrieval** — compact index → chronological context → full detail. Flow's skill loading model already follows this.
2. **Topic-key upserts for evolving knowledge** — one file per subject, updated in place. Adopted as `.flow/findings/<subject>.md`.
3. **Notability bar for capture** — not everything is worth remembering. The agent exercises judgment about what crosses the threshold.
4. **Compilation from raw to structured** — raw session logs → structured articles → index. Flow uses file-findings as the promotion step instead of a separate compiler.
5. **Compliance scorecard for rule enforcement** — deterministic measurement of rule compliance, flagging chronic violations for hook promotion. Adopted.
6. **Garden/maintenance for aging knowledge** — periodic review for staleness. Flow uses dead-rules-audit signal and conflict detection instead of scheduled maintenance.

### What none of them do

No repo solves knowledge promotion from project to global cleanly. ECC detects candidates but promotion is manual. Flow's design uses `/file-findings` as the explicit promotion step.

## Build plan

All design questions resolved. The build touches these files:

### Files to edit

- **`home/CLAUDE.md`** — Capture section: add findings routing rule, duplicate filter note
- **`skills/commands/file-findings/SKILL.md`** — add `.flow/findings/` as fourth input, add `rules/` destinations to routing, update clearing step, note input-nature distinction

### Files to create

- **`rules/`** — top-level folder, initially empty. Populated when specific rules split out of `home/CLAUDE.md`
- **Capture manual page** — the capture mechanism: what to write down, where each type goes, examples of each routing destination. For users reading Flow's documentation
- **Knowledge system manual page** — the full loop: capture → findings → file-findings → skills/rules → aging → enforcement. Referenced from README

Manual page paths unsettled — a manuals folder is planned but not built. README and `docs/dev/cli.md` will likely reorganize into it later. Pages are prone to change while the workflow is still being built.

### Separate from this design

- **Documentation and examples for workflow artifacts** — ticket templates, groundwork examples. Needed but not part of the knowledge system
- **`name-only` skill overrides for obvious stack skills** — backlog idea, saves description budget
