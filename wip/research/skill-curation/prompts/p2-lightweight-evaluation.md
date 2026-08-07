# Research prompt 2 — Cheap ways to tell whether a skill actually works

Paste everything below the line into an external LLM with web search enabled.

---

I write "agent skills" — the open SKILL.md format (a folder with `SKILL.md`: YAML frontmatter `name` + `description`, plus markdown instructions; optional bundled `scripts/`, `references/`, `assets/`). Coding agents load them progressively: name+description at startup, body on trigger.

I am a solo developer, and I pay per token. I need to know whether a skill I wrote actually improves agent behaviour — but the published methodologies are far too heavy for my situation, and I want to know what the cheap end of the spectrum looks like.

**What I already know, and do not want restated:**

- Anthropic's `skill-creator` workflow: write 2–3 realistic test prompts, spawn a with-skill subagent and a without-skill baseline subagent per prompt, capture tokens/duration, draft assertions, grade each assertion PASS/FAIL with evidence, aggregate into a benchmark with mean±stddev, review outputs in an HTML viewer, iterate.
- The description-triggering optimization loop: ~20 realistic queries labelled should-trigger / should-not-trigger, run each 3× to get a trigger rate, 60/40 train-validation split to avoid overfitting, up to 5 revision iterations, select by validation score.
- The community "TDD for skills" approach: run a pressure scenario WITHOUT the skill to observe baseline failure and record verbatim rationalizations, write the minimal skill addressing those specific failures, re-run to confirm compliance, then close loopholes; plus micro-testing individual wordings with 5+ reps against a no-guidance control.

All three cost real money and real time per iteration. **Do not summarize them back to me.**

## Questions

**A. The cheap end.** What do experienced skill authors actually do day to day, as opposed to what the official docs prescribe? Is there evidence that lighter methods — a single fresh-session smoke test, self-review by a second model, reading the transcript rather than grading outputs — catch most of the problems that the full eval harness catches? Where specifically do the light methods fail?

**B. Which failure modes need which method.** A skill can fail in distinct ways: it never triggers; it triggers when it shouldn't; it triggers but the agent ignores parts of the body; it's followed but produces the wrong shape of output; it works but wastes tokens/time. For each failure mode, what is the cheapest detection method that reliably catches it? I want a mapping, not a general endorsement of testing.

**C. Sample size and noise.** Agent behaviour is nondeterministic. Is there any published data on how many repetitions are actually needed before a difference between two skill versions is real rather than noise? At what point does a single run tell you something trustworthy, and at what point is it actively misleading?

**D. Reading transcripts.** Several sources hint that execution transcripts reveal more than final outputs — that you can see the agent ignoring an instruction, or wasting steps. Is there any concrete methodology for transcript analysis of skill usage? What do people look for, and are there tools for it?

**E. Testing skills whose output is judgment, not artifacts.** Eval methodologies assume verifiable outputs (a chart exists, JSON parses, a column was added). Many of my skills produce *judgment* — a design discussion, an explanation, a decision record, a research summary. There is nothing to assert on. How do people evaluate skills like this? Is there anything better than "read it and see if it's good"?

**F. Regression.** Once a skill works, how do people keep it working as they edit it? Is anyone running a stored eval set as a regression suite, and is that worth it for a personal library?

**G. Tooling.** List actual tools, harnesses, or scripts (with URLs) for evaluating skills — including anything outside Anthropic's ecosystem. Note for each: what it costs to run, what it requires, and whether it works for a single developer without a CI budget.

## Output format

- Answer A–G in order. If something has no published answer, say so plainly and describe what practitioners appear to do instead.
- Separate **documented** (cite URL), **observed practice** (name the source), and **inference** (label it).
- Be concrete about cost: number of model calls, rough token counts, wall-clock time.
- Close with a recommended minimum-viable protocol for a solo developer — the smallest set of checks that would catch most real problems — and state what that protocol knowingly gives up.
