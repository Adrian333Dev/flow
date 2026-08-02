---
name: organize
description: File the captures that had no obvious home — decide which skill owns a reusable lesson, shape raw fragments into something fileable, flag knowledge with no home skill. Drains `docs/work/inbox.md`, plus the `brainstorm.md` / `spec.md` of a topic you just finished.
disable-model-invocation: true
---

# Organize

The filing pass. Capture routes whatever has an obvious home the moment it surfaces (project `CLAUDE.md` → Capture); `docs/work/inbox.md` collects only what it couldn't place. This drains that.

## Inputs

- **`docs/work/inbox.md`** — always. Knowledge needing an altitude call, items with no home yet, anything still too raw to file.
- **The topic worked this session, once it's done** — sweep its `brainstorm.md` / `spec.md`: promote reusable lessons into skills, move out strays that fell outside its scope. No topic in play, or it's still open? Inbox only — never go digging through topic files that aren't yours this session.

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

| Item | Home |
|---|---|
| Reusable (tip / pattern / gotcha / method) | the skill that already covers it, by **altitude** (below) |
| Reusable, no skill yet | flag in `docs/work/backlog.md`: `needs skill: <topic> — <note>` |

Everything else goes to the homes listed under `## Capture` in the project `CLAUDE.md` — backlog, decisions, project rules, preferences. It reached the inbox because it was raw, not because it was homeless.

**Defer to what exists.** No project `spec/`? Route decisions to the topic's `spec.md`. Never invent parallel doc buckets.

## Altitude — which skill

Match the note's scope to the skill's scope:

- tool quirk → that tool's skill
- framework pattern → that framework's skill
- broad principle ("the client never touches the DB directly") → a high-level concept skill (e.g. `architecture`)
- seam between two tools → the **source** tool's skill, plus a one-line pointer from the other

Never a "tool-A-with-tool-B" skill. One home per fact; pointers elsewhere; never duplicate.

Skills mean the ones under `.claude/skills/` — append there.

## Not here

Building or reshaping a skill is a separate pass. Adding a line to a skill that exists = `organize`. When `needs skill:` flags pile up, suggest `curate-skills` in one line.

## Hard rules

- **Batch, stay light** — triage speed, not deep work.
- **Clear what you file; report what you flag** — no silent half-drain.
- **Defer to existing structure; never duplicate a fact.**
- **Flag homeless knowledge; never stub-create a skill.**
