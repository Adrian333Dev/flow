# `settings.json` — what every key is for

Reference for `home/settings.json`, which merges into `~/.claude/settings.json`. Merged rather than copied: your global settings also hold personal things — model, effort level, plugins, statusline — that Flow shouldn't own.

`settings.json` is strict JSON. No comments, which is why this file exists.

Settings load at startup. **Restart Claude Code after any change.**

---

## `hooks`

```json
"hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
  { "type": "command", "command": "node \"$HOME/.flow/scripts/guard.js\"" } ] } ] }
```

Runs `scripts/guard.js` before every Bash call. The script reads the pending command on stdin and returns `deny`, `ask`, or nothing.

Node, not Python. The hook inherits Claude Code's `PATH`, so a Node installed under nvm has to be on it — but `flow` and `util` are Node too, so that is already a hard requirement of the toolchain and this adds nothing new. What it removes is a third language in a five-file folder.

**The guard and the blanket `Bash` allow below are one unit. Never install one without the other.** Blanket allow with no guard leaves nothing deciding a shell command — the deny list holds no `Bash` entries at all, because a static list cannot name the open set of what a shell command can be.

### The snapshot pair

```json
"PreToolUse":  [ { "matcher": "Agent", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/snapshot.js\" --before" } ] } ],
"PostToolUse": [ { "matcher": "Agent", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/snapshot.js\" --after" } ] } ]
```

**⚠️ Never run, on this machine or any other.** Written 2026-08-14 against the hooks reference, installed nowhere. One live dispatch confirms it or does not.

Records the working tree before a subagent runs and again after, then hands the parent a diff of the two. That diff is the only honest account of what a subagent touched: its own report can leave things out, and a plain `git diff` cannot separate its work from a tree that has been dirty for weeks.

`Agent` is the tool that spawns a subagent, so both hooks match on it. They pair by `tool_use_id`, which both events carry, so two overlapping dispatches never read each other's stored snapshot. That is bookkeeping, not isolation: the diffs still overlap.

**Fires for every subagent, not only the ones that build.** A research agent that was supposed to read and quietly wrote something is worth catching, and a dispatch that changed nothing prints nothing.

Two consequences worth knowing:

- **The diff covers the window, not the worker.** Everything that changed between the two events lands in it, whoever changed it, so one subagent at a time and a parent that touches nothing meanwhile. `/execute` carries that as an instruction; this is where it comes from.
- **`git add` has to stay reachable.** The snapshot stages into a throwaway index, which touches no real git state. It runs as a hook rather than through the Bash tool, so `guard.js` never sees it and the git mode never applies to it.

### Why worktree isolation is off

`EnterWorktree` and `Agent(isolation:worktree)` both move work into a second directory. The snapshot compares one directory against itself, and `snapshot.js` gives up when the directory moves between its two events — so worktree isolation turns the diff off and says nothing.

**A hold, not a verdict.** Separate directories are the obvious road to running several subagents at once, which the one-at-a-time rule above rules out today. Lift this once the snapshot handles a per-subagent working directory.

`Agent(isolation:worktree)` is a scoped rule rather than a bare name, so the Agent tool stays available and only that one parameter value is blocked.

**`worktree.bgIsolation` closes the same door from the other side.** Its default, `"worktree"`, blocks `Edit` and `Write` in the main checkout until `EnterWorktree` runs — and `EnterWorktree` is denied above, so a background session would read files and run commands and never write a fix. `"none"` lets it edit the working copy directly. The `debug` agent runs as one of those sessions, and isolation is wrong for debugging anyway: the bug often lives in uncommitted state that a fresh worktree does not carry.

---

## `permissions`

Rules evaluate **deny → ask → allow**, first match wins. A broad deny beats a narrower allow. Deny rules hold in every permission mode.

### `allow`

| Entry | Covers |
|---|---|
| `Bash` | every shell command |
| `Edit` | every file-editing tool, including Write |
| `WebFetch` | every domain |
| `WebSearch` | every search |
| `mcp__context7__*` | every tool from the context7 MCP server |

A tool name written **without parentheses matches every use of that tool**.

Why blanket rather than a curated list: approving a command through the permission dialog saves the *exact string* that ran, so `util fs tree --depth 3` and `util fs tree --depth 4` become two rules. A hand-kept list of command patterns never converges and goes stale the moment a path moves. The deny list plus the guard define the boundary instead.

Not on the list, so still prompts: reads outside the working directory, and writes into protected paths — `.git`, `.claude`, `.vscode`, `.idea`, `.husky` and friends, which allow rules cannot pre-approve by design.

**Spawning a subagent never prompts, so `Agent` needs no entry.** Claude Code checks a subagent's own tool calls against these same rules while it works, and that is what governs a worker.

### `deny` — Claude Code surfaces Flow doesn't use

These are **bare tool names**, which removes each tool from the model's context entirely rather than blocking it at call time. That also drops its schema from every request: `DesignSync` alone measured ~2,200 tokens.

| Entry | Why |
|---|---|
| `EnterPlanMode`, `ExitPlanMode` | Flow owns planning: `/groundwork` → tickets → the ticket's `plan.md`. Built-in plan mode also blocks the file writes those phases depend on. |
| `AskUserQuestion` | Presents a canned multiple-choice list. Flow's rule is the inverse — the agent commits to a recommendation and the user reacts. |
| `SendMessage`, `ListAgents` | Agent-to-agent messaging, and the tool that finds agents to message. `/execute` dispatches subagents with self-contained assignments; there is no back-channel to keep open. |
| `PushNotification`, `ScheduleWakeup`, `RemoteTrigger`, `ReportFindings` | Out-of-band and unattended operation. One author, one terminal, every session watched. |
| `SendUserFile`, `ShareOnboardingGuide` | Send a file off the machine, to a device or behind a public link. Same reason, plus the work is not the agent's to publish. |
| `CronCreate`, `CronDelete`, `CronList` | Scheduled background jobs. Same reason. |
| `NotebookEdit` | Jupyter notebooks. Not in any workflow here. |
| `DesignSync` | Design-tool sync. Unused — and absent from the published tool reference, so it was found by logging a real request rather than by reading the docs. |

### `deny` — no git entries, and why

**No `Bash(git …)` rule appears in this file, and adding one would break the switch.** `guard.js` decides every git command instead.

A deny rule is read once at session start, and it only ever adds. Nothing in a project, a flag or a settings file can lift a user-level entry, so a rule written here is permanent and no switch can reach past it. `guard.js` runs before every shell command and re-reads its state each time, which is what lets the mode change mid-session.

`flow git` writes that state, into `~/.flow/settings.json`:

```
flow git                    what the mode is, and when it runs out
flow git allow [--for 2h]   the agent may write with git
flow git ask                the same, confirming every one
flow git off                back to reads only
```

The scope is the session you type it in, unless `--project` or `--global` widens it. It lasts an hour unless `--for` says otherwise. Past that, the guard deletes the entry the first time it looks — so a switch left on turns itself off.

`--project` writes `.flow/settings.json` inside the repository, and the project template ignores that path. An unlock is this machine's state with a clock on it: committed, it would be one commit saying git writes are on and another an hour later saying they are off.

Three things hold whatever the mode says:

- **Reads always run.** `status`, `log`, `diff`, `show` and 22 more, by allowlist. Anything outside it is a write
- **Destructive commands always ask.** A force push, `reset --hard`, `clean`, `rebase`, `filter-branch`, `branch -D`, a tag or ref delete, `reflog delete`, `gc --prune`, `worktree remove --force`. They ask rather than deny, so you can still say yes — they just never run silently
- **The agent cannot turn it on.** `flow git allow` is refused when the agent runs it. Type it yourself as `! flow git allow`, which reaches no tool call and so reaches no guard

`guard.js` is the only thing between the agent and git now, so an error it cannot recover from denies a git command rather than falling through.

### Modes

Six of them, cycled with Shift+Tab and overridable for one session with `--permission-mode <name>`. A mode only decides what happens to a call no rule above matched.

**Stay on `default`**, labelled Manual. There is no `defaultMode` key here because `default` is already the default, and the allow list covers everything routine — so the prompts left over are the ones worth seeing.

**`dontAsk` is the unattended mode.** It auto-denies whatever the allow list does not cover and never interrupts, so a long run finishes and every denial shows up in the transcript. Reach for it with Shift+Tab, never by setting it here.

**`acceptEdits` buys almost nothing.** With `Bash` and `Edit` blanket-allowed above, it is not the looser mode it looks like.

**`bypassPermissions` is locked out**, by `permissions.disableBypassPermissionsMode: "disable"`. Its one addition over `acceptEdits` is silent writes into `.claude` and `.git`, and Flow's entire content *is* `.claude`. The same key disables the `--dangerously-skip-permissions` flag that `guard.js` already denies as a Bash command, and makes Claude Code ignore `permissionMode: bypassPermissions` in any agent definition.

**`auto` was rejected, not locked out.** It routes every shell command and network call through a classifier model carrying a slice of the transcript — a per-command token cost on a workflow that is mostly shell. Rejecting it needs no key: its cost is tokens rather than damage, and nothing reaches it by accident the way `--dangerously-skip-permissions` reaches bypass.

---

## `skillOverrides`

**What a session is shown of each skill.** A description sits in context from the moment a session starts, whether the skill is ever invoked or not, so every installed skill costs something in every session. This key is where that cost is decided, per skill, per machine and per project.

Installing and being shown are separate questions. Every skill outside `drafts/` installs on every machine, and a skill set to `off` costs nothing — so nothing is gained by leaving one uninstalled.

### The default belongs to the group

- **`phases/`, `session/`, `knowledge/`, `tools/`, `dev/` → on.** Reached in ordinary work, in any project
- **`stack/` → off**, turned on by the projects that touch that stack. Ten stack skills would otherwise be ten descriptions in every session, forever, and the one project doing browser work is the only one that needs the browser skill

Reversed 2026-08-30. Every skill was on by default until then, on the argument that one author wants everything reachable everywhere — which stays true, and is why `off` never stops a skill from installing.

### Two values, keyed by skill name

- **`on`** — the name and the description. What a skill gets when it is named nowhere
- **`off`** — the model is shown nothing, and `/name` refuses with *disabled via skillOverrides*

**Claude Code accepts two more and Flow uses neither.** `name-only` shows the name and hides the description, so the model keeps the power to fire a skill and loses the only thing it could judge with. `user-invocable-only` hides it from the model and leaves `/name` working, which was proposed for `stack/` on 2026-08-30 and rejected: a stack skill exists to fire during a phase, so a state the model cannot see makes it unfirable. All four verified 2026-08-29.

### This file ships the off list, and a project overrides it

`home/settings.json` names what is off on the machine. A project turns one back on in its own `.claude/settings.json`.

**The two files merge key by key rather than replacing.** Verified 2026-08-29 against Claude Code 2.1.251: a project setting `on` restored a skill this file had set to `off`, a project setting `off` hid one this file never named, and an entry only this file carried survived untouched. An edit takes effect on the next session. A `.claude/settings.json` that never existed before did not apply until its second run, which is the workspace trust flow rather than this key.

**Nothing announces a skill that is off, and nothing should.** The announcement would load in every session, including every project that turned the skill off — the exact cost this key exists to remove. `flow skills ls` is the discovery path: it prints every skill on the machine with its state and which file set it.

**This is not `disable-model-invocation`.** That one is a line in the skill file, and there is one copy of every skill on the machine, so it says *never fire anywhere* and cannot say anything narrower. `/start`, `/cut-from-spec` and `/file-findings` carry it because *never* is true of them. Everything else is decided here.

---

## `cleanupPeriodDays`

```json
"cleanupPeriodDays": 365
```

Claude Code deletes session data older than this at startup, and the default is 30 days. What it takes is the whole record of how a session ran: `~/.claude/projects/<project>/<session>.jsonl`, the `subagents/` transcripts beneath it, the `tool-results/` spill, plus `file-history/`, `plans/`, `debug/` and `paste-cache/`.

**Flow raises it because the transcript is evidence.** A study case exists to preserve an artifact that would be gone tomorrow, and the transcript is where that artifact actually lives. At 30 days, a rule written last month can no longer be traced back to the session that caused it.

365 rather than a decade, because the sweep is the only thing bounding this folder. A month of real work runs to roughly 300 MB, so a year costs a few gigabytes and ten years costs tens. Raise it once something prunes deliberately.

The minimum is 1, and `0` fails validation. A settings file that cannot be parsed pauses the sweep entirely, and `/status` carries the warning until it is fixed.

---

## Feature flags

| Key | Value | Effect |
|---|---|---|
| `disableBundledSkills` | `true` | Anthropic's bundled skills stay out, so only Flow's skills load. |
| `disableWorkflows` | `true` | Built-in workflows off — Flow's skills are the workflow. |
| `disableRemoteControl` | `true` | No driving the session from claude.ai or mobile. |
| `disableClaudeAiConnectors` | `true` | No claude.ai connectors. |
| `disableArtifact` | `true` | No artifact tool. `/visualize` renders inline. |
| `autoMemoryEnabled` | `false` | Auto memory is retired. It is per-repository and machine-local, so it cannot hold anything durable. Everything worth keeping goes in the repo — `CLAUDE.md`, `docs/`, or a skill. |
| `respondToBashCommands` | `false` | A command you type behind `!` in the input box puts its output in context and stops there, instead of spending a turn reacting to it. `! flow git allow` and `! ls` should cost nothing. When you want a reaction, the next message asks for one — and it carries your instructions, which an automatic reply cannot. |

---

## Deliberately absent

**The built-in task tools** — `TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate` — stay allowed rather than joining the deny list. They look like a tracker competing with `flow` and are not: `flow` records work that outlives the session, these are a scratch checklist for the turn in front of you. Denying them costs the checklist and saves nothing.

**`sandbox`.** Claude Code's bubblewrap jail was considered and rejected. It is a genuine OS-level boundary at zero token cost, and it remains the right answer for unattended runs — but it needs `socat` installed, blocks Windows binaries under WSL2, and adds a second boundary to reason about.
