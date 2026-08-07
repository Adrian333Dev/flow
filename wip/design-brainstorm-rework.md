# Design — Brainstorm rework (two modes)

_Started 2026-07-27. Driven by the `read-aloud-app/case3` study case (`tmp/study-cases/read-aloud-app/case3/{brainstorm,spec}.md`)._

The `brainstorm` skill was built for one shape of work — brainstorm a feature, write one spec, plan it, build it. It has exactly one exit, and that exit is sized for one buildable thing. When the brainstorm resolves something bigger, everything above phase-1 altitude falls out of the flow.

---

## The evidence (read-aloud case3)

Brainstorm: 1069 lines, five top-level branches closed — product definition and positioning (A), business strategy and license (E), where synthesis runs across three product phases (B), the whole reading pipeline (C1–C5), caching (D).

Spec: 309 lines, titled "Reading Engine **v1 (web app)**". Good spec — scoped, testable requirements, real success criteria. Covers phase 1 only.

Stranded — resolved in the brainstorm, no home downstream:

- **Branch E, almost entirely.** AGPLv3+CLA survives as one line. Commercial-embedding license as primary revenue, premium/BYO-key voices, donations and corporate sponsors, trademark protection, contributor economics, the AGPL-over-GPL network-clause argument — the spec lists all of it under *out of scope*, "E-branch; not code."
- **A2/A3** — universal positioning, competitive scan, the unoccupied-intersection wedge. Absent.
- **Phases 2 and 3** — browser extension, local daemon, hosted synthesis. B4 locked "all three, chosen at runtime." Spec ships the interfaces, drops the reasoning.
- **The adapter/extractor plugin surface** — a first-class architectural direction for phase 2 plus the business split it enables (core engine = monetizable IP, adapters = community zone). Lives in one paragraph at the bottom of Branch E and nowhere else.

Two fixes rejected before they get proposed again:

- **"It's all in brainstorm.md, nothing is lost."** True in the letter. brainstorm.md is a *process log* — ordered by when decisions were made, layered with corrections. Five places tell the reader an earlier claim was wrong rather than replacing it. Answering "how does this make money" means reading E1, E2, E3 and a separate safety-notes paragraph. It's the transcript, not the reference — the same distinction that separates `/compact` from `handoff`.
- **"Make the spec cover all three phases."** The spec feeds `write-plan`, which feeds `execute`. A spec spanning three phases plus a business model produces a plan nobody can execute. Widening the spec breaks everything downstream.

---

## LOCKED decisions (2026-07-27)

### #1 — Two modes, not three

**Full-product brainstorm** and **topic/feature brainstorm**. These are the two categories faced so far and the two most likely to recur. No third category is assumed; if one shows up it gets designed then.

### #2 — Full-product mode does NOT produce a spec

Its output is a larger, more general, multi-file **product foundation** — working name "product bible." Not a product spec.

Scale evidence (user): read-aloud case3 was **minimal** product brainstorming — a few hours. A labs-scale product took ~two weeks and spanned many areas including heavy marketing work and heavy **UX** design (UX, not UI — for that product type it was load-bearing to whether the product would work at all). The output there was many files, most carrying substantial product detail. Assume the same shape here.

### #3 — That output is `docs/spec/`, the structure already designed in `project-init`

No new canonical target gets invented. `design-project-genesis.md` #1 already locked it: stable base = **product, tech, decisions**; each base file may split into several (tech especially); plus **emergent** file types as the material warrants (open-questions, market-validation, marketing reports…); the agent **proposes the final structure at the end of the phase**, base trio always present.

When the user brainstorms a whole product directly, the brainstorm builds up `docs/spec/` directly.

### #4 — No intake folder on this path

`project-init` assumes the user drops existing material into `docs/intake/`. A from-scratch product brainstorm has nothing to intake — the user has not brainstormed the idea yet, so the material is *generated in-session* rather than synthesized from pasted sources. This path must not depend on `intake/` existing.

### #5 — Topic/feature mode keeps its current shape, with modifications

brainstorm → spec → plan stays. Modifications below (#6 and the smaller issues).

### #6 — Phases must be documented, never stranded in the session

Today, when a large topic resolves into several phases or milestones, `write-spec` silently writes phase/milestone 1 and the rest survives only in the chat session or scattered through brainstorm.md.

The phase cut must be **explicitly written down**: how many phases, what each one is, what's in and out of each. brainstorm.md is an acceptable home — a dedicated file is not required. What is required is that the scope is documented somewhere durable and stated as a deliberate decomposition, not left implicit.

*(Supersedes the earlier `scope.md` proposal from this session — a separate file is optional, not the point.)*

### #7 — Delivery: a sibling sub-file to `write-spec.md`

The full-product path gets its own sub-file in the brainstorm skill folder, beside `write-spec.md` and `write-plan.md`, read when the flow reaches it. Same mechanism as the existing sub-files. Name TBD (verb-first per catalog convention).

### #8 — `project-init`'s scope is changing; out of scope here

Its scope will change significantly based on input the user has yet to give. That is its own discussion. This design must not try to settle it — only to avoid contradicting the parts already locked (#1 canonical target, #3.2.a project-altitude engine reuse).

---

## UPDATE 2026-08-02 — product mode moves to the front of the build queue

From `design-init-flow.md` `## SESSION 2026-08-02 — Flow goes global`. Three changes land here:

- **Product mode is now the entry point to the whole workflow**, not a step after `init-flow`. It runs **anywhere — no repo, no setup, no Flow install** — because commitment to a project is an output of the brainstorm, not a precondition. The user's real pattern: an ideas repo holding many half-formed products across many sessions, most of which never become projects. Nothing in this mode may depend on a project layout existing.
- **It opens with a profile check.** If `~/.claude/CLAUDE.md` lacks the Flow profile, product mode **redirects the user to `setup-flow-globals`** and does not do that work itself (user was explicit: writing the global profile must not be a sub-feature of brainstorming).
- **Branch #D (overlap with `project-init`) is fully closed.** `init-flow` no longer exists as designed; its successor `migrate-to-flow` runs *after* product mode, only for existing codebases. No convergence question remains.

**Watch while writing #C (the engine):** product questions are **elicitation** ("what are you actually trying to do"), technical questions are **propose-and-react**. If those need genuinely different rules, that is a sub-file in this skill. It is *not* a standalone interview skill — Matt's `grilling` is seven lines and Phase 2 already contains all of it.

Build order: this skill is **step 2**, after `flow/` is restructured for the global split and before `setup-flow-globals` and `migrate-to-flow`.

---

## OPEN branches

- **#A — The full-product output's actual file set.** Base trio plus which emergent files? How do marketing and UX/UX-research areas map onto it? Does the agent propose the structure at close the way `project-init` Phase C does, or is there a default set? This is the hard part and needs a real walk — "tricky to get right" (user).
- **#B — Mode selection.** Asked at Phase 1, inferred from the request, or a separate entry point? The two modes have different engines and different outputs, so picking wrong is expensive.
- **#C — Engine for full-product mode.** Same branch-tree walk at a higher altitude (what `design-project-genesis.md` #3.2.a concluded for Consolidation), or something different? Areas like marketing and UX may not decompose into a branch tree the same way technical architecture does.
- **#D — Overlap with `project-init`.** Both paths end at `docs/spec/`. One starts from pasted intake, one from nothing. Are they one skill with two entries (the "single adaptive flow" of #5 in the genesis design), or two skills that converge on the same target? Blocked in part on #8.
- **#E — Does full-product mode end by deriving CLAUDE.md + backlog.md?** `project-init` #4 makes that derivation the closing step. If the direct-brainstorm path produces the same `docs/spec/`, it plausibly inherits the same closer.
- **#F — Sub-file name** for #7.
- **#G — Where the phase cut lives in topic mode** — a `## Phases` section in brainstorm.md, or its own file when large. Low stakes; settle while editing.

---

## Smaller issues in the current skill (unblocked, no open questions)

1. **Delete the resume pointer.** case3's brainstorm.md opens with a 78-line "Session resume pointer" (lines 9–86) — dated status, updates layered on updates, superseded claims corrected inline. That is `handoff`'s job now. The brainstorm skill should stop producing it.
2. **Superseded content gets rewritten, not layered.** Five places in case3 tell the reader an earlier claim was wrong instead of replacing it (C1's "Update 2026-07-22", C2's "the earlier claim was WRONG", C4/T3's "This FALSIFIES", D's "the old wording predates Option B", HeadTTS facts #3's "CORRECTED"). Reader has to reconstruct current truth by diffing. Rule: rewrite the section to current truth; keep one line about what changed only when the reversal is itself informative. Git holds the old text. The current "write everything, never lose a detail" rule reads as "never delete" and produces archaeology.
3. **Research and test scaffolding does not belong in brainstorm.md.** case3 lines 348–374 (research execution plan with prompt paths), 643–655 (a three-test plan), 425–457 (an on-resume instruction block plus a scripted proposal). None of it is a decision. `design-project-genesis.md` #3.2.c already settled the storage split — heavy reports to `docs/research/` referenced by path, synthesis and decision into the working doc — but the brainstorm skill never says it.
4. **The skill contradicts itself on out-of-scope items.** SKILL.md line 120 says out-of-scope items must not land in brainstorm.md, invoke `note` instead. Line 138 says write deferred/out-of-scope items into brainstorm.md under `## Deferred / out of scope`. *Deferred but in scope* and *out of scope entirely* are different things; blurring them means neither rule gets followed.

## Do not touch

The branch tree, the one-branch-at-a-time walk, agent-proposes-first, and the **Decision / Reasoning / Rejected** structure of the decision sections. Those are the best part of the case3 artifact — C5a–C5e, D, B and E are excellent records. This is a seam problem, not a demolition.

---

## SESSION 2026-08-04 — full restart; the two-mode premise is void

Walked conversationally. **Every structural proposal made this session was rejected by the user.** What survives is evidence, constraints, and a list of dead ends — recorded so the restart does not re-walk them. The restart designs from scratch.

### The two-mode premise is dead

User, unprompted: *"I really don't like having modes… there will be a lot of stuff that will be kind of maybe in between. I felt like having just one brainstorming skill with a single mode that could handle everything would be better."*

Voids **#1** (two modes) and, with it, **#2**, **#5** and **#7** — each exists only to describe the second mode. **#3** (target is `docs/spec/`), **#4** (no `intake/` dependency), **#6** (the phase cut must be written down) and **#8** survive; none needs modes. Open branches **#A**, **#B**, **#C**, **#E**, **#F**, **#G** are void as phrased — every one presupposes a full-product *mode*.

Scope widened too: the user's judgement is that `brainstorm`, `write-spec.md` and `write-plan.md` all need rewriting rather than patching, and `execute` is implicated through its dependence on one large plan file. This does **not** overturn `design-init-flow.md` #6b — the walk itself (tree, one branch at a time, agent-proposes-first, Decision/Reasoning/Rejected) is still the part that works.

### Study case — `tmp/local-refs/delapse-docs`

The user's own SaaS project, ~40 milestones deep, run on the v1 workflow. Full `docs/` tree, copied in by the user 2026-08-04 specifically as a test case: *"that was a terrible flow we went with — I just want to make sure this new flow can really tackle such tasks."*

| | |
|---|---|
| size | 180 files; `work/` alone is 80,229 lines |
| `plan.md` | the bulk of it — m10 2,977; m07 2,875; m11 2,664 |
| `spec.md` | ~30 files, 10,264 lines, ~340 each |
| `issues.md` | 22 files, **608 lines total** (~28 each) |
| `roadmap.md` / `now.md` | 385 / 417 |

**The system diagnosed itself.** `work/audit/index.md`, written by that project's own agent: *"The milestone specs captured only each milestone's initial phase, not the full feature scope, and designs changed underneath them. So `now.md`, `roadmap.md`, and the milestone specs systematically under-count what's missing. This folder is the trustworthy inventory we carve milestones out of — code-truth first, not doc-truth."* After ~40 milestones the project had to re-derive nine documents from the code because every planning document had drifted out of trust.

**Small append-as-you-go files stayed true; large forward-looking files rotted.** `roadmap.md` carries strikethrough entries and one that says outright "the list to work from is `docs/work/audit/bugs.md`, not this entry." `now.md` was specified as a thin cursor and reached 417 lines. `issues.md` — ~28 lines per milestone, written *during* the build — is the highest value-per-line artifact in the set.

**Spec and plan said the same thing twice.** `m00-monorepo-scaffold/spec.md` (422 lines) contains `turbo.json` verbatim, `.npmrc` contents and every pinned version; `plan.md` (1,331 lines) then repeats all of it as steps.

**The milestone kept splitting under pressure** — m07c, m07d, m08e, m12a/b/c, m15a, m16a, m17a, m19a, m24a/b, m29a/b/c. Plans died before shipping: `plan-superseded.md`, `plan-b.md`, `plan-draft.md`.

**Implementation surprises were caught by reading code, not by writing code into plans.** `m29a/issues.md`'s findings — no repository has a delete method, pg-boss cancellation unusable per-entity, `LOG_LEVEL` never did anything, `AI_MOCK`/`TEST_REAL_LLM` were one decision spelled twice — sit under the heading **"Pre-planning verification."** The 2,227-line plan did not find them; a deliberate pass against the code did.

**`docs/spec/` is not accused.** The audit names `now.md`, `roadmap.md` and the *milestone* specs. The project-level folder (`PRODUCT-SPEC.md` 695, `DECISIONS-LOG.md` 560, `product-brief.md` 210, `tech.md` 182, `OPEN-QUESTIONS.md` 102) is not on that list.

**Not everything lived in a milestone.** `work/` also holds `audit/`, `voiceover-feature/`, `flow-brainstorm/`, `llm-mock-brainstorm/`, `dev-panel-program.md`, `financial-plan.md`.

### Constraints the restart must satisfy — all user-stated this session

- **The tree stays.** Free-form, arbitrary depth, sub-branches added mid-walk, jumping back up to a root branch. Its freedom is the point.
- **One flow, no modes.** In-between cases are the norm, not the exception.
- **A shipped milestone's spec is a history log.** It records what was executed; going stale afterwards costs nothing — *"that old milestone can stay as is, and we're obviously going to come up with a new milestone to rewrite it."* Do not design for its survival.
- **The milestone earned its place by being testable.** It ends where a large chunk can actually be tried. Some work cannot be exercised at all until several milestones complete — the user's example: a free-trial abuse-prevention pipeline spanning three or four. **Any smaller unit must not push the first moment of real testing further out.**
- **Complete code in plans existed for a reason** — to surface implementation surprises at plan time, when they are cheap. Any replacement must say concretely how those surprises get caught instead.
- **Change is the normal case.** A U-turn after milestone 1 is expected, decisions are not locked, and problems are often visible only after implementing. The user: solo dev, somewhat experienced in SaaS, not experienced at this scale, works "in kind of chaotic flow." A `prototype` skill is planned to reduce this, but the workflow must handle it either way.
- **Backlog and roadmap are to be deprecated**, at least partly, in favour of specs and tickets.
- **Wayfinder is reference only.** The user has not read it; anything taken from it must be explained from zero, and dropping it entirely is explicitly acceptable.

### Rejected this session — do not re-propose

- **A flat index file** (`map.md` with Open / Decided / Fog sections) replacing the tree. Loses the free-form depth that makes the tree work.
- **One file per decision, one file per task.** No principled rule for where the splits fall, and it scales to hundreds of files. The 2,000–3,000-line plans have a simpler cause: the rule requiring complete code in every step.
- **"Would this sentence still be true if it were built a different way? Yes → spec, no → tasks."** Applies a rule meant for a re-read document to one that is a record. User: *"That doesn't really matter, because that's just a history log."*
- **Adopting delapse's `bugs.md` / `debt.md` / `checks.md` as workflow files.** The sharpest rejection of the session, and correct: `checks.md` is browser QA for a Chrome extension, specific to that project, and the whole `audit/` folder is a **recovery artifact from a broken process**, not a designed workflow. Reusing it imports the v1 flow this rework exists to replace. General lesson: the study case is evidence of what *failed*, never a file set to copy.
- **Renaming `plan.md` → `tasks.md`/`tickets.md`, `issues.md` → `notes.md`.** Churn with no argument behind it.
- **"Ticket" as vocabulary.** User: *"to me it seems like ticket is more like a single task rather than ticket."* It is the same unit already called a task.

### Method note for the restart

The session failed by moving the proposal every turn in answer to each objection, so there was never a stable target to react to, and each answer reintroduced a problem an earlier one had solved. Fix a shape first, then work objections against it without redrawing it mid-argument.

---

## SESSION 2026-08-05 — the chain, settled. Read this before anything above it

Walked conversationally over one long session. **This section supersedes every structural proposal in `## SESSION 2026-08-04`** — that section is now only useful for its delapse measurements and its list of dead ends. Product-mode brainstorming is the one piece **NOT settled**; the user rejected the 08-05 proposal for it and wants it restarted from scratch.

### Reversals of earlier rejections — apply these, not the older text

- **"Ticket" as vocabulary is back in.** The 08-04 rejection is void. User 08-05: *"you don't have to forget about the ticket system… the common concept, which is very well known in software development… we're going to save them directly in the files instead of GitHub issues."*
- **Modes are permitted again.** User 08-05: *"I think we can have two modes like we can have the topic mode and we can have the product mode… at this point that's completely fine to me."* The design as settled does not need a mode switch (one skill, one loop; product brainstorm differs only in whether it also writes `docs/spec/`), but the prohibition is lifted.
- **Wayfinder is fully rejected.** User: *"about the Wayfinder, you can throw it out completely to trash."* Nothing from it survives — no map file, no fog of war, no decision tickets, no frontier query, no ticket types.
- **`issues.md` is not carried forward.** The 08-04 note calling it the highest value-per-line artifact is withdrawn. User: *"in that scenario, in that workflow, they were completely useless."*
- **Delapse is evidence of failure only.** Stated three separate times. Never a file set, folder shape, or process to copy — including `dev-panel-program.md`, which the agent twice held up as a good artifact.

### The settled shape

Three kinds of thing. Nothing else.

**Topics — the thinking.** A topic is the brainstorm entity; brainstorms only ever live inside one.

```
docs/topics/<slug>/
  topic.md            frontmatter only + a short intro
  brainstorm/
    tree.md           the WHOLE tree, always one file, however big
    <branch>.md       one detail file per ROOT branch
  research/           SUPERSEDED 2026-08-06 → global docs/research/
  proto/              SUPERSEDED 2026-08-06 → protos/ at repo root
```

**Both sub-folders are gone as of 2026-08-06** — reports outlive the topic that commissioned them, and a
prototype is runnable code that must not sit under `docs/`. A topic folder holds `topic.md` + `brainstorm/`
and nothing else. See `## SESSION 2026-08-06`.

`tree.md` holds the outline plus **one line of resolution per resolved node** plus a link into the branch file. That one-line-per-node record **is the decision log** — there is no separate decisions file; adding one was caught and killed during the session as a third home for the same content. Split deeper than a root branch only when a sub-branch's discussion passes ~200 lines. Read-aloud `t01` is the calibration: ~40-line tree, five root branches (A product / E business / B architecture / C pipeline / D caching), ~1,000 lines of detail → tree.md ≈ 60 lines + 5 files. Its 75-line "session resume" blob at the top exists only because status was invisible inside 1,000 lines of prose; with a tree file it collapses to three lines.

**Tickets — the work. ONE FLAT GLOBAL POOL for the whole project.**

> **SUPERSEDED 2026-08-06 (second session) on the FILE question only — a ticket is now a FOLDER.**
> `docs/tickets/t047-daemon-detection/` holding `ticket.md` (constant name, like `SKILL.md`), `handoff.md`
> (the resume), and one `<slug>.md` per dispatched job brief. Uniform **from birth** — never promoted,
> never a mixed directory, path never changes. Everything else in this section stands: one pool, global,
> flat at the pool level, no hierarchy in the path or the name. Reason for the change: a job brief for a
> separately-dispatched agent (debugging, a parallel investigation) needs a real sibling file, and the
> agent's counter-argument — that an "inside" recreates delapse's `m08e` nesting — does not survive it,
> because decomposition already has a designated exit in the **topic** concept. See
> `new-workflow/remaining.md` → `## 2d2`.

```
docs/tickets/t047-daemon-detection.md
```

Not per-topic, not nested, no folders, no hierarchy in the path or the filename. The deciding argument is the user's own: feature B is small and can only exist after feature A, and A and B came from different brainstorms — with one pool that is `deps: [t031]` and needs no cross-boundary scheme. It also absorbs the case with no topic at all (a bug, a stray idea) with no second mechanism, which is what killed `backlog.md` and `roadmap.md`.

```yaml
---
id: t047
title: Daemon detection handshake
status: todo          # todo | in-progress | review | done | dropped | superseded
type: feature         # feature | issue | chore | research  — REINSTATED 2026-08-06
topic: local-daemon   # provenance; omitted for stray bugs/ideas
deps: [t045]          # the ONLY relational field
---
```

Field discipline — **store only what can't be computed**:
- **`parent` was removed.** `topic` already groups, and the containment link is stored once on the topic side (`from:`). Collapsing `parent` *into* `deps` (the user's first suggestion) was argued down and the user accepted the reasoning: a parent isn't done until its children are, so parent-as-dependency is a cycle.
- **`blocked` is not a status** — derivable from `deps`.
- ~~**Ticket `type` was removed.**~~ **REINSTATED 2026-08-06 with four types — see `## SESSION 2026-08-06`.** The 08-05 removal killed six *agent-invented* types that changed no behaviour; the user's reason for wanting types is different (filtering, which is why frontmatter exists at all) and it holds.
- Splitting a ticket without a brainstorm still groups correctly, because the children inherit the same `topic`.

**Statuses, each with a behavioural difference:**

| | meaning | in `--ready` | satisfies another ticket's `deps` |
|---|---|---|---|
| `todo` | written, not started | yes, once deps are done | no |
| `in-progress` | being worked now | no | no |
| `review` | built, checks ran, being reviewed | no | yes |
| `done` | reviewed and accepted | no | yes |
| `dropped` | decided against | no | **no — and it must raise an error on any dependent** |
| `superseded` | replaced; carries `by: [t20, t21]` | no | no — dependents re-point to `by` |

**`review` = code review, not manual QA.** Corrected by the user against the agent's wrong reading; grounded in `reference/superpowers/skills/requesting-code-review/SKILL.md` — a reviewer subagent gets base/head SHAs plus the requirements and returns strengths/issues/assessment. It is **universal**, not conditional on there being a UI. The agent's earlier "only tickets needing your eyes pass through review" is withdrawn.

`dropped` vs `superseded` earn separate existence solely through their effect on dependents.

**Topic frontmatter:**

```yaml
---
slug: local-daemon
title: Local daemon provider
status: in-progress   # in-progress | parked | committed | dropped
from: [t014]          # ARRAY — several tickets can feed one design session
---
```

No `done` status: a topic is a document, not work; whether the work finished is a question about its tickets. `parked` is the only state here not derivable from something else, and it is the important one — **a finished brainstorm you deliberately did not turn into tickets.** The two exits from a brainstorm are **commit** (write tickets) or **park** (write none). The current flow can express neither: a brainstorm either becomes a spec that then rots as an unbuilt forecast, or sits as 1,000 lines nobody reopens.

### The loop — the piece that was missing

The black-box complaint was real and this is the fix. **A ticket is one of three shapes, and which one is visible from the file:**

1. **Unopened** — a title and a paragraph. Nobody has judged its size yet.
2. **Broken down** — a topic exists with `from: [this]`, and child tickets carry that topic. The work is in the children.
3. **Planned** — it has a `## Plan` section. Buildable now.

**An unopened ticket becomes shape 2 or 3 at pickup, never in advance. That judgment is the only real decision in the system.** Implementation only ever happens on a ticket with no children.

Full trace, no skipped steps: brainstorm closes → commit → coarse tickets exist → `flow tickets --ready` → pick one → *can I plan this?* → **no**: open a topic with `from: [t]`, brainstorm, commit, emit children, t becomes `in-progress` because its children are the work → **yes**: examine the current state, write `## Plan`, `in-progress` → build → `review` → `done` → the next ticket's deps are satisfied → repeat → all children done → parent done.

### Commands, not an index file

No `INDEX.md`. A generated file that gets committed is a cache that can be stale — the same failure as `roadmap.md`, automated. Commands compute from the files every time.

> **THE COMMAND LIST BELOW IS A REJECTED FIRST DRAFT — SUPERSEDED 2026-08-06 (second session).** The user
> never really approved it ("very terribly designed and very confusing"); he waved it through to keep the
> session moving. Five faults: `ticket` vs `tickets` as different commands; `set <id> status=done` key=value;
> the word "status" meaning both project state and a frontmatter filter; `--ready` buried as a flag though it
> is the query the whole no-index decision rests on; no topic commands at all. **The confirmed surface, plus
> language (JavaScript), root discovery (`git rev-parse --show-toplevel`), templates and naming
> (`ptree`, `merge`), is `new-workflow/remaining.md` → `## 2a` / `## 2a2`.** The principle above — commands
> compute, never a committed index — is unchanged and is why they exist.

```
flow ticket new "<title>" --topic <slug> [--deps t045]    assigns the next id, writes from template
flow ticket set <id> status=... | deps=...                edits frontmatter, validates references
flow tickets [--status] [--topic] [--ready] [--tree]      --ready = todo + every dep done  ← "what's next"
                                                          also reports cycles, dangling ids, dropped-blockers
flow status                                               active topic, in-progress, review pile, ready set
```

No delete. `status: dropped` is the archive. Files are plain markdown + YAML, so grep still works if the tooling is missing — the commands are convenience, never the source of truth.

### The plan

A `## Plan` **section inside the ticket file**, written at pickup, never earlier. One file carries the whole lifecycle (what → deps → plan → outcome) against delapse's five per milestone (`spec.md`, `brainstorm.md`, `plan.md`, `issues.md`, `session.md`) with the same content in three of them.

Two parts:

1. **What's actually there.** Examine the current state of whatever this ticket changes *before* writing steps, and record it — current signatures, where the seam is, what surprised you. This is the surprise-catcher that replaces complete-code-in-plans. Evidence: `m29a/issues.md`'s real findings sit under **"Pre-planning verification"**; m10 exists at all because someone read the schema and noticed `sources` conflated a permanent video identity with a per-capture registration event.
2. **Numbered steps**, each naming the files it touches.

**The code rule — "no code bodies" was WRONG and is withdrawn.** The user challenged it and the survey proved him right. `m00-monorepo-scaffold`'s spec carries the full `turbo.json`, four tsconfigs, three ESLint configs, `.npmrc`, `.node-version` and the pinned pnpm catalog — none of it transcription; you cannot say "write a turbo.json" and get the right `globalEnv` list. Same for `m11`'s ten-line `unwrap<T>()`, on which every repo method's shape depends.

> **Write the code that was decided. Describe the code that follows from it.**
> Test: would two competent implementations differ in a way that matters? `turbo.json`'s `globalEnv` — yes, pin it. `RegistrationRepo.findLatestBySourceId` given its return type — no, describe it.

And it goes in **exactly one place**. m00's real waste was writing the config in `spec.md` (422) and again in `plan.md` (1,331). With no spec file it is written once. Honest projection: m11's 2,881 lines → ~300; **m00's 1,753 → ~500, barely shrinking**, because its content genuinely is decisions. A rule that shrinks everything uniformly would be the wrong rule.

**Parent tickets never get a plan.** Wanting to plan a ticket that has children means wanting their order, which is `deps`.

### Decomposition — "vertical slice" retired

The framing was code-shaped and is replaced:

> **Every ticket must be finishable and checkable without its siblings**, and it states what "done" looks like as something observable, written when the ticket is created.

For a codebase with a UI that forces end-to-end slices. For an API, one endpoint answering correctly. For a written framework, one section a reader can judge. **Nothing in this design is UI-specific** — the user's correction: *"this workflow is not just building some new UI. It's for building anything."* Every rule above has a non-code reading: "read the code first" → examine the current state of the material; "vertical slice" → the rule as stated; "checkable" → tests, a command's output, a rendered artifact, or a reviewer's judgment.

**Wide refactors are the exception and take expand → migrate → contract.** `m11-repo-layer` is the proof it works: build the new layer beside the old, move services across one at a time with tests green at every step, delete the old helper last — ten tasks, each green alone. `m25-popup-unification` is the counter-example: its spec says *"One milestone, no sub-split — nothing is meaningfully testable until the whole collapse is done… This deliberately overrides the repo's milestone-size rule."* The m11 pattern was available in the same repo and wasn't used.

The dev panel is the failure this rule targets: m29a built the config layer, m29b the fault layer, m30 the UI layer — three horizontal slabs, so nothing was visible until the last one landed. User: six weeks implementing with his eyes closed.

### Mid-build discovery — the m08 case, solved

`m08-preprocessing-beats` holds `kb-brainstorm.md`, `kb-design.md`, `review.md` **and a nested milestone folder `m08e-pipeline-rewrite`** — because a milestone was a folder and a mid-build discovery had nowhere else to go.

Re-run the pickup judgment. Three outcomes:

1. **Separate work** → a new ticket. It is a new file in the flat pool, a sibling of nothing. Add to `deps` if the current ticket needs it. *(This is what `m08e` should have been.)*
2. **Breaks the plan, not the ticket** → rewrite the `## Plan` section in place; put the finding in part 1. delapse instead wrote a second document beside the first — `plan-superseded.md`, `plan-b.md`, `plan-draft.md`, 2,327 dead lines.
3. **Breaks the ticket** → `superseded` + `by:`; dependents re-point; open a topic if the replacement needs design. *(This is what `kb-brainstorm.md` / `kb-design.md` were.)*

**The flat pool is what makes this work.** Inside `m08/` the only options were cram-it-in or invent `m08e` and nest. When a ticket is a file in one directory, a discovery is a new file; there is no "inside" to be stuck in.

### New evidence gathered 2026-08-05 (survey of all 44 delapse milestones)

- **~57,000 lines of `plan.md` against ~10,400 of `spec.md`** across 44 milestones — plans run **5.5×** specs.
- Ratio is diagnostic, not random. **Lowest** where content genuinely is configuration/contracts: m00 3.2×, m27 2.8×, m14 2.4×. **Highest** where the plan re-types derivable code: m30 14.6×, m11 12.3×, m29c 11.9×, m25 9.1×, m10 8.9×.
- `m11` Task 2 spends 217 lines writing out `registration.repo.ts` in full; its actual decisions are a ~15-line "Interfaces: Consumes/Produces" block.
- Dev control panel, one feature, six milestones: **17,121 lines** — plans 11,652, dead plans 2,327, specs 1,228, brainstorms 871, sessions 506, issues 315, program doc 128.
- `m19-scrub-back` ran a **spike first** (`temp/research/scrub-back-spike-results.md → ✅ PASS`) before its spec — a prototype ticket unblocking a build ticket, in the wild.
- `m10` says outright *"All prior m09 work is uncommitted and is replaced by this milestone"* — a whole milestone thrown away; the `superseded` case.
- `m22-issue-fixes` has **no spec and no plan** — just `log.md` and `reports/`. A bug grab-bag wearing a milestone's clothes; the shape the milestone system had no room for, and the reason `bugs.md` and `audit/` had to be invented.
- `milestones/README.md` states the old serialising rule: *"only one milestone has a `spec.md` + `plan.md` at any moment."*
- Read-aloud `t01`: `brainstorm.md` 1,069 → `spec.md` 309, which covers **v1 only** — branch B4's daemon/hosted thinking survives nowhere but the brainstorm.

### Rejected 2026-08-05 — do not re-propose

- **Everything from Wayfinder** — the map file, fog of war, "only ticket what you can state sharply", decision tickets, the frontier query, ticket types.
- **A ticket file that gets "promoted" into a folder** when it needs brainstorming. User: *"plain up stupid and complete shit."* Topics are a distinct concept; that is what the promotion was faking. **Still rejected 2026-08-06 — and re-rejected in a second form** (promote on `todo → in-progress`, moving the ticket to another path). Promotion of any kind is dead: location would duplicate `status`, and all six statuses would then need a location rule. What replaced it is **folders from birth**, which is not a promotion — the shape never changes.
- **Per-topic ticket folders**, and hierarchy encoded in filenames or paths (the `e1-web-app/` + `s01-*.md` + `t14-*.md` mixture the user could not parse). One flat pool, `tNNN-slug.md`, uniform.
- **A `spec.md` surviving anywhere in the ticket system**, including disguised as a parent ticket holding Goal/Scope/Architecture/Success-criteria. The agent did exactly this and it was caught.
- **`INDEX.md`** or any committed generated index.
- **"No code bodies in plans."**
- **"Vertical slice"** as the framing.
- **Six ticket types** (`parent` and a stored `blocked` status stay rejected; **types themselves came back 2026-08-06** — four, not six).
- **Copying anything from delapse's shape** — `issues.md`, `dev-panel-program.md`, `bugs.md`/`debt.md`/`checks.md`, `now.md`, `roadmap.md`.

### Still open

- ~~**PRODUCT-MODE BRAINSTORMING — restart from scratch.**~~ **CLOSED 2026-08-06 — see `## SESSION 2026-08-06` below.** The 08-05 proposal (`docs/spec/` as `product.md` / `tech.md` / `decisions.md`) was rejected and rebuilt from scratch.
- The commands' implementation — where the script lives, how it is invoked, and whether `flow ticket new` being mandatory for id assignment is enforceable at all.
- Nothing forces the "examine the current state first" pass, and it is the load-bearing half of the plan.
- Whether a leaf ticket is always plannable in ~35 lines; a ticket spanning a migration plus a backfill plus UI probably isn't.

### Method note

The user's standing requirement, stated twice: **grill your own proposal before presenting it.** *"When you come up with a proposal, before even proposing it to me, you're literally marketing it. You need to extensively judge it, grill it… look for scenarios that this system is going to absolutely fucking fail."* Also: *"you shouldn't take my messages as a source of truth… I can only say what's wrong. I cannot say what's right."* Proposals from the user are direction, not specification — test them and disagree with the argument.

---

## SESSION 2026-08-06 — product mode, settled. Authoritative over everything above it

Closes the one item `## SESSION 2026-08-05` left open. Evidence base: `tmp/prod-brainstorm/` — four real
product brainstorms the user gathered, listed in `## Reference pointers`.

**Standing correction on how to read those four folders.** They were produced *without* this workflow —
"whatever we had in our hands." Their file lists are not a template. `lumacraft-spec/` is a **failure**;
`real-aloud-app/` is the user's **best and cleanest** brainstorm to date and the one to calibrate against.

### Corrections applied this session — these were all agent errors

- **The 08-05 file set (`product.md` / `tech.md` / `decisions.md`) is void**, and so is the 12-file
  expansion the agent proposed on top of it. The agent copied lumacraft's shape while citing it as
  evidence — lumacraft is the failure case.
- **`decisions.md` does not exist in `docs/spec/`.** The tree already *is* the decision log: real-aloud's
  `### Branch C2 — DECISIONS LOCKED (2026-07-21)`, `### Branch C5b — LOCKED (2026-07-23)` etc., dated,
  in place. A parallel decisions file is a second copy of the same facts. (Consistent with
  `design-init-flow.md` #12's knock-on, which already said `docs/spec/decisions.md` does not exist.)
- **`open-questions.md` does not exist either.** Unresolved `[ ]` nodes in the tree are the open questions
  during the brainstorm. After it closes, a real open question is a decision deferred to the ticket that
  will make it — so it lives *on that ticket*. Anything with no ticket is a scope-ladder item, not a
  question. delapse's `OPEN-QUESTIONS.md` proves the failure mode: its "Low Priority" section is nine
  ownerless bullets.
- **No `README.md` index and no frontmatter on spec files.** Both existed only to manage twelve files.
  User: *"kind of like an overkill."* Two files need neither.
- **Artifacts are never copied into `docs/spec/`.** A copied mockup is a second version that stops being
  updated — delapse's `UI-MOCKUP-REFERENCE.html`, marked "inspiration only," is that fossil.
- **Walk order is not a fixed template.** "Product and business first" was read off real-aloud and
  generalised wrongly. A personal tool has no business branch at all.
- **The V2-rewrite scenario is dropped as a design driver.** User: it happened only because V1 was never
  planned and everything was vibe-coded — rare, and the thing this design exists to prevent.
- **`tech.md`'s "components" means high-level components** — backend, frontend, services, workers, shared
  packages. Not UI components.
- **`tech.md` needing prototype evidence is a non-issue.** Minimum content is stack, tooling, high-level
  design, what components exist. None of it waits on a spike.

### The engine — identical to topic mode

Product mode does **not** get a different brainstorming engine. Proof: `real-aloud-app` was a full product
brainstorm — standalone OSS product, licensing, revenue model, three-phase platform roadmap, full technical
pipeline — and it ran as the ordinary decision tree. 1,069 lines, five root branches (A product / E business
/ B architecture / C pipeline C1–C5 / D caching), walked over four days with research reports and a real
prototype feeding C and D.

Three things differ, none of them the engine:

1. **Walk order is itself a decision**, recorded in the tree. Real-aloud's header: *"Walk order (per user,
   2026-07-20): resolve product + business first (A, E), then technical (B, C, D)."* The rule is a
   dependency rule, **not** a template — *branches that constrain other branches go first*. In real-aloud
   that produced business-before-architecture for a concrete reason: AGPLv3+CLA determined whether forking
   HeadTTS was viable at all. A personal tool has no such constraint and goes straight at the product.
   Roots and order are derived from the idea each time and **confirmed before walking**.
2. **Multi-session by default.** Real-aloud's resume pointer grew to 75 lines. That is `handoff`'s job now,
   not the tree's.
3. **The exit has an extra step** — see below.

**Kickoff is not a design gap.** The user opens with a rich description of the idea; the agent proposes root
branches plus walk order; the user reacts; the walk begins. Do not build a discovery interview for this.

### Paths

```
docs/brainstorm/          the product brainstorm. Singleton, project altitude.
  tree.md                 the whole tree, always one file however big
  <branch>.md             detail, only for branches that actually grew
docs/spec/                the output. Markdown only. Base = product.md + tech.md.
docs/research/            every report, flat, subject-named. GLOBAL — see below.
docs/intake/              external material, preserved as-is (already designed, genesis #2)
docs/topics/<slug>/       per-topic brainstorms, spawned from tickets
docs/tickets/             the one flat global pool
protos/<name>/            every prototype. Repo root, NOT under docs/.
```

**Branch numbering — zero-based indices, not letters (locked 2026-08-06).** Real-aloud used `A`/`B`/`C1`–`C5`;
replaced by `0`, `1`, `2` at the root and `0.0`, `0.1`, `0.2` beneath, zero-based at every level. Detail
files take the index as a prefix — `0-product.md`, `2-pipeline.md` — which is the point: once branches
split into files, index prefixes sort and read cleanly where letters don't. Tree lines become
`[x] 2.3 — the chunker + streaming orchestration`.

**`docs/brainstorm/` supersedes `design-init-flow.md` #1b's `docs/work/brainstorm.md`** (a single file at
project altitude). One file cannot hold a product brainstorm — #1b itself flagged that as a surviving
concern. Same split rule as topic mode: tree always whole in one file, detail split out.

**How the detail splits.** Not one file per root branch. Real-aloud's 1,069 lines break down as branch C
≈ 590, branch B ≈ 100, branches A + D + E ≈ 125 combined. So: **a branch gets its own file when it grew;
the rest stay in the tree.** Real-aloud would have been `tree.md` + `pipeline.md` (C) + possibly
`architecture.md` (B). Two or three files.

**`protos/` at repo root, flat, one folder per prototype, named by what it proves** — `protos/tts-lab/`,
`protos/reading-view/`, `protos/cost-model/`. Plural, matching `docs/` / `skills/` / `scripts/`. Reasons: (a) prototypes are runnable projects with
dependencies and build output, and `docs/` stops being documentation the moment code lives in it;
(b) they outlive the brainstorm — `tts-lab/artifacts/test3-golden.json` is a golden file that becomes a
test fixture when the real chunker is built. This is what real-aloud actually did: `tts-lab/` sat at the
project root beside `docs/`. **No grouping by kind** — a UI mockup, a TTS benchmark and a cost model are
all just prototypes; a `ui/` subfolder was proposed and rejected. Each carries its own `REPORT.md`.

**`docs/research/` is GLOBAL — this changes the 08-05 topic design**, which put `research/` inside each
topic folder. Reports outlive the topic that commissioned them (a competitor teardown serves three later
topics), topic folders go cold by design, and burying live evidence in a cold folder is how it stops being
found. Same argument the user already accepted for one flat global ticket pool.

### `docs/spec/` — two base files, and what earns a third

**`product.md` — the Bible.** The whole product in one file: what it is, who it's for, every behavior,
how each thing works from the user's side, and the **scope ladder** (V1 / next / later / never) marking
which rung each behavior sits on. delapse's `PRODUCT-SPEC.md` is the right shape and size — 695 lines,
`## Product Concept` → `## Version Scope` → `## Core UX` (session lifecycle, indicator, popup,
ask-anything, history, settings, onboarding) → `## System Architecture` → `## Writing Rules` →
`## Account, Privacy, Abuse`. Splitting this into many files was proposed and rejected outright.

**`tech.md`.** Stack, repo layout, high-level components (backend / frontend / services / workers /
packages), high-level design, the technical decisions that constrain implementation, and the findings from
research and prototypes that drove them. delapse's `tech.md` is 182 lines and holds exactly this.

**More files are expected** — a visual-heavy product needs `design.md` (design system as values: colour
tokens, type scale, spacing, elevation; the component inventory with variants and states; the screen
inventory with layouts and states — delapse m28's *"title bar + 212px left rail + one-section pane"* is
the right altitude). The birth rule is **disjointness, not count**:

> **A new spec file must own its subject completely. No fact may appear in two spec files. If the boundary
> cannot be stated in one sentence, it is a section, not a file.**

`product.md` = what it does. `tech.md` = how it's built. `design.md` = how it looks. Boundary against
`product.md`: `product.md` says *what happens on a screen* (swiping right adds to the watchlist);
`design.md` says *what the screen is* (single column, 16px gutters, card variant B). The screen list lives
in `design.md` only; `product.md` refers to screens by name.

**Why disjointness is the rule — the lumacraft diagnosis.** Lumacraft failed on overlap, not count. Four
files describe the assistant agent (`assistant-agent-architecture.md` 409, `ai-runtime.md` 288,
`brief-agent.md` 415, plus `architecture.md`'s AI section). Three describe the proposal flow
(`proposal-flow.md` 270, `assistant-agent-architecture.md` again, `api.md`'s proposals section).
`decisions.md` 177 restates facts already in `architecture.md` / `data-model.md` / `api.md`. When the
proposal model changed, three files needed updating and two got it — which is why
`change-tracking-history.md` 160 exists at all: a whole file to explain that Phase 1 was dropped
2026-04-24, because the files describing Phase 1 could not all be fixed. `decisions.md` fails the rule by
construction — it overlaps every other file.

**No history and no rationale in spec files.** The *why* is in the brainstorm tree, permanently, with
dates. That is what makes dropping `decisions.md` safe rather than lossy. Superseded content is
**rewritten, never annotated** (already a locked rule). media-rec's `04-card-types-feed-mechanics.md` —
296 lines, ~90% disapproved by the user, still sitting full-length in the folder marked DRAFT/SUPERSEDED —
is the failure mode.

### Artifacts: referenced, never copied

Everything is written once where it is produced. The spec points at it. Two places, both close to where
it is needed:

- **Inline, on the decision that rests on the evidence.** In `tech.md`: *"One chunk per synthesize call,
  never batch — embedding shortens prosody 700–850ms (`protos/tts-lab/REPORT.md`, T2)."*
- **A short reference block at the end of each spec file** — the artifacts that matter for that file's
  subject, one line each: what it is, why you'd open it. `design.md` ends with its mockups; `tech.md` with
  its spikes and teardowns. **No global index** — a reference is only useful next to the subject it
  supports, and a global one is the rejected `README.md` returning.

**The ticket inherits them.** When a ticket is minted from a V1 scope line it carries the artifact
references attached to that section, so the implementer does not go hunting. This answers the user's
"they'll be needed in future tickets" requirement.

**Conclusions transfer, evidence stays.** `tts-lab` is the model: three tests, a 226-line `REPORT.md`, and
what belongs in `tech.md` is two lines — *synthesis is deterministic, so the cache key
`hash(text+voice+speed+model)` is safe*; *exactly one chunk per synthesize call, never batch*. Full reports
run 1,601 / 757 / 449 lines; nothing that size goes near a spec.

**A mockup is never authoritative.** The spec text is. A superseded mockup is replaced or deleted, never
annotated.

### The exit — two phases

**Phase 1 — brainstorm.** Tree grows, branches resolve with dates, research and prototypes run alongside,
decisions live in the tree. Many sessions. Ends when every root branch is resolved or explicitly deferred.

**Phase 2 — write the spec, then convert.** Write `docs/spec/` in one go from the tree. Then mint tickets
**only from the V1 rung**. Everything below stays prose in the ladder.

**On the user's expectation that phase 2 supersedes/drops many tickets:** argued against and not
withdrawn. A ticket dropped before anyone picks it up cost a file, an id, and repairs to other tickets'
`deps`. delapse's own `## Version Scope → V1 / V1.1+ / V2+ / V3+` holds three future versions as prose and
none of it is a milestone. Tickets *inside* V1 will still get superseded as building teaches you things
(m10 replaced m09 outright) — that is fine and the statuses handle it. What disappears is bulk speculative
churn.

**The scope ladder is the exit condition, and it is load-bearing.** Three of the four gathered brainstorms
have one — delapse `## Version Scope`, media-rec `03-product-concept-v1-scope.md`, lumacraft "V2 initial"
stamped on every claim. `real-aloud-app/prod-vision.md` is 237 lines of principles with **no scope ladder
anywhere**, and it was never built. A product brainstorm does not end when the thinking is done (delapse
still had open questions 44 milestones in); it ends when the V1 line can be drawn.

**The problem product mode exists to solve** is not the U-turn — the user confirmed a U-turn during
brainstorming is cheap, and the mid-implementation case is already handled. It is that real-aloud's
brainstorm resolved branches A, B, D and E and its `spec.md` (309 lines) covered **v1 only**, so branch
B4's daemon/hosted decision, E's licensing and revenue model, and A2/A3's positioning — all locked, all
dated, all argued — had nowhere to land. `product.md` covering the *whole* product across all versions,
with the ladder marking rungs, is the fix. B4's daemon is written into the Bible marked V2 and survives.

### Skill shape

**One skill, one engine, two exits.** The brainstorming body is shared; the mode only changes what happens
at close:

- **Topic mode (default)** — ends by writing tickets, or deliberately writing none.
- **Product mode** — ends by writing `docs/spec/`, *then* minting tickets from the V1 rung.

So the product-mode sub-file is about **the conversion**, not about brainstorming. Consistent with the
already-locked *"`brainstorm`'s core is not up for rewrite — the failure was at the seam."*

**Mode is entered explicitly** — the user asks for it, or `init-flow` offers it on a fresh project. No
auto-detection; guessing wrong costs a whole session.

### Ticket `type` — reinstated, four values (locked 2026-08-06)

Reverses the 08-05 removal. That removal was correct for what it killed: six types the **agent** invented
with no behavioural difference. The user's reason is different — **filtering**, which is the reason ticket
frontmatter exists at all (his original requirement: *"custom headers for filtering them, like similar to
how skill files have"*). A type earns its place if it is a filter you would actually run, **or** it changes
what the ticket does.

**The field answers one question: what comes out of this ticket — code, or a document?**

| type | produces | notes |
|---|---|---|
| `feature` | code | new capability. The default. |
| `issue` | code | something is wrong. **`issue`, not `bug`** — user's call, and the right one: half of what gets filed is not a defect (a slow query, an inconsistent label, an awkward flow), and `bug` forces a is-this-technically-broken judgment before you are allowed to write it down. |
| `chore` | code | refactor, cleanup, dependencies, scaffolding. Real and common in the delapse history — m27 pure rename, m00 monorepo scaffold, m11 repo-layer refactor; none is a feature. Often no user-visible change, so it is checked by tests and build passing rather than an observable outcome. |
| `research` | a **document** | "which LLM models fit our situation", "cache-optimization strategies" — an idea saved for future investigation. |

**`research` carries a genuine behavioural difference**, and it is the user's own framing: it **always**
spawns thinking when picked up — a topic, a brainstorm, a report — and never goes straight to a plan.
Every other type can go either way and that judgment waits until pickup (the settled pickup rule).
`research` is the single case where the answer is known at mint time. The user's framing verbatim:
*"that research mode is basically saying that we need to brainstorm following topic in the future…
research is kind of a step under the brainstorm."*

**Dropped from the user's candidate list, with reasons:** `bug` (= `issue`), `investigation` (= `research`),
`idea` (an unopened ticket already *is* a title plus a paragraph; anything not yet committed to belongs in
the inbox, not the pool), `topic` (a topic is its own entity — a ticket that spawned one is already visible
from that topic's `from:`, so a type would be a second driftable copy of the same fact).

**The bar for a fifth type**, stated so the next one is a decision and not a whim: *it must change what the
ticket produces, or be a filter you would actually run.* The user raised the possibility of more
document-producing types and it is left open deliberately. **Watch for "design X" tickets** — designing is
not researching, and if those accumulate they are the real second document type.

### Notes about Flow itself — `~/.claude/flow-notes.md` (locked 2026-08-06)

**The gap.** `## Capture` in `flow/global/CLAUDE.md` routes everything to project-local destinations
(`docs/work/backlog.md`, `docs/work/inbox.md`, `docs/context/`, `## Project rules`). All of them are about
**the project**. Nothing holds a note about **Flow** — friction, annoyances, a step that did not work, a
missing capability, an idea for the next version of the workflow. The user is certain this will accumulate
(*"right now we're only building the V1 of this workflow"*) and there was no file for it.

**Locked: one global file, `~/.claude/flow-notes.md`.** Not `inbox.md` — that name is already the
project-local file, and reusing it guarantees a which-one-did-that-go-in ambiguity at capture time.

**Per-project files were proposed by the user and argued down; he accepted the reasoning.** Three costs:

1. **Collecting them is manual and lossy.** Flow gets fixed once, in the Flow repo. Per-project files mean
   visiting each project and remembering which ones have entries — the exact failure this design already
   killed twice (scattered roadmap files; per-topic `research/` burying evidence in folders that go cold).
2. **It puts Flow's noise in the product's git history**, and ships it if that repo is public.
3. **The context being preserved is one line.** Friction is situational ("this step is painful *in this
   monorepo*"), but that survives as a stamp on the entry — date, project, what you were doing. Cheaper
   than a folder structure and it keeps everything sortable in one view.

**Privacy is resolved by a user decision, not by the design:** he is symlinking the **whole `~/.claude`
folder** into a personal notes repo, so it is private and version-tracked. Nothing about any project goes
near the public Flow repo. This was his own objection and his own answer.

**Splitting later is allowed — by KIND, never by project.** Workflow friction / missing-skill ideas /
skill bugs, if one file ever gets painful. Start with one; splitting before it hurts is how the twelve-file
spec folder happened.

**Two implementation requirements:**

- **One new row in `## Capture`** with the routing test: *is this note about the thing I'm building, or
  about Flow itself?* Flow → `~/.claude/flow-notes.md`. Every other row unchanged.
- **`setup-flow-globals` must never overwrite it.** It writes into `~/.claude/`, and this is the one file
  there that belongs to the user rather than the template. A re-run destroying accumulated notes is silent
  and unrecoverable.

**Correction on the record — `setup-notes.md` is not a Flow file and never was.** The agent cited it as an
existing global notes destination; it is a **delapse** file, used as *evidence* in the 2026-07-29 survey of
77 files, and `design-init-flow.md` line 210 already says the file **disappears** in Flow (its content
flows inbox → `curate-skills` → a skill). There was no second global notes file to merge with. Do not
resurrect it.

### Evidence gathered 2026-08-06 (`tmp/prod-brainstorm/`, four real brainstorms)

- **The four folders are four stages, not four styles.** real-aloud = earliest (vision prose, prototypes
  running, no scope decisions); media-rec = mid (framework locked, but file 04 superseded); delapse = late
  (V1 near-locked, 46-entry decisions log, triaged open questions); lumacraft = post-build (spec became a
  living architecture reference — "implemented to date", "locked from M20", no product brief at all).
- **The scope-ladder finding** (above): the only folder without one is the only product never built.
- **delapse's spec folder already holds non-markdown assets** — `logo.png`, `styled_logo.png` sit beside
  the markdown, and its `README.md` marks `UI-MOCKUP-REFERENCE.html` "historical" and
  `technical-decisions-appendix.md` "deprecated — safe to delete." Drift, in his own index.
- **media-rec's `07-conversation-arc.md`, 164 lines**, is a round-by-round reconstruction of a 13-round
  chat — it exists *only because the reasoning was lost* and had to be rebuilt afterwards. A tree that
  records decisions in place, dated, never needs it.
- **media-rec `ctx/00`–`ctx/10` is the external-handoff-pack case.** It goes to `docs/intake/`, untouched
  (not `docs/research/` — an earlier agent error). The brainstorm reads it and builds a tree from it; the
  first pass is checking which of its conclusions still hold.
- **`voiceover-feature/` is `brainstorm.md` 133 + `spec.md` 184** — that is a topic, not a product. The
  discriminator: **if every root branch can be resolved in one session, it is a topic.**

### Rejected 2026-08-06 — do not re-propose

- **`decisions.md`, `open-questions.md`, `README.md` index, or frontmatter anywhere in `docs/spec/`.**
- **Splitting the product spec into many files** by taxonomy. One Bible.
- **Copying mockups, prototypes, reports or any artifact into `docs/spec/`.**
- **A `protos/ui/` subfolder** or any grouping of prototypes by kind.
- **Letter-lettered branches** (`A`, `B`, `C1`) — zero-based indices instead.
- **`bug` as a ticket type** — it is `issue`.
- **`idea`, `topic`, `investigation` as ticket types.**
- **Per-project files for Flow-workflow friction** — one global `~/.claude/flow-notes.md`.
- **`setup-notes.md`** — a delapse file, dead in Flow. Never a destination.
- **A fixed walk order** (product/business first) as a template.
- **The V2-rewrite scenario** as a design driver.
- **A separate skill for product mode.**
- **Auto-detecting the mode.**

### Still open

- **Nothing blocking in product mode.** The engine, paths, spec set, growth rule, artifact handling,
  phases, conversion and skill shape are all settled. Ticket types and `flow-notes.md` are settled too.
- **The scripts are the real blocker** — named everywhere since 08-05, specified nowhere. See
  `new-workflow/backlog.md` → `## Scripts`. The ticket system is not usable without them.
- **`prototype` needs its own brainstorm before it can be built** — product mode leans on it for three
  jobs (feasibility spikes, UI mockups, proof-of-concept builds) and what the skill *is* was never decided.
- Carried from 08-05 and unchanged: nothing forces the plan's "examine current state first" pass;
  whether a leaf ticket is always plannable in ~35 lines.
- Left open deliberately: a **fifth ticket type** for document-producing work that is not research
  ("design X"). Bar stated above; wait for real cases.
- Knock-on to apply when the skills are written: `design-init-flow.md` #1b's `docs/work/brainstorm.md`
  path, the 08-05 per-topic `research/` and `proto/` folders, and the two `flow-notes.md` items in
  `backlog.md`.

### Session order of events 2026-08-06 (so the reasoning is reconstructable)

The design did not arrive whole; it was reached by four rounds of the user rejecting agent proposals.
Recorded because the *rejected* shapes are the ones an unprimed session will re-propose:

1. Agent proposed a **12-file `docs/spec/`** with a README index and per-file frontmatter, modelled on
   lumacraft. Rejected — lumacraft is the failure case, and the agent had cited it as evidence.
2. Agent proposed **`decisions.md` + `open-questions.md`** running alongside the brainstorm. Rejected —
   the tree already holds both.
3. Agent proposed **copying mockups into `docs/spec/`** and a `protos/ui/` subfolder. Rejected — many
   kinds of prototype exist, `ui` is not a meaningful grouping, and a copy is a second version that stops
   being updated.
4. Agent proposed **`~/.claude/inbox.md`** merged with a non-existent `setup-notes.md`. The merge premise
   was wrong; the destination survived under a non-colliding name.

Standing method note from 08-05 still applies and was exercised repeatedly: **grill the proposal before
presenting it**, and treat the user's messages as direction rather than specification.

---

## Reference pointers

- `tmp/local-refs/delapse-docs/` — the 2026-08-04 study case (180 files; `work/audit/index.md` is the self-diagnosis). Survey of all 44 milestones done 2026-08-05 — measurements in `## SESSION 2026-08-05`. Evidence of failure only; never a shape to copy.
- `tmp/prod-brainstorm/` — four real product brainstorms, the evidence base for `## SESSION 2026-08-06`.
  `real-aloud-app/` = the user's **best and cleanest** brainstorm, the calibration case (`prod-vision.md`
  237 with no scope ladder — never built; `tts-lab/` prototype at project root; `voiceover-feature/`
  133+184 = topic-sized). `delapse-spec/` = the late-stage shape (`PRODUCT-SPEC.md` 695, `tech.md` 182,
  `DECISIONS-LOG.md` 560, `OPEN-QUESTIONS.md` 102, README index, images in-folder). `lumacraft-spec/` =
  **the failure**, 12 overlapping files, the reason the disjointness rule exists.
  `media-recommendation-app/` = the external-handoff-pack case (`ctx/00`–`ctx/10`, `07-conversation-arc.md`
  164 reconstructing lost reasoning, `04-card-types` 296 ~90% disapproved and still in the folder).
  Produced *without* this workflow — never a template.
- `tmp/refs/real-aloud-app/` — the read-aloud brainstorm as it actually ran: `docs/work/topics/t01-reading-engine/` (`brainstorm.md` 1069 → `spec.md` 309, plus `research/` reports), and `tts-lab/` — a real feasibility prototype (harness + `REPORT.md` + artifacts) that proved three claims before the design depended on them. The calibration case for what a topic folder holds.
- `reference/superpowers/skills/requesting-code-review/SKILL.md` — the definition of `review` adopted here: a reviewer subagent given base/head SHAs plus requirements.
- `tmp/study-cases/read-aloud-app/case3/` — the study case (`brainstorm.md` 1069 lines, `spec.md` 309).
- `new-workflow/design-project-genesis.md` — #1 canonical `docs/spec/` target, #2 intake, #3.2.a project-altitude engine, #3.2.c research storage split, #4 derivation, #5 single adaptive flow.
- `flow-skills/skills/brainstorm/` — `SKILL.md`, `write-spec.md`, `write-plan.md`.
- `new-workflow/design-explain-rework.md` — the parallel explain/CLAUDE.md thread.
