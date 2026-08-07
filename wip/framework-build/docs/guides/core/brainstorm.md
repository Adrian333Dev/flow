---
name: brainstorm
description: Decision-tree grilling session for locking design decisions through structured dialogue. Works for any session type — milestone feature design, product design, architectural decisions, technical exploration, research. Read when starting a /brainstorm session or any structured decision-locking conversation.
---

## Scope

Use for any structured thinking session: milestone brainstorm (before writing a spec), product or UX design, architectural decisions, technical exploration, research. Session type determines which phases apply — not all phases run every time.

## Phases

### Phase 0 — Context read

**Run only for:** milestone, technical, architectural, or research sessions where existing code or spec bears on the decisions being locked. **Skip entirely** for product-level sessions with no existing codebase.

What to read: look at the brainstorm topic. What existing code, decisions, or spec constraints bear on the branches you're about to walk? Read only those files. Not everything — just what's relevant.

### Phase 1 — Open

Before asking anything: write the initial `brainstorm.md` (see format below) with top-level branches only. Then state what you understand as the goal in one sentence and identify the main decision branches.

Don't ask for confirmation before stating your understanding — just state it and begin. The user will correct you if you're wrong.

### Phase 2 — Walk the decision tree

For each branch: pose the question **and** give your recommended answer. Not "what do you think about X?" — "here's what I'd do for X, because Y — does this hold?"

User reacts: agrees, corrects, or refines. Fold in the response. Move to the next branch.

**Minor questions:** group them — "Three small things to lock: [list]. Here's my take on each: [takes]. Anything you'd change?"

**Branch order:** foundational decisions first — the ones other decisions depend on. Don't walk sub-branches of a parent before the parent is locked.

**Update brainstorm.md when:** a new branch is discovered, a branch is fully resolved, a user answer reveals a sub-branch, or an important constraint surfaces. Not after every exchange — use judgment.

**Commit to your position.** Be willing to be visibly wrong. If pushed back on, reconsider genuinely — don't capitulate, but don't defend a wrong answer either.

**Visualization:** when a decision involves layout, flow, or structure that's easier to reason about visually, use the visualization guide to produce a diagram or sketch. Most sessions will use this at least once.

### Phase 3 — Assumption check

Before closing, name 2–4 key assumptions that haven't been validated. Format: "We're betting that X is true. If it's wrong, we'd need to rethink Y."

Only surface assumptions with real uncertainty — things that could genuinely break the design. Skip things that are clearly established or trivially verifiable.

User decides: treat as blockers (investigate before writing spec) or note in `backlog.md` and proceed.

### Phase 4 — Close

When the user says they're done:

1. Give a concise summary of locked decisions.
2. Suggest next step based on session type:
   - Milestone brainstorm → `/write-spec`
   - Research session → findings should already be captured in `docs/guides/` per the immediate capture rule; suggest what to do next from there
   - Product design session → suggest drafting `docs/spec/product-spec.md`

---

## brainstorm.md

Write this file at the start of Phase 1 — before asking the first question. Maintain it throughout by judgment, not mechanically.

**Location:**
- Milestone brainstorm → `docs/work/milestones/<slug>/brainstorm.md`
- Product-level brainstorm → `docs/spec/brainstorm.md`

**Format:**

```markdown
# Brainstorm — [Topic]
_Started: [date]_

## Branches

- [x] **Branch name**
  - Decision: what was decided, and why (inline — not just a checkmark)
  - [x] Sub-branch: decision + reasoning

- [ ] **Open branch**
  - Candidate: current best guess
  - [ ] Open sub-branch

- [ ] **Branch discovered mid-session** (add as soon as it surfaces)
```

**Self-sufficiency rule:** `[x]` items must include the decision AND the reasoning inline. Reading `brainstorm.md` after context compaction should fully restore the decision tree state — no reconstruction from conversation history needed.

---

## Edge cases

**User wants to skip to /write-spec early:** Don't resist. Walk remaining open branches quickly or leave them open. Update brainstorm.md with whatever was locked, then proceed.

**Scope too broad:** Flag it — "This brainstorm is spanning [X areas]. Should we narrow to [one focus] and treat the rest as separate sessions?" Don't try to silently cover everything.

**User interrupts mid-session:** Commit whatever is locked to brainstorm.md. Don't summarize what's still open unless asked — they know. They can resume later or proceed with partial coverage.
