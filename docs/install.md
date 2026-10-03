# Install

Put Flow on your computer, keep it up to date, and take it off again.

## Table of contents

- [What you need](#what-you-need): the programs Flow calls, and the systems it runs on
- [Install Flow](#install-flow): the line to paste, and what it asks
- [The setup session](#the-setup-session): how Flow fits itself around what your computer already holds
- [Update Flow](#update-flow): get the newest Flow, and bring your computer and projects up to it
- [Take Flow off](#take-flow-off): put back what Flow changed, or remove it

## What you need

- **Linux, macOS, or Windows through WSL.**
- **`git`, `node`, `claude` and `gh`**, GitHub's command-line tool. Flow calls them and never installs them. `flow doctor --prereq` checks all 4.
- **A GitHub account**, where Flow keeps a private backup of your Flow home.

## Install Flow

```sh
curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/main/install.sh | bash
```

The line downloads Flow into `~/.flow/repos/flow/`, then runs `flow install`. Already downloaded Flow yourself? `flow` is not a command yet, so run the install by its path:

```sh
node <clone>/scripts/flow.js install
```

`flow install` then:

1. **Signs `gh` in to GitHub**, where it is not signed in yet. The browser sign-in often fails on WSL, so it shows how to use a token instead:

   ```text
   Flow keeps your Flow home in a private GitHub repository, through gh, and gh is not signed in.
   Sign in with a token, which works everywhere, WSL included:
     1. Open github.com/settings/tokens/new, which makes a classic token.
     2. Tick repo, read:org and gist. Nothing else.
     3. Generate it and copy it.
     4. Below, choose "Paste an authentication token", and paste it.
   ```

2. **Asks this computer's name**, offering one made from the kind of computer and its system: `Machine name (default: desktop-wsl):`. Your other computers know it by this name.
3. **Connects your Flow home**: `~/.flow/`, the folder where Flow keeps your rules, notes, settings and tickets. On your first computer, the install creates a private GitHub repository named `flow-home` to back it up. On the next, it downloads your Flow home from there. [Two machines](two-machines.md) covers the second computer.
4. **Saves this computer's original**: a copy of every file Flow is about to change, so [`flow restore`](#take-flow-off) can put it back.
5. **Links Flow's skills, rules and scripts into place**, and downloads the tools Flow uses. [Files](reference/files.md) lists every path.
6. **Opens the setup session.**

```console
$ flow install
Flow is installed: 10 skills, each typed under the plugin name, as /flow:groundwork.
wrote: ~/.flow/originals/machine, this machine as it was before Flow
named: this machine is desktop-wsl
started: your Flow home, sent up so your other machines join it
Every line of the install is in ~/.flow/logs/install.log.
```

Every check runs before anything is made. A failed one stops the install, says what to fix, and leaves your computer as it was. Running `flow install` again is always safe: it puts back whatever is missing.

## The setup session

The install's last step opens a Claude Code session that reads what your computer already holds: your `~/.claude/CLAUDE.md` and the files it loads, your skills, your plugins, and `~/.claude/settings.json`. It writes every change it wants to make into one form, `migration.md`, and stops. Nothing outside `~/.flow/` changes before you approve the form.

A ticked line goes and an unticked one stays. A few lines from the form's template:

```md
## 🔴 Removed unless you untick it

### Works against Flow's rules

- [x] Memory: notes Claude Code writes about each project and loads into every session, beside Flow's rules. `autoMemoryEnabled`
- [x] Compacting: Claude Code swaps a long conversation for its own summary of it, when you type /compact or by itself near the limit. Flow ends a long conversation with /flow:handoff, then /clear. `autoCompactEnabled`, `hooks.PreCompact`
- [x] tdd skill: tells Claude how to plan and test every change, which Flow's steps already do. `~/.claude/skills/tdd/`
```

After your yes, the session writes:

- **`~/.flow/AGENTS.md`**, your rules: Flow's template, plus your preferences and what it learned about you from your old rule files.
- **`~/.claude/CLAUDE.md`**, as one line loading those rules.
- **Flow's keys into `~/.claude/settings.json`**, leaving your own. [Settings](reference/settings.md#claude-codes-settings-file) covers each key.

While it runs:

- **Claude Code asks once before editing its own settings.** Answer **allow Claude to edit its own settings for this session**.
- **Your own rules, skills, plugins and hooks stay unloaded**, so nothing already on the computer argues with the setup.
- **`flow` refuses every command but `install`, `doctor`, `restore` and `uninstall`** until the setup finishes. A setup that stopped part way carries on when you type `flow install` again.

The session ends by asking you to quit and start `claude` again, since rules and hooks load when a session starts. Then run [`flow doctor`](reference/commands.md#flow-doctor) to check the install.

## Update Flow

Each change to how Flow behaves gets a number, and `~/.flow/version` holds the newest one your computer has applied. A session tells you when your computer is behind. Then type, in a terminal:

```console
$ flow update
Flow was already at its newest commit.
Flow is up to date: this machine is at entry 1, and so is ~/code/shop.
```

1. **It downloads the newest Flow.**
2. **It compares the numbers**: your computer's against the newest, then the project you typed it in against your computer's.
3. **It opens an update session for each one behind**, your computer first. The session reads what changed, and writes one form like the setup's.

A line you added to a file Flow wrote is kept. The form lists it under `Your own lines, kept`, ticked, so you can drop it. Quit and start `claude` again once the session ends.

## Take Flow off

Flow saves an original twice: once for your computer at its first install, and once for each project at its first `flow init`. Nothing is added to an original after that, so it is for deciding against Flow in the first weeks. A file you made since stays yours. Nothing in `~/.flow/` is saved, so putting an original back leaves your notes and tickets alone.

- **`flow restore project`** puts back the project you are in.
- **`flow restore machine`** puts back your computer, and offers each project in the same form. The `flow` command goes with it.
- **`flow uninstall`** puts back your computer and every project, then deletes `~/.flow/` and Flow's code. Work in `~/.flow/` that `flow sync` has not backed up stops it. Your `flow-home` repository on GitHub stays.

Each command writes `~/.flow/restore.md`, one box per path, and waits for you to type `restore` or `uninstall`:

```md
## Flow's files in ~/code/shop

- [x] `.flow/`: deleted, with every ticket in it. Tickets sent to GitHub stay on the project's flow branch.
- [x] `.gitignore`: deleted. It was not there before Flow.
- [x] `.claude/skills/shop-7/`: deleted. Flow wrote it to list one of your tickets.

## What ~/code/shop knows

These work without Flow: Claude Code reads AGENTS.md on its own.

- [ ] `AGENTS.md`: deleted. It was not there before Flow.
- [ ] `CLAUDE.md`: deleted. It was not there before Flow.
```

Untick a path to keep it as it is now. Change only the box: anything else on the line stops the command, with nothing changed. Only you can run these 3: [Commands](reference/commands.md#taking-flow-off) lists the locks that stop an agent.
