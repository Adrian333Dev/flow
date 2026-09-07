# Claude Code: memory, loading and hooks

What Claude Code does about instruction files, its own memory system, and what a hook can reach.
Researched 2026-09-07 from Anthropic's published documentation. Every fact below is documented
rather than measured, and each section names the page it came from. Nothing here is a Flow decision.

**One fact here changed Flow's design and one did not.** No hook loads a skill or a rule file, so a
condition richer than a path glob has no mechanism and the question is closed. Auto memory looked
like it replaced `## Capture`'s profile routes and does not: it is off in `home/settings.json`, and
`home/settings.md` gives the reason.

`docs/dev/claude-code.md` is the planned public home for material like this and is still unwritten.
`backlog.md` → `## The Claude Code reference` owns that page.

## Editing a loaded file mid-session does nothing

From `code.claude.com/docs/en/prompt-caching`:

> Your project-root and user-level CLAUDE.md files are read once at session start and held in
> memory. Editing them mid-session does not invalidate the cache, but the edit also doesn't apply.
> Claude keeps working with the version that was loaded at session start. The new content loads on
> the next `/clear`, `/compact`, or restart.

So a mid-session write to `~/.claude/CLAUDE.md` is silently inert. The agent writes the rule and
keeps breaking it, with nothing signalling the gap. **The cache is not the reason to avoid it.** No
cache is invalidated and nothing is re-uploaded.

There is one real cost, from the same page. `/compact` "reloads project context from disk, which
cache-hits only if CLAUDE.md and memory are unchanged since the session started", so an edit makes
the next compaction more expensive.

**Two files behave differently.** A nested `CLAUDE.md` in a subdirectory and a rule file with
`paths:` frontmatter load lazily, when Claude first reads a matching file. Editing one before it
loads does take effect that session. After it loads, it behaves like the root file.

**The three layers of a request**, in the order Claude Code sends them:

| Layer | Holds | Rebuilt when |
| --- | --- | --- |
| System prompt | Core instructions, tool definitions, output style | Tool definitions change, or Claude Code is upgraded |
| Project context | `CLAUDE.md`, auto memory, unscoped rules | Session start, `/clear`, `/compact` |
| Conversation | Messages, responses, tool results | Every turn |

A skill loads as a conversation message, so invoking one never disturbs the cached prefix.

## Auto memory is a built-in Flow turned off

**`home/settings.json` sets `autoMemoryEnabled: false`, and `home/settings.md` states why: auto memory
is per repository and machine-local, so it cannot hold anything durable.** Everything below is what
Flow turned down, kept because `docs/dev/claude-code.md` wants it.

From `code.claude.com/docs/en/memory`. Auto memory is Claude writing notes to itself, on by default,
separate from any `CLAUDE.md`. It stores them at `~/.claude/projects/<project>/memory/`, one
`MEMORY.md` index plus one file per topic. The first 200 lines of the index load into every session.
Topic files are read on demand.

Four kinds, recorded as a `type` field in each file's frontmatter:

- `user`: role, expertise, working preferences
- `feedback`: corrections given, and approaches confirmed
- `project`: ongoing work, deadlines, decisions not derivable from the code
- `reference`: where information lives outside the project

**It has been running on this machine for months.** Delapse has 24 files. Three of them:

```
- [Communication style](feedback_communication_style.md) — be very direct, no filler/cheerleading;
  bring creative high-bar proposals; `type` not `kind`; voice-to-text → confirm garbled phrasing
- [Approve before change](feedback_approve_before_change.md) — always explain planned changes and
  wait for explicit approval before editing any code
- [Git read-only rule](feedback_git_readonly.md) — user owns all git ops; agent may only use
  git diff/log/status/show
```

Those three are `## The turn` step 2, step 3, and `no-git-mutations`. Claude derived each from the
user's corrections without being asked. Every file carries a `modified` timestamp and the id of the
session it came from.

**Why Flow turned it down.** Auto memory is per repository and machine-local, so a preference learned
in one project never reaches a new one. A line in `~/.claude/CLAUDE.md` does. It is also never
committed, so nothing about it is shared or reviewable. `## The user` in `~/.claude/CLAUDE.md` is
Flow's answer instead, and filling it is still an open design question.

Toggles: `autoMemoryEnabled` in settings, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, and
`autoMemoryDirectory` moves the folder. `/memory` browses it.

## How a rule file loads

From the same page.

- **No `paths:` frontmatter**: loaded at launch, at the same priority as `.claude/CLAUDE.md`. This
  is the documented fact behind the user's 2026-09-07 ruling that a second always-loaded file buys
  nothing.
- **With `paths:`**: loads when Claude reads a matching file, never on every tool use.
- `~/.claude/rules/` is user scope and loads before project rules, so a project rule wins.
- Rule files are discovered recursively and symlinks are followed.
- Anthropic's own size guidance: **under 200 lines per `CLAUDE.md`**, and a file over 4 MiB is
  skipped entirely.

## What a hook can and cannot load

From `lab/research/claude-code-docs/hooks.md`.

**Nothing invokes a skill, and nothing loads a rule file on a computed condition.** A skill takes
`paths:` frontmatter, the same as a rule file, so a glob is the only condition either one supports:
"When set, Claude loads the skill automatically only when working with files matching the patterns."
The three near misses:

- `SessionStart` → `reloadSkills` re-scans the skill folders so a newly installed skill is available.
  It starts nothing.
- `SessionStart` → `initialUserMessage` becomes the session's first user message, but only in
  non-interactive `-p` runs.
- `UserPromptExpansion` fires when the user types `/skillname`, and can add context to it or block
  it. It cannot start one.

**`InstructionsLoaded` is observability only.** The documentation is explicit: "InstructionsLoaded
hooks have no decision control. They can't block or modify instruction loading." Flow's
`scripts/instructions-loaded.js` uses it correctly, to record which files entered context.

**Injecting rule text is the substitute.** A hook writes `additionalContext` and the agent reads it
as a system reminder. `PreToolUse` covers the moment of an edit, which is what
`scripts/rule-check.js` already does. `UserPromptSubmit` covers every turn. `SessionStart` covers
session start. Injected text is not a rule file and never appears under `/context`.

## What a hook can see of the conversation

The pieces that make a conduct rule checkable, which the enforcement bridge design assumed were out
of reach:

- **`MessageDisplay`** fires while an assistant message streams, carrying `turn_id`, `message_id`
  and the new text in `delta`. It sees Claude's prose. Display-only: it cannot block, and its
  replacement text never reaches Claude.
- **`PreToolUse`** carries `prompt_id`, a UUID for the user prompt being processed. It sees every
  tool call and can block.
- **`Stop`** fires when the turn ends and carries `last_assistant_message`, the final response text.
  It can block, sending the agent back to fix the turn, up to 8 consecutive blocks before Claude
  Code overrides it.

So the order of text against edits inside one turn is readable: record prose from `MessageDisplay`,
record edits from `PreToolUse`, group by the turn, score at `Stop`.

**Never read `transcript_path` for the current turn.** The documentation warns the file "is written
asynchronously and may lag the in-memory conversation", and says to use `last_assistant_message` on
`Stop` instead. Nothing Flow has built reads the transcript from a hook.
