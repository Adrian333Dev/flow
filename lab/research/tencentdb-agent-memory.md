# TencentDB Agent Memory

A server-side memory system for agent teams. Four components: MemoryCore (the engine), MemoryKnowledge (Wiki + CodeGraph), MemoryPanel (web UI), MemoryProxy (sits between the agent and the LLM). Designed for multi-agent teams, not solo developers.

## Architecture

Memory is layered, from raw to distilled:

- **L0 Conversation** — raw conversations with full context. Source of truth for exact wording.
- **L1 Atom** — facts, preferences, constraints extracted from conversations. Actionable recall.
- **L2 Scenario** — knowledge blocks organized around projects or scenarios. Context bootstrap.
- **L3 Core / Persona** — long-term profiles, stable patterns. Rapid context entry.

Retrieval is also layered: L2/L3 for quick bootstrap, BM25 + vector + RRF fallback to L1/L0 when specifics are needed. Results are capped by item count, character budget, and timeout to prevent memory from overwhelming the context window.

## Asset types

Four kinds of memory asset, each stored and routed independently:

- **Chat Memory** — user preferences, facts, decisions, interaction history.
- **Skills** — reusable workflows with versions, resource files, trigger boundaries, execution steps, and validation rules.
- **Wiki** — structured pages from documents with a link graph.
- **CodeGraph** — code symbols, files, call relationships, impact paths.

## Access control

Assets have ownership and visibility: `private` (owner only), `team` (team members), `restricted` (ACL), `agent` (specific agent binding). Assets are "equipped" to agents — different roles get different loadouts.

## What makes this interesting for Flow

- **Layered distillation is the core idea.** Raw observations are cheap to capture but expensive to load. Distilling them into higher layers trades compute for retrieval quality. Flow's current study cases and workflow notes are roughly L1. There is no L2/L3.
- **Knowledge as an asset with metadata.** An asset has an owner, a version, a status, a usage count, and visibility. This is heavy machinery for a solo developer, but the version and usage-count ideas are worth noting — they answer "is this knowledge still relevant?"
- **Cold-start import.** The system can ingest existing documents, codebases, and conversation sessions and process them into assets. Flow needs something analogous for the project-repo content the user wants to promote.
- **Cap retrieval, not storage.** Store everything; load selectively. The layering system is how they decide what is worth loading.

## What does not fit Flow

- **Server infrastructure.** TencentDB Agent Memory runs as a service with Docker, databases, and an API. Flow runs as files on disk with no server.
- **Multi-agent team model.** Flow is one developer, one agent. The access control, agent loadouts, and team structure are irrelevant.
- **External embedding/vector store dependency.** Flow targets zero external dependencies beyond Node and Claude Code.

## Relevance to the knowledge base design

The layering concept (raw → extracted → organized → distilled) is the strongest idea here. Flow could apply it without the infrastructure: raw observations in a log, extracted facts in structured files, organized knowledge in skills/references. The "equipping" metaphor maps to Flow's existing loading model — skills load on invocation, `CLAUDE.md` loads always, references load when a skill names them.
