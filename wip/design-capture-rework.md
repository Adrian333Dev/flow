# Design — capture dissolves into CLAUDE.md

_2026-07-29. Built same day. Continues the mode-vs-reflex thread from `design-explain-rework.md`._

`note` was the last ambient skill. It is now gone: the behavior lives in `flow/CLAUDE.md` `## Capture`, and `organize` keeps the half that genuinely needs deliberation.

---

## The trigger

User's case: mid-brainstorm he mentions a feature to try later. Old flow — agent loads `note`, appends a line to `docs/work/inbox.md`, and a later `organize` pass moves that line to `docs/work/backlog.md`. Same round trip for a stated preference: inbox → `CLAUDE.md` → `## Preferences`. Two writes where one was always enough, and a filing pass spent on items that were never ambiguous.

---

## LOCKED decisions

### #1 — `note` dissolves into `flow/CLAUDE.md` `## Capture`

Two independent reasons.

**The founding rule was conditional, stated absolutely.** "Don't decide where it goes — deciding at capture time is the tax that makes capture get skipped." The tax is *deliberation*, not writing. When the destination already exists and the item is usable there as-is, there is nothing to deliberate and the write costs one `Edit` either way.

**The detection rule was unreachable.** `note` carried "preferences are inferred, not announced — the same correction twice, or irritation at a habit." That is a *trigger* rule living inside a file that only loads once the trigger has already fired. Same circularity that moved `explain`'s prose rules out: **any behavior whose trigger is itself a judgment call cannot live behind that judgment call.**

At 22 lines of body there was no residue worth leaving as a stub. The folder is archived to `reference/archived-skills/note/`, not deleted — that needs its own confirmation.

### #2 — The cut is by deliberation cost, not by topic

The user floated merging `note` into `organize`. Rejected: the two halves don't differ by subject, they differ by how much thinking the destination takes — the same axis that decides CLAUDE.md vs skill everywhere else in Flow.

- Cheap, always-on, destination obvious → `CLAUDE.md`.
- Expensive, deliberative, batchable → `organize`, user-invoked.

### #3 — Two tests decide the route

Both must hold to write straight into a real document:

1. **The home exists right now** — `docs/work/backlog.md`, `## Project rules`, `## Preferences`, the open `brainstorm.md` / `spec.md`.
2. **The item is usable there as-is** — it already reads like a backlog entry, a preference line, a decision.

Fail either → `docs/work/inbox.md`, raw.

Test 2 is the guard that makes this safe. Routing is harder to undo than capturing; a half-formed thought written straight into `backlog.md` pollutes a document the user actually reads. The inbox becomes the pressure valve for the unshaped — which is the job the user described wanting it to keep.

**Never route to a skill at capture time.** Altitude is the hardest call in the system and the place duplication happens.

### #4 — `organize` keeps a real job

Altitude routing into skills, `needs skill:` flagging, shaping raw fragments into something fileable, and the end-of-topic sweep of `brainstorm.md` / `spec.md`. The inbox it drains is thinner, so altitude decisions become the main event instead of noise buried under obvious filing. A shaping step was added to its method.

Its routing table now holds only the two skill rows; everything else points at `## Capture` in the project `CLAUDE.md`, which is always loaded wherever `organize` runs. No duplicated destination list to drift.

### #5 — No skill is ambient now

`explain` stopped being ambient on 2026-07-28; `note` stops being one here. `## Workflow` in `flow/CLAUDE.md` is now purely a list of things the agent deliberately reaches for — the shape it should have had.

---

## Costs accepted

- **`/note` as a typed command is gone.** "note that" still works — it's a CLAUDE.md rule, not a trigger phrase. A stub skill kept only as a slash-command alias is bloat.
- **`flow/CLAUDE.md` grows ~16 lines.** Bought by removing a skill from the install set and a routing round trip from every capture.

---

## Shipped 2026-07-29

- `flow/CLAUDE.md` — new `## Capture`; `note` dropped from `## Workflow` and the `organize` line reworded; the preferences-are-inferred line moved out of `## Communication`.
- `flow-skills/skills/note/` — archived to `reference/archived-skills/note/`.
- `flow-skills/skills/organize/SKILL.md` — description, intro, `Inputs`, `Method` (new shaping step), `Routing`.
- `flow-skills/.claude-plugin/plugin.json`, `flow-skills/README.md` — deregistered.
- `flow-skills/skills/handoff/SKILL.md`, `flow-skills/skills/brainstorm/SKILL.md` (description, coordination table, Phase 2, hard rules) — pointers repointed.

## Still open

- **Does `docs/spec/decisions.md` exist at capture time?** `flow/docs/` currently holds only `work/backlog.md`. `## Capture` routes decisions to the active topic's `spec.md` and falls back to `decisions.md` "where that exists" — correct today, but the real answer is whatever `project-init` scaffolds. Same blocker as the session-start section and the key-docs table in `design-explain-rework.md`.
