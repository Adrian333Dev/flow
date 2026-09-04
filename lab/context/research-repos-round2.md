# Repo analysis — round 2

Research into external repos and Claude Code docs for ideas to improve Flow outside the knowledge system. All 12 proposals rejected — none survived reasoning against Flow's existing workflow.

## Repos analyzed this round

Five repos the user named, plus Claude Code docs and quick scans of remaining clones.

### repos/claude-task-master (Taskmaster)

MCP-based task management for AI-driven development, primarily for Cursor. Task dependencies, tags/workstreams, research command, loop command. Heavy infrastructure — requires separate API keys for multiple models. Not relevant to Flow's zero-cost, solo-developer model.

### repos/agent-toolkit (Softaworks)

Large collection of 40+ skills across AI tools, meta, documentation, design, development, planning, professional, testing, git, utilities. Interesting individual skills:

- `lesson-learned` — analyzes git diff/log and extracts SE principles from actual code changes, mapped to a reference catalog of principles. One well-grounded lesson, not generic advice.
- `reducing-entropy` — bias toward less total code in the codebase. Measure end state, not effort. Three questions: smallest codebase that solves this? Does the change result in less total code? What can we delete?
- `session-handoff` — handoff documents with staleness checking, validation scripts, chaining. Flow already has `/handoff`.
- `agent-md-refactor` — refactor bloated CLAUDE.md files into progressive disclosure structure. Flow already manages CLAUDE.md carefully; the CLAUDE.md split covers this.

### repos/agent-skills (Addy Osmani)

24 production-grade engineering skills mapping to a dev lifecycle: DEFINE -> PLAN -> BUILD -> VERIFY -> REVIEW -> SHIP. 8 slash commands. `/build auto` generates plan and implements every task autonomously. Skills activate automatically based on file patterns. Interesting individual skills:

- `context-engineering` — context hierarchy (rules -> specs -> source -> errors -> conversation), progressive disclosure.
- `doubt-driven-development` — spawns fresh-context adversarial reviewer for non-trivial decisions. Reviewer biased to disprove. Five-step process: CLAIM -> EXTRACT -> DOUBT -> RECONCILE -> STOP.
- `spec-driven-development` — structured specs with gated workflow (SPECIFY -> PLAN -> TASKS -> IMPLEMENT), each phase human-reviewed.

### repos/mattpocock-skills (Matt Pocock)

Small, composable skills focused on engineering fundamentals. User-invoked vs model-invoked split. Key concepts:

- **CONTEXT.md** — shared domain language document. Glossary of project terms with `_Avoid_` lists. Agent challenges fuzzy terms, proposes precise canonical terms, updates inline. Reduces verbosity, keeps naming consistent. Format: term name, 1-2 sentence definition, avoid list.
- **ADRs (Architecture Decision Records)** — minimal format: title + 1-3 sentences. Only when hard to reverse, surprising without context, and result of real trade-off. Lives in `docs/adr/`.
- **Out-of-scope KB** — `.out-of-scope/<concept>.md` records rejected feature requests with reasoning. One file per concept. Prevents re-litigating. Only for rejected enhancements, never bugs or already-implemented features.
- **Agent briefs** — structured format for agent-ready issues. Durable (no file paths/line numbers), behavioral (what not how), complete acceptance criteria, explicit scope boundaries. Template: category, summary, current behavior, desired behavior, key interfaces, acceptance criteria, out of scope.
- **Triage state machine** — issues through states: needs-triage -> needs-info -> ready-for-agent -> ready-for-human -> wontfix. Two category roles (bug, enhancement) + five state roles.
- **Ticket blocking edges** — explicit dependency declarations between tickets. Vertical slicing (tracer bullet). Frontier: any ticket whose blockers are all done.
- **Codebase design vocabulary** — deep vs shallow modules, seams, adapters, leverage, locality. Consistent vocabulary for architecture discussion.
- **grill-with-docs** — grilling session that builds domain model (CONTEXT.md and ADRs) as decisions land.
- **to-spec** — synthesizes current conversation into spec with seams, user stories, implementation decisions, testing decisions, out of scope.
- **to-tickets** — breaks spec into tracer-bullet tickets with blocking edges. Wide refactors get expand-contract sequencing.

### repos/superpowers

Complete development methodology. Already installed in the session as a plugin. Brainstorming -> worktrees -> writing-plans -> subagent-driven-development -> verification. Automatic skill triggering. Multi-agent support.

### Other repos scanned

- **repos/caveman** — output token reduction through terse agent speech. 65% fewer output tokens on prose, 8.5% on full coding runs.
- **repos/adhd** — parallel divergent ideation: spawns N isolated reasoning processes under different cognitive frames, zero shared context during divergence, critic pass to score/cluster/prune. For design decisions, debugging, naming.
- **repos/Delapse** — Chrome extension for YouTube orientation cards. Not relevant.

## Claude Code features analyzed

### Routines

Saved configurations that run automatically: on schedule (hourly/nightly/weekly), on API call (HTTP POST), or on GitHub events (PR opened, release). Run on Anthropic cloud infrastructure. Prompt + repos + connectors + triggers. Available on Pro, Max, Team, Enterprise. Create at claude.ai/code/routines or via `/schedule`.

### Dynamic workflows

JavaScript scripts that orchestrate many subagents. The script holds the plan (loops, branching, intermediate results), not Claude's context. Key functions: `agent()` spawns one, `pipeline()` runs one per item, `parallel()` runs a set at once. Saved as `.claude/workflows/` commands. Agents share prompt cache within a run. Up to 16 concurrent, 1000 total per run.

### /goal — completion conditions

`/goal <condition>` — Claude keeps working until a separate evaluator (Haiku) confirms condition met. No turn-by-turn prompting. Evaluator runs after each turn, zero extra cost. Good for migrations, implementing specs, working through backlogs. Combines with auto mode for fully autonomous work.

### Channels

Push events from external services into a running session via MCP. Telegram, Discord, iMessage as official plugins. Chat bridge (ask Claude from phone) and webhook receiver (CI failures arrive in session). Research preview. Requires --channels flag.

## Outcome — all proposals rejected

Twelve ideas proposed, all rejected after reasoning against Flow's workflow.

### Why each failed

1. **Domain language document (CONTEXT.md)** — Flow already defines terms inline in CLAUDE.md and workflow docs. The glossary solves a problem Flow doesn't have.
2. **Architecture Decision Records** — Flow's groundwork maps, specs, and design files already record decisions with reasoning. ADRs are a workaround for repos without that structure.
3. **Out-of-scope knowledge base** — Same reasoning as ADRs. Flow's workflow already handles rejected directions through groundwork and design files.
4. **Routines** — Cloud infrastructure, overkill for solo dev on $20/month. Doesn't solve anything.
5. **Dynamic workflows** — Parallel agent orchestration. Hard no — superpowers experience proved these are expensive, slow (1.5 hours for simple features), and unnecessary.
6. **`/goal` completion conditions** — Native Claude Code feature, nothing to build. The user can already type `/goal` whenever they want. Not an idea, just a documentation note.
7. **Agent briefs** — Flow's tickets are already structured with acceptance criteria and scope.
8. **Doubt-driven development** — Spawns fresh-context adversarial reviewer subagent. Rejected with all parallel-agent ideas.
9. **Lesson-learned extraction** — Flow's file-findings + knowledge system already extracts lessons from work.
10. **ADHD parallel divergent ideation** — Parallel agents. Hard no.
11. **Channels** — External service integration. Overkill.
12. **Caveman** — Token savings negligible at solo-dev scale. Style clashes with Flow's writing rules.

### The lesson

These repos mostly solve problems Flow's workflow already handles, or problems a solo developer doesn't have. The genuinely useful mechanical finds were captured in the first research round: hooks, rules, compliance scorecard, topic-key upserts, the loading ladder. Methodology repos and agent-orchestration repos have nothing left to offer Flow.
