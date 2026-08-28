# Tracking Claude Code Sessions, Subagents, and Tool Calls for a Custom Harness

**Research report — August 21, 2026**

**This is research, not a plan.** The task it feeds — tracking every session, subagent and tool call — sits in `backlog.md` at the repo root under *Sessions still to hold*, and nothing about it is designed yet.

## 0. Purpose and framing

You're building a custom harness/framework around Claude Code (comparable in ambition to things like Superpowers, but broader in scope). A core requirement of that harness is full-fidelity observability: every session, every subagent, every tool call, per-file access history (read counts, which session touched what, lock state), and a live-updating snapshot of "where things stand" as a session progresses. This document is a research dump plus design analysis, meant as raw material for your own brainstorming — not a single prescribed solution. Several viable approaches exist and they're not mutually exclusive.

---

## 1. What Claude Code already gives you (research findings)

### 1.1 Session transcripts (JSONL on disk)

- Every session is stored as a JSONL transcript at `~/.claude/projects/<encoded-cwd>/<session-id>.jsonl` (or under `$CLAUDE_CONFIG_DIR/projects/...` if that env var is set). `<encoded-cwd>` is the absolute working directory with every non-alphanumeric character replaced by `-`; if the encoded name would exceed 200 characters, Claude Code truncates it and appends a hash.
- Each line is a JSON object: user prompt, assistant response (text/thinking/tool-use content blocks), tool result, system/meta entries. Multiple independent sources describe it as a **chain of typed records linked by `parentUuid`**, with full tool inputs and per-turn token usage recorded.
- **Official caveat, stated directly in the docs**: *"The entry format is internal to Claude Code and changes between versions, so scripts that parse these files directly can break on any release."* Anthropic explicitly steers you toward `/export`, the script interfaces (`claude -p --output-format json/stream-json`), or the Agent SDK instead of parsing the JSONL yourself.
- Retention: local transcripts are swept by the `cleanupPeriodDays` setting (default appears to be 30 days based on secondary sources — verify in your own `settings.json` / docs before relying on it).
- You can rename the project directory Claude Code writes to (`CLAUDE_CODE_PROJECT_DIR_NAME` + `CLAUDE_CONFIG_DIR`), which is useful if you're running many isolated harness instances (e.g., one per tenant/task) and want predictable, non-path-derived storage locations.

### 1.2 Subagent transcripts are separate files ("sidechains")

- Subagent conversations are **not** appended into the parent's transcript. They're written as their own JSONL files, described by multiple sources as living in a subagent directory alongside the parent session file (sidechain files).
- The **`Agent` tool's result contains an `agentId:` trailer** in the parent transcript — this is how the parent conversation references which subagent transcript corresponds to which `Agent`/`Task` tool call. This is likely your cleanest correlation key if you go the transcript-parsing route (see §2.4).
- A subagent's transcript is resumable independently: "resume the same session and reference that ID to continue a subagent where it stopped."
- One source states subagent transcripts "survive [the main conversation's] compaction" — i.e., compacting the parent doesn't touch subagent history.
- **Conflicting information found in research**: the official Claude Code docs (`sub-agents.md` table of contents) list a heading *"Let subagents spawn their own subagents"* as a supported/documented topic, implying arbitrary-depth nesting is possible in Claude Code proper. A secondary source (Inference.net guide, dated mid-2026) states flatly *"Subagents also can't spawn their own subagents"* in the context of the **Agent SDK's** `Workflow` tool discussion. This may be a Claude Code vs. Agent SDK distinction, a version-dependent behavior, or simply an error in the secondary source. **Verify directly before assuming arbitrary subagent nesting depth** — it materially affects whether your folder hierarchy needs to be recursive or just two levels (session → subagent).

### 1.3 Hooks: the structured event bus (recap + additions)

Already covered in depth in our earlier discussion; key points repeated here for completeness of this report, plus a few additions from closer reading of the reference:

- Full event list (abbreviated): `SessionStart`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Notification`, `MessageDisplay`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PreCompact`, `PostCompact`, `Elicitation`, `ElicitationResult`, `SessionEnd`.
- Common input fields on every hook call: `session_id`, `prompt_id` (correlates to OTel `prompt.id`), `transcript_path`, `cwd`, `permission_mode`, `effort`, `hook_event_name`.
- **When running inside a subagent** (or with `--agent`), two extra fields appear: `agent_id` and `agent_type`. This is the native correlation key for subagent attribution — no transcript parsing needed.
- `PreToolUse` can **deny**, **allow**, **ask**, or **defer** a tool call, and can rewrite the tool's input (`updatedInput`) before it runs. This is what makes real file-locking (not just observation) possible.
- `PostToolUse` can rewrite the tool's *output* (`updatedToolOutput`) before Claude sees it — useful if you want to inject computed metadata (e.g., "this is the 4th read of this file this session") back into Claude's own context.
- Hooks can also be scoped narrowly: defined in **skill frontmatter** (persists for the rest of the session once invoked) or **subagent frontmatter** (active only while that subagent runs, and a `Stop` hook there is automatically treated as `SubagentStop`). This means a harness could ship *per-skill* or *per-subagent-type* tracking behavior without touching global settings.
- `SessionEnd` hooks share a tight combined **1.5-second time budget** across all `SessionEnd` hooks (extendable per-hook up to 60s via `timeout`) — don't put expensive aggregation work there; use it only to flag/trigger, not to compute.
- `$CLAUDE_CODE_REMOTE` and (from v2.1.199) `$CLAUDE_CODE_BRIDGE_SESSION_ID` are available in the hook's environment — useful if your harness needs to distinguish local CLI runs from Remote Control-bridged sessions.
- Note: **`OTEL_*` exporter environment variables are stripped from every hook subprocess** — if your hook script wants to emit its own OTel spans, you cannot simply inherit the parent's OTel config; you'd need to configure it independently inside the hook.
- Plugins can bundle hooks (`hooks/hooks.json`) *and* **"background monitors"** as a first-class plugin component type. This is worth investigating further — if a plugin monitor component is what it sounds like (a long-running background watcher process scoped to a plugin), it might be a more natural home for continuous aggregation/reduction work than a hook that fires-and-exits on every event. This wasn't explored in depth in this pass and is worth a follow-up doc read (`plugins-reference.md` → "Monitors").

### 1.4 The Agent SDK's `SessionStore` adapter — a third architecture (new finding)

This is the most significant thing surfaced in this round of research and wasn't covered in our earlier discussion. If your harness is willing to run Claude Code via the **Agent SDK** (TypeScript or Python) rather than shelling out to the bare `claude` CLI, there is an **officially documented, purpose-built mechanism** for exactly the "mirror everything to my own structured storage" problem:

- You implement a `SessionStore` interface (methods roughly: read, append/write, delete, list, list-subkeys) and pass it into SDK session options (`sessionStore` in TS, `session_store` in Python).
- **Dual-write architecture**: the SDK/CLI still writes the local JSONL transcript first, then forwards (`append()`) to your store as a mirror. So you don't lose the local transcript as a fallback — your store is additive.
- **`SessionKey` shape**: `{ projectKey, sessionId, subpath? }` — `subpath` is specifically documented as being set **for subagent transcripts or sidecar files**. This means subagent correlation is a first-class, structural part of the interface, not something you infer.
- Mirror writes are **best-effort**: a failed append emits a system `mirror_error` message rather than crashing the query — you're expected to monitor for `mirror_error` to detect store data loss.
- `sessionStore` is incompatible with `persistSession: false` or `enableFileCheckpointing` — a constraint to be aware of if you also want checkpointing.
- On resume, the store must implement `listSubkeys` to restore subagent files, or only the main transcript materializes.
- Deleting a main session key must **cascade** to subagent subkeys — the docs explicitly warn implementers to either handle this or treat the backend as append-only (simpler, avoids the cascading-delete bug class entirely).
- Retention/TTL is entirely your responsibility — "the SDK never deletes from your store."
- Real reference implementations exist to study: several community write-ups mention official/reference adapters (Postgres, S3, Redis-style patterns) and there's a `listSessions()` / `getSessionMessages()` / `getSubagentMessages()` API surface in both SDKs for reading sessions back out, whether local or store-backed.

**Why this matters for your harness**: this is Anthropic's own answer to "I want every session and subagent transcript mirrored into infrastructure I control, with subagents correlated by construction." If your harness architecture can tolerate running through the SDK (as opposed to needing to observe an arbitrary, user-launched `claude` CLI process you don't control), this is likely more robust and more future-proof than hook-based JSONL scraping, because it's a documented contract rather than an internal file format.

The trade-off: it requires your harness to *own the process launch* (you're calling `query()`/`ClaudeSDKClient`), rather than passively observing a CLI session someone else started. If part of your goal is "observe any Claude Code session, launched however, including by other people/tools," the SDK SessionStore won't cover that — hooks (§1.3) or the proxy (§1.5) are your only options there, since they attach to *any* running session regardless of launcher.

### 1.5 The HTTP proxy layer (your attached script, and the pattern in general)

Recap of the earlier analysis, refined:

- Sits between the CLI (or SDK) and `api.anthropic.com`, transparently forwarding requests/responses. Requires `ANTHROPIC_BASE_URL` (or equivalent) to point at it.
- Gets you **byte-exact** request/response bodies — the only approach here that gives you literal wire-format truth, including exact context window contents, exact tool schemas as sent, and real billed token counts straight from `usage` in the response.
- Weaknesses (unchanged from earlier analysis): no native concept of session/subagent identity, must reconstruct tool-call structure by parsing streamed SSE `tool_use`/`tool_result` blocks, can't gate/block anything (pure passthrough), and doesn't compose with Bedrock/Vertex/Foundry-style auth (those route through cloud-provider SDKs, not a simple base-URL override) — this matters if your harness needs to support users on those providers.
- One thing worth reconsidering: **could still be a useful *secondary* fidelity layer** even in a hooks-first or SDK-first design — e.g., run it purely for token/cost/context-audit purposes (which is what your attached script already does well), completely decoupled from the "which file, which session, which subagent" tracking that hooks/SessionStore handle better.

### 1.6 OpenTelemetry export (`monitoring-usage`)

- Claude Code has built-in OTel metrics and events export, gated by admin/managed settings (`OTEL_*` config, with **managed settings able to lock the OTLP destination** so end users can't redirect telemetry).
- Metrics: session counter, lines-of-code counter, PR counter, commit counter, cost counter, token counter, "code edit tool decision" counter, active-time counter.
- Events (more relevant to you): user prompt, assistant response, **tool result**, API request, API error, API refusal, API request body, API response body, **tool decision**, permission-mode-changed, auth, MCP server connection, internal error, plugin installed/loaded, skill activated, at-mention, API-retries-exhausted, hook registered/execution-start/execution-complete/plugin-metrics, compaction, **subagent completed**, feedback survey, retention sweep.
- Events carry **correlation attributes** including `prompt.id` — matching the `prompt_id` field hooks receive, so hook-derived logs and OTel events can in principle be joined on that ID.
- This is a coarser, aggregate/dashboard-oriented system (think Grafana/Datadog), not a per-file-access-history system. Best treated as a complementary rollup layer, not a primary data source for your use case — unless you specifically want cross-machine/cross-user aggregation.
- Traces (beta) are also available, with a documented span hierarchy and span attributes — worth a closer look later if you want distributed-tracing-style visualization (e.g., a subagent tree as a trace waterfall) rather than building that yourself from hook events.

### 1.7 Adjacent primitives worth knowing about

A few things surfaced in the docs map that don't solve your core problem directly but are relevant context for a harness of this scope:

- **`agent-view`**: Claude Code's own background-session manager. `claude agents --json` (per the docs TOC) lists sessions programmatically. If your harness dispatches background/parallel sessions, this may already give you a session inventory you'd otherwise have to build yourself. Worth investigating instead of reimplementing a session registry from scratch.
- **Checkpointing limitations** (explicitly documented, important caveat for any "what changed" tracking you build): *Bash command changes are not tracked* by checkpointing, and *subagent edits are not restored* by checkpoint rewind. If your harness's file-tracking is meant to double as an undo/audit mechanism, don't assume checkpoint data covers everything a hook-based file-access log would.
- **Cross-session messaging**: sessions can message each other directly (with delivery, idle notices, an inbox socket), and this can be restricted/turned off per session. If your harness coordinates multiple concurrent sessions, this is a built-in coordination primitive you might use or need to account for/observe, rather than building your own.
- **Worktree isolation**: subagents (and background sessions) are, by default, isolated into separate git worktrees — this is the *existing* mechanism preventing most file-conflict scenarios between concurrent agents. A custom file-locking layer (as discussed previously) is mainly additive value when worktree isolation is disabled or when you want *visibility* into concurrent access even though worktrees already prevent *conflicts*.
- **`/context` and `context-window.md`**: documented ways to inspect what's currently consuming context and what survives compaction, from inside a running session — potentially useful for a harness feature that mirrors what your attached proxy script's "audit" table was trying to do (rank what's eating context), but sourced from Claude Code's own accounting rather than reconstructed externally.
- **`debug-your-config.md`**: "See what loaded into context," check resolved settings/hooks/MCP servers, test against a clean configuration — useful for harness-level debugging/support tooling, not runtime tracking, but relevant if you're shipping this to other users.
- **Plugin distribution**: if the tracking system matures, it can be packaged and distributed as a **plugin** (bundling hooks + settings + possibly a monitor component), which gives you versioning, marketplace distribution, and per-project/per-team enablement for free, rather than asking users to hand-edit `settings.json`.

---

## 2. Candidate architectures, compared

| Approach | Session ID | Subagent correlation | File-level granularity | Can gate/block | Works on any launcher (CLI/IDE/web) | Format stability | Setup cost |
|---|---|---|---|---|---|---|---|
| **A. HTTP proxy** (your script) | Must infer | Must infer from stream | Must reconstruct from tool_use blocks | No | No (needs base-URL override; breaks on Bedrock/Vertex/Foundry) | Wire format is the stable public API | Low |
| **B. Hooks → structured JSONL** | Native (`session_id`) | Native (`agent_id`/`agent_type`) | Native (`tool_input.file_path`) | Yes (`PreToolUse` deny/allow/ask) | Yes — same hooks fire in terminal, IDE, Desktop, web | Hook schema is a documented, versioned public contract | Medium |
| **C. Agent SDK `SessionStore`** | Native | Native (`subpath` in `SessionKey`) | Requires parsing transcript content yourself (store gets raw transcript data, not a pre-extracted file index) | No (storage layer only; combine with hooks for gating) | No — only for sessions *you* launch via the SDK | Documented adapter contract, but transcript *content* schema still carries the "may change" caveat | Medium-high (own the process launch) |
| **D. Direct JSONL tailing/parsing** | Native (filename) | Via `agentId:` trailer / sidechain dir | Requires parsing tool-use content blocks yourself | No | Yes, if you can watch the filesystem | **Explicitly disclaimed by Anthropic as unstable across versions** | Low-medium, but fragile |
| **E. OpenTelemetry export** | Via `prompt.id` correlation attr | Only via a "subagent completed" event, not per-tool-call | No (aggregate metrics/events, not per-file) | No | Yes | Documented, versioned | Medium (needs collector infra) |

### Recommended framing

None of these is strictly dominant; they answer different questions:

- **B (hooks)** is the best fit for exactly what you described: granular, real-time, session+subagent+file correlated, and the only one that can *act* (deny a tool call, rewrite input/output) rather than just observe. This should almost certainly be your **primary** layer regardless of what else you add.
- **C (SessionStore)** is worth serious consideration if your harness is architecturally willing to be "the thing that launches Claude Code" via the SDK rather than a bystander to CLI sessions — it gives you an officially-supported mirror of full transcripts (including subagents, by construction) into your own DB/object storage, which is a stronger foundation for long-term historical querying ("show me every session that touched this file across the last month") than hand-rolled JSONL logs. It doesn't replace hooks for real-time gating — you'd run both.
- **A (proxy)** is worth keeping around narrowly for what it's already good at: exact token/cost accounting and exact-wire-format context auditing, decoupled from the session/subagent/file tracking problem.
- **D (raw JSONL tailing)** — treat as a fallback/debugging tool, not infrastructure to build on, given Anthropic's explicit stability disclaimer. Fine for one-off forensics ("let me go look at what actually happened in this transcript"), risky as a load-bearing pipeline component that breaks on every Claude Code update.
- **E (OTel)** — bolt on later if/when you want dashboards or cross-user/cross-machine aggregation; not a substitute for the fine-grained layer.

---

## 3. Design sketches (carried over and refined from earlier discussion)

### 3.1 Folder/event schema (Approach B)

```
~/.claude-audit/
  sessions/
    <session_id>/
      meta.json            # start time, cwd, model, git branch, parent session if forked
      events.jsonl         # every hook event, one JSON line each, append-only
      snapshot.md           # regenerated on each Stop (see 3.3)
      subagents/
        <agent_id>/
          meta.json
          events.jsonl
          snapshot.md        # regenerated on this subagent's SubagentStop
          subagents/...      # recursive IF nesting depth is confirmed unbounded (see 1.2 caveat)
  index/
    files.jsonl              # append-only: {path, session_id, agent_id, tool, ts, op}
    files-rollup.json         # periodically reduced: per-file read/write counts, sessions, last-touch
```

Key implementation notes carried over from earlier discussion, still valid:

- **Append-only + separate reduce step**, not live counter updates — parallel tool batches and parallel subagents mean concurrent hook processes; atomic line-appends are safe, read-modify-write on a shared rollup file is not.
- **`Stop`/`SubagentStop` as the snapshot-regeneration trigger**, not `PostToolUse` — sequential, one event per turn, safe point to fold `events.jsonl` into a human-readable `snapshot.md`. Write-to-temp-then-atomic-rename to avoid partial writes if the hook crashes mid-write.
- Two snapshot shapes are complementary, not either/or: an **append-only narrative journal** (cheap, never rewritten, good audit trail) and a **rewritten dashboard** (current-state view: files touched, active subagents, counts). Build both from the same reduce step.
- A trimmed version of the dashboard can be fed back into the session itself via `additionalContext` on `SessionStart`/`UserPromptSubmit` — turning the tracking system into a harness feature (persistent state survives compaction/resume) rather than pure observability.

### 3.2 File locking (optional, on top of B)

- `PreToolUse` on `Edit|Write` checks a small lock registry (path → `{session_id, agent_id, pid}`); deny with a reason if held elsewhere; release on `PostToolUse`/`SubagentStop`.
- Remember: **worktree isolation already prevents most conflict scenarios structurally** for concurrent subagents/background sessions. This is additive for visibility or for cases where isolation is off — don't assume you need it by default.

### 3.3 Correlating subagents to parents

- Confirmed native mechanism: `agent_id`/`agent_type` on hook input while inside a subagent.
- Unconfirmed/needs empirical check (flagged in §1.2 and repeated here because it's decision-relevant): whether `session_id` inside a subagent's hook calls equals the parent's `session_id` or is distinct. Test this directly — spawn one subagent, dump the raw hook JSON, inspect. This single fact determines whether your folder-keying logic is "same session_id, branch on agent_id" or "distinct session_id per subagent, need a separate parent-link field."
- Secondary correlation key available if needed: the `Agent` tool's result contains an `agentId:` trailer in the *parent's* transcript (§1.2) — usable as a cross-check even from the hooks-only pipeline, since `transcript_path` is available on every hook call.

---

## 4. Open questions to resolve empirically before committing to an architecture

1. **Subagent nesting depth**: can subagents spawn subagents in Claude Code CLI today, and if so is depth actually unbounded, or capped (one secondary source mentioned a concurrency cap of 20 for the Agent SDK — separate from nesting depth, but worth checking both)?
2. **`session_id` behavior inside subagent hook calls**: same as parent, or distinct? (§3.3)
3. **`cleanupPeriodDays` default and whether it affects your own mirrored data** or only Claude Code's local transcripts (should only affect the latter, but confirm your mirror isn't somehow tied to the same sweep).
4. **Plugin "monitor" components** — what exactly are they, and are they a better home for continuous aggregation than a `Stop`-triggered hook? (§1.3, flagged as unexplored)
5. **Whether `SessionStore` (Approach C) mirrors *tool-level* granularity or only full-message transcript blobs** — the docs describe it as mirroring transcript data, which likely still requires you to parse tool-use content blocks out of it yourself for a file-access index, same as raw JSONL (D) — meaning C's main advantage over D may be *storage backend flexibility and subagent-key structure*, not avoiding the "internal format may change" problem, since the transcript record schema itself isn't guaranteed stable even when mirrored through the official adapter interface. Worth confirming directly against the SDK docs/source rather than assuming.
6. **OTel `prompt.id` join reliability** — confirm it's actually populated and stable enough in practice to join hook-derived logs with OTel events, if you decide to add OTel as a rollup layer later.

---

## 5. Suggested phased approach (not prescriptive — just one reasonable ordering)

1. **Phase 1 — hooks-only MVP**: implement Approach B exactly as sketched in §3.1, answer the open questions in §4 (especially #1 and #2) empirically while building it.
2. **Phase 2 — snapshot/journal layer**: add `Stop`/`SubagentStop`-triggered snapshot regeneration (§3.1), decide whether to feed it back into context via `additionalContext`.
3. **Phase 3 — decide on C vs. staying hooks-only**: once you know whether your harness owns process launch or needs to observe arbitrary sessions, decide whether `SessionStore` mirroring is worth the architectural commitment, purely for long-term historical storage/querying rather than real-time tracking (which Phase 1 already covers).
4. **Phase 4 — optional additions**: file locking (§3.2) if worktree isolation doesn't cover your case; OTel rollup (§1.6) if you want dashboards; keep the proxy (§1.5) narrowly for token/cost auditing if that's independently valuable; package as a plugin (§1.7) once stable, for distribution.

---

## 6. Reference links surfaced during research

- Hooks reference: `https://code.claude.com/docs/en/hooks.md`
- Sessions (CLI): `https://code.claude.com/docs/en/sessions.md`
- Subagents (CLI): `https://code.claude.com/docs/en/sub-agents.md`
- Agent view (background sessions): `https://code.claude.com/docs/en/agent-view.md`
- Cross-session messaging: `https://code.claude.com/docs/en/cross-session-messaging.md`
- Checkpointing: `https://code.claude.com/docs/en/checkpointing.md`
- Monitoring/OTel: `https://code.claude.com/docs/en/monitoring-usage.md`
- Agent SDK sessions: `https://code.claude.com/docs/en/agent-sdk/sessions.md`
- Agent SDK session storage (SessionStore adapter): `https://code.claude.com/docs/en/agent-sdk/session-storage.md`
- Agent SDK observability (telemetry from SDK): `https://code.claude.com/docs/en/agent-sdk/observability.md`
- Plugins reference (hooks, monitors, LSP servers as plugin components): `https://code.claude.com/docs/en/plugins-reference.md`
- Full docs map (for further navigation): `https://code.claude.com/docs/en/claude_code_docs_map.md`