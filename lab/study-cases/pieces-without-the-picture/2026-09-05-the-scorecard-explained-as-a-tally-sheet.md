---
date: 2026-09-05
project: flow
model: claude-opus-4-6
effort: high
rule: define-from-zero, whole-then-parts, name-the-subject-first, ui-is-drawn
status: open
---

# The scorecard explained as a tally sheet, with no picture of the mechanism

Moved from `lab/context/shit-explanations.md` on 2026-09-15. The user asked what the scorecard is, how the enforcement bridge works, and what the scorecard file actually holds. The model was found afterwards in the session transcript, where it is the last reply before the rejection.

## What the user sent

> "I fucking asked you what scorecard means and you said it's a tally sheet. Like, what the fuck is tally sheet? I fucking explained this shit to you that you shouldn't explain, assume that I know those terminologies. I have zero idea what the fuck is a tally sheet means."

> "you're not fucking explaining me the whole fucking picture. There are all missing pieces here in your fucking explanation."

> "it seems like you're suggesting that somehow we extract the rules or something from the rule files. And then building hooks based on them. And I don't know how the check and shit works."

> "I still have zero fucking idea what the fuck that scorecard holds."

## What happened

The first rejected paragraph:

> The scorecard is a tally sheet that runs in the background. Every time the agent edits or writes a file, a script checks the written content against a list of mechanical patterns: banned patterns, naming conventions, things a regex can catch. It counts three things per rule: how many edits the rule applied to, how many followed it, how many violated it. At session end, a second script prints those counts.

## Why it was wrong

1. **"Tally sheet" is a label used as a definition, and an unfamiliar one.** The user asked what a scorecard is, and the answer was a synonym the user does not know either.
2. **The whole machine is never shown.** The explanation describes pieces, a script, a pattern check, a count, without saying what connects them or how the whole thing moves from start to finish.
3. **The reply never showed what the scorecard file contains.** The user asked what data lives in it, and the reply said "counts" with no example and no structure.
4. **The link between the rule files and the scorecard's patterns was never explained.** The user thought the scorecard imports rules from `rules/` files. The reply never said the patterns are hand-written JavaScript checks, separate from the prose rules the agent reads.
5. **No drawing.** The enforcement bridge is a flow from rules through checking to enforcement, which is structure, and the reply used prose for all of it.

## Root cause

Describing pieces of a mechanism without ever showing the mechanism, so the reader could not assemble the pieces into a shape that was never drawn.

## The rule that failed

4, all loaded: `define-from-zero`, `whole-then-parts`, `name-the-subject-first`, and `ui-is-drawn`, which the repo `CLAUDE.md` carried and `home/CLAUDE.md` did not.
