---
name: guides
description: Framework for writing and maintaining guides — frontmatter format, description conventions, body structure, file layout, and update process. Read before creating a new guide or modifying an existing one.
---

A guide is a behavioral or technical reference document that establishes principles,
patterns, and process for a category of work. Agents read guides on demand —
self-selected when the task warrants it, never auto-triggered.

## Frontmatter

Every guide opens with YAML frontmatter:

    ---
    name: kebab-case-name
    description: What this guide covers and when to reach for it. 2–4 sentences.
    ---

**`name`** — kebab-case, matches filename without extension.

**`description`** — two things: what the guide covers, and which situations should trigger reading it. 2–4 sentences, all on a single line. Keep it tight — every word loads into context.

## Body structure

A guide body is **steps**, **reference**, or a mix of both.

**Steps** — ordered procedure. Use when the guide governs a process. Each step
ends on a checkable completion criterion so the agent knows when it's done.

**Reference** — rules, patterns, or gotchas consulted on demand, not followed in
sequence. Use when the guide states how to approach a category of work rather
than prescribing an order.

Lead with whichever type the reader needs first.

## File structure

Single `.md` file — default. Use this for the vast majority of guides.

Folder — only when content is genuinely too large for one file. The main file is
always named `GUIDE.md`:

    docs/guides/core/debug/
      GUIDE.md      ← entry point; links to sub-files
      phases.md     ← loaded only when that detail is needed

## Creating a guide

Create when:
- User requests one
- Agent identifies a recurring pattern worth capturing → proposes → user approves
- Milestone close: `guide-notes.md` review surfaces an item warranting a new guide

Tier folders:
- `docs/guides/core/` — workflow behaviors and universal technical patterns
- `docs/guides/domain/` — problem-domain knowledge
- `docs/guides/stack/` — library/stack-specific patterns and gotchas

## Updating a guide

Never edit guide files during active execution or mid-session. When you notice
something worth improving: write a note to `docs/work/milestones/<slug>/guide-notes.md`.
At milestone close, surface the notes, get user approval per item, then make
approved edits.

To discover all guides: `bash docs/commands/list-guides.sh`
