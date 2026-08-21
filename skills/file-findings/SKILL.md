---
name: file-findings
description: File what a session learned into the skills, rules and context files that will load it next time — and build or reshape one where nothing fits.
disable-model-invocation: true
---

# File findings

The filing pass, and the second half of a pair. Capture writes a finding the moment it surfaces and decides nothing about where it belongs — `## Capture` in `~/.claude/CLAUDE.md` names the homes, and a build's own findings land in its ticket's `issues.md`. This is the step that decides altitude, and the only one that writes into skills. It also builds or reshapes a destination when none of them fit.

**Context file** means anything an agent reads on a later run — a skill, a `CLAUDE.md`, a file under `docs/context/`. All of them are in scope here.

## Inputs

- **`docs/inbox.md`** — always. Knowledge needing an altitude call, items with no home yet, anything still too raw to file.
- **Closed tickets nobody has filed yet** — `flow tickets ls --unfiled` gives the ids. In each folder read `issues.md` for what the build learned and everything in `reports/` for what was answered. Sweeping several at once is the normal case, not the exception, and the queue holds closed tickets only — nothing here describes work still moving.
- **The groundwork worked this session, once it closes** — sweep its `map.md`: promote reusable lessons into skills, move out strays that fell outside its scope. Nothing closed this session, or it is still open? Leave it — never go digging through maps that aren't yours this session.

## Method — batch, don't crawl

1. Read the inputs whole.
2. Sort every item by destination in one pass (group them).
3. Shape what needs it — a fragment has to read like the thing it's about to become.
4. Apply per destination — a few grouped edits, not one item at a time.
5. Clear filed items from the inbox (git remembers them). **Never empty an `issues.md`** — it stays as the record of what happened, the same way a hunt keeps its report.
6. Mark every ticket you swept — `flow tickets filed t047 t048 t049`, including the ones that taught nothing. Recording that a ticket was looked at is what drains the queue.
7. Report what you filed and what you flagged.

Triage speed, not deep work — keep it quick and light.

## Routing

The judgment calls this pass exists for:

- **Reusable — a tip, pattern, gotcha or method** → the skill that already covers it, chosen by **altitude** (below).
- **Reusable, no skill covers it yet** → flag it in `docs/inbox.md` as `needs skill: <subject> — <note>`. Several flags on one subject earn a skill; one flag is not evidence.

Everything else goes to the homes listed under `## Capture` — a ticket, a groundwork map, `docs/context/`, project rules, preferences, `~/.claude/flow/notes.md`. It reached the inbox because it was raw, not because it was homeless.

**Defer to what exists.** No `docs/spec/`? A locked decision goes to the groundwork that owns the subject — its `map.md` *is* the decision log. Never invent parallel doc buckets.

Creating a ticket is fair game when an inbox item turns out to be committed work — `flow tickets new`. Work you merely *might* do stays in the inbox; the test is commitment, not size.

## Altitude — which skill

Match the note's scope to the skill's scope:

- tool quirk → that tool's skill
- framework pattern → that framework's skill
- broad principle ("the client never touches the DB directly") → a high-level concept skill (e.g. `architecture`)
- seam between two tools → the **source** tool's skill, plus a one-line pointer from the other

Never a "tool-A-with-tool-B" skill. One home per fact; pointers elsewhere; never duplicate.

## Building or reshaping a skill

**Read `write-skills.md` in this folder.** It carries the shape, the frontmatter, where a new skill lives, and when to rewrite one rather than patch it.

That is the slow half and it runs on few passes. Appending a line to a skill that already exists is the fast half and needs none of it.

## Hard rules

- **Batch, stay light** — triage speed, not deep work.
- **Clear what you file; report what you flag** — no silent half-drain.
- **Mark every ticket you swept** — including the ones that taught nothing. Nothing else drains the queue.
- **Never empty an `issues.md`.** It is the record, not a queue.
- **Defer to existing structure; never duplicate a fact.**
- **Never build a skill from one flag.**
