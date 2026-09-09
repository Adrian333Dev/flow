# Handoff

## Where the work is

**The `/groundwork` audit is built, and its rough edges were corrected in a second pass.** Both landed
2026-09-09 on the user's go-ahead. 76 of 76 Flow tests pass, 31 of 31 util tests pass, `rule-check.js`
is silent, and nothing is installed, so none of it has run in a live session. `lab/context/state.md`
carries the full record and the reasoning; this file says what to do next.

## What changed, and the one rule behind it

**The artifact decides the phase, and the status is corrected to match.** A status is a claim a command
wrote; `map.md`, `plan.md` and the hunt in `## State` are what the work left behind. It binds every
phase skill, each naming its own artifact.

**The second pass moved that rule out of the skills and into the tool.** `flow get` now prints
`map: groundwork/map.md 2/4 answered` beside `plan:` and `reports:`, so every skill that is not
`/groundwork` gets the answer without opening the file, and the paragraph repeated across four skills
is gone.

- `references/workflow.md`: the general statement, plus the `open` block agent note and how
  `## References` differs from it.
- `/groundwork` `## Arriving`: branches on `map.md`, not on the status, then writes the correcting
  command and says what disagreed.
- `/execute` Phase 1: a `map:` count short of its total is groundwork that never closed.
- `/debug`: reads `## State` before step 1, resumes at the first live hypothesis.
- `/prototype`: no pickup check at all. The header already names every report.

## The `open` block belongs to `util` now

It was Flow's `flow-open`, parsed inside `flow get`. It is `util fs open <file>`, and the fence is
```` ```open ````.

- **Flow passes only a working directory.** `util fs open` resolves a path beside the named document
  first, then from its own cwd, so running it at the repo root against `ticket.md` is exactly the two
  bases a ticket needs. The `--base` flag proposed for it was never built.
- **`lab/util/` is a submodule**, so committing this is two commits in two places, both the user's.
- `lab/util/README.md` has a new `## Commands` section: every shipped command, with the block format
  under it. That section is the page a new feature gets documented on.

## What is still open

- **A brute-force guard in `transition()`**, `scripts/flow/commands/tickets.js:76`, the one place a
  status is written. It refuses a move out of `groundwork` while `map.md` has an unticked `[ ]`, beside
  the existing `unmetDeps` and `openChildren` refusals, which throw `FlowError` and take `--force`.
  **`store.mapQuestions` now exists and does the counting**, so the guard is a few lines. Still
  **additive, never a replacement** for the agent rule above. Undesigned.
- **`~/.flow/` as a git repository**, and **one state path across harnesses**. Both in `backlog.md`,
  both **talk first**.
- **`store.js:282` moves a groundwork folder with `fs.renameSync`** under a comment reading "Same
  filesystem by construction". A global-to-project move breaks that: `EXDEV`, after the ticket folder
  is already created. Unrecorded anywhere but `state.md`.

## Easy to get wrong

- **`util` is not on this machine's `PATH`.** `flow get --files` prints `unread: util fs open failed`
  and carries on. The chain was verified against a scratch `UTIL_HOME` instead.
- **A commented-out checkbox is not a checkbox.** Both templates ship their example inside an HTML
  comment, so `countBoxes` strips comments before counting. An untouched map prints no `map:` line.
- **`FLOW_PROJECT=$HOME flow new "…"` works today, with no code change.** `projectRoot()` checks only
  that the override exists, never that it is a repository.
- **Nothing global reaches `docs/`.** The user ruled it: there is no product to hold a spec, so a
  global run's `docs/` routes land under `~/.flow/`.
- **`/groundwork t042` does not work.** A long skill taking arguments makes Claude Code re-append the
  whole file. `backlog.md` has it as **talk first**.
- **Nothing in `tmp/planned-projects/` is a decision.** The user's own material, read-only, gitignored.
- **`--body` replaces the ticket template outright**, so `## Done when` exists only where the author
  wrote it.
- **`parked` has `satisfies: false`.** A parked ticket blocks its dependents until it revives.
- Nothing is installed and nothing in `skills/` loads. `bash lab/scripts/try.sh`.
- The repo `CLAUDE.md` is not `home/CLAUDE.md`. Never write personal content into this repo.

## Waiting on the user

- The 2 deletes: 3 of the 4 entries in `lab/context/shit-explanations.md`, and `repos/toolbox`.
- Item 1 of the v1 queue, the harvest of Delapse and lumacraft_v2, has not started.
- `docs/manual/` next: Reference, which is where a feature too small for its own page gets defined.
