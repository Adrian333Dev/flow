# Developing Flow

Flow is a Claude Code workflow for a solo developer: rules that load in every session, a set of skills, and a small scaffold for a new project. This folder is about changing Flow itself: the repository, the scripts, the skills, and the install. For what Flow is, see the [main README](../../README.md).

## Table of contents

- [The pages](#the-pages)
- [Flow installs by symlink](#flow-installs-by-symlink)
- [flow install builds it, and takes a flag per root](#flow-install-builds-it-and-takes-a-flag-per-root)
- [Two files become yours, and stop tracking the repository](#two-files-become-yours-and-stop-tracking-the-repository)
- [util is a second tool, and Flow depends on it](#util-is-a-second-tool-and-flow-depends-on-it)

## The pages

- [The repository layout](layout.md): what is in every folder, and where a new file goes
- [The two checkouts](checkout.md): how to edit Flow safely when real projects depend on it
- [The scratch session](scratch-session.md): running a change without installing it
- [The tests](tests.md): two suites, no dependencies
- [Adding a skill](skills.md): one folder, one group, no list to update

## Flow installs by symlink

One clone of this repository holds every file. Installing creates symlinks: names on your machine that point at files in that clone. Editing a file in the clone changes the installed workflow immediately, in every project and in every session already open. Nothing is copied except [two files that become yours](#two-files-become-yours-and-stop-tracking-the-repository).

The install creates two directories, and the split between them tells you what each one is for:

- **`~/.claude/`** holds what Claude Code reads: `CLAUDE.md` (the rules), `settings.json` (the hooks, permissions, and feature flags), `skills/` (one symlink per skill), and `agents/` (one symlink per agent definition)
- **`~/.flow/`** holds what only Flow reads: `scripts/` (the CLI and the hooks), `references/` (the house style and workflow docs), `settings.json` (the git-writes state), `workflow-notes.md`, and `study-cases/`

A project has the same pair for the same reason. `.claude/` carries its settings and any external skill. `.flow/` carries its tickets, groundwork, inbox, and handoff.

## `flow install` builds it, and takes a flag per root

```bash
node <clone>/scripts/flow/flow.js install
```

Run it by path the first time, because `flow` is not a command until that run has made it one. The install links every skill and agent into `~/.claude/`, links `scripts/` and `references/` into `~/.flow/`, and puts `flow` and `fw` on your `PATH` in `~/.local/bin/`. After that first run, the command is `flow install`.

`--home <path>` moves where the Claude Code files go. `--flow-home <path>` moves where the Flow files go. Passing one without the other is refused, because redirecting half the install writes the other half to the real machine. [The scratch session](scratch-session.md) is what passes both, pointing everything at `tmp/`.

Skills are linked one at a time, never as a folder, and agents the same way. Both `~/.claude/` directories can hold entries that Flow did not create, and a folder-level symlink would replace all of them.

## Two files become yours, and stop tracking the repository

**`~/.claude/CLAUDE.md` is copied, then you edit it.** The copy in the repository at `home/CLAUDE.md` holds placeholders and rules. Your copy holds your name, your machine, and your preferences. `flow install` writes it only when it is absent, so a re-run never replaces your version. The cost is that a rule added to the template later does not reach anyone who already installed: carry it across by hand.

**`~/.claude/settings.json` is never written at all.** `flow install` prints the file you need to merge and stops. Your settings hold your model, your effort level, and your plugins, and merging Flow's permission rules and hooks into that is a judgment call. `home/settings.md` explains every key Flow contributes.

## `util` is a second tool, and Flow depends on it

`util` is a separate command-line tool that dispatches general-purpose commands: `util fs tree` prints a directory structure, `util git save` commits and pushes, `util github clone` clones a repository. It is its own repository, included here as a submodule at `lab/util/`, and it installs on a machine that never wanted Flow.

Flow's rules name `util fs tree` for looking at directory structure, and `flow open` runs `util fs merge` to assemble context files. A machine without `util` still works: `flow open` prints "util is not on PATH" where the files would have been, and carries on. Install `util` first anyway.

```bash
node <util-clone>/util.js install
```

That links `util` and `u` onto your `PATH` and registers the repository's own `commands/` as a source. `lab/util/README.md` is its documentation.
