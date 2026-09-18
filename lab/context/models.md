# Other models and other harnesses

Two questions, neither locked: which model produced a piece of work, and whether Flow runs anywhere but Claude Code on an Anthropic model. Researched 2026-09-06 and 2026-09-07. Merged into one record on 2026-09-16, because the same measurement answers both: no rule has a violation rate per model, so nothing yet says whether a rule that binds one model binds the next.

`backlog.md` → `### Other people, other models` carries the open item. Model ids and prices below move monthly, so they are dated findings rather than facts.

## Which model produced the work

The scorecard records the effort level on every result, and `flow cases new` fills in `model:` and `effort:` on a study case. Neither records the model, because nothing cheap tells a hook which model is running. Cut on 2026-09-15 to the 2 ideas still open.

### Every rule binds each model differently

Sonnet 4.6 puts the report before the edits without being told. Opus 5 never does, and fails plain-language explanation even with the reply rules loaded and `/flow:visualize` available. A rule written to fix one model can do nothing on another.

- **A finding is worthless without the model that produced it.** Without the model, no study case can be checked against a second model later.
- **A rule's violation rate is a number per model, never one number.** Without the split, a rule that binds Sonnet and fails on Opus reads as a rule with a mediocre rate.

**On a Claude Pro plan the default model is Sonnet 5.** Max, Enterprise and API accounts default to Opus 5. So any measurement on this machine is Sonnet unless a model was picked by hand, and every written result has to say which.

### What Claude Code hands a hook

**Effort is easy.** Every hook firing inside a tool call receives `effort.level`: `low`, `medium`, `high`, `xhigh` or `max`. The same value reaches hook commands and the Bash tool as `$CLAUDE_EFFORT`. It reports what ran, never what was asked for, and ultracode reports as `xhigh`.

**The model has no easy source.**

- **No `$CLAUDE_MODEL` variable exists.** Documented, not an oversight.
- **Only `SessionStart` can receive a `model` field**, and the documentation does not promise it.
- **`$ANTHROPIC_MODEL` is inherited and stale.** It does not change when `/model` switches mid-session, so it lies exactly when it matters.

3 real sources exist:

- **The transcript.** Every assistant event carries `message.model`, and it tracks a mid-session switch.
- **The status line.** The command set as `statusLine` receives JSON on stdin holding `model.id` and `model.display_name`, beside `session_id`, `transcript_path`, `cwd`, `version`, `cost` and `effort`. It runs on every render.
- **The audit index**, whose `event` table stores the model on every assistant line.

### The status line is the sensor

**Recommendation: have the status line write the current model to a file keyed by session id, and let every hook read that file.**

The status line already runs, already receives `model.id`, and is the only source that sees a `/model` switch the moment it happens. `scripts/rule-check.js` records effort on every scorecard result and leaves the model out, with a comment saying the model waits for exactly this sensor.

The alternative is every hook parsing the transcript backwards for the last assistant event. That repeats file reading on every edit, and fails on a session's first turn, where no assistant event exists yet.

### Per-model context, if the data earns it

**The shape is a base rule set plus a per-model overlay. The timing is after the measurement, never before it.**

- **Why the shape is right**: 2 observed failures need 2 different corrections, and one rule set carrying both loads every rule into every model.
- **Why the timing is wrong today**: 2 observations cannot tell "this rule binds Opus 5 and not Sonnet 4.6" apart from "Opus 5 was worse that week". An overlay written from a sample of 2 becomes a rule nobody can overturn.
- **The loading mechanism, when earned**: a `SessionStart` hook reads the active model and prints that model's overlay file. `UserPromptSubmit`, `UserPromptExpansion` and `SessionStart` are the only 3 events whose output becomes context, and a model with no overlay costs nothing.
- **Never fork the rule set per model.** 2 full sets drift, and the second one is the one nobody maintains.

### Still open on identifying the model

- **Whether `SessionStart` delivers `model` in practice.** One run answers it.
- **What the per-model split needs before an overlay is justified.** No threshold is set, and guessing one repeats the scorecard's own 5-violations-and-60% guess.
- **Whether a model outside Claude holds Flow's rules at all.** Only a paid plan and a real session answer it.

## Running Flow on another harness

Researched against Anthropic's gateway and model-configuration documentation, OpenAI's Codex
documentation, and provider pricing as it stood on 2026-09-07.

Open items are in `backlog.md` → `## Other people, other models`.

### What is in scope

Two shapes, both chosen by the user on 2026-09-07.

- **Switch harness between phases.** Finish groundwork in Claude Code, close it, open Codex, continue
  in Codex.
- **Switch model inside one harness.** Run Claude Code against GLM or Qwen instead of Claude.

**Subagent dispatch to an external model is out of scope.** It was raised and dropped in the same
conversation. Both shapes above need one thing only: the work in `.flow/` and Flow's rules loading
wherever the next session starts. Neither needs a router, a launcher, or 2 models running at once.

### Claude Code runs non-Anthropic models, with no proxy

Claude Code speaks one wire format, the Anthropic Messages API. `ANTHROPIC_BASE_URL` says which
server receives that request. Anything answering in that format works, and the model behind it does
not have to be a Claude model.

**Several providers publish an Anthropic Messages endpoint on their own servers.** These are not
proxies and nothing runs on your machine. The `/anthropic` path segment is the provider advertising
the format it answers in, because "point Claude Code at this URL" is how the plan gets sold.

The working configuration is 3 variables plus 2 that stop errors:

```sh
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

### The providers, as of 2026-09-07

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
families, which is what the per-model measurement above needs.

### Subscriptions never cross vendors

A plan buys one vendor's client talking to that vendor's servers. Pointing Claude Code at Z.ai spends
the Z.ai plan, not the Anthropic one. Using several providers means paying several plans.

**The reverse is blocked and enforced.** Anthropic's documentation treats a claude.ai login and a
gateway credential as alternatives: once `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY` or an
`apiKeyHelper` is active, the subscription does not apply to those sessions. Reporting says Anthropic
prohibits third-party services from routing requests through Pro or Max credentials, and has blocked
subscription tokens used outside Claude Code since January 2026. **Never build any part of Flow on
carrying a subscription credential into another vendor's harness.**

### What breaks on a non-Anthropic model

#### Breaks outright

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

#### Errors unless configured

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

#### Survives, contrary to the first assumption

**Prompt caching mostly works, direct to the provider's own endpoint.**

- **DeepSeek caches automatically with no flag.** A measured repeat call on 2026-07-28 reused 3,328
  of 3,403 prompt tokens, cutting computed input cost 88%.
- **Qwen accepts `cache_control: {"type": "ephemeral"}`,** the same syntax Claude Code already sends,
  so Anthropic's markers pass through unchanged.
- **GLM-5 returned 3,200 cached tokens with a 75% billed discount** in a test on 2026-07-28.

**Routing is where it breaks.** Across 8 endpoints measured through a router, 2 returned cached
counts with the discount visible and 5 returned nothing. Caching is therefore an argument for going
direct rather than through `claude-code-router`.

#### Degrades silently

- **The audit's money and cache columns go wrong.** A flat monthly plan has no per-request dollar
  figure, so `cost_usd` records nothing usable from the first non-Anthropic session.
- **Auto mode's permission classifier follows the base URL.** Claude Code keeps its attribution block
  on classifier requests only when the requests go to `api.anthropic.com` with no third-party
  provider selected, which implies the classifier travels the gateway path otherwise. So the model
  deciding whether a tool call is safe would be GLM rather than Claude. **Unverified, and worth one
  run** before a session is switched to auto mode. Flow sessions start in Manual since 2026-09-18.
- **`## The reply` needs thinking.** Its 3 steps and 5 tests run on a draft that exists only in the
  thinking before the reply. A model with thinking off, or one whose upstream rejected `thinking`
  and had it disabled for the conversation, still reads the section, and the tests never run on
  anything. Set 2026-09-16.
- **Instruction adherence.** No configuration touches it. Flow's rule set is dense and was tuned
  against Claude models, and whether GLM or Qwen holds a hard rule across a long session is the real
  question. Only a paid plan and a real session answer it.

### Codex is a much narrower host for open models

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

### What Flow costs to port to Codex

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
`rules.md` has a real target on Codex. Configuration lives at `~/.codex/hooks.json`,
`<repo>/.codex/hooks.json`, either `config.toml`, or inside an enabled plugin.

**Needs a second implementation: the audit.** `flow audit` reads `~/.claude/projects/`. Codex writes
`~/.codex/sessions/YYYY/MM/DD/rollout-<id>.jsonl`. Same idea, different schema, so `scan.js` needs a
sibling rather than a patch. Until it exists, work done in Codex is invisible to every audit query
and to the per-model measurement above.

**Does not port, and should not: `guard.js`.** It sits on Claude Code's permission system. Codex has
its own sandbox modes and a `PermissionRequest` hook. Write each one separately and accept the
duplication. **Overturned 2026-09-18:** Codex runs `guard.js` and honors its deny, and only its ask
needs Codex's own mechanism. `### The hooks on Codex, walked 2026-09-18` has the design.

**Different shape, nothing shared: subagents.** Codex subagents are TOML files in `.codex/agents/`
carrying `name`, `description`, `nickname_candidates`, `developer_instructions`, `model` and
`sandbox_mode`, with `default`, `worker` and `explorer` built in. Claude Code's are markdown with
frontmatter.

### Codex namespaces plugin skills, and reads Claude Code's manifest

Found 2026-09-18 in the Codex source, now cloned at `repos/codex`. It decides how Flow's skills are
named on both harnesses.

**A plugin is a folder holding a manifest, and every skill below it is named `<plugin>:<skill>`.**
`codex-rs/ext/skills/src/loader/namespace.rs` builds the name with `format!("{namespace}:{base_name}")`,
and its doc comment says "a skill named `search` beneath a plugin named `sample` is exposed as
`sample:search`". The namespace is the `name` field of the nearest manifest above the `SKILL.md`.

**Codex reads Claude Code's manifest file.** `codex-rs/exec-server-protocol/src/protocol.rs:49`:

```rust
pub const DISCOVERABLE_PLUGIN_MANIFEST_PATHS: &[&str] = &[
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
];
```

So one `.claude-plugin/plugin.json` gives `/flow:groundwork` in Claude Code and `$flow:groundwork` in
Codex, with no second manifest and no per-harness generation. Underneath both is the open standard at
`agent-plugins.org`, the way `SKILL.md` sits on `agentskills.io`.

**Three constraints the source sets.**

- **The manifest and its folder must be real, never symlinks.** `codex-rs/utils/plugins/src/plugin_namespace.rs`,
  in `find_plugin_manifest_path`, calls `symlink_metadata` and returns nothing the moment
  `.claude-plugin/` is not a directory or `plugin.json` is not a file. `flow install` therefore copies
  that one file rather than linking it.
- **Symlinked skill folders are followed.** `codex-rs/ext/skills/src/loader/host.rs:164` picks
  `DirectorySymlinkPolicy::Follow` for `User`, `Repo` and `Admin` scope. `~/.agents/skills/` is `User`.
- **Depth 6, scanned recursively.** `codex-rs/ext/skills/src/loader/mod.rs:31` and `host.rs:107`. A
  plugin folder holding `skills/<name>/SKILL.md` sits at depth 3.

**A skill's own name comes from the frontmatter `name`**, not the folder. This is the reverse of a
plain Claude Code skill, where the folder is the command and `name` is only a display label. Keeping
folder and `name` identical is what lets one tree serve both harnesses.

**Invocation is `$name`, not `/name`.** `/skills` lists them, `$` mentions one, and Codex fires one on
its own from the `description` the same way Claude Code does. A skill body that writes `/flow:handoff` is
therefore writing a Claude Code detail into a file Codex reads unchanged.

**Two per-skill switches Codex has that the design assumed missing.** `[[skills.config]]` with `path`
and `enabled = false` in `~/.codex/config.toml` turns one skill off without deleting it, and
`agents/openai.yaml` beside a `SKILL.md`, carrying `policy: allow_implicit_invocation: false`, is the
twin of `disable-model-invocation: true`.

### The `.agents/` layout

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

**Decided 2026-09-18: one real copy, in `~/.agents/`, reached 2 ways.** The user approved it the
same day. The rule file is `~/.agents/AGENTS.md`. `~/.claude/CLAUDE.md` is the one line
`@~/.agents/AGENTS.md`, and `~/.codex/AGENTS.md` is a symlink to the real file. On the Claude Code
side the import beats a link, because no editor can break an import. Codex has no import, and it reads
`~/.codex/AGENTS.md` through a link: `codex-rs/codex-home/src/instructions/mod.rs` calls
`tokio::fs::metadata`, which follows links. The skills get the same treatment. `~/.agents/skills/flow/`
is the real folder, holding the manifest and the 12 links into the clone, and `~/.claude/skills/flow`
links to it. Whether Claude Code loads a skills-dir plugin through a linked folder is unproven. If it
does not, both roots hold a real folder, and install rewrites both manifests every run.

### Codex's importer copies once, so Flow cannot use it

Found 2026-09-18 in `codex-rs/external-agent-migration/`. The first time Codex runs, it offers to
copy a Claude Code setup across: settings, skills, `CLAUDE.md`, plugins, MCP servers, subagents, hooks,
commands, memory and session logs. The item types are the enum in `src/model.rs`.

**3 things rule it out for Flow.**

- **It copies once.** `import_skills` in `src/service.rs` copies each folder with `copy_dir_recursive`,
  and skips any target that already exists. The first edit to a Flow skill or rule leaves Codex on the
  old text.
- **It rewrites words in what it copies.** `src/rewrite.rs` turns `CLAUDE.md` into `AGENTS.md`, and
  every "claude" bounded by a non-word character into "Codex", so `~/.claude/skills` in a rule arrives
  as `~/.Codex/skills`. It rewrites a `SKILL.md` and the imported `AGENTS.md` this way.
- **It skips symlinks.** `copy_dir_recursive` in `src/utils.rs` copies only real folders and real files.
  Flow's linked skills would arrive as an empty folder.

**2 uses remain.** It is Codex's own mapping from Claude Code's formats to its own, so the hooks port
reads `src/hooks_cla.rs` and the subagents port reads `import_subagents` in `src/source/cla.rs` before
anything is designed. And `/flow:setup` has to look for what it left behind, on a machine where the
user accepted its offer. It leaves a symlinked `~/.codex/AGENTS.md` alone, since
`is_missing_or_empty_text_file` reads a link as neither missing nor empty.

Claude Code has the mirror of it. `/import` appends a one-time copy of `AGENTS.md` to the matching
`CLAUDE.md`, according to the memory page. It fails Flow for the same first reason.

### The hooks on Codex, walked 2026-09-18

**The user deferred the Codex port the same day: Flow releases on Claude Code alone first.** Each
harness may get its own mechanisms rather than one mechanism bent to fit both, since the walk below
found 7 of Flow's 11 hooks needing a change or having no Codex moment. What stays built is what any
harness needs: the rules in `~/.agents/AGENTS.md` with `~/.claude/CLAUDE.md` importing them, the
link `~/.codex/AGENTS.md`, and the skills in `~/.agents/skills/flow/`. Codex finds those skills on
its own, so dropping the link would not keep Flow out of Codex. The port starts from this section.
Every path below is under `repos/codex/codex-rs/`.

**How Codex runs a hook.**

- **2 files, read together.** `~/.codex/hooks.json` and a `[hooks]` table in `~/.codex/config.toml`,
  and the same pair in a project's `.codex/`. Both load, with a warning at start
  (`hooks/src/engine/discovery.rs`).
- **12 events** (`HOOK_EVENT_NAMES` in `hooks/src/lib.rs`): `PreToolUse`, `PermissionRequest`,
  `PostToolUse`, `PreCompact`, `PostCompact`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`,
  `SubagentStart`, `SubagentStop`, `Stop`, `Interrupt`. No `PostToolUseFailure`, no
  `InstructionsLoaded`, no `UserPromptExpansion`, and no background hook like `asyncRewake`.
- **Every hook needs the user's approval once.** A hook runs only when a hash of its entry sits in
  `config.toml` as `trusted_hash`. The hash covers the event, the matcher and the command, never the
  script, so an edit to a script in the clone never asks again (`hook_hash` in `discovery.rs`). At
  start the terminal app offers "Review hooks", "Trust all and continue" and "Continue without
  trusting" (`tui/src/startup_hooks_review.rs`). `codex exec` skips an unapproved hook silently, and
  `--dangerously-bypass-hook-trust` runs it anyway. **Flow writing the hashes itself was rejected**:
  it copies a private method, and a Codex update that changes it breaks with no warning.
- **The payload uses Claude Code's field names.** `session_id` is the root thread's id, shared by
  every worker (`core/src/agent/control.rs`). A worker's calls add `agent_id` and `agent_type`. Every
  tool call also carries `turn_id` and `model`, so `rule-check.js` could record the model per result,
  which Claude Code hands a hook at session start alone.
- **Tool names** (`core/src/tools/hook_names.rs`). A shell command is `Bash` with
  `tool_input.command`. Every edit is `apply_patch`, whose whole input is the patch text in
  `tool_input.command`, and a matcher naming `Edit` or `Write` selects it. `spawn_agent` answers to
  `Agent`. An MCP tool is `mcp__<server>__<tool>`.
- **`PostToolUse` fires only when a call succeeds** (`core/src/tools/registry.rs`).
- **A `UserPromptSubmit` hook's plain output becomes context**, as in Claude Code.
- **A hook cannot answer "ask".** `PreToolUse` accepts `deny`. It rejects `ask` as unsupported, marks
  the hook run failed, and runs the call (`unsupported_pre_tool_use_hook_specific_output` in
  `hooks/src/engine/output_parser.rs`).

**Flow's 11 hooks, one by one.**

- **4 carry over as they are.** The reminder. `changes.js` after each call, and at a worker's start
  and stop.
- **`guard.js` needs the git switch rebuilt**, below. It also needs Codex's own bypass flags,
  `--dangerously-bypass-approvals-and-sandbox` and `--yolo`, on its list of what is always denied.
- **`changes.js` before each call reads the file names out of the patch.** Unchanged, it treats the
  patch as a shell command and snapshots the whole project around every edit: correct, and slow.
- **`rule-check.js` reads the patch.** Unchanged, it returns at once for any tool not named `Edit` or
  `Write`, so it checks nothing on Codex. A patch gives each file's added lines, which is what
  `needs: 'added'` wants. A check needing the whole file after the edit would have to apply the patch.
- **The waiter becomes a plain `PostToolUse` hook on `wait_agent`.** A Codex parent sees a worker's
  result only through that tool, which returns once the worker has finished, so no background hook
  is needed.
- **`check-ticket.js` moves to `UserPromptSubmit`.** It reads `$flow:<skill> <id>` out of the
  `prompt` field, runs `flow get`, and blocks the message on a miss.
- **The failed-call hook is dropped.** The snapshot at a worker's end still catches what a failed
  call changed, listed as a change no call explains.
- **`instructions-loaded.js` is dropped.** Codex reports no loads, so `rule-check.js` finds the list
  empty and a warning carries the rule's whole text.

**The git switch on Codex takes 3 pieces**, since only Codex itself can ask the user:

1. **A rules file in `~/.codex/rules/`** (`core/src/exec_policy.rs`, format in
   `execpolicy/README.md`) makes every git write ask. It never changes while Codex runs, so it
   cannot follow the switch alone.

   ```starlark
   prefix_rule(pattern = ["git", "push"], decision = "prompt")
   ```

2. **`guard.js` denies git writes when the switch is off**, as it does in Claude Code.
3. **A `PermissionRequest` hook answers yes when the switch is on allow.** Codex fires it just before
   it asks the user. **Unverified**: whether it fires for a prompt a rules file causes.

**Rejected 2026-09-18: turning every "ask" into "deny" on Codex.** The user: "there is a big
difference between ask and deny. And there is a reason we made all of those, some of the commands as
ask first."

### Two harnesses on one project

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

### Still open on porting

- **Whether Codex resolves `@path` imports** if the open issues land. The layout above assumes not.
- **Whether auto mode's classifier runs on the gateway model.** Inferred from the attribution-block
  rules, never observed.
- **Whether `WebFetch` works at all** with a non-Anthropic credential and the preflight left on.
- **Whether DeepSeek and Qwen reach Codex** through the Responses API for the models Flow would use.
- **Whether Flow's rules bind a model outside Claude.** The question underneath everything, answered
  only by one paid plan and one real session.
