# Settings

Flow reads 5 settings files. This page explains every key in each: what it does, the values Flow rejected, and why.

- **`~/.claude/settings.json`** belongs to Claude Code. Flow ships its keys in `home/settings.json`, and `/flow:setup-machine` merges them in.
- **`~/.flow/settings.json`** belongs to Flow, and travels to your other machine with the rest of `~/.flow/`.
- **`~/.flow/settings.local.json`** belongs to Flow and to this machine alone. git ignores it.
- **`<project>/.flow/settings.json`** belongs to one project, and is committed with it.
- **`<project>/.flow/settings.local.json`** belongs to one project on this machine alone. The project template's `.gitignore` leaves it out.

Flow reads its 2 machine files as one, and the local one wins key by key.

All 5 are strict JSON, so none can hold a comment. This page holds the explanations instead.

## Table of contents

- [Claude Code's settings file](#claude-codes-settings-file)
  - [`hooks`](#hooks)
  - [`permissions`](#permissions)
  - [`skillOverrides`](#skilloverrides)
  - [`cleanupPeriodDays`](#cleanupperioddays)
  - [Feature flags](#feature-flags)
  - [Deliberately absent](#deliberately-absent)
- [Flow's settings files](#flows-settings-files)
  - [`git`](#git)
  - [`sources`](#sources)
  - [`skills`](#skills)
  - [`skillsAutoUpdate`](#skillsautoupdate)
  - [`reminder`](#reminder)
  - [`sessionCheck`](#sessioncheck)

## Claude Code's settings file

`home/settings.json` is the template, and `/flow:setup-machine` merges its keys into `~/.claude/settings.json`. Merged rather than copied: your global settings also hold personal things (model, effort level, plugins, statusline) that Flow shouldn't own.

Settings load at startup. **Restart Claude Code after any change.**

---

### `hooks`

```json
"hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
  { "type": "command", "command": "node \"$HOME/.flow/scripts/guard.js\"" } ] } ] }
```

Runs `scripts/guard.js` before every Bash call. The script reads the pending command on stdin and returns `deny`, `ask`, or nothing.

Node, not Python. The hook inherits Claude Code's `PATH`, so a Node installed under nvm has to be on it, but `flow` and `util` are Node too, so that is already a hard requirement of the toolchain and this adds nothing new. What it removes is a third language in a five-file folder.

**The guard and the blanket `Bash` allow below are one unit. Never install one without the other.** Blanket allow with no guard leaves nothing deciding a shell command: the deny list holds no `Bash` entries at all, because a static list cannot name the open set of what a shell command can be.

#### The change record

```json
"PreToolUse":         [ { "matcher": "^(Edit|Write|Bash)$|^mcp__", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/changes.js\"" } ] } ],
"PostToolUse":        [ { "matcher": "^(Edit|Write|Bash)$|^mcp__", "hooks": [ "…the same" ] },
                        { "matcher": "Agent|SendMessage", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/changes.js\" --wait", "asyncRewake": true, "timeout": 86400 } ] } ],
"PostToolUseFailure": [ { "matcher": "^(Edit|Write|Bash)$|^mcp__", "hooks": [ "…the same" ] } ],
"SubagentStart":      [ { "hooks": [ "…the same" ] } ],
"SubagentStop":       [ { "hooks": [ "…the same" ] } ]
```

Records what each subagent changed, and hands the parent a diff per file when the subagent finishes. A subagent's own report can leave things out. A plain `git diff` cannot separate its work from a tree that has been dirty for weeks, or from a second subagent editing at the same time.

**Every change is filed under the agent that made it.** A hook that fires inside a subagent carries the subagent's `agent_id`, and a hook in the main conversation carries none. So 3 workers editing at once each get only their own files:

- **`Edit` and `Write`**: the file is stored just before the call and just after it
- **`Bash` and every MCP tool**: the whole project is snapshotted just before the call and just after it. A snapshot is `git write-tree` against a throwaway index: every file at one moment, uncommitted work included, with the real index, the files and HEAD untouched. The record lists the command beside the files it changed, so a deleted file shows next to the `rm` that deleted it
- **A worker's whole run**: one snapshot at `SubagentStart` and one at `SubagentStop`. A change no tool call explains comes back under the note "Changed while this subagent ran, by no tool call a hook saw". A command left running in the background causes one, and so do an edit in your editor and a tool nothing hooks
- **The main conversation**: recorded only while a worker runs, so an edit the parent makes is never handed to a worker

**A waiter delivers the record.** A background subagent's `Agent` call returns the moment it launches, long before any change, so the `PostToolUse` hook on `Agent` starts a waiter in the background. When the subagent finishes, `SubagentStop` builds the record and gives the waiter up to 2 seconds to take it. The waiter exits with code 2, which `asyncRewake` turns into a message that wakes the parent even when it sits idle. The record lands just before the subagent's finished notice. A subagent that changed nothing sends none.

**Claude Code labels the message "Stop hook blocking error".** Nothing failed. The rule `change-record` in `home/AGENTS.md` tells every session so: without it, a parent in a test run read a record as a possible prompt injection.

**`SendMessage` starts a new waiter**, for a subagent the parent resumes. A subagent you resume by typing into its row has no waiter, so its record arrives with the parent's next `Edit`, `Write` or `Bash` call instead.

**The size stays bounded.** A deleted file shows its header, never its content. Past 9,000 characters the longest diffs shrink to line counts, such as `big.txt: +2000 -0`, and the record names a file holding the whole patch. Claude Code cuts hook output at 10,000.

**Records live under `~/.flow/changes/<session>/`**, never a temporary folder, so a subagent resumed after a crash hands over what it changed before the crash too. File contents go into git's own object store, so a record holds hashes. A session folder untouched for 7 days is deleted when the next subagent starts.

3 things it cannot see:

- **Anything outside a git repository.** Nothing is recorded there
- **A command's changes inside a submodule.** A snapshot holds a submodule as one commit. `Edit` and `Write` inside one are still recorded
- **A command's changes to a gitignored file.** `Edit` and `Write` on one are still recorded

**`git add` has to stay reachable.** The snapshot stages into a throwaway index, which touches no real git state. It runs as a hook rather than through the Bash tool, so `guard.js` never sees it and the git mode never applies to it.

[The agents Claude Code runs](../dev/agents.md#what-a-subagent-changed) shows a real record.

#### The rule-check pair

```json
"PreToolUse":         [ { "matcher": "Edit|Write", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/rule-check.js\"" } ] } ],
"InstructionsLoaded": [ { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/instructions-loaded.js\"" } ] } ]
```

**One check exists, and it only measures.** `scripts/rule-checks/js-and-ts.js` counts a run of `//` lines above a function, and records the count without ever warning. More arrive one check file at a time.

`rule-check.js` runs every check in that folder against the pending edit and appends one line per result to `~/.flow/scorecards/<session>.jsonl`. Each check carries its own tier: `measure` records silently, `warn` returns a line in `additionalContext`, `block` returns a `deny`. `flow scorecard` adds the counts up.

`instructions-loaded.js` records which `CLAUDE.md` files, the files they import, and rule files entered context. That is what decides the shape of a warning: the rule id alone when the rule's file is loaded, and the rule's whole text injected when it is not. Telling the agent to go read the file costs a turn and can be skipped.

**The hole this fills is file creation.** A `paths:`-scoped rule triggers when Claude *reads* a matching file, so writing `src/foo.ts` in a session that opened no `.ts` file leaves the TypeScript rules out of context entirely. `PreToolUse` fires on `Write` whatever loaded.

**It never returns `allow`, and it never fails closed.** `guard.js` denies on an unexpected throw because it is the last thing holding git back. This one stays silent instead: it measures writing habits, and breaking every edit in a session over a bug in one check would cost far more than the counts are worth. `permissionDecisionReason` is used only on a deny, since on an allow it reaches the terminal and never Claude.

`InstructionsLoaded` has no decision control at all. Claude Code discards its output and ignores its exit code, so it records or it does not.

#### The ticket check

```json
"UserPromptExpansion": [ { "matcher": "^(flow:)?(groundwork|execute|prototype|debug|start)$", "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/check-ticket.js\"" } ] } ]
```

Runs `scripts/check-ticket.js` when one of the 5 skills that take a ticket id is typed, before the skill's text is built. The script reads the first word typed. A word shaped like a ticket id, which is `t` then a digit, so `t047`, `t47` or the folder name `t047-parser-split`, is checked with `flow get`; when nothing matches, the command is blocked and `flow`'s own message is shown, so a typo costs one line instead of the whole skill. Any other first word passes untouched, which is what lets instructions be typed after the skill name.

The matcher accepts the name with or without the prefix. Flow's skills load as a plugin named `flow`, so the command reads `/flow:execute`, and the hook is handed the bare name `execute`. The optional `flow:` group means the hook still fires if a future Claude Code version passes the full name instead.

It fires only on what the user types. A skill the agent invokes, as `/flow:start` does when it routes, carries no id and never reaches it.

#### The reminder

```json
"UserPromptSubmit":   [ { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/reminder.js\"" } ] } ]
```

Prints one line beside every message you send:

```text
Before replying, follow `~/.agents/AGENTS.md`, above all `## The reply` and its `### Before sending` tests.
```

The rules for writing a reply sit at the end of a long file, loaded once at the start of a session. By turn 15 they are far behind the conversation, and the reply drifts back to long, compressed and undefined. A line arriving with the message puts them back in front of the agent.

**It points at the rules, never repeats them.** A reminder listing rules grows with every rule and drifts from the file it copies.

**The text is a file, and the script only prints it.** Claude Code adds whatever a `UserPromptSubmit` hook prints to standard output beside the message. The hook cannot change the message itself. Edit `references/reminder.md` to change the line.

**`scripts/reminder.js` runs it, so it can be switched off.** `"reminder": false` in `~/.flow/settings.json` silences it, and [`reminder`](#reminder) covers the switch. The hook was a bare `cat` of the file until 2026-09-20, and `cat` reads no setting.

#### The session check

```json
"SessionStart":       [ { "hooks": [ { "type": "command",
  "command": "node \"$HOME/.flow/scripts/session-check.js\"" } ] } ]
```

Prints one line when this machine or this project needs attention, and nothing at all when neither does:

```text
Flow: this machine is at changelog entry 3, and 5 is the newest. Type /flow:migrate to catch up.
Flow: delapse is at changelog entry 3, and this machine is at 5. Type /flow:migrate here.
Flow: a migrate run stopped after step 4, so this machine is part way through a change. Type /flow:migrate to carry on, or run flow doctor for the way back.
Flow: domain-skills is behind. 2 skills changed: react, sql. Update it when you want them, or set "skillsAutoUpdate": true.
```

Its lines come from 4 files, and it waits for no network call: `~/.flow/run.json`, which a setup or a migration leaves behind only when it never finished, `~/.flow/version`, the project's `.flow/version`, and `~/.flow/skills-update.json`, which the background pull below writes. [`flow doctor`](reference.md#flow-doctor) stays the full check, since it runs both test suites and takes seconds.

**A stopped run silences the other version lines.** Each of them reads a version stamp that the stopped run was in the middle of moving, so finishing the run is the only thing worth saying about Flow's own version. A skill repository's line is a separate record and still prints.

**It also makes every skill link match the settings.** A switch you made on your other machine arrives through [`flow sync`](reference.md#flow-sync) as a line in `~/.flow/settings.json`, and the next session start makes the link. When a link changed, it asks Claude Code to scan the skill folders again. [`skills`](#skills) covers the lines.

**It also sends every skill repository to update itself**, by starting `~/.flow/scripts/skills-pull.js` in the background and returning at once. A session never waits for the network, and whatever that pull finds is printed by the session after it. [`skillsAutoUpdate`](#skillsautoupdate) covers the pull, its 2 guards and the switch.

**It is also the only thing that names `/flow:migrate`.** You type that skill and the agent can never start it, which keeps its description out of every session, so nothing else would tell either of you the command exists.

`"sessionCheck": false` in `~/.flow/settings.json` silences it, and [`sessionCheck`](#sessioncheck) covers the switch.

#### Why worktree isolation is off

`EnterWorktree` and `Agent(isolation:worktree)` both move an agent's edits into a worktree: a second checkout of the repository in its own folder, on its own branch. The change record already keeps parallel workers apart inside one folder. A worktree starts from a commit, so all it would add is a worker that cannot see your uncommitted work.

`Agent(isolation:worktree)` is a scoped rule rather than a bare name, so the Agent tool stays available and only that one parameter value is blocked.

**`worktree.bgIsolation` closes the same door from the other side.** Its default, `"worktree"`, blocks `Edit` and `Write` in the main checkout until `EnterWorktree` runs, and `EnterWorktree` is denied above, so a background session would read files and run commands and never write a fix. `"none"` lets it edit the working copy directly. The `debug` agent runs as one of those sessions, and isolation is wrong for debugging anyway: the bug often lives in uncommitted state that a fresh worktree does not carry.

---

### `permissions`

Rules evaluate **deny → ask → allow**, first match wins. A broad deny beats a narrower allow. Deny rules hold in every permission mode.

#### `allow`

| Entry | Covers |
|---|---|
| `Bash` | every shell command |
| `Edit` | every file-editing tool, including Write |
| `WebFetch` | every domain |
| `WebSearch` | every search |
| `mcp__context7__*` | every tool from the context7 MCP server |

A tool name written **without parentheses matches every use of that tool**.

Why blanket rather than a curated list: approving a command through the permission dialog saves the *exact string* that ran, so `util fs tree --depth 3` and `util fs tree --depth 4` become two rules. A hand-kept list of command patterns never converges and goes stale the moment a path moves. The deny list plus the guard define the boundary instead.

Not on the list, so still prompts: reads outside the working directory, and writes into protected paths (`.git`, `.claude`, `.vscode`, `.idea`, `.husky` and friends), which allow rules cannot pre-approve by design.

**Spawning a subagent never prompts, so `Agent` needs no entry.** Claude Code checks a subagent's own tool calls against these same rules while it works, and that is what governs a worker.

#### `deny`: Claude Code surfaces Flow doesn't use

These are **bare tool names**, which removes each tool from the model's context entirely rather than blocking it at call time. That also drops its schema from every request: `DesignSync` alone measured ~2,200 tokens.

| Entry | Why |
|---|---|
| `EnterPlanMode`, `ExitPlanMode` | Flow owns planning: `/flow:groundwork` → tickets → the ticket's `plan.md`. Built-in plan mode also blocks the file writes those phases depend on. |
| `AskUserQuestion` | Presents a canned multiple-choice list. Flow's rule is the inverse: the agent commits to a recommendation and the user reacts. |
| `ListAgents` | Finds other Claude Code sessions to message. Flow messages its own subagents by id, and nothing else. |
| `PushNotification`, `ScheduleWakeup`, `RemoteTrigger`, `ReportFindings` | Out-of-band and unattended operation. One author, one terminal, every session watched. |
| `SendUserFile`, `ShareOnboardingGuide` | Send a file off the machine, to a device or behind a public link. Same reason, plus the work is not the agent's to publish. |
| `CronCreate`, `CronDelete`, `CronList` | Scheduled background jobs. Same reason. |
| `NotebookEdit` | Jupyter notebooks. Not in any workflow here. |
| `DesignSync` | Design-tool sync. Unused, and absent from the published tool reference, so it was found by logging a real request rather than by reading the docs. |

**`SendMessage` stays allowed.** A parent resumes a finished subagent with it, after a crash too.

**`Agent(fork)` is a scoped rule**, like `Agent(isolation:worktree)` above, so it blocks one subagent type and leaves the Agent tool alone. A fork is a subagent that starts with a copy of the whole conversation, and Claude Code starts one on its own in an interactive session. Flow never uses one: every agent Flow starts sees only what its prompt gives it.

#### `deny`: the 2 commands that undo Flow

```json
"deny": ["Bash(flow restore machine:*)", "Bash(flow uninstall:*)"]
```

`flow restore machine`, `flow restore project` and `flow uninstall` put your machine back as it was before Flow, which means deleting files that have no other copy. Each is denied under both typed names, `flow` and `fw`, and under the path form `node ~/.flow/scripts/flow/flow.js`.

This is the 4th of 4 locks, and the weakest: a prefix rule cannot name every way a path can be written. The other 3 do not depend on it. The command refuses while any Claude Code or Codex session is running, it reads its confirming word from `/dev/tty` rather than from its input, and it takes no flag that skips the question. An agent fails the first 2 on its own, `!` inside a session included. [Reference](reference.md#flow-restore-machine-and-flow-restore-project) covers all 4.

`flow restore ls` is left allowed. It prints what has been recorded and changes nothing.

#### `deny`: no git entries, and why

**No `Bash(git …)` rule appears in `home/settings.json`, and adding one would break the switch.** `guard.js` decides every git command instead.

A deny rule is read once at session start, and it only ever adds. Nothing in a project, a flag or a settings file can lift a user-level entry, so a rule written here is permanent and no switch can reach past it. `guard.js` runs before every shell command and re-reads its state each time, which is what lets the mode change mid-session.

`flow git` writes that state, into `~/.flow/settings.json`:

```text
flow git                    what the mode is, and when it runs out
flow git allow [--for 2h]   the agent may write with git
flow git ask                the same, confirming every one
flow git off                back to reads only
```

The scope is the session you type it in, unless `--project` or `--global` widens it. It lasts an hour unless `--for` says otherwise. Past that, the guard deletes the entry the first time it looks, so a switch left on turns itself off.

`--project` writes `.flow/settings.local.json` inside the repository, and the project template ignores that path. An unlock is this machine's state with a clock on it: committed, it would be one commit saying git writes are on and another an hour later saying they are off.

Three things hold whatever the mode says:

- **Reads always run.** `status`, `log`, `diff`, `show` and 22 more, by allowlist. Anything outside it is a write
- **Destructive commands always ask.** A force push, `reset --hard`, `clean`, `rebase`, `filter-branch`, `branch -D`, a tag or ref delete, `reflog delete`, `gc --prune`, `worktree remove --force`. They ask rather than deny, so you can still say yes: they just never run silently
- **The agent cannot turn it on.** `flow git allow` is refused when the agent runs it. Type it yourself as `! flow git allow`, which reaches no tool call and so reaches no guard

`guard.js` is the only thing between the agent and git now, so an error it cannot recover from denies a git command rather than falling through.

#### Modes

```json
"permissions": { "defaultMode": "default" }
```

Six of them, cycled with Shift+Tab and overridable for one session with `--permission-mode <name>`. A mode only decides what happens to a call no rule above matched.

**Every session starts in `default`, labelled Manual.** The allow list covers everything routine, so the prompts left over are the ones worth seeing. The key has to be there. Since Claude Code 2.1.228, a terminal session on a Pro, Max or Team plan starts in `auto` unless a settings file names another mode. `flow doctor` fails when the key is missing, and prints a note when it names another mode.

**`auto` is not where a session starts.** In auto mode a second model, the classifier, reviews a call before it runs and blocks what looks beyond your request. 3 things decided against it:

- **It pulls against Flow's first rule.** Anthropic's permission modes page says auto mode nudges the model to "keep working without stopping for clarifying questions". `instruction-or-thinking` in `home/AGENTS.md` says a message that is not an instruction gets a reply and no edit.
- **It reviews nearly every shell command.** Entering auto mode drops a blanket `Bash` allow, so every shell command that is not a plain read goes to the classifier. Reads, edits inside the project and the narrower allow entries skip it.
- **Its cost on a subscription is unconfirmed.** The same page says classifier calls count toward usage on Enterprise plans and API accounts, and says nothing about Pro or Max.

**The guard works in either mode.** A hook's `ask` still forces a prompt in auto mode, and a hook's `deny` always holds. The classifier can add a block and never remove one.

**`auto` and `dontAsk` are the 2 unattended modes.** Reach for either with Shift+Tab, never by setting it here. `auto` lets the classifier approve what the allow list does not cover, and catches what the guard never looks for, such as a command sending data off the machine. `dontAsk` denies whatever the allow list does not cover, with no second model, so a long run finishes and every denial shows up in the transcript.

**`acceptEdits` buys almost nothing.** With `Bash` and `Edit` blanket-allowed above, it is not the looser mode it looks like.

**`bypassPermissions` is locked out**, by `permissions.disableBypassPermissionsMode: "disable"`. Its one addition over `acceptEdits` is silent writes into `.claude` and `.git`, and Flow's settings, subagents and links all sit in `.claude`. The same key disables the `--dangerously-skip-permissions` flag that `guard.js` already denies as a Bash command, and makes Claude Code ignore `permissionMode: bypassPermissions` in any agent definition.

---

### `skillOverrides`

```json
"skillOverrides": { "batch": "off" }
```

**Claude Code's key for hiding a skill from the model.** Set to `off`, a skill's description never enters a session, and typing it fails with *disabled via skillOverrides*. `home/settings.json` ships no entry. `/flow:setup-machine` writes one for each skill it switches off: Claude Code's own `/batch`, which needs worktrees, and a skill synced from your Claude account that works against Flow's rules.

**[`flow skills`](reference.md#flow-skills) never writes it.** Flow switches its own skills, and the ones from skill repositories, by adding and removing links. 2 reasons decided against this key:

- **It does not reach Flow's own skills.** Flow's skills load as a plugin, and Claude Code's settings page rules the key out for those: *Does not apply to plugin skills, which are managed through `/plugin`*.
- **A removed link costs the same as `off`.** A skill with no link is never found, so its description costs nothing either. One mechanism for every source beats 2.

**It stays yours for every skill Flow did not install**: a plugin's, or one another tool wrote into `~/.claude/skills/`. A project's `.claude/settings.json` can override the machine's file here, name by name.

---

### `cleanupPeriodDays`

```json
"cleanupPeriodDays": 365
```

Claude Code deletes session data older than this at startup, and the default is 30 days. What it takes is the whole record of how a session ran: `~/.claude/projects/<project>/<session>.jsonl`, the `subagents/` transcripts beneath it, the `tool-results/` spill, plus `file-history/`, `plans/`, `debug/` and `paste-cache/`.

**Flow raises it because the transcript is evidence.** A study case exists to preserve an artifact that would be gone tomorrow, and the transcript is where that artifact actually lives. At 30 days, a rule written last month can no longer be traced back to the session that caused it.

365 rather than a decade, because the sweep is the only thing bounding this folder. A month of real work runs to roughly 300 MB, so a year costs a few gigabytes and ten years costs tens. Raise it once something prunes deliberately.

The minimum is 1, and `0` fails validation. A settings file that cannot be parsed pauses the sweep entirely, and `/status` carries the warning until it is fixed.

---

### Feature flags

| Key | Value | Effect |
|---|---|---|
| `disableBundledSkills` | `true` | Anthropic's bundled skills stay out, so only Flow's skills load. |
| `disableWorkflows` | `true` | Built-in workflows off: Flow's skills are the workflow. |
| `disableRemoteControl` | `true` | No driving the session from claude.ai or mobile. |
| `disableClaudeAiConnectors` | `true` | No claude.ai connectors. |
| `disableArtifact` | `true` | No artifact tool. `/flow:visualize` renders inline. |
| `autoMemoryEnabled` | `false` | Auto memory is retired. It is per-repository and machine-local, so it cannot hold anything durable. Everything worth keeping goes in the repo: `AGENTS.md`, `docs/`, or a skill. |
| `respondToBashCommands` | `false` | A command you type behind `!` in the input box puts its output in context and stops there, instead of spending a turn reacting to it. `! flow git allow` and `! ls` should cost nothing. When you want a reaction, the next message asks for one, and it carries your instructions, which an automatic reply cannot. |

---

### Deliberately absent

**The built-in task tools** (`TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate`) stay allowed rather than joining the deny list. They look like a tracker competing with `flow` and are not: `flow` records work that outlives the session, these are a scratch checklist for the turn in front of you. Denying them costs the checklist and saves nothing.

**`sandbox`.** Claude Code's bubblewrap jail was considered and rejected. It is a genuine OS-level boundary at zero token cost, and it remains the right answer for unattended runs, but it needs `socat` installed, blocks Windows binaries under WSL2, and adds a second boundary to reason about.

## Flow's settings files

`~/.flow/settings.json` and `~/.flow/settings.local.json` hold what Flow reads and Claude Code never does. Every key sits at the top level, and Flow reads the 2 files as one with the local file winning:

```json
{
  "sources": ["Adrian333Dev/domain-skills", "mattpocock/skills"],
  "skills": { "review": "off" },
  "git": { "mode": "allow", "until": "2026-09-14T15:00:00.000Z", "session": "<session id>" }
}
```

**Which file a key goes in is decided by one question: would the value still be true on your other machine?** `~/.flow/` is one git repository shared between your machines, so `settings.json` travels and `settings.local.json` is the part git ignores.

A project has the same pair in its own `.flow/`. `.flow/settings.json` holds the project's [`skills`](#skills) lines and is committed, so a fresh clone of the project gets its skills back. `.flow/settings.local.json` holds the [`git`](#git) entry `--project` writes, and stays on this machine.

A change applies on the next command, with nothing to restart.

---

### `git`

Whether the agent may run a git command that writes, and until when. `flow git` writes this key, so never edit it by hand. [`deny`: no git entries, and why](#deny-no-git-entries-and-why) covers the commands, the scopes and what holds whatever the mode says.

- **`mode`**: `allow` or `ask`. No entry means off
- **`until`**: when the entry expires. `--for never` leaves it out
- **`session`**: the session the entry belongs to. `--project` and `--global` leave it out

`--project` writes the entry into the project's own `.flow/settings.local.json`, which the project template gitignores.

---

### `sources`

The skill repositories Flow takes skills from. A skill repository is a git repository of skill folders: every `SKILL.md` in it is a skill. `flow skills add` and `flow skills drop` write this key, in the shared file:

```json
"sources": ["Adrian333Dev/domain-skills", "mattpocock/skills"]
```

Each entry is `owner/repo` for GitHub, or a full git address for anywhere else. With no `sources` key the list is the [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) repository alone, which holds skills about one field or tool, such as React.

**`flow install` clones every entry that is missing**, into `~/.flow/repos/sources/<owner>_<repo>/`, and nothing else clones. Your other machine gets the list through [`flow sync`](reference.md#flow-sync), and its next `flow install` makes the clones. [`flow skills`](reference.md#flow-skills) covers the commands.

---

### `skills`

Which skills are switched on or off, one line per skill name that differs from its default:

```json
"skills": { "react": "on", "review": "on" }
```

**3 files hold this key, and the nearest one wins, name by name.**

- **One project**: `<project>/.flow/settings.json`, committed with the project
- **This machine**: `~/.flow/settings.local.json`
- **Every machine**: `~/.flow/settings.json`

A name no file mentions is off. So the files hold only what you switched. Flow's own skills outside `skills/dev/` are the exception. They are the workflow, always on, and a line naming one does nothing. Only `/flow:review` and `/flow:apply-domain-findings` switch.

**`flow skills on` and `off` write the lines, and you never have to.** No flag writes the project's file, `--machine` this machine's, and `--global` the shared one. A line you write by hand works too, from the next command or the next session.

**A line works by making a link.** A skill on for a project is a link in that project's `.claude/skills/`. One on for the machine is a link in `~/.claude/skills/`. Every `flow skills` command and every session start add and remove links until they match the lines. [`flow skills`](reference.md#flow-skills) shows the listing, and what each command refuses.

---

### `skillsAutoUpdate`

Whether every skill repository in [`sources`](#sources) updates itself. Write `false` to be asked instead:

```json
"skillsAutoUpdate": false
```

**On, which is the default, a session opens and each clone pulls itself in the background.** Every skill reaches a project as a link into its clone, so a merge in the repository reaches every project holding the skill the moment the pull lands. Nothing else has to run: Flow being behind means a migration, and a skill being behind means a pull.

**Two guards, both read before anything is pulled.** Uncommitted work in the clone, and a pull that would not be a fast-forward. Either one means no pull for that clone, and a line at the top of the next session saying which:

```text
Flow: domain-skills has 2 uncommitted files, so none of its skills was updated. Commit them, or update the clone by hand.
```

Without the guards, a pull nobody asked for could wreck work sitting in that clone.

**Off, each session fetches instead and names what is waiting**, every session until you pull. The names are the news: `react changed` is something to read, where `3 commits` is not.

**It costs one network call per clone every 6 hours at most.** A clone's last fetch is what the check reads, so a machine that opens 20 sessions in a morning looks once. A clone with something to report is checked every session instead, which is how the line stops the moment you have pulled by hand.

Every pull that changed something adds a line to `~/.flow/history.jsonl`, naming the skills it changed.

`"sessionCheck": false` silences the line and not the pull, since the skills are what an agent reads in a project. This key is the one that stops it.

---

### `reminder`

Whether the line pointing at the reply rules prints beside every message you send. Write `false` to silence it:

```json
"reminder": false
```

**Every line Flow prints on its own carries a key like this one**, read by the script that prints it. A line is on unless its key says `false`, so a machine with no settings file at all gets all of them. `scripts/reminder.js` reads this one.

[The reminder](#the-reminder) shows the line and says why it exists.

---

### `sessionCheck`

Whether the line naming what needs attention prints when a session opens. Write `false` to silence it:

```json
"sessionCheck": false
```

[The session check](#the-session-check) shows every line it can print and says which files it reads.

It silences the printing alone. Every skill repository still updates itself, which [`skillsAutoUpdate`](#skillsautoupdate) governs.
