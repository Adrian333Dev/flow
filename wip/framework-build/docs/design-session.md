# Framework Design Session — Complete Locked Decisions

**Sessions:** 2026-06-24 through 2026-06-29
**Status:** Design extended. 85 decisions locked. Build in progress — framework-build/ has real files.
**Goal:** Design and build a custom agentic workflow framework to replace Superpowers entirely.

---

## Why We're Here

Superpowers failed on the Delapse project:
- Kept suggesting/executing git commands despite explicit overrides
- Kept recommending `subagent-driven-development` against explicit prohibition
- Too opinionated — enforced workflow that didn't fit actual working style
- Override mechanism (`superpowers-overrides.md`) was a constant patch layer, not a real fix
- Debugging was terrible without manual intervention
- Context explosion at session start — ~90-100K tokens consumed before doing any work
- After context compaction, skills re-applied as if overrides didn't exist
- Milestone-based planning created waste when plans became obsolete during discovery
- Offered visual companions, worktrees, and forced steps that were not wanted

**Decision: Abandon Superpowers completely. Build a custom framework from scratch.**

---

## Current State of Work

- Design session 1 (2026-06-24): Locked decisions 1–25. Grilling complete.
- Design session 2 (2026-06-25 to 2026-06-26): Deep-dived on /brainstorm skill design. Locked decisions 26–34.
- Design session 3 (2026-06-26): Guides phase — built 6 guide files in `framework-build/docs/guides/`. Locked decisions 35–56.
- Design session 4 (2026-06-27): Redesigned guide system, context architecture, and skill mechanism. Locked decisions 57–69.
- Design session 5 (2026-06-28): Built guide files, list-guides.sh, tree.sh, merge-files.js. Locked decisions 70–80.
- Design session 6 (2026-06-29): Expanded visualization guide to folder with HTML sketch template. Locked decisions 81–85.
- Build in progress — `framework-build/docs/guides/` and `framework-build/docs/commands/` have real files.
- Next: core workflow guides (brainstorm, handoff, verify, review, execute, debug), then CLAUDE.md template.

---

## All Locked Decisions

### 1. Overall philosophy

Light structure, not zero structure and not full structure. Key principles:
- Skills are **user-invoked only** — never auto-trigger
- Agent never insists, enforces, or suggests the next step unless asked
- No mandatory workflows
- Flexibility is the top priority
- **Every design decision optimizes for cost efficiency** — no wasted tokens, no redundant reads

### 2. Git policy — absolute prohibition

Agent **never** runs, suggests, mentions, or offers any git write command: `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`, `git reset`, `git checkout`, `git stash`, `git clean`, `git branch`, `git worktree`, `gh pr create`, `gh pr merge`, or any variant.

Read-only git is fine: `git diff`, `git log`, `git status`, `git show`.

User may optionally stage files mid-session at their own discretion — agent never suggests this. Committing is always the user's act of approval.

**Enforcement:** hook-level via `git-guardrails-claude-code` pattern, installed globally. Not just a CLAUDE.md text rule — technical block.

### 3. No TDD

Implement first, then write tests. Tests are non-standard and varied. No TDD skill needed.

### 4. No subagent-driven-development

Single session context always preferred. No SDD equivalent.

### 5. Never use AskUserQuestion tool

Never use the structured question/option UI tool. Ask in free-form text instead — any number of questions, freely worded. The UI tool blocks workflow.

### 6. Three-tier context architecture

**Purpose:** Keep session-start token cost under 10K total. Superpowers used 90-100K before doing any work.

**Tier 1 — Always-in-context (CLAUDE.md):**
- ≤80 lines (~2K tokens)
- Project name, stack, structure (brief)
- Hard rules (git prohibition, non-negotiables, behavioral rules)
- Session start instructions
- Routing table: "if working on X, read docs/conventions/Y.md"
- Universal coding conventions (short enough to inline)

**Tier 2 — Session-start reads (every session and after compaction):**
- `docs/work/now.md` — active milestone + folder path
- `docs/work/milestones/<slug>/session.md` — if active milestone has one

That's it. No workflow-rules.md, no separate conventions at session start.

**Tier 3 — Situational reads (routing table in CLAUDE.md triggers these):**
- Stack-specific conventions — separate files, read when working in that area
- `docs/agents/commands.md` — only when about to run commands
- Milestone `spec.md` — read when starting work on a specific milestone
- Domain KB docs — when relevant to the work

CLAUDE.md is a routing table, not a dump of all conventions.

### 7. Behavioral hard rules (in CLAUDE.md)

**Two-strike rule:** After two failed attempts to fix the same issue (especially browser/UI), stop. Don't keep changing code and retrying variations. Write a stuck brief (what was tried, evidence, hypothesis, proposed next step) and discuss with the user.

**Scope discipline:** Agent only touches files explicitly within the current task scope. No opportunistic cleanup, no "while I'm here" refactors. If something outside scope needs fixing, note it in `issues.md` or the backlog and continue.

**No redundant reads:** Never read the same file twice in a session. Never run multiple `ls/find` commands for what could be one tree call.

**Auto-create parent dirs:** Write tool creates parent directories automatically. Never run `mkdir` as a separate step.

**Concise writing:** Every word earns its place. Documentation and responses should be informative but worded concisely — not padded, not verbose.

### 8. Project-level documents

**Product spec** (`docs/spec/product-spec.md`): What the product does, who it's for, v1 scope, v2 scope, what's deferred. Living document — evolves slowly but does evolve.

**Tech spec** (`docs/spec/tech-spec.md`): Tech stack, architecture decisions. Initially a validation artifact ("is this feasible, with what tools?"). Shifts twice: once when the product shifts, once when deeper research changes understanding. NOT final on first write.

**Decisions log** (`docs/spec/decisions.md`): Project-level architectural decisions that span milestones. Format: what was decided, why, what was rejected, what was superseded (and when). This is the most durable artifact — in 6 months you need to know WHY a decision was made, not just what it was.

These are project-level, created once per project during the design phase. Not milestone artifacts.

### 9. Project-level design phase (greenfield)

A separate phase that runs BEFORE any milestone exists. Uses brainstorm/grilling sessions but isn't scoped to a single milestone.

**Flow:**
1. Product brainstorm sessions → `docs/spec/product-spec.md` + `docs/spec/decisions.md`
2. Technical research/validation sessions → `docs/spec/tech-spec.md` (embedded in design sessions, not a separate phase)
3. "What to build first?" session → looks at product spec, proposes first milestone scope → creates `docs/work/now.md` + `docs/work/milestones/m01-<slug>/`
4. First milestone → normal milestone flow begins

Technical research is embedded in design sessions. When a technical unknown surfaces, either: resolve inline (small unknown), or run a dedicated research spike session (large unknown), then return to the design session with new information.

This phase can take multiple sessions. Delapse took three full design sessions before any code was written.

### 10. Milestone structure

Milestones are **emergent** — decided at session start based on what to work on next. No upfront classification ("build" vs "explore" — complexity reveals itself during execution).

Each milestone gets its own folder: `docs/work/milestones/<slug>/`
Sub-milestones also get their own folders: `m08a`, `m08b`, etc. — NOT just categories in the parent.

**Standard folder contents:**
- `spec.md` — required
- `plan.md` — required (after brainstorm)
- `brainstorm.md` — written at start of every /brainstorm session, maintained throughout (see Decision 29)
- `session.md` — created once work begins, updated at natural breakpoints and end of session
- `issues.md` — optional, for bugs/deferred items discovered during implementation

### 11. Discovery handling

**Small change** (a few edits, doesn't require re-thinking the approach): inline correction, note it in `session.md` or `issues.md`, continue.

**Large change** (requires brainstorming + new decisions + rebuilding): stop current work, create a new focused sub-milestone with its own spec + plan, work through it fully, then resume the original. This is not a patch — it's a real sub-milestone.

When a previously completed branch needs to be completely rethought (e.g., Delapse m08: while working on branch B, discovered branch A needed a full redesign): go back, brainstorm branch A afresh, make new decisions, rebuild, then resume branch B with a solid foundation.

### 12. Spec format

```
## Goal
One sentence.

## Motivation
Why this, why now.

## Scope
In: ...
Out: ...

## Decisions
Design + implementation choices locked before coding.

## User Stories
(Only when user-facing — skip for internal tooling, eval packages, backend services.)
As a [actor], I want [feature], so that [benefit].

## Done-When
Concrete, testable criteria — specific observable outcomes, not "feature complete."

## File Layout
(Optional — only when structure is non-obvious or being created from scratch.)
```

### 13. Plan format

The plan skill reads **every file it's going to touch** before writing a single task. Output is per-file specific changes grounded in actual file content.

Not: "implement auth middleware"
Yes: "in `src/background/message-handler.ts`, add handler for `TIMESTAMPS_EXTRACTED` in the switch at line 34, call `storage.save(payload.timestamps)` — storage already imported at line 5"

This prevents mid-implementation loops caused by plans that don't match what's actually in the code.

### 14. Brainstorm → spec → plan flow

Three user-invoked skills, called in sequence when ready. No auto-progression.

**`/brainstorm`** — See Decision 27 for full session structure. Short summary:
- Never use AskUserQuestion tool
- Free-form questions and answers
- Significant questions get their own exchange; minor ones can be grouped
- Agent provides its recommended answer with every question — user reacts
- Writes and maintains `brainstorm.md` (decision tree working memory) throughout
- Ends when user decides they're done
- At close: summarizes locked decisions, suggests /write-spec

**`/write-spec`** — synthesizes the brainstorm conversation + brainstorm.md into `spec.md` using the locked spec format above. No interview — just synthesis.

**`/write-plan`** — reads `spec.md` + every file it'll touch → writes per-file change plan to `plan.md`. Must read actual code before writing any task.

### 15. Knowledge base — domain-specific living files

**NOT** generic category files (`debugging.md`, `patterns.md`). Too broad to be useful.

**YES** domain-specific and context-specific files. Named by domain + context, not artifact type:
- `docs/kb/prompts/eval-strategies.md` — prompt patterns, what worked/didn't, model comparisons
- `docs/kb/stack/zod-patterns.md` — Zod best practices, bad patterns, gotchas from real use
- `docs/kb/debugging/youtube-ui-extension.md` — YouTube DOM debugging in extension context specifically
- `docs/kb/product/ideas.md` — future directions, cost strategies, untried approaches

Living files — start small, grow over time. Referenced by CLAUDE.md routing table.

**KB writes are autonomous and immediate** — agent writes to the appropriate KB file the moment it recognizes something worth saving. Not at session end. Not batched. Right when the information surfaces. Brief inline note ("[saved to docs/kb/prompts/eval-strategies.md]"), then continue. User reviews and edits later.

What gets saved: prompt construction lessons, model comparisons, stack-specific gotchas, debugging steps that worked, optimization tactics, product direction ideas, API-specific behavior discovered during implementation, TypeScript/tooling issues and their fixes.

### 16. Backlog

No `roadmap.md`. Instead: `docs/work/backlog.md`.

- Flat, no categories, no ordering, no status
- Completely open-ended — items can be one-liners or multi-paragraph
- Anything: feature ideas, future technical work, models to test, optimizations to try, distribution experiments, cost reduction ideas
- Agent adds to it mid-session when relevant ideas surface — immediately, not at session end
- No commitment implied by presence on the backlog

### 17. `now.md` format

Minimal. Only job: tell the agent which milestone is active and where to find it.

```markdown
# Active Milestone

**Name:** <name>
**Folder:** docs/work/milestones/<slug>/
**Goal:** <one line>

## Completed
| Milestone | Folder |
|---|---|
```

"Next action" field: only included if the user explicitly wrote it when closing the previous milestone. Agent never invents it.

### 18. Session continuity

**`session.md` per milestone:** Written at natural breakpoints during a session and at session end. Format adapts to the session type — not a fixed implementation-biased template. See Decision 33 for the adaptive format.

**The /checkpoint skill:** When explicitly invoked by user, writes session state to the active milestone's `session.md`. Adaptive output — agent answers "what would someone need to read to continue this session without having been here?" and writes that. Code context section only appears if there's code to capture.

**Resume after long break:** No special flow. Just ask the agent to summarize the project state from existing docs. That's sufficient.

### 19. Verification

No separate verification skill. Done-when sequence:
1. Agent completes all tasks in `plan.md`
2. Agent runs the validation commands agreed at session start
3. Agent self-checks against done-when criteria in `spec.md`
4. User manually tests
5. Move on

### 20. Validation commands

Not a fixed script. Context-dependent:
- Depends on which part of the codebase the agent is working in (e.g., eval package only vs. extension vs. extension + backend)
- Tests are selective and expensive (15-20 seconds) — only run what's relevant to what changed
- Defined at the start of implementation (before the plan phase begins)
- Stored in the milestone's session.md or plan.md

Agent and user agree upfront: "for this task, run X." Not hardcoded, not automated.

### 21. Scripts and tooling

**Tree generation** — clean bash script, outputs filtered project tree to stdout. One call instead of multiple `ls/find`. `scripts/tree.sh [path]`.

**Merge command** — merge files/folders into a single stdout block with fenced code sections. `scripts/merge.sh path1 path2 ...`. One Bash call = all files read.

**Scripts design principles:**
- Clean and readable — simple bash
- NOT the `node scripts/run.js <command>` runner pattern
- Output directly to stdout — no intermediate file that needs a second read
- Context-dependent: different commands for different workspaces

### 22. Skills — what we adopt vs. build

**Adopt from mattpocock-skills (with adaptation):**

| Skill | Adaptation |
|---|---|
| `diagnosing-bugs` | Adopt as-is. Phase 1 (feedback loop first) is exactly what was missing. Remove CONTEXT.md/ADR refs, replace with session.md + KB files. |
| `git-guardrails-claude-code` | Set up globally (all projects). Hook-level enforcement. |
| `improve-codebase-architecture` | On-demand. Use when codebase feels messy. |
| `prototype` | Throwaway code to answer a design question. |

**Build custom (in our subdirectory, not the mattpocock repo):**
- `/brainstorm` — decision-tree grilling with brainstorm.md working memory
- `/write-spec` — synthesize brainstorm.md + conversation → spec.md
- `/write-plan` — read codebase → file-by-file plan.md
- `/checkpoint` — adaptive session.md writer (not the mattpocock handoff format)

**Borrow template, skip the skill:**
- `to-prd` — too tightly coupled to mattpocock's issue tracker. Borrow spec format inspiration only.

**Skip entirely:**
- `tdd`, `resolving-merge-conflicts`, `to-issues`, `triage`, `setup-matt-pocock-skills`, `decision-mapping`

**UI skills (optional, project-level, not in core framework):**
- `taste-skill` — anti-slop frontend. GSAP dependency concern. Try on real UI task before committing.
- `ui-ux-pro-max-skill` — 161 design rules. Python dependency concern. Auto-activates (needs override).

### 23. Three framework scenarios

**Greenfield (new project from scratch):**
1. Product design phase (multiple sessions) → `docs/spec/product-spec.md` + `docs/spec/tech-spec.md` + `docs/spec/decisions.md`
2. "What to build first?" session → first milestone scoped → `docs/work/now.md` created
3. Milestone flow begins (repeating cycle)

**Migration (existing project, like Delapse):**
Not a redo — a mapping + audit session:
- Product spec → keep, move to `docs/spec/product-spec.md`
- Decisions log → keep as-is
- Roadmap → rename/move to `docs/work/backlog.md`
- Technical research file → review for staleness: locked decisions → tech spec, learnings → KB files, unresolved → backlog
- CLAUDE.md → rewrite from new framework template
- `now.md` → update to new minimal format
- Existing milestone folders → keep or archive completed ones

**Milestone flow (repeating cycle):**
1. User picks next thing to work on (from backlog or they know)
2. `/brainstorm` → decisions locked, brainstorm.md maintained throughout
3. `/write-spec` → `spec.md`
4. Agree on validation commands for this task
5. `/write-plan` → `plan.md` (reads all relevant files first)
6. Implement (agent follows plan, writes to KB immediately when something worth saving surfaces)
7. Verify (plan complete + validation commands + spec done-when + user manual test)
8. `/checkpoint` → `session.md` updated
9. Update `now.md` completed table
10. Pick next milestone

### 24. Code review

Solo dev. No formal code review step by default. `/code-review` available on demand when wanted. Not part of the standard milestone flow.

### 25. Packaging

Deferred to end. The framework will have:
- Custom scripts
- Possibly hooks and settings
- Skills (in `.claude/commands/` as markdown files)

Decide structure and packaging after we know everything it contains.

---

### 26. Build location — subdirectory approach

New framework files go in a separate subdirectory during development. Do NOT write into the live project directories. Once the full design is approved and all files are ready, move them into the correct live positions.

Subdirectory location TBD when we start building (something like `temp/framework-build/` or `docs/framework-draft/`).

### 27. /brainstorm — session structure (4 phases)

A brainstorm session has four phases:

**Phase 0 — Context read** (only when relevant):
- Milestone or technical brainstorm: agent reads the relevant parts of the codebase or spec that bear on what's being designed. Not everything — just what's relevant to the decisions being locked.
- Product-level brainstorm (before any milestone or code exists): skip this phase.

**Phase 1 — Open:**
Agent states what it understands as the goal and identifies the main branches to work through. Not a formal hypothesis — just orientation. Then writes the initial brainstorm.md branch tree (top-level branches only at this point).

**Phase 2 — Walk the decision tree:**
For each significant branch: agent poses the question AND gives its recommended answer. User reacts (agree / disagree / "yes but also..." / "actually it's more like..."). Agent folds in the response and updates brainstorm.md. Moves to next branch.

Minor questions can be grouped: "Three small things to lock: [list]. Here's my take on each: [takes]. Anything you'd change?"

New sub-branches that emerge during conversation get added to brainstorm.md immediately.

**Phase 3 — Assumption check:**
Before closing, agent names key assumptions being made that haven't been validated: "We're betting that X is true. If it's not, we'd need to rethink Y." User decides whether to treat these as blockers or note them in backlog.

**Phase 4 — Close:**
User says they're done. Agent gives a concise summary of locked decisions. Suggests /write-spec next.

**Concrete example — milestone brainstorm: "add hotkeys to the extension"**

Agent opens: "Here's what I understand: configurable hotkey that triggers the card popup. Main decisions are (1) where hotkey listening lives architecturally, (2) default key, (3) settings UX, (4) storage, (5) edge cases. Let me work through each. First: content script or background? My take: content script — background workers can't see keyboard events on the page. Agree?"

User: "Content script is right. But we need to not trigger if the user is typing in YouTube search."

Agent updates brainstorm.md (adds sub-branch: input guard), responds: "Right — check `document.activeElement` against input/textarea/contenteditable before handling. Standard pattern. Locked. Next: default hotkey. Alt+C — not grabbed by Chrome or YouTube. Alt+Space conflicts with some OSes. Alt+A is YouTube autoplay. Alt+C feels safe. Any objection?"

...session continues branch by branch.

### 28. /brainstorm — agent commits to a position

For every question, the agent provides its recommended answer. Not "what do you think about X?" but "here's what I'd do for X, and why — does this hold?"

Rationale (from mattpocock's grilling mechanic): reacting to a guess is faster than generating an answer from scratch. Agent commits to a position; user confirms or corrects. This is what makes the grilling approach productive.

The agent should be willing to be visibly wrong. If the user pushes back, agent reconsiders genuinely — doesn't just capitulate, but doesn't defend a wrong answer either.

### 29. brainstorm.md — working memory file

Every brainstorm session starts by writing a branch tree file before asking any questions. Maintained throughout by agent judgment (not mechanical updates — agent decides when something branch-relevant happened).

**Location:**
- Milestone brainstorm: `docs/work/milestones/<slug>/brainstorm.md`
- Product-level brainstorm (before any milestone): `docs/spec/brainstorm.md`

**Format:**
```markdown
# Brainstorm — [Topic]
_Started: [date]_

## Branches

- [x] **Listener architecture**
  - Decision: content script (background workers can't see keyboard events)
  - [x] Input guard: check activeElement — not input/textarea/contenteditable
  
- [ ] **Default hotkey**
  - Candidate: Alt+C (not grabbed by Chrome/YouTube/common OSes)
  - [ ] Confirm no YouTube player internal conflicts
  
- [ ] **Settings UX**
  - [ ] Location in settings panel
  - [ ] Key capture mechanism (keydown handler during assignment?)
  - [ ] Conflict detection behavior
  
- [ ] **Storage**
  - [ ] chrome.storage.sync vs local
  - [ ] Storage key name and default value

- [ ] **Edge cases**
  - [ ] Fullscreen mode
  - [ ] Iframe embeds
```

**Update trigger:** Agent decides when to update — new branch discovered, branch fully resolved, user answer reveals a sub-branch, important new constraint surfaces. NOT after every exchange.

**Self-sufficiency after compaction:** [x] items include the decision AND reasoning inline, not just a checkmark. Reading brainstorm.md after compaction restores full decision tree state — no need to reconstruct from conversation history.

**What /write-spec uses:** brainstorm.md is the primary input to /write-spec. The skill reads this file (plus conversation context) instead of reconstructing decisions from the full conversation history.

### 30. Three-layer context capture pattern

Context capture operates at three layers, all triggered by agent judgment:

**Layer 1 — Session working memory (session-phase-specific):**
- During brainstorm: `brainstorm.md` — decision tree, updated continuously
- During implementation: relevant code state captured in session.md
- During research/debugging: key findings captured in session.md

**Layer 2 — Durable knowledge (immediate, any phase):**
Triggers:
- A prompt pattern worked or failed → write to `docs/kb/prompts/<topic>.md`
- A debugging approach resolved something non-obvious → write to `docs/kb/debugging/<domain>.md`
- A stack-specific gotcha was discovered → write to `docs/kb/stack/<lib>.md`
- A product direction idea came up → write to `docs/work/backlog.md`
- A project-level architectural decision locked → write to `docs/spec/decisions.md`

Key rule: **write immediately when it surfaces, not at session end.** Brief inline note, then continue working.

**Layer 3 — Session state checkpoint:**
`session.md` — written at natural breakpoints (major phase completed, before a risky change) AND at session end. See Decision 33.

### 31. Immediate capture rule

Write to KB files, backlog.md, decisions.md when important information surfaces — not at session end.

Why: agents tend to defer saves to session end, then compaction happens, session ends abruptly, or the intention to save gets lost. By the time "session end" arrives, the window to capture has often closed.

Mechanics: agent writes in-flow, adds a brief inline note ("[saved to docs/kb/prompts/eval-strategies.md]"), and continues. No interruption. User reviews and edits later.

### 32. Post-compaction reading rule

At session start and after compaction: read `now.md` + active `session.md` only. Do not spray-read to orient.

The spray-read problem: after compaction, agent "feels" like it needs to re-read everything (spec.md, plan.md, conventions.md, source files) and burns 70-80K tokens before doing anything useful.

The fix: session.md should be self-sufficient for resuming. Read other files only when a specific action requires them — not for orientation.

As the session continues beyond the start, the agent reads whatever files it needs for the work at hand. The restriction is specifically to the orientation phase after compaction or at session start.

### 33. session.md is adaptive

session.md captures whatever type of session this was. Format adapts to the session type. Not implementation-biased, not a fixed template.

**Examples by session type:**

Implementation session:
- Task state (completed, in-progress, not started from plan.md)
- Code context: exact snippets for what the next session will need to read or extend
- Resume: specific first file to open, first edit to make
- Open blockers

Research session:
- What was researched and where
- Key findings, what was learned
- What's still unresolved
- Where to look next, what to try

Brainstorm session:
- Where the decision tree stands (brief summary — brainstorm.md has the full detail)
- What's locked, what's open
- What the next session should do (continue brainstorm? move to /write-spec?)

Design/planning session (like this one):
- Decisions made this session with context
- What's still open
- Proposed next steps

Debugging session:
- What was tried, exact commands and results
- Current best hypothesis
- What to try next
- Any important discoveries about the codebase

**The guiding question for writing session.md:** "What would someone need to read to continue this session without having been here?" Write that. Nothing more.

### 34. /checkpoint skill is not rigidly templated

The /checkpoint skill asks the agent to answer one question: "What would someone need to read to continue this session without having been here?"

Then write that. The output format adapts to session type (see Decision 33). There are no mandatory sections. Code context section only if there's code context worth capturing. Resume steps only if there's a specific next action.

The existing checkpoint skill in `.agents/skills/checkpoint/SKILL.md` has good bones but is too implementation-biased. The section structure (Completed / In progress / Not yet started / Code context) should be treated as optional scaffolding for implementation sessions, not as a required format for all sessions.

---

### 35. docs/guides/ replaces docs/kb/

`docs/kb/` concept dropped — too generic. Replaced by `docs/guides/`. Has subfolders/grouping (exact structure emerges during build).

Three types of content:
1. **Tool/skill guides** — our patterns and overrides for specific tools: `docs/guides/playwright-cli.md`, `docs/guides/improve-codebase-architecture.md`
2. **Stack guides** — library-specific patterns and gotchas: `docs/guides/stack/zod.md`, `docs/guides/stack/tanstack-query.md`
3. **Domain guides** — how we approach specific problem domains: `docs/guides/prompt-engineering.md`, `docs/guides/eval-design.md`

CLAUDE.md routing table references these. Agent reads via routing table when relevant — not speculatively.

### 36. conventions.md eliminated

`docs/agents/conventions.md` is NOT carried forward.

Split:
- Universal coding rules (naming, imports, functions, errors, abstraction) → inline in CLAUDE.md as a short "Coding Conventions" section. Short enough for 80-line budget.
- Stack-specific rules → separate files in `docs/guides/stack/<lib>.md`, read via routing table.

### 37. recommended-tools.md → docs/guides/tools.md

`docs/agents/recommended-tools.md` moves to `docs/guides/tools.md`. Living reference: which skills, MCPs, and tools are active. Updated as tooling changes.

### 38. Final skill suite

**Custom skills (built in temp/framework-build/):**
- `/brainstorm` — decision-tree session with brainstorm.md working memory
- `/write-spec` — synthesize brainstorm.md → spec.md
- `/write-plan` — read all files → per-file plan.md
- `/checkpoint` — adaptive session.md writer
- `/debug` — adapted diagnosing-bugs
- `/review-guide` — NEW: review a specific guide file and propose updates

**From mattpocock (adopt with adaptation):**
- `improve-codebase-architecture` — on-demand, with HTML override (Decision 40)
- `prototype` — on-demand, throwaway code for design questions

**From mattpocock (DROP):**
- `git-guardrails-claude-code` — not needed (Decision 39)
- `grill-me` / `grilling` / `grill-with-docs` — replaced by /brainstorm
- `handoff` — replaced by /checkpoint
- All others (tdd, triage, to-issues, to-prd, etc.)

**External opt-in skills:**
- `taste-skill` — user-invoked, landing pages/portfolios/redesigns, no Python dep (Decision 54)
- `ui-ux-pro-max-skill` — user-invoked only (override required), Python dep (Decision 55)
- `playwright-cli` — reference skill for browser automation (Decision 56)

**Delete entirely:** Superpowers.

### 39. git-guardrails-claude-code not needed

Our `.claude/settings.json` deny list is already more comprehensive than git-guardrails' default block patterns. The hook adds nothing.

Deny list covers: add, commit, push, pull, reset, rebase, merge, checkout, switch, restore, rm, mv, stash, clean, cherry-pick, revert, branch -, worktree add/remove.

### 40. improve-codebase-architecture override

Base skill writes HTML report to /tmp and opens in browser. Skip that step. Present architectural candidates as markdown in conversation instead.

Override documented in `docs/guides/improve-codebase-architecture.md`.

### 41. Telegraphic writing — constant behavioral rule

CLAUDE.md behavioral rule (not an invokable mode):

> "Write telegraphically: fragments over full sentences where meaning is preserved. No padding, no restating what was just said. Every word earns its place."

Applies to all responses and documentation.

### 42. External skill overrides and extensions pattern

`docs/guides/<tool-or-skill-name>.md` contains two things:
1. **Override content** — what to ignore or modify in the base skill behavior
2. **Extension content** — our usage patterns, best practices, gotchas

External skills are never modified directly. Customizations are layered via guide files. CLAUDE.md routing table references these.

### 43. Implementation mode option in plan.md

Optional header field in plan.md:

```
## Implementation Mode
continuous
```

`continuous` (default): agent implements all tasks, reports at end.
`review-after-each`: agent stops after each task, writes a brief summary, waits for explicit "continue." Compaction between tasks is viable in this mode for very large plans.

Agent sets the mode based on user instruction at start of implementation.

### 44. Large plan file splitting

Split plan.md when it would exceed ~1000 lines. Split by logical phase/area with thematic names:
- `plan-foundation.md` — types, DB schema, shared utilities
- `plan-api.md` — route handlers, services, middleware
- `plan-ui.md` — components, pages, styles

Each file is self-contained (includes its own Validation Commands header). Split decisions made at natural dependency boundaries, not arbitrary line count.

### 45. /brainstorm scope — not implementation-specific

Works for any structured thinking session: product design, market research, technical exploration, architectural decisions, milestone-specific feature design, research sessions.

Phase 0 context read is conditional on session type. Product/market sessions with no code: skip Phase 0. Technical/milestone sessions: read relevant codebase/spec sections.

Skill language must not be implementation-biased.

### 46. Technical research as session type

Handled by /brainstorm. Decision tree branches = research questions to answer. /checkpoint captures findings in research session format. Findings go to `docs/guides/` immediately via immediate capture rule. No separate /research skill needed.

### 47. Feedback loop for guides — agent suggests, user approves

Three modes, all require approval before any guide file is updated:

1. **During work:** agent notices possible guide improvement → inline suggestion → user approves → agent updates
2. **Manual invocation:** `/review-guide docs/guides/<file>.md` — agent reviews guide against session learnings, proposes specific edits, user approves each
3. **Direct reference:** user points at a guide → agent reviews → proposes updates

Agent NEVER auto-updates guide files.

### 48. /review-guide skill

New custom skill. User-invoked. Takes a guide file path as argument.

Steps:
1. Read specified guide file
2. Consider what was learned/experienced in current session relevant to this guide
3. Propose specific, concrete edits (not vague "update X section")
4. Write each approved edit
5. Brief summary of what changed

### 49. Visualization framework — separate session

Mermaid is NOT the default. In practice: LLMs generate broken Mermaid frequently, loop on fixes, format lacks flexibility.

Free-form text-based diagrams preferred. The visualization framework will be designed and tested empirically in a dedicated session — multiple scenarios tested before any approach is committed. Session will: enumerate scenarios → test candidate formats for each → decide format per scenario type → produce `docs/guides/visualization.md`.

HTML/SVG: generally looks terrible when AI-generated. Only if text approaches genuinely fail for a specific scenario.

### 50. Session-start conditional now.md reading (supersedes part of Decision 32)

- User's opening message specifies what to work on → read that milestone's `session.md` only. Skip `now.md`.
- User provides no context → read `now.md` to find active milestone, then read its `session.md`. Stop.

`now.md` is a navigation tool, not an orientation file. Only needed when destination is unknown.

### 51. CLAUDE.md additional behavioral rules (additions to Decision 7)

Missing from the initial draft. Add to template:

- **Auto-create parent dirs:** Write tool creates parent directories automatically. Never run `mkdir` as a separate Bash step.
- **Telegraphic writing** (see Decision 41)
- **Immediate capture rule:** When important information surfaces (learning, decision, gotcha, idea) — write it to the appropriate guide/spec file immediately. Don't defer to session end. Brief inline note + continue.
- **Guide maintenance:** If a guide file appears outdated, incomplete, or incorrect based on current work — suggest the update to user. Don't auto-update. Wait for approval.

### 52. /debug — Phase 0 calibrate (new phase before original Phase 1)

Before building the feedback loop, assess two things:

1. **What does the user know?** What they've observed, what they've already tried, what environment.
2. **What tools are available?** playwright-cli? test runner? DB access? Logs? Determines which Phase 1 strategies are viable.

For complex or environment-specific bugs: discuss debugging approach WITH user before starting Phase 1. Don't plan alone what requires user collaboration to execute.

User is a potential loop participant throughout — not just a Phase 3 hypothesis validator. Can be asked to run DB queries, click through UI flows, provide artifact access, or run commands the agent can't.

### 53. /debug — full adaptation from diagnosing-bugs

Five changes from the original mattpocock skill. Everything else (6 phases, all checklists, feedback loop discipline) verbatim.

1. **Top context-read** — "read CONTEXT.md and ADRs" → "check active milestone's session.md for debugging context, and relevant `docs/guides/stack/` files"
2. **Phase 0 (new)** — calibrate tools and user knowledge before Phase 1 (Decision 52)
3. **HITL script reference** — drop specific `scripts/hitl-loop.template.sh` path. Keep concept: "a structured HITL loop script"
4. **Phase 5+6 commit/PR message** — remove (git prohibition). Correct hypothesis goes in session.md instead.
5. **Phase 6 post-mortem** — "hand off to /improve-codebase-architecture" → "note architectural insight in `docs/guides/debugging/<domain>.md` and add to `docs/work/backlog.md`"

### 54. taste-skill — included as opt-in

User-invoked only. No Python dependency. Scope: landing pages, portfolios, redesigns (NOT dashboards, tables, product UI).

How it works: reads brief → infers aesthetic direction (vibe words, audience, references, brand assets) → sets 3 dials (Design Variance, Motion Intensity, Visual Density) → generates code matching that aesthetic. Anti-AI-default discipline (avoids AI purple gradients, generic glassmorphism, etc.).

### 55. ui-ux-pro-max-skill — included with hard override

Override requirement: NO auto-invocation despite "Must Use" language in the skill. User-invoked only.

Python 3 dependency. Install separately. Document in `docs/guides/tools.md`: verify Python available before use.

Functions as a searchable design database (161 palettes, 57 font pairings, 99 UX guidelines, 25 chart types across 10 stacks). Not a code generator — produces design recommendations that inform implementation.

### 56. playwright-cli skill — included

Reference skill for browser automation. Key integration points:
- /debug Phase 0: listed as available tool if playwright-cli is installed
- /debug Phase 1 strategy 4: headless browser feedback loop (already in diagnosing-bugs)
- Project-level patterns in `docs/guides/playwright-cli.md`

### 66. `execute.md` — new core workflow guide

Covers the full implementation phase from plan.md to milestone close.

**Pre-execution:**
- Read plan.md critically before writing any code — flag gaps, unclear steps, missing dependencies
- Confirm validation commands (in plan.md or agreed at session start)
- Note execution mode: `continuous` (default) or `review-after-each` (user sets at start)

**Per-task (continuous mode):**
- Mark task `[x]` in plan.md when complete
- Run type-check + lint after every task
- If check fails: fix immediately; if two attempts fail (two-strike rule), stop and report
- One-line inline note after each task: what was done, type status. Configurable to silent.
- Immediate capture: discovered issues → `issues.md`; scope-relevant decisions → `context.md`

**Per-task (review-after-each mode):**
- After each task: brief summary + wait for explicit "continue" before proceeding
- Same verification cadence as continuous

**End of all tasks:**
- Run full suite: tests + build
- No completion claim without command output — evidence before assertions always
- If full suite fails: fix before claiming done

**Milestone close (last section):**
1. Check done-when criteria in spec.md — confirm all met
2. Update now.md completed table
3. Write handoff.md only if session is ending before next milestone begins
4. Optionally suggest next backlog item

### 67. Context pulse — behavioral rule (applies everywhere)

`[CONTEXT PULSE]` output (from PostToolUse hook) is a judgment signal, not a mechanical trigger. When seen:
- Reason: how much context is left? Is the next operation significant (debug loop, long implementation, new brainstorm branch)?
- If remaining context may not be enough for the planned operation → flush relevant state first
- Which files to flush: `context.md` always; `brainstorm.md` if in brainstorm phase; `plan.md` task marks if mid-execution
- Config changed from `threshold:90` to `heartbeat:5` — reading every 5 tool calls for regular visibility

### 68. External plugins model

- **`docs/guides/tools.md`** — curated index: what's installed, when to use it, setup notes, our customizations. Read via CLAUDE.md routing when doing relevant work.
- **Guide wrappers** (`docs/guides/domain/<tool-name>.md`) — only when we have actual overrides or usage patterns (playwright-cli, improve-codebase-architecture). Not for tools used as-is.
- **Discovery** — automatic via platform (installed plugins appear in agent's context without manual listing). tools.md is not the discovery mechanism — it's the "when and how we use it" layer.
- **Reference-only tools** (taste-skill, ui-ux-pro-max-skill) — listed in tools.md only, no guide wrappers.

### 69. Guide update model — notes-first, review-gated (supersedes D47)

Agent NEVER edits guide files during active execution or mid-session work.

**During a milestone:** when the agent notices something worth improving in a guide, it writes a note to `docs/work/milestones/<slug>/guide-notes.md`. No live edits.

**At milestone close** (last section of execute.md): agent surfaces `guide-notes.md`, discusses each item with user, then edits the actual guide files for approved items. If no `guide-notes.md` exists, skip silently.

---

### 70. merge-files outputs to stdout (no file)

`merge-files.js` writes all output to stdout — no output file generated. Agent consumes the result directly in one command call, no second read needed.

### 71. merge-files file format — fenced blocks, no index table

Each file becomes a fenced code block: ` ```lang path/to/file `. No separate File Index table at the top. Path in the opener is sufficient for LLM navigation.

### 72. merge-files threshold guard — 2000 lines

Default limit: 2000 lines. If total output exceeds the limit and `--force` is not passed: output a warning to stdout listing each file with its line count and the total. Agent narrows scope or passes `--force` to bypass.

### 73. merge-files flags — --ext, --except, --force

- `--ext ts,tsx,md` — include only files with listed extensions (comma-separated, dot optional)
- `--except pattern` — exclude files matching glob (repeatable)
- `--force` — bypass the 2000-line threshold
- Positional args = files, folders (recursive), or shell-expanded globs
- Default excluded segments: `.git`, `node_modules`, `dist`, `.turbo`, `__pycache__`, `temp`, `.venv`

### 74. merge-files blank line collapse — always on

Consecutive blank lines collapsed to one. No flag — always applied. Reduces noise without stripping meaningful content.

### 75. merge-files strip-comments — deferred to future

Not in v1. `// TODO` comment left in script. Risk: TS `@ts-ignore`, `declare const`, and type comments make blanket comment stripping unsafe as an always-on behavior.

### 76. merge-files --git flag — skipped

Not implemented. Agent composes the same result: `git diff --name-only` → pass file list as positional args to merge-files. Keeps the script focused.

---

### 77. tree.sh — no default depth

Full tree by default. `--depth N` is opt-in. Tree output is one line per file/folder — even 1000-file repos produce manageable output. No line threshold needed.

### 78. tree.sh — hidden files always on

`-a` always enabled. `.claude/`, `.agents/` are meaningful structure. Use `--except .github` etc. to hide specific dotfolders.

### 79. tree.sh — --except supports names, folders, and globs

`--except` accepts: bare names (`__tests__`), dotfolders (`.github`), glob patterns (`*.md`, `*.lock`). Maps to tree's `-I` flag (pipe-separated) and find's `-name` prune expression.

### 80. tree.sh — default excludes

`node_modules`, `.git`, `dist`, `build`, `.next`, `.turbo`, `__pycache__`, `.cache`, `coverage`, `out`, `.svelte-kit`, `temp`, `.venv`, `vendor`, `tmp`

---

### 81. Visualization guide is a folder

`docs/guides/core/visualization/` with two files:
- `GUIDE.md` — entry point: text formats, when to use what, explanation sequencing, HTML sketch rules
- `html-sketch.html` — reusable HTML template

Folder justified because it contains a non-markdown asset (the HTML template) that must live alongside the guide.

### 82. HTML template contains infrastructure only — no component structure

`html-sketch.html` ships with: zinc CSS vars (`:root` + `.dark`), body layout, light/dark toggle, scenario wrapper (`.scenario`, `.scenario-label`, `.scenario-desc`). No panel, item, or component-specific CSS. Agent adds component structure per sketch. Keeps the template reusable across all component types.

### 83. HTML sketch layout: universal principles, no named modes

Do not define fixed layout modes (multi-scenario, single, page layout, etc.) — they're too prescriptive and will miss real-world combinations. Instead, universal principles that work for any arrangement:
- Each scenario/state gets its own isolated column
- Labels external: above the component with a clear gap, never inside
- Component = real UI only; no annotations or scenario text inside
- Dimensions realistic for what's being sketched
- Consistent scale across all columns
- Left → right = natural reading order (before → after, normal → error)
- Columns compare; vertical stacking for sequential flows
- Past ~4 columns: reconsider grouping or split into two sketches

### 84. Explanation sequencing before HTML

When visual judgment is needed: plain text first (vocabulary + trade-off framing) → HTML once mental model is aligned. If user corrects mental model mid-sketch: stop generating visuals, read prior design docs first. After feedback: fix all issues at once — not one at a time.

### 85. HTML one-shot rules

To avoid styling iteration rounds: always copy `html-sketch.html` as starting point (never reconstruct CSS from scratch), set `.panel` or container width to realistic dimensions, define item/element variants with left-border accent + `color-mix(in srgb, #hex 8%, transparent)` background, never stack `opacity` on a CSS var, always include light/dark toggle, keep labels external.

---

### 57. `session.md` → `handoff.md`

Renamed. Same purpose: captures resumption state when a session ends mid-implementation. User-triggered only — agent never writes it autonomously. Agent recognizes "save context", "handoff" from free text and follows the handoff guide.

### 58. `context.md` per milestone (new)

`docs/work/milestones/<slug>/context.md`. Living document — agent creates it when scope is clear (could be during brainstorm phase, after spec, after plan — agent uses judgment). Updated whenever significant new scope information surfaces.

**Contains:**
- Task scope summary (what this milestone is trying to accomplish)
- Key technical decisions already locked
- Relevant files/modules the agent will likely touch
- Scoped tree command (to run fresh — not embedded output)
- Relevant guides list (paths from `docs/guides/`)

Primary context restoration artifact. Must be comprehensive enough to restore full working context after compaction. More important than handoff.md — will exist more often.

### 59. Session-start read rule (supersedes D32, D50)

- `context.md` exists for active milestone → read it; skip `now.md`
- No `context.md` AND no task context in user's opening message → read `now.md` to find milestone, then read `handoff.md` if it exists
- User's opening message specifies what to work on → read that milestone's `context.md` + `handoff.md`; skip `now.md`

`now.md` is navigation only — needed when destination is unknown.

### 60. Guide system replaces skill system (supersedes D22, D38)

No `.claude/commands/`, no `.claude/skills/`. All behaviors = guides. Tool-agnostic — works with Claude, Codex, opencode, any platform.

**Format:**
- Frontmatter: `name` + `description` (same as skill files, no additional fields)
- Large guides → folder with main file + reference files (like skill folder pattern)
- Small guides → single `.md` file

**Discovery:** `docs/commands/guides.sh` script scans all guide frontmatter, outputs `- path | description` per guide. Agent runs it when scope is clear to discover relevant guides.

**CLAUDE.md:** Lists core guides with name + description inline. Agent self-selects which to read based on situation. No trigger conditions ("if writing code, read X") — descriptions provide enough context for agent to decide.

**Trigger:** Agent recognizes free-text intent from user ("let's brainstorm", "write the spec") — no slash commands, no formal invocation.

### 61. Guide folder structure

```
docs/guides/
  core/     — workflow behaviors + universal technical guides (listed in CLAUDE.md)
  domain/   — problem-domain guides (chrome-extension, prompt-engineering, etc.)
  stack/    — library/stack-specific guides (zod, pg-boss, tanstack-query, etc.)
```

Guide-specific scripts live in the guide's own folder alongside the guide file.

### 62. Core guides — initial set

**Workflow (behavior guides — trigger from free text):**
- `brainstorm` — decision-tree grilling session with brainstorm.md working memory
- `write-spec` — synthesize brainstorm.md → spec.md
- `write-plan` — read codebase → per-file plan.md
- `handoff` — write handoff.md when session ends mid-implementation
- `debug` — adapted diagnosing-bugs (Phase 0 + 5 surgical changes)
- `review` — ad-hoc code quality review
- `verify` — check work against active guides (see D63)

**Technical (reference guides — read when about to do that type of work):**
- `testing` — minimize mocks, real HTTP/DB, coverage blocks, file splitting
- `comments` — file header format, inline rules, write-at-code-time
- `visualization` — text-tree in code block, no Mermaid, telegraph style

### 63. `verify` guide

Checks implementation (or plan, or spec) against the guides listed in `context.md`. Runs at any milestone phase — not implementation-only. Agent reads context.md to find which guides are active, reads the code/plan/spec, checks for deviations, proposes specific corrections. Separate from `review` (which is open-ended quality review).

### 64. `docs/commands/` folder (supersedes D21 `scripts/` location)

Standalone utility scripts live under `docs/commands/` — not at project root. Keeps the framework files self-contained under `docs/` and avoids conflicting with the project codebase's own scripts folder.

**Scripts:**
- `tree.sh` (or referenced inline in CLAUDE.md if simple enough)
- `merge.sh`
- `guides.sh` — scans guide frontmatter, outputs `- path | description` for every guide

### 65. `brainstorm.md` stays separate from `context.md`

Acknowledged overlap: both are per-milestone living documents. Kept separate because they serve distinct phases and different purposes — brainstorm.md is the decision tree during the brainstorm phase; context.md is the full scope context document across all phases (created once scope is clear, lives through implementation and beyond).

---

## Skill Research Findings (from 2026-06-25 session)

Analyzed these existing skills to inform /brainstorm design:

**mattpocock `grilling`** (5 lines, the backbone of our /brainstorm):
> "Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer. Ask the questions one at a time, waiting for feedback on each question before continuing. If a question can be answered by exploring the codebase, explore the codebase instead."

This is the core mechanic. We take: walk each branch, commit to a recommendation per question. We adapt: allow grouping of minor questions.

**superpowers `brainstorming`** (heavy, most of it is bloat):
- Good: scope check — "Before asking detailed questions, assess scope: if the request describes multiple independent subsystems, flag this immediately."
- Good: the HARD-GATE concept (don't implement until design approved) — we have this implicitly (skills are user-invoked)
- Bad: AskUserQuestion preference, mandatory tasks/checklists, auto-invoking next skill, committing to git mid-session, visual companion, rigid one-at-a-time rule

**agent-skills `interview-me`** (deeper intent extraction):
- Hypothesis + confidence approach: state what you think the goal is before asking anything
- "What would you actually want if you didn't have to justify it?" — catches sophistication-signaling answers
- 95% confidence stop test: can I predict the user's reaction to the next 3 questions?
- We borrow: assumption check at end, willingness to be wrong about guesses
- We don't use: the rigid hypothesis/confidence/restate structure (too formal for milestone brainstorms)

**agent-skills `idea-refine`** (divergent thinking):
- Explicit assumption surfacing: name what you're betting is true but haven't validated
- "Not Doing" list — explicit exclusions
- We borrow: the assumption check at end (Phase 3 of our brainstorm)

**What we DO NOT take from any existing skill:**
- AskUserQuestion tool
- Multiple choice preference
- Auto-invoking next skill
- Writing docs mid-session (brainstorm.md is working memory, not a "doc")
- Git commits as part of the skill
- Rigid step-by-step checklists
- Visual companion / browser mockups

---

## Session Start — Correct Behavior

At the start of every session and after every compaction:
1. CLAUDE.md is already in context — no explicit read needed
2. **If user's opening message specifies what to work on:** read that milestone's `session.md` only. Skip `now.md`.
3. **If user's opening message has no context:** read `now.md` to find active milestone, then read its `session.md`.
4. **Stop. Do not read more files to orient. Read other files only when an action requires them.**
5. User's opening message directs what to do next — follow that

Session-start cost target: under 10K tokens before doing any actual work.

The spray-read antipattern: reading spec.md, plan.md, conventions.md, and source files "to orient" at session start. This is what causes the 70-80K token burns. session.md should be self-sufficient. If it isn't, the problem is in session.md quality, not fixable by reading more files.

---

## What Still Needs to Be Planned

- **`execute` guide** — planned in D66. Needs: writing to guide-file level.
- **`handoff` guide** — replaces /checkpoint. Needs: exact content, how agent identifies active milestone, behavior when no active milestone.
- **`verify` guide** — new (D63). Needs: exact steps, how it reads context.md, what "deviation" looks like in practice.
- **`review` guide** — ad-hoc code review. Needs: exact steps.
- **CLAUDE.md template exact wording** — must reflect: guide system (no skill commands), context.md + handoff.md session-start rules (D59), core guides listed with descriptions, telegraphic behavioral rules (D41, D51), ~80 lines.
- **`docs/commands/guides.sh`** — exact implementation: how to parse frontmatter, output format.
- **`docs/commands/tree.sh`** — arguments, default filters (node_modules, .git, dist), target path arg.
- **`docs/commands/merge.sh`** — accepts multiple paths, recursive, pattern matching.
- **`context.md` template** — loose but documented enough for consistent agent behavior.

Guides with planning complete (behavior defined):
- brainstorm: D27, D28, D29, D45
- write-spec: read brainstorm.md → map [x] branches → write spec format → flag gaps
- write-plan: read spec → identify all files → read all → write per-file tasks → order by dependency
- debug: D52, D53 (Phase 0 + 5 surgical adaptations)
- testing, comments, visualization: built as drafts in `framework-build/docs/guides/`

---

## Pending Notes (added 2026-06-28)

- **Existing guide content needs review**: comments.md, testing.md, visualization.md, chrome-extension*.md were converted to proper format but had pre-existing content issues. Each needs individual review/brainstorm session before being considered production-ready.
- **Auto-memory vs framework workflow collision**: Claude Code's built-in auto-memory system (writing to `/home/me/.claude/projects/.../memory/`) may conflict with the framework's own context.md/handoff.md persistence model. Needs dedicated discussion to decide how to use both without redundancy or confusion.

- **CLAUDE.md commands section — draft entry for merge-files**: When CLAUDE.md template is written, include a detailed description for merge-files. Draft below — expand as needed when writing the actual template.

  ```
  node docs/commands/merge-files.js [options] <path1> [path2] ...

  Streams one or more files/folders to stdout as a single LLM-friendly block.
  Each file becomes a fenced code block: ```lang path/to/file (language auto-detected from extension).
  Blank lines are collapsed. Binary and asset files are always excluded.

  Positional args: files, folders (recursive), or shell-expanded globs. Mix freely.
  --ext ts,tsx,md   Include only files with these extensions (comma-separated).
  --except name     Exclude by basename, folder name, or glob. Repeatable.
                    Examples: --except __tests__  --except "*.spec.ts"  --except "src/generated/**"
  --force           Bypass the 2000-line output limit.

  If total output exceeds 2000 lines, prints a warning listing each file with its
  line count and the total — does NOT output the content. Use --force to override.

  Default excluded: .git, node_modules, dist, .turbo, __pycache__, temp, .venv
  Run from project root.
  ```

- **New guide to build: Code-to-English / Flow Explanation Framework**
  Needs a full dedicated brainstorming session before writing anything. Notes below.

  **What it is:** A framework for converting code implementation into a simplified, programming-language-agnostic English explanation. Not visualization (no diagrams, no trees). Pure English — explains the logic line by line without actual code. Somewhat related to visualization.md but distinct and more extensive.

  **Two responsibilities:**
  1. Convert implementation to English — every line, every condition, every step. Nothing skipped. Not a summary. A faithful English rendering of the logic.
  2. Flow-by-flow scope — not file-by-file. A "flow" = one complete pipeline from trigger to end (e.g., "pre-processing summary generation"). Explain the entire flow end-to-end, spanning whatever files it touches.

  **Why flow-by-flow (not file-by-file):**
  - File-by-file gives incomplete picture. Example: analyze-video-worker explained in isolation is meaningless without analyze-video-service — user doesn't see the full pipeline.
  - Flow-by-flow gives the user the full picture from first event/call to final output.
  - BUT: file-by-file might still have merit in some scenarios. Needs brainstorming to decide when each makes sense. Don't pre-decide.

  **Scope of flows:** queues, workers, services, backend endpoints, frontend flows, event cycles — any code. Must handle: multi-file flows, asynchronous steps, conditional branches, parallel paths, error paths.

  **Key constraint:** not a single step or condition may be omitted. This is a completeness requirement, not a summary.

  **Development approach:**
  - Requires actual codebase to develop and test the framework against → use Delapse codebase (`temp/local-refs/delapse/`)
  - Multiple flow scenarios must be tested before any format is locked
  - Extensive brainstorming session needed first (separate session, not a quick design)

  **Open questions for brainstorm:**
  - How do we define "flow boundaries"? (what starts a flow, what ends it)
  - How do we handle flows that branch into sub-flows?
  - File-by-file vs flow-by-flow — can both be supported? When does each apply?
  - What does the output format look like? (numbered steps? indent-based? something else?)
  - How do we handle async/await, promises, event listeners in the English format?
  - How do we handle error paths without bloating every step with "if this fails..."?

---

## Reference Material

Repos in `temp/repos/`. Reference files in `temp/refs/`.

| Repo | Status | Notes |
|---|---|---|
| `superpowers` | DELETE — not used | What NOT to do. Scope-check logic borrowed, rest is bloat. |
| `mattpocock-skills` | PARTIAL ADOPT | `diagnosing-bugs` → /debug. `improve-codebase-architecture` + `prototype` on-demand. `git-guardrails` NOT needed (our deny list is broader). `grill-me` / `grill-with-docs` / `handoff` replaced by our custom skills. |
| `agent-skills` | REFERENCE ONLY | `interview-me` → assumption check. `idea-refine` → assumption surfacing. Neither adopted as-is. |
| `gstack` | REFERENCE ONLY | Too heavy. "No fixes without investigation" principle kept. |
| `OpenSpec` | REFERENCE ONLY | Folder-per-change concept, "no rigid phase gates" philosophy. |
| `taste-skill` | INCLUDE (opt-in) | Landing pages/portfolios/redesigns. User-invoked only. No Python dep. Decision 54. |
| `ui-ux-pro-max-skill` | INCLUDE (opt-in, override req.) | Any UI decisions. Python dep. No auto-invoke. Decision 55. |
| `playwright-cli` | INCLUDE | Browser automation reference. Patterns in docs/guides/playwright-cli.md. Decision 56. |
| `antrophic-skills` | REFERENCE ONLY | Skill format and description field conventions. |

Delapse reference: `temp/local-refs/delapse/` — m07d-eval-harness best milestone example. `temp/local-refs/delapse/initial-spec/` shows project-level design phase outputs.

---

## Build Order

**Phase 1 — Finish planning (before writing any files):**
1. Plan `handoff` guide to guide-file level
2. Plan `verify` guide to guide-file level
3. Plan `review` guide to guide-file level
4. Finalize CLAUDE.md template exact wording (reflect D57–D65, ~80 lines)
5. Design `docs/commands/guides.sh`, `tree.sh`, `merge.sh` exact interfaces

**Phase 2 — Build in `framework-build/`:**
6. Write `CLAUDE.md` template
7. Write `docs/work/now.md` template
8. Write `docs/work/backlog.md` template (empty)
9. Write `docs/guides/core/execute.md`
10. Write `docs/guides/core/brainstorm.md`
11. Write `docs/guides/core/write-spec.md`
12. Write `docs/guides/core/write-plan.md`
13. Write `docs/guides/core/handoff.md`
14. Write `docs/guides/core/debug.md`
15. Write `docs/guides/core/review.md`
16. Write `docs/guides/core/verify.md`
16. Add frontmatter to existing drafts: `testing.md`, `comments.md`, `visualization.md`
17. Write `docs/commands/guides.sh`
18. Write `docs/commands/tree.sh`
19. Write `docs/commands/merge.sh`
20. Write `docs/guides/tools.md` (skeleton — tools/MCPs reference)
21. Write `docs/guides/domain/improve-codebase-architecture.md` (override + patterns)

**Phase 3 — Review and move:**
22. Review all draft files in `framework-build/`
23. Approve
24. Move to live locations
25. Delete `.agents/skills/` and `.claude/skills/` symlinks

**Build location:** `framework-build/` mirrors final live positions:
- `framework-build/CLAUDE.md` → project root
- `framework-build/docs/` → `docs/`
