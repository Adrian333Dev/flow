---
name: organize
description: File the captures that had no obvious home — decide which skill owns a reusable lesson, shape raw fragments into something fileable, flag knowledge with no home skill. Drains `docs/inbox.md`, plus the brainstorm map of work you just finished.
disable-model-invocation: true
---

# Organize

The filing pass. Capture routes whatever has an obvious home the moment it surfaces (`## Capture` in `~/.claude/CLAUDE.md`); `docs/inbox.md` collects only what it couldn't place. This drains that.

## Inputs

- **`docs/inbox.md`** — always. Knowledge needing an altitude call, items with no home yet, anything still too raw to file.
- **The brainstorm worked this session, once it closes** — sweep its `map.md`: promote reusable lessons into skills, move out strays that fell outside its scope. Nothing closed this session, or it is still open? Inbox only — never go digging through maps that aren't yours this session.

## Method — batch, don't crawl

1. Read the inputs whole.
2. Sort every item by destination in one pass (group them).
3. Shape what needs it — a fragment has to read like the thing it's about to become.
4. Apply per destination — a few grouped edits, not one item at a time.
5. Clear filed items from the inbox (git remembers them).
6. Report what you filed and what you flagged.

Triage speed, not deep work — keep it quick and light.

## Routing

The judgment calls this pass exists for:

- **Reusable — a tip, pattern, gotcha or method** → the skill that already covers it, chosen by **altitude** (below).
- **Reusable, no skill covers it yet** → flag it in `docs/inbox.md` as `needs skill: <subject> — <note>`.

Everything else goes to the homes listed under `## Capture` — a ticket, a brainstorm map, `docs/context/`, project rules, preferences, `~/.claude/flow/notes.md`. It reached the inbox because it was raw, not because it was homeless.

**Defer to what exists.** No `docs/spec/`? A locked decision goes to the brainstorm that owns the subject — its `map.md` *is* the decision log. Never invent parallel doc buckets.

## Altitude — which skill

Match the note's scope to the skill's scope:

- tool quirk → that tool's skill
- framework pattern → that framework's skill
- broad principle ("the client never touches the DB directly") → a high-level concept skill (e.g. `architecture`)
- seam between two tools → the **source** tool's skill, plus a one-line pointer from the other

Never a "tool-A-with-tool-B" skill. One home per fact; pointers elsewhere; never duplicate.

Skills are global, one copy per machine, under `~/.claude/skills/` — append there. There is no project-local skill to file into.

## Not here

Building or reshaping a skill is a separate pass. Adding a line to a skill that exists = `organize`. When `needs skill:` flags pile up, suggest `curate-skills` in one line.

Creating a ticket is fair game when an inbox item turns out to be committed work — `flow ticket new`. Work you merely *might* do stays in the inbox; the test is commitment, not size.

## Hard rules

- **Batch, stay light** — triage speed, not deep work.
- **Clear what you file; report what you flag** — no silent half-drain.
- **Defer to existing structure; never duplicate a fact.**
- **Flag homeless knowledge; never stub-create a skill.**
