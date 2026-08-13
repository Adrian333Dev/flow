---
name: handoff
description: ALWAYS invoke when a stretch of work closes, when context fills, or when a job needs its own session — a brainstorm resolved, a plan written, a ticket built, a prototype to run, a failure to debug in parallel. Writes the document another session works from: the state that matters, never a summary of the conversation. Two jobs — resume this work later, or assign a job to a session that reports back.
---

# Handoff

Write what the next session needs. It reads this file and nothing else.

It knows the repo. It knows nothing about this conversation.

**One test decides every line: would the next session get this wrong without it?** Not whether it mattered here. That test is the whole difference from `/compact`, which summarizes everything.

## 1. Pick the job

Decide this first. The rest branches on the answer.

- **Resume** — the same work, from where this session stopped. This session ends. Default to resume. An aim narrows it — "focus on the failing tests", "the migration landed, start from the API" — and never turns it into a different job.
- **Assign** — a different job, handed to another session: prototype one question, debug one failure, investigate in parallel. **This session stays open and waits.** An assignment carries four extra things, and every one exists because someone waits on an answer.

## 2. Gather only what this job needs

Nothing here runs by default. Pick what the next session will trip over.

- **Resuming a build** → `git status --short`. Nothing hurts more than a fresh session editing on top of changes it never saw.
- **Resuming inside a ticket system** → `flow status`, for what is in flight.
- **Assigning a job** → whatever waits for the receiving session: a server already listening, a half-finished install, a folder that is read-only.
- **Resuming a brainstorm, or assigning a prototype** → nothing. A question about how a library behaves gains nothing from the working tree.

## 3. Write it

Shape follows the work — a debugging handoff and a brainstorm handoff share nothing but the filename. Cover these however they fit.

- **The job** — what's being done and why, current tense.
- **Where it stands** — done, in flight, broken, half-applied.
- **What is already set up** — the install that ran, the server still listening, the read-only folder, the command that works from one directory only. Skip it and the next session spends an hour rebuilding a working setup.
- **What binds it** — decisions locked, corrections given, approaches ruled out and why. Weight what was said out loud and written nowhere; the reset destroys exactly that. Dead ends count as conclusions.
- **What was found** — versions, endpoints, exact payloads, traps already hit. Write out anything that cost real effort, source or no source.
- **What to read** — every file the next step touches: full path, a few words on why, line range when the file is long. Verify each path before writing it. This is what stops the next session hunting.
- **The first action** — concrete enough to start on. Name the skill when one applies.

### When it assigns a job

Four more, on top of every line above.

- **What turns on the answer** — the decision waiting on it, and what changes if it comes back no. Without this, a marginal result reads like a decisive one.
- **What done looks like** — written here, before the work starts. Criteria written afterwards match whatever came out.
- **What to produce** — the artifact and its shape: the questions it answers, in order.
- **What to say back** — the two or three sentences this session needs to carry on.

### How much to write

**Point at what a path finds in seconds. Write out what cost real effort, wherever it lives.**

Length follows the work. A handoff mid-build stays thin, because the ticket's `## Plan` already carries the step to resume at. A brainstorm handoff runs fat, because the state lives in the conversation and nowhere else. A fat build handoff means the plan carries too little.

Durable knowledge goes to its own home the moment it surfaces — Capture in the project `CLAUDE.md` names the file. This one is disposable.

## 4. Place it

Beside the most specific thing being worked. In a project with a ticket system:

- a ticket → that ticket's folder, `docs/tickets/t047-slug/handoff.md`
- a brainstorm, wherever it sits → that brainstorm's own folder, `handoff.md`
- neither → `docs/handoff.md`

No project here → beside the file in front of you. A path the user names beats all of it.

**One resume file per folder, overwritten every time.** A stale resume is worse than none, and git keeps the old one. **An assignment takes its own filename**, named for the job, so it can never overwrite the resume. One resume, any number of assignments.

## Booting from one

Read every listed file in one parallel batch, then start on the first action. The decisions in it are settled.

Delete the file once the job it describes finishes. Deleting it on read strands a session that dies mid-job.

An assignment ends by saying its answers back, in the final message. The session that wrote it waits on exactly those sentences.

The reader may not have this skill loaded — usually the user points a fresh session at the path. Put the two boot lines at the top of the document itself: read every listed file in one batch, then start on the first action.

## Hard rules

- **Never summarize the conversation.** Write the state.
- **Never run a command this job does not need.**
- **Write at a clean point.** Finish the task, land the edit, run the verification, then write. Half-states are what make a handoff unreliable — with no room left for that, describe the half-state honestly.
- **Verify every path before writing it down.**
- **Never let an assignment overwrite a resume file.**
