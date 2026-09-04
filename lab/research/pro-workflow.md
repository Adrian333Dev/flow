# pro-workflow

2.8k stars. The most complete single implementation: self-correcting memory, persistent research wikis, auto-research loop, hybrid retrieval, LLM council, and 37 hook scripts across 24 events. Published as both a Claude Code plugin and a cross-agent skill bundle (32+ agents via `skills add`).

## Core mechanism — self-correcting memory

The correction-to-rule loop:

1. User corrects Claude during a session.
2. `/learn-rule` captures the correction as a structured learning: category, rule, mistake, correction.
3. The learning is stored in `~/.pro-workflow/data.db` (SQLite).
4. SessionStart hook loads all learnings and injects them as context.
5. Stop hook auto-captures `[LEARN]` tags from responses into the database.

Categories: Navigation, Editing, Testing, Git, Quality, Context, Architecture, Performance, Claude-Code, Prompting.

The correction rate is tracked over time. After 50 sessions, corrections approach zero for learned patterns.

## Knowledge plane — persistent research wikis

Each wiki is a markdown folder with an SQLite FTS5 shadow index:

- 9 flavors: research, paper, domain, product, person, organization, project, codebase, incident.
- Global scope (`~/.pro-workflow/wikis/`) or project scope (`<project>/.claude/wikis/`).
- Pages are markdown files, indexed and searchable via BM25.
- Optional hybrid retrieval: BM25 + vector embeddings + reciprocal rank fusion.
- Auto-research loop: budget-capped BFS over web/arXiv/GitHub fetchers with convergence detection.
- LLM council: multi-provider deliberation (Anthropic/OpenAI/OpenRouter/Fireworks), transcript persists as a wiki page.

UserPromptSubmit auto-loads top-3 wiki hits when prompts mention indexed topics.

## Hooks architecture

37 hook scripts covering 24 events. Key hooks:

- **PreToolUse on Edit/Write** — quality gate, read-before-write enforcement, secret scanning, tool-call budget.
- **PostToolUse on Edit** — post-edit checks, test failure → learning suggestion.
- **Stop** — session check (wrap-up reminders), auto-capture `[LEARN]` blocks.
- **SessionStart** — load learnings, list wikis, previous session context.
- **UserPromptSubmit** — auto-inject wiki hits, detect task drift.
- **PreCompact/PostCompact** — save and re-inject critical context.
- **ConfigChange** — detect mid-session config modification.

## Correction analytics

`/insights` provides:

- Correction heatmaps by category and project.
- Hot learnings (most corrected, least learned) — patterns that keep recurring despite being captured.
- Cold learnings (learned but never applied) — candidates for pruning.
- Adaptive quality gates: edit-count thresholds tighten when correction rate is high, relax when low.
- Productivity metrics: session duration, edits per session, correction rate trend.

## What matters for Flow

### The self-correction loop is the right starting point

Corrections are the highest-signal knowledge: the user explicitly said what was wrong and what is right. Capturing corrections is cheaper and more reliable than extracting knowledge from transcripts. The `[LEARN]` tag auto-capture is clever — the agent can emit learnings as a natural part of its response, and the Stop hook persists them without a separate step.

### Correction analytics identify what to promote

Hot learnings (high correction count, low learning application) are the rules that need to become hooks. Cold learnings (never applied) are the ones to prune. The heatmap by category shows where the agent struggles most. This is exactly the data Flow needs to decide what goes in `home/CLAUDE.md` versus what stays in a knowledge base.

### The wiki plane is overkill for a solo developer

Research wikis with auto-research loops, LLM councils, and hybrid retrieval are powerful but complex. Flow already has skills and references for task-tied knowledge. A simpler knowledge store (corrections + conventions + domain expertise) fits better than a full wiki system.

### 37 hooks is a warning

Every hook adds latency and complexity. The quality gates (read-before-write, tool-call budget, secret scan) are valuable. The observability hooks (task tracking, subagent lifecycle, worktree events, permission logging) are noise for a solo developer. Flow should be selective about which hooks earn their place.
