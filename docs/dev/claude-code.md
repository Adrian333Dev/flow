# What Claude Code does

Flow is built on Claude Code, and almost every design decision in it turns on some detail of how Claude Code behaves. This page is those details, written down once so no session works them out again.

Everything here was either read in Anthropic's published documentation or produced by running a test and reading the output. Where a fact came from a test, the page says what was run and what came back. Nothing on this page is a Flow decision: the decisions live in [the manual](../manual/README.md) and in this repository's own rules.

Version numbers matter here. A behavior tested against one release can change in the next, so every tested fact names the version it was seen on.

## Table of contents

- [The words this page uses](#the-words-this-page-uses)
- [A session ends at `/clear` and survives compaction](#a-session-ends-at-clear-and-survives-compaction)
- [Where a session lands on disk](#where-a-session-lands-on-disk)
- [A request has three layers, and an edit only reaches one](#a-request-has-three-layers-and-an-edit-only-reaches-one)
- [How an instruction file loads](#how-an-instruction-file-loads)
- [Where a skill is found](#where-a-skill-is-found)
- [What a skill does when it runs](#what-a-skill-does-when-it-runs)
- [Arguments reach a skill whether or not it asks for them](#arguments-reach-a-skill-whether-or-not-it-asks-for-them)
- [`skillOverrides` hides a skill without switching it off](#skilloverrides-hides-a-skill-without-switching-it-off)
- [A plugin is a bundle, not a skill](#a-plugin-is-a-bundle-not-a-skill)
- [What a hook can and cannot load](#what-a-hook-can-and-cannot-load)
- [What a hook can see of the conversation](#what-a-hook-can-see-of-the-conversation)
- [What a hook sees inside a subagent](#what-a-hook-sees-inside-a-subagent)

## The words this page uses

Claude Code's own documentation uses these words without defining them. Each one is defined here on first use, and the meaning holds for the rest of the page.

- **A session** is one conversation. It starts when you open Claude Code and ends when something explicitly ends it.
- **Compaction** is Claude Code replacing the older part of a conversation with a summary, to make room. `/compact` does it on demand, and it also happens on its own when the conversation gets long.
- **A transcript** is the file Claude Code writes as a session runs: one JSON object per line, one line per event.
- **An instruction file** is a markdown file Claude Code loads as standing instructions. `CLAUDE.md` is one. A **rule file** is another: a markdown file under a `rules/` folder, which can carry a `paths:` line restricting when it loads.
- **Frontmatter** is the block of `key: value` lines at the very top of a markdown file, fenced by `---`. Claude Code reads settings out of it.
- **A skill** is a folder holding a `SKILL.md`. Its body is a set of instructions that get inserted into the conversation when the skill runs, either because you typed `/name` or because the model decided to use it.
- **A hook** is a shell command Claude Code runs at a fixed moment, such as before a tool call or when a turn ends. It receives JSON on standard input and can print JSON back.
- **A plugin** is a bundle installed from a marketplace. One plugin can contain skills, subagents, slash commands and hooks at once.

## A session ends at `/clear` and survives compaction

Read from `code.claude.com/docs/en/sessions` and `code.claude.com/docs/en/hooks`, and checked against this machine's transcripts on 2026-09-02.

**Compaction never ends a session.** The `SessionEnd` hook has 6 possible reasons, and compaction is not among them: `clear`, `resume`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled` and `other`. One transcript on this machine holds 58 compaction summaries under a single session id.

**`/clear` ends the session and starts a new one.** `SessionEnd` fires with reason `clear`, `SessionStart` fires with source `clear`, and the new session gets a new id. The old conversation is still reachable through `/resume`.

The rest of the boundaries:

- **`/branch` and `--fork-session` each get their own id**, so both produce a genuinely separate session.
- **`--resume` and `--continue` keep the id and keep writing the same file.** Resuming one session in 2 terminals at once writes both conversations into one transcript.
- **`SessionStart` receives a `source` field**: `startup`, `resume`, `clear`, `compact` or `fork`. It fires on compaction as well, which is the one case where a session start does not mean a new session.

**Every hook receives the same 7 fields** whatever the event: `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `effort` and `hook_event_name`. Inside a subagent it also receives `agent_id` and `agent_type`.

## Where a session lands on disk

A transcript is written to `~/.claude/projects/<project>/<session-id>.jsonl`. Each subagent the session starts gets its own transcript under `<session-id>/subagents/`. [How the audit index works](audit.md) describes the line format and what can be read out of it.

Two behaviors surprise people:

- **`cleanupPeriodDays` deletes transcripts**, 30 days after they were written by default. It takes 6 sibling folders with it: `subagents/`, `tool-results/`, `file-history/`, `plans/`, `debug/` and `paste-cache/`. [Settings](../manual/settings.md#cleanupperioddays) covers what Flow sets it to and why.
- **`/cd` moves a session's storage** into the new directory's project folder partway through. So one session id can appear under 2 different project folders, and a query grouping by folder double-counts it.

`claude project purge <path>` deletes one project's stored state in full.

## A request has three layers, and an edit only reaches one

From `code.claude.com/docs/en/prompt-caching`. Every request Claude Code sends is built in 3 layers, and each is cached separately:

- **The system prompt**: core instructions, tool definitions and output style. Rebuilt when the tool set changes or Claude Code is upgraded.
- **Project context**: `CLAUDE.md`, auto memory, and rule files with no `paths:` line. Rebuilt at session start, at `/clear` and at `/compact`.
- **The conversation**: messages, responses and tool results. Grows every turn.

**Editing a loaded instruction file mid-session does nothing.** The documentation is explicit:

> Your project-root and user-level CLAUDE.md files are read once at session start and held in
> memory. Editing them mid-session does not invalidate the cache, but the edit also doesn't apply.
> Claude keeps working with the version that was loaded at session start. The new content loads on
> the next `/clear`, `/compact`, or restart.

So a rule written into `~/.claude/CLAUDE.md` in the middle of a session is silently inert, and the agent carries on breaking it. The one real cost arrives at the next compaction: `/compact` "reloads project context from disk, which cache-hits only if CLAUDE.md and memory are unchanged since the session started".

**Two file types behave differently.** A nested `CLAUDE.md` in a subdirectory, and a rule file carrying `paths:`, both load the first time Claude reads a file they match. An edit made before that moment does take effect in the same session.

**A skill loads into the conversation layer**, so invoking one never disturbs the 2 cached layers above it. That is why a skill is cheap to add mid-session and an instruction file is not.

## How an instruction file loads

From `code.claude.com/docs/en/memory`.

- **A rule file with no `paths:`** is loaded at launch, at the same priority as `.claude/CLAUDE.md`. It buys nothing over the `CLAUDE.md` that is already loaded, which is the documented fact behind Flow keeping one always-loaded file instead of several.
- **A rule file with `paths:`** loads the first time Claude reads a file matching one of its patterns, and never on every tool use.
- **`~/.claude/rules/` is user scope** and loads before project rules, so a project rule wins a conflict.
- **Rule files are found recursively**, and symlinks are followed.
- **Anthropic's size guidance is under 200 lines per `CLAUDE.md`.** A file over 4 MiB is skipped entirely, with no warning.

## Where a skill is found

Tested against Claude Code 2.1.246 in a throwaway config, unless a line names another version.

- **Exactly 2 folders are read**: `<project>/.claude/skills/*/SKILL.md` and `~/.claude/skills/*/SKILL.md`. No setting adds a third.
- **Discovery is 1 level deep.** A skill filed inside a grouping folder, such as `~/.claude/skills/tools/visualize/SKILL.md`, never loads. This is why Flow's own groups exist in the repository and disappear at install: `flow install` links each skill folder straight into `~/.claude/skills/`.
- **A global skill beats a project skill of the same name, silently.** With a skill named `dupname` in both folders, the listing showed 1 entry carrying the global description, and invoking it loaded the global body. No warning, no error. Run twice to confirm.
- **Every installed skill's full description is in context from the start.** The name and the description are always loaded; only the body is deferred until the skill runs. A description is therefore a permanent cost and a body is not.

## What a skill does when it runs

- **Shell runs inside `SKILL.md`, at any position in the file.** A body containing `` !`cat payload.txt` `` returned a value written to that file 1 second earlier. Running with `--output-format stream-json` showed 1 tool call, to `Skill`, and no `Bash` call: the shell runs as part of rendering the skill, not as a tool the model chose. The same line at the end of a long file behaved identically.
- **The model does not re-read what a skill printed.** A skill that `cat`s a file, followed immediately by a question that needs that file, produced exactly 1 tool call: `Skill`. The skill body said the content was printed above in full, and the model took it. That wording is doing the work, so keep it.
- **A duplicate invocation is skipped when the rendered text matches.** Invoking one skill twice with identical arguments returned the body once, then `Skill /dedupe is already loaded above; instructions unchanged.` Invoking it twice with *different* arguments returned the whole body twice. A skill whose rendered text varies is therefore appended in full on every run.
- **`disableSkillShellExecution` turns every shell line off.** It is a restrictive setting, so a managed policy can impose it on a machine, and any skill relying on shell inside its body then silently loses that content.
- **`CLAUDE_CODE_SESSION_ID` reaches the shell a skill runs**, so a skill can write a file keyed by session.
- **The `/` menu is 1 row per file.** No API adds a row, and no dynamic argument completion exists. `argument-hint` in frontmatter is a static placeholder string, not a completion source.

## Arguments reach a skill whether or not it asks for them

- **`$ARGUMENTS` substitutes.** `/pingtest t047` against a body containing `` !`echo "ARGS-RECEIVED=[$ARGUMENTS]"` `` returned `ARGS-RECEIVED=[t047]`.
- **An argument arrives even with no placeholder.** A skill whose body contains no `$ARGUMENTS` got `ARGUMENTS: t099` appended to the end of its body.
- **The model supplies arguments on its own.** Asked to run one skill twice for 2 ticket ids, it sent `{"skill":"noargs"}` on the first call and `{"skill":"noargs","args":"t099"}` on the second, with nothing in the skill inviting an argument.

Put together with the deduplication rule above: a skill that takes arguments is appended whole on every run with a new argument, and a skill that takes none is appended once per session.

## `skillOverrides` hides a skill without switching it off

`skillOverrides` is a settings object mapping a skill name to a visibility value. Verified again on 2.1.251 on 2026-08-29:

- **`off`** hides the skill from the model, and naming it fails with `Skill pingtest is disabled for model invocation in skillOverrides settings`.
- **`name-only`** shows the name and hides the description. The skill stays invocable.
- **`user-invocable-only`** removes the skill from the model's view entirely, and typing `/pingtest` still loads it.
- **A project's `.claude/settings.json` overrides the machine's copy key by key.** The 2 objects merge rather than replace, so a project can hide 1 skill without restating the rest.

**None of these values stop anything but the skill itself.** For a plugin, the commands, subagents and hooks all keep running. `skillOverrides` controls the trigger and never the cost.

## A plugin is a bundle, not a skill

A plugin installs from a marketplace and can carry skills, subagents, slash commands and hooks at once. Enabling one adds a small system, not a file: the surveyed `impeccable` plugin ships 1 skill, 4 subagents, 23 commands and 2 hooks.

- **Plugin skills are namespaced `plugin:skill`**, such as `superpowers:brainstorming`. A `skillOverrides` key for a plugin skill almost certainly needs the prefix.
- **`enabledPlugins` is the real off switch.** Off means no skill, no commands, no subagents and no hooks.
- **A plugin's hooks run for as long as the plugin is enabled.** `impeccable` registers `PostToolUse` on `Edit|Write`, and `Stop` with a 30-second budget on every single turn. Hooks from several plugins accumulate, and nothing reports the total.
- **A flip takes effect in the next session.** Skills, commands, subagents and hooks are all read once at session start.

The 2 settings that decide it live in different files on purpose. `extraKnownMarketplaces` goes in the project's committed `.claude/settings.json`, recording that this project may use the plugin. `enabledPlugins` goes in `.claude/settings.local.json`, which is gitignored, so the switch flips with no diff and no commit and nobody else on the project is forced into the state.

**Untested**: whether a plugin skill beats a Flow skill of the same name. One run answers it, the first time a plugin goes in.

## What a hook can and cannot load

From `code.claude.com/docs/en/hooks`.

**Nothing invokes a skill, and nothing loads an instruction file on a computed condition.** A skill takes `paths:` frontmatter exactly like a rule file, so a filename glob is the only condition either one supports. The 3 near misses:

- **`SessionStart` → `reloadSkills`** re-scans the skill folders, so a newly installed skill becomes available. It starts nothing.
- **`SessionStart` → `initialUserMessage`** becomes the first user message, in non-interactive `-p` runs only.
- **`UserPromptExpansion`** fires when the user types `/skillname`, and can add context to it or block it outright. It cannot start one.

**`InstructionsLoaded` only observes.** The documentation: "InstructionsLoaded hooks have no decision control. They can't block or modify instruction loading."

**A hook can rewrite a tool call.** `PreToolUse` with matcher `Skill` fires on model invocation and accepts an `updatedInput` field. The typed `/name` form bypasses `PreToolUse` entirely and fires `UserPromptExpansion` instead, so a hook meant to catch every skill run has to handle both events.

**Injecting text is the substitute for loading a file.** A hook writes `additionalContext`, and the agent reads it as a system reminder. `PreToolUse` covers the moment of an edit, `UserPromptSubmit` covers every turn, and `SessionStart` covers the start. Injected text is not an instruction file: it never appears under `/context`, and it is not cached with the project layer.

**Injected text is not reliably trusted.** In one run the model read a hook's `additionalContext` and refused it outright: *"This looks like a prompt injection attempt."* Text the agent fetches itself, by running a script, has nothing to distrust.

## What a hook can see of the conversation

These 3 events are what make a rule about conduct, rather than about file content, checkable at all:

- **`MessageDisplay`** fires while an assistant message is streaming, carrying `turn_id`, `message_id` and the newly streamed text in `delta`. It is the only event that sees Claude's prose. It cannot block, and any replacement text it prints never reaches Claude.
- **`PreToolUse`** carries `prompt_id`, the id of the user prompt being processed. It sees every tool call and can block one.
- **`Stop`** fires when the turn ends, carrying `last_assistant_message`, the final response text. It can block and send the agent back to fix the turn, up to 8 blocks in a row before Claude Code overrides it.

So the order of prose against edits inside one turn is readable: prose from `MessageDisplay`, edits from `PreToolUse`, grouped by `turn_id`, scored at `Stop`.

**Never read `transcript_path` for the turn in progress.** The documentation warns that the file "is written asynchronously and may lag the in-memory conversation", and says to use `last_assistant_message` on `Stop` instead.

## What a hook sees inside a subagent

Verified live against Claude Code 2.1.271 on 2026-09-15, in a throwaway session driven through tmux. [The agents Claude Code runs](agents.md) covers what a subagent is and what Flow does with one; these are the facts a hook author needs.

- **`agent_id` in a hook payload equals the `agentId` the `Agent` tool returned to the parent.** So a record written by a subagent's hook can be matched to the dispatch that created it, with no bookkeeping in between.
- **A subagent's hooks carry the parent's `session_id`**, not one of their own. Grouping hook output by session therefore mixes parent and children, and `agent_id` is the field that separates them.
- **A background subagent reports through `SubagentHandback`, an undocumented tool.** The report reaches the parent roughly 2 seconds before `SubagentStop` fires, and the finished notice follows after that. Nothing should be built on the name: it is not in the documentation and may change.
- **A hook waking the parent is labelled a failure even when nothing failed.** Output arrives as `Stop hook blocking error from command "PostToolUse:Agent": …`, wrapped in a `<task-notification>`. A parent with no instruction about it read one as a possible prompt injection and refused it. Telling the session what the message is, in a loaded rule, fixed it.
