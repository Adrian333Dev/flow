# Handoff

Written 2026-10-01. Read this once, then rewrite it whole next time.

## Where things stand

The restore form is built and every test passes, 230 of 230. `flow restore machine`, `flow restore project` and `flow uninstall` each write `~/.flow/restore.md`, one box per path Flow changed, and the script reads the ticks itself. `scripts/flow/lib/restore-form.js` holds the form, its strict reading, the unsent-ticket refusal and `apply()`. A project's `AGENTS.md`, `CLAUDE.md` and `docs/` start unticked. `lab/context/state.md` → `**restore**` and `docs/manual/reference.md` → `### flow restore machine and flow restore project` describe it as built. The user wants no commit suggestions, and commits themselves.

**The restore commands stay as built.** Ruled by the user 2026-10-01:

- `flow restore machine` lists the machine and every project, so it already covers restoring everything.
- `flow restore project` covers the current project alone.
- Bare `flow restore` keeps running `flow restore ls`, which only reads. A bare form with ticks set by where it runs was proposed and dropped: each of its two cases repeats one of the commands above.

## Next: pass 2 of the final sweep

`lab/backlog/before-beta.md` item 1: simplify. 3 candidates, each **talk first**, in the recommended order:

1. Split `docs/spec/decisions.md` 3 ways and delete it, after walking 3 real Delapse examples.
2. Context engineering: keep what loads small, and stop a skill loading mid-session from breaking the cache. `/skill-doctor` and `/cost` show it.
3. Whether `lab/scripts/try.sh` and the practice projects go. The `expense-tracker` board is the thing to weigh. A delete needs its own yes.

## How the user wants this work done

- Reuse what exists. A proposal to move the setup file's skills ticket elsewhere was rejected hard.
- Match the conventions the user names. They asked for `-y`, and a proposed `--yes` was rejected hard.
- Keep `home/AGENTS.md` → `## Capture` to routing, and give the agent room to decide.
- Where a skill must run a command every time, run it as the skill loads (`` !`…` ``) rather than asking the agent to.
- Judge a command by the user's intent when they type it. A command whose cases repeat existing ones goes.
- The user dictates by voice, thinks out loud, and approves with "go" or "approve". A message ending in a question is thinking.

## Watch in the beta

- **`flow init`'s push check is a dry run**, tested only against a missing remote folder. Whether GitHub refuses a dry run from someone signed out, or without write access, is unchecked.
- **Whether `claude plugin list`, run from inside the safe-mode setup session, still lists synced plugins.** The docs do not say.
- **The restore form has never met a real terminal.** Tests answer the word in process. Check the prompt reads well, and that saving the form in an editor and typing the word works as written.

## Open findings, only if `try.sh` survives pass 2

- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
