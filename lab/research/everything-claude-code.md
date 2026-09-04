# Everything Claude Code

A Claude Code plugin by Affaan Mustafa (Anthropic hackathon winner). The older of two repos by the same author; ECC is the successor. Still worth reading for the ideas, which the longform guide explains better than the repo itself.

## Structure

- `agents/` — 9 specialized subagents (planner, architect, TDD guide, code reviewer, etc.)
- `skills/` — workflow definitions: coding standards, backend/frontend patterns, continuous learning, strategic compact, TDD, security review, eval harness, verification loop
- `commands/` — slash commands: `/tdd`, `/plan`, `/e2e`, `/code-review`, `/build-fix`, `/learn`, `/checkpoint`, `/verify`
- `rules/` — always-loaded guidelines, one per concern (security, coding style, testing, git workflow, agents, performance)
- `hooks/` — memory persistence (session lifecycle) and strategic compact (suggest `/compact` at logical intervals)
- `contexts/` — dynamic system prompt injection files (dev, review, research modes)

## Memory persistence mechanism

Three lifecycle hooks form the memory chain:

- **SessionStart** — checks for recent session files (last 7 days), reports available context and learned skills.
- **PreCompact** — saves state before context compaction so important information survives.
- **Stop (session end)** — creates/updates a daily session file with a template (current state, completed items, in progress, notes for next session, context to load).

Session files are `.tmp` files in `~/.claude/sessions/`, one per day. The next session's start hook finds and reports them. The agent decides what to load.

## Continuous learning mechanism

A Stop hook evaluates the session for extractable patterns:

- Checks if the session had enough messages (configurable, default 10).
- If so, signals Claude to evaluate for patterns worth saving as learned skills.
- Saved to `~/.claude/skills/learned/` as markdown skill files.

The `/learn` command offers manual mid-session extraction. Pattern types: error resolutions, user corrections, workarounds, debugging techniques, project-specific conventions.

The actual extraction is done by the agent itself — the hook just signals that the session is worth evaluating. No background processing.

## Strategic compact

A PreToolUse hook on Edit/Write that counts tool calls and suggests `/compact` at logical intervals (default every 50 calls). The idea: auto-compaction triggers at arbitrary points mid-task; strategic compaction preserves context through logical phases.

## Rules folder

`rules/` holds 6 files, each a concern: security, coding style, testing, git workflow, agents (when to delegate), performance (model selection, context management). Designed to be copied to `~/.claude/rules/`, where Claude Code loads them automatically.

## Dynamic system prompt injection

CLI aliases that inject context via `--system-prompt`:

```
claude-dev    → loads contexts/dev.md
claude-review → loads contexts/review.md
claude-research → loads contexts/research.md
```

System prompt content has higher authority than tool results in Claude's instruction hierarchy. A minor optimization for most workflows, but the idea of mode-specific context injection is interesting.

## Hooks for enforcement

- **Block dev servers outside tmux** — PreToolUse on Bash that blocks `npm run dev` etc. unless in tmux.
- **Block random .md file creation** — PreToolUse on Write that blocks non-standard markdown files.
- **Auto-format with Prettier** — PostToolUse on Edit for JS/TS files.
- **TypeScript check** — PostToolUse on Edit for .ts/.tsx files.
- **Console.log warning** — PostToolUse on Edit and Stop hook on modified files.
- **Git push reminder** — PreToolUse on Bash matching `git push`.

## What matters for Flow

- **The continuous learning loop is aspirational, not mechanical.** The hook signals "this session is worth evaluating," but the extraction depends on the agent in a future session actually reading the signal and doing the work. In practice, the hook runs after the session ends, so the signal goes to nobody — it is a message in a bottle. ECC v2 fixes this with a background observer.
- **Rules as separate files** is the right idea for rules that load every session and change independently. Flow's `home/CLAUDE.md` is one file, so changing one rule invalidates the cache for all of them. Separate files under `rules/` mean each rule is cached independently. The tradeoff: more files to manage, and no way to control load order or conditionality.
- **Mode-specific context injection** is interesting for Flow. Different phases of work (groundwork, building, review) need different knowledge loaded. Flow already does this through skill routing, but the system-prompt approach gives higher instruction authority.
- **Strategic compact** maps to Flow's existing concern about context management. The tool-call counter is crude but cheap.
