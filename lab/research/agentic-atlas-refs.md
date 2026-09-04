Title: Statelessness

URL Source: https://agentic-atlas.dev/nodes/statelessness?projection=dark

Markdown Content:
## Why it matters — the problem

why-it-matters-the-problem.md

The default mental model is wrong, and designs inherit the error. People treat the agent as a **stateful colleague**: it read the file earlier, so it "knows" it; this turn builds on the last one _inside the model_; sending ten words costs ten words. Every one of those beliefs is false, and each quietly corrupts a design decision — what to re-send, what to persist, when to repair versus restart, why a long session degrades.

The shock that exposes the error: **one message is never one message.** Every API call re-ships the entire conversation — system prompt, tool schemas, full history — and the model re-reads all of it from scratch. A ten-word question at turn 30 ships the whole transcript behind it (the session-bill example measures the gap: a ~30k-token visible transcript, a ~680k-token actual bill).

## Definition

definition.md
**The model is a pure function of the window.** The window is the _entire_ state; it is rebuilt, re-shipped, and re-read on every call. Nothing persists inside the model between calls — no memory of the last turn, no accumulated understanding of the session, no experience from yesterday. What looks like memory is residency: the earlier material is still _in the window being re-read_, not remembered.

## Model and claims — one property, two faces

model-and-claims-one-property-two-faces.md

Correct the one belief and the rest of the design follows: continuity is something you **construct in the window** (or the world), never something the model provides.

The two faces are one coin — you cannot buy the feature without paying the cost. Re-shipping everything every turn is the price; disposable, reproducible, restartable [actors](https://agentic-atlas.dev/glossary/actor) are what it buys. Designs go wrong by seeing only one face: cost-only thinking hoards context and fights restarts (repairing in place to "save" the session); feature-only thinking fans out dispatches while ignoring the multiplier on every resident token. The tree's context-engineering family manages the cost face; the verification family spends the feature face.

## Scope and boundaries

scope-and-boundaries.md

_(Concept/substrate — a fact to internalize, not a move to make.)_ Nothing here prescribes a design step: the node states a property and corrects the belief that hides it.

What it does not hold is the consequences themselves. This node owns the property, the wrong mental model it corrects, and the map — each consequence is taught by the node that owns it, and the price arithmetic the cost face generates is [The Context Economy](https://agentic-atlas.dev/nodes/context-economy)'s, not this node's.

## Implications — the consequence map

implications-the-consequence-map.md

One property, two faces, and two nodes that make it survivable. This node owns the map; each consequence lives where it's taught:

*   **The cost face** — re-shipping is a per-turn multiplier on every resident token; the whole price arithmetic derives from it. → [The Context Economy](https://agentic-atlas.dev/nodes/context-economy) (_Statelessness — the first principle the arithmetic derives from_), measured in its [The Session Bill](https://agentic-atlas.dev/nodes/session-bill) example.
*   **The feature face** — a pure function of the window has no hidden state to lose, so **discarding a bad run is cheaper than repairing it**: re-dispatch, fresh-context resets, and parallel fan-out are all free moves. → [The Contract Keystone](https://agentic-atlas.dev/nodes/the-contract-keystone) (recovery role), _validate at the return seam; re-dispatch over repair; bounded autonomy — the contract keystone, applied_ (the applied form), [Momentum](https://agentic-atlas.dev/nodes/momentum) (fresh [dispatch](https://agentic-atlas.dev/glossary/dispatch) = zero momentum).
*   **The precondition** — discard-is-free only holds if the run didn't change the world; effects must be pure, idempotent, or isolated. → [Effect Discipline](https://agentic-atlas.dev/nodes/effect-discipline).
*   **The survivability move** — state the dispatch can't hold lives in the world instead: config, durable state, the shared [workspace](https://agentic-atlas.dev/glossary/workspace). → _accumulated memory, a **separate concern from config**_, _episodic skills with persisted, context-specific behavior — incl. the \_free idempotent setup\_ optimization_.

## Evidence

evidence.md
One empirical claim, and it is measured rather than asserted here: the gap between what a turn looks like and what it bills is read off the [The Session Bill](https://agentic-atlas.dev/nodes/session-bill) example. The rest is substrate — the consequence map is the proof, and each arrow is checkable at the node it points to.

## Relationships

relationships.md

*   **Parent:** Foundations — sibling of the other taken-for-granted pillars, [Effect Discipline](https://agentic-atlas.dev/nodes/effect-discipline) and [Verification Asymmetry](https://agentic-atlas.dev/nodes/verification-asymmetry).
*   **Consumed by:**[The Context Economy](https://agentic-atlas.dev/nodes/context-economy), [Momentum](https://agentic-atlas.dev/nodes/momentum), [The Contract Keystone](https://agentic-atlas.dev/nodes/the-contract-keystone) / _validate at the return seam; re-dispatch over repair; bounded autonomy — the contract keystone, applied_, _accumulated memory, a **separate concern from config**_, [Deferred Context](https://agentic-atlas.dev/nodes/deferred-context) (deferral exists because frontloaded tokens get re-billed).
*   **Canonical definition:**[GLOSSARY](https://agentic-atlas.dev/glossary) → _Statelessness_.

## Lineage

lineage.md
The pure function, and stateless protocol design (HTTP, and REST's statelessness constraint): nothing is carried between calls, so every request must arrive complete. The window is the request.

The relationships ledger
### Outbound References

1.   in-slice · occurrence 1

#### [The Context Economy](https://agentic-atlas.dev/nodes/context-economy)

**statics** — the price list: denominations, the quality curve, cost classes, time value

Evidence: [Scope and boundaries](https://agentic-atlas.dev/nodes/statelessness#scope-and-boundaries) · occurrence 1

2.   in-slice · occurrence 1

#### [The Context Economy](https://agentic-atlas.dev/nodes/context-economy)

**statics** — the price list: denominations, the quality curve, cost classes, time value

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 1

3.   in-slice · occurrence 2

#### [The Session Bill](https://agentic-atlas.dev/nodes/session-bill)

one 30-turn session billed, then re-billed under six single-decision shifts

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 2

4.   in-slice · occurrence 3

#### [The Contract Keystone](https://agentic-atlas.dev/nodes/the-contract-keystone)

contract ↔ verification ↔ re-dispatch

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 3

5.   undisclosed · occurrence 4

#### Undisclosed relationship

validate at the return seam; re-dispatch over repair; bounded autonomy — the contract keystone, applied

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 4

6.   in-slice · occurrence 5

#### [Momentum](https://agentic-atlas.dev/nodes/momentum)

resident context steers, not just informs — path dependence, and eviction's second motive

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 5

7.   in-slice · occurrence 6

#### [Effect Discipline](https://agentic-atlas.dev/nodes/effect-discipline)

the precondition under "discard is cheaper than repairing"

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 6

8.   undisclosed · occurrence 7

#### Undisclosed relationship

accumulated memory, a **separate concern from config**

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 7

9.   undisclosed · occurrence 8

#### Undisclosed relationship

episodic skills with persisted, context-specific behavior — incl. the _free idempotent setup_ optimization

Evidence: [Implications](https://agentic-atlas.dev/nodes/statelessness#implications-the-consequence-map) · occurrence 8

10.   in-slice · occurrence 1

#### [The Session Bill](https://agentic-atlas.dev/nodes/session-bill)

one 30-turn session billed, then re-billed under six single-decision shifts

Evidence: [Evidence](https://agentic-atlas.dev/nodes/statelessness#evidence) · occurrence 1

11.   in-slice · occurrence 1

#### [Effect Discipline](https://agentic-atlas.dev/nodes/effect-discipline)

the precondition under "discard is cheaper than repairing"

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 1

12.   in-slice · occurrence 2

#### [Verification Asymmetry](https://agentic-atlas.dev/nodes/verification-asymmetry)

why checking ≪ doing lets verification work at all; the ladder + coverage, and the three failure modes (coverage exhaustion / discrimination collapse / quantifier inversion)

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 2

13.   in-slice · occurrence 3

#### [The Context Economy](https://agentic-atlas.dev/nodes/context-economy)

**statics** — the price list: denominations, the quality curve, cost classes, time value

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 3

14.   in-slice · occurrence 4

#### [Momentum](https://agentic-atlas.dev/nodes/momentum)

resident context steers, not just informs — path dependence, and eviction's second motive

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 4

15.   in-slice · occurrence 5

#### [The Contract Keystone](https://agentic-atlas.dev/nodes/the-contract-keystone)

contract ↔ verification ↔ re-dispatch

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 5

16.   undisclosed · occurrence 6

#### Undisclosed relationship

validate at the return seam; re-dispatch over repair; bounded autonomy — the contract keystone, applied

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 6

17.   undisclosed · occurrence 7

#### Undisclosed relationship

accumulated memory, a **separate concern from config**

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 7

18.   in-slice · occurrence 8

#### [Deferred Context](https://agentic-atlas.dev/nodes/deferred-context)

the _load-in-place_ branch: defer by probability _and lateness_ of need — a 50-token pointer buys ~60× on the session that never fires

Evidence: [Relationships](https://agentic-atlas.dev/nodes/statelessness#relationships) · occurrence 8

Node statelessness · corpus abface4 · Catalog revision 32f31d1a9ff53723e3c0ced9566e9c3fe056fb79e74b51b82278528a62f7e613

---

Title: Deferred Context

URL Source: https://agentic-atlas.dev/nodes/deferred-context

Markdown Content:
## Intent — the problem and the move

intent-the-problem-and-the-move.md

People traditionally frontload all context into the [skill](https://agentic-atlas.dev/glossary/skill): everything the task _might_ need is authored into the always-resident instructions. The economy bills that choice every single session — [admission](https://agentic-atlas.dev/glossary/admission) paid whether or not this invocation needs the material, [residency](https://agentic-atlas.dev/glossary/residency) carried for the session's full duration — and the payload dilutes [relevancy](https://agentic-atlas.dev/glossary/relevancy) on every task that never touches it. Frontloading prices material by its **size**; most sessions only ever needed a fraction of it.

Measured, the fraction is not rhetorical _(all counts in this node: ADR 0013, measured 2026-08-02 on dated local specimens with a public Claude 2.x tokenizer; current tokenization may raise absolute counts by approximately 30%, while ratios are less sensitive but carry no measured error bound)_. Anthropic's own `claude-api` skill carries a 20,060-token body plus 112,524 tokens of reference material; frontloaded, the body alone would occupy 10% of a 200k [window](https://agentic-atlas.dev/glossary/window-context-window) from turn 1, the full stack 66% — before any conversation exists. And the portfolio closes the question: a single developer machine registers ~60 skills, and 20k × 60 fits in no window at any price. Deferral is not an optimization of the frontloaded design; it is what makes a skill portfolio possible at all.

The move: relocate the payload's **payment point**. Same bytes, same actor — the fence against _transform a payload to strengthen task-relevant signal in a smaller or more useful representation_ and the split against [Subagent Offload](https://agentic-atlas.dev/nodes/subagent-offload) are the [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation)'s; this node moves cost down the when-axis and does nothing else.

## Use when — the law: probability and lateness of need

use-when-the-law-probability-and-lateness-of-need.md

**The law: defer by probability _and_ lateness of need.**

*   Needed **rarely** → defer; the session that never fires is the whole win — the ~60× in the worked example.
*   Needed **always but late** → still defer. The same session firing at turn 25 bills 4.6× cheaper — the lateness term is real exactly when the need is actually late. And JIT admission truncates residency from the front: every turn before the fetch runs with the payload's dilution absent, a gain the dollar arithmetic never sees.

Probability decides _whether_ the payload is paid; lateness decides _how long_ it sits resident once it is.

## Avoid when — needed now, or not worth its rent

avoid-when-needed-now-or-not-worth-its-rent.md

These close the when-axis alone; a contraindication that closes both axes is found at [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation).

*   **Needed always and immediately → don't defer.** Measured teeth (ADR 0013, 30-turn session shape): fire at turn 5 and the body sits resident for 26 of 30 turns — the uncached saving collapses to **~10%**, and the caching pass puts the cached figure at **~7%**; the fetch bought almost nothing.
*   **The artifact loses the rent test** (_Application_). Then it isn't deferred context — **it's clutter that bought a pointer. Cut it.** Scope discipline is this test's verdict in the losing case, not a neighboring concern.
*   **The [seam](https://agentic-atlas.dev/glossary/seam) costs more than the residency it saves** — the parent's _pointer rivals payload_, and caching moves where that line falls (_Consequences and tradeoffs_).

## Forces

forces.md

[Pointer](https://agentic-atlas.dev/glossary/pointer) economy and the model-votes-on-the-trigger disposition are the [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation)'s forces; the data pointer at the fetch seam is this branch's instance of each.

1.   **The bottom rung is an outcome, not a property.** "Never paid" is per-session, and it is never quite true — the pointer's standing rent is paid in every session, need or no need _(ruled 2026-08-03)_.
2.   **The pointer's quality is what holds the two failure modes at bay** — a mute pointer under-triggers, a breathless one over-triggers.

## Structure — the fetch seam

structure-the-fetch-seam.md

Keep a cheap pointer resident; move the payload itself down the ladder:

**always-resident → loaded on invoke → fetched on demand → never paid.**

Each rung down defers the same bytes to a later, cheaper point in the payment schedule — until the final rung, where a session that never needs the material never pays for it at all. The ladder is deployed practice, not a diagram: `claude-api` is the whole ladder in production — a 339-token description always-on, the 20,060-token body loaded on invoke, 25 reference files (112,524 tokens, median 2,801) fetched individually on demand, and the fourth rung realized by every session that never fires it. Body to description: **59:1**. Full stack to description: **391:1** (ADR 0013).

The move leaves a seam: a fetch decision that didn't exist before. The seam needs no vocabulary of its own — it narrates entirely in inherited terms _(ruled 2026-08-03)_: the resident **pointer** (the parent's data pointer — follow it, get bytes) carries a **[taste](https://agentic-atlas.dev/glossary/taste)** of the payload, and the model votes on the trigger, with the false-confidence disposition the parent's Forces name standing against the fetch. This is where _graded access composed from deferral and distillation_ plugs in: a distilled taste, designed to inform exactly this decision. Deferral creates the decision; disclosure equips it.

**Two seams, two pointer kinds**_(ruled 2026-08-03)_. The ladder's invoke seam (always-resident → loaded on invoke) is fronted by the skill's registered description — the parent's **function pointer** in form (a name + description in its trigger-contract role; the harness routes the call), even though delivery is load-in-place. The fetch seam (loaded → fetched on demand) is this node's own, and it runs on the **data pointer**: follow it, get bytes.

## Application — what earns a rung, and what fronts it

application-what-earns-a-rung-and-what-fronts-it.md

**The rent test.** An artifact belongs on the ladder only if its expected fetch value across the skill's serving distribution beats the pointer's standing rent. The craft form of the same test: _if you can't name the session archetype that fetches it, cut it._

**The pointer budget**_(ruled 2026-08-02, ADR 0013; refined 08-03)_: the normative **data pointer is 50 tokens** — an address plus one line of taste. The measured always-on descriptions (95–339 tokens) are not overrun data pointers; they are function pointers, a functionally different artifact whose when-to-fire and when-to-skip logic is constitutive, not bloat. Budget the two kinds separately — and hold each to the rent test: a heavy [trigger contract](https://agentic-atlas.dev/glossary/trigger-contract) is a resident decision procedure, and it earns its weight only against measured trigger fidelity, which is still unsampled (ADR 0013 → _Open measurements_).

## Consequences and tradeoffs — one cost shape for another

consequences-and-tradeoffs-one-cost-shape-for-another.md

Deferral is never free — it swaps one cost shape for another:

|  | Always paid | Paid when needed | Failure mode |
| --- | --- | --- | --- |
| **Frontloaded** | full payload, every session | — | payload dilutes relevancy on every task that doesn't need it |
| **Deferred** | the pointer | payload + fetch latency | **under-trigger**: actor works without context it needed · **over-trigger**: frontloading with extra steps |

Expected cost: `pointer + P(need) × (payload + fetch)` versus `payload` flat — the formula holds **uncached and within-session cached**, where caching multiplies both arms near-equally (ADR 0013); the cross-session warm-prefix case is the exception, priced below. The fetch itself is the latency term, and it is cache-immune: one extra inference pass (a tool call minted at output prices) plus first-time prefill of the payload — the one cost of deferral no cache ever discounts.

### Caching moves the dollars, not the law

Cache prices live at [The Context Economy](https://agentic-atlas.dev/nodes/context-economy); this node carries only what caching does to _this_ move (ADR 0013, measured 2026-08-02, 30-turn shape):

*   **Within a session, the ratio survives untouched** — caching multiplies both arms alike — but the absolute dollar prize shrinks ~7×. The seam's own costs (authoring the trigger contract, the extra pass, under-trigger risk) don't shrink with it, so the payload size below which deferral stops paying for itself rises ~7×: the parent's _pointer rivals payload_ contraindication bites earlier under caching.
*   **The throughput advantage disappears**: cache reads are exempt from rate limits, so a frontloaded body riding warm cache stops taxing throughput at all.
*   **Cross-session, the dollar ordering can flip outright.** A frontloaded body inside a byte-identical prefix amortizes its cache write across sessions; a deferred payload pays a fresh write in every session that fetches it. On the measured shape, frontloading undercuts deferral once P(fire) ≳ 0.8 — real for genuinely static deployments, fragile everywhere else: one upstream byte of variation (a system prompt embedding cwd, date, git status) re-bills the whole prefix, and idle gaps run the arithmetic back toward deferral.
*   **What caching never touches: quality.** A cached body is attended in full on every pass; the relevancy dilution frontloading buys is discounted 0% at every P(fire). The law keeps its teeth in the one denomination no cache reaches.

## Verification

verification.md

The branch instance of the [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation)'s checks — _the cost moved, outcomes held_ — read on the when-axis.

**Deterministic:**

*   **The bill moved down the schedule.** Residency arithmetic in the parent's denomination (tokens × turns): before, the payload on every turn; after, the pointer on every turn plus the payload from the fetch turn on. The worked example runs exactly that arithmetic on one declared decision (_Examples_) — it either moved or it didn't.
*   **The resident surface is inside its budget.** Count what stays resident and type it: 50 tokens for the data pointer, function pointers budgeted separately (_Application_). Every resident token above the budget dilutes the win it exists to buy.

**Probabilistic residue:**

*   **Trigger fidelity.** Under- and over-trigger rates for real pointers exist only over sampled runs, and are unsampled here (ADR 0013 → _Open measurements_). One degenerate case is cheaply visible in the transcript: a fetch that fires on essentially every session is the table's _frontloading with extra steps_.
*   **The quality delta.** That the turns before a fetch run with the payload's dilution absent is definitional; its payoff on task results needs live A/B against scored outcomes (ADR 0013 → _Open measurements_), as does wall-clock fetch latency against cached prefill.

## Examples — the worked example: one decision, billed both ways

examples-the-worked-example-one-decision-billed-both-ways.md

A skill carries ~3,000 tokens of API error-code reference — a realistic unit: the measured median reference file in `claude-api` runs 2,801 tokens. The single decision is moving it to `references/error-codes.md` behind a 50-token pointer (the normative budget). Ten-turn sessions, residency in token-turns:

|  | Session that needs the codes (turn 7) | Session that doesn't |
| --- | --- | --- |
| **Frontloaded** | 3,000 × 10 = 30,000 token-turns; turns 1–6 carry dead weight | 30,000 token-turns, all dead weight |
| **Deferred** | 50 × 10 + 3,000 × 4 = 12,500 token-turns + one fetch | **500 token-turns — ~60× cheaper** |

The no-need column is the probability term; the needs-codes column is the lateness term. The cautionary contrast is account-blind: let the resident surface swell to the measured-in-the-wild 339 tokens — whatever those tokens are called, data pointer or trigger contract — and the no-need win shrinks from ~60× to ~9×. The arithmetic never asks what the tokens are _for_; every resident token above the budget dilutes the win it exists to buy.

## Relationships

relationships.md

*   **Child of [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation)**, which owns everything both branches share — the later/elsewhere split, the data/function pointer vocabulary, the same-bytes fence, the model-votes-on-the-trigger force, and the cross-branch rhyme mapping this node's authored-heavy child to offload's. Sibling branch: [Subagent Offload](https://agentic-atlas.dev/nodes/subagent-offload) (_dispatch-elsewhere_ to this node's _load-in-place_).
*   **Parent of [Reference Data](https://agentic-atlas.dev/nodes/reference-data)** — the [specialization](https://agentic-atlas.dev/glossary/specialization) that breaks this node's fixed-payload assumption: the corpus lives on disk, addressable by search, and admission becomes **query-shaped** — pay for the size of the answer, not the material. The authored-heavy specialization.
*   **Priced by [The Context Economy](https://agentic-atlas.dev/nodes/context-economy)** — residency arithmetic and every cache price above; **described in [Context Flow](https://agentic-atlas.dev/nodes/context-flow)'s lifecycle** (deferral is admission control); **motivated by _**objective** — value per unit of context spent (cost / state / outcome lenses)_** (relevancy is what frontloading dilutes; _whether_ a relocation clears break-even is its call, per the parent's which/whether line).
*   **Composes with _transform a payload to strengthen task-relevant signal in a smaller or more useful representation_** into _graded access composed from deferral and distillation_: deferral holds the payload, distillation makes the taste.

## Lineage

lineage.md
Lazy evaluation, and demand paging in virtual memory: defer a value's cost until first use and pay only for what is touched. The residency ladder is the eager/lazy tradeoff applied to a window.

## Open questions / TODO

open-questions-todo.md

*   **Open measurements (ADR 0013 → _Open measurements_):** the outcome delta of clean early turns (needs live A/B against task results — the relevancy claim is definitional, its payoff is not yet sampled), wall-clock fetch latency vs. cached prefill, and under-/over-trigger rates for real pointers — the parent's probabilistic residue, unsampled here.

Node deferred-context · corpus abface4 · Catalog revision 32f31d1a9ff53723e3c0ced9566e9c3fe056fb79e74b51b82278528a62f7e613

---

Title: Reference Data

URL Source: https://agentic-atlas.dev/nodes/reference-data

Markdown Content:
## Intent — the corpus the ladder can't price

intent-the-corpus-the-ladder-can-t-price.md

The parent relocates _when_ a fixed payload is paid. Treating a corpus as one fixed payload caps how much you can afford to keep: anything too big to ever load stays out of reach entirely.

The move: hold the corpus on **disk** — the cheapest tier of the cost structure — and make it **addressable by search** (grep, file structure, an index). [Admission](https://agentic-atlas.dev/glossary/admission) stops being payload-shaped and becomes **query-shaped**: what enters the [window](https://agentic-atlas.dev/glossary/window-context-window) is a high-signal slice sized to the question, not the material. Frontloading prices material by its size; the parent prices it by probability and lateness of need; reference data prices it by **the size of the answer**.

## Use when

use-when.md

The parent's ladder has already typed the payload to deferral. Two observables make it this [specialization](https://agentic-atlas.dev/glossary/specialization) rather than the branch baseline:

*   **The payload is a corpus, not a unit you can name and load whole.** Authored reference material, held on disk and addressed rather than loaded.
*   **It is too big to frontload.** "Too big" needs no threshold — it is the corpus that visibly cannot fit the window, or that degrades it when it does.

Reachability is the standing precondition under both: the move holds while queries share vocabulary with the corpus, and that is settled at authoring time (_Structure_), not at query time.

## Avoid when

avoid-when.md

The contraindications that close relocation outright are the [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation)'s; what closes _this_ specialization is a corpus [residency](https://agentic-atlas.dev/glossary/residency) can still afford.

**The competing posture, mentioned, not adopted.** Vendor guidance brackets RAG from below: under a quoted corpus size, frontload the whole knowledge base and let prompt caching absorb the dollars. The regime is real — for a small, cold, high-fire-rate corpus, frontloading-with-caching competes, and the parent's caching section prices exactly this — but the number is vendor-interested (the vendor bills resident tokens, and the figure predates a tokenizer change), so this node carries **no numeric floor**: decide by the parent's arithmetic, not by a quoted threshold.

## Forces

forces.md

The grandparent's _[placement](https://agentic-atlas.dev/glossary/placement)_ and _model votes on the trigger_ are the family forces; each hardens here into the specialization's own.

1.   **Degraded residency, not merely expensive residency.** The degradation is measured, and it is an argument independent of the bill: recall over long contexts follows a U-curve — highest when the relevant material sits at the edges of the input, significantly degraded in the middle (Liu et al. 2023) — and worsens as the window fills (_context rot_, Anthropic's name for it). A frontloaded corpus is not merely expensive residency; it is **degraded residency**. The family-level force carrying this is the grandparent's _placement_; here it hardens into the specialization's premise — some payloads should never be resident whole, at any price.
2.   **Search quality becomes load-bearing.** A slice that misses the relevant row is an **under-trigger with extra confidence** — the branch instance of the grandparent's _model votes on the trigger_ force: the [actor](https://agentic-atlas.dev/glossary/actor) searched, found something, and proceeds fully assured. Industrial retrieval puts numbers on the miss: Anthropic's evaluation measured 5.7% missed relevant documents at top-20 for its baseline configuration, driven to 1.9% by stacking contextualization, keyword search, and reranking (Grounding). Two lessons travel down to the grep-able corpus: the full tested stack still missed at a measured rate, and hybrid lexical + semantic retrieval improved it further — grep's statistical cousin (BM25) kept its seat in the winning stack, though contextual embeddings produced the largest incremental drop in this ablation _(corrected 2026-08-06, ADR 0014 → Decision)_.

structure-authoring-a-corpus-to-be-searched-into.md

The query-shaped slice stays on the _admits_ side of the grandparent's same-bytes fence — search selects verbatim source and mints nothing (→ [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation), _Structure_). The corollary this node owns _(ruled 2026-07-09)_: the index or manifest kept resident **is** a minted, declared-shape artifact — a distilled product _serving_ the deferral, not a breach of it. The corollary scales without modification: an embedding index is the same manifest built industrially — fixed-dimension vectors whose only job is routing queries to verbatim source — and grep is the zero-index degenerate case, where the corpus is its own index.

**The zero-index access path cannot lag its corpus.** Search reads current bytes; there is nothing between reader and disk to fall behind. Every artifact you insert on that path — a manifest, an embedding index — can. (The corpus itself can still lag the _world_ — the staleness friction below, a different gap.)

Grep-able is an **artifact property, not a hope** — a pile of files is searchable; a corpus is searchable _into_. The property is built at authoring time:

*   **Vocabulary the queries will share.** Distinctive names, exact identifiers, headings that state their subject in the words a task would use. The dominant crossover dimension (the crossover, below) is decided here, before any query runs.
*   **Granularity sized to the answer.** The fetch unit is the file or section the search tool returns; a slice cannot arrive smaller than its unit. The parent's worked example uses the measured shape — reference files of a few thousand tokens, one question each.
*   **The resident surface.** An index or manifest (the minted corollary above) where the corpus's own names don't carry enough [taste](https://agentic-atlas.dev/glossary/taste) — or nothing beyond the parent's [pointer](https://agentic-atlas.dev/glossary/pointer) where they do. Spend what the fetch decision requires, no more.

The retrieval step inherits the parent's fetch [seam](https://agentic-atlas.dev/glossary/seam) whole, and adds a precision question of its own: the query. A bad query admits a low-signal slice — which is why search quality is load-bearing (_Forces_).

## Application — industrial scale, where the RAG analogy holds

application-industrial-scale-where-the-rag-analogy-holds.md

RAG as coined (Lewis et al. 2020) is this move at industrial scale: corpus off-window, an index resident-adjacent, a query-shaped slice admitted per question — a generator over a dense vector index of Wikipedia is the disk corpus with a built index. The same frame is first-party practice for agents: keep lightweight identifiers resident (paths, stored queries, links) and load the data at runtime (Anthropic, context-engineering post — Grounding).

**The analogy holds only for the verbatim-return portion of the pipeline.** Verbatim-chunk retrieval _admits_: the retriever selects, source bytes arrive — industrial grep, this side of the fence. The moment a pipeline rewrites, summarizes, or contextualizes chunks — contextual retrieval's preprocessing is a model writing new tokens into the corpus — it **mints**: distillation composed with deferral. Production RAG stacks are mixed; classify each portion by the fence, not the stack by its product name.

Where embedding retrieval changes the economics:

*   **A pay-earlier build step appears**: embed, host, re-embed on change. Grep has no build phase. This is the clearest instance yet found of a genuine _pay-earlier_ move — and it lives in infrastructure, not in the [skill](https://agentic-atlas.dev/glossary/skill) body.
*   **Cost splits by shape, not just size.** Grep's entire cost is search turns billed as resident input — recurring per query, priced by the parent's arithmetic. An index adds per-corpus work — amortized — plus **standing infrastructure** whose shape depends on deployment: managed production plans may carry hosting floors, while free or self-hosted paths relocate that cost into operations. At skill scale, embedding compute can be small beside the pipeline you now operate (chunking, reindex-on-change, monitoring). Break-even is query-volume- and deployment-driven: the curves cross only after both are priced for the chosen stack.
*   **The first-party case is operational, not accuracy.** Claude Code shipped with RAG and dropped it for agentic search; the stated reasons are simplicity, security/privacy, staleness, reliability (Cherny — Grounding) — the dollars were never the argument. Evidence grade, stated plainly: the outperformance claim is self-described as internal benchmarks plus vibes, and Anthropic's considered position ends _hybrid_ — retrieve up front for speed, explore autonomously from there. No primary head-to-head result is carried here for the broader grep-versus-embedding comparison. Carry the product decision as testimony, not a verdict.

## Consequences and tradeoffs — and the crossover

consequences-and-tradeoffs-and-the-crossover.md

The parent's fetch arithmetic applies whole. What this node adds:

**Availability decouples from residency.** The baseline cost shifts from context to disk — so you can keep vastly more information available-but-unused than could ever be frontloaded, at near-zero resident cost. The intended consequence, banked.

**The corpus can go stale.** A disk corpus can conflict with the live system it describes — **friction**, adjudicated where _the first efficiency strategy: co-schedule work that shares a context space, separate work that doesn't (moves relevancy by construction)_ owns it, with provenance via the _the travelling declared-shape contract specialization_. Note the asymmetry from _Structure_: the access path adds no staleness of its own; an embedding index adds a second lag on top — stale from every corpus change until reindex, which is the staleness on the first-party reason list above.

**The crossover — when the grep-able corpus stops being enough.** Dimensions, not thresholds — the literature supports directions, and no vendor-neutral measured curve exists yet:

1.   **Vocabulary match (dominant).** Grep holds while queries share vocabulary with the corpus — identifiers, error codes, well-headed docs. When the query is conceptual and the corpus's words don't contain the query's words, the answer is not expensive — it is **unreachable**. A reachability boundary, set at authoring time (Structure).
2.   **Query breadth**_(its own dimension — ruled 2026-08-02, ADR 0014 → Decision)_. Grep is fine when you know what you're looking for; **a broad search is a flood** — exploratory queries turn each pass into a noise dump that fills the window regardless of vocabulary match. Vocabulary bounds _reachability_; breadth bounds _admissible signal per search turn_. A targeted query with the wrong vocabulary is unreachable; a broad query with the right vocabulary is a flood.
3.   **Corpus size.** Raises the price, then the failure rate: each search turn returns more noise, the loop's token bill grows, and eventually the loop exhausts its budget before converging. Size never moves the answer out of reach — only what finding it costs.
4.   **Update frequency.** Favors grep, asymmetrically — current bytes versus an index that lags (the staleness asymmetry above). High-churn corpora punish the index; cold corpora amortize it well.
5.   **Latency shape.** One index lookup is sub-second; agentic search is a multi-turn loop. Inside an already-long agent task the loop is tolerable; for interactive lookup it is not.

The one-line boundary: **the grep-able corpus stops being enough when the queries stop sharing vocabulary with the corpus** — size, churn, and breadth move the price; vocabulary mismatch moves the answer out of reach.

## Verification

verification.md

The branch instance of the inherited checks: the grandparent owns the residency arithmetic, the parent owns the fetch seam, and what this node adds is that both now run **per query** rather than per payload.

*   **Deterministic — the slice arrived, not the corpus.** The transcript should carry search turns and their returns; the corpus should appear nowhere in it. Admitted tokens per query against corpus size is the reading, and the grandparent's residency arithmetic (tokens × turns) is the instrument — grep's entire bill is those search turns, billed as resident input.
*   **Probabilistic — the miss and the flood.** Two residues, one per crossover dimension that bites at run time. The miss is force 2's, and no per-run test exists for it: the actor searched, found something, and proceeded — only sampled runs against known answers surface a rate, and even the best retrieval misses at one. The flood is breadth's, and it reads off the same per-query token count the deterministic check already takes: a query whose returns fill the window has admitted noise, not a slice sized to the question.

## Examples

examples.md

*   **[The Runbook Shelf](https://agentic-atlas.dev/nodes/runbook-shelf)** — an 800-document corpus exceeds its declared window budget; an exact incident-code query admits one answer-sized runbook and leaves the other 799 available on disk.
*   **RAG as coined** — Lewis et al.'s generator over a dense vector index of Wikipedia (_Application_): the disk corpus with a built index, this move at industrial scale.
*   **The zero-index end, first-party** — Claude Code shipped with RAG and dropped it for agentic search, on operational grounds (_Application_). The corpus is its own index.
*   **[The Docs Expert](https://agentic-atlas.dev/nodes/docs-expert-agent)** — the librarian frame realized: this node composed with [Subagent Offload](https://agentic-atlas.dev/nodes/subagent-offload), the searching running inside a dispatched window. A composition, so it shows the move at work rather than in isolation.

## Relationships

relationships.md

*   **Child of [Deferred Context](https://agentic-atlas.dev/nodes/deferred-context)** — the specialization that breaks its fixed-payload assumption. The ladder, the law, the rent test, and the pointer budget are inherited, not restated; the cross-branch rhyme placing this node opposite [Heavy Agent](https://agentic-atlas.dev/nodes/heavy-agent) is mapped at [Cost Relocation](https://agentic-atlas.dev/nodes/cost-relocation).
*   **The librarian frame is reserved for this node**_(ruled 2026-07-23, at the docs-expert rename)_: a routes-to-sub-docs librarian is this node composed with [Subagent Offload](https://agentic-atlas.dev/nodes/subagent-offload) — the searching runs inside a dispatched window, so the [orchestrator](https://agentic-atlas.dev/glossary/orchestrator) pays neither corpus nor search turns. The baked-in contrast lives at [The Docs Expert](https://agentic-atlas.dev/nodes/docs-expert-agent).
*   **Staleness in the corpus is friction** (_the first efficiency strategy: co-schedule work that shares a context space, separate work that doesn't (moves relevancy by construction)_); provenance via the _the travelling declared-shape contract specialization_ is the adjudicator.
*   **The fence with _transform a payload to strengthen task-relevant signal in a smaller or more useful representation_** lives at the grandparent; the resident-index corollary in _Structure_ is this node's share of it.

## Lineage

lineage.md
Information retrieval over an inverted index (Luhn, 1957; Salton's SMART system, Cornell, 1960s): the collection stays on secondary storage, a resident index routes a query into it, and what returns is a slice sized to the question, bounded by the vocabulary problem (Furnas et al., CACM 1987). Retriever, reader, and query author are now one actor, so a missed slice is consumed as the answer instead of rejected by the human reading the list.

## Grounding

grounding.md

_(Fetched 2026-08-02; sources and evidence grades adjudicated in ADR 0014 → \_Method and evidence grades\_.)_

*   Anthropic, _Introducing Contextual Retrieval_ — https://www.anthropic.com/news/contextual-retrieval (retrieval failure rates 5.7%→1.9%; the chunk-rewriting mint caution; the vendor frontload-with-caching posture).
*   Anthropic, _Effective context engineering for AI agents_ — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (lightweight identifiers loaded at runtime; context rot; the hybrid ending).
*   Boris Cherny — https://x.com/bcherny/status/2017824286489383315, with the evidence-grade caveat at https://www.latent.space/p/claude-code (first-party: Claude Code dropped RAG for agentic search; operational reasons; "mostly vibes").
*   Liu et al., _Lost in the Middle_ — https://arxiv.org/abs/2307.03172 (the U-curve; frontloading fails at scale independent of cost).
*   Lewis et al., _Retrieval-Augmented Generation_ — https://arxiv.org/abs/2005.11401 (the coinage; corpus off-window, resident index, query-shaped slice).
*   Pricing anchors — https://platform.claude.com/docs/en/docs/about-claude/pricing, https://docs.voyageai.com/docs/pricing, https://www.pinecone.io/pricing/ (dated examples for the per-query vs. per-corpus cost split; managed-plan floors are plan-specific; cache reads at 0.1× base input).

## Open questions / TODO

open-questions-todo.md

*   ~~**Evidence gap — the stable gate:** document a corpus qualitatively too big to frontload in a single-decision worked example.~~**Resolved 2026-08-07:**[The Runbook Shelf](https://agentic-atlas.dev/nodes/runbook-shelf) holds the corpus and question fixed, changing only corpus-shaped admission to query-shaped admission.
*   **Evidence boundary:** the 2026 agentic-retrieval literature (Is-Grep-All-You-Need, CORE-Bench) is represented only by directional claims because it has been read at abstract level; no specific figures from it are asserted here.

Node reference-data · corpus abface4 · Catalog revision 32f31d1a9ff53723e3c0ced9566e9c3fe056fb79e74b51b82278528a62f7e613