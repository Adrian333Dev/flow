# Settings

Every key Flow reads from its own settings files, and every key it writes into Claude Code's. All the files are JSON, so none of them can hold a comment.

## Table of contents

- [The 4 files](#the-4-files): where each setting lives, and which file wins
- [Switches](#switches): the lines Flow prints by itself, each on until you turn it off
  - [`reminder`](#reminder): a line beside every message you send
  - [`sessionCheck`](#sessioncheck): a line when a session opens and something needs attention
  - [`setupReminder`](#setupreminder): the suggestion to run `flow init`
  - [`wrapUp`](#wrapup): the warning that the conversation is getting long
- [Other keys in Flow's files](#other-keys-in-flows-files): numbers, lists and names
  - [`wrapUpAt`](#wrapupat): how long a conversation gets before the warning
  - [`keepWarmLead`](#keepwarmlead) and [`keepWarmMaxIdle`](#keepwarmmaxidle): when `/keepwarm` pings, and when it gives up
  - [`setupReminderSkip`](#setupreminderskip): folders that never suggest `flow init`
  - [`fileSuggestionIgnore`](#filesuggestionignore): paths the `@` list never offers
  - [`ticketPrefix`](#ticketprefix): the word every ticket id starts with
- [Claude Code's settings file](#claude-codes-settings-file): what `flow install` adds to `~/.claude/settings.json`
  - [`hooks`](#hooks): the scripts Claude Code runs at each moment of a session
  - [`env`](#env): the variables Claude Code sets for every session, among them the one that loads Flow's mod
  - [`permissions`](#permissions): what runs without asking, what asks, and what never runs
  - [`fileSuggestion`](#filesuggestion): the list of files `@` opens
  - [`cleanupPeriodDays`](#cleanupperioddays): how long Claude Code keeps old sessions
  - [`skillOverrides`](#skilloverrides): skills from your Claude account switched off
  - [Features switched off](#features-switched-off): the rest of the keys

## The 4 files

- **`~/.flow/settings.json`**: Flow's settings for all your computers. `flow sync` carries it to the others.
- **`~/.flow/settings.local.json`**: Flow's settings for this computer alone. It holds the settings that name a folder, since your other computers keep their folders elsewhere.
- **`<project>/.flow/settings.json`**: one project's settings, kept with its tickets.
- **`~/.claude/settings.json`**: Claude Code's own file. No Flow command writes it. `flow install` and `flow update` owe a setup session, a Claude Code session that reads it beside Flow's template, adds the keys Flow needs, removes any that conflict, and keeps the rest.

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

The text comes from `~/.flow/scripts/hooks/reminder.md`.

### `sessionCheck`

Prints a line when a session opens and something needs attention, and nothing otherwise:

```text
Flow: not set up here. Run flow init to set it up on this computer, or flow settings off setupReminder to stop this.
```

Off, the line stops. The work behind it goes on: the ticket skills still match your tickets.

### `setupReminder`

Suggests setting Flow up when a session opens in a git repository Flow is not in yet:

```text
Flow: not set up here. Run flow init to set it up on this computer, or flow settings off setupReminder to stop this.
```

`false` turns it off everywhere. Typed inside a repository with no flag, `flow settings off setupReminder` turns it off for that repository alone, through [`setupReminderSkip`](#setupreminderskip).

### `wrapUp`

Tells the agent to restart the session once the conversation passes [`wrapUpAt`](#wrapupat). Flow's mod sends one line at the limit:

```text
Finish this step, then restart.
```

The restart guide follows the line: what to save to the ticket, which files to load and what the note holds. At 100,000 past the limit it sends one more, `Stop now and restart.`, with the same guide. Neither names the size or a handoff. A helper agent that still runs delays the restart until it finishes. A helper agent follows the same limit on its own conversation: it cannot restart, so the mod sends it a message to save its state to its report files and begin its reply with `UNFINISHED:` and their paths, unless it is within a few steps of its final report. The session that sent it starts the next subagent from those files. At 100,000 past the limit the message is `Stop now`. From 30,000 under the limit the band above the prompt shows a green Restart button for restarting by hand. A press sends the agent one prompt asking for its note, with the guide. The button shows only between turns, and a press hides it until the restart ends. The restart keeps the session and its transcript. The new window holds the tickets in flight with their `context.md` (whole in groundwork, else the sections of open questions), the files and skills the agent named, the agent's note, and your messages it never answered, each whole. The old dialogue stays in the session's transcript, for `flow audit`. A typed `/restart` stops there. An automatic restart then submits `Continue from the note.`.

## Other keys in Flow's files

### `wrapUpAt`

The conversation size, in tokens, at which [`wrapUp`](#wrapup) speaks. Unset, it is 170,000: a session starts near 25,000 with `CLAUDE.md` and the tools. `flow settings` shows the default beside your value. Either computer-wide file holds it:

```json
"wrapUpAt": 140000
```

### `keepWarmLead` and `keepWarmMaxIdle`

Both belong to `/keepwarm`, the mod's switch that renews a session's prompt cache while you are away. A cache expires 1 hour (or 5 minutes) after the last request that read it, and a message sent after that pays for the whole conversation again, about $1 at 150,000 tokens. A ping costs about $0.03.

- **`keepWarmLead`**: minutes before the cache expires that the ping goes out. Unset, 3. A cache that lives 5 minutes pings at half its life at the latest.
- **`keepWarmMaxIdle`**: hours after your last request that the pings stop. Unset, 4. Your next message starts them again. With a 1-hour cache, 4 hours is 4 pings, about $0.12, against about $1 for the message that would otherwise find a cold cache.

Either computer-wide file holds them, and `settings.local.json` wins:

```json
"keepWarmLead": 5,
"keepWarmMaxIdle": 2
```

The switch itself is per session, off until you type `/keepwarm on`. Closing the session turns it off and ends the pings, and a session opened again (a resume included) starts with it off, until you type `/keepwarm on` again. A restart or a reload of the mod keeps it on. `/keepwarm status` says when the next ping goes out, and `/keepwarm ping` sends one now and reports what the cache served.

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

### `ticketPrefix`

The word every ticket id in a project starts with, so its tickets read `shop-1`, `shop-2`. Only a project's `.flow/settings.json` holds it:

```json
"ticketPrefix": "shop"
```

`flow init` writes it. A prefix is 2 to 8 lowercase letters, and never `home`, which names the tickets in your Flow home. Changing it later renames no ticket: the old ones keep their ids, and new ones count from 1 under the new word.

## Claude Code's settings file

These are the keys Flow keeps in `~/.claude/settings.json`. Every other key in the file stays yours.

### `hooks`

Hooks are scripts Claude Code runs at a fixed moment, such as before every shell command. Flow's live in `~/.flow/scripts/hooks/`, and the sync job in `~/.flow/scripts/jobs/`:

- **`guard.ts`**, before every shell command, edit, write and file read: asks you before a call that could lose work, send data off the computer, change a shared system or switch the guard off, and before Claude reads a private key or a login.
- **`changes.ts`**, around every edit and command: records which helper agent changed which file, in `~/.flow/changes/<session>/`.
- **`rule-check.ts`**, before every edit: tests the edit against your rules. No rule check exists yet, so it does nothing.
- **`instructions-loaded.ts`**, when a rule file loads: records which rules the agent has read.
- **`check-ticket.ts`**, when you type a phase skill or `/flow:start`: refuses where Flow is not set up.
- **`overlays.ts`**, when a skill loads: adds the lines in `~/.flow/skill-overlays/<skill>.md`.
- **`reminder.ts`**, on every message you send: prints [`reminder`](#reminder).
- **`session-check.ts`**, when a session opens: prints [`sessionCheck`](#sessioncheck) and [`setupReminder`](#setupreminder), rewrites the ticket skills, and starts the background sync.
- **`failures.ts`**, when a tool call or the API fails: adds a line to the failure log in `~/.flow/logs/failures/`.
- **`records-sync.ts`**, after every reply and as a session closes: sends the project's tickets and your Flow home to GitHub, at most every 30 minutes.

### `env`

```json
"env": {
  "CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS": "1",
  "CLAUDE_CODE_PLUGIN_DIRS": "~/.flow/repos/flow/mods/flow-session"
}
```

- **`CLAUDE_CODE_PLUGIN_DIRS`**: loads Flow's mod, `flow-session`, from your clone. The mod prints [`wrapUp`](#wrapup), restarts a session in place, and turns a file dragged into the box into an `@` mention. It refuses every compaction it did not start, so a typed `/compact` prints `Flow compacts only at its own restart. Run /restart.`
- **`CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS`**: switches off Claude Code's Explore and Plan helper agents. Explore skips every `CLAUDE.md`, so no Flow rule would reach its searches.

### `permissions`

```json
"permissions": {
  "defaultMode": "acceptEdits",
  "disableBypassPermissionsMode": "disable",
  "allow": ["Edit", "Edit(//**/.flow/**)", "Read", "WebFetch", "WebSearch", "Bash", "Monitor"],
  "ask": ["Bash(git push *)", "Bash(util git save *)", "Bash(npm publish *)",
          "Bash(pnpm publish *)", "Bash(yarn publish *)", "Bash(cargo publish *)"],
  "deny": ["…"],
  "additionalDirectories": ["~/.flow"]
}
```

- **`defaultMode`**: every session starts in Accept edits, in every project. In Manual, Claude Code asked before writes inside the project despite the `Edit` allow.
- **`disableBypassPermissionsMode`**: the mode that skips every question can never be switched on.
- **`allow`**: every edit, read, web fetch, web search, shell command and `Monitor` wait runs without asking. The guard and the `ask` rules are what stop a harmful one.
- **`ask`**: a push, a publish or `util git save` (which pushes) always asks, since each puts work where other people see it. A plain `git commit` runs. Delete a line to let that command run unasked.
- **`deny`**: never runs, in any mode:
  - Claude Code tools Flow replaces or never uses, such as plan mode and scheduled jobs. Each one left out also saves the tokens its description costs.
  - Reading `~/.ssh` and `~/.aws`, the folders holding your keys.
  - `sudo`, `su`, `mkfs` and `--dangerously-skip-permissions`.
  - Worktrees: a new one starts without the project's `.flow` folder, so a session in it would have no tickets.
- **`additionalDirectories`**: your Flow home counts as part of every project, so an edit there never asks.
- **`Edit(//**/.flow/**)`**: an edit through a project's `.flow` link never asks. A project's tickets live in your Flow home and are reached through that link, and Claude Code asks before any write that leads outside the project unless one rule matches both the link and where it points.

### `fileSuggestion`

```json
"fileSuggestion": { "type": "command", "command": "node \"$HOME/.flow/scripts/hooks/file-suggestion.ts\"" }
```

Builds the list of files `@` opens, in place of Claude Code's own list:

- **It offers files git ignores**, such as `.env` and `tmp/`.
- **It puts the most recently changed file first**, so a bare `@` shows the 15 files you touched last.
- **A path shows when every word you typed is in it**: `comp butt` finds `src/components/Button.tsx`.

It never enters `.git`, `node_modules`, `dist`, `build`, `out`, `coverage`, `.next`, `target`, `.venv` or `__pycache__`, nor anything in [`fileSuggestionIgnore`](#filesuggestionignore).

### `cleanupPeriodDays`

```json
"cleanupPeriodDays": 60
```

Claude Code deletes a session's record once it is this many days old. Its default is 30. Flow keeps 60, so a mistake can still be traced to the session that made it: `flow audit` reads these records. The audit index outlives the records, and `flow audit keep <id>` archives one session.

### `skillOverrides`

```json
"skillOverrides": { "grill-me": "off" }
```

Claude Code's switch for one skill, set to `off` for a skill synced from your Claude account that works against Flow. It cannot reach Flow's own skills, which are always on.

A skill you keep takes `"on"`. [`flow doctor`](commands.md#flow-doctor) names every synced skill with no entry, since a skill synced after setup loads in every session until one decides it.

### Features switched off

- **`disableBundledSkills`**: Claude Code's own skills, so only Flow's load.
- **`disableRemoteControl`**: driving a session from claude.ai or your phone.
- **`disableClaudeAiConnectors`**: claude.ai's connectors.
- **`idleCompaction`**: set to `false`. Claude Code's own summary of a long conversation left idle for about an hour. A summary loses what you said, and Flow's [restart](#wrapup) carries it word for word.
- **`feedbackSurveyRate: 0`**: Claude Code's feedback survey prompt.
- **`disableArtifact`**: the artifact tool.
- **`autoCompactEnabled: false`**: Claude Code swapping a long conversation for its own summary.
- **`autoMemoryEnabled: false`**: Claude Code's memory, which stays on one computer. Flow keeps what is worth remembering in your rules and project files.
- **`respondToBashCommands: false`**: a command you type behind `!` shows its output, and the agent waits for your next message.
- **`worktree.bgIsolation: "none"`**: a session running in the background edits your files where they are.
