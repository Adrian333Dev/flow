# Claude

Ran a broad sweep. Below is everything worth your time, grouped by what it actually does, with tags: **MEM** (memory persistence), **RULES** (learned rules), **KS** (knowledge structure), **LOOP** (self-improvement), **HOOK** (hook enforcement).

If you only read five: `claude-memory-compiler`, `agent-knowledge-cycle`, `taosmd`, `pro-workflow`, `codealmanac`. Those four cover the design space you're describing almost completely.

---

## 1. Session → learned rules/knowledge, built for Claude Code

**https://github.com/coleam00/claude-memory-compiler** — MEM, RULES, KS, LOOP, HOOK
Hooks capture the transcript on session end or auto-compact, spawn a background Agent SDK process that extracts decisions, lessons, patterns and gotchas into a daily log, then an LLM "compiler" organizes those logs into structured cross-referenced knowledge articles; retrieval is a plain index file, no vector DB. Closest thing to what you're describing, and the compile step is the interesting part.

**https://github.com/rohitg00/pro-workflow** — MEM, RULES, KS, LOOP, HOOK
Single SQLite store under every session: each correction becomes a rule that's FTS5-searchable and auto-loaded at SessionStart, plus persistent research wikis on disk with an FTS5 shadow index and an optional auto-research loop; 37 hook scripts across 24 events. The most complete implementation of the whole stack in one repo.

**https://github.com/shimo4228/agent-knowledge-cycle** — KS, RULES, LOOP
Six-phase knowledge cycle specification — ADRs, JSON schemas, and a reference implementation — that turns coding-agent sessions into persistent skills, rules, and memory. Spec-first rather than tool-first. Read the schemas even if you don't use the code.

**https://github.com/rlancemartin/claude-diary** — MEM, RULES, LOOP
Writes a per-session diary entry to `~/.claude/memory/diary/` covering decisions, preferences, failures and code patterns, then a `/reflect` command distills those into CLAUDE.md updates — explicitly modeled on the Generative Agents observation/reflection/retrieval split.

**https://github.com/TerenceBristol/claude-improve** — RULES, LOOP, KS
Retrospective skill with two-level learnings: cross-project patterns in `~/.claude/improve-learnings.md` and per-project state under Claude Code's own project data dir, with a promotion rule that graduates settled patterns into config. The promotion criteria are the useful bit.

**https://github.com/daegwang/self-learning-agent** — RULES, LOOP
Polls `~/.claude/projects/` and `~/.codex/sessions/` to record edits, commands, test results and user interventions, has an AI identify failure patterns on `/review`, and writes approved suggestions directly into CLAUDE.md / AGENTS.md with backups.

**https://github.com/Digital-Process-Tools/claude-remember** — MEM, KS
Hooks into the Claude Code lifecycle to save sessions, compress them through Haiku into layered daily summaries, and reload them at next session start. Worth reading for the failure modes they've hit (staging files, size caps, consolidation stalls) — that's hard-won.

**https://github.com/axmeai/axme-code-plugin** — MEM, RULES, HOOK
Background auditor extracts memories, decisions and safety rules from session transcripts when you close a window; hooks intercept dangerous commands at the harness level; session handoff tells the next session where work stopped.

**https://github.com/EveryInc/compound-engineering-plugin** — RULES, LOOP
Plan → Work → Review → Compound loop where `/workflows:compound` documents learnings so plans inform future plans and patterns get codified. Philosophy-heavy, but it's the origin of the "compounding engineering" framing.

**https://github.com/kaina404/claude-code-workflow** — RULES, LOOP
Workflow template built from months of daily use: remembers past mistakes and applies lessons automatically, plus context management and model-tier routing.

---

## 2. Knowledge bases agents read and write (structure-focused)

**https://github.com/AlmanacCode/codealmanac** — KS, MEM, LOOP
Plain-markdown wiki in your repo (`almanac/` with `topics.yaml` and page folders) indexed locally, with background jobs that scan recent Codex and Claude conversations to queue useful knowledge and review every wiki for stale, duplicated or poorly connected pages. Design principles worth stealing: one page per stable concept, a notability bar for what deserves a page, edits in place when facts change, and "if a session adds no durable knowledge, the wiki is left unchanged."

**https://github.com/basicmachines-co/basic-memory** — KS, MEM
Knowledge lives as Markdown files both you and the agent read, write and search over MCP; observations and wikilinks compound into a real knowledge graph, local-first and two-way.

**https://github.com/7xuanlu/origin** — MEM, KS
Local-first work memory for Claude Code, Cursor, Codex and MCP clients with session handoffs, source-backed wiki pages, graph context and hybrid retrieval through a single local daemon.

**https://github.com/fockus/skill-memory-bank** — KS, MEM, RULES
`.memory-bank/` is plain committed markdown covering TDD rules, code graph and spec-driven dev, with adapters for Claude Code, Cursor, Windsurf, Cline, Kilo, OpenCode, Pi and Codex.

**https://github.com/cline/prompts** (`.clinerules/memory-bank.md`) — KS
The canonical memory-bank hierarchy: core files that build on each other, all markdown, read in full at the start of every task. Pure prompt, no code, but it's the schema everyone else forked.

**https://github.com/GreatScottyMac/roo-code-memory-bank** — KS, MEM
Structured memory across sessions with `activeContext.md`, `productContext.md`, `progress.md` and `decisionLog.md`, plus per-mode rules governing when each gets updated. The mode-specific update strategies are the part worth copying.

**https://github.com/kevdogg102396-afk/packrat** — KS
Auto-learning codebook compression that shrinks agent context files while keeping them LLM-readable. Directly relevant if your KB index starts blowing the context budget.

**https://github.com/sunnja69/akephalos** — KS, MEM, RULES
Local-first markdown portable agent profile — preferences, rules, durable memories — synced across agents via plain files and Git.

**https://github.com/memovai/memov** — MEM, KS
Git-based traceable memory layer for Claude Code.

**https://github.com/ModernRelay/omnigraph** — KS, MEM
Object-storage-native graph engine for agent memory with git-style branch/merge workflows. Branch/merge on a knowledge base is an idea worth stealing even if you don't use it.

**https://github.com/Ikalus1988/MisakaNet** — KS, LOOP
Git-based distributed swarm memory where agents share lessons across nodes via GitHub Issues. Odd, but the "lesson as an issue" transport is a real design.

**https://github.com/clawde-agent/memobank-cli** — MEM, KS
Three-tier memory model with automatic secret redaction before every write, epoch-aware scoring so team knowledge fades, and `memo lifecycle` health scans; hooks into Claude Code, Cursor, Codex, Gemini CLI. The redaction-before-write and lifecycle/health-scan pieces are things most repos here skip.

**https://github.com/DeusData/codebase-memory-mcp** — KS, MEM
Indexes codebases into a persistent knowledge graph, 158 languages, single static binary. Their README also documents per-client hook reliability (which hooks fire, which are ignored) across Cursor/Cline/Codex/Junie — useful reference if you go cross-agent.

---

## 3. Memory engines — read these for storage/retrieval/update mechanics

**https://github.com/jaylfc/taosmd** — MEM, KS
Local-first offline memory on an append-only transcript (messages, tool calls and results, decisions, errors); a "librarian" derives a typed temporal knowledge graph from it, corrected facts supersede old ones via invalidation, hybrid vector + BM25 retrieval, tuned for small local models. Best single answer to "how do you *update* a knowledge base without corrupting it."

**https://github.com/samvallad33/vestige** — MEM, KS
Local-first cognitive memory MCP server for coding agents with FSRS-6 decay, spreading activation, active suppression, Receipt Lock and an inspectable dashboard.

**https://github.com/oceanbase/powermem** — MEM, KS, LOOP
Hybrid vector/full-text/graph retrieval with LLM-driven extraction, Ebbinghaus-style decay, and two-layer Experience + Skill distillation. The Experience→Skill distillation layer is your self-improvement loop in miniature.

**https://github.com/vectorize-io/hindsight** — MEM, LOOP
Organizes memories in biomimetic structures rather than flat vectors, and a `reflect` operation lets the agent form broader observations over time about what worked and what didn't. Note the vendor benchmark claims are self-reported; ignore the leaderboard, read the data model.

**https://github.com/campfirein/cipher** (now `byterover-cli`) — MEM
Dual memory layer capturing System 1 (concepts, business logic, past interaction) and System 2 (the model's reasoning steps when generating code), exposed to Cursor, Codex, Claude Code, Cline, Windsurf and others over MCP. Storing reasoning traces separately from facts is a distinction most repos miss.

**https://github.com/atw4757-byte/archon-memory-core** — MEM
Local-first agent memory with nightly consolidation, active forgetting, and salience scoring.

**https://github.com/xiaofanliu525-ctrl/suyi-memory** — MEM
SQLite-backed, zero-dependency dual-temporal memory with Ebbinghaus decay and skill crystallization.

**https://github.com/moorcheh-ai/memanto** — MEM, KS
Typed semantic memory with `remember`/`recall`/`answer` operations and information-theoretic retrieval.

**https://github.com/fpytloun/mnemory** — MEM
Multi-type agent memory (facts, preferences, episodic) with TTLs, user/agent scoping, and an MCP server.

**https://github.com/christian-byrne/claude-code-vector-memory** — MEM
Semantic memory for Claude Code: indexes session summaries and exposes vector search over them via a `/system:semantic-memory-search` command.

**https://github.com/getzep/graphiti** — MEM, KS
Indexes facts as time-stamped relationships with fact-validity windows — a live-ingestion temporal knowledge graph rather than batch recompute.

**https://github.com/letta-ai/letta** — MEM, KS
Memory split into tiers the agent manages itself: labeled memory blocks with fixed character limits that stay in context permanently and the agent edits via tool calls, with archival vector memory and recall history behind them. Their own "Is a Filesystem All You Need?" result — plain files beating specialized memory systems on LOCOMO — is worth reading before you over-engineer storage.

**https://github.com/topoteretes/cognee** — MEM, KS — ingest→cognify→search pipeline building a self-hosted knowledge graph combining vector embeddings, graph reasoning and ontology generation.

**https://github.com/mem0ai/mem0** — MEM. Baseline; note the v3 open-source rewrite removed the graph layer entirely, which is itself a data point.

**https://github.com/OWASP/www-project-agent-memory-guard** — KS (integrity)
Runtime defense layer that screens agent memory writes for poisoning before they reach the agent — validation, semantic anomaly detection, entropy scoring, provenance verification, cross-reference and temporal checks. If your agent writes its own rules, this is the failure mode nobody plans for.

---

## 4. Hook-based enforcement

**https://github.com/karanb192/claude-code-hooks** — HOOK, RULES
Includes a CLAUDE.md compliance scorecard that tallies which rules Claude follows vs ignores as you edit (SessionStart + PostToolUse + SessionEnd) and flags chronically-ignored rules to promote into a deterministic hook. That promotion path — advisory rule fails repeatedly → becomes a hook — is exactly the bridge between your "learned rules" and "hook enforcement" concerns. Also has a hook that remembers approaches you tried and reverted, with reason and token cost, and warns before you retry them.

**https://github.com/ithiria894/awesome-claude-code-hooks** — HOOK
Curated index of hooks tagged by trigger event. Mine it directly — it lists things like a PostCompact hook that injects a reminder to re-read AGENTS.md to prevent post-compaction rule amnesia, and a "Founder OS" pattern that accumulates learnings from task completions into `.claude/learnings/` for future sessions to reference.

**https://github.com/allgrit/claude-code-guards** — HOOK
PreToolUse hooks intercepting every Bash and Edit/Write op, returning `permissionDecision: "deny"` with a reason so Claude auto-recovers instead of stopping; config-driven via `.claude/guards.config.json`. The deny-with-reason pattern matters — it turns enforcement into feedback.

**https://github.com/rulebricks/claude-code-guardrails** — HOOK
Rules live in an editable decision table; publishing a new version applies immediately with no restart, and blocked commands are queryable in a logs view. Rules as data, not code.

**https://github.com/disler/claude-code-hooks-mastery** — HOOK
Reference implementation across the hook surface, plus sub-agents and a meta-agent that generates new sub-agents from descriptions.

Also from that awesome list: `dwarvesf/claude-guardrails` (deny rules, exfiltration prevention, prompt-injection scanning), `panuhorsmalahti/claude-code-permissions-hook` (Rust, TOML allow/deny with regex and JSON audit logging), and `liberzon/claude-hooks` (decomposes compound bash commands into sub-commands before matching each against your patterns).

Read **https://github.com/anthropics/claude-code/issues/45427** before you commit to hooks as your enforcement layer — it documents the real gaps: hooks don't fire for Bash file writes via `cat >`, heredocs and redirects; PreToolUse hook failures can be silently bypassed; and Claude can edit its own settings.json and hook files.

---

## 5. Research implementations worth reading for architecture

**ACE (Agentic Context Engineering)** — the intellectual core of what you're building. Treats context as an evolving playbook that accumulates, refines and organizes strategies via generation/reflection/curation, specifically to avoid brevity bias (dropping domain insight for concise summaries) and context collapse (iterative rewriting eroding detail), using structured incremental updates rather than rewrites. SambaNova/Stanford/Berkeley open-sourced the full implementation with Generator/Reflector/Curator components and runnable Finance and AppWorld scripts. Paper: arxiv.org/abs/2510.04618.

Third-party implementations to read:
- **https://github.com/kimtth/agent-agentic-context-engineering** — section-based playbook store with bullet IDs that exports to a `SKILL.md` any coding agent can consume as static instructions. Most directly usable for a Claude Code workflow.
- **https://github.com/mmprotest/ace-playbook** — SQLite-backed playbook with bullet embeddings and hybrid retrieval scoring embedding similarity, helpful/harmful counters and freshness bonuses.
- **https://github.com/DannyMac180/ace-platform** — connects evolving playbooks to MCP-compatible clients like Claude Code and Codex, recording outcomes from real work.

**https://github.com/sentient-agi/EvoSkill** — LOOP, RULES
Automatically discovers and synthesizes reusable agent skills from failed trajectories; proposes multiple skill and prompt mutations jointly, evaluates variants on held-out data, and works with Claude Code, Codex CLI, OpenCode, OpenHands and Goose.

**https://github.com/zorazrw/agent-workflow-memory** — LOOP, KS. Induces reusable workflows from past trajectories; the original "learn procedures, not facts" paper with code.

**https://github.com/agentscope-ai/ReMe** — LOOP. Dynamic procedural memory for experience-driven agent evolution.

**https://github.com/bingreeky/MemEvolve** — LOOP. Meta-evolution of the memory system itself.

---

## 6. Lists to mine further

- **https://github.com/TeleAI-UAGI/Awesome-Agent-Memory** — the master index. ~50 open-source memory products ranked by stars, plus benchmarks and papers. Everything in section 3 above came out of it; there's more I didn't list.
- **https://github.com/rohitg00/awesome-claude-code-toolkit** — Claude Code-specific: agents, skills, hooks, plugins.
- **https://github.com/kyrolabs/awesome-agents** — surfaced a few you'd otherwise miss: `piia-engram` (cross-tool local-first identity and knowledge layer across Claude Code, Cursor, Codex), `Statewave` (memory runtime turning events into structured memories with evolution, consolidation and supersession), and `IWE` (markdown knowledge graph with editor LSP, CLI and MCP server).

---

**One pattern to note across all of this:** the repos that work long-term converge on the same three things — an append-only raw layer (transcripts/logs), a derived structured layer (typed facts, wiki pages, rules) built by a separate compaction pass, and a small always-loaded index that points into the structured layer rather than containing it. `taosmd`, `claude-memory-compiler` and `codealmanac` all landed there independently. The ones that skip the raw layer can't correct bad extractions later, and the ones that skip the index blow the context budget.

A deeper investigation could compare the actual update semantics across these — how each handles fact supersession, contradiction, staleness and forgetting — which is where most of them quietly differ and where your system will live or die.

# ChatGPT

Yes. I went fairly deep here, specifically looking for **implemented systems rather than collections of CLAUDE.md tips**, and I filtered out the four families you said you've already studied: browser-harness/browser-use, TencentDB-Agent-Memory, everything-claude-code/ECC, and Superpowers.

The most interesting finding is that there are now **several distinct architectural approaches** to this problem:

1. **Transcript → learned knowledge → retrieval** — e.g. Claude-Mem, SixthSense.
2. **Structured knowledge graph / memory database** — e.g. n2n-memory, MemoryGraph, memex.
3. **Learnings → procedural skills/rules** — e.g. Self-Improving Skills, SixthSense.
4. **Memory + deterministic hooks** — e.g. Claude Code Memory, Session Continuity.
5. **Memory-first agent architectures** — e.g. Letta Code.
6. **Self-modifying/self-evaluating agents** — more research-oriented systems such as SICA.

## My strongest findings

| Repository                                                                                                   | What it does                                                                                                                                                  | Memory | Learned rules | Knowledge structure | Self-improvement | Hooks |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----: | :-----------: | :-----------------: | :--------------: | :---: |
| **[thedotmack/claude-mem](https://github.com/thedotmack/claude-mem?utm_source=chatgpt.com)**                 | Captures coding activity, compresses it into semantic observations, stores it, and progressively retrieves relevant history into future Claude Code sessions. |   ✓✓✓  |       ✓       |          ✓✓         |         ✓        |  ✓✓✓  |
| **[d2a8k3u/claude-code-memory](https://github.com/d2a8k3u/claude-code-memory?utm_source=chatgpt.com)**       | A fully local Claude Code memory plugin with typed memories, embeddings, hybrid search, automatic extraction, relation-building and lifecycle hooks.          |   ✓✓✓  |       ✓✓      |         ✓✓✓         |        ✓✓        |  ✓✓✓  |
| **[shihwesley/sixthsense](https://github.com/shihwesley/sixthsense?utm_source=chatgpt.com)**                 | Extracts learnings from Claude Code sessions into SQLite, scores them, synthesizes MEMORY.md, and automatically promotes valuable learnings into skills.      |   ✓✓   |      ✓✓✓      |          ✓✓         |        ✓✓✓       |  ✓✓✓  |
| **[melvenac/Self-Improving-Agent](https://github.com/melvenac/Self-Improving-Agent?utm_source=chatgpt.com)** | A complete persistent-memory protocol for coding agents with retrieval, pattern detection, skill generation, feedback and session hooks.                      |   ✓✓✓  |       ✓✓      |         ✓✓✓         |        ✓✓✓       |   ✓✓  |
| **[n2ns/n2n-memory](https://github.com/n2ns/n2n-memory?utm_source=chatgpt.com)**                             | Stores project knowledge as a Git-friendly knowledge graph in `.mcp/memory.json`, plus active task context in `.mcp/context.json`.                            |   ✓✓✓  |       ✓       |         ✓✓✓         |         —        |   —   |
| **[STiFLeR7/memex](https://github.com/STiFLeR7/memex?utm_source=chatgpt.com)**                               | Builds a bitemporal Neo4j graph of modules, symbols, decisions and problems from repository changes, with agents able to write decisions back.                |   ✓✓✓  |       ✓✓      |         ✓✓✓         |         ✓        |   —   |
| **[memory-graph/memory-graph](https://github.com/memory-graph/memory-graph?utm_source=chatgpt.com)**         | MCP memory server backed by a graph database that lets coding agents store patterns, relationships and persistent knowledge across sessions.                  |   ✓✓✓  |       ✓✓      |         ✓✓✓         |         ✓        |   —   |
| **[0xK3vin/MegaMemory](https://github.com/0xK3vin/MegaMemory?utm_source=chatgpt.com)**                       | Lets an agent build a persistent conceptual graph of features, modules, patterns and decisions and explicitly follow an `understand → work → update` loop.    |   ✓✓✓  |       ✓✓      |         ✓✓✓         |        ✓✓        |   —   |
| **[letta-ai/letta-code](https://github.com/letta-ai/letta-code?utm_source=chatgpt.com)**                     | A memory-first coding-agent architecture where agents modify their own memory/context and learn skills over long-running interactions.                        |   ✓✓✓  |      ✓✓✓      |          ✓✓         |        ✓✓✓       |   —   |
| **[dan-calin/shared-agent-memory](https://github.com/dan-calin/shared-agent-memory?utm_source=chatgpt.com)** | Gives Claude Code, Codex and other MCP clients one shared knowledge graph stored locally, with token-efficient project-scoped recall and secret filtering.    |   ✓✓✓  |       ✓       |         ✓✓✓         |         ✓        |   —   |

### 1. Claude-Mem — probably the first one I'd study

![Image](https://images.openai.com/static-rsc-4/aczlsk7T-XQF8Wazo_wv-HOhjCw1a_pTXoV7BzO5cmQI4FZOaryirc1E_zLuhs2at4tFUplw1I4K6QDR-5pL-nAdT0i3QdyaVc3NTbNJSVK64BhG1HPmStyUaO5Qi37R-PAGntGvN2MLdcellMNHydbyolclxb_J46c6NtJ6fBL_8CGDkGSkc_vzHvI7UOq2?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/5l3nj0BTUd-WW-EARPTTVNdqMPHpItf6drm08lDBfOrjLwRjMOOoI82VBSuM-QkvdyHwMvA4c1iul4KWG-posxuaNp4UVnQDNdvnOWLX2D8tSDbnLA0h7zN-7J3XHWn4q-ba9N8NuuURNhEuTEIjwCk_pEZ1f5Iv0EBJEYOafVgwBxOCcjOweww1A9nr3rQF?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/bQAA9Wc_SYJew4RDpL-6SNv5S5yKYVqgUFfaK3Zvjcu1h6f7YNh4TIIqOVePyhQZA6zD5FvDw1xaNRoMethxSqlZbm6pgKz8SFB0tViw609JKOROzYIePK3jatMY7IPB1Ki5iQenFi7BbdALU_R_Ltxgo2mhjdu6FSwa2fN2PMBgTfvEqT3eYbDuKX46XKLN?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/P7nCZS1oaID4ur9VxvPcasPbM7ntGsXccZpdiT6pyPQz_toSXyeh_Iw9kBbFp7YeZSEXEJgj1_VnkLJtEmE_MxisanoPHAJ7gJygM36GdV2pehrdSV8K-FmeiCLtWh9mD7su1Fx5cDaaPKRjCqsX31n68i8y9ORBUSFYuAsMOwL7j1or7ciC4UQxcLKDlYa2?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/t9FEu072xHSe76W9U3bl-yhLAEv8ysxQybejx7pBgDVDb93KAEA1xVPYlTbZAwT2TWUntV9WVSbKMBdzudyC_d30QtmER0XhisQ6HQxLJsoCx2Yyf8wmzImK-VigNc6WYkWCW-7a1nBRHR4WR2GutUv31ghVBOTIGUOgUioZ2JXZLqCx-kTh5YzhiPcTE3Kx?purpose=fullsize)

**[https://github.com/thedotmack/claude-mem](https://github.com/thedotmack/claude-mem?utm_source=chatgpt.com)**

This is one of the most mature implementations I found. It captures tool activity through lifecycle hooks, generates compressed semantic observations, persists them in a local database, and exposes a progressive-disclosure retrieval mechanism: **search → timeline → detailed observations** rather than dumping the entire memory corpus into context. ([GitHub][1])

What's particularly relevant to your project:

* Claude Code integration.
* Six lifecycle hooks.
* Persistent local database.
* Semantic compression.
* Automatic future-context injection.
* Progressive disclosure.
* MCP search tools.
* Cursor integration.
* Codex plugin support is now present as well. ([GitHub][2])

The architectural idea I'd steal is **not simply "save conversations"**, but the separation between:

> raw activity → observations → indexed memory → selective retrieval

That's much closer to a real knowledge system.

---

### 2. Claude Code Memory — extremely relevant to your exact question

**[https://github.com/d2a8k3u/claude-code-memory](https://github.com/d2a8k3u/claude-code-memory?utm_source=chatgpt.com)**

This one is particularly interesting because it goes beyond basic transcript recall.

It has explicit memory types:

* `episodic` — what happened
* `semantic` — facts about the project
* `procedural` — how to do something
* `pattern` — recurring behavior

It uses:

* SQLite
* `sqlite-vec`
* local embeddings
* hybrid retrieval
* deduplication
* relationship creation
* decay
* session-start injection
* session-end extraction
* Bash-error-triggered recall
* a memory curator

The repo explicitly describes automatic merging of near-duplicates and a relation graph whose weights evolve through usage. ([GitHub][3])

**This is one of the best matches for your "how is knowledge actually structured?" requirement.**

---

### 3. SixthSense — perhaps the most interesting learned-rule pipeline

**[https://github.com/shihwesley/sixthsense](https://github.com/shihwesley/sixthsense?utm_source=chatgpt.com)**

This is different from Claude-Mem.

Its central idea is:

**session → extraction → scoring → synthesis → promotion**

The implementation has:

```text
SessionEnd
   ↓
extract-learnings.py
   ↓
learnings.db
   ↓
score-learnings.py
   ↓
synthesize-learnings.py
   ↓
MEMORY.md
   ↓
backport-learnings.py
   ↓
SKILL.md / CLAUDE.md
```

The SQLite schema is unusually useful for studying this problem because it explicitly tracks:

* learning
* category
* source
* quality score
* tags
* learning signals
* session IDs
* backport status
* backport audit history
* session statistics
* tool failures

It also has thresholds for **deduplication, synthesis and promotion**. ([GitHub][4])

This is very close to the system you're describing if your objective is:

> "Claude repeatedly makes X mistake → detect that pattern → turn it into durable operational knowledge → eventually enforce/use that knowledge."

I'd put this **very high on your reading list**.

---

### 4. Self-Improving-Agent — unusually complete architecture

**[https://github.com/melvenac/Self-Improving-Agent](https://github.com/melvenac/Self-Improving-Agent?utm_source=chatgpt.com)**

This is another standout.

It describes itself as a persistent-memory protocol for AI coding agents and implements:

* persistent memory
* pattern recognition
* compound learning
* automatic skill proposals
* feedback
* retrieval
* session bootstrap
* session-end processing
* an Open Brain MCP server
* Obsidian-backed knowledge

The memory server exposes operations such as:

`ob_recall`, `ob_store`, `ob_store_chunk`, `ob_feedback`, `ob_forget`, `ob_list`, `ob_stats`, etc. ([GitHub][5])

The interesting architectural distinction is that it treats **memory as a protocol**, rather than simply a pile of markdown files.

For your project, I'd inspect its:

* memory data model
* feedback mechanism
* retrieval mechanism
* session lifecycle
* relationship between memory and generated skills

---

# Knowledge-graph-oriented implementations

These are particularly worth studying because they attack the problem from the **knowledge representation** side rather than the prompt side.

### 5. n2n-memory

**[https://github.com/n2ns/n2n-memory](https://github.com/n2ns/n2n-memory?utm_source=chatgpt.com)**

This one has a very clean philosophy:

> **Context as code. Memory as asset.**

Instead of a global memory database, it puts:

```text
project/
└── .mcp/
    ├── memory.json
    └── context.json
```

`memory.json` is a durable project knowledge graph; `context.json` is transient task state. Both are Git-friendly JSON. ([GitHub][6])

It provides explicit graph operations:

* add entities
* add observations
* create relations
* search
* open nodes
* delete entities/observations/relations
* export to Markdown

This is **very interesting if you want knowledge to be reviewable/versionable as part of the repository**.

---

### 6. memex

**[https://github.com/STiFLeR7/memex](https://github.com/STiFLeR7/memex?utm_source=chatgpt.com)**

This is one of the more sophisticated representations I found.

It builds a **bitemporal knowledge graph** containing things such as:

* modules
* symbols
* decisions
* problems
* lockfile facts

using:

```text
repository
   ↓
tree-sitter + Gemini
   ↓
Neo4j
   ↓
MCP
   ↓
Claude / Cursor / Codex / Gemini CLI
```

And importantly, the agent can write decisions back into the graph. ([GitHub][7])

The temporal aspect is particularly interesting because knowledge isn't necessarily timeless:

> "Service X uses Redis"

may become false six months later.

A bitemporal model gives you a mechanism for representing **knowledge validity over time**, which is considerably more sophisticated than `MEMORY.md`.

---

### 7. MemoryGraph

**[https://github.com/memory-graph/memory-graph](https://github.com/memory-graph/memory-graph?utm_source=chatgpt.com)**

A relatively straightforward graph-memory MCP server for coding agents.

It supports:

* persistent memory
* patterns
* relationships
* retrieval across sessions
* Claude Code
* SQLite by default
* optional FalkorDB backend

([GitHub][8])

Less ambitious than memex, but useful as a comparatively understandable implementation of **graph-native agent memory**.

---

### 8. MegaMemory

**[https://github.com/0xK3vin/MegaMemory](https://github.com/0xK3vin/MegaMemory?utm_source=chatgpt.com)**

This one takes a very interesting position:

> **The LLM itself is the indexer.**

Rather than parsing the repository into AST-level entities, the agent reads the project and writes conceptual nodes such as:

* feature
* module
* architecture
* pattern
* decision

The core loop is explicitly:

```text
understand
   ↓
work
   ↓
update
```

At session start the agent orients itself, before tasks it retrieves concepts, and after tasks it creates/updates concepts. ([GitHub][9])

This is **very relevant to your question about knowledge structure**, because it's essentially asking:

> "What should an agent's internal project ontology look like?"

---

### 9. lxDIG MCP

**[https://github.com/lexCoder2/lxDIG-MCP](https://github.com/lexCoder2/lxDIG-MCP?utm_source=chatgpt.com)**

This is more code-intelligence-heavy.

It combines:

* graph
* vector search
* BM25
* persistent agent memory
* code relationships
* multi-agent coordination
* impact-scoped test selection

and works with Claude Code, Cursor and VS Code Copilot. ([GitHub][10])

This is worth looking at if your eventual system needs to connect:

```text
learned knowledge
       ↕
project concepts
       ↕
actual source files / symbols
```

rather than maintaining memory independently of the codebase.

---

### 10. RemembrallMCP

**[https://github.com/roboticforce/remembrallmcp](https://github.com/roboticforce/remembrallmcp?utm_source=chatgpt.com)**

Another code graph + memory implementation.

It combines:

* tree-sitter
* field-aware code graph
* persistent memory
* Rust
* Postgres
* pgvector
* MCP

and models relationships down to functions, classes, methods and fields. ([GitHub][11])

I'd consider it more **codebase intelligence** than self-improvement, but the distinction is useful: it demonstrates how an agent's memory can be grounded against the actual structure of the repository.

---

# Systems specifically concerned with learning behavior

### 11. Self-Improving Skills

**[https://github.com/UniM0cha/self-improving-skills](https://github.com/UniM0cha/self-improving-skills?utm_source=chatgpt.com)**

This is probably the most directly relevant project I found for **learned procedural behavior**.

Its loop is:

```text
complex task
      ↓
detect useful technique
      ↓
distill
      ↓
create/patch SKILL.md
      ↓
validate
      ↓
use in future sessions
      ↓
eventually curate/archive
```

It has:

* Claude Code plugin
* Codex variant
* transcript analysis
* background distillation
* SQLite job queue
* skill validation
* rollback
* provenance
* usage telemetry
* stale-skill detection
* skill curation
* automatic archival

([GitHub][12])

One particularly important design decision:

**It deliberately distinguishes procedural memory from factual memory.**

Its author explicitly recommends letting native Claude memory or another memory system handle factual knowledge while this system handles reusable procedures/skills. ([GitHub][12])

That separation is conceptually important.

---

### 12. Engram

**[https://github.com/gentleman-programming/engram](https://github.com/gentleman-programming/engram/blob/main/plugin/claude-code/skills/memory/SKILL.md?utm_source=chatgpt.com)**

Engram has a Claude Code-specific memory protocol that is explicitly **always active**.

The skill instructs Claude to proactively save:

* decisions
* conventions
* bugs
* discoveries

rather than waiting for the user to say "remember this." ([GitHub][13])

It's useful to study as an example of the **behavioral protocol layer** sitting on top of a memory backend.

---

### 13. Session Continuity

**[https://github.com/talgolan/session-continuity](https://github.com/talgolan/session-continuity?utm_source=chatgpt.com)**

This one is deceptively interesting because it doesn't attempt to build a huge semantic memory engine.

It uses two explicit artifacts:

```text
SESSION_PRIMER.md
LEARNINGS.md
```

but then adds **action-keyed retrieval through hooks**.

A learning can contain something like:

```text
Trigger: Bash /regex/
```

and a `PreToolUse` hook detects that you're about to perform an operation related to that lesson and surfaces it **before the action**, rather than simply making the model read the learning file at startup. ([GitHub][14])

That's a very important idea:

### memory retrieval should sometimes be event-triggered rather than query-triggered.

This is probably one of the most directly useful ideas for your own architecture.

---

### 14. claude-memory / Cladest

**[https://github.com/gupsammy/Claudest](https://github.com/gupsammy/Claudest/blob/main/plugins/claude-memory/README.md?utm_source=chatgpt.com)**

This project distinguishes:

```text
conversation history
        ↓
recall memory
        ↓
distilled knowledge
        ↓
archival memory
```

It stores raw conversations in SQLite/FTS5, then has a learning-extraction skill identify things such as:

* debugging gotchas
* architectural decisions
* workflow patterns
* behavioral corrections

and propose where each should live:

* global CLAUDE.md
* repository CLAUDE.md
* MEMORY.md
* topic files

([GitHub][15])

That **memory-layer placement decision** is especially relevant to your project.

---

### 15. memento-mcp

**[https://github.com/lfrmonteiro99/memento-mcp](https://github.com/lfrmonteiro99/memento-mcp?utm_source=chatgpt.com)**

Local-first structured memory for Claude Code, Codex and Cursor.

It stores things like:

* facts
* decisions
* patterns
* architecture notes
* pitfalls
* session summaries
* preferences

in SQLite and optionally synchronizes selected knowledge through Git. ([GitHub][16])

This is another good implementation to compare against n2n-memory because both take the **structured local knowledge** route but make different storage choices.

---

# Multi-agent / cross-agent memory

### 16. shared-agent-memory

**[https://github.com/dan-calin/shared-agent-memory](https://github.com/dan-calin/shared-agent-memory?utm_source=chatgpt.com)**

The interesting problem here is not memory extraction but **memory interoperability**.

It makes:

```text
             shared memory
            /      |      \
      Claude     Codex    other MCP agents
```

all use the same knowledge graph.

It stores entities/observations in a local JSON-backed MCP memory system and adds:

* project scoping
* token-efficient retrieval
* secret scanning
* relationship-aware recall

([GitHub][17])

This is highly relevant if your eventual workflow isn't Claude-only.

---

### 17. cogmem

---

This one caught my attention because it treats memory as something that should itself be **verifiable**.

It's a self-improving memory layer for coding agents with:

* persistent memory
* local-first recall
* Claude Code hooks
* MCP
* semantic recall
* cryptographically signed/tamper-evident memories

([GitHub][18])

The cryptographic provenance angle is unusual and worth studying if you're thinking about **memory poisoning / bad learned rules**.

---

### 18. agentmemory

There are several forks/ports of this project, so be careful about which repository you study.

The current implementation family is represented by:

---

It explicitly targets:

* Claude Code
* Codex CLI
* Cursor
* Gemini CLI
* GitHub Copilot CLI
* OpenCode
* OpenClaw
* other MCP clients

and combines confidence scoring, lifecycle management, knowledge graphs and hybrid search. ([GitHub][19])

This is worth investigating particularly for the **multi-agent memory protocol** angle.

---

### 19. Mnemo Agent Memory

**[https://github.com/SiamAlSobari/mnemo-agent-memory](https://github.com/SiamAlSobari/mnemo-agent-memory?utm_source=chatgpt.com)**

A newer MCP memory implementation explicitly targeting coding agents.

Its repository contains:

* `src`
* tests
* skills
* prompts
* agent configuration
* dashboard
* installation/integration tooling

and targets Claude Desktop, Cursor, Windsurf, OpenCode and other MCP clients. ([GitHub][20])

I'd rank it below the projects above for architectural maturity, but it's useful as a current implementation to compare.

---

# Memory-first agent rather than a memory plugin

### 20. Letta Code

**[https://github.com/letta-ai/letta-code](https://github.com/letta-ai/letta-code?utm_source=chatgpt.com)**

This is architecturally different enough that I'd definitely study it.

Letta's premise is essentially:

> don't bolt memory onto a stateless coding agent; make memory part of the agent architecture.

It explicitly describes itself as a **memory-first coding agent**, with agents capable of programmatically rewriting their context, learning skills and adapting over time. ([GitHub][21])

For your research, this gives you a useful counterpoint to the Claude Code plugin ecosystem.

---

# Two more interesting ones

### 21. Yaucca

**[https://github.com/jakemannix/yaucca](https://github.com/jakemannix/yaucca?utm_source=chatgpt.com)**

A persistent Claude Code agent with:

```text
Core Memory
   ├── user
   ├── projects
   ├── patterns
   ├── learnings
   └── context

Archival Memory
   ↓
semantic vector search

Recall Memory
   ↓
recent conversation history
```

It uses FastAPI, SQLite, sqlite-vec and embeddings, with Claude Code hooks for startup and session persistence. ([GitHub][22])

The **three-tier memory architecture** is worth studying even if you don't use the implementation.

---

### 22. micro-SICA

---

This is much more experimental.

It's an implementation of the **Self-Improving Coding Agent / Ouroboros** idea:

```text
execute
  ↓
log
  ↓
reflect
  ↓
modify own code
  ↓
validate
  ↓
human approval
  ↓
new agent version
```

It has explicit persistent memory and an immutable `BIBLE.md` containing identity/constraints so that the self-modifying agent can't rewrite its own foundational rules. ([GitHub][23])

That makes it particularly interesting for your **self-improvement + safety boundary** research.

---

# Research-oriented self-improvement

### 23. Self-Improving Coding Agent

---

This is less of a Claude Code plugin and more of an experiment in an agent improving its own implementation.

The loop is:

```text
benchmark agent
      ↓
archive results
      ↓
agent modifies itself
      ↓
benchmark again
      ↓
repeat
```

([GitHub][24])

It's useful if your definition of "self-improvement" eventually extends beyond learning facts/rules into **actually modifying the agent's architecture**.

---

### 24. SIA — Self-Improving Software Engineering Agent

---

This is another research implementation that explicitly treats capabilities as benchmarkable modules and maintains persistent project memory containing lessons, failures and decisions. ([GitHub][25])

More research-oriented than practical Claude Code tooling, but useful for understanding the distinction between:

* retrying
* reflection
* learning
* memory retrieval
* actual agent improvement

---

# One repo you should absolutely inspect for hooks

### Anthropic's own Hookify

**[https://github.com/anthropics/claude-code/tree/main/plugins/hookify](https://github.com/anthropics/claude-code/blob/main/plugins/hookify/README.md?utm_source=chatgpt.com)**

This isn't a memory system, but it's directly relevant to your **"learned knowledge → enforceable rule"** question.

Hookify lets Claude analyze unwanted behaviors and turn them into rules like:

```text
.claude/hookify.some-rule.local.md
```

with:

* event
* pattern
* action
* enabled/disabled state

and supports Bash, file, prompt and stop events. ([GitHub][26])

The particularly interesting conceptual transition is:

```text
conversation
    ↓
undesirable behavior detected
    ↓
pattern extracted
    ↓
persistent rule
    ↓
PreToolUse/PostToolUse enforcement
```

That's almost exactly the **"learned rule becomes deterministic guardrail"** mechanism you're looking for.

There are, however, active 2026 issues around hookify installation/enforcement behavior, so I would study the architecture rather than assume every current version is production-perfect. ([GitHub][27])

---

# An important finding: Claude Code itself has now moved into this territory

This is worth emphasizing because it changes how I would approach your project.

Current Claude Code has its own built-in **auto memory** system. Claude maintains repository-scoped memory under:

```text
~/.claude/projects/<project>/memory/
```

with `MEMORY.md` acting as an index and topic files holding more detailed information. Claude loads only the first 200 lines / 25 KB of the index at session start. ([GitHub][28])

And Claude's own documentation makes an important distinction:

| Layer       | Intended purpose              |
| ----------- | ----------------------------- |
| `CLAUDE.md` | persistent instructions/rules |
| auto memory | learned facts/patterns        |
| skills      | reusable procedures           |
| hooks       | deterministic enforcement     |

([GitHub][28])

That division is actually very close to the architecture I'd recommend investigating.

There's also an interesting open Claude Code issue describing exactly the failure mode you're trying to solve: **Claude successfully records lessons in persistent memory but doesn't necessarily change its behavior because of those lessons.** ([GitHub][29])

That is a crucial distinction:

> **Remembering a rule ≠ following a rule.**

---

# My ranking for your particular research

If I were you, I would **not** read these 24 repositories sequentially. I'd build the research around these eight:

### Tier A — study the implementation deeply

**1. [Claude-Mem](https://github.com/thedotmack/claude-mem?utm_source=chatgpt.com)**
Best overall implementation of **capture → compression → storage → retrieval**.

**2. [Claude Code Memory](https://github.com/d2a8k3u/claude-code-memory?utm_source=chatgpt.com)**
Best example of **typed memory + embeddings + relations + lifecycle + decay**.

**3. [SixthSense](https://github.com/shihwesley/sixthsense?utm_source=chatgpt.com)**
Best example I found of **raw session → scored learning → synthesized memory → skill promotion**.

**4. [Self-Improving-Agent](https://github.com/melvenac/Self-Improving-Agent?utm_source=chatgpt.com)**
Best broad example of a **memory protocol + feedback + skill generation + hooks**.

**5. [MegaMemory](https://github.com/0xK3vin/MegaMemory?utm_source=chatgpt.com)**
Best example of treating memory as an **agent-maintained conceptual knowledge graph**.

**6. [memex](https://github.com/STiFLeR7/memex?utm_source=chatgpt.com)**
Best example of **temporal, repository-grounded structured knowledge**.

**7. [Self-Improving Skills](https://github.com/UniM0cha/self-improving-skills?utm_source=chatgpt.com)**
Best example of **learning procedures and turning them into reusable skills**.

**8. [Session Continuity](https://github.com/talgolan/session-continuity?utm_source=chatgpt.com)**
Best example of **memory being activated by the action the agent is about to perform**, rather than merely being injected at startup.

---

# The architecture I think is emerging

After looking across these projects, I don't think the optimal system is simply:

```text
Claude session
      ↓
save transcript
      ↓
vector DB
      ↓
retrieve similar transcript
```

The more interesting architectures are converging toward something like:

```text
                    ┌─────────────────────┐
                    │   Raw Session Data  │
                    └──────────┬──────────┘
                               ↓
                     ┌──────────────────┐
                     │ Observation /    │
                     │ Learning Extract │
                     └────────┬─────────┘
                              ↓
               ┌──────────────┴──────────────┐
               ↓                             ↓
        Episodic memory              Candidate learning
       "what happened"               "what should change?"
               │                             │
               ↓                             ↓
       Semantic memory              Procedural memory
       "what is true?"              "how should I act?"
               │                             │
               └──────────────┬──────────────┘
                              ↓
                    ┌──────────────────┐
                    │ Knowledge Graph  │
                    │ / Index / Store  │
                    └────────┬─────────┘
                             ↓
                     Retrieval / Ranking
                             ↓
                ┌────────────┴────────────┐
                ↓                         ↓
          Context injection         Action-triggered
                                    retrieval
                │                         │
                └────────────┬────────────┘
                             ↓
                       Claude session
                             │
                             ↓
                     observed behavior
                             │
                             ↓
                    feedback / outcome
                             │
                             └──────→ learning
```

And **then one more layer**:

```text
high-confidence repeated learning
              ↓
       procedural rule
              ↓
         SKILL.md
              ↓
       if deterministic
              ↓
         hook / guard
```

That last transition is, IMO, the really interesting unsolved part.

A system shouldn't necessarily turn every learning into a hook. It could have promotion stages:

```text
observation
    ↓
candidate learning
    ↓
validated learning
    ↓
repeated learning
    ↓
high-confidence rule
    ↓
procedural skill
    ↓
deterministic hook
```

The repos above collectively give you pieces of almost every stage of that pipeline.

**If your goal is to build a knowledge-base/self-improvement layer for your own Claude Code workflow, I'd start by reverse-engineering Claude-Mem + SixthSense + Claude Code Memory + Self-Improving Skills + Session Continuity, and use MegaMemory/memex to study the deeper knowledge-representation question.** ([GitHub][30])

[1]: https://github.com/thedotmack/claude-mem/blob/main/docs/public/introduction.mdx?utm_source=chatgpt.com "claude-mem/docs/public/introduction.mdx at main · thedotmack/claude-mem · GitHub"
[2]: https://github.com/thedotmack/claude-mem/blob/main/plugin/.codex-plugin/plugin.json?utm_source=chatgpt.com "claude-mem/plugin/.codex-plugin/plugin.json at main · thedotmack/claude-mem · GitHub"
[3]: https://github.com/d2a8k3u/claude-code-memory?utm_source=chatgpt.com "GitHub - d2a8k3u/claude-code-memory: A Claude Code plugin that gives Claude fully automatic, per-project cognitive memory with hybrid search, session lifecycle hooks, and local embeddings. · GitHub"
[4]: https://github.com/shihwesley/sixthsense?utm_source=chatgpt.com "GitHub - shihwesley/sixthsense: Self-learning memory for Claude Code. Your agent gets smarter every session — automatically. · GitHub"
[5]: https://github.com/melvenac/Self-Improving-Agent?utm_source=chatgpt.com "GitHub - melvenac/Self-Improving-Agent: Self-improving agent protocol — persistent memory, pattern recognition, and compound learning across AI coding sessions · GitHub"
[6]: https://github.com/n2ns/n2n-memory?utm_source=chatgpt.com "GitHub - n2ns/n2n-memory: Project-local MCP memory server for AI coding agents. Knowledge graph stored in .mcp/ inside each repo — isolated per project, Git-friendly JSON, dual-buffer (durable graph + active context). · GitHub"
[7]: https://github.com/STiFLeR7/memex?utm_source=chatgpt.com "GitHub - STiFLeR7/memex: Persistent memory for AI coding agents via MCP — a bitemporal knowledge graph of your codebase, served to Claude Code, Cursor, Gemini CLI, and any MCP client. Tree-sitter + Gemini Flash → Neo4j (via Graphiti). 12 MCP tools, hierarchical clusters, two-regime confidence decay. · GitHub"
[8]: https://github.com/memory-graph/memory-graph?utm_source=chatgpt.com "GitHub - memory-graph/memory-graph: A graph DB-based MCP memory server for coding agents with intelligent relationship tracking · GitHub"
[9]: https://github.com/0xK3vin/MegaMemory?utm_source=chatgpt.com "GitHub - 0xK3vin/MegaMemory: Persistent project knowledge graph for coding agents. MCP server with semantic search, in-process embeddings, and web explorer. · GitHub"
[10]: https://github.com/lexCoder2/lxDIG-MCP?utm_source=chatgpt.com "GitHub - lexCoder2/lxDIG-MCP: Dynamic Intelligence Graph (DIG) MCP server for AI coding agents. Persistent code knowledge graph, a code RAG improvement, with hybrid Graph + Vector + BM25 retrieval, agent memory, multi-agent coordination, and impact-scoped test selection. Works with Claude Code, VS Code Copilot, and Cursor. · GitHub"
[11]: https://github.com/roboticforce/remembrallmcp?utm_source=chatgpt.com "GitHub - roboticforce/remembrallmcp: Whole-codebase knowledge for AI coding agents. A field-aware code graph (functions, classes, methods, fields, references) plus persistent memory. Rust, Postgres + pgvector, MCP. · GitHub"
[12]: https://github.com/UniM0cha/self-improving-skills?utm_source=chatgpt.com "GitHub - UniM0cha/self-improving-skills: Hermes Agent-style self-improvement for Claude Code · GitHub"
[13]: https://github.com/gentleman-programming/engram/blob/main/plugin/claude-code/skills/memory/SKILL.md?utm_source=chatgpt.com "engram/plugin/claude-code/skills/memory/SKILL.md at main · Gentleman-Programming/engram · GitHub"
[14]: https://github.com/talgolan/session-continuity?utm_source=chatgpt.com "GitHub - talgolan/session-continuity: Cross-session memory for Claude Code projects via two in-repo docs: SESSION_PRIMER.md (current state) and LEARNINGS.md (hard-won bugs). · GitHub"
[15]: https://github.com/gupsammy/Claudest/blob/main/plugins/claude-memory/README.md?utm_source=chatgpt.com "Claudest/plugins/claude-memory/README.md at main · gupsammy/Claudest · GitHub"
[16]: https://github.com/lfrmonteiro99/memento-mcp?utm_source=chatgpt.com "GitHub - lfrmonteiro99/memento-mcp: Persistent memory MCP server with typed memories, decay scoring, and token-aware context injection · GitHub"
[17]: https://github.com/dan-calin/shared-agent-memory?utm_source=chatgpt.com "GitHub - dan-calin/shared-agent-memory: One shared memory for all your AI coding agents (Claude Code, Codex, any MCP client) via a single MCP server. · GitHub"
[18]: https://github.com/dcondrey/cogmem "https://github.com/dcondrey/cogmem"
[19]: https://github.com/B0904/Cagentmemory "https://github.com/B0904/Cagentmemory"
[20]: https://github.com/SiamAlSobari/mnemo-agent-memory?utm_source=chatgpt.com "GitHub - SiamAlSobari/mnemo-agent-memory: High-precision persistent memory & knowledge graph engine for AI coding agents via Model Context Protocol. · GitHub"
[21]: https://github.com/letta-ai/letta-code?utm_source=chatgpt.com "GitHub - letta-ai/letta-code: The memory-first coding agent · GitHub"
[22]: https://github.com/jakemannix/yaucca?utm_source=chatgpt.com "GitHub - jakemannix/yaucca: Yet Another Useless Claude Code Agent — persistent long-term memory for Claude Code · GitHub"
[23]: https://github.com/MrTsepa/micro-sica "https://github.com/MrTsepa/micro-sica"
[24]: https://github.com/MaximeRobeyns/self_improving_coding_agent "https://github.com/MaximeRobeyns/self_improving_coding_agent"
[25]: https://github.com/vermayuvraj/self-improving-agent "https://github.com/vermayuvraj/self-improving-agent"
[26]: https://github.com/anthropics/claude-code/blob/main/plugins/hookify/commands/hookify.md?utm_source=chatgpt.com "claude-code/plugins/hookify/commands/hookify.md at main · anthropics/claude-code · GitHub"
[27]: https://github.com/anthropics/claude-code/issues/81448?utm_source=chatgpt.com "[BUG] hookify plugin fails with \"No module named 'hookify'\" on every hook invocation · Issue #81448 · anthropics/claude-code · GitHub"
[28]: https://github.com/thevibeworks/claude-code-docs/blob/main/content/en/docs/claude-code/memory.md?utm_source=chatgpt.com "claude-code-docs/content/en/docs/claude-code/memory.md at main · thevibeworks/claude-code-docs · GitHub"
[29]: https://github.com/anthropics/claude-code/issues/36296?utm_source=chatgpt.com "Issue · GitHub"
[30]: https://github.com/thedotmack/claude-mem?utm_source=chatgpt.com "GitHub - thedotmack/claude-mem: Persistent Context Across Sessions for Every Agent – Captures everything your agent does during sessions, compresses it with AI, and injects relevant context back into future sessions. Works with Claude Code, OpenClaw, Codex, Gemini, Hermes, Copilot, OpenCode + More · GitHub"

# DeepSeek

Here are GitHub repositories that implement persistent memory, learned behaviors, knowledge bases, self-improvement, or hook enforcement for coding agents — with an emphasis on actual implementation and knowledge architecture.

---

## Persistent Memory & Cross-Session Recall

### 1. claude-mem (thedotmack/claude-mem)
**URL:** https://github.com/thedotmack/claude-mem (89k+ stars)

**What it does:** Captures everything your agent does during sessions, compresses it with AI, and injects relevant context back into future sessions — works with Claude Code, OpenClaw, Codex, Gemini, Hermes, and Copilot.

**Addresses:** Memory persistence, knowledge structure (compression + relevance injection).

---

### 2. total-agent-memory (vbcherepanov/total-agent-memory)
**URL:** https://github.com/vbcherepanov/total-agent-memory

**What it does:** Persistent memory with auto-extracted knowledge graph, multi-representation embeddings, and 3D WebGL visualization — achieving LongMemEval R@5=97.45% with self-hosted Ollama optional. Tracks sessions, consolidated error patterns, and active behavioral rules with fire counts.

**Addresses:** Memory persistence, knowledge structure (knowledge graph + embeddings + session tracking), learned rules.

---

### 3. deep-memory (kevintsai1202/deep-memory)
**URL:** https://github.com/kevintsai1202/deep-memory

**What it does:** A self-evolving knowledge accumulation system with hybrid retrieval (ChromaDB + BM25 + BGE-Reranker) that turns your agent into a "second brain" — hot/cold tiered storage, cross-skill memory, and proactive experience capture.

**Addresses:** Memory persistence, knowledge structure (tiered storage + hybrid retrieval), self-improvement loop, learned rules.

---

### 4. agent-memory (OctavianTocan/agent-memory)
**URL:** https://github.com/OctavianTocan/agent-memory

**What it does:** Persistent, structured memory via SQLite + semantic search with hooks for Claude Code, Cline, Gemini CLI, Codex, Aider, Cursor, and Windsurf — all agents on your machine share one database. Three layers: hook/context injection, CLI subcommands, and SQLite with facts, soul, daily_logs, and embeddings tables.

**Addresses:** Memory persistence, knowledge structure (SQLite + embeddings + shared across agents), hook enforcement.

---

### 5. am-memory (danielwanwx/am-memory)
**URL:** https://github.com/danielwanwx/am-memory

**What it does:** SQLite-backed persistent memory with BM25+Vector search and MCP integration — a self-evolving knowledge layer that surfaces relevant context automatically. Four semantic layers: FTS5 virtual table (trigram tokenizer, BM25 ranking), sqlite-vec (HNSW index), documents table with priority tiers (P0 never expires, P1 90 days, P2 30 days), and session lifecycle.

**Addresses:** Memory persistence, knowledge structure (FTS5 + vector + priority tiers + LRU), self-improvement loop (session promotion).

---

### 6. Pseudolife-MCP (Pseudogiant-xr/Pseudolife-MCP)
**URL:** https://github.com/Pseudogiant-xr/Pseudolife-MCP

**What it does:** Long-term memory with an 8-band continuum from "working" to "forever," ranked by hybrid dense-plus-lexical similarity, contradiction detection, supersession, and a "dreams" extractor that consolidates memory into facts and a knowledge graph.

**Addresses:** Memory persistence, knowledge structure (8-band continuum + contradiction detection + version history), learned rules (do/avoid guidance from successes and dead-ends).

---

### 7. agent-memory-mcp-server (AiAgentKarl/agent-memory-mcp-server)
**URL:** https://github.com/AiAgentKarl/agent-memory-mcp-server

**What it does:** MCP server giving agents a persistent knowledge store that survives across sessions, tools, and even different agent frameworks.

**Addresses:** Memory persistence, knowledge structure.

---

### 8. claude-agent-memory (itskrishna21/claude-agent-memory)
**URL:** https://github.com/itskrishna21/claude-agent-memory

**What it does:** Passively accumulates long-term knowledge from Claude Code sessions into `~/.claude/agents/*.md` files.

**Addresses:** Memory persistence (passive accumulation).

---

### 9. memorize (shakystar/memorize)
**URL:** https://github.com/shakystar/memorize

**What it does:** Shared, persistent memory — Claude Code & Codex share one local-first, event-sourced project brain that survives sessions and syncs across machines. Records work signals, distills into long-term memory, injects right context when sessions start.

**Addresses:** Memory persistence, knowledge structure (event-sourced + distillation), hook enforcement.

---

### 10. Hippocamp
**URL:** https://www.npmjs.com/package/hippocamp

**What it does:** Local Git-backed memory for AI coding agents — plain Markdown in a private Git repo, no database, no vector store. Stores durable preferences, current project state, open threads, decisions, and references to commits/PRs/issues. Git provides auditability, readability, collaboration, portability.

**Addresses:** Memory persistence, knowledge structure (Git-backed Markdown + project-scoped memory), hook enforcement.

---

### 11. Pensieve (esparkman/pensieve)
**URL:** https://www.npmjs.com/package/@esparkman/pensieve

**What it does:** Persistent memory MCP server for Claude Code that remembers decisions, preferences, and context across conversation boundaries.

**Addresses:** Memory persistence.

---

### 12. Meridian (meridianmcp/mcp)
**URL:** https://www.npmjs.com/package/@meridianmcp/mcp

**What it does:** Persistent memory, task coordination, and HITL queue for Claude Code, Cursor, Windsurf, Codex CLI — includes task log, pinned decisions, human-in-the-loop queue, and tiered handoffs.

**Addresses:** Memory persistence, learned rules (pinned decisions).

---

## Learned Behaviors & Rules Extraction

### 13. learned-behavior (lisn0/learned-behavior)
**URL:** https://github.com/lisn0/learned-behavior

**What it does:** Self-improving memory that observes what your agent does, distills recurring patterns into lessons, surfaces relevant ones before each task, and auto-promotes rules that keep proving themselves while decaying stale ones — with **no LLM in the loop**, pure behavioral signal from agent hook events. Captures repeated failures, skill bypasses, repeated edit self-corrections, and PreToolUse blocks. Every lesson has confidence score and status (candidate → approved → dormant).

**Addresses:** Learned rules, self-improvement loop (confidence scoring + promotion/decay), hook enforcement (PreToolUse blocks).

---

### 14. pi-continuous-learning
**URL:** https://www.npmjs.com/package/pi-continuous-learning

**What it does:** Pi extension that watches coding sessions and distills patterns into reusable instincts — atomic learned behaviors with confidence scoring, project scoping, and closed-loop feedback validation.

**Addresses:** Learned rules, self-improvement loop (confidence scoring + feedback validation), hook enforcement.

---

### 15. agent-learner (cafitac/agent-learner)
**URL:** https://www.npmjs.com/package/@cafitac/agent-learner

**What it does:** Reusable learning control plane for coding-agent workflows — captures learned rules from agent work, keeps repo-scoped and global learning assets in one canonical global store, reviews candidates, and promotes useful rules via dashboard UI.

**Addresses:** Learned rules, knowledge structure (canonical global store + review/promotion workflow), self-improvement loop.

---

### 16. smart-agent-cc
**URL:** https://www.npmjs.com/package/smart-agent-cc

**What it does:** Learns skills from coding conversations automatically — extracts reusable workflow skills AND project knowledge via LLM, captures preferences, gotchas, architecture decisions.

**Addresses:** Learned rules, knowledge structure, memory persistence.

---

### 17. self-learning-skills (kulaxyz)
**URL:** https://github.com/kulaxyz/self-learning-skills

**What it does:** A "meta-skill" that addresses AI coding agents losing learned knowledge between sessions — tracks successful workflows, commands, skills, and rules including failures.

**Addresses:** Learned rules, self-improvement loop.

---

### 18. continuous-learning-v2
**URL:** https://skillsmp.com/continuous-learning-v2

**What it does:** Instinct-based learning system that observes sessions via hooks, creates atomic instincts with confidence scoring, and evolves them into skills/commands/agents — v2.1 adds project-scoped instincts to prevent cross-project contamination.

**Addresses:** Learned rules, self-improvement loop, hook enforcement.

---

## Knowledge Bases (Agent-Read/Write)

### 19. knowledge-mcp (Dantesong/knowledge-mcp)
**URL:** https://github.com/Dantesong/knowledge-mcp

**What it does:** Local MCP server giving Claude Code persistent memory through a git-managed knowledge base — exposes 9 tools: `kb_search`, `kb_read`, `kb_write` (auto git commit), `kb_log_decision`, `kb_index`, `kb_init`, `kb_link_track`, `kb_drift`, `kb_drift_all`. Features **drift detection** — links each doc to the code it documents via YAML frontmatter with `last-verified-commit`, `code-repo`, `code-tracks`.

**Addresses:** Knowledge structure (git-managed + drift detection + verification), memory persistence.

---

### 20. my-memory-wiki
**URL:** https://www.npmjs.com/package/my-memory-wiki

**What it does:** Git-synced, agent-maintained team memory for Claude Code — knowledge lives as Markdown in your repo under `.memory/`, shared through git, gated by PR review. Two tiers: Tier 0 = constraints (hard rules, always loaded), Tier 1 = knowledge (decisions, conventions, library notes, retrieved on demand). MCP server exposes `memory.search` (BM25), `memory.remember`, `memory.related`, `memory.lint`.

**Addresses:** Knowledge structure (two-tier + git + PR review gate), memory persistence, learned rules, hook enforcement.

---

### 21. roboto-mem
**URL:** https://socket.dev/npm/package/roboto-mem

**What it does:** Team Memory sync for Claude Code — git-backed knowledge base injected into agent sessions. Entries are Standards (authored rules, always in force) or Lessons (learned gotchas).

**Addresses:** Knowledge structure (Standards + Lessons), memory persistence, learned rules.

---

### 22. obsidian-agent-wiki
**URL:** https://socket.dev/npm/package/obsidian-agent-wiki

**What it does:** Personal knowledge base powered by Obsidian, Claude Code, qmd, and GitHub — Claude reads sources and writes wiki pages, cross-links, flags contradictions; qmd provides local hybrid search (vector + BM25).

**Addresses:** Knowledge structure (Obsidian + hybrid search), memory persistence.

---

### 23. ContextKeeper (contextkeeper-mcp)
**URL:** https://www.npmjs.com/package/contextkeeper-mcp

**What it does:** Records architectural decisions as plain markdown files in your repo, indexes them with SQLite, and injects relevant ones into every Claude Code session via deterministic hooks. Retrieval is deterministic: path globs + tags + FTS5 + recency — no embeddings, 100% reliable recall. Two modes: auto (aggressive recording) and manual (explicit control).

**Addresses:** Knowledge structure (markdown + SQLite + deterministic retrieval), memory persistence, hook enforcement.

---

## Self-Improving Agent Workflows

### 24. self-improving-agent (BerriAI)
**URL:** https://github.com/BerriAI/self-improving-agent

**What it does:** Drop-in self-improvement loop for any AI agent — two tools. The agent proposes a minimal diff, you approve, a draft PR opens. Agent fixes itself under explicit human approval, addressing skipped setup steps, vague prompts, wrong tool routing.

**Addresses:** Self-improvement loop.

---

### 25. self_improving_coding_agent (MaximeRobeyns)
**URL:** https://github.com/MaximeRobeyns/self_improving_coding_agent

**What it does:** A coding agent framework that works on its own codebase — an iterative improvement loop.

**Addresses:** Self-improvement loop.

---

### 26. Self-Improving-Agent (Grail-Computer)
**URL:** https://github.com/Grail-Computer/Self-Improving-Agent

**What it does:** Starter template instructing agents to always update their rules and context to learn from every interaction — includes Codebase Map, Local Norms, Guardrails, and Patterns & Gotchas.

**Addresses:** Self-improvement loop, learned rules, knowledge structure.

---

### 27. Prime Agent (PrimeIntellect-ai/prime-agent)
**URL:** https://github.com/PrimeIntellect-ai/prime-agent

**What it does:** Open-source harness for long-horizon evaluation and coding-agent workflows with memories and skills.

**Addresses:** Self-improvement loop, memory persistence, learned rules.

---

## Hook-Based Enforcement

### 28. steerhook (meganemura/steerhook)
**URL:** https://github.com/meganemura/steerhook

**What it does:** Rules that block or warn before Claude Code runs a tool and tell Claude the alternative — a fork of Anthropic's hookify plugin. Key difference: rule message reaches Claude (not just the user), so Claude learns the alternative at the moment it matters. Rules live in `~/.claude/steerhook/` and apply in every project; projects can override or disable rules.

**Addresses:** Hook enforcement, learned rules (Claude learns alternatives).

---

### 29. monkeyleash (wusuowei-tw/monkeyleash)
**URL:** https://github.com/wusuowei-tw/monkeyleash

**What it does:** Six-stage gates for AI coding agents — rules that block, not rules that ask nicely. Machine-enforced gates for a test-first development pipeline using git hooks and Claude Code hooks that refuse to let agents (or humans) skip steps.

**Addresses:** Hook enforcement.

---

### 30. pi-hookify (nunofgs/pi-hookify)
**URL:** https://github.com/nunofgs/pi-hookify

**What it does:** Hook enforcement extension for pi coding agent — create rules from natural language that block or allow tool calls via shell commands. Example: `/hookify Don't allow git push -f` generates a shell command hook and saves it. Hooks stored in `~/.pi/hookify/hooks.json`.

**Addresses:** Hook enforcement, learned rules (natural language → shell hooks).

---

### 31. chock
**URL:** https://pypi.org/project/chock

**What it does:** Your repo's rules become deterministic guardrails — compiled to git hooks + CI gate + native pre-execution hooks (Claude Code and Cursor) + AGENTS.md, across 14 agents.

**Addresses:** Hook enforcement.

---

### 32. right-hooks
**URL:** https://www.npmjs.com/package/right-hooks

**What it does:** Auto-detects project type, installs hooks, copies rules and templates, configures Claude Code, and sets up git hooks — Claude Code hooks control agent behavior, git hooks via husky control git operations, behavioral rules guide agent decisions through `.claude/rules/`.

**Addresses:** Hook enforcement.

---

## Summary Table by Concern

| Concern | Top Repositories |
|---------|------------------|
| **Memory Persistence** | claude-mem, total-agent-memory, deep-memory, agent-memory, am-memory, Pseudolife-MCP, memorize, Hippocamp, ContextKeeper |
| **Learned Rules** | learned-behavior, pi-continuous-learning, agent-learner, smart-agent-cc, self-learning-skills, continuous-learning-v2 |
| **Knowledge Structure** | knowledge-mcp (drift detection), my-memory-wiki (two-tier), total-agent-memory (knowledge graph), deep-memory (tiered + hybrid), am-memory (FTS5+vector+priority), ContextKeeper (deterministic), Hippocamp (Git-backed Markdown) |
| **Self-Improvement Loop** | learned-behavior (confidence+promotion/decay), deep-memory, self-improving-agent, self_improving_coding_agent, pi-continuous-learning, agent-learner |
| **Hook Enforcement** | steerhook, monkeyleash, pi-hookify, chock, right-hooks, agent-memory, ContextKeeper |

---

## Repositories You Already Studied (for reference)

- **browser-harness (browser-use)** — Not in results; likely browser automation.
- **TencentDB-Agent-Memory (Tencent)** — Not surfaced in these searches.
- **everything-claude-code and ECC (affaan-m)** — Not surfaced.
- **superpowers** — Not surfaced.