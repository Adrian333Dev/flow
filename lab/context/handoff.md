# Handoff

Written 2026-09-30, after `flow init`'s session rule and the project's `AGENTS.md` template were built. Read this once, then rewrite it whole next time.

## Where things stand

The final sweep is on pass 1, the walk: `lab/backlog/before-beta.md`, item 1. Round 2 is the second walk on paper. It reads and reasons, and runs no live session and no `try.sh`. The user wants no commit suggestions. Nothing is committed.

**Built today, all 221 tests passing:**

- **`flow init` decides the setup session in 3 cases.** A file telling an agent how to work here (`CLAUDE.md`, `AGENTS.md`, anything under `.claude/`, `.mcp.json`, `.cursorrules` and the like) → the session opens, with no question. Any other file, or Claude Code's memory for the folder → `Read them in a setup session first? (y/N)`, with the template the default and the answer with no terminal. An empty folder → the template. The user reversed the earlier rule, a session wherever there is code: only the user can tell a project from scratch code, and a competing rule file can only be sorted by reading it.
- **`-y` answers the question.** The user's choice, the letter `npm init -y` and `apt -y` use. `lib/cli.js` reads a flag declared `letter: true` after one dash, with no two-dash form. `references/cli-design.md` → `## Flags` records the exception. `-y` in an empty folder writes the template and names `/flow:groundwork`: the setup session asks the user nothing, so it has nothing to do there.
- **The project's `AGENTS.md` starts with 2 sections**, each a placeholder comment in `project-template/AGENTS.md`: `## Project` and `## Rules` (corrections true here alone, on the second sign). The agent decides what else goes in. `home/AGENTS.md` → `## Capture` routes a fact most sessions need there, and `docs/context/` keeps what only some work needs.
- **The skills ticket lives in the setup file alone**, `scripts/flow/setup/project.md`. The user rejected putting it in capture or in `/flow:groundwork`. A project that took the template gets none.
- **`chase-a-failed-command`** in `home/AGENTS.md` → `## Scripts`: a failed `flow` or `util` command gets its reason checked, fixed where the fix lies in the project, and handed to the user with its fix otherwise.

## How the user wants this work done

- Reuse what exists. The setup file already held the skills ticket; proposing a new home for it was rejected hard.
- Match the conventions the user names. They asked for `-y`, and a proposed `--yes` was rejected hard.
- Keep `home/AGENTS.md` → `## Capture` to routing alone, and give the agent room to decide. A line stays only where the agent would do worse without it.

## Next

Round 2 walks the 10 areas the sweep only name-checked: `/flow:research`, `/flow:visualize`, `/flow:file-findings`, `/flow:tickets-from-spec`, `/flow:review`, `flow audit`, `flow cases`, `flow restore`, `flow uninstall`, `flow update`. Report each finding with file:line and a proposed fix. Fix nothing without the user's yes.

## Watch in the beta

- **`flow init`'s push check is a dry run**, tested only against a missing remote folder. Whether GitHub refuses a dry run from someone signed out, or without write access, is unchecked.
- **Whether `claude plugin list`, run from inside the safe-mode setup session, still lists synced plugins.** The docs do not say.

## Open findings, only if `try.sh` survives pass 2

- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
