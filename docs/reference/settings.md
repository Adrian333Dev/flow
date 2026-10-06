# Settings

Every key Flow reads from its own settings files, and every key it writes into Claude Code's. All the files are JSON, so none of them can hold a comment.

## Table of contents

- [The 4 files](#the-4-files): where each setting lives, and which file wins
- [Switches](#switches): the lines Flow prints by itself, each on until you turn it off
  - [`reminder`](#reminder): a line beside every message you send
  - [`sessionCheck`](#sessioncheck): a line when a session opens and something needs attention
  - [`setupReminder`](#setupreminder): the suggestion to run `flow init`
  - [`skillsAutoUpdate`](#skillsautoupdate): skill repositories updating themselves
  - [`wrapUp`](#wrapup): the warning that the conversation is getting long
- [Other keys in Flow's files](#other-keys-in-flows-files): numbers, lists and names
  - [`wrapUpAt`](#wrapupat): how long a conversation gets before the warning
  - [`compact`](#compact): let `/compact` run
  - [`setupReminderSkip`](#setupreminderskip): folders that never suggest `flow init`
  - [`fileSuggestionIgnore`](#filesuggestionignore): paths the `@` list never offers
  - [`sources`](#sources): the skill repositories Flow takes skills from
  - [`skills`](#skills): which skills are on
  - [`ticketPrefix`](#ticketprefix): the word every ticket id starts with
  - [`repository`](#repository): the repository a privately kept project belongs to
- [Claude Code's settings file](#claude-codes-settings-file): what `flow install` adds to `~/.claude/settings.json`
  - [`hooks`](#hooks): the scripts Claude Code runs at each moment of a session
  - [`permissions`](#permissions): what runs without asking, what asks, and what never runs
  - [`statusLine`](#statusline): the line under the box you type in
  - [`fileSuggestion`](#filesuggestion): the list of files `@` opens
  - [`cleanupPeriodDays`](#cleanupperioddays): how long Claude Code keeps old sessions
  - [`skillOverrides`](#skilloverrides): skills from your Claude account switched off
  - [Features switched off](#features-switched-off): the rest of the keys

## The 4 files

- **`~/.flow/settings.json`**: Flow's settings for all your computers. `flow sync` carries it to the others.
- **`~/.flow/settings.local.json`**: Flow's settings for this computer alone. It holds the settings that name a folder, since your other computers keep their folders elsewhere.
- **`<project>/.flow/settings.json`**: one project's settings, kept with its tickets.
- **`~/.claude/settings.json`**: Claude Code's own file. `flow install` adds Flow's keys to it and leaves yours alone.

Where a key can sit in both of Flow's computer-wide files, the local one wins. A change to Flow's files counts from the next command, with nothing to restart. A change to Claude Code's file counts once Claude Code restarts.

## Switches

Each switch turns one line that Flow prints by itself on or off. A switch is on unless `~/.flow/settings.json` says `false`:

```json
{
  "reminder": false,
  "wrapUp": false
}
```

`flow settings off <name> --global` writes the line for you, and `flow settings reset <name> --global` removes it. [Commands](commands.md#settings) shows both.

### `reminder`

Prints one line beside every message you send, so the agent keeps following the rules for how to reply:

```text
Follow `## The reply`, and pass every `### Before sending` test. If it applies, follow `## Capture`.
```

The text comes from `~/.flow/references/reminder.md`. [Sessions](../sessions.md) says why the line exists.

### `sessionCheck`

Prints a line when a session opens and something needs attention, and nothing otherwise:

```text
Flow: this machine is at changelog entry 3, and 5 is the newest. Run flow update in a terminal.
Flow: domain-skills is behind. 2 skills changed: react, sql. Update it when you want them, or set "skillsAutoUpdate": true.
```

Off, the lines stop. The work behind them goes on: skill links still match your settings, and skill repositories still update.

### `setupReminder`

Suggests setting Flow up when a session opens in a git repository Flow is not in yet:

```text
Flow: not set up here. Run flow init to set it up on this computer, or flow settings off setupReminder to stop this.
```

In a project set up on another computer, it also suggests folding in the memory Claude Code kept for it on this one. `false` turns both off everywhere. Typed inside a repository with no flag, `flow settings off setupReminder` turns them off for that repository alone, through [`setupReminderSkip`](#setupreminderskip).

### `skillsAutoUpdate`

Each skill repository in [`sources`](#sources) pulls itself in the background when a session opens, at most every 6 hours. A pull never runs over uncommitted work in the repository, or where it would have to merge: the next session names the repository instead.

`false` swaps the pull for a line naming the skills that changed, every session until you pull by hand.

### `wrapUp`

Tells the agent to stop at a safe point and hand off once the conversation passes [`wrapUpAt`](#wrapupat):

```text
The context is at 152k. At the next checkpoint, run /flow:handoff, report in full, and stop.
```

Every 20,000 tokens past the limit it says it again, more firmly. [Sessions](../sessions.md) covers the handoff.

## Other keys in Flow's files

### `wrapUpAt`

The conversation size, in tokens, at which [`wrapUp`](#wrapup) speaks. Unset, it is 150,000. Either computer-wide file holds it:

```json
"wrapUpAt": 140000
```

### `compact`

`true` lets a `/compact` you type run. Unset, Flow refuses it, and you see:

```text
Flow does not compact. Run /flow:handoff, then /clear. "compact": true in ~/.flow/settings.json allows /compact.
```

Either computer-wide file holds it. [Sessions](../sessions.md) says why Flow hands off instead.

### `setupReminderSkip`

Folders where [`setupReminder`](#setupreminder) never shows, each with everything inside it. Kept in `~/.flow/settings.local.json`:

```json
"setupReminderSkip": ["~/code/playground", "~/notes"]
```

`~` stands for your home folder. Any other entry is a full path.

### `fileSuggestionIgnore`

Paths the `@` list never offers, on top of the folders it always skips:

```json
"fileSuggestionIgnore": ["tmp", "public/assets"]
```

- **An entry with no `/` is a name**, skipped at any depth: `tmp` skips `tmp/` and `docs/tmp/`.
- **An entry with a `/` is a path** from the project's top folder: `public/assets` skips that folder alone.

All 3 of Flow's files can hold it, and their lists add up.

### `sources`

The skill repositories Flow takes skills from, each `owner/repo` on GitHub or a full git address:

```json
"sources": ["Adrian333Dev/domain-skills", "mattpocock/skills"]
```

`flow skills add` and `flow skills drop` write it in `~/.flow/settings.json`. With no `sources` key, the list is `Adrian333Dev/domain-skills` alone. [Extend](../extend.md) covers adding a repository.

### `skills`

Which skills are switched on, one line per skill you switched:

```json
"skills": { "react": "on", "review": "on" }
```

- **In a project's `.flow/settings.json`**: on or off for that project. `flow skills on <name>` writes it.
- **In `~/.flow/settings.json`**: on or off in every project. `flow skills on <name> --global` writes it.

A project's line wins over the global one. A skill no line names is off, except Flow's own workflow skills, which are always on. [Configure](../configure.md) covers the levels.

### `ticketPrefix`

The word every ticket id in a project starts with, so its tickets read `shop-1`, `shop-2`. Only a project's `.flow/settings.json` holds it:

```json
"ticketPrefix": "shop"
```

`flow init` writes it. A prefix is 2 to 8 lowercase letters, and never `home`, which names the tickets in your Flow home. Changing it later renames no ticket: the old ones keep their ids, and new ones count from 1 under the new word.

### `repository`

The repository a project belongs to, for a project whose tickets are kept privately in your Flow home:

```json
"repository": "github.com/shop-co/shop"
```

`flow init --private` and `flow store private` write it, in the project's folder inside your Flow home. `flow init` on your other computer reads it to find that folder. [New project](../new-project.md) covers where tickets can live.

## Claude Code's settings file

`flow install` adds these keys to `~/.claude/settings.json`. The setup session shows each one in its form before anything is written. Every other key in the file stays yours.

### `hooks`

Hooks are scripts Claude Code runs at a fixed moment, such as before every shell command. Flow's live in `~/.flow/scripts/hooks/`:

- **`guard.js`**, before every shell command and every file Claude opens: asks you before a command that could lose work, send data off the computer, or change a shared system, and before Claude reads a file of secrets. [Safety](../safety.md) lists what it asks about.
- **`changes.js`**, around every edit and command: records which helper agent changed which file. [Subagents](../subagents.md) shows a record.
- **`rule-check.js`**, before every edit: tests the edit against your rules. [Rule checks](../rule-checks.md) covers them.
- **`instructions-loaded.js`**, when a rule file loads: records which rules the agent has read.
- **`check-ticket.js`**, when you type a phase skill or `/flow:start`: refuses where Flow is not set up.
- **`overlays.js`**, when a skill loads: adds the project's own lines for that skill. [Configure](../configure.md) covers overlays.
- **`reminder.js`**, on every message you send: prints [`reminder`](#reminder).
- **`context-check.js`**, on every message and after every batch of tool calls: prints [`wrapUp`](#wrapup).
- **`compact-check.js`**, on a typed `/compact`: refuses it, unless [`compact`](#compact) is `true`.
- **`session-check.js`**, when a session opens: prints [`sessionCheck`](#sessioncheck) and [`setupReminder`](#setupreminder), matches skill links to your settings, and starts the background updates.
- **`failures.js`**, when a tool call or the API fails: adds a line to the failure log. [Learning](../learning.md) covers the log.
- **`records-sync.js`**, after every reply and as a session closes: sends the project's tickets and your Flow home to GitHub, at most every 30 minutes.

### `permissions`

```json
"permissions": {
  "defaultMode": "default",
  "disableBypassPermissionsMode": "disable",
  "allow": ["Edit", "Read", "WebFetch", "WebSearch", "Bash"],
  "ask": ["Bash(git commit *)", "Bash(git push *)", "Bash(npm publish *)",
          "Bash(pnpm publish *)", "Bash(yarn publish *)", "Bash(cargo publish *)"],
  "deny": ["…"]
}
```

- **`defaultMode`**: every session starts in Claude Code's ordinary mode, which asks only where a rule or a hook says to.
- **`disableBypassPermissionsMode`**: the mode that skips every question can never be switched on.
- **`allow`**: every edit, read, web fetch, web search and shell command runs without asking. The guard and the `ask` rules are what stop a harmful one.
- **`ask`**: a commit, a push or a publish always asks, since each puts work where other people see it. Delete a line to let that command run unasked.
- **`deny`**: never runs, in any mode:
  - Claude Code tools Flow replaces or never uses, such as plan mode, `AskUserQuestion` and scheduled jobs. Each one left out also saves the tokens its description costs.
  - Reading `~/.ssh` and `~/.aws`, the folders holding your keys.
  - `sudo`, `su`, `mkfs` and `--dangerously-skip-permissions`.
  - `flow restore` and `flow uninstall`, so the agent can never take Flow off for you.
  - Worktrees and forked helper agents.

[Safety](../safety.md) gives the reasons for each.

### `statusLine`

```json
"statusLine": { "type": "command", "command": "node \"$HOME/.flow/scripts/flow.js\" status-line --context" }
```

The line under the box you type in. Claude Code runs `flow status-line` after each message and shows what it prints:

```text
shop-7 building · 98k of 150k
```

- **The ticket** is the last one you typed as a skill in this session, `/flow:execute /shop-7`. With none typed, it is the ticket a skill last moved. Outside a Flow project the line is empty.
- **`--context`** adds how full the conversation is, against [`wrapUpAt`](#wrapupat).
- **`⚠ 1 Flow issue: ask Claude to fix them`** is added, in every folder, while a background job such as a ticket sync is failing. It goes once the job next works.

Nothing a status line prints reaches the agent, so it costs no tokens. The setup writes the key only where you have no status line of your own. With [ccstatusline](https://github.com/sirmalloc/ccstatusline), add `flow status-line` as a Custom Command widget instead.

### `fileSuggestion`

```json
"fileSuggestion": { "type": "command", "command": "node \"$HOME/.flow/scripts/hooks/file-suggestion.js\"" }
```

Builds the list of files `@` opens, in place of Claude Code's own list:

- **It offers files git ignores**, such as `.env` and `tmp/`.
- **It puts the most recently changed file first**, so a bare `@` shows the 15 files you touched last.
- **A path shows when every word you typed is in it**: `comp butt` finds `src/components/Button.tsx`.

It never enters `.git`, `node_modules`, `dist`, `build`, `out`, `coverage`, `.next`, `target`, `.venv` or `__pycache__`, nor anything in [`fileSuggestionIgnore`](#filesuggestionignore).

### `cleanupPeriodDays`

```json
"cleanupPeriodDays": 365
```

Claude Code deletes a session's record once it is this many days old. Its default is 30. Flow keeps a year, so a mistake can still be traced to the session that made it: [Learning](../learning.md) reads these records.

### `skillOverrides`

```json
"skillOverrides": { "grill-me": "off" }
```

Claude Code's switch for one skill. The setup session writes `off` for each skill synced from your Claude account that works against Flow, and only those you tick. It cannot reach Flow's own skills, which `flow skills` switches instead.

### Features switched off

- **`disableBundledSkills`**: Claude Code's own skills, so only Flow's load.
- **`disableWorkflows`**: Claude Code's built-in workflows, since Flow's skills are the workflow.
- **`disableRemoteControl`**: driving a session from claude.ai or your phone.
- **`disableClaudeAiConnectors`**: claude.ai's connectors.
- **`disableArtifact`**: the artifact tool.
- **`autoCompactEnabled: false`**: Claude Code swapping a long conversation for its own summary.
- **`autoMemoryEnabled: false`**: Claude Code's memory, which stays on one computer. Flow keeps what is worth remembering in your rules and project files.
- **`respondToBashCommands: false`**: a command you type behind `!` shows its output, and the agent waits for your next message.
- **`worktree.bgIsolation: "none"`**: a session running in the background edits your files where they are.
