---
description: Write the document a fresh session resumes the work from — the relevant state, not a summary of the conversation. Reach for it when a phase closes (brainstorm, spec, plan, execution) or context is filling.
argument-hint: [what to aim it at]
---

# Handoff

Replaces `/compact`. This session ends; the work continues in a fresh one that reads this file and nothing else. It knows the repo. It knows nothing about this conversation.

`/compact` summarizes everything. This keeps what the next step needs and drops the rest.

Aim: **$ARGUMENTS** — empty means resume, same work, same next step.

Uncommitted work:
!`git status --short 2>/dev/null || echo "(not a git repo)"`

Tickets and topics:
!`flow status 2>/dev/null || echo "(no flow project here)"`

## The job

Resume — same work, same next step, from where this session stopped. That's the default and most of what gets written.

An aim steers it — "focus on the failing tests", "the migration landed, start from the API" — without changing it into anything else.

Name a different job outright — brainstorm another idea, investigate something in parallel, start the next milestone — and it becomes a brief for that job, carrying only what that job needs. Worth writing at the moment this session knows something the next one can't get anywhere else: decisions made here that constrain it, gotchas in the code it will touch.

## When

- **A phase closes** — brainstorm done, spec written, plan written, execution finished, milestone closed. Write it without asking. The state is coherent, it costs little, and the file stays current as of the last phase.
- **Context filling mid-work** — reach the nearest clean point first: finish the task, land the edit, run verification. Half-states are what make a handoff unreliable. With no room left for that, describe the half-state honestly.
- **On request** — `/handoff`.

## What it answers

Shape follows the work — a debugging handoff and a brainstorm handoff share nothing but the filename. Cover these however they fit:

- **The job** — what's being done and why, current tense.
- **Where it stands** — done, in flight, broken. `git status --short` is already above: record anything uncommitted or half-applied. A fresh session walking into edits it doesn't know about is the worst outcome this file can cause.
- **What binds it** — decisions locked, corrections given, approaches ruled out and why. Weight what was said out loud and never written into any file; that's what the reset destroys. Dead ends as conclusions.
- **What to read** — every file the next step touches: full path, a few words on why, line range when the file is long. Verify the paths before writing them. This is the part that stops the next session hunting.
- **The first action** — concrete enough to start on. Name the skill when it is one.

## What to leave out

Include something when the next session would get it wrong without it, not because it mattered at the time. That test is the whole difference from `/compact`.

Point at what's on disk; write out only what exists nowhere else. Length follows the work: a handoff after execution is thin because `plan.md` already carries the state — the task to resume at, plus what the plan doesn't know. A brainstorm handoff is fat because the state is in the conversation and nowhere else. A fat execution handoff means the plan isn't carrying enough.

Durable knowledge is captured to its own home as it surfaces (project `CLAUDE.md` → Capture). This file is disposable.

## Where

- topic active → `docs/work/topics/t<NN>-<slug>/handoff.md`
- otherwise → `docs/work/handoff.md`

Overwrite it — git keeps the old one, and a stale resume file is worse than none. A brief for a different job is its own file, `handoff-<slug>.md`, so it can't clobber the resume.

## Booting from one

Read every listed file in one parallel batch, then start on the first action — the decisions in it are settled.

The reader may not have this skill loaded; usually it's the user pointing a fresh session at the path. Put those two lines at the top of the document itself.
