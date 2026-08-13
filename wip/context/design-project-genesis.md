# Design — Project Init (front-of-lifecycle)

> Skill name: **`project-init`** (renamed from "project genesis" — too fancy; reclaims the name from the deprecated v1 command it replaces). Phase working-name = **Consolidation** (internal, soft). "genesis" left in a couple of older notes below = the init record / an init run.

_Live brainstorm record. Started 2026-07-16. Meta-work on `agentic-workflow_v2/`._

Designing the **front of the v2 lifecycle**: how a user goes from a raw project idea (or an existing project) to an implementation-ready foundation. v2's middle (brainstorm → spec → plan → execute) is already built; this is the missing front end.

---

## Ground rules for this discussion

- **Plain conversational brainstorming only.** Do NOT invoke `superpowers:brainstorming` or the v2 `brainstorming` skill on this meta-work.
- **framework-build/ is read-only reference.** Its principles (D8, D9, D16, D23) are largely correct for this front-of-lifecycle and are the sound starting point — but adapt to v2, don't port verbatim.
- **v1 `project-init.md` is DEPRECATED** (root project's `.claude/commands/project-init.md` + `docs/agents/commands/project-init.md`). It fills v1-shaped files (docs/agents/conventions.md, commands.md, roadmap.md, milestones) that don't exist in v2. Do NOT reference it as a model.
- No file changes to deliverables without explicit approval.

---

## The core insight (the dependency I had backwards)

`docs/spec/` is the **foundation** and must be complete **first**. CLAUDE.md and backlog.md are both **derived from it** — name/stack/structure, the first thing to build, and the rest of the backlog all come from the spec. You cannot write either before the spec folder exists.

Overall shape:

```
variable input  →  [ normalize / consolidation phase ]  →  canonical docs/spec/  →  derived scaffold
 (intake/)          synthesis + technical de-risking        base + emergent files    (CLAUDE.md, backlog.md)
```

Two entries into the SAME flow: **greenfield** (loose docs / an idea) and **migration** (existing repo + its docs). One adaptive skill, not two modes.

---

## LOCKED decisions

### Spec-first is mandatory (not opt-in)
For the initial version, the spec-folder path is **required**, following framework-build's approach. (This reverses an earlier "make it opt-in" idea — that's dropped.)

### #1 — Canonical target (`docs/spec/` structure)
- **Not a rigid template.** Stable **base = product, tech, decisions**.
- Each base file can **split into multiple** files — tech especially (`tech/stack.md`, `tech/architecture.md`, possibly several tech files).
- Plus **emergent additional types** as the material warrants: `open-questions`, `market-validation`, marketing reports, etc.
- The agent **proposes the final structure at the END of the normalize phase**, based on what's actually there. Base trio always present; everything else emergent.
- If the user brings **market-validation / marketing docs**, utilize AND preserve them.
- (Open, minor: whether to also keep original intake files inside spec/ — resolved by #2: originals stay in `intake/`.)

### #2 — Intake
- Dedicated **`docs/intake/`** folder. User pastes whatever they have there — idea, product bible, tech-stack file, market-validation reports, any mix.
- The normalize phase **reads `intake/`**, synthesizes canonical files into **`docs/spec/`**, and **leaves the originals in `intake/`** (preserved reference, never overwritten).
- **Rejected alternative:** pasting straight into `docs/spec/` and normalizing in place — loses the raw/canonical boundary and mangles originals.

### #4 — Derivation (spec → scaffold)
- Once `docs/spec/` is canonical, **generate** CLAUDE.md (name/stack/structure) + backlog.md (first thing to build, then future work) **from it**.
- Strictly downstream of the spec being ready.
- (Exact "is derivation a separate step or the phase's closing step" — treat as agreed-in-principle; mechanics TBD, low controversy.)

### #5 — Greenfield vs migration
- **Single adaptive flow.** No two modes. "Take whatever it is and make it work." Greenfield (loose docs) and migration (existing repo + docs) are just two entries into one flexible skill.

### #3 — The normalize phase — REFRAME + stop condition
- **NOT "gap-filling."** It's **synthesis + technical de-risking** → produces a **complete, validated, build-ready foundation**. Put the pieces together, pressure-test that it's practical, do the technical research and evaluations, until there's a **full product idea AND a full technical plan** you could start building from immediately.
- The gap-map (3.1) is the **starting diagnostic**, not the work itself.
- **Names (LOCKED):** skill = **`project-init`**; phase working-name = **Consolidation** (internal, soft).
- **STOP CONDITION (outcome-defined, not gap-defined):** done = a reader could pick up `docs/spec/` and **immediately (a) fill the backlog and (b) start implementing, with NO unresolved technical unknowns.** Higher bar than "documented all decisions" — feasibility is actually *resolved*, not just discussed.
- **Implication:** the phase does **real technical work** — the `research` skill, option evaluations, feasibility checks — not just conversation. Technical is the heart (user's emphasis).

### #3.2.a — Engine of the technical core (CONFIRMED)
- **Reuse the `brainstorming` loop mechanics** — walk a branch tree one at a time, propose→recommend→react→write, `research` before technical recommendations, `visualization` for architecture — as the engine of the technical de-risking work.
- The **3.1 gap-map IS the initial tree** (technical-critical first). Consolidation feeds it in and walks it; no new tree from scratch.
- **BUT Consolidation is its own project-altitude skill**, not a literal call to the milestone-scoped `brainstorming` skill. Key difference is **altitude + output target:** `brainstorming` runs at milestone/feature altitude → `docs/work/topics/<slug>/brainstorm.md` → `write-spec` → one topic `spec.md`. Consolidation runs at **project altitude** → canonical `docs/spec/` foundation (product/tech/decisions). Same loop pattern, different altitude and destination — the two must not bleed (a genesis run must never dump into `docs/work/topics/`).

### #3.2.b — What "resolved" means (CONFIRMED)
Operational definition of the stop condition's "no unresolved technical unknowns," given Consolidation writes docs, not code:
- **Instrument = research, not code spikes.** De-risk via `research` + `research-evaluation` (docs, option comparison, API-behavior checks, currency validation). **No code written in Consolidation** (breaking the project-altitude boundary = starting to implement). A gap is resolved when research confirms the approach is viable AND the specific integration path is known — concrete enough an implementer won't hit a "can this even work?" wall.
- **Depth governor = one-way vs two-way doors** (anti-gold-plating):
  - **One-way doors** (irreversible, high blast radius, cross-cutting — stack, core architecture, data model, load-bearing integrations) → **must be resolved now.**
  - **Two-way doors** (reversible, local, cheap to change) → **noted + deferred** to implementation time ("decide when building X"). Forcing these to closure now = over-engineering the spec.
  - Depth per gap = "research until an implementer wouldn't stall, no further." Gap-map's technical-critical-first ordering aims research at one-way doors first.
- **Escape hatch = code-only unknowns become a flagged first spike, not a silent gap.** When only running code can prove viability (e.g. throughput under a specific library), Consolidation does NOT fake resolution on paper. It records the risk explicitly in `docs/spec/` (decisions/open-questions), and the derived `backlog.md` makes its **first item a spike** to de-risk it.
- **Net:** "no unresolved technical unknowns" = every one-way door research-resolved, every two-way door consciously deferred, every code-only risk a flagged spike. Nothing load-bearing left to chance; reversible stuff not over-researched.

### #3.2.c — How `research` plugs in + storage split (CONFIRMED)
- **On-demand, per-gap, in dependency order** — same as `brainstorming` already does. Walk a gap, hit something whose answer needs current knowledge, invoke `research` for that gap, commit. Each invocation is informed by gaps already resolved above it (don't research realtime-sync libs before the stack is settled). Gap-map's technical-critical-first ordering drives this. **Not an up-front batch pass.**
  - *Exception:* batch adjacent gaps sharing one underlying question into a single broad/comparative external prompt. Default per-gap; batch by judgment.
- **Mode selection inherited from the `research` skill**, not overridden: single focused lookup → direct tools (Context7/web/codebase); multi-source synthesis → external prompt.
- **External-prompt research is the primary multi-session driver.** That mode hands prompts to the USER, who runs them on their LLMs and returns file paths — a natural, possibly-hours/days-long pause. The technical core's biggest session boundaries fall here → direct link into 3.4 (the loop must survive "user went off to run deep-research prompts, came back tomorrow").
- **Storage split (the key distinction — reference vs. save):**

  | Artifact | Saved where | Relationship to working doc / spec |
  |---|---|---|
  | External research **reports** (substantial, user-run) + their **input prompts** | Dedicated **`docs/research/`** folder, one file per research question, **prompt + report kept together** for provenance | **Referenced by path only — never inlined.** |
  | **Synthesis** (what we learned, direction, caveats) | Consolidation working doc → folded into `docs/spec/` | Lives in the doc — the distilled value that survives compaction. |
  | **Direct-tool lookups** (Context7 / quick web check) | No separate file (no external report artifact) | Synthesized **inline** in the working doc. |
  | **The decision** the research informed | Working doc → `docs/spec/decisions` | In the doc, with a **path-reference** to the `docs/research/` report as evidence. |

  Rule: heavy external reports → files in `docs/research/`, referenced; light direct lookups → inline; only synthesis + decision live in the doc/spec — never the raw report body.
- **Folder placement:** `docs/research/` sits **parallel to `docs/intake/` and `docs/spec/`**. intake = raw material the user pasted (read-only); research = evidence generated during Consolidation (durable); spec = canonical foundation referencing both.
- **NOT one unified project-wide store.** `docs/research/` holds **Consolidation (project-altitude)** reports. Later, **topics/milestones get their own nested research folders** (e.g. under the topic folder) — research storage mirrors altitude, same as the working docs do.
- **Naming:** `<NN>-<slug>.md` — simple index + slug, **mainly the slug**. **No date prefix** (overkill). E.g. `01-realtime-sync-options.md`.
- **`research-evaluation` is explicitly OUT OF SCOPE for this design.** It's personal/unpublished, exists only to gather LLM-performance data for the user's own external-LLM ranking, and will be **deleted later**. It plays no part in Consolidation. Do not reference it here.

### #3.3 — Interaction half / phase structure (CONFIRMED)
Consolidation runs as an explicit 4-phase walk at project altitude:
- **Phase A — Assess** *(= 3.1):* read `intake/` by content → score dimension checklist → gap-map (per-dim status + ordered gap list, technical-critical first) → present "what I think you're building / solid / missing / order" → **user confirms/corrects before any gap-work.**
- **Phase B — Walk the gaps:** dependency-ordered, one branch at a time, propose→react→write into the working doc. **Interaction mode switches by the gap's dimension tag** (the main new idea in 3.3 — Consolidation is NOT uniformly "research everything"):
  - **Technical gaps → research-led** *(= 3.2)*: research resolves; one-way doors closed, two-way deferred, code-only → flagged spike.
  - **Product gaps → interview-led:** resolved by discussion, not research. Agent proposes a position on the product question, user reacts (e.g. "V1 scope is fuzzy — I'd pull X/Y out because they depend on Z; agree?"). Less lookup, more elicitation.
  - **Contextual gaps → captured only if the user has material; never forced.**
- **Phase C — Propose structure:** once the walk closes with no unresolved one-way doors, agent proposes the final `docs/spec/` layout (base trio always + emergent files the material warrants) → **user confirms the shape BEFORE any file is written** (explicit, not implicit-while-writing).
- **Phase D — Write spec:** write `docs/spec/` files from working doc + research synthesis, progressively, self-review (no placeholders, internal consistency), user gate.
- → hands off to **#4 derivation** (CLAUDE.md / backlog.md generated from the finished spec).

### #3.4 — Multi-session working memory (CONFIRMED)
The phase can span ~3 sessions; external-prompt research pauses (3.2.c) are the main session breaks; and there's no derived scaffold to lean on yet (CLAUDE.md/backlog.md come from the spec being built).
- **Working doc = a single file: `docs/work/consolidation.md`** (name soft, tracks phase/skill name). This IS the project-altitude `brainstorm.md` referenced throughout 3.2/3.3. One file, not a folder — durable outputs live elsewhere (`docs/research/` reports, `docs/spec/` foundation); this is the transient scaffolding that produces them. **Retained after the phase as the genesis record (not auto-deleted).**
- **Structure = brainstorm.md format + a status header:**
  - **"You are here" header** (top): current phase (A/B/C/D), the gap being walked, what's blocking. When research is out: "PENDING: prompts 03/04 handed off <date>; reports expected at `docs/research/03-*.md`,`04-*.md`; resume Phase B gap '<name>' when they return." — the precise resume pointer.
  - **Gap-map as the progress tree** (Phase A gap list, marked as gaps resolve).
  - **Full decision sections** (one per resolved gap, product + technical, path-referencing `docs/research/`).
  - **Open / pending / deferred** (unresolved gaps, deferred two-way doors, pending prompts).
- **Resume mechanic = the working doc's own status header.** A session resumes by reading `docs/work/consolidation.md` — its "you are here" header carries phase, current gap, and what's blocking. How a fresh session *finds* it without being told is the session-start entry question, **deferred to the `handoff` design**. *(Was: a bootstrap `now.md` reading "Project genesis in progress → resume from `docs/work/consolidation.md`", rewritten into its derived form at Phase D. Superseded 2026-07-27 along with `now.md` itself — see #8.)*
- **`context-capture` keeps it live** — the always-active skill writes decisions into the working doc the moment they surface, so it's never stale at a session boundary. No separate "save state before stopping" step.

### #3.1 — Assessment / gap-map (CONFIRMED)
- **Read all of `intake/` by CONTENT, not filename** (filenames carry no assumptions — `notes.md` might be the whole bible; `spec.md` might be half an idea). Parallel reads ≤4 files, merge-files.js for 5+.
- **Score against a fixed dimension checklist, three tiers:**
  - **Product** — what it is / who for, core features, V1 scope, non-goals, key flows
  - **Technical (weighted heaviest)** — stack (+versions/rationale), architecture, data model, integrations, deployment target
  - **Contextual (optional)** — market validation, constraints (budget/timeline/platform), success metrics. Captured if present, never required.
- Each dimension → **covered / partial / missing / N/A**, with the specific evidence or the specific gap. N/A where a dimension doesn't apply to the project type (a library has no deployment target; a CLI has no data model). Fixed checklist, adaptive marking.
- **Produce a gap-map artifact:** per-dimension status + an **ordered gap list, technical-critical first**. Written down; also **seeds the 3.4 multi-session working doc** (exact path/format settled in 3.4).
- **Present + confirm gate:** agent shows "here's what I think you're building / what's solid / what's missing / the order I'd work it"; user corrects **before** any gap-filling. The agent's read of loose intake can be wrong — validate the map before investing effort.

---

## OPEN branches (the discussion map)

Front-of-lifecycle top-level branches:
- **#1 canonical target** — CLOSED
- **#2 intake** — CLOSED
- **#3 normalize phase** — CLOSED (all sub-branches 3.1–3.4 resolved; sub-map below)
- **#4 derivation** — CLOSED. Phase E of `project-init`; auto-generate CLAUDE.md/backlog.md from the finished spec → review gate; one confirm only if V1 start is ambiguous; migration needs no special path (old files were intake, already consolidated). Pair held (CLAUDE.md/backlog.md — was a trio until `now.md` was dropped 2026-07-27, see #8); the broader "derived set" question → became #7 (its own doc).
- **#5 greenfield vs migration** — CLOSED (single flow)
- **#6 skill topology** — PARKED (its own discussion: one skill or several? how triggered? does the phase reuse the existing `brainstorming` skill or is it its own thing? — note 3.2.a already settled the engine reuses the brainstorming *loop* but is its own project-altitude skill).
- **#7 the KNOWLEDGE LAYER** — **MOVED to its own doc `design-skill-ecosystem.md`** (approved 2026-07-17). Next action there: walk branch #1 (skill anatomy standard).
- **#8 now.md** — **SUPERSEDED (2026-07-27): `now.md` is dropped from the project entirely.** Reason: nearly every skill had to read it and keep it current, and that tax bought almost nothing — its one real value is the cold-start "what was I doing" pointer, which the handoff carries with strictly more information (state, binding decisions, files to read, first action). A topic already has its `brainstorm.md` / `spec.md` to orient from. Knock-on: #4 derives CLAUDE.md + backlog.md only; 3.4's bootstrap pointer goes with it; `flow/CLAUDE.md`'s session-start section deleted, to be rewritten with the `handoff` design. *(Was: CLOSED 2026-07-17 as a **thin cursor** — active-topic pointer only, written at topic boundaries, per-topic status living in the topic folder, next action inferred at session start.)*

#3 normalize-phase sub-branches:
- **3.1 assessment / gap-map** — CLOSED (above)
- **3.2 technical core** — IN PROGRESS.
  - **3.2.a engine** — CLOSED (reuse brainstorming loop, own project-altitude skill → `docs/spec/`).
  - **3.2.b what "resolved" means** — CLOSED (research not code-spikes; one-way/two-way door depth governor; code-only unknowns → flagged first spike).
  - **3.2.c how `research` plugs in + storage split** — CLOSED (on-demand per-gap; external-prompt = multi-session driver; reports → `docs/research/` referenced not inlined; synthesis+decision → working doc/spec; `<NN>-<slug>.md` naming; not unified — nested per topic later; `research-evaluation` out of scope).
  - **3.2 technical core is now CLOSED** (a+b+c done).
- **3.3 gap-filling interaction + stop condition** — CLOSED. Stop-condition half outcome-defined (above); interaction half = explicit 4-phase walk (Assess → Walk-with-mode-switching → Propose-structure → Write-spec), product interview-led vs technical research-led.
- **3.4 multi-session working memory** — CLOSED (single file `docs/work/consolidation.md` = project-altitude brainstorm.md; status header + gap-map tree + decision sections; the status header carries the resume pointer, session-start entry deferred to `handoff`; `context-capture` keeps it live).

---

## Pending mechanical fix (not yet done, awaiting go)
- `agentic-workflow_v2/docs/work/roadmap.md` → replace with `backlog.md` (settled from framework-build D16: no roadmap; flat backlog — no categories, no ordering, no status). Not touched yet.

---

## #7 — The knowledge layer → MOVED to `design-skill-ecosystem.md`

> **This section is now a dedicated design doc: `new-workflow/design-skill-ecosystem.md`** (spun out 2026-07-17, user-approved — it spans the whole skill/knowledge/publishing ecosystem, beyond front-of-lifecycle). The corrected model, the `debug-web-pages` study, and the 6-branch A-to-Z map live there. See that doc (and its **session-14e superseding update**) for the current design.


## Reference pointers
- `new-workflow/design-skill-ecosystem.md` — the #7 knowledge/skill/publishing ecosystem design (its own doc).
- `framework-build/docs/design-session.md` — D8 (project-level docs: product/tech/decisions), D9 (greenfield design phase), D16 (backlog not roadmap), D23 (three scenarios: greenfield / migration / cycle), D45–46 (brainstorm not implementation-specific).
- v2 skills already built: `agentic-workflow_v2/.claude/skills/` — brainstorming (+write-spec.md), writing-plans, executing-plans, context-capture, research, research-evaluation, visualization.
