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

> The real one, recorded in `wip/context/handoff.md` under "Sequencing note": *"Deciding the extension
> point for something unbuilt is cheap. Deciding it for something on disk is unreliable, because
> those files describe the old chain — fold that call into each skill's rewrite instead."*

Plus a table headed **"2i changes"** and six references to `2i` with no gloss.

**User's reaction:** *"I have zero idea what the fuck did you mean in the whole … section"*,
*"What are 2i changes? What the fuck is 2i? I told you like 20 times already"*, and on length:
*"Do not give me 10 page long document"*.

**Three faults, in order of damage.**

1. **A checklist ID used as if it were a word.** `2i` is a heading inside `wip/context/remaining.md`.
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

---

## 2026-08-09 — borrowed vocabulary from the design record

**Context.** Explaining what separates two ways a brainstorm can end: create the tickets now,
or write a spec first and create tickets from it over months.

**What was sent (excerpt):**

> **Will tickets keep being minted from this for months, or is this a one-time mint?**
> […] You can mint three tickets off a decision tree today; you cannot mint ticket #47 off it
> in month six.

Plus a table column headed **"minting"**, and *"`prod-vision.md` in your kb is that spec in
embryo"*.

**User's reaction:** *"I didn't understand a single fucking sentence"*, *"why the fuck are you
using mint? What the fuck does mint mean here?"*, *"Do not use some rare terminology that I have
never heard of."*

**The fault.** `mint` appears throughout `wip/context/remaining.md` and `global/CLAUDE.md` — *"it commits
by minting the child tickets"*. It was absorbed from the design record and used in conversation
as if it were shared vocabulary. It is not: the user never wrote it and never used it back. The
plain word is **create**, and it is not one character longer in meaning. `in embryo` was the same
failure in a second register.

**Why the existing rules missed it.** `## Explaining` bans *undefined shorthand* and *IDs*, and
`mint` is neither — it is an ordinary English word in a specialised sense. The rule needs a third
category: **a word that appears in Flow's own files is not thereby shared with the user.** Written
docs and conversation are separate vocabularies; the design record may use terms of art, a message
may not.

**Second fault, same message.** The distinction being drawn was real and the user accepted it
immediately once restated in plain words. So the idea was never the problem — only the words
carrying it. Length was not the issue either; the section was six lines. **A short paragraph made
of the wrong words fails exactly as hard as a long one.**
