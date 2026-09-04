# claude-memory-compiler

1.3k stars. Adapted from Karpathy's LLM knowledge base architecture. The raw data is Claude Code conversation transcripts. Hooks capture transcripts, a background process extracts knowledge into daily logs, and a compiler turns daily logs into structured wiki articles. Retrieval uses `index.md` instead of RAG — no vector database, no embeddings, just markdown.

## Core mechanism — two-phase distillation

### Phase 1: flush (automatic)

SessionEnd hook reads the conversation transcript (last ~30 turns, capped at 15k chars), writes it to a temp file, and spawns `flush.py` as a background process. `flush.py` uses the Claude Agent SDK to extract knowledge — decisions, lessons, patterns, gotchas — and appends the result to a daily markdown log at `daily/YYYY-MM-DD.md`. A recursion guard (`CLAUDE_INVOKED_BY` env var) prevents the SDK session from re-triggering the hook.

After 6 PM local time, the flush automatically triggers compilation of that day's logs.

### Phase 2: compile (manual or auto-triggered)

`compile.py` reads daily logs and uses the Claude Agent SDK to produce structured wiki articles:

- `knowledge/concepts/` — one markdown file per concept, with YAML frontmatter, wikilinks, key points, details, related concepts, sources.
- `knowledge/connections/` — articles about non-obvious relationships between concepts.
- `knowledge/index.md` — a table with one row per article: path, one-line summary, source file, date.
- `knowledge/log.md` — timestamped compilation entries.

The compiler reads all existing articles for context, so new articles cross-reference old ones. It tracks which daily logs have been compiled (hash-based deduplication) and their compilation cost.

### Retrieval

SessionStart hook injects two things:

1. The `knowledge/index.md` file (capped at 20k chars).
2. The most recent daily log (last 30 lines).

The agent reads the index and decides which articles to load. No vector search, no embeddings — the LLM reading a structured index outperforms cosine similarity at personal scale (~50-500 articles).

## The Karpathy insight

At personal scale, the LLM reading `index.md` outperforms vector similarity search. The LLM understands what the question actually means; cosine similarity finds similar words. RAG becomes necessary only at ~2000+ articles when the index exceeds the context window.

This has a direct implication for Flow: the knowledge base can start as pure markdown with an index file, and only needs search infrastructure when the index outgrows the context window.

## What matters for Flow

### The simplest viable architecture

Three hooks, two scripts, markdown files. No server, no database, no worker process. The daily log → compiled article → index pipeline is the minimum viable knowledge base. Flow could adopt this shape directly.

### The compilation step is the key differentiator

Most repos stop at raw capture (observations, transcripts, diary entries). claude-memory-compiler adds a compilation step that produces structured, cross-referenced articles from raw logs. The compiled output is qualitatively different from the input: organized by concept, not by session.

### Background SDK calls have a cost

Each flush and compile uses Claude Agent SDK calls, which consume plan credits. The cost is tracked per compilation. At personal scale this is affordable; at high session frequency it adds up. The 6 PM auto-compile batches daily, which helps.

### The recursion guard is essential

Any system that uses Claude to analyze Claude sessions must prevent the analysis session from triggering the same hooks. The `CLAUDE_INVOKED_BY` env var guard is simple and effective.
