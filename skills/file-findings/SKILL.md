---
name: file-findings
description: File what a session learned into the skills, rules and context files that will load it next time — and build or reshape one where nothing fits.
disable-model-invocation: true
---

# File findings

Capture wrote every finding down and decided nothing about where it belongs. This pass decides, then writes each one into its destination. Filing is the only pass that writes into a skill, and it builds one where nothing fits.

## Method

Batch every step. Never carry one item through to its destination and then start the next.

Move at triage speed — building a skill is the one slow step, and it fires rarely.

1. Read the inputs below, whole.
2. Sort every item by destination in one pass.
3. Shape what needs it. A fragment has to read like the thing it is about to become.
4. Apply per destination, a few grouped edits.
5. Clear filed items from the inbox; git remembers them. **Never empty an `issues.md`** — it is the record of what happened, like a hunt's report.
6. Mark every ticket you swept — `flow file t047 t048 t049`, the ones that taught nothing included. Nothing else drains the queue.
7. Report what you filed and what you flagged.

## Inputs

- **`docs/inbox.md`** — always. Knowledge needing an altitude call, items with no home yet, anything still too raw to file.
- **Closed tickets nobody has filed yet** — `flow ls --unfiled` gives the ids, usually several. In each folder read `issues.md` for what the build learned, and everything in `reports/` for what was answered.
- **The groundwork this session closed** — sweep its `map.md`: promote reusable lessons into skills, move strays out to where they belong. Never open a map this session did not work.

## Routing

- **Reusable — a tip, pattern, gotcha or method** → the skill that already covers it, by **altitude** below.
- **Reusable, and no skill covers it** → flag it in `docs/inbox.md` as `needs skill: <subject> — <note>`. Several flags on one subject earn a skill; one flag is not evidence.
- **Everything else** → the homes under `## Capture` in the global `CLAUDE.md`: a ticket, a groundwork map, `docs/context/`, project rules, preferences, `~/.claude/flow/notes.md`.

**Defer to what exists.** No `docs/spec/` → a locked decision goes to the groundwork that owns the subject, whose `map.md` is the decision log. Never invent a parallel doc bucket.

**An inbox item somebody has committed to build becomes a ticket** — `flow new`.

## Altitude — which skill

Match the note's scope to the skill's scope:

- tool quirk → that tool's skill
- framework pattern → that framework's skill
- broad principle, such as "the client never touches the DB directly" → a high-level concept skill, `architecture` for that one
- seam between two tools → the **source** tool's skill, plus a one-line pointer from the other

Never a "tool-A-with-tool-B" skill. One home per fact, a pointer everywhere else.

## Building or reshaping a skill

**Read `references/write-skills.md`** before creating or restructuring one. It carries the shape, the frontmatter, where a new skill lives, and when to rewrite one rather than patch it.

Appending a line to a skill that already exists needs none of it.
