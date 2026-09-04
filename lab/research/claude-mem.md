# claude-mem

93k stars. The largest Claude Code memory project, now rebranded as Grok Mem. A full memory platform: hooks capture observations, a local Bun worker compresses and indexes them, and MCP tools provide token-aware retrieval. Cross-agent (Claude Code, Cursor, OpenCode, Antigravity, Grok Bot). Published as both an npm package and a Claude Code plugin.

## Core mechanism — progressive disclosure retrieval

The retrieval system uses a three-layer MCP search pattern that controls token cost:

1. **`search`** — returns a compact index with observation IDs, ~50-100 tokens per result.
2. **`timeline`** — returns chronological context around an interesting result.
3. **`get_observations`** — fetches full details only for filtered IDs, ~500-1000 tokens per result.

The agent starts broad and drills in. Filtering before fetching yields ~10x token savings compared to dumping all relevant observations.

## Architecture

Five lifecycle hooks form the capture chain:

- **SessionStart** — injects context from previous sessions.
- **UserPromptSubmit** — auto-injects relevant wiki hits when prompts mention indexed topics.
- **PostToolUse** — records tool use as observations.
- **Stop** — session wrap-up.
- **SessionEnd** — persists session summary.

A local Bun-based worker service provides the HTTP API, web viewer, and compression. SQLite + FTS5 for storage and full-text search. Optional Chroma vector database for hybrid semantic + keyword retrieval (BM25 + vector + RRF ranking).

## Storage

- `~/.claude-mem/claude-mem.db` — SQLite database with sessions, observations, summaries.
- `~/.claude-mem/chroma/` — optional Chroma vector store.
- Per-session observations are compressed and indexed by the worker.

## What matters for Flow

### Progressive disclosure is the right retrieval pattern

Every other repo that works at scale lands on some version of this: search first, get details on demand. The alternative — injecting all relevant context at session start — blows the context window. Flow's existing loading model (skills load on invocation, not at start) already follows this principle for task-tied knowledge. The question is whether learned knowledge should follow the same pattern or be always-loaded.

### The infrastructure is too heavy

claude-mem requires Bun, a worker service, SQLite, optionally Chroma and Python for vector search. It has a full HTTP API with web viewer, cloud sync, and a Vercel deployment path. Flow is a workflow with no server, no daemon, and no infrastructure beyond Claude Code and the filesystem. The progressive disclosure pattern translates; the implementation does not.

### Observation types are unstructured

claude-mem captures everything (tool use, sessions, summaries) and relies on search to surface what matters. There is no type system for observations, no confidence scoring, no aging or decay. The agent decides what to search for; nothing decides what is worth keeping. At 93k stars this works — the search is good enough that retrieval quality compensates for capture noise.
