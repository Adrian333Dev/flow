# presence

Read 2026-10-04 from `repos/tools/presence/`. 7 stars, Apache 2.0. A Claude Code plugin with 6 hooks, all local:

- **Notes per repository**, built and reused by the agent
- **What happened to the agent's commits**: a revert, an amend or a closed pull request, shown to the next session
- **Events between turns**: a test that failed or a file that changed, shown at the next prompt
- **A check on "done"**: the `Stop` hook reads the reply for "fixed", "done" or "works", and warns when no test or build ran after the last edit

## Against Flow

**Flow never checks the main session's claims.** `changes.js` records every edit, and nothing compares a "done" against a test run after it. The README's "subagent work verified" covers subagents alone.

## What Flow could take

**The check on "done"**, as a warning, never a block: the reply says the work is done or fixed, and no test ran after the last edit. `lab/backlog/after-v1.md` → the claim check item.

The commit watch fits Flow less: the user commits, so the agent's own commits never exist.
