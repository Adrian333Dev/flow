# Harness portability

Researched 2026-09-06 and 2026-09-07, against Anthropic's gateway and model-configuration
documentation, OpenAI's Codex documentation, and current provider pricing. Nothing is locked. Model
ids and prices below move monthly, so they are dated findings rather than facts.

Open items are in `backlog.md` → `## Other people, other models`. The companion record is
`model-identity.md`, which covers telling which model produced a piece of work.

## What is in scope

Two shapes, both chosen by the user on 2026-09-07.

- **Switch harness between phases.** Finish groundwork in Claude Code, close it, open Codex, continue
  in Codex.
- **Switch model inside one harness.** Run Claude Code against GLM or Qwen instead of Claude.

**Subagent dispatch to an external model is out of scope.** It was raised and dropped in the same
conversation. Both shapes above need one thing only: the work in `.flow/` and Flow's rules loading
wherever the next session starts. Neither needs a router, a launcher, or 2 models running at once.

## Claude Code runs non-Anthropic models, with no proxy

Claude Code speaks one wire format, the Anthropic Messages API. `ANTHROPIC_BASE_URL` says which
server receives that request. Anything answering in that format works, and the model behind it does
not have to be a Claude model.

**Several providers publish an Anthropic Messages endpoint on their own servers.** These are not
proxies and nothing runs on your machine. The `/anthropic` path segment is the provider advertising
the format it answers in, because "point Claude Code at this URL" is how the plan gets sold.

The working configuration is 3 variables plus 2 that stop errors:

```
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
ANTHROPIC_AUTH_TOKEN=<key>
ANTHROPIC_MODEL=glm-5.3
CLAUDE_CODE_MAX_CONTEXT_TOKENS=<window>
CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1
```

**Behind a gateway or third-party provider, any model string is accepted with no validation.** Errors
surface on the first request instead of at startup. On the Anthropic API the same field rejects
anything that is not an alias, a picker entry, or a name starting with `claude-`.

**The `claude`-or-`anthropic` filter is real and it governs a menu.** Claude Code can query a
gateway's `GET /v1/models?limit=1000` at startup and add the results to the `/model` picker, but only
when `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` is set. It keeps an entry when the id contains
`claude` or `anthropic` anywhere, case-insensitively, and drops the rest. Naming the model by hand
with `ANTHROPIC_MODEL` or `ANTHROPIC_CUSTOM_MODEL_OPTION` bypasses the list entirely. Anthropic's own
documentation gives that as the remedy.

Nothing Flow builds notices any of this. Skills, `CLAUDE.md`, `rules/`, `settings.json`, `guard.js`
and `flow install` are all client-side.

## The providers, as of 2026-09-07

A coding plan means a fixed monthly fee against a request or token quota, on a dedicated endpoint
with its own key. It is a separate product from the same provider's pay-per-token API.

| Provider | Anthropic endpoint | Model ids | Billing |
| --- | --- | --- | --- |
| Qwen (Alibaba) | `dashscope-intl.aliyuncs.com/apps/anthropic` | `qwen3.7-plus`, `qwen3.6-plus`, `qwen3-coder-plus`, `qwen3-coder-flash` | Plan, about ¥200/mo, 6,000 requests per 5 hours |
| GLM (Z.ai) | `api.z.ai/api/anthropic` | `glm-5.3`, `glm-5.2`, `glm-5-turbo` | Plan, $18 / $80 / $168 |
| DeepSeek | `api.deepseek.com/anthropic` | `deepseek-v3.2`, `deepseek-reasoner` | Token only, about $0.27 in and $1.10 out per million |
| Kimi (Moonshot) | `api.moonshot.ai/anthropic` | `K3`, `K2.7 Code` | Plan, ¥49 to ¥699 |
| MiniMax | `api.minimax.io/anthropic` | `M3`, `M2.7` | Plan, ¥49 to ¥469 |
| MiMo (Xiaomi) | `api.xiaomimimo.com` | `mimo-v2.5-pro` | Plan, ¥39 to ¥659 |

**The Qwen plan bundles other vendors' models.** Its listing includes Kimi K2.5, GLM-5 and
MiniMax-M2.5 beside Qwen's own. That makes it the cheapest way to compare Flow's rules across model
families, which is what `model-identity.md` needs.

## Subscriptions never cross vendors

A plan buys one vendor's client talking to that vendor's servers. Pointing Claude Code at Z.ai spends
the Z.ai plan, not the Anthropic one. Using several providers means paying several plans.

**The reverse is blocked and enforced.** Anthropic's documentation treats a claude.ai login and a
gateway credential as alternatives: once `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY` or an
`apiKeyHelper` is active, the subscription does not apply to those sessions. Reporting says Anthropic
prohibits third-party services from routing requests through Pro or Max credentials, and has blocked
subscription tokens used outside Claude Code since January 2026. **Never build any part of Flow on
carrying a subscription credential into another vendor's harness.**

## What breaks on a non-Anthropic model

### Breaks outright

- **WebSearch stops.** It is a server-side tool that Anthropic's API runs, not a local one. Claude
  Code hides it entirely on Bedrock and Vertex, and through a translating gateway it fails unless the
  gateway performs the search itself and emits `server_tool_use` and `web_search_tool_result` blocks.
  The replacement is an MCP search server: Brave, Tavily, Exa, DuckDuckGo or SearXNG.
- **WebFetch's preflight fails.** Before fetching, WebFetch sends the hostname alone to
  `api.anthropic.com/api/web/domain_info?domain=<domain>`. The call is hardcoded and does not follow
  `ANTHROPIC_BASE_URL`. Users behind third-party gateways report it failing on ordinary public
  domains. `skipWebFetchPreflight: true` in settings turns the check off. A passing hostname is
  cached for 5 minutes.
- **Remote Control is disabled** whenever `ANTHROPIC_BASE_URL` points at a non-Anthropic host, even
  with a claude.ai login. **Voice dictation** is unavailable whenever a gateway credential is active.
- **Fast mode reports unavailable.** Its availability check calls `api.anthropic.com` directly.
  `CLAUDE_CODE_SKIP_FAST_MODE_ORG_CHECK=1` covers the bearer-token case.

Both web tools matter more than they look, because `CLAUDE.md` sends every question to the
documentation before any experiment, and those 2 tools are how that rule is obeyed.

### Errors unless configured

- **Pre-release fields draw `400`.** Claude Code sends `context_management`, `output_config` and beta
  tool schema fields to any Anthropic-format endpoint. `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`
  suppresses most of them.
- **Adaptive reasoning draws `400`.** Claude Code sends `thinking: {"type": "adaptive"}` for Claude
  4.6 and later, and treats an unrecognized id as a current model that receives the field.
  `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1` applies only to Opus 4.6 and Sonnet 4.6.
- **The context window is guessed.** Claude Code does not know an unrecognized model's window, so
  compaction fires at the wrong point unless `CLAUDE_CODE_MAX_CONTEXT_TOKENS` declares it.

Claude Code retries once and disables the capability for the rest of the conversation when the
upstream rejects `thinking`, a thinking signature, a mid-conversation system message, or a
`cache_control` marker on one of those. It does not retry `context_management` or tool schema
rejections, so those reach the user.

### Survives, contrary to the first assumption

**Prompt caching mostly works, direct to the provider's own endpoint.**

- **DeepSeek caches automatically with no flag.** A measured repeat call on 2026-07-28 reused 3,328
  of 3,403 prompt tokens, cutting computed input cost 88%.
- **Qwen accepts `cache_control: {"type": "ephemeral"}`,** the same syntax Claude Code already sends,
  so Anthropic's markers pass through unchanged.
- **GLM-5 returned 3,200 cached tokens with a 75% billed discount** in a test on 2026-07-28.

**Routing is where it breaks.** Across 8 endpoints measured through a router, 2 returned cached
counts with the discount visible and 5 returned nothing. Caching is therefore an argument for going
direct rather than through `claude-code-router`.

### Degrades silently

- **The audit's money and cache columns go wrong.** Covered in `model-identity.md` →
  `## The audit already records the model`.
- **Auto mode's permission classifier follows the base URL.** Claude Code keeps its attribution block
  on classifier requests only when the requests go to `api.anthropic.com` with no third-party
  provider selected, which implies the classifier travels the gateway path otherwise. So the model
  deciding whether a tool call is safe would be GLM rather than Claude. **Unverified, and worth one
  run**, because Flow sessions run in auto mode.
- **Instruction adherence.** No configuration touches it. Flow's rule set is dense and was tuned
  against Claude models, and whether GLM or Qwen holds a hard rule across a long session is the real
  question. Only a paid plan and a real session answer it.

## Codex is a much narrower host for open models

**Codex removed `wire_api = "chat"` in February 2026.** A third-party provider must implement
OpenAI's Responses API, and Chat Completions support is no longer enough. Providers are declared
under `[model_providers.<id>]` in `config.toml`, with `base_url`, `env_key`, `wire_api`,
`query_params` and `http_headers`. Codex ships 3 built-in providers: `openai`, `ollama` and
`lmstudio`.

- **Z.ai qualifies.** Its Responses endpoint is `api.z.ai/api/v1`, with ids `glm-5.3` and
  `glm-5-turbo`.
- **DashScope qualifies partly.** It exposes an OpenAI-compatible Responses API, not at full parity
  with OpenAI's, and not for every model. DeepSeek reaches it through
  `/compatible-mode/v1/responses`.

**So the practical division is: Claude Code hosts the open-weight models, Codex hosts OpenAI's.**
That argues for doing the Claude Code side first, since it needs no Flow change at all.

**OpenAI models have no subscription path outside Codex.** No OpenAI endpoint speaks the Anthropic
Messages format. A ChatGPT plan authenticates Codex. Reaching GPT from Claude Code means an OpenAI
API key and per-token billing, which was ruled out.

**One exception, and it is official.** OpenAI publishes `openai/codex-plugin-cc`, a plugin that
installs into Claude Code and wraps the local Codex CLI, inheriting its authentication, `config.toml`
and MCP configuration. It runs on the ChatGPT plan. Shipped 2026-03-30, and it replaced the
`codex mcp-server` subcommand that Codex v0.149.1 deprecated on 2026-08-24. It is delegation rather
than model switching: good for a second opinion from a model that did not write the code, useless for
an interactive phase.

## What Flow costs to port to Codex

**Ports unchanged: every skill.** The SKILL.md format was published as an open standard at
agentskills.io in December 2025, and 32 tools supported it by March 2026, Codex among them. Codex
discovers skills at `./.agents/skills/`, `../.agents/skills/`, `$REPO_ROOT/.agents/skills/`,
`$HOME/.agents/skills/` and `/etc/codex/skills/`, each a folder holding a `SKILL.md` with `name` and
`description` frontmatter. Flow already links skills per item, so this is one more link target.

**Ports with a rename and a hard size cap.** `home/CLAUDE.md` becomes `~/.codex/AGENTS.md`, and a
project `CLAUDE.md` becomes `AGENTS.md`. Codex walks from the repository root down to the working
directory, taking the first non-empty file at each level, checking `AGENTS.override.md`, then
`AGENTS.md`, then `project_doc_fallback_filenames`. `~/.codex/AGENTS.md` applies everywhere. **The
cap is 32 KiB (`project_doc_max_bytes`), and content past it is truncated.**

**Ports better than expected: the hooks.** Codex uses the same event names, plus more: `SessionStart`,
`SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `SubagentStart`,
`SubagentStop`, `PreCompact`, `PostCompact`, `Stop` and `Interrupt`. `PreToolUse` can deny a call or
rewrite its input, and **it fires on file edits**: the matcher accepts `apply_patch`, `Edit` or
`Write`, though the payload reports `tool_name: apply_patch`. So the enforcement bridge in
`design-knowledge-base.md` has a real target on Codex. Configuration lives at `~/.codex/hooks.json`,
`<repo>/.codex/hooks.json`, either `config.toml`, or inside an enabled plugin.

**Needs a second implementation: the audit.** `flow audit` reads `~/.claude/projects/`. Codex writes
`~/.codex/sessions/YYYY/MM/DD/rollout-<id>.jsonl`. Same idea, different schema, so `scan.js` needs a
sibling rather than a patch. Until it exists, work done in Codex is invisible to every audit query
and to the per-model measurement in `model-identity.md`.

**Does not port, and should not: `guard.js`.** It sits on Claude Code's permission system. Codex has
its own sandbox modes and a `PermissionRequest` hook. Write each one separately and accept the
duplication.

**Different shape, nothing shared: subagents.** Codex subagents are TOML files in `.codex/agents/`
carrying `name`, `description`, `nickname_candidates`, `developer_instructions`, `model` and
`sandbox_mode`, with `default`, `worker` and `explorer` built in. Claude Code's are markdown with
frontmatter.

## The `.agents/` layout

**The rule the user set on 2026-09-07: the vendor folder never holds an original.** `.claude/` is one
vendor's name for something that is not vendor-specific, so the general path holds the content and
the vendor path holds links. 3 cases, 3 answers.

**Skills: nearly free, and Flow's existing rule is what makes it safe.** `CLAUDE.md` already forbids
symlinking `skills/` as a folder, and `flow install` links per item
(`scripts/flow/commands/install.js:91` to `:93`). That rule dodges a documented failure: Claude Code
writes internal `.system/` files into `~/.claude/skills/`, which pollutes a whole-folder symlink.

**Do not chain the links.** `clone → ~/.agents/skills/<name> → ~/.claude/skills/<name>` is a link
pointing at a link. Point both roots straight at the clone instead. The clone is the content, and
`~/.agents/` and `~/.claude/` are both link roots, which satisfies the rule without the extra hop.

**Always-loaded rules: Claude Code has an import and Codex does not.** This is the finding that
decides the layout.

- **Claude Code does not read `AGENTS.md`.** The documented answers are a `CLAUDE.md` containing
  `@AGENTS.md`, or `ln -s AGENTS.md CLAUDE.md`. The import expands and loads at launch alongside the
  file that references it, so there is no second read and no extra turn. Imports nest 4 hops. The
  symlink forbids Claude-specific additions and needs Administrator rights on Windows.
- **Codex has no import at all.** Modularity there comes from hierarchical discovery only. `@include`
  and `@`-reference expansion are open feature requests, `openai/codex` issues 17401 and 28739.

**So the shared rules cannot be split into files that each harness assembles.** Either the shared set
is one flat file that Codex reads whole and Claude Code imports, or `flow install` concatenates the
parts into `AGENTS.md` and leaves Claude Code importing the same result.

**The cap is not binding today, and the user's own reversal is why.** Splitting `home/CLAUDE.md` was
turned off on 2026-09-07, so the rules stay in one file, which is the shape Codex needs. Measured
2026-09-07: `home/CLAUDE.md` is 14,595 bytes against a 32,768 byte cap, and the repo `CLAUDE.md` is
23,377 bytes and installs nowhere. The cap binds only if the installed file roughly doubles.
`rules/` is empty, so nothing there is measured yet, and every file `flow install` links into
`~/.claude/rules/` would have to be concatenated into the Codex file rather than imported.

**Claude Code's own limits, for comparison:** it loads a `CLAUDE.md` up to 4 MiB and skips a larger
one, with documented advice to stay under 200 lines for adherence.

## Two harnesses on one project

**`.flow/` already solves the main problem.** Tickets, groundwork, findings, `handoff.md` and
overlays are Flow's own files in Flow's own folder. A Codex session opening a project a Claude Code
session left behind reads the same `.flow/handoff.md`. That decision pays off here without being
revisited.

Three things sit outside it.

- **Configuration is genuinely per-harness.** `.claude/settings.json` and `.codex/config.toml`
  describe different permission models in different formats. Do not unify them.
- **The audit reads one harness**, covered above.
- **Claude Code's auto memory is already off.** `home/settings.json:41` sets
  `"autoMemoryEnabled": false`, which is user scope and therefore covers every project, so the
  project template needs nothing. Worth keeping in view because that file is copied and personalized
  at install rather than symlinked, so a future Flow version never updates it. It belongs on the
  management skill's re-install diff.

## Still open

- **Whether Codex resolves `@path` imports** if the open issues land. The layout above assumes not.
- **Whether auto mode's classifier runs on the gateway model.** Inferred from the attribution-block
  rules, never observed.
- **Whether `WebFetch` works at all** with a non-Anthropic credential and the preflight left on.
- **Whether DeepSeek and Qwen reach Codex** through the Responses API for the models Flow would use.
- **Whether Flow's rules bind a model outside Claude.** The question underneath everything, answered
  only by one paid plan and one real session.
