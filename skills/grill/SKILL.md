---
name: grill
description: Attack a design, plan, spec or decision before it locks — run it through concrete cases until a step cannot be finished. Reach for it when something is about to be agreed, and keep it running across a whole discussion, not just one turn.
---

# Grill

Second pass on something about to lock. Hunt the case that breaks it.

Target: whatever is under discussion. Ambiguous → name what you are attacking in one line, then attack it.

## Inputs

- **The target** — design, plan, spec, decision, or something already built.
- **Its bar** — invariants, locked decisions, the job it exists to do. Gather first; a fault
  is only a fault against a bar.
- **Scope** — any angle named above is binding. Out-of-scope findings: one line each, at the end.

## Method

1. Restate the target as mechanism — what changes, what shape it leaves. Cut the reasons;
   attack the mechanism, not the case for it.
2. List the cases.
3. Run every case through the target and each rival. Step by step, every step written.
4. Apply the filters.
5. Report, worst first.

A fault is a step you cannot finish.

## Cases

- the one it was built for
- empty, exactly one, enormous, repeated, two at once, out of order, interrupted halfway,
  run twice by accident
- whatever "usually", "typically" and "most of the time" were covering — those first

Concrete and named. Never "some input".

## Rivals — same cases, same walk

| Rival | |
|---|---|
| what exists today | on trial too, never the baseline — late faults usually live here, unrun |
| the cheap patch | keep what exists, change the least that covers the case; build it yourself if nobody offered it |
| doing nothing | |

Rival that doesn't exist → say which, say why.

## Filters

| Reads like a fault | Counts when |
|---|---|
| defends what's already there | restated as a step the target cannot finish |
| "too complex", "hard to maintain" | a named case is run and gets harder |
| answered in the same sentence it was raised | the walk is written out |

Nothing found is a result — list the cases run, so it can be checked.

## Report

Each fault: the case, the step it died on, the cost.

Then: the argument that decides this and what would overturn it; what is lost if it ships;
out-of-scope notes.

## Hard rules

- **Run it, don't rate it** — faults come from walking cases, never from rereading.
- **Rivals get the same walk as the target.**
- **A fault names a case and a step.**
- **Findings only** — no edits, no fixes this pass.
