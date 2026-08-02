---
name: brainstorm
description: Root skill for mapping a decision space before acting. Builds a branch tree, walks it one branch at a time, and records every decision to brainstorm.md; its write-spec and write-plan sub-files then carry the flow through spec.md and plan.md. Coordinates the research and explain companion skills.
---

# Brainstorm

Map the decision space before acting. Build a branch tree, walk it one branch at a time — proposing a recommendation for each, waiting for reaction, then writing the full decision to `brainstorm.md` before moving on.

**No hard gate.** Use it when the space genuinely needs mapping before action makes sense. For obvious small tasks, just do them. For light topics, brainstorm conversationally without the tree — one question at a time, no tree machinery. Don't start implementing before the brainstorm closes. 

---

## Skill coordination

Brainstorming is the root skill. It coordinates:

| Skill | When to invoke |
|-------|----------------|
| **research** | Before making a technical recommendation that depends on knowing the current landscape, specific API behavior, or options you might not have complete knowledge of |
| **explain** | When presenting a proposal, architecture, or mechanism to the user — anything they haven't seen yet and must react to |

These are separate skills, shipped in the same catalog as this one — install them together. If one is missing, tell the user instead of silently improvising its job. They do not replace phases of the brainstorm; they are invoked within phases when the situation calls for them.

Two sub-files in this skill's folder continue the flow past the brainstorm: `write-spec.md` (Phase 4 — synthesizes brainstorm.md into spec.md) and `write-plan.md` (after spec approval — turns the spec and a scoped milestone into plan.md). Read each when the flow reaches it.

---

## Output

`brainstorm.md` lives in `docs/work/topics/t<NN>-<slug>/brainstorm.md`. Create the topic folder if it doesn't exist. `t<NN>` is a zero-padded index (e.g., `t01`, `t02`) showing the order topics were started; the slug is a short kebab-case name for what's being designed (e.g., `t01-auth-system`, `t03-billing-pipeline`). Milestone subfolders are created later — after the spec is complete and milestone 1 is scoped. This layout is the default, not a requirement — if the project's CLAUDE.md defines its own working-docs layout, follow that instead.

---

## brainstorm.md format

Two parts: a decision tree at the top for quick status overview, and full decision sections below — one per resolved branch.

**Tree (always at the top, updated in place):**
```
[ ] A — [open question]
[x] B — [resolved question]
    [x] B1 — [sub-question, resolved]
    [ ] B2 — [sub-question, still open]
[ ] C — [open question]
```

**Decision sections (appended below the tree as branches resolve):**
```
## Branch B: [full question]

**Decision:** [what was decided]

[Full content: reasoning, alternatives considered and why they were rejected,
constraints, tradeoffs, anything relevant to understanding this decision cold.
Write everything — brainstorm.md must not lose a single decision or detail.
This is not a summary. It is the complete record.]

### Branch B1: [sub-question]

**Decision:** [what was decided]

[Full details.]
```

---

## Phase 1 — Orient & Explore

Before building the tree, understand the ground.

**Explore project context:**
- Read `CLAUDE.md` for the project's rules, stack, and structure; skim `docs/spec/` if it exists (product, tech, decisions)
- Check for an existing brainstorm.md on this topic (continuation case)
- For existing codebases: explore the files and structure relevant to what's being designed. Understand what's already there before proposing what to build. Follow existing patterns; don't design against the grain of the codebase without a good reason.

**Assess the topic:**
- If the request is under-specified, ask ONE clarifying question before mapping the tree.
- Don't try to assess scope during brainstorming — the full scope becomes clear through the brainstorm. Milestone splitting happens after spec is complete.

**Build the tree:**
Identify 3–5 top-level branches — the main questions or dimensions that need resolving. Write the initial tree to `brainstorm.md` and create the file.

**Then stop.** End the turn with a brief summary of what you found and where you'll start. Phase 2's first branch question goes in the next message — never this one.

---

## Phase 2 — Walk the tree

Interview relentlessly about every aspect until genuine shared understanding is reached. Don't move on because the user said something — move on because the decision is actually clear.

**Before posing a branch question to the user:** if the answer can be determined by reading existing code or files, read them first and record the finding. Don't burn a branch on something the codebase already answers.

**When making technical proposals** — recommending a library, an API design, an architecture — verify the facts first. If a developer facing the same decision would normally look it up before committing, invoke the research skill before recommending. Don't propose based on training knowledge alone when the recommendation depends on knowing the current landscape or specific API behavior.

**When presenting a proposal, architecture, or mechanism to the user:** invoke the explain skill — whole picture first, every component defined from zero, structural ASCII where a diagram genuinely beats text. Delivery is inline in the final message; save to a file only for durable references, and then note the path in brainstorm.md under the relevant branch section.

**Walk branches in dependency order** — resolve what other branches depend on first, not just top-to-bottom tree order.

For each open branch:

1. **Pose the question** the branch represents.
2. **Give your recommended answer** — commit to a position. "I'd go with X because Y." Never just list options without taking one.
3. **Wait for reaction.** If the response is vague or partial, probe before closing: "What do you mean by X?" or "Does that mean Y or Z?" Keep going until the decision is genuinely clear.
4. **Write the full decision** to `brainstorm.md` once it's genuinely locked — user-confirmed, no open threads; not mid-discussion agreement. Complete reasoning, alternatives rejected, constraints, anything a future reader needs to understand the decision without having been here. Mark the branch `[x]` in the tree. This is not a one-liner — write everything. Letting two or three locked decisions accumulate and recording them together is fine; never gate a write behind a yes/no question, and never end a session with unrecorded closures.

Sub-branches that emerge during the exchange get added as `[ ]` children immediately. Walk them after the parent closes.

One branch at a time. Don't stack questions. Walk each branch in plain conversational language — situation, options, recommendation — in free-form prose, not telegraphic fragments. Never expose the tree bookkeeping: no `Branch A:` labels, no `[ ]` checkboxes, no tree references in the conversation.

**Design principles for code architecture branches:**
- Break the system into units with one clear purpose, communicating through well-defined interfaces
- For each unit: what does it do, how do you use it, what does it depend on?
- Smaller, focused units are easier to implement and reason about — if a design needs a large file, that's a signal it's doing too much
- YAGNI: don't design for hypothetical future requirements. Three similar lines is better than a premature abstraction.
- Where existing code has problems that affect the work, include targeted improvements as part of the design — but don't propose unrelated refactoring
- Codebase exploration informs proposals — it doesn't constrain them. If the right design requires changing or replacing current implementations, that's in scope. Design what's correct; don't anchor to what currently exists

**Out-of-scope items:** when something emerges that won't end up in the spec — a future idea, an unrelated decision, a potential backlog item — don't capture it in brainstorm.md. Route it per `## Capture` in the project `CLAUDE.md`; a future idea usually lands in `docs/work/backlog.md`.

---

## Phase 3 — Assumption check

Before closing, name the key bets the conclusions are resting on — things assumed to be true that haven't been verified and that, if wrong, would change the approach.

Format: "We're betting that X. If that's not true, we'd need to rethink Y."

2–4 assumptions max. Skip this phase if nothing is genuinely uncertain.

Write any critical assumptions into `brainstorm.md` under an `## Assumptions` section.

---

## Phase 4 — Close & Write Spec

Confirm all branches are resolved. Flag any deliberately deferred or out-of-scope items in `brainstorm.md` under `## Deferred / out of scope`.

Tell the user: "`brainstorm.md` is complete. Moving to spec."

Then run the write-spec flow (full instructions in `write-spec.md`, in this skill's folder):

1. **Check brainstorm state** — re-read `brainstorm.md` and confirm no open `[ ]` branches remain. If any do, flag them and confirm they're deferred before continuing.

2. **Explore the codebase** — read files the brainstorm touched: files to be modified, types and schemas referenced, patterns to follow. Skip for greenfield projects. If exploration finds a contradiction with a brainstorm decision, flag it and re-open that branch before writing.

3. **Write `spec.md` progressively** — write to `docs/work/topics/t<NN>-<slug>/spec.md`, section by section, updating the file as each section completes. Structure: Goal → Scope (in/out) → Key decisions → Architecture/Technical approach → Requirements → Success criteria → Open questions/deferred. Requirements must be concrete and testable — no vague language.

4. **Self-review** — before showing the spec: scan for placeholders, check internal consistency, verify scope is focused, fix any ambiguous requirements, remove YAGNI violations.

5. **User review gate** — present the spec path and wait for approval before proceeding.

6. **Handoff** — once approved and milestone 1 is scoped, continue with `write-plan.md` in this skill's folder.

---

## Hard rules

- **Agent proposes first.** Never just list options — take a position.
- **One branch at a time.** Asking multiple questions at once is disorienting.
- **Write full decisions.** Complete reasoning to `brainstorm.md` — not a one-liner, not a summary. Nothing gets lost.
- **Update the tree immediately** when a branch resolves or a sub-branch is discovered — don't batch.
- **Don't start executing** before Phase 4 closes. If the user says "just do it" mid-brainstorm, check whether the design is clear enough — if yes, close the tree first, then act.
- **The tree lives in `brainstorm.md` only.** Never print it to the user at any point. Phase 1 ends its message with a brief summary of codebase findings and stops; Phase 2 starts in the next message with exactly one branch question + recommendation — never in the same message as Phase 1.
- **Research before recommending** on anything where current knowledge matters. Don't propose based on stale or incomplete training data.
- **Out-of-scope items get captured to their own home** — don't let them land in brainstorm.md.
