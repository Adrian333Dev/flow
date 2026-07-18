# Write Spec — Reference

Synthesize the brainstorm output and existing codebase context into a clean implementation spec. This is not more brainstorming — the decisions are locked in `brainstorm.md`. The job here is to read, explore, and write.

---

## Step 1 — Check brainstorm state

Read `brainstorm.md` in the active topic folder.

If it doesn't exist, stop:

> "brainstorm.md not found. The brainstorm must be complete before writing the spec."

If open `[ ]` branches exist, flag them:

> "These branches are still open in brainstorm.md: [list]. Confirm they're out of scope or deferred before I write the spec, or close them first."

Wait for confirmation. If the user says proceed anyway, note each open branch as deferred in the spec's Open questions section.

---

## Step 2 — Explore the codebase

Skip this step for greenfield projects with no existing codebase.

Read the files directly relevant to what's being built. Stay focused on what the brainstorm touched:

- Existing files that will be modified
- Data models, schemas, types the spec will reference
- Patterns in use that the implementation must follow
- Anything the brainstorm referenced by name but didn't fully define

**If exploration reveals a contradiction** — something that conflicts with a brainstorm decision — pause immediately:

> "Found [X] which contradicts what we decided in the brainstorm ([Y]). I need to resolve this before writing the spec."

Re-open brainstorming on the specific conflicting branch only (not a full re-brainstorm). Once `brainstorm.md` is updated with the resolution, re-read it and continue from where spec writing left off.

**If a research gap appears** — you need accurate current knowledge about something external to write a concrete requirement — invoke the research skill inline. Incorporate findings directly into the relevant spec section. Research during spec writing goes into the spec itself, not back to `brainstorm.md`.

---

## Step 3 — Write spec.md

Write to `docs/work/topics/t<NN>-<slug>/spec.md` — the same topic folder as `brainstorm.md`. Write each section progressively — update the file as each section completes. Never hold the full spec in memory before writing.

**Structure:**

```markdown
# [Feature / milestone name] — Spec

## Goal
[1–2 sentences. What this builds and why.]

## Scope
**In scope:**
- [concrete item]

**Out of scope:**
- [concrete item — things that could be confused as in-scope]

## Key decisions
[Decisions locked during brainstorming — pulled from brainstorm.md.
One entry per decision. Complete where the decision is nuanced, brief where it isn't.]

## Architecture / Technical approach
[How the system is structured: file layout, module boundaries, data flow, component
relationships. Enough for an implementer to understand the shape before reading requirements.
Omit this section only if the work has no meaningful structural decisions.]

## Requirements
[Concrete, unambiguous requirements. Each one must be specific enough that an implementer
can't misread it. No "appropriate error handling", "good performance", or "intuitive UX" —
name the exact behavior. Each requirement must be testable.]

## Success criteria
[How you know this is done. Observable, testable outcomes.]

## Open questions / deferred
[Items deliberately left unresolved. Each entry says WHY it's deferred and what
would need to be true to resolve it.]
```

**Scope check while writing:** If the spec ends up covering multiple independent subsystems, stop and flag it:

> "This spec spans [X] and [Y] which are independent and could each have their own plan. I'd recommend splitting into two specs. Should I continue as-is or split?"

Wait for the user's call before continuing.

---

## Step 4 — Self-review

Before showing the spec to the user:

1. **Placeholder scan** — any "TBD", "TODO", vague requirements, or incomplete sections? Fix them.
2. **Internal consistency** — do any sections contradict each other? Does the architecture match the requirements?
3. **Scope check** — focused enough for a single implementation plan?
4. **Ambiguity check** — can any requirement be interpreted two different ways? If yes, pick one and make it explicit.
5. **YAGNI** — any unrequested features or over-engineering crept in? Remove them.

Fix issues inline. No need to re-review after fixing.

---

## Step 5 — User review gate

> "Spec written to `<path>`. Please review it before we move to writing-plans."

Wait for their response. If they request changes, make them and re-run self-review (Step 4). Only proceed once they approve.

---

## Step 6 — Define milestone 1

Once the user approves the spec, scope the first milestone before invoking writing-plans.

Ask:

> "Spec approved. Is this single-milestone work, or does it need to be split into multiple milestones?"

**If single milestone:** The entire spec is milestone 1. Ask for a milestone name (e.g., `m1-foundation`) and create the folder `docs/work/topics/t<NN>-<slug>/m1-<name>/`.

**If multiple milestones:** Ask the user to describe milestone 1's scope:
- Name (e.g., `m1-foundation`)
- Goal — one sentence: what does completing this milestone achieve?
- What's in scope for this milestone
- What's deliberately deferred to later milestones

This does not need to be a full roadmap — a few sentences is enough. Future milestones are scoped at milestone wrap time, not upfront. After a milestone ships, the design may change — don't lock in M2+ scope now.

Create the folder `docs/work/topics/t<NN>-<slug>/m1-<name>/`.

Then invoke writing-plans.

**REQUIRED NEXT SKILL:** writing-plans

---

## Hard rules

- **brainstorm.md is required.** If it doesn't exist, stop and say so.
- **No interview.** The brainstorm already happened. If something is genuinely unclear, flag it — don't turn this into another brainstorm session.
- **No placeholders.** Every section must be real content before moving to self-review.
- **Codebase exploration is required** (unless greenfield). Don't write a spec that references types, files, or patterns you haven't verified exist.
- **Write progressively.** Each section goes to file as it completes — never hold the full spec in working memory.
- **User reviews before plans.** Never invoke writing-plans without explicit user approval of the spec.
