# Claude Code: what it cannot do that Flow needs

What the platform is missing, and what has been filed about it. Everything Claude Code *does* do is on the public page [What Claude Code does](../../docs/dev/claude-code.md), which replaced this record's sibling on 2026-09-16.

**A record, not a work list.** `backlog.md` holds every open item in Flow, and nothing here is one, because none of it is Flow's to build. Assembled 2026-09-10, and every entry names where the argument already lives.

## Filed

Six issues on `anthropics/claude-code` in 2 batches, all priority Medium. The first 3 below were filed 2026-09-10, all category Configuration and settings.

- **[#93248](https://github.com/anthropics/claude-code/issues/93248), `paths:` triggers on reads only.** A rules file or a skill carrying `paths:` loads when Claude reads a matching file, so neither is present when Claude creates one. Editing an existing file requires reading it first, which makes creation the whole gap. Proposes an optional `on: [read, write, edit]` beside `paths:`, and a `triggers:` long form where the globs differ per event. A second failure mode rides the same trigger: after a compaction a path-scoped rule returns only on a matching read, so a write-heavy session never gets it back. Evidence is a live run that wrote `formatDuration.ts` while an `InstructionsLoaded` hook recorded 3 `CLAUDE.md` files and no rules file. `backlog.md` → `## Rules and always-loaded files`
- **[#93249](https://github.com/anthropics/claude-code/issues/93249), no `exclude:` field.** An extension glob matches `node_modules/`, `dist/` and every vendored tree the rule has no authority over, and the pattern language has no negation. `claudeMdExcludes` is the wrong granularity: it skips whole instruction files by absolute path rather than narrowing one glob.
- **[#93252](https://github.com/anthropics/claude-code/issues/93252), a hook can inject text but cannot load anything.** Proposes one output field, `load:`, taking `rule`, `skill` and `file` targets on `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart` and `PostCompact`. The deciding argument is that a glob sees the path and never the content, so only code can tell which library an edit imports. `reloadSkills` on `SessionStart` is the precedent, and it stops at making a skill discoverable. `docs/dev/claude-code.md` → `## What a hook can and cannot load`

### Three more on 2026-09-21, written from the dropped-path research

Posted by the user through the web form. **Their numbers are not here**, because the drafts were handed over rather than posted from this session: one `gh issue list --repo anthropics/claude-code --author Adrian333Dev` recovers all 3, and they belong in the list above. `gh issue create --body-file` skips the form's labels, and a GitHub Action attached them afterwards anyway.

- **A dragged file inserts a bare path rather than an `@` reference**, category `Interactive mode (TUI)`. Dragging is the fastest way to name a file and produces the one form that does not load it, so every dropped file costs a turn. The case with no other route is a git-ignored file, which the suggestion list never offers. Leans on #77204, which shows the drop handler already branches by file type, since an image becomes vision content while everything else becomes a path, and on #73853, which already called the dropped path inconsistent with the `@` flow. The ask: `@` plus the path in the form the `@` flow produces, a modifier for the bare path, images unchanged.
- **A dragged folder inserts nothing at all**, same category. Filed apart from the file case because it is a different defect on the same handler: a file inserts the wrong thing, a folder inserts nothing. Leans on `@src/` already expanding to a folder listing, and on the IDE having folder support the terminal lacks. The ask says nothing is loaded recursively, because the listing is the right amount.
- **A `UserPromptSubmit` hook cannot replace the prompt**, category `Configuration and settings`. Written generic: any transform that takes the user's text and sends a different text instead, with a script or a second model rewriting the message as the general case. Appending inverts all of them, and the issue names 3 kinds, compressing, redacting and rewriting a reference. The ask is one `replacePrompt` field, additive, whose condition is that a replacement is processed exactly as typed text is.

**Two catalogue items were absorbed, not dropped.** A trigger richer than a glob is #93248. One frontmatter field covering rules and skills alike is what #93248 and #93249 both assume.

### The feature form, field by field

What `[FEATURE]` on `anthropics/claude-code` asks for, read off #93248 on 2026-09-21. Every field below was written out in full for each of the 3, and the bodies are the model to copy: a measured run rather than a claim, the alternative that was actually built and why it is not equivalent, and the documentation quoted with its address.

- **Preflight Checklist**: 2 boxes, that the existing requests were searched and that this is one feature rather than several.
- **Problem Statement**: what is broken, with the evidence. #93248 held a version number, a live run, and the hook output that proved the rule was absent rather than present and ignored.
- **Proposed Solution**: the shape of the fix, in the product's own syntax, and what keeps working unchanged.
- **Alternative Solutions**: every workaround tried, each with the reason it is not the same thing. This is the longest field in all 3.
- **Priority**: one of the form's fixed phrases. All 3 used `Medium - Would be very helpful`.
- **Feature Category**: all 3 used `Configuration and settings`.
- **Use Case Example**: numbered steps, ending with what the change would do at the step that fails today.
- **Additional Context**: the version, the pages quoted with their URLs, and a link to any issue filed alongside it.

## Worth filing

Ordered by what Flow would gain. Nothing here is urgent, and nothing blocks the build.

- **`model` reaches a hook on `SessionStart` alone**, where it can be omitted, and a later `/model` switch never shows. `effort.level` already lands on the `PreToolUse` payload, so the shape exists and the field is missing beside it. Flow's scorecard records effort on every result and cannot record which model produced it. `models.md`
- **A skill given arguments re-appends its whole body.** An argument makes the render differ per invocation, so Claude Code appends the file again instead of skipping it. That is why `/flow:execute t047` is unbuildable: `/flow:groundwork` is 284 lines, `/flow:execute` 191, `/flow:handoff` 153. `backlog.md` → `## V1`, `skills.md` → `### Arguments`
- **No hook payload carries context usage.** The running token count is readable only by parsing `~/.claude/projects/<project>/<session-id>.jsonl` for the `usage` block on each assistant message. A hook that says "wrap up, the window is filling" has to reimplement that. `backlog.md` line 140
- **Editing a loaded instruction file mid-session is silently inert.** The documentation says the edit does not apply and no cache is invalidated, so an agent writes a rule into `~/.claude/CLAUDE.md` and keeps breaking it with nothing signalling the gap. A warning would be enough; a reload would be better. `docs/dev/claude-code.md` → `## A request has three layers, and an edit only reaches one`
- **Permission rules cannot expire.** `permissions.allow` and `permissions.deny` are permanent, so "allow git for an hour" is unexpressible. Flow built `guard.js` around that: a TTL per entry, 3 scopes, and a pruner that deletes an expired entry the first time anything looks. All 19 git entries left `permissions.deny` to make room for it. `docs/manual/settings.md` → the git switch
- **A subagent's cost never reaches the parent.** In session the parent sees the returned report and nothing else. A `SubagentStop` hook is handed `agent_transcript_path`, so the numbers are recoverable by parsing a nested transcript after the fact, which is not the same as knowing what a dispatch cost while deciding whether to make another. `docs/dev/agents.md`
- **A subagent has no output contract.** It returns free prose, with no way to declare the shape the parent expects. `AskUserQuestion` is stripped from every subagent, so ending the turn is the only way it can return. `docs/dev/agents.md`
- **Symlinked rules do not load in Cowork desktop sessions.** A `~/.claude/rules/` file resolving outside the working directory is skipped, and `flow install` links every one of them into the clone. Terminal and IDE sessions are unaffected, and `CLAUDE.md` is copied rather than linked. A bug report rather than a feature request. `backlog.md` line 82

## Not worth filing

- **A file read inside a script is invisible.** `node build.js` opens 100 files and the transcript records 1 command. Nothing short of tracing the process recovers them, so the ask is unreasonable. Flow states every file count as a floor instead.
- **Non-Anthropic provider failures.** Every one traced back to an environment variable that was set wrong. Nothing missing. `models.md`
