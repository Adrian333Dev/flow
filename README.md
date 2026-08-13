# Flow

> **Work in progress.** Under active development, not finalized.

A Claude Code workflow for solo developers: session rules that load in every directory, a set of skills covering the loop from brainstorm to execution, and a small scaffold for new projects.

> Written for and tested with Claude Code only.

## How it's put together

Flow installs **once per machine**, not once per project. The rules live at `~/.claude/CLAUDE.md`, the scripts at `~/.claude/scripts/`, the skills at `~/.claude/skills/` — all of which Claude Code loads in every session, in every directory, whether or not there's a project. That matters because most thinking happens before a repo exists.

A project then adds only what actually varies: its name and stack, and the rules its spec implies.

- `global/` — what gets installed into `~/.claude/`: rules, settings, scripts, reference files
- `skills/` — every skill, symlinked into `~/.claude/skills/`
- `commands/` — no slash commands ship today. `link.sh` still links this folder when one appears
- `project-template/` — the two-and-a-bit files a new project starts with

## Setup — once per machine

```bash
# --recurse-submodules matters: toolbox is a submodule and comes down empty without it
git clone --recurse-submodules https://github.com/Adrian333Dev/flow ~/code/flow
cd ~/code/flow

# 1. skills, commands, agents
bash global/scripts/link.sh

# 2. the scripts folder, for the files referenced by path
ln -sfn ~/code/flow/global/scripts ~/.claude/scripts

# 3. the four PATH commands — the link drops the extension (~/.local/bin must be on PATH)
mkdir -p ~/.local/bin
ln -sfn ~/code/flow/global/scripts/ptree.sh    ~/.local/bin/ptree
ln -sfn ~/code/flow/global/scripts/fmerge.js   ~/.local/bin/fmerge
ln -sfn ~/code/flow/global/scripts/gsave.sh    ~/.local/bin/gsave
ln -sfn ~/code/flow/global/scripts/flow/flow.js ~/.local/bin/flow

# 4. Flow's own folder — reference files and the tool catalog, at paths that
#    don't depend on where you cloned flow
mkdir -p ~/.claude/flow
ln -sfn ~/code/flow/global/refs ~/.claude/flow/refs
ln -sfn ~/code/flow/toolbox     ~/.claude/flow/toolbox

# 5. rules — copied, not linked: this one becomes yours
cp -n global/CLAUDE.md ~/.claude/CLAUDE.md
```

Every script lives once, in `global/scripts/`, and keeps its extension there so you can see what runs it. Steps 2 and 3 are two ways to reach the same files — a folder link for the ones named by path, per-file links for the ones you type. Symlinks throughout, so editing the repo changes the command with no reinstall step.

Step 4 exists so the rules can name fixed paths. `~/.claude/flow/` is the one folder under `~/.claude/` that Flow owns and Claude Code does not read — nothing in it loads on its own, which is what makes it the right home for material the rules point at rather than carry. It holds pointers into this repo (`refs/`, `toolbox/`) alongside Flow's own output, which lands there on first write: `notes.md`, and `study-cases/`. **The repo is never cloned into it** — it stays wherever you put it, and `setup-flow-globals` will run from there. `toolbox` is its own repo, pinned here as a submodule; `git submodule update --remote toolbox` pulls newer entries.

Then fill in `## The user` and `## Preferences` in `~/.claude/CLAUDE.md`. That copy is personal from here on; if you want it backed up, track `~/.claude/` in a private repo of your own.

Last, merge `global/settings.json` into `~/.claude/settings.json` by hand — it carries the permission rules, the `PreToolUse` guard hook, and a few feature flags. `global/settings.md` explains every key. It is merged rather than copied because your global settings hold personal things (model, effort level, plugins) that Flow shouldn't own. **Restart Claude Code afterwards**; settings load at startup.

Merge it whole. The permission rules are one design: shell commands run without prompting, a deny list blocks git mutations outright, and `guard.js` catches the dangerous shell a deny list can't enumerate. Taking the permissions without the hook removes most of what's holding the line.

*(`setup-flow-globals` will automate all of the above. Not built yet.)*

## Starting a new project

Copy the scaffold in, then fill `## Project`:

```bash
cp -r ~/code/flow/project-template/. .
```

That's a `CLAUDE.md` with `## Project` and `## Project rules`, and a `.gitignore` for `tmp/`. Nothing else — every `docs/` path is created on first write by whatever needs it, so a new project starts with two files rather than a tree of empty scaffolding.

For an existing codebase with its own docs and conventions, `migrate-to-flow` handles the conversion. *(Not built yet.)*

## Scripts

Four are commands on `PATH`, called by name from anywhere:

- `ptree` (`ptree.sh`) — filtered project tree: `ptree [path] [--depth N] [--except pattern]`
- `fmerge` (`fmerge.js`) — merge files or line ranges into one blob for large reads
- `flow` (`flow/flow.js`) — tickets: `flow next`, `flow start <id>`, `flow build <id>`, `flow tree`, `flow ls`, `flow ticket new "…"`. Also `flow study-case …`, which records study cases under `~/.claude/flow/` — the one group that works outside a project
- `gsave` (`gsave.sh`) — `git add` + `commit` + `push` in one command. Nothing else; anything git can already do stays a git command. User-run only.

Two are referenced by path, never typed:

- `link.sh` — re-link `skills/`, `commands/` and `agents/` into `~/.claude/` after adding or renaming one
- `guard.js` — the `PreToolUse` hook: blocks privileged commands, pipe-to-shell and git mutations, and escalates dependency installs and out-of-repo deletes to a prompt. Never run by hand.
