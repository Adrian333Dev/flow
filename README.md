# Flow

> **Work in progress.** This template is under active development and has not been finalized.

A Claude Code project template for solo developers. Opinionated session rules, working-docs scaffold, and utility scripts, designed to pair with the [flow-skills](https://github.com/Adrian333Dev/flow-skills) companion catalog.

> Written for and tested with Claude Code only.

## What ships

- **`CLAUDE.md`** — project instructions template: session-start rules, communication protocol, utility script docs, and hard rules. Fill in the project context section at the top when starting a project.
- **`docs/work/`** — working-docs scaffold: `backlog.md`.
- **`scripts/`** — three utility scripts:
  - `tree.sh` — filtered project tree (`bash scripts/tree.sh [path] [--depth N] [--except pattern]`)
  - `merge-files.js` — merge multiple files or line ranges into one blob for large-context reads
  - `check-skills.sh` — SessionStart hook that verifies companion skills are installed
- **`recommended-tools.md`** — catalog of optional external tools and skills.
- **`.claude/settings.json`** — git mutation deny rules.
- **`.gitignore`** — ignores `tmp/` (scratch directory for refetchable material and session artifacts).

## Companion skills

Flow pairs with the flow-skills catalog. Install it globally:

```bash
npx skills add Adrian333Dev/flow-skills
```

The `check-skills.sh` SessionStart hook checks for required skills at the start of every session and tells you exactly what is missing.

## Using this template

1. Click **Use this template** on GitHub to create a new repo with a clean git history.
2. Clone it locally.
3. Fill in the project context section at the top of `CLAUDE.md` (project name, stack, who you are).
4. Install the companion skills if you haven't already.
