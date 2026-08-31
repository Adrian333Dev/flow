# Flow

> **Work in progress.** Under active development, and nothing here is stable.

A Claude Code workflow for a solo developer: rules that load in every session, a set of skills covering brainstorm through execution, and a small scaffold for a new project. Written for and tested with Claude Code alone.

**One install per machine serves every directory.** The rules and the skills load whether or not there is a project, because most thinking happens before a repo exists. A project then adds only what varies — its name, its stack, and the rules its own spec implies.

- `home/` — what installs into `~/.claude/`: the rules every session loads, and the settings behind them
- `scripts/` — the command-line tools, `flow` first among them
- `skills/` — every skill, filed by group
- `project-template/` — what a new project starts with

**Installing is undocumented.** The manual belongs in `docs/manual/`, which is designed and unwritten.
