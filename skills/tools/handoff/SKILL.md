---
name: handoff
description: 'Hands work to a session that was not here: a restart, another session or model, or a subagent. Writes the state of each ticket and files what the conversation taught.'
---

# Handoff

The next session knows the repo and nothing about this conversation.

One test decides every line: would that session get it wrong without it? Whether it mattered here decides nothing.

Where the work continues sets the steps:

- **Here, after a restart** → steps 1 to 4, then 6.
- **Another session or model** → steps 1 to 6.
- **A session that reports back, or a subagent starting now** → `references/dispatch.md` alone.

## 1. Pick where the state goes

- **Working a ticket** → `## State` at the bottom of that ticket's `ticket.md`. Each ticket this session worked gets its own.
- **Work with no ticket** → `flow new "…" --body -`, then `flow start <id>`. The body: one paragraph on the job and why, a `## Done when`, then `## State`.

A sentence from the user counts as state: a constraint, a correction, a leaning not yet locked.

## 2. Write `## State`

Write it once, at the handoff, never during the work.

Write only what no other part of the ticket holds:

- **The body and `## Done when`** hold why the work exists and what finishes it.
- **`## Decisions`** holds each decision with its reason. `## Questions` holds the open ones.
- **`## Tasks`** holds the steps and which are done.
- **The research report** holds its findings, wherever `/flow:research` filed it.

3 labels:

- **Now**: half-done, broken, half-applied, or running this second.
- **Found**: what cost real effort to learn and lives in no file. The version that mattered, the exact payload, the trap already hit.
- **Open**: decisions half-made, threads nobody closed, the option you lean toward and why.

A later handoff rewrites `Now` whole. `Found` and `Open` keep every line still true. A line goes when its question closes or its fact is filed elsewhere.

A build fills `Now` and `Found`, a design `Now` and `Open`, a bug all 3. A fat section means `## Tasks` carries too little.

## 3. Update the rest of the ticket

Add a line to `## References` for anything this session read that the next session needs.

Change `## Done when` only when a skill re-decides what the ticket is.

## 4. Capture the conversation

Run it when this conversation ends here: a restart replaces it, or all remaining work moves to another session or model. Skip it when part of the work stays here, and for a subagent's brief. Unclear → run it.

1. **Start after the last quote list in this conversation.** None → the first message.
2. **Walk the user's messages to the last, in your visible turn.** Never in thinking. For each message that corrects, decides, sets something aside, leaves it undone, or shows irritation or doubt, write one line: their words in quotes, the route, the file. A user still unhappy after a fix is one issue ticket, never waiting for a repeat: `flow new "<the area>: <what the user rejected>" --label flow-issue,rework-loop`.

   ```text
   "never write kind in a field name" → a correction → ~/.flow/notes/never-write-kind-in-a-field-name.md
   "we'll do the board page after release 1" → work left undone → `## Tasks` of fw-16
   ```

3. **File each line by `file-by-type` in `## Capture`.** A line with no written file is a skipped line.
4. **File what you learned about your own work** from the same pass: tool lessons, failed attempts, mistakes, procedures done before.

## 5. Write the handoff file when the work moves

Only for work continuing in another session or model. Write none where the tickets hold everything.

The file is `.flow/handoffs/<name>.md`, named for the work and written once. The mod deletes it after the new session reads it. It holds only what fits no ticket:

- the order of the next work across tickets
- mixed work, such as research or a test to run
- the question waiting on the user
- the skills to continue in

## 6. End the reply

Open with the full path of each file written. Then end by where the work continues:

- **Here, after a restart** → end with the paths alone. The start message follows `references/start-message.md`, which the mod hands over.
- **Another session or model** → end with what the user types there: the ticket's skill (`/exp-47`) if applies, then each skill the work needs (`/flow:groundwork`, `/flow:execute`, etc.). Write it by `references/start-message.md`, at the length the work needs.

  - **Run `flow <id>` first.** Fix a status that no longer matches where the work stands.
  - **Several tickets** → the one to continue first.
  - **A handoff file** → its path after them.
  - **A helper agent still running** → put `Wait for the helper's finished notice, then type:` above them. The notice and its change record arrive in this session.

## Rules

- **Write what is true now.** A decision made out loud and written nowhere is state. Never replay the session.
- **Write at a clean point.** Finish the task, land the edit, run the verification, then write. No room for that → describe the half-state.
- **Name a path only for a file the next session must open.** Write out what you wrote there. Drop the path of any file it must not act on.
- **Verify every path before writing it.** Never write into a section another skill owns.
