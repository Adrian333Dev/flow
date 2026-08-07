# Study-case report: the failed C5 explanation (Web Audio / React split)

**Date:** 2026-07-22
**Purpose:** input for a separate brainstorm session on a better explanation / visualization
framework. Captures every piece of user feedback from this episode, what was tried, and what
failed. Final user verdict on the whole episode: *"a little better, but still absolutely trash…
you're not catching the point."* Nothing here is a solved problem.

## The corpus (files to feed the brainstorm)

| File | What it is |
|---|---|
| `2026-07-21-full-architecture.md` (if present) | Earlier 7-diagram viz — called "terrible and really badly structured" |
| `2026-07-22-who-plays-the-audio-v1.md` | Attempt 1 — failed on undefined actors |
| `2026-07-22-who-plays-the-audio-v2.md` | Attempt 2 — failed on wrong calibration |
| `2026-07-22-who-plays-the-audio.md` (v3) | Attempt 3 — "a little better, still trash" |
| This report | Feedback timeline + extracted failure patterns |
| `CLAUDE.md` (repo root) | Rules already extracted from this episode |
| `.claude/skills/visualization/` | The partial skill whose text formats underperformed (see verdict below) |

## Timeline of attempts and feedback

**Attempt 0 — first C5 presentation (chat only).** Dumped ~7 decision groups at once in
domain jargon (audio-clock scheduling, rAF loops, look-ahead buffering).
Feedback: *"I didn't understand a single fucking thing… you need to understand that I have no
idea what most of these things you're talking about is."* Plus: previous visualizations were
*"so terrible and really badly structured."*

**Attempt 1 (v1 file).** Single-concept sequence diagram with a responsibility table. Used
"Screen" and "Audio" as actor labels without defining what they referred to.
Feedback: *"What's exactly screen?… What the fuck is exactly audio?… a complete waste of time.
You need to assume that I do not understand what each of those components exactly mean."*

**Attempt 2 (v2 file).** Over-corrected: opened with "the app from the user's seat" preamble,
defined universally-obvious things (what a sound file is, what React does at a basic level).
Feedback: (1) don't restate what the file is about — that's obvious; (2) don't explain obvious
things (sound file, React); (3) DO explain the non-obvious — the project-specific referent
behind a shorthand like "screen"; (4) stop validation phrasing ("you're absolutely right");
(5) keep all versions as study cases (v1 had been overwritten — recovered).

**Process failure (same episode).** Substantive explanation was written *before* the tool
calls in a turn. The user only reads the final message — everything before/between tool calls
is invisible. Now a HARD RULE in CLAUDE.md: all explanation at the end of the turn, after all
tool work; re-deliver in full if violated.

**Attempt 3 (v3 file, current main).** Pinned actors to concrete modules (UI layer / playback
controller), defined only Web Audio, centered the one non-obvious rule (who writes
`activeWordIndex`), function-call notation in walkthroughs, metadata demoted to bottom.
Feedback: *"a little better, but still absolutely trash… you're not catching the point."*
And explicitly: **the text formats worked horribly** (see verdict).

## Extracted failure patterns

1. **Calibration oscillation, never convergence.** Attempt 0 assumed too much (domain jargon);
   attempt 2 assumed too little (defined sound files to a developer); attempt 3 split the
   difference and still missed. The framework needs a *method* for finding the reader's actual
   gap, not per-attempt guessing.
2. **Undefined shorthand is the fastest way to lose the reader.** "Screen"/"Audio" as labels
   with no referent made v1 worthless despite clean structure. But the fix is NOT defining
   everything — it's defining the *project-specific* referents only.
3. **Meta-content crowds out content.** Preambles ("what this file is about"), framing
   sections, and validation phrases all drew explicit negative feedback. Content first;
   study-case metadata compact and at the bottom.
4. **Delivery channel matters as much as content.** A good explanation placed before tool
   calls was never seen. (Fixed via CLAUDE.md hard rule.)
5. **"A little better" came from:** pinning shorthand to concrete named modules; end-of-turn
   delivery; cutting obvious definitions. These are necessary but clearly not sufficient.

## Format verdict: sequence-style text walkthroughs FAILED

The `A → B: message` sequence blocks (from `.claude/skills/visualization/references/`
`text-formats.md`, used in all three attempts) **did not land — user verdict: "worked
absolutely horrible… not that good at all."** This is a verdict on the *format*, not only the
calibration. The visualization skill's current text-formats guidance should be treated as
unvalidated for this user until the framework brainstorm replaces or repairs it.

## Open questions for the framework brainstorm

- What format DOES land for this user? Candidates untested: real rendered diagrams (SVG),
  annotated code skeletons, layered prose (one concept per message with confirmation gates),
  concrete numeric walkthroughs. The sequence-text format is the only one properly tried, and
  it failed.
- How should an explanation *discover* the reader's gap up front (e.g. one calibration
  question) instead of guessing and oscillating?
- What is the right unit size — v1/v2/v3 were all "one concept per file," yet still failed;
  is the unit wrong, or the format, or the ordering?
- Should the visualization skill itself be rewritten as an "explanation skill" (calibration →
  format choice → delivery rules), with the current text-formats.md demoted?
