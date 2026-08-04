# Flow

> **Work in progress.** Under active development, not finalized.

A Claude Code workflow for solo developers: session rules that load in every directory, a set of skills covering the loop from brainstorm to execution, and a small scaffold for new projects.

> Written for and tested with Claude Code only.

## How it's put together

Flow installs **once per machine**, not once per project. The rules live at `~/.claude/CLAUDE.md`, the scripts at `~/.claude/scripts/`, the skills at `~/.claude/skills/` — all of which Claude Code loads in every session, in every directory, whether or not there's a project. That matters because most thinking happens before a repo exists.

A project then adds only what actually varies: its name and stack, and the rules its spec implies.

| Path | What it is |
|---|---|
| `global/` | what gets installed into `~/.claude/` — rules, settings, scripts |
| `skills/` | every skill, symlinked into `~/.claude/skills/` |
| `project-template/` | the two-and-a-bit files a new project starts with |

## Setup — once per machine

```bash
git clone https://github.com/Adrian333Dev/flow ~/code/flow
cd ~/code/flow

# 1. skills
bash global/scripts/link-skills.sh

# 2. scripts
ln -sfn ~/code/flow/global/scripts ~/.claude/scripts

# 3. rules — copied, not linked: this one becomes yours
cp -n global/CLAUDE.md ~/.claude/CLAUDE.md
```

Then fill in `## The user` and `## Preferences` in `~/.claude/CLAUDE.md`. That copy is personal from here on; if you want it backed up, track `~/.claude/` in a private repo of your own.

Last, merge `global/settings.json` into `~/.claude/settings.json` by hand — it carries the permission rules, the `PreToolUse` guard hook, and a few feature flags. `global/settings.md` explains every key. It is merged rather than copied because your global settings hold personal things (model, effort level, plugins) that Flow shouldn't own. **Restart Claude Code afterwards**; settings load at startup.

Merge it whole. The permission rules are one design: shell commands run without prompting, a deny list blocks git mutations outright, and `guard.py` catches the dangerous shell a deny list can't enumerate. Taking the permissions without the hook removes most of what's holding the line.

*(`setup-flow-globals` will automate all of the above. Not built yet.)*

## Starting a new project

Copy the scaffold in, then fill `## Project`:

```bash
cp -r ~/code/flow/project-template/. .
```

That's a `CLAUDE.md` with `## Project` and `## Project rules`, a `.gitignore` for `tmp/`, and an empty `docs/work/backlog.md`. Everything else you need is already global.

For an existing codebase with its own docs and conventions, `migrate-to-flow` handles the conversion. *(Not built yet.)*

## Scripts

- `tree.sh` — filtered project tree: `bash ~/.claude/scripts/tree.sh [path] [--depth N] [--except pattern]`
- `merge-files.js` — merge files or line ranges into one blob for large reads
- `link-skills.sh` — re-link `skills/` into `~/.claude/skills/` after adding or renaming one
- `guard.py` — the `PreToolUse` hook: blocks privileged commands, pipe-to-shell and git mutations, and escalates dependency installs and out-of-repo deletes to a prompt. Never run by hand.
