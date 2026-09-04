# claude-diary

379 stars. The simplest memory loop: diary entries → reflection → CLAUDE.md updates. Two commands (`/diary`, `/reflect`), one hook (PreCompact), no infrastructure. Inspired by the Generative Agents paper (observations → reflection → retrieval) and a conversation between Dan Shipper and Cat Wu / Boris Cherny from the Claude Code team about diary entries for sessions.

## Core mechanism — the diary-reflection-memory loop

### Diary (capture)

`/diary` creates a structured diary entry from the current session's conversation context. The command reflects on what is already in context — user messages, tool invocations, files modified, errors, solutions, design decisions, user preferences. No JSONL transcript parsing needed for typical sessions (fallback for post-session analysis or precise statistics).

Diary entries are saved to `~/.claude/memory/diary/YYYY-MM-DD-session-N.md` with sections:
- Task Summary, Work Summary, Design Decisions Made
- Actions Taken, Code Review & PR Feedback
- Challenges Encountered, Solutions Applied
- User Preferences Observed (commit, code quality, technical preferences)
- Code Patterns and Decisions, Context and Technologies

A PreCompact hook auto-triggers `/diary` before context compaction, capturing knowledge before it is lost.

### Reflection (synthesis)

`/reflect` analyzes multiple diary entries to identify patterns and proposes CLAUDE.md updates. The command:

1. Checks `processed.log` to skip already-analyzed entries.
2. Reads and parses diary entries, filtering by date range, project, topic, or entry count.
3. Reads current CLAUDE.md to check for existing rules.
4. Detects rule violations: diary entries showing the agent violated existing CLAUDE.md rules are highest priority for strengthening.
5. Identifies patterns across six categories: PR review feedback, persistent preferences, design decisions that worked, anti-patterns, efficiency lessons, project-specific patterns.
6. Generates a reflection document with pattern analysis, evidence, and confidence levels.
7. Auto-updates CLAUDE.md: strengthens violated rules (move to top, add emphasis), appends new rules as one-line bullets in imperative tone.
8. Updates `processed.log` to track which entries have been analyzed.

### Frequency thresholds

- 2+ occurrences: emerging pattern, noted.
- 3+ occurrences: strong pattern, proposed as CLAUDE.md rule.
- 1 occurrence: one-off, documented but not promoted.

### Rule format for CLAUDE.md

```markdown
- git commits: use conventional format (feat:, fix:, refactor:, docs:, test:)
- PR descriptions: no Claude Code attribution or AI tool mentions
- testing: always run tests before committing, ensure they pass
```

One-line bullets, imperative tone, no explanations. Context prefix when needed (`for Python:`, `when testing:`).

## What matters for Flow

### The simplest complete loop

Diary → reflection → CLAUDE.md update → next session reads CLAUDE.md. No database, no server, no background process. The entire system is two markdown command files and a shell script. This is the minimum viable self-improvement loop.

### Reflection is the missing step in most systems

Most memory repos stop at capture. claude-diary adds a synthesis step that looks across sessions for recurring patterns and promotes them to rules. This is what turns raw observations into durable knowledge. The frequency threshold (2+ = pattern, 3+ = strong) is a simple version of ECC's confidence scoring.

### Rule violation detection closes the loop

The reflect command checks whether diary entries show the agent violating existing CLAUDE.md rules. Violations are the highest-priority output: they mean an existing rule is not working and needs strengthening. This is the same insight as dead-rules-audit, implemented differently — diary analysis instead of real-time compliance scoring.

### The diary format is too verbose

The diary template has 12 sections, most of which are empty in a typical session. The structured overhead discourages frequent use. Flow's equivalent should be leaner: what was done, what was learned, what changed. Three things, not twelve.

### Human-triggered reflection is a bottleneck

The user has to remember to run `/reflect`. claude-diary suggests auto-triggering when N unprocessed entries accumulate, but does not implement it. Flow should automate the synthesis step, or it will not happen.
