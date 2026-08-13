# How to Say the Same Thing in Fewer Sentences: A Catalog of Structural Transformations for AI Agent Instruction Files

## TL;DR

- **The largest savings come from structure, not word-trimming, and the biggest single win is cutting rules entirely: instruction-following degrades with rule _count_, so a file that drops from 40 rules to 20 is followed better, not just cheaper.** Measured evidence (Jaroslawicz et al., Distyl AI, "How Many Instructions Can LLMs Follow at Once?", arXiv:2507.11538) shows "even the best frontier models only achieve 68% accuracy at the max density of 500 instructions," and HumanLayer's reading of that literature is that frontier thinking models reliably track ~150–200 instructions total — of which Claude Code's own system prompt already consumes ~50.
- **Six structural moves reliably compress instruction files 40–70% without information loss: Predicate-Replaces-Enumeration, Invariant-Replaces-Procedure, Structure-Absorbs-Repetition (tables), Placement-Replaces-Condition, Name-Once-Reuse, and Delete-The-Derivable. Two riskier moves — Delete-The-Justification and One-Example-Or-None — save real space but can silently cost adherence, and the evidence there is thin-to-adverse.**
- **The counter-question has real teeth: the caveman word-level baseline was independently measured by JetBrains at 8.5% real-world savings on agentic work (vs. 65% advertised for chat), and Anthropic's own skill-creator warns that stripping rationale down to bare all-caps "MUST/NEVER" is a "yellow flag." Structural compression beats word-trimming, but every deletion of a "why" or an example is an untested bet on adherence.**

## Key Findings

1. **Word-level compression (the caveman baseline) is real but small and mostly irrelevant to instruction files.** JetBrains engineer Denis Shiryaev ("Does Speaking to Agents Like Cavemen Really Save 65% of Tokens? We Test," JetBrains AI blog, July 16 2026) measured the caveman skill at "Measured saving: 8.5%. Output-token saving on real agentic tasks, with the skill forcibly activated. This is the ceiling, not the usual-case result" — versus the advertised 65%, which the caveman repo itself scopes to "Average 65% output reduction across 10 chat-style prompts (range 22–87%)." The repo README concedes "the skill itself adds ~1–1.5k input tokens per turn. So whole-session savings run smaller than the output number, and on already-terse workloads they can go net-negative." Two of its rules are verifiable and correct: invented abbreviations (`cfg`, `impl`) and connector arrows (→) save zero tokens because BPE tokenizers split them into the same pieces as the full word / treat the symbol as its own token.
2. **Structural transformations are where the 40–70% lives.** The worked example in the prompt (65% shorter) is a Predicate-Replaces-Enumeration move, and it generalizes: whenever several bullets share a decision test, the test itself replaces them.
3. **Rule count, not token count, is the binding constraint on adherence.** This reframes the entire exercise: the point of compression is not to save money, it is to stay under the model's instruction ceiling.
4. **Position is a compression technique.** Because attention is U-shaped (primacy + recency), a rule at the top or bottom of the file is followed more reliably than one buried in the middle — so a critical rule stated once at the top can replace the same rule stated twice.
5. **Progressive disclosure works, but not by default.** Anthropic's own skill-creator concedes Claude "has a tendency to 'undertrigger' skills." Measured out-of-box activation was ~50%; directive, "pushy" descriptions raised it toward 100%.
6. **The two most dangerous compressions — deleting rationale and deleting examples — rest on almost no measured evidence for instruction files specifically.** Anthropic recommends keeping the "why"; the supporting measurement is a human field experiment plus mixed LLM ablations, not a clean instruction-file A/B.

---

## Summary Table

| #   | Transformation                     | What it collapses                                           | Typical saving                           | Main risk                                                                  |
| --- | ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| 1   | **Predicate-Replaces-Enumeration** | N bullets sharing a test → the test                         | 50–70%                                   | If cases don't truly share the predicate, you lose the exceptions          |
| 2   | **Delete-The-Derivable**           | Consequences/counterexamples that follow from a stated rule | 40–65%                                   | Model may not actually derive the consequence under load                   |
| 3   | **Invariant-Replaces-Procedure**   | Step-by-step walk → one "never/always X" invariant          | 40–60%                                   | Loses ordering info if the procedure's sequence is load-bearing            |
| 4   | **Structure-Absorbs-Repetition**   | Parallel sentences → table with shared header               | 30–55%                                   | Deeply nested tables degrade; middle rows lose attention                   |
| 5   | **Placement-Replaces-Condition**   | "When X, do Y" → put Y in the file that loads only during X | 20–50% per rule + shrinks always-on file | Pointer may not be fetched (~50% baseline); wrong scoping hides the rule   |
| 6   | **Name-Once-Reuse**                | Repeated definition → one defined term                      | 20–40%                                   | Term becomes opaque shorthand; costs more than it saves past break-even    |
| 7   | **Cut-The-Rule-Count**             | Whole rules that aren't universally applicable              | Unbounded                                | You removed a rule you needed; move it to a scoped file instead            |
| 8   | **Delete-The-Justification**       | Sentences of rationale → the rule alone                     | 30–60%                                   | Rationale may be carrying adherence + generalization; Anthropic flags this |
| 9   | **One-Example-Or-None**            | Several illustrations → one, or zero                        | 30–80%                                   | A load-bearing example is worth more than the rule text                    |
| 10  | **Flip-Negative-To-Positive**      | "Don't do X" enumerations → "Do Y"                          | 10–30%                                   | Only if a single positive truly covers the forbidden space                 |

_The five biggest wins for a reader who stops here: apply #1, #2, #7, #4, and #5. Together they routinely halve an instruction file while improving adherence, because #7 and #5 reduce the live rule count and #4/#1 move rules toward high-attention structure._

---

## The Catalog

### 1. Predicate-Replaces-Enumeration

- **What it does:** When several listed cases share a single decision test, state the test and delete the cases that only illustrate it.
- **Before / after (real):** The prompt's own worked example, from a real instruction file. Before: two paragraphs (~70 words) enumerating "notes, a scratch area, a catalog" as examples of directories that want rules without being projects. After: "**Project = a `CLAUDE.md` with a `## Project` section.** Without one: rules only, no `docs/`, no tickets, no `flow`." (~20 words). Delta: ~50 words / ~65% shorter; from 4 lines to 2.
- **Why it is safe:** The enumerated cases were downstream of the predicate — once the model has the test, it re-derives which directories qualify. The information was never in the examples; it was in the boundary.
- **When it breaks:** If the listed cases do _not_ actually share one predicate (i.e., there are genuine exceptions the test doesn't capture), collapsing them deletes the exceptions. Also breaks if the predicate is subtle and the examples were the only thing making it learnable — then you've traded a safe illustration for an ambiguous rule.
- **Evidence:** _Opinion / reported._ This is the `if/else`-to-expression refactor applied to prose; no benchmark isolates it. Indirect support: IFScale (measured) shows fewer instructions are followed better, and one predicate is one instruction where five bullets were five.

### 2. Delete-The-Derivable

- **What it does:** Delete consequences, counterexamples, and clarifications that follow logically from a rule already stated.
- **Before / after (real):** From "The Prompt Shelf" community CLAUDE.md guidance, the verbose form: "We use TypeScript with strict mode. Tests go in `__tests__` directories. Use vitest for testing. Always mock external APIs. Run npm test before committing. Format with prettier. Use single quotes." → restructured to a `## Testing` / `## Code Style` block that states each fact once. The prose repeats "testing" three times; the structured form states location, framework, and mocking once each. Delta: roughly 30–40% fewer tokens with clearer scope.
- **Why it is safe:** A capable model derives "so don't commit failing tests" from "run tests before committing." Stating the derivable consequence spends tokens and rule-count budget on something the model already produces.
- **When it breaks:** Under high context load, models stop deriving and start pattern-matching surface text. If the consequence is safety-critical (data deletion, secret handling), do not trust derivation — state it, and place it at a high-attention position (see #5).
- **Evidence:** _Reported._ Anthropic's context-engineering guidance ("finding the smallest set of high-signal tokens") and HumanLayer's "less is more" both endorse it; no direct ablation on derivable-consequence deletion specifically.

### 3. Invariant-Replaces-Procedure

- **What it does:** Replace a step-by-step list that exists to prevent one failure with a single stated invariant.
- **Before / after (real):** Common CLAUDE.md pattern: "Read existing code before modifying it. Understand the current implementation before suggesting changes. Do not propose changes to files you haven't read." (three sequential steps, ~25 words) → "Never edit a file you haven't read." (7 words). Delta: ~70%.
- **Why it is safe:** The three steps were three phrasings of one invariant. A "never X" covers every case the procedure walked, including cases the author didn't enumerate.
- **When it breaks:** If the _order_ of the procedure carries information (do A before B before C, where sequence matters), an invariant loses it. Invariants are for state constraints, not for genuine sequencing. Also: negative invariants ("never") can trip the "pink elephant" problem — see #10.
- **Evidence:** _Opinion,_ with adverse measured nuance. Anthropic's positive-framing guidance and the human "ironic process" literature suggest a _positive_ invariant ("only edit files you've read") may outperform the negative form.

### 4. Structure-Absorbs-Repetition (parallel sentences → table)

- **What it does:** When several sentences repeat a frame and vary one slot, promote the frame to a table header and keep only the varying cells.
- **Before / after (real):** The maketocreate 2026 guide converts a prose matrix of "CLAUDE.md ≠ AGENTS.md ≠ .claude/agents/\*.md" distinctions into "the same matrix as a reference table." Each prose sentence repeated "is a file that…"; the table header states it once. Delta: ~30–55% on such passages, and it isolates each row as its own scannable unit.
- **Why it is safe:** The repeated frame was pure redundancy; the table preserves every distinct cell while stating the shared structure once. Markdown tables are explicitly on the caveman "preserve exactly" list.
- **When it breaks:** Tables have their own attention profile. Middle rows of a long table are subject to lost-in-the-middle decay (Liu et al., "Lost in the Middle," TACL 2024 vol.12 pp.157–173: performance "follows a U-shaped function of information position" and "degrades by >30% when relevant information is positioned in the middle," replicated across GPT-3.5-Turbo, GPT-4, Claude 1.3, LongChat-13B, MPT-30B, and Cohere Command), and deeply nested or wide tables degrade parsing. Keep tables short; put the highest-stakes row first or last.
- **Evidence:** _Measured (positional)_ for the middle-row risk; _reported_ for the compression benefit.

### 5. Placement-Replaces-Condition (progressive disclosure)

- **What it does:** A rule that only fires in one situation doesn't need a "when X" clause if you put it in the file that loads only during X. The condition becomes the file's location/trigger.
- **Before / after (real):** HumanLayer's recommended structure: instead of a monolithic CLAUDE.md carrying database-schema rules, keep `agent_docs/database_schema.md` and let CLAUDE.md name it. The always-on file drops from the full ruleset to "less than sixty lines" (HumanLayer's actual root CLAUDE.md). Anthropic's Skills implement the same as three-tier progressive disclosure: name+description (~100 tokens per skill) at startup, full body only on trigger.
- **Why it is safe (when it is):** The conditional rule is invisible until relevant, so it neither spends the always-on rule-count budget nor distracts on unrelated tasks. HumanLayer's discovery that Claude Code injects a `<system-reminder>` telling Claude the CLAUDE.md context "may or may not be relevant" and that it "should not respond to this context unless it is highly relevant" means non-universal rules in the always-on file are actively at risk of being ignored anyway.
- **When it breaks:** **The pointer must actually be fetched.** Anthropic's own skill-creator states Claude "has a tendency to 'undertrigger' skills — to not use them when they'd be useful," and recommends making descriptions "a little bit 'pushy.'" Measured out-of-box skill activation was ~50% (Seleznov, 650-trial independent study, Feb 2026); passive "Use when…" descriptions performed far worse than directive ones ("ALWAYS invoke… Do not do X directly" reached ~100%, odds ratio 20.6 vs. passive). Simple one-step tasks may bypass a skill even on a perfect description match. And keeping references only one level deep from SKILL.md matters — Anthropic warns nested references get only partially read (`head -100` previews).
- **Evidence:** _Measured_ (activation rates, third-party but rigorous; Anthropic's own "improved triggering on 5 out of 6 public skills" after description tuning) + _reported_ (Anthropic docs). **Confirmed with a strong caveat: it works only if the pointer is written as a pushy, specific, directive trigger and kept one level deep.**

### 6. Name-Once-Reuse

- **What it does:** Define a compound concept once with a name, then use the name instead of re-describing it.
- **Before / after (real):** Repeated across cursor-rules and Claude-Code-best-practice repos: defining "tracer bullets (vertical slices)" once, then referring to "tracer bullets" rather than re-explaining "a thin end-to-end implementation touching every layer" each time.
- **Why it is safe:** The definition survives in one place; every later mention inherits it. Net saving grows with the number of reuses.
- **When it breaks:** Below the break-even (roughly 2–3 reuses) the definition costs more than it saves. Past a point, a coined term becomes opaque shorthand the model must "decompress" from context each time — the same failure the caveman project identifies for invented abbreviations. Break-even rule of thumb: name it only if you'll reuse it ≥3 times and the name is self-evident or defined adjacent to first use.
- **Evidence:** _Opinion._ No measurement isolates defined-term break-even in instruction files. The tokenizer point (invented short forms don't save tokens) is _verifiable_ and argues against cryptic names.

### 7. Cut-The-Rule-Count (the highest-leverage move)

- **What it does:** Delete rules that aren't universally applicable to the tasks the file governs — not compress them, remove them (or exile them to a scoped file per #5).
- **Before / after (real):** HumanLayer's root CLAUDE.md is "less than sixty lines"; the general consensus they cite is "<300 lines is best, and shorter is even better." The move is dropping style-guideline rules ("use single quotes," "no semicolons") that a linter should enforce deterministically — "Never send an LLM to do a linter's job."
- **Why it is safe:** This is the finding that reframes everything. Instruction-following degrades with rule _count_. HumanLayer's reading of the literature: frontier thinking models follow ~150–200 instructions reliably; Claude Code's system prompt already uses ~50. Every rule you remove raises adherence to the rest. Cutting lines and cutting rules are different operations, and most advice optimizes the wrong one.
- **When it breaks:** If you delete a rule that _was_ universally needed, or push a genuinely always-relevant rule into a conditional file that then doesn't trigger (see #5's ~50% baseline). The safe version moves non-universal rules to scoped files; the unsafe version just deletes.
- **Evidence:** _Measured._ IFScale (Jaroslawicz et al., Distyl AI, arXiv:2507.11538): "even the best frontier models only achieve 68% accuracy at the max density of 500 instructions" (500 keyword-inclusion instructions drawn from U.S. SEC 10-K filings, 5 seeds per density); three degradation patterns (threshold/linear/exponential) with smaller models decaying exponentially, plus a measured bias toward earlier instructions. ManyIFEval/StyleMBPP (Harada et al., arXiv:2509.21051): "performance consistently degrades as the number of instructions increases," and a logistic model on instruction _count_ predicts adherence. This is the best-supported claim in the report.

### 8. Delete-The-Justification

- **What it does:** Strip the sentences of rationale, keep the rule.
- **Before / after (real):** Compare the Anthropic-endorsed form "Use constructor injection. Field injection breaks testability because we cannot mock the field without Spring context" → bare "MUST use constructor injection. NEVER use field injection." Delta: ~40%.
- **Why it _might_ be safe:** The rationale is tokens and, on a well-understood rule, may be derivable. Caveman's whole premise is that rationale is "fluff."
- **When it breaks — and this is the important open question:** Anthropic's official skill-creator explicitly flags this as a mistake: "If you find yourself writing ALWAYS or NEVER in all caps, or using super rigid structures, that's a yellow flag — if possible, reframe and explain the reasoning so that the model understands why the thing you're asking for is important." The stated mechanism (a third-party gloss on that guidance): the reasoning "becomes the rubric for cases the skill did not spell out" — i.e., rationale carries _generalization_ to unanticipated cases, which a bare imperative cannot. So deleting justification saves tokens on cases you enumerated and loses correctness on cases you didn't.
- **Evidence:** _Reported (Anthropic guidance), NOT measured for instruction files._ The targeted subagent search found no clean LLM ablation isolating "rule + why" vs. "bare rule." Adjacent measured evidence is mixed-to-adverse: a human field experiment (Meyer et al., PMC7786400) found giving reasons raised rule compliance, but LLM ablations of adding rules/reasoning show small, inconsistent, sometimes-negative effects (one such study reported appending generic rules dropped a RAG task from 26/30 to 9/30). **Verdict: keep the "why" for any rule where you can't enumerate every case; delete it only for mechanical, fully-specified constraints. This is an honest "nobody has cleanly measured this for instruction files."**

### 9. One-Example-Or-None

- **What it does:** Where several examples show one pattern, keep one; where the rule is self-evident, keep none.
- **Before / after (real):** Caveman's own rule: "merge redundant bullets; keep one example where several show the same pattern." Few-shot prompting practice (PromptHub's guide and multiple arXiv ablations) converges on "diminishing returns after two to three examples."
- **Why it is safe:** Measured few-shot curves show the jump from 0→1 example is large; 1→2 smaller; beyond ~3–5 flat or negative. Extra examples burn tokens and can _hurt_: a many-shot study (Gemini-1.5-pro on MATH500/GSM8K/GPQA) found the many-shot setting _decreased_ accuracy vs. few-shot due to format-error distraction from the longer input.
- **When it breaks:** When an example is _load-bearing_ — it disambiguates something the rule text cannot. Then one example is mandatory and may deserve to be kept at length. Zero examples is only safe when the instruction is unambiguous on its own. The 0→1 jump is the biggest measured gain in all of few-shot learning, so going to _zero_ is the riskiest cut in this catalog.
- **Evidence:** _Measured_ (few-shot diminishing returns and many-shot harm are documented across multiple papers), _opinion_ on which single example to keep (convention: place the best/last, since models weight recency).

### 10. Flip-Negative-To-Positive

- **What it does:** Replace an enumeration of prohibitions with the single positive behavior that covers them.
- **Before / after (real):** "Don't use inline styles. Don't use custom CSS. Don't write CSS-in-JS." → "Use Tailwind utilities." (from the ShadCN/Tailwind cursor-rules pattern). Delta: three rules to one.
- **Why it is safe (when it is):** One positive can replace many negatives _if_ it fully specifies the allowed space, and it dodges the "pink elephant" problem where stating "don't do X" activates X.
- **When it breaks:** When the forbidden space isn't covered by a single positive (some prohibitions are genuinely open-ended: "never commit secrets" has no positive equivalent). For hard safety boundaries, keep the explicit negative — practitioners agree negatives are right for "hard boundaries, not preferences."
- **Evidence:** _Reported/measured-adjacent._ Anthropic officially advises "Tell Claude what to do instead of what not to do." Multimodal instruction-tuning work (Liu et al., "Mitigating Hallucination…") measured models performing better on positive than negative instances. But this is about _phrasing_, so it saves less than the structural moves and is included last.

---

## Supporting Findings

**1. Does progressive disclosure work?** Yes, conditionally — see catalog #5. The mechanism is real and Anthropic-blessed (three-tier loading, ~100 tokens/skill at rest), but reliable fetching is _not_ the default. Anthropic's skill-creator admits Claude tends to "undertrigger." What makes a pointer get followed, per the measured Seleznov study: **directive wording** ("ALWAYS invoke this skill when… Do not do X directly" — ~100% vs. ~50% baseline, OR 20.6), **specificity of the condition** (name the triggering nouns explicitly, even ones the user won't say), **task complexity** (simple tasks bypass skills), and **shallow nesting** (one level from the index file). A `keywords:` frontmatter field had _zero_ measured effect; adding project CLAUDE.md context added ~15 points.

**2. When is redundancy load-bearing?** Rarely worth it for saving, but there is _measured_ evidence repetition can help adherence: Leviathan, Kalman & Matias (Google Research), "Prompt Repetition Improves Non-Reasoning LLMs," arXiv:2512.14982 (Dec 17 2025), found "Prompt repetition wins 47 out of 70 tests, with 0 losses" (McNemar test, p<0.1) — e.g., Gemini 2.0 Flash-Lite jumped from ~21% to ~97% on a custom task, with a padding control ruling out length as the cause. **But** this is for non-reasoning models and per-turn prompts; for a standing instruction file, repeating a rule spends rule-count budget (#7) and grows context, diluting the system prompt's relative attention. Verdict: deduplicate across files by default; earn repetition only for a single safety-critical rule, and prefer placing it at both high-attention ends (see #4) over literal duplication.

**3. Is there a ceiling on how many rules a model follows at once?** Yes, and it is the central finding. _Measured:_ IFScale — "even the best frontier models only achieve 68% accuracy at the max density of 500 instructions," with earlier instructions favored (primacy). ManyIFEval — monotonic degradation with count, predictable by a logistic model on count alone. _Reported:_ HumanLayer's ~150–200 reliable-instruction figure, ~50 already spent by the harness. **Adherence degrades with rule count, sometimes independently of token count — so cutting rules (#7) and cutting words are genuinely different operations, and word-level tools like caveman optimize the one that matters less for instruction files.**

**4. Does position matter?** Yes — _measured._ Lost-in-the-middle (Liu et al., 2024, TACL): ">30% degradation when relevant information is positioned in the middle"; U-shaped attention favoring start and end, linked to RoPE long-term decay. IFScale independently found primacy bias toward earlier instructions. Practical consequence: placement _is_ compression. A rule at the top or bottom is obeyed more reliably, so it can be stated once instead of hedged/repeated; the middle of a long file is where rules go to die. Put non-negotiables first (Claude Code reads top-to-bottom and later sections get summarized first under compaction).

**5. How do you verify a rewritten instruction file still works?** Practical methods people actually run: **(a) Trigger tests** — for skills/conditional files, run the triggering queries multiple times (Anthropic's skill-creator runs each query 3× for a "reliable trigger rate," 60/40 train/held-out split; Scott Spence's 200+ prompt framework reportedly hit 84% activation with a forced-eval hook). **(b) A/B behavioral tests** — JetBrains ran caveman across "86 of 87 tasks" from SkillsBench (benchflow/skillsbench), each "auto-graded by its own tests on a 0-1 scale," across "3 runs, about 240 billed trials, about USD 106 total," using a sign test (arms statistically indistinguishable) to show it didn't degrade quality. **(c) Logging proxy** — HumanLayer's trick of putting a proxy on `ANTHROPIC_BASE_URL` to see exactly what the harness injects and whether CLAUDE.md is being honored. **(d) Ablation** — remove a rule, run the task suite, measure adherence delta. The honest state of practice: most people eyeball it; rigorous trigger/behavioral testing exists but is rare outside vendors.

---

## What Has No Evidence

- **"Invented abbreviations save tokens" — FALSE, verifiable.** `cfg`/`impl`/`req` tokenize into the same pieces as the full word under BPE (tiktoken cl100k_base/o200k_base); caveman is correct to ban them ("tokenizer split them same as full word: zero token saved"). This is folklore that turns out to be wrong, in the _opposite_ direction from usual — people think shortening saves tokens; it doesn't.
- **"Symbol connectors (→, •) compress" — FALSE, verifiable.** Each is its own token; zero saving. Caveman is right again ("No causal arrows (→) either — own token, save nothing").
- **"Terse files are cheaper, therefore better" — weakly supported.** JetBrains measured caveman at 8.5% real agentic savings, and the skill adds 1–1.5k input tokens/turn. On instruction files the cost argument is marginal; the _adherence_ argument (rule count) is the real one.
- **"State the rationale to improve adherence" — asserted by Anthropic, NOT measured for instruction files.** Genuine open question. Human evidence positive; LLM ablations mixed-to-negative. Do not present as established.
- **"Repeat critical rules for adherence" — measured for per-turn prompts, untested for standing instruction files.** The Google result is real but may not transfer to always-on memory files, where it fights the rule-count ceiling.
- **Break-even for defined terms (#6), and "when is one example still too many" (#9 at the zero boundary)** — nobody has published numbers specific to hand-edited agent instruction files. Best reading given above.
- **Whether Predicate-Replaces-Enumeration (#1) preserves adherence as well as it preserves information** — plausible via the rule-count finding, but not directly measured. The single most valuable thing a practitioner could measure next.

---

## Citation Audit

**Verified primary/strong sources (survive scrutiny):**

- IFScale — "How Many Instructions Can LLMs Follow at Once?", Jaroslawicz, Whiting, Shah, Maamari (Distyl AI), arXiv:2507.11538, DOI 10.48550/arXiv.2507.11538. Verified: 68% at 500 instructions; three decay patterns; primacy bias. **Load-bearing for the report's central claim.**
- Lost-in-the-Middle — Liu et al., 2024, TACL vol. 12 pp. 157–173. Verified. Positional evidence, >30% mid-context degradation.
- ManyIFEval/StyleMBPP — Harada et al., arXiv:2509.21051. Verified: monotonic degradation with count.
- Anthropic "Effective context engineering for AI agents" (engineering blog, Sept 2025) and skill-creator / skill-authoring best-practices docs. Verified; "undertrigger" and "explain the why / yellow flag" quotes confirmed from Anthropic's own skill-creator SKILL.md; "improved triggering on 5 out of 6 public skills" from the skill-creator blog.
- Caveman repo (JuliusBrussee/caveman) — SKILL.md text (abbreviation/arrow tokenizer claims, ~46% file compression, 1–1.5k input-token overhead, 65% chat-only figure) verified from repo. JetBrains SkillsBench A/B (8.5% real savings; quality arms statistically indistinguishable; 86/87 tasks, ~240 trials, ~USD 106) verified from Denis Shiryaev's JetBrains AI blog (July 16 2026).
- Empirical Study on Prompt Compression — Zhang et al., ICLR 2025 Building Trust Workshop, arXiv:2505.00019. Verified; used for "which words are droppable" / moderate compression can help long-context / all methods raise hallucination.
- Prompt Repetition — Leviathan/Kalman/Matias (Google), arXiv:2512.14982. Verified (47/70 wins, 0 losses, McNemar p<0.1; ~21→97% example; padding control).
- BPE tokenization (tiktoken cl100k_base/o200k_base) — verified from OpenAI tiktoken repo; supports the abbreviation/symbol claims.

**Unverified / lower-confidence (flagged in text):**

- Seleznov 650-trial skill-activation study (Medium, Feb 2026): ~50% baseline → ~100% directive, OR 20.6. **Independent, self-published, one model (Claude Opus 4.5), three skills — preliminary, not authoritative.** The _direction_ is corroborated by Anthropic's own "undertrigger" admission and 5/6-skills-improved ratio; the _specific percentages_ should be treated as indicative.
- HumanLayer's "~150–200 instructions" figure: their reading of arXiv:2507.11538 and related work, not a verbatim finding of that paper. The paper measures keyword-inclusion instructions, so the 150–200 number is a reasonable practitioner extrapolation, not a measured constant. Treat as _reported_.
- The adjacent LLM ablations cited only as _counter-evidence_ that adding rules/reasoning is inconsistent (surfaced by the subagent with future-dated arXiv identifiers) could not be independently confirmed. The conclusion they support ("rationale's benefit is unproven for LLMs") still holds on the strength of the _absence_ of positive measured evidence plus Anthropic's own hedged framing, even if those specific papers are struck.

**Which conclusions survive if every unverified citation is struck out:**

- The core thesis survives intact: **structural moves beat word-trimming, and cutting rule count is the highest-leverage compression**, because it rests on IFScale, ManyIFEval, and Lost-in-the-Middle, all verified primary sources.
- The tokenizer debunks (abbreviations/arrows) survive — verifiable from tiktoken.
- Progressive disclosure "works but must be written directively" survives _qualitatively_ on Anthropic's own docs and "undertrigger" admission even if the Seleznov percentages are struck; only the exact activation numbers are at risk.
- The "keep the rationale" recommendation survives as an _open question with Anthropic guidance on one side_, unchanged, since it was never claimed as measured.
- What does NOT survive without the flagged sources: any precise activation-rate number, and the specific "150–200 instructions" ceiling as a hard figure (the _existence_ of a count-based ceiling survives on measured sources).

---

## Recommendations

**Stage 1 — Cut rules before you cut words (do this first).** Audit the file for rules that aren't universally applicable to every task it governs. Move each to a scoped/conditional file (#5) or delete it. Target: get the always-on file's live rule count well under the harness budget — HumanLayer's "less than sixty lines" root CLAUDE.md is a good north star, and <300 lines is the consensus ceiling. Benchmark that changes this: if you can't get below ~150 total instructions (including the ~50 the harness spends), you are over the measured reliability ceiling and should split the file.

**Stage 2 — Apply the safe structural moves.** In priority order: Predicate-Replaces-Enumeration (#1), Delete-The-Derivable (#2), Structure-Absorbs-Repetition (#4), Invariant-Replaces-Procedure (#3), Name-Once-Reuse (#6). These are information-preserving and adherence-neutral-to-positive.

**Stage 3 — Exploit position.** Move non-negotiable/safety rules to the top; consider an end-of-file confirmation for the single most critical rule. Stop hedging or repeating rules that are already at a high-attention end.

**Stage 4 — Treat the two risky moves as bets, and test them.** Only after Stages 1–3, consider Delete-The-Justification (#8) and One-Example-Or-None (#9). For each, keep the "why" and the example unless you can A/B it. Threshold that changes the recommendation: if an ablation shows adherence drops when you remove a rationale/example, put it back and mark it load-bearing.

**Stage 5 — Verify.** Write 5–10 trigger/behavioral test prompts and run them 3× each against the old and new file. For any conditional file, make the pointer directive and specific and confirm it fetches. Use a logging proxy if adherence is mysteriously poor — it may be the harness's "ignore irrelevant context" reminder, which means the rule belongs in a scoped file, not the always-on one.

---

## Caveats

- **Most of the structural transformations are reasoned, not measured.** The rule-count ceiling, positional effects, and few-shot diminishing returns are measured; the specific _prose refactors_ (#1, #2, #3, #6) are engineering judgment justified by those measured findings, not directly A/B-tested on instruction files. The single most valuable experiment nobody has run: A/B a predicate-collapsed file vs. its enumerated original and measure adherence, not just token count.
- **The evidence base skews toward chat/report tasks, not agentic coding.** IFScale is a business-report keyword task; few-shot curves are QA/reasoning. Agentic instruction-following may behave differently, and the JetBrains result shows agentic token economics differ sharply from chat.
- **Model-dependence is large.** Reasoning models tolerate far more instructions (threshold decay at 150+) than small models (exponential decay almost immediately). A file that's fine for Claude Opus/Sonnet may overwhelm a small local model. Compress harder for smaller models.
- **Some cited arXiv identifiers surfaced with future-dated numbers** (an artifact of the search surface); the report's load-bearing claims all rest on sources verified to exist. Where a claim rests only on an unconfirmable source, it is used as corroboration or counter-evidence, never as sole support.
- **The "at arm's length" scope was respected:** prompt-compression systems (LLMLingua et al.) were mined only for the empirical finding that moderate compression preserves or even improves long-context performance and that all methods raise hallucination via information loss — not recommended for adoption on hand-edited files.
