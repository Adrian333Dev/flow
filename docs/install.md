# Install

Put Flow on your computer, keep it up to date, and take it off again.

## Table of contents

- [What you need](#what-you-need): the programs Flow calls, and the systems it runs on
- [Install Flow](#install-flow): the line to paste, and what it does
- [The setup session](#the-setup-session): how Flow fits itself around what your computer already holds
- [Update Flow](#update-flow): bring your computer and projects up to the newest Flow
- [Take Flow off](#take-flow-off): put back what Flow changed, or remove it

## What you need

- **Linux, macOS, or Windows through WSL.**
- **`git`, `node`, `gh`**, GitHub's command-line tool, and **Claude Code 2.1.287 or later.** Flow never installs them.
- **A GitHub account**, where Flow keeps a private backup of your Flow home.

`flow doctor --prereq` checks them.

## Install Flow

```sh
curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/main/install.sh | bash
```

The line downloads Flow into `~/.flow/repos/flow/` and runs `flow install`. Already downloaded it yourself? Run `node <clone>/scripts/flow.js install`.

`flow install` then:

1. **Signs `gh` in to GitHub**, with a token where the browser sign-in fails, as it often does on WSL.
2. **Asks this computer's name**, such as `pc-wsl`. Your other computers know it by this name.
3. **Connects your Flow home**, `~/.flow/`, where Flow keeps your rules, notes, settings and tickets. The first computer creates a private GitHub repository for it, `flow-home`, and the next ones download it: [Sync between computers](sync.md).
4. **Saves a copy of every file it is about to change**, so [`flow restore`](#take-flow-off) can put it back.
5. **Links Flow's skills, rules and scripts into place**: [Files](reference/files.md) lists them.
6. **Opens the setup session.**

A failed check stops the install before anything is made, and says what to fix. Running `flow install` again is always safe.

## The setup session

A Claude Code session that reads what your computer already holds: your `~/.claude/CLAUDE.md`, skills, plugins and `~/.claude/settings.json`. It writes every change into one form, `migration.md`, and stops. Nothing outside `~/.flow/` changes before you approve the form.

Your choices come first. A ticked box goes ahead, and an unticked one leaves that thing as it is:

```md
## ❌ Removed: works against Flow's rules

- [x] **tdd** skill: deleted. It plans and tests every change, which Flow's steps already do.

## ⏸️ Switched off, except in the projects that use it

- [x] **supabase** plugin: knows the Supabase database service. Switched off everywhere, and `flow init` switches it on in a project that uses it.
```

Under them, `✅ Set up with no choice` lists what Flow sets up whatever you tick, and the form ends with every file it changes.

A plugin only some projects use costs context everywhere else, so the form switches it off, and each project switches it back on: [New project](new-project.md#a-folder-that-already-has-files).

After your yes, the session writes your rules to `~/.flow/CLAUDE.md`, from Flow's template and your old rule files. `~/.claude/CLAUDE.md` becomes a link to that file, and Flow's keys go into `~/.claude/settings.json` beside yours.

- **Claude Code asks once before editing its own settings.** Answer **allow Claude to edit its own settings for this session**.
- **`flow` refuses most commands** until the setup finishes. `flow install` again carries a stopped setup on.

Quit and start `claude` again once it ends, then run [`flow doctor`](reference/commands.md#flow-doctor) to check the install.

## Update Flow

A session tells you when your computer is behind. Then type, in a terminal:

```console
$ flow update
Flow was already at its newest commit.
Flow is up to date: this machine is at entry 1, and so is ~/code/shop.
```

It downloads the newest Flow, then opens an update session for your computer and for the project you are in, where either is behind. Each session writes a form like the setup's. A line you added to a file Flow wrote is kept. Start `claude` again once it ends.

## Take Flow off

Flow saved your files as they were before it: your computer's at the first install, each project's at its first `flow init`. Your notes and tickets in `~/.flow/` are never touched by a restore.

- **`flow restore project`** puts back the project you are in.
- **`flow restore machine`** puts back your computer, and offers each project too.
- **`flow uninstall`** puts back your computer and every project, then deletes `~/.flow/` and Flow. It refuses while `~/.flow/` holds work `flow sync` has not backed up. Your `flow-home` repository on GitHub stays.

Each writes `~/.flow/restore.md`, one box per path, and waits for you to type `restore` or `uninstall`:

```md
- [x] `.flow/`: deleted, with every ticket in it. Tickets sent to GitHub stay on the project's flow branch.
- [ ] `CLAUDE.md`: deleted. It was not there before Flow.
```

Untick a path to keep it as it is now. Only you can run these 3 commands: [Commands](reference/commands.md#taking-flow-off).
