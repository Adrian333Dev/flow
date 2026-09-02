# Developing Flow

Flow is a Claude Code workflow for a solo developer: rules that load in every session, a set of skills, and a small scaffold for a new project. This folder is about changing Flow itself. `docs/manual/` is about using it.

- [The pages](#the-pages) — what is in this folder
- [Flow installs by symlink](#flow-installs-by-symlink) — one clone, and what points at it
- [`flow install` builds it](#flow-install-builds-it-and-takes-a-flag-per-root) — and takes a flag per root
- [Two files become yours](#two-files-become-yours-and-stop-tracking-the-repository) — and stop tracking the repository
- [`util` is a second tool](#util-is-a-second-tool-and-flow-depends-on-it) — and Flow depends on it

## The pages

- [The repository layout](layout.md) — what is in every folder, and where a new file goes
- [The two checkouts](checkout.md) — where you edit, and why there are two of them
- [The scratch session](scratch-session.md) — running a change without installing it
- [The tests](tests.md) — two suites, no dependencies
- [Adding a skill](skills.md) — one folder, one group, no list to update

## Flow installs by symlink

One clone holds every file. Installing points names at that clone, so editing a file changes the installed workflow immediately — in every project, and in every session already open. Nothing is copied except [two files that become yours](#two-files-become-yours-and-stop-tracking-the-repository).

Two directories hold the result, and the split tells you without opening either one whether deleting it breaks Claude Code or loses your work:

- **`~/.claude/`** holds what Claude Code reads: `CLAUDE.md`, `settings.json`, `skills/` and `agents/`
- **`~/.flow/`** holds what only Flow reads: `scripts/`, `references/`, `settings.json`, `workflow-notes.md` and `study-cases/`

A project has the same pair for the same reason. `.claude/` carries its settings and any external skill; `.flow/` carries its tickets, groundwork, inbox and handoff.

## `flow install` builds it, and takes a flag per root

```bash
node <clone>/scripts/flow/flow.js install
```

Run it by path the first time, because `flow` is not a command until that run has made it one. It links every skill and agent into `~/.claude/`, links `scripts/` and `references/` into `~/.flow/`, and puts `flow` and `fw` in `~/.local/bin`. After that it is `flow install`.

`--home <path>` moves what Claude Code reads and `--flow-home <path>` moves what Flow reads. **Passing one without the other is refused**, because a redirect covering half the install writes the other half to the real machine. [The scratch session](scratch-session.md) is what passes both.

Skills are linked per item, never as a folder, and so are agents. Both `~/.claude/` directories hold entries Flow does not own, and a folder link would evict every one of them.

## Two files become yours, and stop tracking the repository

**`~/.claude/CLAUDE.md` is copied, then you edit it.** It holds your name, your machine and your preferences; `home/CLAUDE.md` in the repository holds placeholders and rules. `flow install` writes it only when it is absent, so a re-run never takes your version away. The cost is that a rule added to the template later reaches nobody who already installed — carry it across by hand.

**`~/.claude/settings.json` is never written at all.** `flow install` prints the file to merge and stops. Your settings hold your model, your effort level and your plugins, and merging Flow's permission rules and hook into that is a judgment call. `home/settings.md` explains every key Flow contributes.

## `util` is a second tool, and Flow depends on it

`util` dispatches the general-purpose commands you type — `util fs tree`, `util git save`, `util github clone`. It is its own repository, a submodule of Flow at `lab/util/`, and it installs on a machine that never wanted Flow.

Flow's rules name `util fs tree` for looking at structure, and `flow open` runs `util fs merge`. A machine without `util` still works: `flow open` prints `util is not on PATH` where the files would have been, and carries on. Install `util` first anyway.

```bash
node <util-clone>/util.js install
```

That links `util` and `u` in `~/.local/bin` and registers the repository's own `commands/` as a source. `lab/util/README.md` is its documentation.
