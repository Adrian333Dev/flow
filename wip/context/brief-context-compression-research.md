# Research prompt — how to say the same thing in fewer sentences

Written 2026-08-10, for pasting into an external deep-research tool. Self-contained on purpose: it names no
paths in this repo, because the tool cannot read them.

---

## The task

Research how to write instruction files for AI coding agents — `CLAUDE.md`, `AGENTS.md`, `.cursorrules`,
skill and system-prompt files — so that the same instructions occupy far fewer lines **without losing
information and without losing adherence**.

Produce a **catalog of named transformations**, each one demonstrated on real text, each one carrying the
condition under which it breaks. Not a list of tips. A recipe book.

## The core question, stated precisely

I am not asking about shortening words. I am asking about **restructuring**.

Here is the distinction, by analogy. Suppose a function handles ten cases with ten `if`/`else` branches. The
unskilled optimisation is to shorten each branch — rename the variables, compress the bodies. The skilled
one is to notice the ten branches share a structure and replace all of them with one expression. Same
behaviour, a fraction of the code, and the saving comes from seeing the shape rather than from trimming.

I want the prose equivalent. **Given three sentences that convey an instruction, what are the moves that
convey the same instruction in one?**

A worked example from a real instruction file. Original:

> Project paths, plus one global file. Each is created on first write — a missing path means nothing has
> needed it yet, not that it's wrong to write one.
>
> **A directory is a project when its `CLAUDE.md` has a `## Project` section** — never merely because a
> `CLAUDE.md` exists. A directory can want rules without being a project: notes, a scratch area, a catalog.
> Those get a rules-only `CLAUDE.md`, no `docs/` tree, no tickets, no `flow`.

Rewritten:

> **Project = a `CLAUDE.md` with a `## Project` section.** Without one: rules only, no `docs/`, no tickets,
> no `flow`.

Roughly 65% shorter, nothing lost. The move has a name: *state the test, then delete the examples that only
illustrate it and the consequences that follow from it.* **That kind of named, reusable move is the
deliverable.** Word-level trimming would have saved perhaps 15% and left the same shape.

## What is already known — do not spend budget re-deriving this

The current public state of the art for compressing agent memory files is word-level and sentence-level.
The `caveman` project (`JuliusBrussee/caveman`) is representative; its compression sub-skill instructs:

- delete articles (`a`, `an`, `the`)
- delete filler (`just`, `really`, `basically`, `actually`, `simply`, `essentially`)
- delete hedging (`it might be worth`, `you could consider`)
- delete connective fluff (`however`, `furthermore`, `additionally`)
- short synonyms over long (`use` not `utilize`, `fix` not `implement a solution for`)
- fragments are fine; drop `you should`, `make sure to`, `remember to`
- preserve exactly: code blocks, inline code, URLs, file paths, commands, proper nouns, numbers, headings,
  list nesting, table structure, frontmatter
- merge redundant bullets; keep one example where several show the same pattern

Two further claims from the same project, both worth verifying rather than assuming:

- **Invented abbreviations save nothing** (`cfg`, `impl`, `req`) because the tokenizer splits them like the
  full word — so they cost readability for no gain.
- **Symbols used as connectors** (arrows, bullets) are each their own token and save nothing.

Its measured results: roughly 45–55% of words removed from a sample memory file with structure intact; and
separately, the always-on style rules cost about 1–1.5k input tokens per turn to carry.

Take all of that as the **baseline**. Of its ~25 rules, only two are structural ("merge redundant bullets",
"keep one example"), and both are one line with no method. **The gap above that line is the research
target.**

## The deliverable

A catalog. Every entry in exactly this shape:

- **Name** — short, memorable, imperative.
- **What it does** — one or two sentences.
- **Before / after** — real text, not invented for the occasion. Prefer passages from real public
  `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, skill files or system prompts. Give the line and word delta.
- **Why it is safe** — what makes the information survive the move.
- **When it breaks** — the condition under which applying it loses information or reduces adherence. An
  entry without this field is incomplete.
- **Evidence** — measured, reported-but-unverified, or opinion. See the evidence rules below.

## Hypotheses to confirm, extend, or kill

I expect these transformations to exist. Treat them as starting points, not as the answer. Killing one with
evidence is as valuable as confirming it, and transformations I have not listed are the most valuable
finding of all.

1. **A predicate replaces an enumeration.** Several listed cases that share a test collapse into the test
   itself. The `if`/`else` analogy applied to prose.
2. **An invariant replaces a procedure.** A stated "never X" covers cases that a step-by-step list has to
   walk one at a time.
3. **Structure absorbs the repeated part.** Parallel sentences become a table whose header carries what
   every sentence was repeating.
4. **Placement replaces conditions.** A rule that fires at only one moment, placed in the file that loads at
   that moment, no longer needs the clause explaining when it applies.
5. **Name it once, then reuse the name.** A single definition shortens every later mention. Where is the
   break-even, and when does a defined term become opaque shorthand that costs more than it saves?
6. **Delete the justification.** Several sentences of rationale become the rule alone. Open question, and an
   important one: was the rationale carrying adherence?
7. **Delete what follows from another rule.** Consequences and counterexamples the reader can derive.
8. **One example, or none.** Existing practice says keep one where several show the same pattern. When is
   one still too many, and when is an example load-bearing enough to keep at length?

## The counter-question, attached to every entry

**What does the transformation cost in instruction-following?**

A file that reads tighter and is obeyed less is a loss that never shows up on the page. Wherever measured
evidence exists — instruction-following benchmarks, adherence studies, ablations that removed rationale or
examples and measured the effect — attach it to the specific transformation rather than stating it once as a
general caveat.

If the honest answer for a given move is "nobody has measured this", say so plainly. That is a useful
finding.

## Supporting questions

Lower priority than the catalog, but each one bears on a real decision:

1. **Does progressive disclosure work?** A small always-loaded core file that names conditional reference
   files ("modelling a screen → read this one"). Do models reliably fetch the named file when the stated
   condition is met? What makes such a pointer get followed or ignored — placement, wording, specificity of
   the condition?
2. **When is redundancy load-bearing?** Deduplicating a rule that appears in two files is an obvious saving.
   Is there evidence that repeating a critical instruction improves adherence, and if so, which instructions
   earn the repetition?
3. **Is there a ceiling on how many rules a model follows at once?** If adherence degrades with rule *count*
   rather than token count, then cutting rules and cutting lines are different operations, and most
   compression advice optimises the wrong one.
4. **Does position matter?** If attention is uneven across a long context, placement is itself a compression
   technique — a rule that is obeyed from the top of the file may need to be stated once instead of twice.
5. **How do you verify a rewritten instruction file still works?** Practical evaluation methods for
   instruction files specifically: trigger tests, behavioural tests, A/B comparison, anything people
   actually run.

## Scope boundaries

**In scope:** markdown and text that loads into an AI agent's context as instructions — memory files, rule
files, system prompts, skill definitions, tool descriptions.

**Out of scope:** anything a human reads. Documentation, READMEs, explanations written for people. Those
pull in the opposite direction — more detail, more clarity, more redundancy — and mixing the two audiences
is the specific mistake this research exists to avoid. Do not include advice about writing for humans.

**At arm's length:** automated prompt-compression systems that strip tokens algorithmically. Worth mining
for one thing only — which categories of words turned out to be droppable without hurting task performance,
since that is empirical evidence about what carries meaning. Do not recommend adopting such a tool. The
files in question are hand-edited and must stay readable and editable by a person.

## Evidence rules

Mark every substantive claim as one of:

- **Measured** — a study, benchmark or published experiment with numbers. Give the source and what was
  actually measured.
- **Reported** — stated by a credible practitioner or project, not independently verified.
- **Opinion** — inference, convention, or folklore.

Do not present convention as evidence. Where a widely repeated rule turns out to rest on nothing, say so —
that is a finding.

**Verify citations exist before citing them.** If a paper cannot be confirmed to exist, either drop it or
mark it explicitly as unverified. Close the report with a short section stating **which conclusions survive
if every unverified citation is struck out.**

Prefer primary sources. Where practitioners disagree, give both positions and say which has evidence behind
it.

## Output

One markdown report.

1. **Summary table** at the top: every transformation, one line each, with its typical saving and its main
   risk. Someone reads this table alone and can apply the five biggest wins.
2. **The catalog** — full entries in the shape given above, ordered by how much they save.
3. **Supporting findings** — the five supporting questions, answered.
4. **What has no evidence** — rules in common circulation that turn out to be unsupported, and open
   questions nobody has answered.
5. **Citation audit** — what could not be verified, and which conclusions survive without it.

Be specific and commit to positions. Where the evidence is thin, say it is thin and give your best reading
rather than declining to answer.
