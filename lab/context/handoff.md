# Handoff

Written 2026-09-30, after round 2 of the final sweep walked its 10 areas. Read this once, then rewrite it whole next time.

## Where things stand

The final sweep is `lab/backlog/before-beta.md`, item 1. Round 2 walks on paper: it reads and reasons, and runs no live session and no `try.sh`. The user wants no commit suggestions, and commits themselves. All 221 tests pass.

Round 2 walked `/flow:research`, `/flow:visualize`, `/flow:file-findings`, `/flow:tickets-from-spec`, `/flow:review`, `flow audit`, `flow cases`, `flow restore`, `flow uninstall` and `flow update`. Research, visualize, tickets-from-spec, cases and update came out clean.

## Next: build the 4 approved fixes

The user approved all 4 on 2026-09-30. One approval runs to the end: build, tests, every stale record, the writing pass.

1. **`flow uninstall` checks `~/.flow/` before deleting it.** `scripts/flow/commands/uninstall.js:117` deletes the folder with no check, while the clone gets `cloneHolds()` at `:51`. Run the same check on `at.flow` before the confirmation. Uncommitted changes or unpushed commits → stop before anything runs, and name `flow sync`. Add a test beside the uninstall tests.
2. **`/flow:review` updates the audit index as it loads.** The user's idea: put `` !`flow audit index --quiet 2>&1 || true` `` near the top of `skills/dev/review/SKILL.md`, the way `skills/tools/start/SKILL.md:8` runs `flow get`. A stale index silently leaves out recent sessions, and `flow audit sessions` opens it read-only, so it never updates on its own.
3. **`flow restore` lists every path in its prompt.** `scripts/flow/commands/restore.js:79` (machine) and `:114` (project) print a count alone. List each path with what happens to it (`deleted`, `put back`), marked `changed since` where the path now differs from the original: exists now where it was `absent`, or its content differs from the copy under `files/`. Example agreed:

   ```text
   Puts 7 paths in ~/code/shop back as they were before Flow.
     AGENTS.md          deleted, changed since
     .flow/             deleted
     .gitignore         put back
   ```

4. **`/flow:file-findings` routes project facts like capture.** `skills/tools/file-findings/SKILL.md:45` becomes: project fact most sessions need → the project's `AGENTS.md`. One only some work needs → `docs/context/<subject>.md`. `skills-docs-move-together` does not fire: the rule sits in the skill, not in `docs/dev/skills.md`.

Left as it is, by recommendation with no objection: study cases and workflow notes keep verbatim output and the project name, though they go to GitHub.

After the build: record round 2 and its fixes in `lab/backlog/before-beta.md` item 1 and `lab/context/state.md`. Then pass 2 of the sweep: discuss `try.sh` and the practice projects with the user before any delete.

## How the user wants this work done

- Reuse what exists. A proposal to move the setup file's skills ticket elsewhere was rejected hard.
- Match the conventions the user names. They asked for `-y`, and a proposed `--yes` was rejected hard.
- Keep `home/AGENTS.md` → `## Capture` to routing, and give the agent room to decide. A line stays only where the agent would do worse without it. The project's `AGENTS.md` template now holds `## Project` and `## Rules` alone.
- Where a skill must run a command every time, run it as the skill loads (`` !`…` ``) rather than asking the agent to.

## Watch in the beta

- **`flow init`'s push check is a dry run**, tested only against a missing remote folder. Whether GitHub refuses a dry run from someone signed out, or without write access, is unchecked.
- **Whether `claude plugin list`, run from inside the safe-mode setup session, still lists synced plugins.** The docs do not say.

## Open findings, only if `try.sh` survives pass 2

- **The practice project's code was never committed.** `try.sh` builds `expense-tracker` with all its code untracked.
- **A `try.sh` build that fails partway leaves a run `--fresh` cannot clear.** The run has no `seed` file yet, so it has to be deleted by hand.
