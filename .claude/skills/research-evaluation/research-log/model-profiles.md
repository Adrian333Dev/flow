# Model Profiles

Running performance profiles built from evaluation log. Updated after each research session.

Last updated: 2026-07-21
Total sessions evaluated: 6 (16 individual responses)

> **Version caveat (2026-07-18 session):** the four responses were labeled only by family (ChatGPT, Gemini, DeepSeek Instant, Claude). Exact variants for this session are unconfirmed — ChatGPT/Claude entries are merged into their existing profiles on the assumption they match the prior variants. Confirm variants if profile precision matters.
>
> **Variant split (2026-07-21 sessions):** the two Reading-Engine C2 sessions introduced clearly-labeled variants that are kept as SEPARATE profiles from the older ones, because they are different products/modes: **Claude Sonnet 5 (Free)** (distinct from the older Sonnet 4.6 profile), **ChatGPT Deep Research** (distinct mode from the older "ChatGPT web GPT-5.5 Web Search" profile), and **DeepSeek Expert** (distinct from DeepSeek Instant). Do not merge these across the 07-18 vs 07-21 boundaries.

---

## DECISION — which external LLM to use for research (locked 2026-07-21)

After 6 sessions / 16 responses across TTS pricing, browser-extension architecture, tooling
ecosystems, text normalization, and competitor teardown, the pattern is stable enough to stop
formally evaluating and just act on it. The research-evaluation skill is being retired; this block
is the standing conclusion.

**Primary: Claude (Web Search enabled) — Sonnet 4.6 then Sonnet 5 (Free).** Best-in-class on
*critical coverage* (the criterion that actually decides things) in every complete artifact it
produced: 4 reference-quality responses out of 4 complete deliveries, and the only model that
reliably reasons from our own product constraints and surfaces the single decisive detail (MV3
WASM/CSP gotchas; GitHub-MCP-vs-`gh` cost trap; the source→spoken provenance invariant; Kokoro's
Python-side duration-timestamps + the forced-alignment-is-a-trap evidence). Citation integrity is
the best of the field. Make Web Search *always on* — that's the config that won.

**Secondary / second opinion: ChatGPT Deep Research.** Best confidence calibration and no
fabricated sources; strong breadth, structure, and completeness. The trustworthy-but-shallow
option — reach for it when you want an honesty-about-uncertainty cross-check or a broad landscape
survey, not the killer insight. Pair it with Claude when a decision is high-stakes.

**Use with caution: DeepSeek (Instant / Expert).** Genuinely good at mechanism specificity and
dense matrices, but **Expert fabricates authoritative-looking citations** (invented repos/SO
links) and **Instant carries recurring medium hallucination** (unverifiable project names, inflated
effort estimates). Mine them for mechanism ideas; treat every named artifact/citation as unverified.

**Avoid for anything critical: Gemini** (1 session) — under-verified, broken citation artifacts,
dubious install commands.

Net: the user's read was right — **Claude clearly wins the dimensions that matter**, with ChatGPT
Deep Research as the reliable-but-safe backup. Default research workflow going forward: run it in
Claude with web search; add a ChatGPT Deep Research pass only when calibration/breadth matters or
the stakes justify a second model.

---

## ChatGPT (web — GPT-5.5 (free plan) Web Search enabled)

Sessions: 4 | Responses: 4
Last evaluated: 2026-07-18

<!-- Raw scores for recalculation:
Session 1 (Cloud TTS pricing): Acc 4, Crit 4, Comp 5, Depth 4 | Halluc: low
Session 2 (Open-source TTS): Acc 5, Crit 3, Comp 5, Depth 4 | Halluc: low
Session 3 (MV3 architecture): Acc 3, Crit 2, Comp 4, Depth 3 | Halluc: medium
Session 4 (AI tooling ecosystem): Acc 4, Crit 4, Comp 5, Depth 4 | Halluc: low-medium
-->

**Baseline averages:**
- Accuracy: 4.0
- Critical coverage: 3.3
- Completeness: 4.8
- Depth: 3.8
- Hallucination: low (3 sessions), medium (1 session)

**Strengths:**
- Comparative/survey research — excellent at structured comparison across many options with consistent criteria (TTS pricing table, tooling ecosystem survey both immediately usable)
- Completeness — consistently covers everything requested with structured, readable output; strongest "does this duplicate my existing layer?" framing in the tooling session
- Security / selectivity framing — best of the field at arguing for restraint (skill-provenance risk, benchmark-backed "most skills add no value")
- Cost modeling — practical dollar estimates and usage projections
- Accuracy on established facts — pricing, feature flags, hardware requirements

**Weaknesses:**
- Critical-gotcha detection — repeatedly gets high-level direction right but misses the one decisive detail: 3 Chrome MV3/ONNX init gotchas (S3); the archived Postgres MCP and the GitHub-MCP-vs-`gh` cost problem (S4)
- Autonomous artifact discovery — needed a user hint to locate the specific `Kokoro-82M-v1.0-ONNX-timestamped` build (S2)
- Deep implementation specifics — stays architectural; vague install commands in the tooling survey ("install per README")
- Minor unverifiable citations (an arXiv paper in S4)

**Pattern notes:**
- Strong at breadth, structure, and comparison; weaker at finding the single critical artifact/gotcha/deprecation
- Recommended for: pricing/feature comparisons, library surveys, structured option matrices, "what should I exclude" framing
- Use caution for: production architecture for complex APIs; catching deprecations/cost traps; finding obscure-but-critical artifacts without hints; verify install commands and key technical claims independently

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| api-pricing | 4.0 | 4.0 | 5.0 | 4.0 | 1 |
| open-source / onnx | 5.0 | 3.0 | 5.0 | 4.0 | 1 |
| chrome-extension / mv3 | 3.0 | 2.0 | 4.0 | 3.0 | 1 |
| ai-tooling / mcp | 4.0 | 4.0 | 5.0 | 4.0 | 1 |

---

## Claude (web - Sonnet 4.6 (free plan) Web Search enabled)

Sessions: 2 | Responses: 2
Last evaluated: 2026-07-18

<!-- Raw scores for recalculation:
Session 1 (MV3 architecture): Acc 5, Crit 5, Comp 5, Depth 5 | Halluc: low
Session 2 (AI tooling ecosystem): Acc 5, Crit 5, Comp 5, Depth 5 | Halluc: low
-->

**Baseline averages:**
- Accuracy: 5.0
- Critical coverage: 5.0
- Completeness: 5.0
- Depth: 5.0
- Hallucination: low

**Strengths:**
- Critical-gotcha & deprecation detection — the standout trait across both sessions: caught every MV3/ONNX spec gotcha (S1); flagged every archived tool AND the unique GitHub-MCP-vs-`gh` token-cost trap no other model saw (S2)
- Actionability — directly usable output with correct, current install commands and code patterns; near-zero verification needed on critical claims
- Task alignment — only S4 response with an explicit "skip, duplicates your template" section; distinguishes genuinely-overlapping tools with real nuance
- Risk surfacing & source quality — proactively flags future/edge risks and cites specific pages

**Weaknesses:**
- Over-tailoring — S4 response leaned hard into the specific project context (Delapse/NestJS); great for targeting, but needs generalizing when the deliverable is a reusable template
- Unverifiable adoption numbers — star counts / install figures stated confidently (minor hallucination-risk surface)
- Still only 2 sessions — pattern is strong but not yet broad across domains

**Pattern notes:**
- Consistently best-in-class on deep architecture, deprecations, security constraints, and "what's the non-obvious trap" detection — 2/2 reference-quality
- Recommended for: complex browser/platform architecture, security constraints, tooling/deprecation vetting, production gotcha detection, anything where the critical detail matters more than breadth
- Watch for: over-specific tailoring (generalize its output for reusable artifacts); spot-check confident numeric claims

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| chrome-extension / mv3 | 5.0 | 5.0 | 5.0 | 5.0 | 1 |
| ai-tooling / mcp | 5.0 | 5.0 | 5.0 | 5.0 | 1 |

---

## Gemini (version unknown)

Sessions: 1 | Responses: 1
Last evaluated: 2026-07-18

<!-- Raw scores for recalculation:
Session 1 (AI tooling ecosystem): Acc 3, Crit 2, Comp 4, Depth 3 | Halluc: medium-high
-->

**Baseline averages:**
- Accuracy: 3.0
- Critical coverage: 2.0
- Completeness: 4.0
- Depth: 3.0
- Hallucination: medium-high

**Strengths:**
- Breadth — covered all three categories with concrete-looking entries and attempted runnable install commands
- Surfaced a couple of picks the others under-weighted (TypeScript LSP plugin, Semgrep)

**Weaknesses:**
- Verification — littered with broken `[cite: x.x.x]` citation artifacts, signalling it didn't actually ground its claims
- Install-command accuracy — several dubious npm package names (`@figma/mcp-server`, `@stripe/mcp-server`, `@vercel/mcp-server`) that would likely error if run
- Judgment — over-applied the exclusion list, wrongly discarding useful tools (Playwright, Sentry) by conflating a capability with the template's methodology
- No deprecation/security awareness — missed archived tools entirely

**Pattern notes:**
- Confident but under-verified; treat every factual/install claim as unchecked
- Recommended for: nothing critical yet on this one data point; possibly idea-generation/breadth if outputs are independently verified
- Use caution for: anything where install commands or deprecation status must be right; needs a fact-checking pass before acting

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| ai-tooling / mcp | 3.0 | 2.0 | 4.0 | 3.0 | 1 |

---

## DeepSeek Instant

Sessions: 3 | Responses: 3
Last evaluated: 2026-07-21

<!-- Raw scores for recalculation:
Session 1 (AI tooling ecosystem): Acc 3, Crit 3, Comp 4, Depth 3 | Halluc: medium
Session 2 (TN taxonomy): Acc 4, Crit 3, Comp 5, Depth 4 | Halluc: low
Session 3 (competitor teardown): Acc 3, Crit 4, Comp 5, Depth 4 | Halluc: medium
-->

**Baseline averages:**
- Accuracy: 3.3
- Critical coverage: 3.3
- Completeness: 4.7
- Depth: 3.7
- Hallucination: medium (2 of 3), low (1)

**Strengths:**
- Consistently high completeness — covers every requested dimension with dense tables
- Strong on naming concrete mechanisms (Speechify "Speech Marks API", ElevenLabs `CharacterAlignmentResponseModel`, NeMo Duplex tagger/decoder, Apple PolyNorm)
- One-off sharp security catch (S1: archived + SQL-injectable Postgres MCP)

**Weaknesses:**
- Recurring medium hallucination — confident but unverifiable specifics (third-party project names like `@baryodev/read-aloud`; oddly specific bug claims); grab-bag tendency (S1 skills)
- Effort/estimate inflation (S2: "8–12 weeks" for a Tier-1 TN layer that is really ~160 lines)
- Rarely surfaces the single decisive product-specific insight; stays generic

**Pattern notes:**
- Best trait is mechanism specificity + completeness; weakest is source verification
- Recommended for: dense comparison matrices, enumerating concrete APIs/mechanisms, quick-reference tables
- Use caution for: any named project/package/citation (verify before trusting); effort estimates

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| ai-tooling / mcp | 3.0 | 3.0 | 4.0 | 3.0 | 1 |
| text-normalization / tts | 4.0 | 3.0 | 5.0 | 4.0 | 1 |
| competitor-teardown / tts | 3.0 | 4.0 | 5.0 | 4.0 | 1 |

---

## DeepSeek Expert

Sessions: 2 | Responses: 2
Last evaluated: 2026-07-21

<!-- Raw scores for recalculation:
Session 1 (TN taxonomy): Acc 4, Crit 3, Comp 5, Depth 4 | Halluc: low-medium
Session 2 (competitor teardown): Acc 3, Crit 4, Comp 5, Depth 4 | Halluc: medium-high
-->

**Baseline averages:**
- Accuracy: 3.5
- Critical coverage: 3.5
- Completeness: 5.0
- Depth: 4.0
- Hallucination: medium (trending high on citations)

**Strengths:**
- Highest completeness + polish — dense, well-structured tables and per-item narratives
- Good depth on standard TN architecture (WFST/Kestrel/Sparrowhawk/NeMo) and competitor mechanisms

**Weaknesses:**
- **Citation fabrication is the defining risk** — presents formal-looking reference lists partly built on invented sources (wrong Misaki org `nicholasbrailo/misaki` vs real `hexgrad/misaki`; a fabricated `nicholasbrailo/kokoro-onnx`; an invented StackOverflow Q&A; a placeholder-looking arXiv id). Rigorous-seeming, not rigorous.
- Overstates inferred internals as fact (Speechify code-block skipping claimed firm+uniform; our own source read shows partial)

**Pattern notes:**
- Reads as the most authoritative of the DeepSeek variants but is the most likely to mislead via confident fake citations
- Recommended for: structural/architectural overviews, taxonomy tables, mechanism brainstorming
- Use caution for: EVERY citation and named artifact — assume fabricated until verified; do not quote its references

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| text-normalization / tts | 4.0 | 3.0 | 5.0 | 4.0 | 1 |
| competitor-teardown / tts | 3.0 | 4.0 | 5.0 | 4.0 | 1 |

---

## Claude Sonnet 5 (Free) Web Search

Sessions: 2 | Responses: 2
Last evaluated: 2026-07-21

<!-- Raw scores for recalculation:
Session 1 (TN taxonomy): Acc 5, Crit 5, Comp 5, Depth 5 | Halluc: low
Session 2 (competitor teardown, COMPLETE artifact — re-scored after user re-ran the truncated export): Acc 5, Crit 5, Comp 5, Depth 5 | Halluc: low
(Prior truncated export scored 4/2/2/2 — discarded; a visibly-incomplete export is re-run, not scored as the ceiling.)
-->

**Baseline averages:**
- Accuracy: 5.0
- Critical coverage: 5.0
- Completeness: 5.0
- Depth: 5.0
- Hallucination: low

**Strengths:**
- Best-in-class on the criterion weighted heaviest (critical coverage) — 2/2 complete artifacts reference-quality, both producing the decisive, product-specific insight no other model reached
- Only model to reason from OUR own constraints: on TN, the source→spoken provenance invariant → "drop from audio but keep a zero-duration alignment span" + the "." → sentence-boundary → highlight-desync tie-in; on the teardown, resolving the timestamp question in our favor (use Kokoro's Python-side model-internal duration predictions, already exposed by `Kokoro-FastAPI`'s `/dev/captioned_speech`) and correcting the other three models' wrong "no timestamps → must forced-align" premise
- Brings decision-grade external evidence: hard human-drift-tolerance numbers (highlight may run ~150ms ahead but even ~50ms lag is perceptible; forced-alignment tools miss the window on 30%+ of sentences) → a measured argument against forced-alignment; the `Kokoro-FastAPI` `---` timestamp-drop bug proving TN/segmentation can desync highlighting from audio
- Best source integrity of the field — load-bearing citations real and aptly used, correct repo orgs (`hexgrad/Kokoro-82M` — the exact org DeepSeek Expert *fabricated*), 113 numbered footnotes on the teardown; explicitly rates each inferred claim High/Med/Low and lists what remains undocumented rather than papering gaps
- Frames output as decisions/stopping-rules, not surveys

**Weaknesses:**
- Minor: a small number of unverifiable non-load-bearing links in otherwise well-sourced artifacts
- Process (not capability): its first competitor-teardown export arrived truncated; judged by the delivered artifact, a half-export must be re-run before scoring — it is not evidence about the model

**Pattern notes:**
- The clear #1 for the decisive-insight / product-fit / trustworthy-citation role — consistent with the older Sonnet 4.6 profile's 2/2 dominance; across this project it is the model that most reliably surfaces the single detail that changes the design decision
- Recommended for: anything where the critical, non-obvious, product-specific detail matters more than raw breadth (i.e., most of what actually drives decisions here)
- Watch for: truncated/half exports (re-run, don't score the stub); spot-check non-load-bearing links

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| text-normalization / tts | 5.0 | 5.0 | 5.0 | 5.0 | 1 |
| competitor-teardown / tts | 5.0 | 5.0 | 5.0 | 5.0 | 1 |

---

## ChatGPT Deep Research

Sessions: 2 | Responses: 2
Last evaluated: 2026-07-21

<!-- Raw scores for recalculation:
Session 1 (TN taxonomy): Acc 4, Crit 3, Comp 4, Depth 3 | Halluc: low
Session 2 (competitor teardown): Acc 4, Crit 4, Comp 5, Depth 4 | Halluc: low
-->

**Baseline averages:**
- Accuracy: 4.0
- Critical coverage: 3.5
- Completeness: 4.5
- Depth: 3.5
- Hallucination: low

**Strengths:**
- Best confidence calibration in the field — consistently distinguishes documented fact from inference and rates its own confidence (esp. competitor internals)
- No fabricated sources; clean, readable synthesis and takeaways
- Reliable, correct-but-conservative baseline

**Weaknesses:**
- Shallower than its "Deep Research" billing implies — the TN response was the shortest of four and light on citations ("references: generic rules")
- Rarely produces the single decisive/product-specific insight; stays at the safe general level

**Pattern notes:**
- The trustworthy-but-not-deep option: safe to act on directionally with little verification, but don't expect the killer insight
- Recommended for: well-calibrated competitor/landscape surveys where honesty-about-uncertainty matters more than depth
- Use caution for: tasks needing the decisive non-obvious detail (pair it with a Claude run)

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| text-normalization / tts | 4.0 | 3.0 | 4.0 | 3.0 | 1 |
| competitor-teardown / tts | 4.0 | 4.0 | 5.0 | 4.0 | 1 |
