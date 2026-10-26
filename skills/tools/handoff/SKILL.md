---
name: handoff
description: 'Hands work to a session that was not here: another session or model, or a subagent. Brings the ticket up to date and files what the conversation taught.'
---

# Handoff

The next session knows the repo and nothing about this conversation. It continues from the ticket's 2 files: `ticket.md`, the index, and `context.md`, one section per question or task.

One test decides every line: would that session get it wrong without it? Whether it mattered here decides nothing.

Where the work continues sets the steps:

- **Another session or model** → steps 1 to 3.
- **The capture alone** → step 2, when the user asks for it alone.
- **A session that reports back, or a subagent starting now** → `references/dispatch.md` alone.

## 1. Bring the ticket up to date

The work already wrote both files as it went. Fill what it missed, in each ticket this session worked, by `~/.flow/references/write-tickets.md`:

- **A decision made out loud and written nowhere** → its line in `ticket.md`, and its section in `context.md`.
- **What cost real effort to learn**: the version that mattered, the exact payload, the trap already hit → the section of the question or task it belongs to.
- **Half-done, broken, or running this second** → the section of its task. A thread nobody closed, and the option you lean toward → the section of its question.
- **A file the next session needs** → a line in `## References`.

A sentence from the user counts: a constraint, a correction, a leaning not yet locked.

Change `## Done when` only when a skill re-decides what the ticket is.

**Work with no ticket** → `flow new "…" --body -`, then `flow start <id>`. The body: one paragraph on the job and why, and a `## Done when`. Then fill its `context.md` by the list above.

## 2. Capture the conversation

Run it when this conversation ends here: all remaining work moves to another session or model. Run it alone when asked. Skip it when part of the work stays here, and for a subagent's brief. Unclear → run it.

1. **Start after the last quote list in this conversation.** None → the first message.
2. **Walk the user's messages to the last, in your visible turn.** Never in thinking. For each message that corrects, decides, sets something aside, leaves it undone, or shows irritation or doubt, write one line: their words in quotes, the route, the file. A user still unhappy after a fix is one issue ticket, never waiting for a repeat: `flow new "<the area>: <what the user rejected>" --label flow-issue,rework-loop`.

   ```text
   "never write kind in a field name" → a correction → ~/.flow/notes/never-write-kind-in-a-field-name.md
   "we'll do the board page after release 1" → work left undone → `## Tasks` of fw-16
   ```

3. **File each line by `file-by-type` in `## Capture`.** A line with no written file is a skipped line.
4. **File what you learned about your own work** from the same pass: tool lessons, failed attempts, mistakes, procedures done before.

## 3. End the reply

Open with the full path of each file written. Then end with what the user types in the other session or model: the ticket's skill (`/exp-47`) if applies, then each skill the work needs (`/flow:groundwork`, `/flow:execute`, etc.). Write it by `references/start-message.md`, at the length the work needs.

  - **Run `flow <id>` first.** Fix a status that no longer matches where the work stands.
  - **Several tickets** → the one to continue first, and the order of the rest.
  - **A helper agent still running** → put `Wait for the helper's finished notice, then type:` above them. The notice and its change record arrive in this session.

## Rules

- **Write what is true now.** Never replay the session.
- **Write at a clean point.** Finish the task, land the edit, run the verification, then write. No room for that → describe the half-state in the task's section.
- **Name a path only for a file the next session must open.** Drop the path of any file it must not act on.
- **Verify every path before writing it.** Never write into a section another skill owns.
