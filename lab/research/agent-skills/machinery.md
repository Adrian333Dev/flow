# agent-skills — machinery

Everything that is not a skill: agents, commands, hooks, validators, plugin.json, and dot-folders.

---

## Four agent personas (agents/)

Agents are markdown files that define a specialized subagent persona. They load into Claude Code's `agents/` directory and appear as named roles that can be invoked from orchestrator sessions.

**code-reviewer.md**: Staff engineer reviewing code across five axes (correctness, readability, architecture, security, performance). Produces a structured report with Critical / Important / Suggestion categories. Invoked directly by `/review` (single-perspective review) or as part of `/ship` (which fans out to multiple reviewers in parallel). Explicit rule: a persona does not invoke other personas — orchestration belongs to slash commands, not to roles.

**security-auditor.md**: Security-focused reviewer. Checks input validation, auth/authorization, secrets handling, dependency vulnerabilities, OWASP coverage. Invoked by `/ship` in parallel with code-reviewer.

**test-engineer.md**: Reviews test coverage, test quality, edge case coverage. Invoked by `/ship` in parallel.

**web-performance-auditor.md**: Audits Core Web Vitals (LCP, CLS, INP), bundle size, N+1 query patterns, caching. Invoked by `/webperf` command.

**How they wire together**: the `/ship` command spawns all three reviewers in parallel and aggregates results. The `/review` command invokes just code-reviewer. The anti-pattern — a persona delegating to another persona — is explicitly documented in `references/orchestration-patterns.md` and in each persona's `## Composition` section.

**Flow equivalent**: None. Flow has no agent personas. Subagent delegation in Flow's execute skill uses Haiku workers for mechanical steps and a debug agent for failures, but these are not named roles with defined personas and review frameworks. The `code-review` skill on Flow's remaining.md is described as "a reviewer subagent given base/head SHAs plus the requirements" — this is in the same territory as code-reviewer.md but has not been built.

---

## Eight slash commands (commands/, TOML format)

Commands are `.toml` files with a `description` and a `prompt` field. The prompt is a multi-line string that instructs the agent to invoke specific skills and follow specific steps. They appear as `/build`, `/review`, `/ship`, etc.

| Command | What it does | Skills invoked |
|---|---|---|
| `/build` | Execute the next task from `tasks/todo.md` using incremental implementation | incremental-implementation, test-driven-development |
| `/planning` | Break work into tasks from an existing spec | planning-and-task-breakdown |
| `/review` | Five-axis code review of current changes | code-review-and-quality |
| `/ship` | Pre-launch review (parallel fan-out to code-reviewer, security-auditor, test-engineer) | code-review-and-quality, security-and-hardening |
| `/spec` | Write a spec from requirements | spec-driven-development |
| `/test` | Write tests for current code | test-driven-development |
| `/code-simplify` | Simplify the current code without changing behavior | code-simplification |
| `/webperf` | Performance audit via web-performance-auditor persona | performance-optimization |

**TOML format vs. Flow's markdown format**: Their commands are `.toml`; Flow's only command (`/handoff`) is `.md`. TOML gives you typed fields (`description` and `prompt` as distinct keys); markdown gives you a freeform document. The TOML format is simpler for tool integration (easier to parse programmatically, clearer what is description vs. content) but less flexible for complex prompts with conditional logic or embedded structure. Flow's markdown approach is more expressive but blurs the description/prompt distinction.

**What commands do that skills cannot**: Commands prefetch data before the model runs. Flow's `/handoff` prefetches `git status --short` and `flow status` so the handoff result is grounded in real current state. Their `/review` prefetches staged diffs. This is the key distinction between a command and a skill in their system too — commands are one-shot prompts that may need shell output before reasoning; skills are methods that govern a stretch of conversation.

**Flow equivalent**: Flow has one command (`/handoff`). Their 8 commands cover the entire development lifecycle as triggerable one-shots.

---

## Four hooks (hooks/)

### session-start.sh (SessionStart hook)

**What it does**: At the start of every Claude Code session, injects the full content of `using-agent-skills/SKILL.md` into the system prompt as an IMPORTANT-priority message. This guarantees the routing chart and the six operating behaviors are always in context, even if the agent would not otherwise discover the meta-skill.

**How it wires**: `hooks.json` registers a `SessionStart` hook that runs `session-start.sh`. The script checks for `jq`, reads the meta-skill file, and outputs JSON with `{"priority": "IMPORTANT", "message": "..."}`. The script's path is resolved via `CLAUDE_PLUGIN_ROOT` or falls back to `.claude/hooks/`.

**Flow equivalent**: Flow has a `PreToolUse` hook via `guard.js` (in `home/settings.json`) that blocks dangerous bash commands. There is no session-start hook in Flow. The approach of force-injecting content at session start is interesting for Flow's refactor agenda (item 2: moving frequently-loaded skill content into CLAUDE.md) — their technique is more surgical; they inject only when a skill is needed rather than making everything always-on.

---

### simplify-ignore.sh (PreToolUse Read + PostToolUse Edit/Write + Stop)

**What it does**: A sophisticated hook that hides marked code blocks from the agent. When the agent reads a file, any section between `// simplify-ignore-start` and `// simplify-ignore-end` markers is replaced with a `BLOCK_<hash>` placeholder. When the agent edits the file, placeholders are expanded back to their original content. On session Stop, all files are restored from backup. The purpose: protect code that should not be simplified or modified (legacy sections, generated code, intentional quirks) from drive-by changes.

**How it wires**: Uses all four hook events. Maintains a cache under `.claude/.simplify-ignore-cache/`. Requires `jq`. Uses atomic file operations to avoid race conditions between sessions.

**Flow equivalent**: Flow has no equivalent. The `guard.js` hook blocks specific bash commands but does not intercept file reads or writes.

---

### sdd-cache-pre.sh and sdd-cache-post.sh (PreToolUse and PostToolUse WebFetch)

**What they do**: An HTTP cache for WebFetch calls, keyed by URL. On prefetch: checks if the URL is cached and the cached response is still fresh (via ETag/Last-Modified HTTP validators). On cache hit: exits 2 (the hook intercept code) and delivers the cached body, preventing the real WebFetch. On miss: passes through and lets the real fetch happen. On postfetch: saves the response to cache with the validator headers. No TTL — freshness is determined entirely by HTTP validators.

**Why it exists**: The `source-driven-development` skill fetches official documentation pages. Without a cache, every new session re-fetches the same React docs or Django docs. With the cache, subsequent sessions hit the disk instead of the network.

**How it wires**: Registered for `WebFetch` tool events. Cache lives at `.claude/sdd-cache/`. Requires `jq` and `curl`.

**Flow equivalent**: Flow's research skill fetches docs via llms.txt routes with local caching. The mechanism is different (Flow's caching is manual, described in the skill body; theirs is automatic via hooks) but the goal is the same.

---

## Five validator scripts (scripts/)

These run in CI and on demand to verify the repo's own health.

### validate-skills.js

Structural linter. Checks every skill against the rules in `docs/skill-anatomy.md`. Uses `scripts/lib/skill-lint.js` as the importable rule engine. Checks: required files present, valid YAML frontmatter, `name` matches directory name, description includes "Use when," description length within 1024 characters, no empty `scripts/` directories, required sections present (with an exemption mechanism for skills that genuinely don't need them). Exits 1 on any error.

### validate-commands.js

Checks that every `.toml` in `commands/` has required `description` and `prompt` fields, that skill names referenced in prompts exist in `skills/`, that TOML syntax is valid.

### validate-artifact-paths.js

Checks that every `files[]` path in `evals/cases/*.json` resolves to a real path under `evals/fixtures/`. Execution evals must have real fixtures; dialogue evals may omit `files[]`. Missing fixtures are CI errors.

### validate-versions.js

Checks that `plugin.json` version is valid semver, that CHANGELOG entries (if present) reference versions that exist in `plugin.json` history.

### run-evals.js

The eval runner. Implements all three eval tiers:
- **Tier 1** (structural): runs validate-skills.js logic
- **Tier 2** (routing): lexical TF-IDF over skill descriptions — checks that positive trigger prompts rank their skill in the top-k, that negative prompts don't rank it first, that negative prompts (where `owner` is declared) rank the owner above the current skill. Runs without spending any tokens. Prints a trigger rank-1 rate and enforces a floor (currently 80%). Fails CI if pairwise description similarity exceeds 75%.
- **Tier 3** (behavioral, opt-in): invokes headless `claude` with the skill loaded, runs the prompt against real fixture files, captures the execution trace including tool calls, grades the trace against `expectations[]` strings. Supports `execution` kind (real git repo + file edits) and `dialogue` kind (conversation-only).

**Flow equivalent**: Flow has no equivalent. `flow check` is a ticket-system integrity checker, not a skill validator. The Tier 2 approach (lexical routing tests without spending tokens) is directly adoptable as a cheap CI check for Flow's skills.

---

## plugin.json

```json
{
  "name": "agent-skills",
  "version": "0.6.6",
  "description": "Production-grade engineering skills for AI coding agents."
}
```

This is the Claude Code marketplace plugin manifest. It enables one-step installation via the Claude Code plugin registry. The repo's dot-folders (`.claude-plugin/`, `.claude/`) contain the hook registration and command wiring for this installation path.

**Flow equivalent**: None. Flow does not distribute via any registry; installation is manual symlinks via `link.sh`. This is deliberate and documented — Flow is not yet at a state where distribution makes sense.

---

## Dot-folders (.claude/, .agents/, .gemini/, .opencode/, .codex-plugin/, .claude-plugin/)

Each folder is a per-tool installation config:
- `.claude/` — Claude Code: settings.json with hook registration, commands symlink
- `.agents/` — OpenAI agents: AGENTS.md equivalent pointers
- `.gemini/` — Gemini CLI: equivalent config
- `.opencode/` — OpenCode: equivalent config
- `.codex-plugin/` and `.claude-plugin/` — additional plugin installation paths

**What they contain**: primarily the hooks.json wiring and pointers to the commands and skills directories, adapted to each tool's expected config location.

**What this represents**: a portability bet. The same skill files install into 6+ different tools. The tradeoff: skills written for multi-tool portability cannot use tool-specific affordances heavily. Their skills avoid mentioning Claude-specific features (no `mcp__` tools, no worktree commands) — they reference "your agent tool" and "the browser-devtools MCP" generically.

**Flow equivalent**: None. Flow is Claude Code-specific and uses Claude-specific features freely (agent spawning, hooks, TOML commands). This is a legitimate choice for a single-user, single-tool setup.
