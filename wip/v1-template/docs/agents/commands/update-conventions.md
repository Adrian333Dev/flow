# Update Conventions

A flexible command for recording new conventions, rules, and setup decisions as they emerge during development.

Invoke any time you want to save something the codebase should always follow (→ `docs/agents/conventions.md`) or something that was done once during setup (→ `docs/agents/setup-notes.md`).

---

## How to invoke

Two modes:

**Mode A — Explicit rules.** Tell the agent what to record. Example: *"Add a rule: never call the Supabase client directly from a controller."*

**Mode B — Session analysis.** Ask the agent to analyze the recent conversation or a milestone's implementation to extract conventions that emerged organically. Example: *"Review this session and save any conventions we applied."*

---

## Agent instructions

### Step 1 — Collect input

If the user supplied explicit rules, use those. If the user asked for session analysis, review the recent conversation and identify patterns applied consistently: coding decisions, naming choices, structural choices, workarounds for specific constraints.

Skip ephemeral task details (what was done to fix a specific bug). Capture only what will guide future code in any file.

### Step 2 — Categorize each item

For each rule or decision, determine which file it belongs in:

**→ `docs/agents/conventions.md`** if it is:
- An ongoing coding rule (applies to every file written in this area from now on)
- A naming or structural pattern
- A library-specific usage rule
- Something a developer must remember when touching any file in the area

**→ `docs/agents/setup-notes.md`** if it is:
- A one-time decision made during scaffolding or tooling setup
- A configuration choice that is already baked into config files and won't change unless the setup is redone
- A "we chose X because Y" architectural rationale

**→ Neither** if it is:
- Specific to a single file or function (belongs in a comment near that code)
- Ephemeral (a debugging step, a workaround that's already removed)
- Already present in either file (check before adding)

### Step 3 — Update the right file

**For `conventions.md` additions:**
- Read the file first.
- Find the most relevant existing section and add there. If no section fits, add a new `### <Library or Area>` subsection under the appropriate top-level section.
- Write concrete, followable rules. No vague guidelines.
- Do not duplicate existing rules.

**For `setup-notes.md` additions:**
- Read the file first.
- Find the most relevant existing section and add there. If no section fits, add a new `## <Topic>` section.
- Format as reference: state what was decided and why (the constraint or rationale driving the choice).

### Step 4 — Report

List each item added and which file it went into, or confirm nothing new was worth capturing.
