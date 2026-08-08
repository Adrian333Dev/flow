# Study case — explanations the user could not read

Real failures, kept as specimens. Each one is a message the user rejected outright, with the
rule it broke. Purpose: build a check that catches these before they are sent.

Add to this file, newest at the bottom. Keep the offending text verbatim — a paraphrase loses
the failure.

---

## 2026-08-08 — checklist IDs and a quote standing in for an explanation

**Context.** Proposing the `handoff` conversion from skill to command. The user had asked
a plain question: why was it deferred, and what next.

**What was sent (excerpt):**

> The real one, recorded in `wip/handoff.md` under "Sequencing note": *"Deciding the extension
> point for something unbuilt is cheap. Deciding it for something on disk is unreliable, because
> those files describe the old chain — fold that call into each skill's rewrite instead."*

Plus a table headed **"2i changes"** and six references to `2i` with no gloss.

**User's reaction:** *"I have zero idea what the fuck did you mean in the whole … section"*,
*"What are 2i changes? What the fuck is 2i? I told you like 20 times already"*, and on length:
*"Do not give me 10 page long document"*.

**Three faults, in order of damage.**

1. **A checklist ID used as if it were a word.** `2i` is a heading inside `wip/remaining.md`.
   The user never reads by ID. Every one of the six uses could have said "the checklist item
   that rewrites the handoff skill". This is the repeat offence — same failure as `M2` and
   `T1` in earlier sessions.
2. **A quote pasted instead of an explanation.** The quoted sentence carries three terms the
   user never agreed to — "extension point", "on disk", "the old chain" — and the message
   defined none of them. Quoting felt like evidence; it read as noise.
3. **Length used to hide uncertainty.** ~95 lines and three tables to say: convert the file,
   add a shell prefetch, delete an empty folder. Long output is not thoroughness; here it
   buried the one question that needed answering.

**Rules broken.** All three already existed in `global/CLAUDE.md` under `## Explaining` —
*no undefined shorthand*, *never point at something without saying what it says*, *plain words,
short sentences*. Writing the rule did not stop the behaviour.

**Fix applied same day.** Both rules hardened in `global/CLAUDE.md` and its mirror in the root
`CLAUDE.md`: IDs banned outright rather than discouraged, and "a quote is not an explanation"
made explicit.

**Open question this raises.** A rule that is present in context and still broken is evidence
that always-on rules do not catch this class. Candidate for the same treatment as proposal
review — a check that runs against the drafted message, not a line in a file.
