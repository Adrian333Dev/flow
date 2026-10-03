# Claude Code: what it does, and what it cannot do that Flow needs

2 parts. `# What Claude Code does` holds the tested facts Flow is built on, moved here from `docs/dev/claude-code.md` and `docs/dev/agents.md` on 2026-10-03. `# What it cannot do` holds what the platform is missing, and what has been filed about it.

**A record, not a work list.** `lab/backlog/` holds every open item in Flow, and nothing here is one, because none of it is Flow's to build. Assembled 2026-09-10, and every entry names where the argument already lives.

# What Claude Code does

Almost every design decision in Flow turns on some detail of how Claude Code behaves. These are those details, written down once so no session works them out again. Each was read in Anthropic's documentation or produced by a test, and a tested fact names the version it was seen on. The parts a user needs are on the public page [Claude Code features](../../docs/claude-code-features.md).

## What it does with sessions, files, skills, plugins and hooks

### The words this page uses

Claude Code's own documentation uses these words without defining them. Each one is defined here on first use, and the meaning holds for the rest of the page.

- **A session** is one conversation. It starts when you open Claude Code and ends when something explicitly ends it.
- **Compaction** is Claude Code replacing the older part of a conversation with a summary, to make room. `/compact` does it on demand, and it also happens on its own when the conversation gets long.
- **A transcript** is the file Claude Code writes as a session runs: one JSON object per line, one line per event.
- **An instruction file** is a markdown file Claude Code loads as standing instructions. `CLAUDE.md` is one. A **rule file** is another: a markdown file under a `rules/` folder, which can carry a `paths:` line restricting when it loads.
- **Frontmatter** is the block of `key: value` lines at the very top of a markdown file, fenced by `---`. Claude Code reads settings out of it.
- **A skill** is a folder holding a `SKILL.md`. Its body is a set of instructions that get inserted into the conversation when the skill runs, either because you typed `/name` or because the model decided to use it.
- **A hook** is a shell command Claude Code runs at a fixed moment, such as before a tool call or when a turn ends. It receives JSON on standard input and can print JSON back.
- **A plugin** is a bundle installed from a marketplace. One plugin can contain skills, subagents, slash commands and hooks at once.

### A session ends at `/clear` and survives compaction

Read from `code.claude.com/docs/en/sessions` and `code.claude.com/docs/en/hooks`, and checked against this machine's transcripts on 2026-09-02.

**Compaction never ends a session.** The `SessionEnd` hook has 6 possible reasons, and compaction is not among them: `clear`, `resume`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled` and `other`. One transcript on this machine holds 58 compaction summaries under a single session id.

**`/clear` ends the session and starts a new one.** `SessionEnd` fires with reason `clear`, `SessionStart` fires with source `clear`, and the new session gets a new id. The old conversation is still reachable through `/resume`.

The rest of the boundaries:

- **`/branch` and `--fork-session` each get their own id**, so both produce a genuinely separate session.
- **`--resume` and `--continue` keep the id and keep writing the same file.** Resuming one session in 2 terminals at once writes both conversations into one transcript.
- **`SessionStart` receives a `source` field**: `startup`, `resume`, `clear`, `compact` or `fork`. It fires on compaction as well, which is the one case where a session start does not mean a new session.

**Every hook receives the same 7 fields** whatever the event: `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `effort` and `hook_event_name`. Inside a subagent it also receives `agent_id` and `agent_type`.

### Where a session lands on disk

A transcript is written to `~/.claude/projects/<project>/<session-id>.jsonl`. Each subagent the session starts gets its own transcript under `<session-id>/subagents/`. The comments at the top of `scripts/lib/audit/database.js` and `scan.js` describe the line format and what the index reads out of it.

Two behaviors surprise people:

- **`cleanupPeriodDays` deletes transcripts**, 30 days after they were written by default. It takes 6 sibling folders with it: `subagents/`, `tool-results/`, `file-history/`, `plans/`, `debug/` and `paste-cache/`. [Settings](../../docs/reference/settings.md#cleanupperioddays) covers what Flow sets it to and why.
- **`/cd` moves a session's storage** into the new directory's project folder partway through. So one session id can appear under 2 different project folders, and a query grouping by folder double-counts it.

`claude project purge <path>` deletes one project's stored state in full.

### A request has three layers, and an edit only reaches one

From `code.claude.com/docs/en/prompt-caching`. Every request Claude Code sends is built in 3 layers, and each is cached separately:

- **The system prompt**: core instructions, tool definitions and output style. Rebuilt when the tool set changes or Claude Code is upgraded.
- **Project context**: `CLAUDE.md`, auto memory, and rule files with no `paths:` line. Rebuilt at session start, at `/clear` and at `/compact`.
- **The conversation**: messages, responses and tool results. Grows every turn.

**Editing a loaded instruction file mid-session does nothing.** The documentation is explicit:

> Your project-root and user-level CLAUDE.md files are read once at session start and held in
> memory. Editing them mid-session does not invalidate the cache, but the edit also doesn't apply.
> Claude keeps working with the version that was loaded at session start. The new content loads on
> the next `/clear`, `/compact`, or restart.

So a rule written into `~/.agents/AGENTS.md`, or any file `~/.claude/CLAUDE.md` imports, in the middle of a session is silently inert, and the agent carries on breaking it. The one real cost arrives at the next compaction: `/compact` "reloads project context from disk, which cache-hits only if CLAUDE.md and memory are unchanged since the session started".

**Two file types behave differently.** A nested `CLAUDE.md` in a subdirectory, and a rule file carrying `paths:`, both load the first time Claude reads a file they match. An edit made before that moment does take effect in the same session.

**A skill loads into the conversation layer**, so invoking one never disturbs the 2 cached layers above it. That is why a skill is cheap to add mid-session and an instruction file is not.

### How an instruction file loads

From `code.claude.com/docs/en/memory`.

- **A rule file with no `paths:`** is loaded at launch, at the same priority as `.claude/CLAUDE.md`. It buys nothing over the `CLAUDE.md` that is already loaded, which is the documented fact behind Flow keeping one always-loaded file instead of several.
- **A rule file with `paths:`** loads the first time Claude reads a file matching one of its patterns, and never on every tool use.
- **`~/.claude/rules/` is user scope** and loads before project rules, so a project rule wins a conflict.
- **Rule files are found recursively**, and symlinks are followed.
- **Anthropic's size guidance is under 200 lines per `CLAUDE.md`.** A file over 4 MiB is skipped entirely, with no warning.
- **Claude Code reads an `AGENTS.md` by itself since 2.1.277**, but only where no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` sits in the working directory or above it. `~/.claude/CLAUDE.md` and `.claude/rules/` don't block it. Nothing under a `.agents/` folder is ever read this way, so `~/.agents/AGENTS.md` reaches Claude Code only through the import in `~/.claude/CLAUDE.md`.
- **A project keeps its one-line `CLAUDE.md` anyway.** An `AGENTS.md` read directly fires no `InstructionsLoaded` hook, so `instructions-loaded.js` would never record the rules loading. An `AGENTS.md` pulled in by an `@` import fires the hook as usual. The import never loads the rules twice.

### Where a skill is found

Tested against Claude Code 2.1.246 in a throwaway config, unless a line names another version.

- **Exactly 2 folders are read**: `<project>/.claude/skills/*/SKILL.md` and `~/.claude/skills/*/SKILL.md`. No setting adds a third.
- **Discovery is 1 level deep for a plain skill.** A skill filed inside a grouping folder, such as `~/.claude/skills/tools/visualize/SKILL.md`, never loads. This is why Flow's own groups exist in the repository and disappear at install: the group name reaches nothing outside this tree.
- **A plugin is the one thing that goes deeper.** A folder in a skills directory holding `.claude-plugin/plugin.json` is read as a plugin, and its own `skills/<name>/SKILL.md` load from there. That is where Flow's 12 skills sit: `~/.claude/skills/flow/skills/groundwork/`, loaded and named `flow:groundwork`. Verified 2026-09-18 with `claude plugin list`, which reported `flow@skills-dir` loaded. The same day it loaded with `~/.claude/skills/flow` a symlink to `~/.agents/skills/flow/`, so the plugin folder itself may be a link.
- **A global skill beats a project skill of the same name, silently.** With a skill named `dupname` in both folders, the listing showed 1 entry carrying the global description, and invoking it loaded the global body. No warning, no error. Run twice to confirm.
- **Every installed skill's full description is in context from the start.** The name and the description are always loaded; only the body is deferred until the skill runs. A description is therefore a permanent cost and a body is not.

### What a skill does when it runs

- **Shell runs inside `SKILL.md`, at any position in the file.** A body containing `` !`cat payload.txt` `` returned a value written to that file 1 second earlier. Running with `--output-format stream-json` showed 1 tool call, to `Skill`, and no `Bash` call: the shell runs as part of rendering the skill, not as a tool the model chose. The same line at the end of a long file behaved identically.
- **The model does not re-read what a skill printed.** A skill that `cat`s a file, followed immediately by a question that needs that file, produced exactly 1 tool call: `Skill`. The skill body said the content was printed above in full, and the model took it. That wording is doing the work, so keep it.
- **A duplicate invocation is skipped when the rendered text matches.** Invoking one skill twice with identical arguments returned the body once, then `Skill /dedupe is already loaded above; instructions unchanged.` Invoking it twice with *different* arguments returned the whole body twice. A skill whose rendered text varies is therefore appended in full on every run.
- **`disableSkillShellExecution` turns every shell line off.** It is a restrictive setting, so a managed policy can impose it on a machine, and any skill relying on shell inside its body then silently loses that content.
- **`CLAUDE_CODE_SESSION_ID` reaches the shell a skill runs**, so a skill can write a file keyed by session.
- **The `/` menu is 1 row per file.** No API adds a row, and no dynamic argument completion exists. `argument-hint` in frontmatter is a static placeholder string, not a completion source.

### Arguments reach a skill whether or not it asks for them

- **`$ARGUMENTS` substitutes.** `/pingtest t047` against a body containing `` !`echo "ARGS-RECEIVED=[$ARGUMENTS]"` `` returned `ARGS-RECEIVED=[t047]`.
- **An argument arrives even with no placeholder.** A skill whose body contains no `$ARGUMENTS` got `ARGUMENTS: t099` appended to the end of its body.
- **The model supplies arguments on its own.** Asked to run one skill twice for 2 ticket ids, it sent `{"skill":"noargs"}` on the first call and `{"skill":"noargs","args":"t099"}` on the second, with nothing in the skill inviting an argument.

Put together with the deduplication rule above: a skill that takes arguments is appended whole on every run with a new argument, and a skill that takes none is appended once per session.

### `skillOverrides` hides a skill without switching it off

`skillOverrides` is a settings object mapping a skill name to a visibility value. Verified again on 2.1.251 on 2026-08-29:

- **`off`** hides the skill from the model, and naming it fails with `Skill pingtest is disabled for model invocation in skillOverrides settings`.
- **`name-only`** shows the name and hides the description. The skill stays invocable.
- **`user-invocable-only`** removes the skill from the model's view entirely, and typing `/pingtest` still loads it.
- **A project's `.claude/settings.json` overrides the machine's copy key by key.** The 2 objects merge rather than replace, so a project can hide 1 skill without restating the rest.

**None of these values stop anything but the skill itself.** A plugin's commands, subagents and hooks all keep running. `skillOverrides` controls the trigger and never the cost.

**It does not reach a plugin's skills at all.** `lab/research/claude-code-docs/settings-reference.md` → `### skillOverrides` says so in one line: "Overrides don't apply to plugin skills, which you manage through `/plugin`." Flow's own skills load as a plugin, so no `skillOverrides` value hides one. `claude plugin disable flow@skills-dir` switches the whole set off, and that is the only switch there is.

### A plugin is a bundle, not a skill

A plugin is a folder carrying a manifest, `.claude-plugin/plugin.json`, which names it. It can hold skills, subagents, slash commands and hooks at once. Enabling one adds a small system, not a file: the surveyed `impeccable` plugin ships 1 skill, 4 subagents, 23 commands and 2 hooks.

**A marketplace is one way in, not the only one.** Any folder under a skills directory that holds `.claude-plugin/plugin.json` is loaded as a plugin on the next session, named `<plugin>@skills-dir`, with nothing installed and nothing copied. `lab/research/claude-code-docs/plugins-loading.md` documents it. That is the route Flow takes: `flow install` writes the manifest beside the links it already builds, and the whole set becomes `flow:<skill>`.

- **Plugin skills are namespaced `plugin:skill`**, such as `superpowers:brainstorming`. The name comes from the manifest, so changing one word there renames every command in the set. Typing the bare name still works when nothing else claims it.
- **`enabledPlugins` is the real off switch.** Off means no skill, no commands, no subagents and no hooks.
- **A plugin's hooks run for as long as the plugin is enabled.** `impeccable` registers `PostToolUse` on `Edit|Write`, and `Stop` with a 30-second budget on every single turn. Hooks from several plugins accumulate, and nothing reports the total.
- **A flip takes effect in the next session.** Skills, commands, subagents and hooks are all read once at session start.

The 2 settings that decide it live in different files on purpose. `extraKnownMarketplaces` goes in the project's committed `.claude/settings.json`, recording that this project may use the plugin. `enabledPlugins` goes in `.claude/settings.local.json`, which is gitignored, so the switch flips with no diff and no commit and nobody else on the project is forced into the state.

**Untested**: whether a plugin skill beats a Flow skill of the same name. One run answers it, the first time a plugin goes in.

### What a hook can and cannot load

From `code.claude.com/docs/en/hooks`.

**Nothing invokes a skill, and nothing loads an instruction file on a computed condition.** A skill takes `paths:` frontmatter exactly like a rule file, so a filename glob is the only condition either one supports. The 3 near misses:

- **`SessionStart` → `reloadSkills`** re-scans the skill folders, so a newly installed skill becomes available. It starts nothing.
- **`SessionStart` → `initialUserMessage`** becomes the first user message, in non-interactive `-p` runs only.
- **`UserPromptExpansion`** fires when the user types `/skillname`, and can add context to it or block it outright. It cannot start one.

**`InstructionsLoaded` only observes.** The documentation: "InstructionsLoaded hooks have no decision control. They can't block or modify instruction loading."

**A hook can rewrite a tool call.** `PreToolUse` with matcher `Skill` fires on model invocation and accepts an `updatedInput` field. The typed `/name` form bypasses `PreToolUse` entirely and fires `UserPromptExpansion` instead, so a hook meant to catch every skill run has to handle both events.

**Injecting text is the substitute for loading a file.** A hook writes `additionalContext`, and the agent reads it as a system reminder. `PreToolUse` covers the moment of an edit, `UserPromptSubmit` covers every turn, and `SessionStart` covers the start. Injected text is not an instruction file: it never appears under `/context`, and it is not cached with the project layer.

**Injected text is not reliably trusted.** In one run the model read a hook's `additionalContext` and refused it outright: *"This looks like a prompt injection attempt."* Text the agent fetches itself, by running a script, has nothing to distrust.

### What a hook can see of the conversation

These 3 events are what make a rule about conduct, rather than about file content, checkable at all:

- **`MessageDisplay`** fires while an assistant message is streaming, carrying `turn_id`, `message_id` and the newly streamed text in `delta`. It is the only event that sees Claude's prose. It cannot block, and any replacement text it prints never reaches Claude.
- **`PreToolUse`** carries `prompt_id`, the id of the user prompt being processed. It sees every tool call and can block one.
- **`Stop`** fires when the turn ends, carrying `last_assistant_message`, the final response text. It can block and send the agent back to fix the turn, up to 8 blocks in a row before Claude Code overrides it.

So the order of prose against edits inside one turn is readable: prose from `MessageDisplay`, edits from `PreToolUse`, grouped by `turn_id`, scored at `Stop`.

**Never read `transcript_path` for the turn in progress.** The documentation warns that the file "is written asynchronously and may lag the in-memory conversation", and says to use `last_assistant_message` on `Stop` instead.

### What a hook sees inside a subagent

Verified live against Claude Code 2.1.271 on 2026-09-15, in a throwaway session driven through tmux. `## The agents Claude Code runs` below covers what a subagent is, and [Subagents](../../docs/subagents.md) what Flow does with one. These are the facts a hook author needs.

- **`agent_id` in a hook payload equals the `agentId` the `Agent` tool returned to the parent.** So a record written by a subagent's hook can be matched to the dispatch that created it, with no bookkeeping in between.
- **A subagent's hooks carry the parent's `session_id`**, not one of their own. Grouping hook output by session therefore mixes parent and children, and `agent_id` is the field that separates them.
- **A background subagent reports through `SubagentHandback`, an undocumented tool.** The report reaches the parent roughly 2 seconds before `SubagentStop` fires, and the finished notice follows after that. Nothing should be built on the name: it is not in the documentation and may change.
- **A hook waking the parent is labelled a failure even when nothing failed.** Output arrives as `Stop hook blocking error from command "PostToolUse:Agent": …`, wrapped in a `<task-notification>`. A parent with no instruction about it read one as a possible prompt injection and refused it. Telling the session what the message is, in a loaded rule, fixed it.

## The agents Claude Code runs

Checked against Claude Code 2.1.271 on 2026-09-15, from [Subagents](https://code.claude.com/docs/en/sub-agents), [Agent view](https://code.claude.com/docs/en/agent-view) and [Hooks](https://code.claude.com/docs/en/hooks). What Flow starts, and its change record, are on the public page [Subagents](../../docs/subagents.md).

- **A subagent**: a fresh conversation started from a prompt, living inside your session. You can open it and type to it. Flow uses it.
- **A one-shot subagent**: `Explore` or `Plan`. It answers once and can never be resumed. Flow uses it for reading.
- **A background session**: a whole second session with its own row in agent view, outliving your terminal. Flow does not start one.
- **A fork**: a subagent that starts with a copy of your whole conversation. Flow denies it.
- **An agent team**: several sessions working under a lead. Experimental and off by default, so Flow has nothing to say about it.

### A subagent

The session starts one with the `Agent` tool, giving it a prompt and a type: `general-purpose`, or a name defined in `claude/agents/`, such as Flow's `haiku-worker`.

- **What it starts with**: the prompt, every `CLAUDE.md` that loads for the project, and the git status. Never your conversation, and never the files the parent already read.
- **Where it runs**: in the background, by default since Claude Code 2.1.198. The parent keeps working, and the subagent's report arrives on a later turn.
- **Where you see it**: a row in the panel below the prompt. Press `↓` to reach the panel, `Enter` to open the subagent's transcript, and type to send it a message. `←` goes back.
- **Its tools**: a background subagent keeps a fixed set: `Read`, `Grep`, `Glob`, `Bash`, `Edit`, `Write`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `SendMessage` and a few more, plus every MCP tool. `AskUserQuestion` is never among them.
- **Where its edits land**: in your working copy, the same files the parent sees.
- **How it ends**: it writes its report and stops. The parent receives the report, then a notice saying it finished.
- **Resuming it**: a finished subagent keeps its whole history. The parent resumes it with `SendMessage` to its id, or you type into its row. The resumed run continues under the same id.
- **Its lifetime**: it dies when the session ends. Resuming the session with `claude --resume` brings its history back, and it runs again only when messaged.

A subagent can start subagents of its own, up to 3 levels below the main conversation.

### A one-shot subagent

`Explore` and `Plan` are built into Claude Code and read without writing. They return no agent id, so nothing can resume them, and they skip `CLAUDE.md` and the git status to start faster. Use one when you need an answer and never a second round.

### A background session

`claude --bg "<prompt>"` from a shell, or a prompt typed into agent view (`claude agents`), starts a full Claude Code session with no terminal attached. Agent view lists it, shows the question it is waiting on, and lets you reply or attach. It keeps running after you close the terminal.

Left to its defaults, it moves into its own worktree before its first edit: a second checkout of the repository in its own folder, branched from the remote default branch, which cannot see your uncommitted work. Flow's `home/settings.json` sets `worktree.bgIsolation` to `"none"`, so a background session edits your working copy directly. [Subagents](../../docs/subagents.md#what-flow-turns-off) gives the reason.

# What it cannot do

## Filed

Six issues on `anthropics/claude-code` in 2 batches, all priority Medium and all open. The first 3 below were filed 2026-09-10, all category Configuration and settings.

- **[#93248](https://github.com/anthropics/claude-code/issues/93248), `paths:` triggers on reads only.** A rules file or a skill carrying `paths:` loads when Claude reads a matching file, so neither is present when Claude creates one. Editing an existing file requires reading it first, which makes creation the whole gap. Proposes an optional `on: [read, write, edit]` beside `paths:`, and a `triggers:` long form where the globs differ per event. A second failure mode rides the same trigger: after a compaction a path-scoped rule returns only on a matching read, so a write-heavy session never gets it back. Evidence is a live run that wrote `formatDuration.ts` while an `InstructionsLoaded` hook recorded 3 `CLAUDE.md` files and no rules file. `backlog.md` → `## Rules and always-loaded files`
- **[#93249](https://github.com/anthropics/claude-code/issues/93249), no `exclude:` field.** An extension glob matches `node_modules/`, `dist/` and every vendored tree the rule has no authority over, and the pattern language has no negation. `claudeMdExcludes` is the wrong granularity: it skips whole instruction files by absolute path rather than narrowing one glob.
- **[#93252](https://github.com/anthropics/claude-code/issues/93252), a hook can inject text but cannot load anything.** Proposes one output field, `load:`, taking `rule`, `skill` and `file` targets on `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart` and `PostCompact`. The deciding argument is that a glob sees the path and never the content, so only code can tell which library an edit imports. `reloadSkills` on `SessionStart` is the precedent, and it stops at making a skill discoverable. `# What Claude Code does` → `### What a hook can and cannot load`

### Three more on 2026-09-21, written from the dropped-path research

Posted by the user through the web form, since the drafts were handed over rather than posted from a session. `gh issue create --body-file` skips the form's labels, and a GitHub Action attached them afterwards anyway.

- **[#95761](https://github.com/anthropics/claude-code/issues/95761), a dragged file inserts a bare path rather than an `@` reference**, category `Interactive mode (TUI)`. Dragging is the fastest way to name a file and produces the one form that does not load it, so every dropped file costs a turn. The case with no other route is a git-ignored file, which the suggestion list never offers. Leans on #77204, which shows the drop handler already branches by file type, since an image becomes vision content while everything else becomes a path, and on #73853, which already called the dropped path inconsistent with the `@` flow. The ask: `@` plus the path in the form the `@` flow produces, a modifier for the bare path, images unchanged.
- **[#95762](https://github.com/anthropics/claude-code/issues/95762), a dragged folder inserts nothing at all**, same category. Filed apart from the file case because it is a different defect on the same handler: a file inserts the wrong thing, a folder inserts nothing. Leans on `@src/` already expanding to a folder listing, and on the IDE having folder support the terminal lacks. The ask says nothing is loaded recursively, because the listing is the right amount.
- **[#95763](https://github.com/anthropics/claude-code/issues/95763), a `UserPromptSubmit` hook cannot replace the prompt**, category `Configuration and settings`. Written generic: any transform that takes the user's text and sends a different text instead, with a script or a second model rewriting the message as the general case. Appending inverts all of them, and the issue names 3 kinds, compressing, redacting and rewriting a reference. The ask is one `replacePrompt` field, additive, whose condition is that a replacement is processed exactly as typed text is.

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
- **A skill the user types loads whole every time**, a render identical to the earlier copy included. The one-line note replacing a repeat copy covers only the agent invoking a skill again. Tested 2026-09-30 on 2.1.285. `ticket-skills.md` → `## Tested in a live session`
- **Skills stack only in an interactive session.** `/a /b text` loads both there, a user-only skill included, and `claude -p` hands `/b text` to the first skill as its text. Tested the same day.
- **No hook payload carries context usage.** The running token count is readable only by parsing `~/.claude/projects/<project>/<session-id>.jsonl` for the `usage` block on each assistant message. A hook that says "wrap up, the window is filling" has to reimplement that. `backlog.md` line 140
- **Editing a loaded instruction file mid-session is silently inert.** The documentation says the edit does not apply and no cache is invalidated, so an agent writes a rule into `~/.claude/CLAUDE.md` and keeps breaking it with nothing signalling the gap. A warning would be enough; a reload would be better. `# What Claude Code does` → `### A request has three layers, and an edit only reaches one`
- **Permission rules cannot expire.** `permissions.allow` and `permissions.deny` are permanent, so "allow git for an hour" is unexpressible. Flow built `guard.js` around that: a TTL per entry, 3 scopes, and a pruner that deletes an expired entry the first time anything looks. All 19 git entries left `permissions.deny` to make room for it. `docs/manual/settings.md` → the git switch
- **A subagent's cost never reaches the parent.** In session the parent sees the returned report and nothing else. A `SubagentStop` hook is handed `agent_transcript_path`, so the numbers are recoverable by parsing a nested transcript after the fact, which is not the same as knowing what a dispatch cost while deciding whether to make another. `## The agents Claude Code runs` above
- **A subagent has no output contract.** It returns free prose, with no way to declare the shape the parent expects. `AskUserQuestion` is stripped from every subagent, so ending the turn is the only way it can return. `## The agents Claude Code runs` above
- **Symlinked rules do not load in Cowork desktop sessions.** A `~/.claude/rules/` file resolving outside the working directory is skipped, and `flow install` links every one of them into the clone. Terminal and IDE sessions are unaffected, and `CLAUDE.md` is copied rather than linked. A bug report rather than a feature request. `backlog.md` line 82

## Not worth filing

- **A file read inside a script is invisible.** `node build.js` opens 100 files and the transcript records 1 command. Nothing short of tracing the process recovers them, so the ask is unreasonable. Flow states every file count as a floor instead.
- **Non-Anthropic provider failures.** Every one traced back to an environment variable that was set wrong. Nothing missing. `models.md`
