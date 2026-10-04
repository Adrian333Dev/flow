# Dippy

Read 2026-10-04 from `repos/tools/dippy/`. About 240 stars, MIT. A `PreToolUse` hook that approves safe shell commands by parsing them with its own bash parser, and asks before destructive ones.

**It solves the problem Flow solved the other way.** Dippy approves what it can prove safe. Flow allows every command since 2026-09-28 and asks only before 5 kinds of harm. Both end the stream of permission prompts.

**A deny can carry advice**, such as `deny rm -rf "Use trash instead"`, so the agent tries the better command instead of stopping. Flow's guard already gives a one-sentence reason.

## What Flow could take

**Its tests, as cases for Flow's guard.** Between Dippy and its parser, 14,000 tests. Flow's guard has never met a live session. `lab/backlog/after-v1.md` → the guard test item.
