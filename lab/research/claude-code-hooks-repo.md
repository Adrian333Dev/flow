# claude-code-hooks + hookify

498 stars (claude-code-hooks by karanb192). A 20-plugin installable marketplace of hooks for Claude Code: safety, automation, notifications. Plus Anthropic's own hookify plugin inside the `claude-code` repo. Together they cover both sides of the knowledge-to-enforcement bridge.

## dead-rules-audit — the compliance scorecard

The most relevant plugin for Flow's knowledge base design. It mechanically measures whether the agent follows its own rules.

### How it works

1. **SessionStart** — parses the nearest CLAUDE.md into numbered atomic rules. A rule is a list item or blockquote that contains a directive word (always, never, must, avoid, use, etc.). Stored as a session snapshot.

2. **PostToolUse on Edit/MultiEdit/Write** (async, zero latency) — scores each change against each rule using deterministic keyword/pattern heuristics. No model call, no network. Per-rule tallies: how often the rule was relevant, whether it was followed or violated. Appended to a local JSONL ledger at `~/.claude/dead-rules-audit/`.

3. **SessionEnd** — renders a worst-first compliance scorecard: rule text, times relevant, times violated, compliance %, and a `promote→hook` flag for chronically-ignored rules.

### The promotion threshold

A rule is flagged for promotion when:
- At least 3 violations (`PROMOTE_MIN_VIOLATIONS`).
- Violation rate crosses 50% (`PROMOTE_RATE`).

The flag says: this rule is ignored often enough that a soft instruction in CLAUDE.md is not working, and it should become a deterministic hook that blocks the behavior before it happens.

### Rule parsing

The parser is deliberately conservative:
- Only list items and blockquotes qualify as rules, not free-flowing prose.
- Must contain a directive word.
- Non-list lines must lead with the imperative and be short (≤18 words).
- Capped at 200 rules and 256KB of CLAUDE.md.
- Keywords from backticked code tokens get the highest relevance signal.

## hookify — rule creation from conversation

Anthropic's plugin in the claude-code repo. Creates hook rules from conversation analysis or explicit instructions.

### How it works

1. User says `/hookify Don't use console.log in TypeScript files` (or runs `/hookify` with no arguments to analyze recent conversation for frustration signals).
2. hookify creates `.claude/hookify.{rule-name}.local.md` — a markdown file with YAML frontmatter defining the pattern and action (warn or block).
3. Rules take effect immediately on the next tool use. No restart needed.

### Rule format

```markdown
---
name: warn-console-log
enabled: true
event: file
pattern: console\.log\(
action: warn
---

Warning message here.
```

Events: bash, file, stop, prompt, all. Actions: warn (show message, allow) or block (deny operation). Conditions can match on field (command, file_path, new_text, old_text), operator (regex_match, contains, equals, not_contains), and pattern.

### The rule engine

Python, stdlib only. Regex pattern matching with LRU cache (128 compiled patterns). All conditions must match for a rule to trigger. Blocking rules take priority over warnings. The engine runs as PreToolUse, PostToolUse, Stop, and UserPromptSubmit hooks.

## The two sides of the bridge

Together, dead-rules-audit and hookify implement the full enforcement bridge:

1. **Knowledge → rule**: a correction or convention is captured as a CLAUDE.md rule.
2. **Rule → measurement**: dead-rules-audit tracks whether the rule is followed.
3. **Measurement → promotion**: rules with high violation rates are flagged for hook promotion.
4. **Promotion → hook**: hookify creates a deterministic hook from the rule.

The bridge closes the loop: soft knowledge becomes hard enforcement when the agent proves it cannot follow the soft version.

## What matters for Flow

### The compliance scorecard is the right feedback mechanism

Flow's CLAUDE.md already has rules the agent ignores. dead-rules-audit provides the data to identify which ones: how often each rule was relevant, how often it was followed, how often it was violated. This is the missing input for deciding what belongs in CLAUDE.md (soft guidance) versus what needs a hook (hard enforcement).

### Deterministic scoring, not LLM scoring

The rule engine uses keyword/pattern heuristics, not model calls. This keeps hook evaluation fast (zero latency when async), cheap (no API cost), and predictable. For Flow, this means the enforcement layer can be purely mechanical — no LLM in the hot path.

### The markdown rule format is the right shape

hookify's `.local.md` files are human-readable, version-controllable, and immediately effective. They follow the same pattern as Flow's skills: markdown with frontmatter. A learned behavior that graduates to a hook becomes a file alongside the skills, using the same format.

### The promotion threshold needs tuning

3 violations at 50% rate is aggressive for a solo developer whose sessions run long. Flow would need to calibrate the threshold based on the user's session patterns, not adopt the defaults.
