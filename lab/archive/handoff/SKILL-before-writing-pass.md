---
name: handoff
description: 'Writes what a session that was not here needs: the state itself, never a reading list.'
---

# Handoff

Write what a session that was not here needs to carry on.

It knows the repo. It knows nothing about this conversation.

**One test decides every line: would that session get this wrong without it?** Never whether it mattered here.

## 1. Pick where it goes

- **Working a ticket** → `## State` inside that ticket's `ticket.md`. Every ticket worked this session gets its own.
- **Work with no ticket** → a new ticket, `flow new "…" --type <what the work is> --body -`, then `flow build <id>` for code in progress or `flow groundwork <id>` while decisions are still open. The body: one paragraph on the job and why, then `## State`.
- **Work continuing in another session or model** → also a note, `## 5`.
- **A job for a session that reports back, or a subagent starting now** → read `references/dispatch.md` instead of the steps below.

**`## State` is written once, at the handoff**, never during the work. A sentence from the user counts as state: a constraint, a correction, a leaning they have not locked.

## 2. Write `## State`

Never restate what 4 other files carry:

- **`plan.md`** holds the steps and which ones landed.
- **`groundwork/map.md`** holds every decision and its reasoning.
- **The ticket body** holds why the work exists; `## Done when` holds what finishes it.
- **The research report** holds the findings, wherever `/flow:research` filed it.

What is left is what nobody wrote down, under 3 labels:

- **Now**: half-done, broken, half-applied, or in flight this second. Name a file only where the next session must act on it.
- **Found**: what cost real effort to learn and lives in no file: the version that turned out to matter, the exact payload, the trap already hit.
- **Open**: decisions half-made, threads nobody closed, the option you were leaning toward and why.

**A later handoff rewrites `Now` whole.** `Found` and `Open` keep every line still true. A line goes when a decision closes or a fact moves to `docs/context/`.

**Most of the time 2 fill.** A build fills *Now* and *Found*. Groundwork fills *Now* and *Open*. A bug fills all 3 and runs long. A fat section on a build ticket means the plan carries too little.

## 3. Land it

`## State` goes at the bottom of `ticket.md`, plus a line in `## References` for anything this session read that the build will need. While `map.md` is still open its own `## References` holds those, and Phase 4 splits them into the tickets it cuts.

`## Done when` moves only when a skill re-decides what the ticket is.

## 4. Capture the conversation

Run it when this conversation ends here: a restart replaces it, or all remaining work moves to another session or model. Skip it when part of the work stays in this session, and for a subagent's brief. Unclear → run it.

1. **Find where to start.** After the last quote list in this conversation. None → the first message.
2. **Walk the user's messages from there to the last, in your visible turn.** Never in thinking. For each message that corrects, decides, sets aside or leaves something undone, write one line: their own words in quotes, the route it takes, where it is filed.

   ```text
   "never write kind in a profile line" → a correction → ~/.flow/notes/never-write-kind-in-a-profile-line.md
   "we'll do the board page after release 1" → work left undone → ~/.flow/notes/board-notes-page.md
   ```

3. **File each line by `file-by-type` in `## Capture`.** A line with no file written is a line you skipped.
4. **File what you learned about your own work** (tool lessons, failed attempts, mistakes, procedures done before) from the same pass.

A quote can only come from a real message, so a skipped message shows as a missing line.

## 5. Write a note when the work moves

Only for work continuing in another session or model, and only what fits no ticket:

- the order of the next work
- work that mixes tickets
- the question waiting on the user
- the skill to continue in

The note is `.flow/handoffs/<name>.md`, named for the work and written once. Write none where the tickets hold everything.

## 6. End the reply

Open with the full path of each file written. Then end by where the work continues:

- **Here, after a restart** → end with the paths alone. The agent writes the start message when the restart begins, never here.
- **Another session or model** → end with what the user types there:

  ```text
  /flow:start /exp-47
  ```

  - **Check the status first**: `flow <id>`. `/flow:start` picks the phase from the ticket's type and status, so the status must match where the work stands.
  - **Several tickets** → the one to continue first.
  - **A note** → its path under the line. The user drags it into the new session's box.
  - **A helper agent still running** → put `Wait for the helper's finished notice, then type:` above the line. The notice and its change record arrive in this session.

  Add words after the line only for an instruction the ticket does not hold.

## Hard rules

- **Write what is true now.** Never replay the session. A decision made out loud and written nowhere is state.
- **Never write into a section another skill owns.**
- **Never restate what an existing file already holds.**
- **Write at a clean point.** Finish the task, land the edit, run the verification, then write. No room left for that → describe the half-state honestly.
- **Write out what the next session must know. A path is for a file it must open.** Never name a file whose content you wrote out here. Never name a file the session must not act on: write that sentence and drop the path.
- **Verify every path before writing it down.**
