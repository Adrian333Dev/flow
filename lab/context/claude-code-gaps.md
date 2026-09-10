# Claude Code gaps

What Claude Code cannot do that Flow needs, and what has been filed about it.

**A record, not a work list.** `backlog.md` holds every open item in Flow, and nothing here is one, because none of it is Flow's to build. Assembled 2026-09-10 from `backlog.md` and the files beside this one. Every entry names where the argument already lives.

## Filed

Three issues on `anthropics/claude-code`, all 2026-09-10, all priority Medium and category Configuration and settings.

- **[#93248](https://github.com/anthropics/claude-code/issues/93248), `paths:` triggers on reads only.** A rules file or a skill carrying `paths:` loads when Claude reads a matching file, so neither is present when Claude creates one. Editing an existing file requires reading it first, which makes creation the whole gap. Proposes an optional `on: [read, write, edit]` beside `paths:`, and a `triggers:` long form where the globs differ per event. A second failure mode rides the same trigger: after a compaction a path-scoped rule returns only on a matching read, so a write-heavy session never gets it back. Evidence is a live run that wrote `formatDuration.ts` while an `InstructionsLoaded` hook recorded 3 `CLAUDE.md` files and no rules file. `backlog.md` → `## Rules and always-loaded files`
- **[#93249](https://github.com/anthropics/claude-code/issues/93249), no `exclude:` field.** An extension glob matches `node_modules/`, `dist/` and every vendored tree the rule has no authority over, and the pattern language has no negation. `claudeMdExcludes` is the wrong granularity: it skips whole instruction files by absolute path rather than narrowing one glob.
- **[#93252](https://github.com/anthropics/claude-code/issues/93252), a hook can inject text but cannot load anything.** Proposes one output field, `load:`, taking `rule`, `skill` and `file` targets on `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart` and `PostCompact`. The deciding argument is that a glob sees the path and never the content, so only code can tell which library an edit imports. `reloadSkills` on `SessionStart` is the precedent, and it stops at making a skill discoverable. `claude-code-memory.md`

**Two catalogue items were absorbed, not dropped.** A trigger richer than a glob is #93248. One frontmatter field covering rules and skills alike is what #93248 and #93249 both assume.

## Worth filing

Ordered by what Flow would gain. Nothing here is urgent, and nothing blocks the build.

- **`model` reaches a hook on `SessionStart` alone**, where it can be omitted, and a later `/model` switch never shows. `effort.level` already lands on the `PreToolUse` payload, so the shape exists and the field is missing beside it. Flow's scorecard records effort on every result and cannot record which model produced it. `model-identity.md`
- **A skill given arguments re-appends its whole body.** An argument makes the render differ per invocation, so Claude Code appends the file again instead of skipping it. That is why `/execute t047` is unbuildable: `/groundwork` is 284 lines, `/execute` 191, `/handoff` 153. `backlog.md` line 38, `design-skills.md`
- **`UserPromptSubmit` cannot replace the prompt**, only append to it. So a hook that compresses a dictated message makes the context larger rather than smaller. `backlog.md` → `## Context and session boundaries`
- **No hook payload carries context usage.** The running token count is readable only by parsing `~/.claude/projects/<project>/<session-id>.jsonl` for the `usage` block on each assistant message. A hook that says "wrap up, the window is filling" has to reimplement that. `backlog.md` line 140
- **Editing a loaded instruction file mid-session is silently inert.** The documentation says the edit does not apply and no cache is invalidated, so an agent writes a rule into `~/.claude/CLAUDE.md` and keeps breaking it with nothing signalling the gap. A warning would be enough; a reload would be better. `claude-code-memory.md` → `## Editing a loaded file mid-session does nothing`
- **Permission rules cannot expire.** `permissions.allow` and `permissions.deny` are permanent, so "allow git for an hour" is unexpressible. Flow built `guard.js` around that: a TTL per entry, 3 scopes, and a pruner that deletes an expired entry the first time anything looks. All 19 git entries left `permissions.deny` to make room for it. `threads.md` → `git-writes`
- **A subagent's cost never reaches the parent.** In session the parent sees the returned report and nothing else. A `SubagentStop` hook is handed `agent_transcript_path`, so the numbers are recoverable by parsing a nested transcript after the fact, which is not the same as knowing what a dispatch cost while deciding whether to make another. `threads.md` → `subagent-mechanics`
- **A subagent has no output contract.** It returns free prose, with no way to declare the shape the parent expects. `AskUserQuestion` is stripped from every subagent, so ending the turn is the only way it can return. `threads.md` → `subagent-mechanics`
- **Symlinked rules do not load in Cowork desktop sessions.** A `~/.claude/rules/` file resolving outside the working directory is skipped, and `flow install` links every one of them into the clone. Terminal and IDE sessions are unaffected, and `CLAUDE.md` is copied rather than linked. A bug report rather than a feature request. `backlog.md` line 82

## Not worth filing

- **A file read inside a script is invisible.** `node build.js` opens 100 files and the transcript records 1 command. Nothing short of tracing the process recovers them, so the ask is unreasonable. Flow states every file count as a floor instead.
- **A dragged file path costs an extra turn.** Dragging a file into the terminal pastes its absolute path, and the agent spends 1 turn seeing it and a second reading it. Buildable today with a `UserPromptSubmit` hook that reads every quoted absolute path. Flow's own work, not Anthropic's.
- **Non-Anthropic provider failures.** Every one traced back to an environment variable that was set wrong. Nothing missing. `harness-portability.md`
