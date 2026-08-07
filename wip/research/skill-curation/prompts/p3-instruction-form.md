# Research prompt 3 — What form of instruction actually changes agent behaviour

Paste everything below the line into an external LLM with web search enabled.

---

I write instruction documents for coding agents — "agent skills" in the open SKILL.md format, plus project instruction files (CLAUDE.md / AGENTS.md). My question is not *what* to say but *how to phrase it* so the model actually complies.

There is a live, unresolved disagreement in this space, and I want it researched rather than asserted.

**Position 1 — Anthropic's published skill-authoring guidance.** Explain the *why* behind every instruction; models are smart and have good theory of mind. Writing `ALWAYS` or `NEVER` in capitals, or imposing rigid structures, is described as a yellow flag — reframe and explain the reasoning instead, because that is "more humane, powerful, and effective." Keep skills lean; remove instructions that aren't pulling their weight; if pass rates plateau while rules accumulate, the skill may be over-constrained.

**Position 2 — the "superpowers" community skill suite.** Skills that enforce discipline need to *resist rationalization*, because agents under pressure find loopholes. Their toolkit: state the prohibition, then explicitly forbid the specific workarounds ("don't keep it as reference, don't adapt it, don't look at it, delete means delete"); add a foundational line like "violating the letter of the rules is violating the spirit of the rules"; build a rationalization table of every excuse observed in baseline testing paired with a rebuttal; publish a red-flags list of thoughts that mean STOP. Their contributor guidelines state explicitly that their philosophy differs from Anthropic's published guidance, that their content is tuned against real agent behaviour, and that they will reject "compliance" rewrites without eval evidence.

Notably, the same community source also reports a head-to-head wording test where a **prohibition** ("don't do X") produced *more* of the unwanted content than a **positive recipe** ("the output consists of these parts, in this order") — and trended worse than a no-guidance control. Their conclusion is that the right form depends on the failure type: prohibitions and rationalization tables for *discipline* failures (the agent knows the rule and skips it under pressure), positive recipes for *shaping* failures (the agent complies but produces the wrong shape).

## Questions

**A. Evidence.** What published evidence exists — papers, evals, benchmarks, rigorous blog posts — on how instruction *form* affects LLM compliance? I am specifically interested in: negative/prohibitive framing vs. positive/recipe framing; emphatic capitalized directives vs. explained rationale; repetition of a rule vs. stating it once; rules stated as absolutes vs. rules with stated exceptions.

**B. The exception-clause problem.** There is a claim that adding a nuance or exemption clause ("this doesn't apply to code blocks") both degrades the main rule *and* fails to actually carve out the exemption. Is this documented anywhere? Does it match findings in the prompt-engineering or instruction-following literature? What is the recommended way to express a genuine exception?

**C. Failure taxonomy.** Is the discipline-failure vs. shaping-failure distinction supported by anything beyond that one community source? Is there a better taxonomy of *why* models fail to follow instructions, with different remedies per class?

**D. Rationalization.** Are there published findings on models generating justifications for skipping a rule under conflicting incentives (time pressure, sunk cost, a competing instruction)? Does pre-empting the specific rationalization in the prompt measurably help, or does naming a loophole make it more salient?

**E. Position and repetition.** Does where an instruction sits in a long document affect compliance (beginning, end, near the relevant content)? Is there current evidence about instructions in long contexts being lost or degraded, and does that argue for repeating critical rules?

**F. Model dependence.** How much of this is model-specific? Does guidance tuned on one model family transfer? Is there evidence that newer/stronger models need *less* rigid framing than older ones — which would make the two positions above a disagreement about model generation rather than about method?

**G. Verdict.** Given the evidence you find, which position holds up, and under what conditions? If the honest answer is "it depends on failure type and model," say precisely what it depends on.

## Output format

- Answer A–G in order.
- Cite sources with URLs. Clearly separate **peer-reviewed / rigorously evaluated** findings from **practitioner claims** from **your own inference** — this distinction matters more here than anywhere else, because both positions above are stated with total confidence and at least one must be partly wrong.
- Where you find an actual experiment, report the setup and the effect size, not just the conclusion.
- Flag explicitly anything where the evidence is thin and the confident claims are unsupported.
- End with a practical decision rule I can apply while writing: given a specific failure I have observed, which form should I reach for?
