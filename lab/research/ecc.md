# ECC

The successor to everything-claude-code, by the same author. A Claude Code plugin with 68 agents, 286 skills, and 94 commands, plus hooks, rules, memory, continuous learning, and AgentShield security scanning. Actively maintained. Supports Claude Code, Codex, Kimi Code, and other harnesses.

## Continuous Learning v2 — the instinct system

The most developed learning mechanism across all four repos. Replaces v1's session-end evaluation with real-time observation and background analysis.

### The instinct model

An instinct is an atomic learned behavior:

- **Trigger** — when the behavior fires (e.g., "when writing new functions").
- **Action** — what to do (e.g., "use functional patterns over classes").
- **Confidence** — 0.3 (tentative) to 0.9 (near certain), weighted by evidence.
- **Domain tag** — code-style, testing, git, debugging, workflow, etc.
- **Evidence** — what observations created the instinct.
- **Scope** — `project` (default) or `global`.

### Observation pipeline

Hooks capture tool use on every PreToolUse and PostToolUse event. The observe hook:

- Reads the hook JSON from stdin (tool name, input, output, session ID, cwd).
- Detects the current project via git remote URL (hashed for portability) or repo path.
- Scrubs secrets (API keys, tokens, passwords) before persisting.
- Writes to a project-scoped `observations.jsonl` file.
- Throttles SIGUSR1 signals to a background observer agent (every N observations, default 20).

Auto-purges observations older than 30 days. Archives when file exceeds 10 MB. Five layers of guards prevent the observer from firing on automated sessions, subagents, or its own analysis sessions.

### Background observer

A Haiku-powered background agent that reads observations and creates/updates instincts. Runs outside the main context window. Detects patterns: user corrections, error resolutions, repeated workflows.

### Instinct lifecycle

1. **Capture** — observation hook writes to `observations.jsonl`.
2. **Analysis** — background observer creates instincts with initial confidence.
3. **Evolution** — `/evolve` clusters related instincts into full skills, commands, or agents.
4. **Promotion** — `/promote` moves project-scoped instincts to global scope when they appear in 2+ projects.

### Storage

v2.1 stores data outside `~/.claude` to avoid Claude Code's sensitive-path guard:

```
~/.local/share/ecc-homunculus/
├── instincts/personal/       # global instincts
├── evolved/                  # global evolved artifacts
│   ├── agents/
│   ├── skills/
│   └── commands/
└── projects/
    ├── projects.json         # hash → name registry
    └── <project-hash>/
        ├── instincts/personal/
        ├── evolved/
        └── observations.jsonl
```

## Rules system

Language-specific rule packs under `rules/`: common, plus 20+ language/framework packs (typescript, react, python, rust, golang, etc.). Installed selectively to `~/.claude/rules/ecc/`. Claude Code loads everything in `rules/` automatically.

## Hooks for enforcement

Similar to everything-claude-code but more developed:

- Plugin-managed hooks auto-load from `hooks/hooks.json`.
- Hook profiles: `standard`, `minimal` (suppresses non-essential hooks), etc.
- The observation hook itself has 5 layers of guards to prevent self-loops.

## The `/promote` command

Moves instincts from project scope to global scope. Detects candidates that appear in 2+ projects and meet a confidence threshold. The promotion path: project-scoped instinct → cross-project candidate → global instinct.

## What matters for Flow

### Ideas worth stealing

- **Atomic instincts over monolithic skills.** A small learned behavior with a trigger, an action, and a confidence score. Easier to create, easier to discard, easier to compose than a full skill file.
- **Project scoping by default, global by promotion.** Prevents cross-project contamination. A React pattern stays in the React project unless it proves universal. Flow's project-scoped rules (`.flow/` and `.claude/`) map to this, but there is no promotion mechanism.
- **Confidence scoring.** An instinct starts tentative and grows with evidence. Low-confidence instincts can be ignored or pruned. This is how learned knowledge ages: a rule with no recent evidence fades. Flow has no equivalent.
- **Secret scrubbing in the observation pipeline.** Any system that logs tool input/output must scrub secrets. The regex-based approach with bounded quantifiers is practical.
- **Self-loop prevention.** Five layers of guards prevent the observer from analyzing itself. Any Flow learning mechanism that uses background agents needs the same.

### Ideas that don't fit

- **Background observer agent.** ECC uses a Haiku-powered background agent to analyze observations. Flow has no background agents and no mechanism to run one. The observation capture is still useful — a human or a future session can analyze the log.
- **286 skills and 94 commands.** ECC is a kitchen-sink plugin. Flow is a focused solo-developer workflow. The breadth is noise; the mechanisms are signal.
- **Cross-harness portability.** ECC targets Claude Code, Codex, Kimi Code, and others. Flow targets Claude Code only.

### The key tension

ECC's learning system is real-time but complex. The observation hook runs on every tool call (Python invocation, stdin parsing, project detection, secret scrubbing, throttled signaling, lock files). The browser-harness approach has zero overhead — learning is the work. Flow should aim closer to the browser-harness end: learning happens as a natural byproduct of the work, not as machinery bolted alongside it.

The instinct model itself (trigger, action, confidence, scope) is the right abstraction regardless of how the instincts get created.
