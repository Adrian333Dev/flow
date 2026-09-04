# engram

6.3k stars. A Go binary with SQLite + FTS5, exposed through CLI, HTTP API, MCP, and a TUI. Agent-agnostic (Claude Code, OpenCode, Gemini CLI, Codex, VS Code, Antigravity, Cursor, Windsurf). Single binary, zero dependencies beyond Go. Local-first with optional cloud replication.

## Core mechanism — agent-decides-what-to-save

engram trusts the agent to decide what is worth remembering. No firehose of raw tool calls, no automatic transcript capture. The agent calls `mem_save` after significant work with a structured summary:

```markdown
**What**: Added retry-safe upload handling.
**Why**: Retries could create duplicate records.
**Where**: internal/upload/handler.go
**Learned**: Reuse the request id as the idempotency key.
```

This is the opposite of ECC's observe-everything approach. The agent exercises judgment about what crosses the notability bar. The tradeoff: the agent may forget to save, and what it chooses to save reflects its own biases.

## Topic-key upserts — evolving knowledge stays in one record

The most interesting mechanism. A `topic_key` (e.g., `architecture/auth-model`) turns `mem_save` into an upsert: if a memory with the same `project + scope + topic_key` already exists, the existing observation is updated in place with `revision_count++` instead of creating a new row.

Without topic keys, a decision that evolves over three sessions becomes three separate observations, and the agent has to figure out which one is current. With topic keys, the decision is always one record, always up to date, with the revision count showing how many times it changed.

### Topic key format

Slash-separated lowercase kebab-case: `family/specific-description`.

- `architecture/auth-model`
- `bug/nil-panic-in-user-list`
- `decision/database-choice`
- `pattern/error-handling-convention`

`mem_suggest_topic_key` helps the agent pick the right key based on observation type and title.

## Progressive disclosure — same 3-layer pattern as claude-mem

1. `mem_search` — compact results with IDs (~100 tokens each).
2. `mem_timeline` — what happened before/after in that session.
3. `mem_get_observation` — full untruncated content.

## Conflict detection

`mem_compare` and `mem_judge` persist semantic relation verdicts between observations. A `conflicts_with` relation means two observations contradict each other; `supersedes` means one replaces another. Conflict scanning is deterministic (FTS5 lexical first) with optional LLM-judge semantic detection.

## Scoping

Three scopes: `project` (default), `personal`, `global`. Project detection uses git remote URL (hashed) or cwd. Topic-key upserts are scoped to `project + scope + topic_key`, so the same key in different scopes creates independent observations.

## What matters for Flow

### Topic-key upserts are the right model for evolving knowledge

Flow's conventions, architecture decisions, and domain expertise evolve. A convention that changed three times should be one record with the current state, not three records the agent has to reconcile. The topic-key pattern maps directly to Flow's knowledge types.

### Agent-decides-what-to-save fits Flow's workflow

Flow already trusts the agent with significant autonomy (skills, phases, subagents). Having the agent decide what is worth saving — rather than hooking every tool call — matches Flow's philosophy: learning is a byproduct of work, not machinery bolted alongside it. The risk (agent forgets to save) is mitigated by the workflow structure: handoff and groundwork already produce artifacts that capture knowledge.

### Conflict detection is needed for a long-lived knowledge base

Over months, observations will contradict each other as understanding evolves. Without conflict detection, the agent surfaces stale knowledge alongside current knowledge and cannot tell which is right. engram's approach — persist verdicts about which observations conflict or supersede — is lightweight and useful.

### The Go binary is the wrong shape for Flow

engram is infrastructure: a compiled binary, an HTTP API, a TUI, cloud replication. Flow has no server and no daemon. The mechanisms (topic-key upserts, agent-directed saves, conflict detection) translate; the implementation does not.
