# Design — `explain` rework + the communication layer

_Started 2026-07-27, **built 2026-07-28**. Driven by `tmp/study-cases/delapse/case1/{explain-skill-issues,explain-skill-wins,shit-explanation}.md`._

Three logged failures, one wins log. The fact that decided the whole design: **Cases 1, 2 and 3 all happened without the skill being invoked at all.** The wins file's own conclusion is that whenever `explain` fires, the problem disappears.

The fix is not a better trigger. `explain` was firing on 70–90% of user-facing output — that isn't an on-demand skill, it's a **mode**, and a mode fails when the model never recognizes it's in one. Recognition happens before fetching, so fetching can't repair it. The prose rules moved to `flow/CLAUDE.md`, where they load whether or not anyone decides to load them.

---

## LOCKED decisions

### #1 — One file. Do not split.

The proposal to move the pattern vocabulary and worked example into sub-files is **rejected** (user, emphatically). The skill needs essentially all of its content on every run, so splitting only buys extra reads across turns; and the diagram variety is deliberate — a *menu* the agent picks from, not bloat.

### #2 — File-length standard

Under **~300 lines is fine**; up to **~500 is acceptable** when the material earns it. Length alone is never a reason to split. Split only when parts are genuinely conditional — read on some runs and not others. Recorded in `flow-skills/CLAUDE.md`.

### #3 — ASCII-first; HTML is not the default for mockups

Start with **ASCII**, especially for layout. Switch to HTML typically only **once the layout is locked** (the m28 control-panel run: ASCII settled structure, HTML then dressed an agreed layout in colour). Not absolute — reach for HTML earlier when the component is complex enough that ASCII genuinely cannot carry it.

### #4 — The split is by medium, not by weight

**`flow/CLAUDE.md` `## Explaining`** governs every answer, status reports and one-line questions included: whole picture first, define from zero, no undefined shorthand, calibrate tech against `## The user`, priority order, the final message is written for the user, outline before typing, no preamble, UI is rendered not described.

**`explain/SKILL.md`** keeps only what produces a rendered artifact: medium selection, diagram rules, ASCII mechanics, verification, the scale-model mockup pattern, HTML previews, structure shapes, the pattern vocabulary, the worked example.

Five of the seven original invariants moved out. One (inline, end of turn) was already duplicated in CLAUDE.md and was dropped. One (the time budget) stayed and was split — ordinary explanation fast, rendered artifact earns its cost.

Consequence: `explain` is no longer ambient. `note` is the only ambient skill again, which dissolves the "two always-on skills" question rather than answering it.

### #5 — Verification is a shipped script

`explain/scripts/check-frame.js`. Node, no dependencies.

The glyph ban removes the *invisible* class of failure — source correct, render wrong. It does not remove ordinary miscounting, which is visible in the source and exactly what an agent eyeballing its own output is worst at. Of the observed 3–5 rounds, one was pure waste: an improvised check with a 0-based/1-based bug reporting false failures. A fixed script makes that category impossible.

Three checks per block: charset (any character outside the sanctioned set, with line, column, code point), width (framed lines must agree, grouped by indent so a connector run isn't compared against a box), and an informational column map of every vertical border. Auto-judging interior borders produces false failures on nested boxes — the map is printed and the agent reads it.

**Implementation note that changed the design:** the obvious approach — ask Unicode for each character's width — does not work. `━` is box-drawing and banned; `─` is the same block and fine. Unicode calls both "Ambiguous". So the script uses an explicit allowlist: ASCII, `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼`, and `▲ ▼ ▶ ◀`. It therefore enforces the widget ban directly instead of restating it as a rule.

Fires on frames that model a screen. Not on the small illustrative diagrams in the pattern vocabulary — six lines, they don't drift.

### #6 — The concision line is rejected

> `Be extremely concise. sacrifice grammar for the sake of concision.`

The useful half already exists in both places it belongs. The other half is a written description of the Case 1 failure — telegraphic fragments are named there as a *cause*. It is tuned for terse replies to someone who already holds the context; explaining something new is the opposite situation.

What shipped instead: the "2–3 sentences" mandate that appeared four times inside `explain` is gone. Only the opener is deliberately short.

### #7 — Scratch path is `tmp/`

Settles the `temp/` vs `tmp/` split. Both utility scripts already ignore either.

---

## Found while building

- **`·` was already violating the ban in the shipped skill.** Every example used it as a separator (`state: cart · products`). U+00B7 is Ambiguous and on the study-case ban list. Replaced with `/` throughout.
- **`→`, `…` and `—` have the same problem** and were also in use. Inside frames they are now `->`, `...` and `-`; em dashes stay fine in prose. The em dash was caught by running the checker against the skill's own examples.
- All diagrams in the rewritten skill were generated with computed padding and verified by `check-frame.js` — exit 0.

---

## Shipped 2026-07-28

- `flow/CLAUDE.md` — full rewrite (below).
- `flow-skills/skills/explain/SKILL.md` — 280 lines, all 13 backlog items.
- `flow-skills/skills/explain/scripts/check-frame.js` — new.
- `flow-skills/skills/note/SKILL.md` — preferences are inferred, not announced.
- `flow-skills/skills/organize/SKILL.md` — routing row split: project rule vs working preference.
- `flow-skills/CLAUDE.md` — telegraphic standard broadened to every context-loaded markdown file.

### `flow/CLAUDE.md` rewrite — what changed and why

- `Who the user is` and `Working with the user` merged into one `## The user` placeholder. The user's actual profile was hardcoded into a file that ships to other projects — the same bug as hardcoding a project name. `project-init` fills it. No length constraint; it grows.
- New `## Preferences` section. Auto-memory is disabled (`autoMemoryEnabled: false` in both settings files), so preferences need a durable home, and it has to be a file that loads without anyone deciding to read it. Distinct from `## Project rules` — those are about the code, these are about the collaboration.
- New `## Workflow` block listing the eight core skills, shaped after v1's engine section. `debug-web-pages` deliberately excluded — domain-specific.
- `## Scripts` rewritten as active instruction rather than reference: `tree.sh` replaces `ls`/`find`/`cd`, `merge-files.js` is query+merge and replaces grep-then-read. Full flag surface documented, since the agent was using neither.
- **Deleted:** the git rule (the deny list enforces it, and the old external skill suite was what kept provoking it), the auto-memory rule (disabled in settings), "no placeholders in plans" (that's `write-plan.md`'s rule).
- **Inverted:** "never run install/setup commands" → two prescriptive rules. The real failures were hand-editing manifests with versions recalled from memory (years stale) and hand-scaffolding what has an official CLI (drifts from the standard layout). The agent now runs the package manager and the `create-*` CLI. The cost objection that justified the old prohibition died with command chaining.
- Voice-to-text is a standing rule, not a user-profile detail, and is compressed to one line.

---

## Still open

- **Session start.** The section deleted with `now.md` still needs rewriting around `handoff`. Left out of this pass — its shape depends on the `project-init` discussion.
- **Key docs table.** v1 had one. `flow/docs/` is nearly empty and its final shape depends on `project-init`. Inventing paths now means rewriting them later.

## Reference pointers

- `tmp/study-cases/delapse/case1/` — the three logged failures and the wins log.
- `flow-skills/skills/explain/SKILL.md` — 280 lines, current.
- `new-workflow/design-brainstorm-rework.md` — the parallel brainstorm thread, still open.
