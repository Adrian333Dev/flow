# Making an AI Agent Genuinely Creative at Design and Problem Solving

## Executive summary

The single most important finding: for JOB ONE (breadth), the engineering-enumeration cluster — HAZOP guide words, morphological analysis, premortem — transfers better and more cheaply than the AI-creativity literature, because it forces coverage by structure rather than by asking the model to "be creative." For JOB TWO (depth), the highest-leverage move is exploiting the agent's tools to make proposals checkable — separating generation from an _external_ verifier (run the code, run the test) — because LLM intrinsic self-evaluation is weak and often makes reasoning worse.

The deficit is real and measured. RLHF and instruction tuning demonstrably reduce output diversity relative to base models (Kirk et al. 2023: RLHF generalizes better than SFT but substantially reduces both per-input and across-input diversity — mode collapse — across LLaMA-7B and OPT). Commercial LLMs are more similar to each other than humans are to each other on standard creativity tasks (Wenger & Kenett, PNAS Nexus 2026: 22 LLMs vs 102 humans, effect sizes 1.4–2.2). LLMs produce many decent ideas but few extreme ones, and instruction-tuned models collapse toward a distribution centroid. This is the mechanism behind both job weaknesses.

Ranked, by job:

**JOB ONE (breadth) — what works, best first:**

1. Structured enumeration checklists (HAZOP guide words, morphological box) — forces coverage, cheap, one call. STRONG evidence in engineering; transfer to LLM prompting under-tested but mechanically sound.
2. Premortem / prospective hindsight — ~30% more reasons identified (Mitchell, Russo & Pennington 1989). STRONG for surfacing risks/failure modes; one call.
3. Require N ideas that differ along a _named axis_ — moderate evidence; cheap; the axis matters more than the number.
4. Persona/role assignment — WEAK-to-moderate and inconsistent; diverse _ordinary_ personas beat "famous innovator" personas.
5. Multi-agent debate — MISLEADING as a diversity tool: it converges, not diverges. Use parallel independent sub-agents instead.

**JOB TWO (depth) — what works, best first:**

1. Analogical prompting with a _supplied or explicitly-demanded distant_ source domain — STRONG cognitive basis (Gick & Holyoak: 10%→~80% with hint); moderate LLM evidence.
2. Generate-then-verify using tools (run it) — STRONG; the checkability tension resolves in depth's favour.
3. Constraint relaxation / TRIZ-style contradiction framing — moderate; forces reformulation.
4. Step-back / first-principles abstraction — moderate (7–27% on reasoning benchmarks; not measured for novelty).
5. Denial prompting (ban the obvious answer) — moderate but domain-dependent; helps on standard tasks, HURTS on tool-use/hard tasks.

Reject as folklore: bare "be creative," "think outside the box," "be innovative" as standalone instructions — no measured novel-structure gain; degrades toward flowery language.

---

## Q1. Measurement: how creative capability in LLMs is measured

**Divergent-thinking instruments.** The field imports three human instruments: the Alternative Uses Task (AUT; Guilford), the Divergent Association Task (DAT; Olson et al. 2021), and the Torrance Tests of Creative Thinking (TTCT; Torrance 1966), plus the Remote Associates Test (Mednick). These are scored on fluency, flexibility, originality, elaboration. The central methodological problem: these instruments are near-saturated for LLMs. Wenger & Kenett note they are "comparatively easy for LLMs," which exploit large context, retrieval, and parallel generation, and many standard items appear in pretraining. Newer benchmarks (CREATE, CreativityPrism, NoveltyBench, NeoGauge/NeoCoder) were built specifically because the classic instruments no longer discriminate.

**The key homogeneity finding.** Wenger & Kenett (Duke), "Large language models are homogeneously creative," PNAS Nexus vol. 5 no. 3, pgag042 (March 2026), tested 22 LLMs against 102 humans on AUT, DAT, and forward-flow measures. Result, verbatim: "We find that LLM responses mirror other LLM responses far more than humans do other humans, even after controlling for key confounding variables," with effect sizes of 1.4 to 2.2. This is the "we're different, we're the same" / "artificial hivemind" result, replicated across several groups.

**Average vs tail originality — directly on point.** The evidence supports the user's hypothesis. Models produce many adequate ideas but few extreme ones. The "Measuring LLM Novelty" paper (arXiv 2504.09389) operationalizes novelty as the harmonic mean of n-gram originality and quality and finds inference-time methods trade originality against quality — you buy tail originality by sacrificing average quality. The CreativityPrism decomposition into quality/novelty/diversity dimensions confirms models score well on quality and poorly on the novelty/diversity axes.

**Insight-problem and creative-problem-solving benchmarks.** MacGyver (creative tool use), NeoCoder/NeoGauge (code creativity via denial prompting), CreativeMath, and the "Task Task" exist. The CREATE benchmark (associative creativity over real-world entities) finds "no single model adequately covers the space of strong answer paths" and that spending more reasoning tokens does not raise the score — direct evidence the deficit is not solved by more compute.

**Output variance across repeated samples.** This is the mode-collapse literature. Turpin et al. (2023) formalized mode collapse in instruction-tuned LLMs, noting sharp entropy reductions and increased answer determinism. Under fixed prompts, instruction-tuned/RLHF models show markedly lower entropy than base models. Note the constraint: much of this variance is temperature-controlled, and the user cannot set temperature. Under the API defaults the user is stuck with, repeated same-prompt sampling gives lower spread than a base model would — so diversity must come from the _prompt content_ varying, not from sampling.

## Q2. Homogenization from instruction tuning and RLHF

**The core measurement.** Kirk et al. (arXiv 2310.06452, ICLR 2024, "Understanding the Effects of RLHF on LLM Generalisation and Diversity") is the load-bearing citation. Across LLaMA-7B and OPT on TL;DR summarization and AlpacaFarm instruction-following: RLHF generalizes better than SFT out-of-distribution but "substantially reduces output diversity (per-input AND across-input = mode collapse), revealing an inherent generalisation↔diversity tradeoff." The widely-cited magnitude: per-input diversity drops ~70–80 points for RLHF-tuned LLaMA-7B vs SFT.

**Corroboration.** "The Price of Format: Diversity Collapse in LLMs" (arXiv 2505.18949) ties collapse partly to output-formatting demands. O'Mahony et al. (2024) show SFT alone reduces diversity, so it is not RLHF-exclusive. The "alignment tax" (Ouyang et al. 2022; Bai et al. 2022) is the original documentation. Reduced entropy during RLHF is directly observed (arXiv 2503.22230, appendix).

**Prompt-level countermeasures with a measured effect (the user's real question).** This is where the literature thins. Most "fixes" are training-time (temperature, DPO variants, decoding changes) and therefore out of scope for a prompt-only user. Of prompt-level interventions with _measurement_:

- Denial prompting (Lu et al. 2024) measurably raises novelty on some tasks (see Q9).
- Diverse-persona injection raises diversity in data-generation settings (Ge et al. PersonaHub; mixed elsewhere).
- Explicitly requesting rare/novel output with chain-of-thought raises n-gram originality but lowers quality (arXiv 2504.09389).
- Multi-view / "brainstorming" prompts raise diversity modestly (Multi-Novelty, arXiv 2502.12700).

Critically, the homogenization studies find that prompt- and parameter-level tweaks do NOT close the human-vs-LLM collective-diversity gap. The college-admissions-essay study (ScienceDirect S294988212500091X, three preregistered studies, 2,200 essays) shows each additional human essay contributes more new ideas than each additional GPT-4 essay, and this gap "persisted despite efforts to enhance AI-generated content through both prompt and parameter modifications." So: prompt countermeasures shift the margin; they do not fix the underlying collapse.

## Q3. Prompt techniques for diversity

Assessed per technique, with job served noted.

**Persona / role assignment (JOB ONE).** Evidence WEAK-to-moderate and inconsistent. "Quantifying the Persona Effect" (arXiv 2402.10811) finds personas show greater output variability than control but effects are "modest and context-dependent." Kambhatla et al. (2025): fine-grained persona detail does NOT add lexical/content diversity beyond a coarse summary. Most useful finding for the user: the barriers-to-diversity paper (arXiv 2602.20408) shows diverse _ordinary_ personas outperform "creative entrepreneur" personas (Steve Jobs/Musk) because ordinary personas inject more distinct cues pushing the model to different regions of its knowledge space. Holds outside the origin task only weakly.

**Tree of Thoughts (JOB TWO more than ONE).** Strong effect but on search/planning tasks, not idea diversity: Game of 24 success 4% (CoT) → 74% (ToT, breadth=5); at breadth=1 already 45% (Yao et al. 2023). This is a depth/search win, not a breadth win, and the cost is many model calls (BFS over a tree). Expensive in an interactive setting.

**Step-back prompting (JOB TWO).** Zheng et al. 2023 (DeepMind): +7% MMLU Physics, +11% Chemistry, +27% TimeQA, +7% MuSiQue on PaLM-2L; model-agnostic (also GPT-4, Llama2-70B). Measured on reasoning accuracy, NOT on novelty/diversity — do not overclaim it as a creativity technique. Cheap (one extra step). Serves depth via reformulation.

**Multi-agent debate / society of minds (neither, as usually implemented).** Important negative finding. Debate was sold as diversity-enhancing; the 2024–2026 literature shows it CONVERGES. "Diversity Collapse in Multi-Agent LLM Systems" (2604.18005); "Talk Isn't Always Cheap" (2509.05396) shows debate can _lower_ accuracy via conformity ("tyranny of the majority," Estornell & Liu 2024); Huang et al. prove debate is a martingale on belief in the correct answer — no expected gain over independent voting for accuracy. Sycophantic conformity up to 85.5% (2605.00914). Implication: do NOT use debate for breadth. Use _parallel independent_ sub-agents with non-overlapping contexts, then union the results — that preserves diversity because there is no cross-talk to collapse.

**Deliberately injected constraints (BOTH).** Moderate evidence. Constraints push the model into lower-probability, more inventive regions (survey 2511.07448). Denial prompting is the measured instance (Q9).

**Requiring N ideas differing along a named axis (JOB ONE).** Moderate. The IDEAFix defixation study (2606.00875) found prompts with explicit unconventionality cues and structured differentiation outperform control, statistically significant by t-test. The axis matters more than N: "give 5 ideas" mostly yields near-duplicates; "give one idea each from a different architectural layer / cost model / failure mode" spreads coverage.

**Banning the first/obvious answer (BOTH).** Denial prompting (Lu et al. 2024, NeoCoder) measurably increases code creativity by iteratively forbidding detected techniques. BUT (arXiv 2504.09389): denial prompting improves novelty on TinyStories and CoPoet yet _significantly reduces_ it on MacGyver (creative tool use) and lowers quality across the board. So banning the obvious answer helps on soft/open tasks and can hurt on hard constrained ones — exactly the user's domain caution.

## Q4. Systematic enumeration from engineering

This cluster is the user's best bet for JOB ONE, and the evidence supports the user's suspicion that it transfers better than the AI-creativity literature — though I flag that direct LLM-prompting studies are sparse.

**HAZOP guide words (no/not, more, less, as-well-as, part-of, reverse, other-than, early/late).** STRONG evidence it increases items found in engineering. The urban-gas HAZOP study (PLOS One, journal.pone.0333431 / PMC12558524) found a guide-word model identified 65 gas hazards, "over eight times more than traditional inspection approaches." The mechanism — systematically crossing each parameter with each guide word — is exactly a coverage-forcing device. Published application to LLM prompting is essentially absent (a genuine gap and an opportunity). Transfer is mechanically sound because it converts "think of what's missing" into a finite enumerated cross-product a model executes reliably.

**Morphological analysis / the morphological box (Zwicky).** Decompose a design into parameters (dimensions), list options per parameter, then traverse combinations. Strong pedigree in design; forces the model to consider combinations no one raised. LLM-specific measurement thin. Cheap: one call to build the box, then reason over cells.

**FMEA.** Failure Mode and Effects Analysis — enumerate failure modes × effects × causes × detection. Coverage-forcing like HAZOP but failure-oriented. Strong in reliability engineering; overlaps premortem. Good for the "structure is wrong" case.

**Premortem / prospective hindsight (JOB ONE, risk/decision coverage).** STRONG and well-cited. Klein's HBR article "Performing a Project Premortem" (September 2007) states: "Research conducted in 1989 by Deborah J. Mitchell, of the Wharton School; Jay Russo, of Cornell; and Nancy Pennington, of the University of Colorado, found that prospective hindsight—imagining that an event has already occurred—increases the ability to correctly identify reasons for future outcomes by 30%." Klein reports the framing roughly doubles surfaced risks in the field. Veinott, Klein & Wiggins (2010): 178 university students assessed an H1N1 lockdown plan under five conditions; the premortem "reduced confidence significantly more than the other approaches—about twice the effect of Pro/Cons or Cons-only methods." The grammatical shift ("it failed — why?") is the active ingredient and translates directly to a prompt.

**Structured devil's advocacy / assigned red-teaming (JOB ONE/TWO).** Moderate. Assigning an adversarial role surfaces objections; but note the sycophancy caveat (Q9) — a genuine adversary must be _structurally_ assigned (a separate sub-agent tasked to break the proposal, ideally with tools to actually try) or the model will soften.

Bottom line on Q4: the cluster transfers better for breadth because it substitutes explicit combinatorial structure for the thing LLMs are worst at (self-generated divergence). Test rather than assume: the honest state is strong human-domain evidence, near-zero direct LLM-prompting measurement.

## Q5. Fixation (the core of Job Two)

**Einstellung effect.** Luchins' water-jar experiments (1942): subjects who learned a 3-jar formula kept applying it even when a trivially simpler 2-jar solution existed; many failed the simpler problem entirely after being "set." The definitive expert demonstration is the chess work of Bilalić, McLeod & Gobet. In "Inflexibility of experts — reality or myth? Quantifying the Einstellung effect in chess masters" (_Cognitive Psychology_ 56(2), 2008), players were asked to find the shortest win. When a familiar "smothered mate" (a well-known 5-move motif: 1.Qe6+ Kh8 2.Nf7+ Kg8 3.Nh6++ Kh8 4.Qg8+ Rxg8 5.Nf7#) was available alongside a shorter 3-move solution (1.Qe6+ Kh8 2.Qh6! ... 3.Qxh7#), experts fixated on the familiar one and missed the better one. The presence of the familiar solution "reduced experts' problem solving ability to about that of players three standard deviations lower in skill level." Concretely (replicated in Bilalić et al. 2010, _Current Directions in Psychological Science_): on the two-solution problem, International Masters found the optimum 50% of the time, Masters 18%, Candidate Masters 0% — but on the one-solution problem (familiar solution removed) all found it (100%), proving the problem was not intrinsically too hard. A 100-Elo drop reduced the odds of finding the shorter solution by a factor of 3.67.

The eye-tracking result (Bilalić, McLeod & Gobet, "Why good thoughts block better ones: The mechanism of the pernicious Einstellung (set) effect," _Cognition_ 108(3), 2008) is the mechanism: players said they were looking for a better move, but their eyes kept returning to the squares of the familiar solution and barely visited the squares needed for the better one — the gaze-location × time interaction was non-significant (F(5,20)=0.6, ns) for the two-solution group, i.e., attention never shifted. From the 2010 synthesis: "The first idea that comes to mind directs attention towards sources of information consistent with itself and away from inconsistent information. This bias continues unconsciously even when the player believes he is looking for alternatives." This is a near-exact model of the user's Job Two failure: the agent reaches the first adequate solution and then argues for it. (Note: the brief referenced Current Biology; the eye-tracking study was in _Cognition_, the synthesis in _Current Directions_ — no Current Biology paper by these authors on this topic exists.)

**Functional fixedness.** Duncker's candle problem (1945): people fail to see the tack box as a platform because they see it only as a container; solution rate doubles when the box is presented empty. Direct LLM evidence for the model itself: the clinical-reasoning paper (mARC-QA, arXiv 2502.04381 / PMC12606185) is the strongest — state-of-the-art models (o1, Gemini, Claude, DeepSeek) fail medical questions engineered to exploit "inflexible pattern matching from their training data rather than flexible reasoning," performing far below physicians. The "Trapped by Expectations" study (arXiv 2504.02074, 450 participants) documents functional fixedness in how _users_ interact with LLMs — relevant but about users, not the model.

**Representational change theory (Ohlsson; Knoblich et al. 1999).** Insight = restructuring the problem representation after an impasse, via two mechanisms: constraint relaxation (drop an assumed-but-not-real constraint) and chunk decomposition (break a perceived unit into recombineable parts). Eye-movement evidence (Knoblich, Ohlsson & Raney 2001) supports it. This is the theoretical backbone for why "reformulate before solving" beats "search harder."

**Constraint relaxation.** Identify the constraint that is assumed rather than real — the operational core of both Ohlsson's theory and TRIZ's separation principles.

**Interventions that counter fixation.** In humans: removing/altering the fixating example; incubation; explicit hints; defixation instructions. In models: the IDEAFix "defixation prompting" study (2606.00875) found all method-inspired defixation prompts beat control on novelty (statistically significant), with brainstorming and AI-specific prompts giving the largest top-5 novelty gains — but "no single method simultaneously maximizes idea fluency, novelty, rarity and diversity," and complex human methods (C-K theory, SCAMPER) did NOT reliably help. Denial prompting is a direct anti-Einstellung device (ban the technique the model reached for first).

## Q6. Analogical transfer

**The human evidence.** Gick & Holyoak (Cognitive Psychology, 1980, 12:306–355): Duncker's radiation problem. ~10% solve unaided; ~30% after reading the structurally-analogous fortress/general story; then "approximately an additional 50% of participants gave the convergence solution, for a total solution rate of roughly 80%" (up to 92%) once given an explicit hint to use the source. The decisive finding for the user: the analogy usually must be _pointed at_ — only ~20% spontaneously notice and apply it even when the source is sitting in memory. Analogical problem-solving decomposes into noticing, mapping, and applying — and _noticing_ is the bottleneck.

**LLM analogical prompting.** Yasunaga et al. (2023, "Large Language Models as Analogical Reasoners," ICLR 2024): prompting the model to self-generate relevant exemplars before solving beats 0-shot CoT and manual few-shot CoT on math (GSM8K, MATH), code, and BIG-Bench. So models _can_ self-generate useful analogues for well-posed reasoning. Webb, Holyoak & Lu (Nature Human Behaviour 2023, "Emergent Analogical Reasoning") show GPT-3/4 solve many analogy tasks including a qualitative radiation-problem evaluation.

**The user's specific question — can the agent reliably find its own DISTANT analogue, or must the source be supplied?** Honest answer: self-generated analogues work best when the source is _near_ (same domain, structurally similar) — that is what GSM8K/MATH exemplars are. For genuinely distant, cross-domain analogues (the kind that crack stuck problems), the human evidence says noticing fails without a pointer, and there is no strong LLM study showing reliable spontaneous _distant_ retrieval. Practical implication: instruct the agent to generate _several_ candidate source domains explicitly and deliberately far ("name three unrelated fields where a structurally identical problem is solved"), rather than trusting spontaneous transfer. The self-generation must be forced and multiple, because a single spontaneous attempt reproduces the noticing failure.

## Q7. Structured methods for non-obvious solutions

**TRIZ (Altshuller).** Contradiction resolution (improve X without worsening Y), the Ideal Final Result (imagine the function delivered with zero cost/harm, work back), and the separation principles (separate conflicting requirements in time, space, scale, or condition). TRIZ+LLM is an active area: AutoTRIZ (arXiv 2403.13002; ScienceDirect S1474034625002058) automates the contradiction→inventive-principle workflow; TRIZBench (ACL Findings 2026) benchmarks contradiction prediction, inventive-principle prediction, and grounded reasoning. Effectiveness for the user: TRIZ was one of the few _human_ methods that matched or beat baseline on the novelty metric in IDEAFix, unlike SCAMPER/C-K. The transferable, cheap core is the contradiction framing and IFR — you don't need the 40-principle matrix in the file.

**Problem finding / reformulation (Getzels & Csikszentmihalyi).** The 1964/1976 art-student study ("The Creative Vision"): students who spent longer in problem _exploration_ (handling more objects, rearranging, leaving the composition open late) produced work judged more original and aesthetically valuable — and this "discovery orientation" predicted career success years later. The finding: time spent restructuring the problem, rather than solving it as posed, correlates with better outcomes. Direct mandate for the agent: spend budget reformulating before solving.

**First-principles decomposition.** Break the problem to base truths and rebuild. Overlaps step-back prompting (measured: 7–27% on reasoning benchmarks) and TRIZ's IFR. Cheap, one extra step, serves depth.

**Transfer evidence to LLM prompting.** Moderate and improving for TRIZ; strong cognitive basis but thin LLM measurement for problem-finding. The honest state: these give reliable _scaffolds_ (checkable steps) rather than proven novelty lifts in LLMs.

## Q8. Separating generation from evaluation

**The core evidence.** Generating and judging in one pass suppresses originality because the model's judgment pulls toward the distribution centroid. The decisive negative result for _self_-evaluation: Huang et al. (2023, "LLMs Cannot Self-Correct Reasoning Yet," ICLR 2024) — intrinsic self-correction _without external feedback_ does not improve and often _degrades_ reasoning. The TACL survey ("When Can LLMs Actually Correct Their Own Mistakes?") confirms: LLMs correct well when errors are _externally identified_ but fail at autonomous error detection/localization (the "verification bottleneck"). The Si et al. research-ideation study flagged "failures of LLM self-evaluation" as an open problem.

**What this means for each variant:**

- **Generate-then-critique (same model, no tools):** WEAK. Risks degradation. Only worth it if the critique is grounded in something external.
- **Best-of-N with a separate scorer:** works only if the scorer has signal the generator lacks — i.e., an external check (tests, execution, web evidence), not a second opinion from the same distribution.
- **Self-refinement (Madaan et al. Self-Refine):** helps on tasks with a clear objective (code with tests) and is unreliable on open reasoning without external feedback.
- **Forcing K structurally distinct solution families before any evaluation:** STRONG structurally — the single most robust generation-side move. It prevents premature convergence (the Einstellung mechanism) by mandating breadth before judgment. Cheap (one call producing K).

**Cost and interactivity.** The winning pattern: generate K distinct families in ONE call (cheap, interactive-friendly), then evaluate using TOOLS not introspection — the agent can run the code, run the test, search the web. Best-of-N and ToT that need many calls are viable only when dispatched to parallel sub-agents; in a single serial conversation they cost latency the human feels. The checkability tension (Job Two) resolves here: a novel proposal that can be executed and shown wrong in one cycle is exactly what to prefer.

## Q9. Anti-patterns

**"Be creative" / "think outside the box" / "be innovative."** The honest finding: as _bare_ instructions these are close to folklore. IDEAFix found that novelty gains attributed to complex methods actually traced to explicit unconventionality _cues_ ("wild," "unconventional") — but those cues raise novelty largely on soft tasks and, per arXiv 2504.09389, requesting novelty raises n-gram originality while _lowering quality_. There is no evidence that "be creative" alone produces novel _structure_; the observed effect is stylistic (more flowery, more adjectives) rather than structural. Verdict: a bare exhortation degrades toward decoration. What works is specific, checkable instructions (differ along axis X; relax constraint Y; find a distant analogue), not adjectives.

**Anchoring on the user's framing.** This is the direct cause of the user's Job One weakness ("every option derives from something the user already said"). The design-fixation literature (Jansson & Smith 1991) and the anchoring literature (Tversky & Kahneman) both apply: an LLM handed a framing converges toward the centroid of that framing. Countermeasure: force reframing and self-generated axes before responding to the given frame.

**Sycophancy suppressing challenging proposals.** Well-documented: RLHF models adopt the user's stated view and soften disagreement; in multi-agent settings sycophantic conformity reaches 85.5% (2605.00914). This directly blocks Job Two — the agent won't tell you the structure is wrong if you seem invested in it. Countermeasure: assign the challenge to a _separate_ tool-armed sub-agent whose job is to break the proposal, and require it to produce a concrete failing case, not an opinion.

**Novelty bought at the cost of correctness.** The measured tradeoff (2504.09389; the ideation-execution gap paper, arXiv 2506.20803 — LLM research ideas rated more novel at ideation but scores _dropped below_ human ideas after 43 experts spent 100+ hours executing them). For breadth this is a net loss (wasted human time); for depth it is acceptable IF checkable.

**What should NOT go in the file:** bare "be creative/innovative/outside the box"; instructions to self-critique without an external check; multi-agent debate framed as a diversity engine; demands for many wild options without a relevance filter; persona detail beyond a coarse role.

## Q10. Evaluation — telling cheaply whether a change worked

Two runnable measures, one per job.

**Coverage of a design space (JOB ONE).** Build a small gold set of 8–12 real design decisions the user has already worked through, and for each write down the set of genuinely distinct approaches that existed (the "reference option set," assembled by the user, ideally including approaches only discovered later). Metric = **coverage recall**: fraction of reference options the agent's output raised, plus a **novel-but-valid count** (options the agent raised that were NOT in the reference set but the user judges worth considering). Score distinctness by embedding the options and requiring pairwise cosine distance above a threshold, or just by manual bucketing. Cheap because it is one generation per case. A change "worked" for breadth if coverage recall rises without the novel-but-valid options degrading into noise. Track a **junk rate** = raised options the user rejects as irrelevant; if junk rate climbs faster than coverage, the change bought originality with relevance and is a net loss.

**Quality of solutions to a hard problem (JOB TWO).** Assemble 6–10 genuinely stuck problems with _checkable_ outcomes — a bug with a known-hard fix, a constraint the user eventually resolved, a structure the user eventually re-architected. For each, the ground truth is "did a proposed solution actually pass the check" (test passes, constraint satisfied, build works). Metric = **solve rate** (fraction where at least one proposal, when executed, works) and **cycles-to-solve** (proposal→check rounds). Because the domain is checkable, evaluation is nearly automatic — run the agent's proposal. A change "worked" for depth if solve rate rises or cycles-to-solve falls. This directly rewards checkable proposals over sophisticated-sounding directions.

**Evaluation-set sketch.** ~10 breadth cases + ~8 depth cases, drawn from the user's own git history and design notes (real, domain-matched, and — crucially — where the user already knows the answer or the later-discovered options). Run each candidate skill-file version against the whole set; compare coverage recall / junk rate for breadth and solve rate / cycles for depth. Total cost: one generation per case per version — runnable in an afternoon.

## Recommendations table

| Technique                                        | Job  | Evidence strength                        | Measured effect                                              | Cost (calls) | Fits line budget    |
| ------------------------------------------------ | ---- | ---------------------------------------- | ------------------------------------------------------------ | ------------ | ------------------- |
| HAZOP guide-word enumeration                     | ONE  | Strong (engineering); untested for LLM   | 8× hazards found vs inspection (gas study)                   | 1            | Yes                 |
| Morphological box                                | ONE  | Moderate (design); weak LLM              | Coverage by construction                                     | 1            | Yes                 |
| Premortem / prospective hindsight                | ONE  | Strong                                   | +30% reasons; ~2× risks surfaced                             | 1            | Yes                 |
| Require N ideas along a NAMED axis               | ONE  | Moderate                                 | Significant novelty gain vs control (IDEAFix)                | 1            | Yes                 |
| Diverse ordinary personas                        | ONE  | Weak–moderate, inconsistent              | Modest diversity lift; ordinary > famous                     | 1–K          | Yes                 |
| Parallel independent sub-agents (union)          | ONE  | Moderate (inferred from debate-collapse) | Avoids convergence debate causes                             | K (parallel) | Yes                 |
| Analogical prompting, forced distant source      | TWO  | Strong (human); moderate (LLM)           | 10%→~80% with pointed analogy                                | 1–2          | Yes                 |
| Generate K families, then verify with tools      | TWO  | Strong                                   | Avoids premature convergence; external check beats self-eval | 1 + checks   | Yes                 |
| Constraint relaxation / TRIZ contradiction + IFR | TWO  | Moderate                                 | TRIZ matched/beat baseline novelty (IDEAFix)                 | 1            | Yes (core only)     |
| Step-back / first-principles abstraction         | TWO  | Moderate (accuracy, not novelty)         | +7–27% reasoning benchmarks                                  | 1            | Yes                 |
| Denial prompting (ban obvious answer)            | BOTH | Moderate, domain-dependent               | +novelty on soft tasks; HURTS on hard/tool tasks             | 1–t          | Yes                 |
| Tree of Thoughts                                 | TWO  | Strong on search tasks                   | 4%→74% Game of 24                                            | Many         | No (too many calls) |
| Multi-agent debate for diversity                 | —    | Strong NEGATIVE                          | Converges; up to 85.5% conformity                            | Many         | Reject              |
| Bare "be creative / outside the box"             | —    | Folklore                                 | Style change, no novel structure; ↓quality                   | 0            | Reject              |

## Draft instruction text (the part used directly)

### For JOB ONE — mapping the open decisions (target 15–40 lines)

```
When mapping open decisions, do not limit options to what the developer stated. Before answering, run this coverage pass:

1. Name the design as a set of independent dimensions (e.g. data model, control flow, failure handling, deployment, cost model). List each dimension explicitly.
2. For each dimension, list at least two options the developer has NOT mentioned. If you cannot, say so for that dimension.
3. Apply these guide words to the current plan and record any decision each one exposes: NONE (remove it), MORE / LESS (change the amount), REVERSE (invert direction/ownership), AS-WELL-AS (add a concern), PART-OF (do only a slice), OTHER-THAN (a different mechanism entirely), EARLIER / LATER (change when it happens).
4. Run a premortem: assume this plan has already shipped and failed badly. Write the three most likely causes. Each cause is an open decision — surface it.
5. Present options grouped by dimension. For each option give one line on when it wins. Mark any option you invented (not from the developer) as [new].
6. Cut ruthlessly for relevance: drop any option you cannot tie to a plausible win for THIS developer's stated goal. Never pad the list to hit a number.
```

### For JOB TWO — cracking the stuck problem (target 15–40 lines)

```
When the problem is stuck (a constraint that won't resolve, a bug that resists the obvious fix, a structure that is wrong), do NOT propose the first adequate solution. Run this before proposing anything:

1. Restate the problem three ways. One of them must remove or weaken a constraint you are currently treating as fixed. Ask explicitly: which constraint here is assumed, not real?
2. Name the contradiction: what improves if we push one way, and what gets worse? State it as "we want X without losing Y." Then try to satisfy both by separating them in time, in space, by component, or by condition.
3. Find a distant analogue. Name three unrelated fields where a structurally identical problem is already solved. For each, map the parts onto this problem. Do not skip this because nothing comes to mind on the first try — generate all three.
4. Generate THREE structurally different solution families before judging any. They must differ in mechanism, not in detail. Do not evaluate until all three exist.
5. Ban your own first instinct: whatever technique you reached for first, produce one solution that is forbidden from using it.
6. Prefer the proposal you can test fastest. For each family, state the single check that would show it wrong (a test to run, a command, a measurement). Then USE YOUR TOOLS: run the check. Report what actually happened, not what you expect.
7. Do not soften a correct challenge. If the current structure is wrong, say so and show the failing case. Do not agree with the developer to be agreeable.
```

## Explicit rejects, with reasons

- **Bare "be creative," "think outside the box," "be innovative."** No measured novel-structure gain; produces stylistic flourish and lowers quality (arXiv 2504.09389; IDEAFix). Folklore.
- **Multi-agent debate as a diversity engine.** Converges rather than diverges; conformity up to 85.5%; martingale result shows no gain over independent voting. Use parallel _independent_ sub-agents instead.
- **Self-critique without an external check.** Intrinsic self-correction does not help and can degrade reasoning (Huang et al. 2023). Only critique grounded in tools/tests/evidence counts.
- **Tree of Thoughts in the interactive loop.** Real gains but many model calls; latency the human feels. Reserve for tool-dispatched offline search.
- **Fine-grained personas.** No diversity gain beyond a coarse role (Kambhatla et al. 2025); risks stereotype amplification.
- **Complex human ideation frameworks verbatim (SCAMPER, full C-K, 40-principle TRIZ matrix).** Did not reliably raise LLM novelty (IDEAFix); too much scaffolding for the line budget. Keep only the cheap cores (contradiction, IFR).
- **Demanding many wild options.** Relevance cost outweighs benefit for a single time-boxed developer (the breadth tension).

## Evaluation methods

(Full detail in Q10.) Breadth: coverage recall + novel-but-valid count + junk rate against a user-built reference option set of 8–12 past decisions. Depth: solve rate + cycles-to-solve against 6–10 checkable stuck problems from the user's own history. Cost: one generation per case per skill-file version; runnable in an afternoon; depth is near-automatic because the domain is checkable.

## Open questions the literature does not answer

1. Whether HAZOP guide words and the morphological box actually raise option coverage when used as LLM _prompts_ — the engineering evidence is strong for humans, but direct LLM-prompting measurement is essentially absent. This is the biggest untested bet in the recommendations.
2. Whether an LLM can reliably self-generate _distant_ (cross-domain) analogues, or whether the noticing bottleneck (Gick & Holyoak) reproduces in models such that the source must always be supplied or explicitly demanded.
3. Whether forcing K distinct families in one call genuinely reduces Einstellung-type fixation in models, or only produces surface variation around the same centroid.
4. How much of the measured novelty from denial prompting survives in a _design/architecture_ domain, given it helps on soft writing tasks and hurts on hard tool-use (MacGyver).
5. Whether any prompt-only intervention can close the diversity gap the homogenization studies attribute to RLHF, or whether prompt tweaks only ever shift the margin (the college-essay study suggests the latter).
6. The interaction between reasoning-token budget and creativity: CREATE found more reasoning tokens do NOT raise creative-space coverage — why, and whether prompting can change that.

---

_Note on deliverable format: this environment cannot write files, so the report is returned as one document. To split into the requested `research-creativity/` folder, each `##` section maps to one markdown file, with this executive summary as the index._
