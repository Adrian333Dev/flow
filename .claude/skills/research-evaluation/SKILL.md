---
name: research-evaluation
description: Evaluate external LLM research responses after reading them back. Produces structured log entries and updates running model profiles so performance patterns accumulate over time.
---

# Research Evaluation

After reading back external research reports, evaluate each LLM response. Log the results and update aggregate model profiles. Over many sessions, this builds a reliable performance dataset so you know which model to reach for in which situation.

**When to invoke:** After synthesizing research reports — right after you've read the responses and have enough context to judge their quality. Don't defer to the end of the session.

---

## What gets evaluated

Each research session produces one or more LLM responses. Evaluate every response individually, then compare if multiple.

**Baseline criteria** (always scored 1–5):

| Criterion | What it measures |
|---|---|
| **Accuracy** | Were the facts correct? Did anything turn out to be wrong? |
| **Critical coverage** | Did it surface the non-obvious gotchas — the things that would cause real bugs or wasted effort if missed? |
| **Completeness** | Did it address everything the prompt asked for? |
| **Depth** | Did it go beyond surface descriptions to implementation-relevant, actionable detail? |
| **Hallucination risk** | Rate: low / medium / high — confident claims that appear wrong or unverifiable |

**Autonomy flag** (always note when relevant): If the user had to give the model a hint to reach a key finding — pointing it at a specific resource, correcting a wrong direction, or telling it what to look for — note this explicitly in the verdict and lower the Critical coverage score accordingly. A model that finds critical information only after prompting is less reliable than one that finds it independently. This distinction matters more than the final accuracy of the information found.

**Domain-specific criteria** (add as many as relevant): After applying the baseline, ask: *what else matters specifically for this type of research?* Add criteria for dimensions that are important in this domain but not captured by the baseline. Examples by domain:

- *API pricing research:* source recency, cost modeling quality, free tier accuracy
- *Browser extension architecture:* production gotcha detection, implementation specificity, security constraints coverage
- *Library/framework comparison:* maintenance status accuracy, migration complexity, version-specific accuracy
- *Cloud infrastructure:* regional availability accuracy, quota/limit coverage, pricing model nuance

Name each added criterion briefly. Score 1–5. Add a short note explaining the score.

---

## Log format

Append to `new-workflow/research-log/evaluations.md`. One entry per research session (not per response — one session may contain multiple prompts and multiple model responses).

```markdown
---
## [YYYY-MM-DD] [Short title]

**Domain tags:** [e.g., browser-extensions, tts, api-pricing]
**Summary:** [2–3 sentences: what was researched, what the key finding was, how it affected the design decision]
**Prompts:** [inline if short, or file path if in a report file]

### [Model Name] — [Prompt or topic label]

**Baseline:**
- Accuracy: N/5
- Critical coverage: N/5
- Completeness: N/5
- Depth: N/5
- Hallucination risk: low/medium/high

**Domain-specific:**
- [Criterion name]: N/5 — [one-line note]
- [Criterion name]: N/5 — [one-line note]

**Verdict:** [2–3 sentences: what it got right, what it missed, whether it would have been dangerous to act on]

---
```

---

## Model profiles

After appending the log entry, update `new-workflow/research-log/model-profiles.md`:

1. Find or create the model's section
2. Increment session count
3. Recalculate running averages for each criterion (keep raw numbers in a comment block)
4. Update the domain table — add new domains if encountered, update existing averages
5. Update "Strengths" and "Weaknesses" if the new data reveals a pattern

Profile format:

```markdown
## [Model Name / Version]

Sessions evaluated: N
Last evaluated: YYYY-MM-DD

**Baseline averages:**
- Accuracy: X.X
- Critical coverage: X.X
- Completeness: X.X
- Depth: X.X
- Hallucination: mostly low/medium/high

**Strengths:** [domains or task types where this model consistently performs well]
**Weaknesses:** [domains or task types where it underperforms]
**Pattern notes:** [recurring behaviors — over-confidence, surface-level answers, citation quality, etc.]

| Domain | Accuracy | Crit. coverage | Completeness | Depth | Sessions |
|---|---|---|---|---|---|
| [domain] | X.X | X.X | X.X | X.X | N |
```

---

## Hard rules

- **Evaluate while context is fresh** — don't defer. A response that seemed good might have had gaps you only noticed when synthesizing.
- **Critical coverage is the most important criterion** — a response that gets direction right but misses implementation gotchas will cause real bugs. Weight it heavily in the verdict.
- **Add domain-specific criteria generously** — the more specific the criteria, the more useful the profile over time.
- **Never average across domains blindly** — a model that's great at pricing research may be weak at architecture gotcha detection. The domain table matters more than the overall average.
- **Log the verdict honestly** — if a response would have led to a wrong decision, say so clearly.
