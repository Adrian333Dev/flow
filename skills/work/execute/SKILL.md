---
name: execute
description: Builds one ticket: reads it, plans the tasks, builds, checks its own work, and reports.
---

# Execute

One ticket, from pickup to `done`. No ticket named → `flow next`, and recommend one: work in flight beats work cut out of it, and both beat anything new.

## Pick up

1. Read `ticket.md`, the index: `## Questions` with their answers, `## Decisions`, `## Tasks`, `## References`. Open a `context.md` section only where a task needs its reasoning. An older ticket's `## State` says where its work stopped.
2. `flow tickets start <id> --activity build`. A worktree only where the user asks for one, by `~/.flow/guides/worktrees.md`.
3. `## Questions` still open → name them. The user decides whether the build waits for `/flow:groundwork`.
4. A child's work is built in the child, never in its parent.
5. No `## Done when` → write one before building.

## Plan

Read the code the ticket changes first. Then the tasks.

- **More than about 3 steps, or work that will outlast the session** → a checklist under `## Tasks` in `ticket.md`, one line per step, each naming its check. Smaller work keeps its plan unwritten. The user may read the checklist and never approves it.
- **Name the command that proves the ticket done.** The project's own, never a default like `npm test`.
- **A wide refactor** goes: add the new path, move the callers, delete the old. Never one sweeping step.
- **Stop before building** where the approach departs from what the user said. Say the departure, then wait.

## Build

Build to the end. Run each step's check, tick it, start the next. Stop only for a decision that is really the user's.

Write as the work goes, never at the end, by `~/.flow/guides/write-tickets.md`. A restart continues from the 2 files alone.

- **File a lesson the moment it lands**, by `## Capture`.
- **A discovery that changes a decision** → rewrite its line in `ticket.md`, and its section in `context.md` with the reason and the dropped direction.
- **A decision made alone, a dead end, a trap hit** → a section in `context.md`, headed by the task's name. A decision also gets one line under `## Decisions` in `ticket.md`: what, and why.
- **A file, tool or page the work needs** → a line in `## References`.
- **Routine output** → nowhere.
- **Plan wrong** → rewrite the tasks and say what changed. **Separable work found** → propose a child ticket. **The ticket no longer makes sense** → propose `flow tickets drop <id> --reason "<why>"`.

### When a check fails

Fix it while the cause is in front of you, and keep going as long as every fix stays mechanical: a version pin, a config key, a wrong path, a missing import.

- **The same failure standing after a run of mechanical fixes** means an assumption is wrong. Stop fixing. Say what you believed, what you changed on it, and what failed anyway.
- **The code runs and the answer is wrong** → stop after one attempt, and run `/flow:debug` in this session.

## Check and report

1. Update every record the change made stale: `docs/spec/`, `docs/context/`, other tickets that cite it.
2. Run the full suite, in the turn you report it.
3. Read the diff once against the decisions, then against `~/.flow/guides/review-code.md`. A ticket that produced a document reads `~/.flow/guides/writing.md` instead. A ticket that produced a decision reads neither.
4. Fix what is wrong, then `flow tickets done <id>`. In a worktree, the user merges first: `~/.flow/guides/worktrees.md` → `## The user merges`, then `## Closing`. `done` refuses while the worktree holds unmerged work.
5. An older ticket's `## State`: anything in it still true goes where `## Capture` sends it, then delete the section.
6. Report. Open with the decisions you made alone, one line each. Then what changed and what the check showed, briefly. End with the next ticket from `flow next`, and why.

## After `done`

The user's notes reopen the ticket: `flow tickets start <id> --activity build`.

1. Read the whole list before touching anything. Anything you do not understand stops the list: ask about those first.
2. Check each note against the code. A note that would break something gets said so, once, with the reason.
3. Add the rework to `## Tasks`, then build it.

A changed idea of what the ticket should be rewrites its decisions in the same ticket. Never a new one.
