---
name: context-capture
description: Cross-cutting passive behavior — write important information to the repo immediately when it surfaces, from any phase. Also user-invocable to force a checkpoint or explicitly route something to the right file.
---

# Context Capture

The agent's habit of noticing when something is worth keeping and writing it down immediately — not at the end of the session, not "later." Applies during any phase: brainstorming, implementation, research, debugging, planning.

**Project-relevant information goes in the repo, not auto memory.** Auto memory is for cross-project user preferences only. Anything specific to this project — decisions, findings, ideas, workflow preferences, session state — belongs in a file the user can see, `git status` can detect, and that survives moving to a new machine.

---

## Modes

**Mode 1 — Passive (always on):** Runs continuously. The agent checks during any working phase and writes when something worth capturing surfaces — no invocation needed.

**Mode 2 — On user request:** User says "save this," "add to backlog," or invokes `/context-capture` with specific content. Agent routes it to the right file immediately.

**Mode 3 — Session checkpoint:** User says "checkpoint," "save context," `/checkpoint`, or the session is ending or approaching context limits. Agent writes a session state file so the next session can resume without re-reading conversation history. Format adapts to session type — see the **Checkpoint** section below for details and file paths.

---

## What to capture

No fixed list — agent judgment. Write anything you would regret not having at the start of the next session. Common triggers:

- A **decision got locked** — tech, product, design, or workflow
- A **non-obvious finding** surfaced — a library gotcha, a pattern that failed, something that would surprise a reader who wasn't here
- A **future idea** came up that doesn't belong in the current task
- A **workflow preference** emerged — something about how this project should be run that isn't written down anywhere
- A **natural session break** hit — a major phase completed, a risky change coming, or the session is ending
- **Anything else** that feels important and would otherwise get lost

When in doubt, write it. Brief is fine — the user edits later.

---

## Where to write

Check whether the project already has a file for this type of content. If it does, use that. If not, use the defaults below and create the file lazily (only when you have something to write).

| What surfaced | Default path |
|---|---|
| Decision locked | `docs/decisions.md` |
| Non-obvious finding / gotcha | `docs/notes/<topic>.md` |
| Future idea outside current scope | `docs/backlog.md` |
| Workflow or behavioral preference | `docs/preferences.md` |
| Session break / end of session | `docs/session.md` (or active milestone's `session.md` if in milestone context) |
| Doesn't fit any of the above | `docs/notes/misc.md` |

If a project already has `docs/spec/decisions.md`, use that instead of creating `docs/decisions.md`. Defer to existing structure — don't create duplicates.

---

## How to write

**Decisions** (`docs/decisions.md`):
One line per decision. Date optional, but useful.
```
- <what was decided> — <why, in a few words>
```
Example: `- ERDs use DBML + dbdiagram extension — hand-drawn SVG can't auto-route lines, Mermaid output is generic`

**Findings / gotchas** (`docs/notes/<topic>.md`):
Start with the finding itself, then enough context to understand it cold.
```
## <topic>
<finding in one sentence>
<context: what triggered this, what was wrong or surprising>
```

**Backlog** (`docs/backlog.md`):
One line per idea. No elaboration needed unless the idea is complex.
```
- <idea>
```

**Preferences** (`docs/preferences.md`):
One line per preference. State it as a rule, not an observation.
```
- <preference as a behavioral rule>
```
Example: `- Never use AskUserQuestion — ask in plain text instead`

---

## Checkpoint (session.md)

Write at natural breakpoints: a major phase completed, before a risky change, or at session end.

**The guiding question:** "What would someone need to read to continue this session without having been here?" Write that. Nothing more.

Format adapts to the session type — there is no fixed template:

- **Brainstorming session**: decisions made and why, open branches still unresolved, what to tackle next
- **Implementation session**: tasks completed / in-progress / blocked, key code context the next session will need, first action on resume
- **Research/debugging session**: findings confirmed, hypotheses eliminated, what's still unknown, where to look next
- **Design/planning session**: design decisions locked, open questions, what gets built first

After writing, add a brief inline note and keep working: `[checkpoint written to docs/session.md]`

---

## During an active brainstorm

`brainstorm.md` owns the working capture. Don't duplicate in-scope decisions to `docs/decisions.md` — that happens after the brainstorm closes. Only capture things that fall **outside** the current brainstorm scope: future ideas → `docs/backlog.md`, unrelated global decisions, anything that won't end up in the spec.

After the brainstorm closes, the session checkpoint and any globally relevant decisions can be written normally.

---

## Hard rules

- **Write immediately** — not at session end. Compaction, abrupt endings, and context limits all eat deferred saves. Brief inline note (`[saved to docs/decisions.md]`), then continue.
- **Project info goes in the repo** — not auto memory. Auto memory is for cross-project, machine-independent user preferences only.
- **Create files lazily** — only when there's something to write. Don't scaffold an empty `docs/` tree upfront.
- **Don't over-format** — one line per item in decisions/backlog/preferences. Elaborate only when the idea genuinely needs more than a line to be useful cold.
- **User reviews, agent captures** — write immediately, accurately, and briefly. The user decides later whether to keep, edit, or restructure it.
