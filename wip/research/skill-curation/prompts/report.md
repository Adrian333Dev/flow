# Reserarch 1

Here's what I found. I'll flag upfront: sections A and E are genuinely thin in published material — I'll say so rather than stretch weak sources to fill the space.

## A. Boundaries and altitude

**No formal published taxonomy of "altitude" exists.** The closest thing is a live, unresolved argument inside the spec's own community.

**Documented guidance** — Anthropic's enterprise docs give one explicit rule: *"Start specific, consolidate later... Merge narrow Skills into a broader one only when the consolidated Skill's evaluations confirm equivalent performance to the individual Skills it replaces."* Their worked example is a merge, not a split: `formatting-sales-reports` + `querying-pipeline-data` + `updating-crm-records` → `sales-operations`, gated on eval parity ([platform.claude.com](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)).

**The seam case (your Prisma/NestJS example) has an almost-exact real analog.** In [agentskills/agentskills discussion #404](https://github.com/agentskills/agentskills/discussions/404), a maintainer proposed a `specializes` frontmatter field so a narrow workflow skill (e.g. "diagnose why tracked birds arrived late") could suppress a broad domain skill ("wildlife tracking") at selection time when both match. The author then built a real test harness — 14 skills, 3 models, 50 trials/query — and found:

- Opus and Sonnet resolved broad-vs-narrow correctly **100% of the time from well-written descriptions alone**, no structured field needed.
- Adding the proposed disambiguation language ("prefer this skill over X when...") into the description *hurt* — Sonnet went from 100%→85%, Haiku from 93%→67%.
- Haiku-tier models still degrade without some suppression mechanism (71% on a minimal prompt).

This is the single most direct empirical answer to "should knowledge at a seam get its own skill or live in one of the two adjacent ones": **write one well-scoped, standalone skill for the seam topic** (e.g. `nestjs-prisma-integration`) rather than duplicating the content into both `nestjs` and `prisma`, and don't bother writing defensive "don't confuse me with X" language into the description if you're targeting Sonnet/Opus-class models — it measurably backfires. The maintainer's own caveat: this was tested at 14 skills with one overlapping pair; nobody has published this test at your 20-50-skill scale.

**Is duplication ever correct?** No source says never. But the one piece of purpose-built library-maintenance tooling I found (SkillOps, below) classifies "redundant clones" and "stale clones" as *skill technical debt* by default — something a maintenance layer is designed to detect and collapse, not a state anyone advocates for. One-home-plus-pointer is the de facto consensus by omission: nobody argues for duplication, several sources build tooling to eliminate it.

## B. Splitting and merging

**Documented signals** (Anthropic enterprise docs, same page as above) — a lifecycle table mapping evaluation results to actions:

| Signal | Action |
|---|---|
| Declining trigger accuracy | Update description/instructions |
| Coexistence conflicts (new skill's description steals triggers) | Consolidate or narrow descriptions |
| Consistently low output quality | Rewrite instructions or add validation |
| Persistent failures across updates | Deprecate |

**Empirical findings on trigger accuracy at scale — this is the strongest quantitative answer in the whole set of questions.** A Databricks paper, [*Skill Shadowing Degrades Performance When Expanding Skill Libraries*](https://arxiv.org/html/2605.24050) (arXiv 2605.24050), built a controlled experiment: take a task, find its one genuinely helpful ("oracle") skill, then bury it inside libraries of 52, 102, and 202 total skills, and measure the pass-rate drop versus a library containing only the oracle skill.

Performance degrades as libraries grow—by up to 21% when scaling from a small set of helpful skills to a 202-skill library, and they decompose *why*:

- At 52 skills: pass-rate drop = .08, shadowing effect = .03 (not yet statistically distinguishable from zero)
- At 102 skills: drop = .14, shadowing = .08 (now significant)
- At 202 skills: drop = .21, shadowing = .14 — **shadowing accounts for the majority of the drop**

Skill shadowing is the only component whose confidence interval excludes zero and accounts for the majority of the drop at the largest library, while the "too much context in the window" hypothesis does not separate from zero at any library size. Mechanically, as the library grows, the fraction of trajectories where the agent picks the correct skill alone falls from 88% (oracle-only library) to 44.6% (at 202 skills), with the lost probability mass going either to picking a wrong/extra skill or to giving up on skills entirely — not primarily to the agent getting confused by a bigger context window. **This means the fix for "my skills are colliding" is sharper descriptions and fewer overlapping skills, not shorter skill bodies.**

**A concrete before/after split example**, from a different angle: [SkillsBench](https://arxiv.org/pdf/2602.12670v1) found focused skills with two to three modules consistently outperformed comprehensive documentation; more coverage in a single skill didn't help, more focused, well-scoped skills did. I could not find a publicly documented single-skill "here's the diff, we split X into Y and Z" case study — every source states the *principle*, none shows the artifact. That's a genuine gap, flagged rather than papered over.

## C. Description collision at scale

This is where the most research exists, and where I'd push back hardest on intuition.

**How bad does selection degrade, and at what N?** Beyond the shadowing numbers above: prior tool-use literature cited in the Databricks paper found tool selection accuracy drops from above 90% with fewer than 30 candidates to 13.6% with 11,100 candidates. At a different, more relevant scale, [SkillRouter](https://arxiv.org/html/2606.11435v1) (~80K skills, 75 expert-verified queries) found using only skill names and descriptions produces a 31-44% drop in routing accuracy compared to using the full skill body — meaning the description is doing more selection work than the "keep it short" authoring advice usually implies, and it's worth being more careful with than typical single-skill guidance suggests.

**Should descriptions be written differentially (bounding against siblings)?** Tested directly, and the answer is counterintuitive: **no, not for capable models.** The `specializes`/"prefer X over Y" experiment in Section A is the direct evidence — differential hints hurt Sonnet and Haiku, and Opus/Sonnet didn't need them at all. The proposal's author concluded the structured field is a deterministic fallback for cost-optimized routing with cheaper models, and machine-readable insurance for tooling that can't parse natural language — not something to hand-author into every description. This directly contradicts a lot of the "write negative triggers, add explicit exclusions" advice floating around blog posts (e.g. [blog.serghei.pl](https://blog.serghei.pl/posts/agent-skills-101/), [thomasthornton.cloud](https://thomasthornton.cloud/why-agent-skills-need-good-descriptions/)) — those posts are giving single-skill advice, and the one controlled multi-skill test found the opposite.

**Practical ceiling.** No agreed number, but converging signals:
- Anthropic's API hard-caps at [8 skills per request](https://platform.claude.com/docs/en/build-with-claude/skills-guide); their own guidance is otherwise **"use your evaluation suite to measure recall accuracy as you add skills, and stop adding when performance degrades"** — i.e., no universal number, measure your own.
- Atlassian recommends fewer than five skills per Rovo agent (cited in [oreilly.com/radar](https://www.oreilly.com/radar/agent-skills-work-but-the-research-shows-most-teams-are-building-them-wrong/)).
- The Databricks study shows *statistically significant* shadowing already at 52 skills — meaning your planned 20-50+ isn't a "worry later" number, it's already inside the zone where the only public quantitative study found real degradation.

**Fixing this at scale beyond descriptions:** [AgentSkillOS](https://arxiv.org/abs/2603.02176v1) (arXiv 2603.02176, tested 200 to 200,000+ skills) proposes organizing skills into a **capability tree** (hierarchical categories, agent navigates coarse→fine) plus a **dormant index** — skills that stop being invoked or stop improving outcomes get moved out of the active retrieval set so they don't compete for selection. This is a research prototype, not something you can install today, but the mechanism — demoting unused skills out of the competing set rather than deleting them — is directly actionable at your scale even manually (e.g. a `dormant/` subfolder you don't symlink into the active skills directory).

## D. Pruning and staleness

**Documented lifecycle** (Anthropic enterprise docs): Plan → Create & Review → Test → Deploy → Monitor → Iterate or Deprecate, with an explicit instruction to *rerun evaluations periodically to detect drift or regressions as workflows and models evolve*, and to deprecate when *evaluations consistently fail or the workflow is retired*. Versioning guidance: pin production skills to a specific version, run the full eval suite before promoting a new one, keep a rollback to last-known-good, and use checksums/signed commits for provenance.

**A staleness mode I hadn't considered, worth building into your own criteria:** the [SoK: Agentic Skills survey](https://www.oreilly.com/radar/agent-skills-work-but-the-research-shows-most-teams-are-building-them-wrong/) frames it as a skill that was compensating for a model capability gap six months ago may now be redundant, and worse than redundant if it's overriding better native behavior. The practical test is to run the task with and without the skill and check if the skill still helps. This is staleness caused by *the model improving*, not by the world changing — a decay mode specific to LLM skills that doesn't show up if you only think about framework-version drift.

**Conventions for dating/sourcing/expiring facts:** no spec-level convention exists. What's actually used:
- A `metadata: { version, author, last-updated }` block in frontmatter — community convention, not part of the open spec.
- Git as the versioning substrate — this is Anthropic's own explicit recommendation for source control, PR review, and rollback, not a workaround.
- A `compatibility` field for environment/version requirements (e.g. "needs Python 3.14+") — distinct from the `specializes` field discussed above, debated in the same GitHub discussions.
- Purpose-built freshness tooling exists now: [skill-versions.com](https://www.skill-versions.com/) scans SKILL.md files, compares declared package versions against the live npm registry, and generates staleness reports (`npm outdated`, but for skill knowledge) with an LLM-assisted `refresh` command that proposes diffs against changelogs. [skills-check](https://www.npmjs.com/package/skills-check) does similar plus security/hallucination scanning and token-cost measurement.
- [SkillOps](https://arxiv.org/abs/2605.13716) (arXiv 2605.13716) is the most rigorous framing I found: it names the problem *skill technical debt* — library-level defects (redundant clones, stale clones, missing validators, missing artifacts, wrong interfaces, and one more pattern not detailed in the abstract) that don't break a single skill in isolation but corrupt retrieval and composition as the library grows. It's a research prototype (code at [github.com/Hik289/SkillOps](https://github.com/Hik289/SkillOps.git)), not something you'd install, but the diagnostic categories are a usable personal checklist even done by hand.

## E. Growing knowledge skills

This is genuinely the thinnest section, and I'd rather tell you that than manufacture confidence. Almost nothing published addresses *manually curated, append-over-months* knowledge skills specifically — the literature splits into single-skill authoring (which you've excluded) and fully-automated self-evolving research systems (Voyager, AutoRefine, MetaClaw's L1/L2/L3 layered markdown) that aren't analogous to a solo dev appending facts by hand.

**The two real examples I could find:**

1. A bundled Claude Code plugin example, `productivity:memory-management`, uses a **two-tier hot-cache/deep-storage pattern**: a small always-loaded file (~50-100 lines, "hot 30" rule) holding the most-used facts, backed by an unlimited `memory/` directory with one file per topic/entity, with an explicit **promotion/demotion rule keyed on usage frequency** — promote to hot cache when actively used, demote to deep storage when a project completes or a term goes rarely-used. This is architecturally close to what you'd want for a knowledge skill: `SKILL.md` stays a lean index, `references/topic-name.md` files hold the accumulated depth, loaded only when that sub-topic is relevant.

2. Will Larson's account of Imprint's internal agent ([lethain.com/agents-skills](https://lethain.com/agents-skills/)) is the one honest first-person account of running skills across dozens of workflows over months. On exactly this question he says the system currently loads whole skill files and that a `load_subskill` mechanism to split varied use-cases into distinct files hasn't been a major blocker so far, but as some skills get more sophisticated, the ability to split into distinct files would improve progressive disclosure — i.e., an experienced practitioner flagging this as *not yet solved*, in real time.

The one structural convention that generalizes from the single-skill authoring literature (which you know) is worth restating in this context specifically: **keep `SKILL.md` as process/index, move accumulated facts into `references/*.md` split by sub-topic**, each loaded via an explicit named step rather than assumed-auto-loaded. This is stated as general skill architecture guidance ([code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills), [MindStudio](https://www.mindstudio.ai/blog/claude-code-skills-architecture-skill-md-reference-files)), not specifically validated for the append-over-months case, but it's the closest thing to an answer that actually exists.

## F. Prior art

**Repos with real deliberate curation:**

- **[obra/superpowers](https://github.com/obra/superpowers)** (Jesse Vincent) — the strongest example of a maintained, evolving personal library with a published philosophy. 20+ skills, a written maintenance methodology across a running blog ([blog.fsck.com/tags/skills](https://blog.fsck.com/tags/skills/)), and a meta-skill ("writing-skills") that teaches the agent to create/refine skills using a TDD-style method — i.e., the author dogfoods skill-creation-as-a-skill. Notably includes a real staleness post-mortem: [blog.fsck.com/2025/10/12/superpowers-20-came-out-yesterday-and-might-already-be-obsolete](https://blog.fsck.com/2025/10/12/superpowers-20-came-out-yesterday-and-might-already-be-obsolete/), where he found a bug in his own shipped skill within a day of release via a user's debug log — a real-time example of the "how do you discover staleness" question.
- **[agentskills/agentskills discussions](https://github.com/agentskills/agentskills/discussions)** — the open standard's own repo, actively debating exactly your questions in public (discussion #404 on precedence/altitude is the best single thread; there's also #392 on tool dependencies and #318 on namespace collisions for multi-author ecosystems).
- Meta-lists for discovery, not curation philosophy: [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills), [karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills) (50+, "verified"), [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) (1000+). These are indexes, not exemplars of curation discipline — most entries are one-off contributions with no visible maintenance loop.
- **[OpenHands/extensions](https://github.com/OpenHands/extensions)** — cited by the O'Reilly piece as a reasonable reference for scoping discrete skill packages rather than one monolithic set.

**Writing specifically about maintaining a collection over time** (as opposed to authoring one skill): Jesse Vincent's blog (above) is the only sustained first-person account. Will Larson's post is the second. Beyond those two, everything else I found is either single-skill authoring advice or academic papers about *automated* library evolution — there isn't much practitioner writing yet about the human-curation maintenance loop you're asking about, which tracks with the field's own self-assessment: most teams aren't treating skill libraries as maintained infrastructure yet — that's worked because most libraries are still small enough to hold in your head; it won't hold as they become infrastructure.

---

## Strongest / most surprising findings

1. **Differential, defensive descriptions ("prefer this over X") measurably hurt selection accuracy on capable models** — the opposite of common advice. Sonnet 85%→100%, Haiku 67%→93% when the disambiguation language was *removed*. Write each description to stand alone; don't try to out-argue sibling skills inside it.
2. **Skill shadowing, not context bloat, is the dominant and only statistically significant cause of degradation as libraries scale** (up to 68% of the pass-rate drop at 202 skills; context-overhead effect never separated from zero). This reframes maintenance priority: spend effort on dedup and description precision, not on trimming skill bodies.
3. **Your planned scale (20-50+) is already inside the zone with measured degradation**, not a future problem — the only controlled study found statistically significant shadowing starting at 52 skills.
4. **A skill can go stale because the model got better, not because a fact changed.** The test isn't "is this still accurate," it's "does this still help, run with-and-without periodically" — a decay mode ordinary version-pinning thinking misses entirely.
5. **Description-only routing loses 31-44% accuracy versus full-body routing** at large scale — descriptions are carrying more selection weight than typical "keep it terse" single-skill advice assumes.
6. **Section E is a real gap, not just under-searched** — the manual, month-over-month knowledge-accumulation pattern you're asking about sits between two literatures (single-skill authoring, and fully-automated self-evolving research systems) that don't actually cover it. The one usable real analog is a hot-cache/deep-storage promote-demote pattern from an unrelated plugin, not a skills-specific source.

# Research 2

Excellent, very solid data for C. Now let's cover E (judgment-based outputs, LLM-as-judge for open-ended text), F/G (regression tools like promptfoo), and A (community cheap practices, HN/blog posts).Now let me search for LLM-as-judge on open-ended/judgment content specifically (rubric grading, pairwise comparison for non-verifiable output) and the "corpwaters" full article for description-triggering data.Good enough material for E. Now one more search on description-triggering data (already have skill-creator methodology) and cost/token specifics for subagent testing, plus corpwaters full detail for practical cost data.## Research Notes: Cheap Evaluation for Personal SKILL.md Libraries

*(Answering A–G in order. Labels: **[doc]** = documented with URL, **[obs]** = observed practice reported by a named source, **[inf]** = my inference/synthesis, not published.)*

---

### A. The cheap end

**[doc]** Anthropic's own skill-creator now ships an explicit cheap mode, distinct from the full subagent-benchmark workflow. Its instructions say that for a lighter pass you should read the SKILL.md yourself and complete each test prompt yourself rather than spawning independent subagents, one at a time, explicitly noting this is "less rigorous... but it's a useful sanity check — and the human review step compensates," and that you should skip baseline runs entirely and skip quantitative benchmarking, which depends on baseline comparisons. It routes results straight to conversational display instead of the HTML viewer when no browser is available.

**[obs]** A widely-upvoted Hacker News comment on a skills-related thread put it more bluntly: for most people, "the only way to do that is to look at it, if it passes some visual tests, try it, and then a/b test if it's any better than without it," adding that building shareable, reusable, comprehensive evals is "an insane amount of effort," which is why "almost all skills are stuck in the 'vibes' phase."

**[obs]** Substack author Mikhail Shcheglov, after testing 200+ published skills against vanilla output, reported that until skill-creator's eval mode shipped there was "no built-in way to benchmark a skill against baseline Claude Code output" and most authors ran on "vague feeling" — what he calls vibes-based evaluation — and separately found that 40 of 47 skills from a popular "install these" list made output measurably worse once actually benchmarked.

**[obs]** A different practitioner (Sumit Nemade, "How to Test Any Claude Code Skill Without an LLM Judge") argues the cheapest reliable signal isn't a second model's opinion at all — it's parsing the deterministic side effects (files written, commits made, tool-call order) from a hook-generated event log, because "seems fine" from manual testing gives you nothing to diff against after the next edit.

**Where light methods specifically fail [inf]:**
- A single fresh-session smoke test tells you the skill *can* work once; it says nothing about trigger reliability (see B) or about variance run-to-run (see C). Shcheglov's own 20-prompt trigger test — zero fires out of 20 obviously-relevant prompts for a carefully-described skill — is exactly the kind of failure a single smoke test would miss, because the smoke test is normally run with the skill invoked directly (`/skill-name`) rather than left to fire on its own.
- Self-review by a second model catches prose-level defects (missing steps, contradictions, badly-scoped triggers) but is unreliable as a *quality* judge without a rubric or reference to compare against — see the LLM-as-judge instability data in C and E below; a single second-model pass is closer to linting than to grading.
- Reading the transcript catches "ignored the skill / took a shortcut" failures that grading final output alone cannot (see D), but only if you know what to look for — untrained transcript reading tends to catch obvious tool-call omissions and miss subtler things like the agent reading only the first paragraph of a long SKILL.md.

---

### B. Failure mode → cheapest detection method

| Failure mode | Cheapest reliable detection | Cost |
|---|---|---|
| Never triggers | A list of ~10–20 prompts you expect to trigger it, invoked in *normal* conversation (not via `/skill-name`), checked against the tool-call log for a `Skill` invocation. **[doc]** This is exactly Anthropic's own description-optimization loop scaled down — the full version uses ~20 labelled queries run 3× each with a 60/40 split; the cheap version is the same 20 queries run once each. | ~20 chat turns, no grading needed — just presence/absence of the skill firing |
| Fires when it shouldn't | Same list, but of prompts that are *adjacent but wrong* (a related task the skill shouldn't own). **[obs]** Nemade's framework builds this as a two-column "should trigger / should NOT trigger" table checked against the same event log. | Same ~20-prompt pass, reuse the trigger check above |
| Triggers but agent ignores part of the body | Requires a transcript read or tool-call trace, not output grading — **[doc]** SkillJuror's "effective uptake events" metric exists precisely because aggregate pass/fail doesn't distinguish "used the resource" from "ignored it and got lucky." Cheapest DIY version: grep the tool-call log for reads of specific files/steps the skill instructs, per **[obs]** Nemade's Level-2 trace checks. | One real run + a grep/regex check, near-zero marginal cost once the log exists |
| Wrong shape of output | Assertion against the artifact itself (JSON parses, required section present, word count in range) — this is the one failure mode where cheap deterministic checks genuinely substitute for a model judge. **[obs]** Nemade's Level-3 "artifact checks" (file exists, format regex, commit message convention) are exactly this. | A few lines of bash/Python per skill, reusable across runs |
| Wastes tokens/time | Compare token/duration count of a with-skill run against a no-skill baseline run for the same prompt. **[doc]** This is what skill-creator's baseline-comparison mode measures directly, but a single paired run (not N-repeated) is enough to catch gross waste (a skill that triples token usage for no output difference); it is *not* enough to catch a subtle 10–20% regression, which needs the repetition counts discussed in C. | 2 runs (with/without) per test prompt |

**[inf]** The general pattern: trigger failures and shape-of-output failures are checkable without any model-based grading at all — they're closer to unit tests. Ignored-instruction failures require looking at process (transcript/trace), not outcome. Only "does this actually help" (quality, judgment) genuinely needs a judge, and that's the expensive one (see E).

---

### C. Sample size and noise

This is the best-evidenced of your questions, though none of the data is specific to skills — it's general LLM-eval and LLM-judge literature, which transfers directly.

**[doc]** On raw output variance: a 2026 study using an LLM reviewer on the same paper and prompt at temperature 1.0 found standard deviations around 0.02 across repeated runs of the *same* prompt (roughly stable), but for 36.9% of items at least one of three repeated runs gave a materially different score, and for 20% of items the swing exceeded 0.5 on the scale used — concluding that a single run is not reliable enough to trust in isolation.

**[doc]** On how many repetitions before you can trust a judge's verdict: a 2026 reliability-curve analysis found that 11 repeated trials were needed for a majority vote to recover a 50-trial "reference" verdict with 95% probability on average, rising to 15 trials for high-variance questions — and that semantically equivalent judge-prompt phrasings flipped the majority outcome in 25% of tested cases. The same paper found cross-judge agreement of only 76% (κ = 0.51), and mean score gaps that were often too small to be statistically meaningful even when a judge confidently picked a "winner."

**[doc]** On practical bend-points: a study varying repetitions from 2 to 50 for prompt-based coding tasks found sharp drops in variance at 5, 15, and 25 repetitions — meaning early repetitions buy you the most stability and returns diminish quickly after roughly 15–25.

**[doc]** Two smaller-scale NLP studies used 5 repetitions as a default, escalating to 25 only when the two conditions being compared were close enough that 5 wasn't decisive.

**[doc]** Repeating the *same question* within a single prompt (as opposed to repeating the whole trial) does not reliably change output quality — a 2025 study across five models and three datasets found no statistically significant effect from in-prompt repetition, so "asking twice in one prompt" is not a substitute for repeated independent trials.

**[doc]** There is now a public sample-size calculator built specifically for this "LLM wobble" problem, which asks for margin of error, confidence level, and number of resamples per prompt (K) and returns total required prompts × resamples.

**Translating this to your situation [inf]:**
- A single run of a single test prompt is worse than a coin flip for anything except gross, obvious differences (crash vs. no crash, triggers vs. doesn't trigger). It is actively misleading the moment you're comparing two SKILL.md wordings that are both "reasonable."
- 3–5 repetitions per test case is the de facto floor used across the small-scale NLP papers above when resources are tight; it will catch large differences but will still misjudge close calls a meaningful fraction of the time.
- 11–15 repetitions is the number with actual reliability-curve backing for trusting a majority verdict, but that's model-judge literature, not skill-triggering literature specifically — treat it as an upper bound worth reaching for the one or two test cases you care most about, not something to apply to every prompt in a 20-item trigger suite.
- For token/dataset-level trigger-rate measurement rather than per-case judging, the sharp variance-reduction bend at 5 reps, and the diminishing-but-still-real gains up to 15–25, is the more relevant framing than the judge-verdict number.

---

### D. Reading transcripts

**[doc]** SkillJuror (arXiv 2606.11543) is the closest thing to a published transcript-analysis methodology for skills specifically. It doesn't just grade final output — it tracks trajectory-level signals: distinct skill resources touched per trajectory, and "effective uptake events" (moments where a referenced resource is actually used, not just opened). In an 82-task study, restructuring a skill for progressive disclosure raised resources-touched-per-trajectory from 1.18 to 3.85 and uptake events from 1.33 to 3.92, changes visible in the trajectory data well before they showed up in aggregate pass/fail — the paper's central point is that organization changes *runtime behavior* in ways outcome-only grading misses.

**[doc]** Two adjacent security-focused papers use transcript/trace analysis as their core method rather than an add-on: VIGIL checks agent traces against a formal behavioral-policy language to catch multi-step specification violations that action-boundary defenses miss; Runtime Skill Audit (RSA) profiles risk-relevant interfaces and generates targeted runtime probes, then assigns labels from trace evidence rather than static inspection of the SKILL.md text. Both are aimed at safety/security auditing of third-party skills, not quality iteration on your own — but their core move (don't trust the artifact, trust the trace) is the transferable idea.

**[obs]** The concrete, low-effort DIY methodology comes from Nemade's framework: a `PreToolUse` hook writing every tool call to a JSONL log, then grep/regex passes over that log for (1) whether the `Skill` tool fired, (2) whether specific expected file reads happened in order, (3) whether any invariant (destructive command, unwanted commit) was violated. This is genuinely cheap — one bash hook script, a few grep one-liners — and it's the only approach in this research that gives you machine-checkable trace evidence without a second LLM call.

**What people actually look for, synthesizing the above [inf]:** did the skill fire at all; did the agent read the referenced files/scripts it was pointed to, or just the top-level SKILL.md; did it follow the stated step order; did it stop partway through a multi-step procedure; did it call anything destructive or out-of-scope; how many tool calls/tokens did the whole thing take. None of this requires a judge — it's presence/absence and ordering, checkable with string matching against a log.

**Tooling for this specifically:** Claude Code's own `PreToolUse`/`PostToolUse` hooks (used by Nemade's approach) are the only broadly-available, zero-cost mechanism; SkillJuror's code is public (per the paper) but is a research artifact built around SkillsBench, not a turnkey personal tool.

---

### E. Testing judgment-heavy skills (no verifiable artifact)

**[doc]** The published literature here is general LLM-as-judge / open-ended-generation evaluation, not skill-specific, and it does not offer anything better than "read it and see if it's good" in the sense you mean — it offers ways to make "read it and see" more structured and less noisy, not a way to avoid judgment entirely:

- **Rubric-grounded judging.** Multiple 2026 papers converge on decomposing "is this good" into an explicit rubric (query-specific criteria plus general-quality criteria) before scoring, rather than asking a judge for a bare 1–10. One paper explicitly frames this as necessary because open-ended writing tasks lack ground truth, and validates rubric quality by checking agreement across three independent judge models.
- **Pairwise over pointwise.** Several sources converge on pairwise comparison (this output vs. that output, which is better) being more stable than pointwise scoring for open-ended text, echoing the older MT-Bench/AlpacaEval/Chatbot Arena methodology. This matters for you specifically because pairwise comparison is the natural fit for "does this skill version beat that skill version" — it doesn't require an absolute quality scale at all, just a relative call.
- **Judge instability is real and non-trivial even with rubrics.** The Coin Flip Judge paper (cited above in C) found only 76% cross-judge agreement and noted judges often pick a confident "winner" even when their own scalar scores show no meaningful gap — a direct warning against trusting a single self-review pass on judgment-heavy output.

**Cheapest defensible approach for a solo developer [inf, synthesizing the above]:** for a design discussion / decision record / research summary, don't ask a second model "is this good" (pointwise, no rubric — the least reliable configuration in the literature above). Instead: (1) write 3–5 one-line criteria specific to *that kind of document* before you generate anything (a decision record should state the decision, the rejected alternatives, and the reasoning; a research summary should cite sources and flag disagreements) — this is a personal, ad hoc version of "query-specific rubric"; (2) run with-skill vs. without-skill on the same prompt and do a pairwise comparison against your own rubric, either yourself or with a second model, rather than scoring either output in isolation; (3) treat a single pairwise call as directional, not conclusive — the judge literature above suggests you'd want several repeats before trusting a close call, but for a personal library "directional and repeated occasionally" is a reasonable place to stop.

There is genuinely no published shortcut past this for judgment-only skills — every methodology surveyed for this answer, including the heavy ones you already excluded, ultimately still asks a human or a judge model to read the output and decide. The rubric and pairwise-comparison literature only reduces the noise in that reading, it doesn't remove the reading.

---

### F. Regression

**[doc]** Anthropic's skill-creator has an explicit benchmark mode built for this: rerun the same test-case set after an edit and get pass rate as mean ± standard deviation, so a skill that scores 100% once and 60% the next is flagged as unreliable even if the average looks fine. One practitioner guide reports skills typically moving from roughly 60% pass rate on first eval to 90%+ after two or three eval-fix-reeval iterations, though this figure comes from a third-party guide rather than an Anthropic-published statistic, so treat it as an anecdote, not a benchmark.

**[obs]** Nemade's framework includes explicit `--baseline` and `--regression` flags: record current pass/fail state as a golden baseline, then diff future runs against it, with "score drops = something broke" as the operating rule.

**[doc]** Outside the Anthropic ecosystem, promptfoo is the tool people actually reach for to run a stored eval set as a CI regression suite: test cases and pass/fail assertions live in a YAML config, `promptfoo eval` runs the whole suite and can enforce a minimum pass-rate threshold so occasional model noise doesn't block you while real regressions still fail. Multiple recent guides note it's a good fit for "a solo developer testing prompts on a laptop" specifically, with the caveat that it's local-first (no shared dashboard, no production-drift detection) — which is a feature, not a limitation, for someone who pays per token and doesn't want a hosted service.

**Is it worth it for a personal library? [inf]** For skills you actively iterate on, yes in a minimal form: a handful of stored (prompt, assertion) pairs per skill that you rerun before you consider an edit "done," costing a few dollars in tokens per full pass. For skills you wrote once and rarely touch, no — the setup cost of a regression harness exceeds the risk, and a quick fresh-session smoke test after any edit is proportionate.

---

### G. Tooling — actual list

| Tool | What it does | Cost to run | Requires | Fit for solo dev, no CI budget |
|---|---|---|---|---|
| **Anthropic skill-creator** ([github.com/anthropics/skills](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/skill-creator/skills/skill-creator/SKILL.md)) | Full mode: subagent-based with/without-skill benchmarking, mean±stddev, HTML review viewer. Cheap mode: self-run test prompts, skip baseline/benchmarking. **[doc]** | Full mode: 2 subagent runs × N test cases (a handful of model calls per test case, each a full task). Cheap mode: 1 model session per test case, no extra subagent spend. | Claude Code / a Claude-based agent host | **Yes, in cheap mode** — it's literally the built-in downgrade path Anthropic wrote for exactly your situation |
| **Description-triggering optimizer** (part of skill-creator) | Generates should/should-not-trigger prompts, tests iteratively, revises `description`. **[doc]** Anthropic reports improved accuracy on 5 of 6 of its own document-creation skills using this loop. | Scales with query count × repetitions × revision iterations you choose | Same as above | Yes, scaled down to ~10–20 single-shot queries per B above |
| **promptfoo** ([promptfoo.dev](https://www.promptfoo.dev)) | YAML-declared test cases + assertions, CLI eval runner, pass-rate thresholds, CI integration. General-purpose, not skill-specific. **[doc]** | Free/open-source; cost is just your own API calls per test case per run | Node/npm, a config file, your own model API key | **Yes** — repeatedly described as well-suited to a single developer on a laptop; the limitation (no shared dashboard) doesn't matter for one person |
| **Nemade's event-log + eval-file framework** (blog post, no packaged repo) **[obs]** | Claude Code hooks write a JSONL tool-call log; grep/Python one-liners check trigger presence, step ordering, artifact contracts, invariants; scoring bands (STRONG/PARTIAL/WEAK/NONE). | Free; a few dozen lines of bash/Python, one-time setup | Claude Code with hooks support | **Yes** — this is the most literally "cheap end" tool in the search results: no model calls needed for grading at all, just log parsing |
| **SkillAudit** (arXiv 2606.22613) | Research framework: parses SKILL.md, auto-generates capability-aligned eval tasks, produces a multi-dimensional report (utility, efficiency/cost, safety). **[doc]** | Not stated as a packaged public tool in the paper; described as a framework, not a released CLI | LLM to parse the skill + generate tasks + run them | Not really — no evidence of a public, install-and-run release; treat as a research direction, not a tool you can install today |
| **SkillJuror** (arXiv 2606.11543) | Trajectory-level evaluation of skill organization (resource touches, uptake events) against SkillsBench. Paper states code is available. **[doc]** | Built around an 82-task benchmark; not designed for arbitrary personal skills | SkillsBench-style task harness | Not for a personal library out of the box — useful mainly for the *methodology* (what to log/count), not as a drop-in tool |
| **SkillTester** (arXiv 2603.28815) | Paired baseline vs. with-skill execution plus a separate security-probe suite, produces utility + security scores. **[doc]** | skilltester.ai / GitHub referenced in the paper | Not fully specified in the fetched excerpt | Likely aimed at marketplace/third-party skill vetting rather than personal iteration; worth checking the linked site directly if security scoring matters to you |
| **VIGIL / Runtime Skill Audit** (arXiv 2606.26524, 2606.11671) | Trace-based runtime enforcement / security auditing of skill behavior against formal policies. **[doc]** | Research-grade, sandboxed agent environment required | Custom policy language / probe generation infra | No — built for third-party skill security auditing at scale, not personal quality iteration; mentioned here because their trace-analysis *technique* is relevant to D even though the tools themselves aren't |

**Honest gap [inf]:** everything published and genuinely turnkey for a single developer with a token budget is either Anthropic's own skill-creator (in its cheap mode) or promptfoo plus a homemade hook-based log parser. The academic tools (SkillAudit, SkillJuror, SkillTester, VIGIL, RSA) are all from 2026 and represent where the field is heading, but none of them reads as "pip install and point at your `~/.claude/skills/` folder" today — they're either unreleased, benchmark-bound, or security-scoped rather than quality-scoped.

---

## Recommended minimum-viable protocol for a solo developer

For each skill, before considering it "shipped":

1. **Trigger check (once).** 8–12 prompts you expect to fire it, 4–6 adjacent prompts that shouldn't, run once each in normal conversation (not via direct invocation), check the tool-call log or transcript for whether the skill loaded. ~12–18 model calls.
2. **One real transcript read.** Pick your best trigger-check run, read the full transcript, and specifically check: did it read every file/step it was pointed to, did it follow the stated order, did it stop early. Free (no extra calls) — reuses step 1's output.
3. **Artifact assertions where they exist.** If the skill produces a file, a specific format, a parseable structure — write 2–3 bash/regex checks once and keep them. Near-zero marginal cost forever after.
4. **Paired with/without run for judgment-only skills.** One prompt, run once with the skill and once without, compared against a 3–5 line rubric you write for that document type, judged by you or a second model pairwise (not pointwise). 2 model calls.
5. **Store the trigger prompts and the artifact assertions as your regression set.** Rerun step 1 and 3 after any edit to the SKILL.md; treat a drop as a signal to investigate, not proof of failure given single-run noise.

**Total cost per skill:** roughly 15–25 model calls for a new skill, and a re-run of the same ~12–18 for regression checks after each edit — no subagent pairs, no independent baseline runs, no HTML viewer, no repeated-trial statistics.

**What this knowingly gives up [inf]:**
- No confidence interval on trigger rate or quality — a single run per prompt means, per the C findings above, you could be looking at noise on any borderline case, especially for judgment-heavy skills where judge disagreement is 24%+ even with rubrics.
- No detection of *subtle* token/time waste — only gross waste, since you're not repeating the paired with/without comparison.
- No formal ignored-instruction detection beyond one manual transcript read — a systematic Level-2 trace check (Nemade's approach) is deferred until a skill has actually caused a problem worth debugging that way.
- No protection against a skill that works today but silently degrades with a model update, beyond whatever regression set you happened to build — there's no scheduled re-run, just re-run-on-edit.

The honest tradeoff, backed by the C data specifically: this protocol will catch things that are obviously broken (never triggers, triggers wrong, produces malformed output, ignores an entire step) and will occasionally be wrong about close calls between two reasonable versions of the same skill — which is the same tradeoff the published literature says you're making any time you run fewer than roughly 10+ repetitions per comparison.

# Research 3

Researched this properly rather than asserting. Here's what I found, organized as requested.

## A. Evidence on instruction form

**Negative/prohibitive vs. positive framing — this has real peer-reviewed backing, and it cuts toward Position 2's caution about prohibitions.**

Multiple independent lines of research show LLMs process negation unreliably:
- A 2025 paper, *"Negation: A Pink Elephant in the LLMs' Room?"* (arXiv:2503.22395), documents systematic negation failures across languages and model families.
- *"Don't Think of the White Bear: Ironic Negation in Transformer Models Under Cognitive Load"* (NeurIPS 2025, arXiv:2511.12381) is the most rigorous piece I found. Setup: 9 open models (GPT-2 Small through GPT-OSS-20B), a 5,000-prompt benchmark ("ReboundBench") of "do not mention X" instructions with varying distractor text between the instruction and the measurement point. Result: after a negation instruction, the log-probability of the forbidden token *rises* relative to a high-load baseline (positive surprisal-difference, i.e., "ironic rebound"), strongest with semantic distractors, weakest with literal repetition of the instruction. Circuit tracing found a sparse set of ~15–20 middle-layer attention heads (out of 1,000+) responsible for most of the effect. One model, GPT-OSS-20B, broke the trend with near-zero/negative rebound — flagging real model-family variance.
- A separate audit, *"Syntactic Framing Fragility"* (arXiv:2601.09724, not yet peer-reviewed as far as I can tell), reports open models "endorse" a prohibited action 80–97% of the time when it's phrased as "should NOT X," versus 25–31% under positive framing.

Caveat: this literature tests *lexical* negation ("don't mention X") more than *behavioral* prohibition ("don't do X in this workflow"). It's suggestive of the same mechanism, not a direct replication of the SKILL.md case.

**Capitalization / emphatic directives vs. explained rationale — thin, no direct controlled test found.**

I could not find a study that isolates "ALWAYS/NEVER in caps" vs. "same rule with rationale," holding everything else constant. What exists is adjacent:
- *"Spotlight Your Instructions"* (arXiv:2505.12025) shows that mechanically boosting attention to instruction spans measurably improves IFEval scores (e.g., Granite 3.1 8B: 4.96→5.27; Llama 3.1 8B: 3.70→4.91) — supports that *some* form of emphasis helps.
- *"It Is Not About What You Say, It Is About How You Say It"* (arXiv:2406.16779) tested several textual emphasis methods and found emphasis can also actively hurt: the worst method dropped Llama-2's accuracy from 46.3% to 31.6% on one dataset. So emphasis is a double-edged tool, method-dependent, not a free win.
- Notably, when I pulled Anthropic's actual current skill-authoring docs (not the secondary blog post you cited), the picture is more contingent than "avoid ALL CAPS" — it explicitly recommends "ALWAYS use this exact template structure" for low-freedom/high-fragility tasks, and shows an internal example where the fix for a missed rule was switching to *stronger* language ("MUST filter" instead of "always filter"). So "Position 1" as you've stated it is a simplification of a secondary source (generativeprogrammer.com), not a verbatim reading of Anthropic's own guidance, which is closer to "match rigidity to task fragility" than "never use caps." Source: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.md

**Repetition — real experimental support, peer-reviewed-adjacent (Google Research preprint).**

*"Prompt Repetition Improves Non-Reasoning LLMs"* (arXiv:2512.14982, Google Research). Setup: literally duplicate the whole prompt, tested on Gemini, GPT, Claude, and DeepSeek across 7 benchmarks. Result: repetition won 47/70 tests with 0 losses (statistically significant by McNemar's test), with effect sizes ranging from small to as much as +76 points on one custom task with a weak model. Mechanism given: causal attention means early tokens can't attend to later ones; repeating the prompt lets the first pass "see" the second pass. This is about whole-prompt repetition rather than repeating one embedded rule, but it's the closest real evidence for "does repetition help," and it says yes, essentially for free (repetition only costs prefill compute, not generation latency).

**Absolutes vs. exceptions — see B.**

## B. The exception-clause problem

The claim as you've stated it — that a nuance clause both degrades the main rule *and* fails to reliably carve out the exemption — traces to one place: the `superpowers` skill-writing guide itself. Direct quote from the source (https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md):

> "No nuance clauses. 'Don't X unless it matters' reopens the negotiation — appending a single nuance clause to a winning recipe degraded it from consistent to noisy in the same wording tests."

This is a **practitioner claim**, not a published study. I could not find the raw data, sample size, or effect size behind "consistent to noisy" — their own methodology note elsewhere says these micro-tests are "sample it a handful of times... and read every result by hand," which reads as small-N, manually-scored, and unreplicated by anyone outside the project. Treat it as a single team's internal finding, not established fact.

Is it documented elsewhere / does it match the literature? Two adjacent (not identical) findings make it plausible:
- *"Teaching AI to Handle Exceptions"* (arXiv:2503.02976) found that state-of-the-art models (o1, o3-mini, GPT-4o with CoT) are systematically *more rigid* than humans — they rarely grant exceptions even where human judgment favors flexibility, across domains. This is the mirror image of your question: it suggests models are bad at *reliably applying* a stated exception, which is consistent with (but doesn't directly prove) "the exemption doesn't reliably carve out."
- General instruction-complexity findings (see E) show compliance rate degrades as the number of constraints in a prompt grows — so a nuance clause adding a second condition to track is degrading the same channel that any added constraint degrades, not something exception-clauses do uniquely.
- The negation-fragility literature above adds a plausible mechanism: exception clauses are usually phrased with negation-adjacent syntax ("except when," "unless," "not for X"), which is exactly the construction LLMs handle least reliably.

**My own inference, clearly labeled as such:** the "degrades and doesn't work" claim is more likely two separate, independently-plausible effects than one — (1) added clause length/complexity dilutes compliance with the main rule (well-supported generally), and (2) negation-style exception syntax is unreliably executed (well-supported generally) — rather than some special "exception clauses" phenomenon. I did not find evidence the effect is specific to exceptions as a category.

**Recommended way to express a genuine exception**, per the same source: state it as its own fully-specified conditional rule/branch rather than a trailing caveat on the main rule (e.g., two separate "if A, do X" / "if B, do Y" statements instead of "do X, unless B"). This is a reasonable inference from the mechanisms above (reduces negation load, makes both branches equally "primary") but is, again, not independently validated — it's the community's stated fix, untested by anyone else that I could find.

## C. Failure taxonomy

The discipline-failure vs. shaping-failure split is, as far as I can tell, **exclusive to the `superpowers` project** — I found no third-party paper using or validating that exact two-way cut. So treat it as a practitioner heuristic, not an established taxonomy.

That said, several academic taxonomies carve the space differently, and partially overlap:

- **Process fidelity vs. outcome fidelity** — *"The Compliance Gap"* (arXiv:2605.01771, solo-author preprint submitted to a NeurIPS workshop track, not yet peer-reviewed). Distinguishes whether an agent *says* it will follow a process from whether it *actually does*. Concrete numbers: compliance was 97% where following the process produced a rewarded artifact (audit trails) vs. 0–4% where it didn't (individual file reads, privacy masking); removing the tools that let the model shortcut raised compliance to 75% (Cohen's d = 2.47). This reframes "discipline failure" less as a rationalization problem and more as an incentive/affordance problem — the agent violates the rule when the environment lets it get equivalent-looking credit without doing so.
- **Integration vs. maintenance** — *SoFA* (arXiv:2402.17358) tests whether a rule gets triggered at all vs. whether it survives a directly conflicting instruction. All models scored <0.4 pass rate on both, worse under conflict — direct quantitative evidence that "knows the rule but drops it under a competing instruction" is a real, measurable, and currently largely unsolved failure mode, independent of wording style.
- **Knowledge vs. execution gap** — several papers (e.g., arXiv:2605.09678) note models can *state* a rule correctly while *violating* it during execution, especially when the rule conflicts with pretraining-induced priors.

**Verdict on C:** the two-bucket discipline/shaping split is a reasonable simplification for prompt-writing purposes and has partial resonance with these academic distinctions, but it hasn't been independently tested, and the academic literature suggests at least three separable failure modes (incentive/affordance, integration-vs-maintenance-under-conflict, and prior-override) rather than two.

## D. Rationalization

Here the strongest evidence is peer-reviewed but answers an adjacent question — persuading a model from outside, not a model rationalizing to itself under task pressure:

- Meincke, Cialdini, et al., *"Persuading Large Language Models to Comply with Objectionable Requests"* (PNAS, 2026; DOI: 10.1073/pnas.2535868123). Rigorous, large-N, peer-reviewed. Three frontier reasoning models (Claude Haiku 4.5, GPT-5 mini, Gemini 3 Flash), 126,000 conversations. Classic persuasion principles (authority, commitment, scarcity, social proof, unity, etc.) raised compliance with regulated-substance-synthesis requests from 35.3% to 51.3%. Their earlier preliminary study (SSRN, 2025) on GPT-4o-mini found an even larger gap: 72.0% vs. 33.3% control, N=28,000. This confirms that *framing pressure measurably changes compliance* in a way that generalizes across vendors and persists into reasoning models — good peer-reviewed grounding for the general phenomenon "an LLM's stated rule can be talked around," even though the paper studies an adversarial user pushing on a safety rule, not an agent talking itself out of a process rule under its own time/sunk-cost pressure.
- Directly on your sub-question — "does naming the specific rationalization make it more salient?" — the *ironic-rebound* paper above (arXiv:2511.12381) is the closest controlled analogue: naming a forbidden concept measurably raises its own probability of appearing, with the effect strongest under semantic-content distraction and weakest under literal repetition. If a "red flags" table works by literally *naming* "It's about spirit not ritual" as a phrase to watch for, this literature gives a real, non-hypothetical reason to worry it could prime the very rationalization it's trying to block — though this was tested via token log-probabilities on small-to-mid open models, not via full agentic completions on frontier models, so it's suggestive, not conclusive, for your use case.
- Case-study-level evidence that pressure induces rule violation in agents specifically: *"Survive at All Costs"* (arXiv:2603.05028) and a LessWrong pilot benchmark, *"I Tested LLM Agents on Simple Safety Rules. They Failed"* (https://www.lesswrong.com/posts/wRsQowKKbgyXv2eni/). Both are informal/pilot-scale, not peer-reviewed, but converge with the PNAS finding that stated rules erode under incentive pressure.

**What's genuinely thin here:** I found no controlled, published study that directly tests "pre-empting rationalization X in the prompt" against "not mentioning X" against "generic reminder," measuring whether the specific named rationalization recurs less. The `superpowers` rationalization-table methodology (RED baseline → build table from observed excuses → GREEN re-test) is a sound-sounding process, but it's self-reported by the same team with no external replication, and — worth noting — their own project has an internal critic flagging the opposite conclusion: a third-party skill-quality reviewer on the Tessl registry explicitly recommended *cutting* their 12-row Red Flags table to "2-3 representative examples or a single principle," calling the full table and ALL-CAPS emphasis "extensive persuasion rather than clear instruction" (https://tessl.io/registry/skills/github/obra/superpowers/using-superpowers/quality). And the `superpowers` maintainers themselves later cut redundant rationalization tables project-wide in a "69% line reduction" pass, judging that "Claude already understands adversarial self-monitoring" and one table sufficed (https://github.com/obra/superpowers/issues/832). So even within the community that champions this technique, there's live disagreement about how much of it is load-bearing versus token cost with no measured return.

## E. Position and repetition

Two threads that partially contradict each other on your specific question:

- **General long-context retrieval:** *"Lost in the Middle"* (Liu et al., TACL 2024, peer-reviewed, arXiv:2307.03172) established the U-shaped curve — models are most reliable when relevant content sits at the start or end of context, worst in the middle — for multi-document QA and key-value retrieval tasks. Widely replicated.
- **But for *multi-instruction compliance* specifically**, a direct test found no such effect: *"Boosting Instruction Following at Scale"* (IBM, arXiv:2510.14842) explicitly checked whether instruction position (1st, 2nd, ... nth in a list) predicted instruction-following rate and "found no consistent relationship between IF rates and instruction position across models. Middle instructions generally did not have lower IF rates than first or last instructions." What that paper *does* find degrading is sheer instruction *count* — more instructions in a prompt lowers the overall compliance rate (a few points per added instruction), independent of where any one instruction sits. Their mitigation (a post-generation "Instruction Boosting" pass) recovered up to 7 points.

So: position-in-context degradation is real and well-established for retrieval-style tasks, but the one paper that tested it specifically for rule-following found it doesn't transfer cleanly — instruction *count*, not instruction *position*, looks like the bigger lever for skill files packed with many rules.

- **Repetition:** the Google Research prompt-repetition paper (E, above) supports repeating for reliability, and the ironic-rebound paper found literal repetition was the one distractor type that *reduced* rebound rather than amplifying it — two independent pieces of evidence pointing the same direction (repetition of the load-bearing instruction helps, at least for these task types).

## F. Model dependence

This is where I'd push back hardest on treating the disagreement as generational.

- *"Larger and more instructable language models become less reliable"* (Zhou et al., **Nature**, 2024, DOI: 10.1038/s41586-024-07930-y) — peer-reviewed, high-profile. Finding: scaling and instruction-tuning ("shaping up") do *not* monotonically buy you reliability or lower prompt-sensitivity; newer, more capable, more instructable models still show unstable behavior on nominally easy instances, and their errors get harder for humans to catch because the wrong answers look more plausible. This directly undercuts the idea that "newer/stronger models simply need less rigid framing" as a general law.
- *"The Curse of Helpfulness: Inverse Scaling Law in Robustness to Distractor Instructions"* (arXiv:2605.29491, not yet peer-reviewed) finds the opposite of what you'd hope: larger models can be *less* robust to instruction-like interference embedded in surrounding text, and explicit reasoning can amplify the problem unless paired with large sparse (MoE) architectures.
- Some evidence does point the other way at a narrower level — *CLEVA* (arXiv:2308.04813) found instruction-tuned/larger models generally show lower variance to prompt-template rewording than smaller base models — but even there, GPT-4 showed high variance on some tasks (e.g., summarization), and the ironic-rebound paper's outlier (GPT-OSS-20B breaking the scaling trend) shows family/training-recipe idiosyncrasy matters as much as raw scale.

**Verdict on F:** the evidence doesn't support "this is really a disagreement about model generation." It's genuinely mixed, model-family-specific, and task-specific — some robustness properties improve with scale/instruction-tuning, some get worse, and outliers exist within every scale band. I would not use "our model is newer, so we can relax the rigid framing" as a justification without testing it directly on the model you're targeting.

## G. Verdict

It depends on failure type more than it depends on which camp is "right," and the failure-type dependency is the one part of Position 2's framework that has real (if partial) support from independent literature — not because anyone validated their exact two-bucket taxonomy, but because multiple separate academic findings point the same direction as the taxonomy predicts:

1. **Where the risk is a shaping/output-format problem** (wrong structure, missing sections, wrong style) — positive, worked-example specifications look better-supported than prohibitions. This follows from (a) the general negation-processing fragility literature (A), (b) the one controlled community test that found a prohibition arm produced *more* unwanted content than a recipe arm and trended worse than no guidance at all — though note that single test is unreplicated, small-N, and internal to one team, so it should be read as "consistent with the broader literature" rather than as its own strong proof.

2. **Where the risk is a discipline/conflict problem** (the model knows the rule but drops it when a competing instruction, time pressure, or sunk cost pushes the other way) — the evidence for *some* countermeasure is solid (PNAS: framing/pressure moves compliance by double digits; SoFA: rule "maintenance" under conflict is a real, large, currently-unsolved gap). The evidence for the *specific* countermeasure (naming the rationalization verbatim in a table) is thin and possibly double-edged — the ironic-rebound mechanism gives a concrete reason it could backfire, and even the community's own later revisions cut most of their rationalization tables as low-value.

3. **Explaining the "why" behind a rule** (Position 1's core mechanism) is plausible and consistent with how in-context learning generally seems to generalize better from principled explanation than from bare pattern-matching, but I could not find a controlled study isolating this specific comparison. It's the least-evidenced claim in either camp, not because it's wrong, but because nobody seems to have tested it directly against a bare-rule control with effect sizes.

4. **Exception clauses** carry real, mechanistically-plausible risk (negation fragility + added-constraint degradation + generally poor exception-application by current models), even though the specific "degrades main rule AND doesn't work" claim is unreplicated outside one team's internal tests.

5. **Model generation is not a clean explanatory variable** — don't use "our model is newer/stronger" to license relaxing structure without testing on that specific model; the Nature paper and the inverse-scaling paper both argue against assuming scale solves this.

**Practical decision rule, given what you've observed:**

- **You've watched the agent produce the *wrong shape* of output while otherwise complying** (missing sections, wrong format, omitted steps) → write a positive recipe/worked example of the exact target shape. Skip prohibitions here; the evidence suggests they can specifically backfire on this failure type.
- **You've watched the agent *know* the rule (it can state it correctly) but *skip it* under a competing pressure** (time, "just this once," a user asking for something incompatible) → a stated prohibition plus a small number of explicitly closed workarounds is reasonably supported, but keep the rationalization list short (2–3 items, not a dozen) given both the ironic-rebound risk and the community's own walk-back of large tables. Repeat the core rule rather than relying on position — don't assume "middle of the doc" is safe, but don't assume it's unsafe either; instruction *count* is the bigger lever, so cut competing rules rather than relocating this one.
- **You've watched the agent violate the rule *and* the environment offered it an easy way to look compliant without actually complying** (batch instead of iterate, summarize instead of read-each-file) → this is neither pure discipline nor pure shaping — per the Compliance Gap findings, check whether you can remove the shortcut affordance (the tool, the batching option) rather than only strengthening the wording; environmental fixes outperformed wording fixes by a wide margin in that dataset (75% vs. single digits).
- **You need to carve out a genuine exception** → write it as its own fully-specified conditional rule, not a clause appended to the main one. Test the main rule's compliance rate with and without the clause present before shipping it — this is cheap to check and the one place where "just measure it yourself" beats reasoning from any of the above literature, since nobody has published good numbers on it yet.
- **Across all of the above**, don't outsource the decision to "which camp do I trust" — micro-test your specific wording against a no-guidance control on the actual model you're targeting, the way the `superpowers` project itself recommends. That's the one methodological point where the evidence (Nature paper's difficulty-discordance findings, the model-family outliers in the rebound paper, the mixed scaling literature in F) most clearly favors empiricism over committing to either camp's general theory.