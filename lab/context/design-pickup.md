# Pickup, the statuses, and the names

Locked and built 2026-08-20. `execute` was handling both the decision *what is this ticket* and the work *build it*. The first one moved out, and the vocabulary changed with it.

## What was locked

- **`execute` runs plan → build → review, and nothing before it.** Routing by ticket type, deciding whether a ticket is ready, splitting it, parking it — none of that is execution. The user's words: *"you are really overloading this skill with responsibility that doesn't belong to it."*
- **`/start` is pickup, and it only routes.** It reads `type:` and `status:` and invokes. Splitting a ticket and parking one moved to `/groundwork`, because both are answers a map produces — at pickup there is nothing to decide them from but a title.
- **The skill `brainstorm` is now `groundwork`.** The ticket type `research` is now `topic`. The status `brainstorm` is now `groundwork`.

## The names

**`groundwork`** — the skill, and the status. It covers finding every open question, generating options nobody raised, researching what can't be answered from memory, settling each question with the user, and writing the design and the rough approach. One word for all five, because it names the phase rather than one activity inside it.

Rejected, with the reason each died:

- **`brainstorm`** — means generating ideas without judgment. The skill converges and commits; brainstorming is a fifth of it. It also collided with `superpowers:brainstorming`.
- **`decide` / `decision`** — the user rejected these outright. Too generic, and they ignore the research and design half.
- **`workup`** — the strongest external candidate, picked independently by two models. Killed by two things neither could see: it collides with `debug`, which is Flow's actual diagnosis skill, and the noun is a medical term of art, which Flow's plain-words rule bans.
- **`framing`, `pressure-testing`, `wrangle`, `map-out`, `shape-work`** — each names one half or one phase. `shape-work` also collided with "shape" as ordinary prose, used about ten times across the skills.

**The known weakness of `groundwork`:** it implies something comes after, and a `topic` ticket sometimes ends in "don't build this". Accepted, on the reframe that groundwork hitting bedrock and stopping a build did its job.

**`topic`** — a ticket whose deliverable is a settled answer rather than code. It replaced `research`, which collided with the `research` skill that fetches documentation and decides nothing. That collision cost a whole paragraph in `research/SKILL.md` explaining that the two were unrelated; the paragraph is deleted.

Five external models were run on the naming problem. The report is in `tmp/model-creativity.md`; the raw responses in `tmp/brainstorm-rename.md`.

## The statuses

`todo · groundwork · planning · building · review · done · parked · dropped`.

**`thinking` was the original problem.** It covered pickup, a map not started, a map half-walked, a closed map, and a plan being written — so `/start` could not tell whether to resume or hand off, which is the one question it exists to answer. `brainstorm` and `planning` split it in two. `brainstorm` then became `groundwork` with the skill.

**Every type uses a subsequence of the same order, never a different order.** That is why one set covers all five, and why branching the set per type was rejected: everything that reads a status — `flow next`, `ls`, `status`, the graph — is type-blind, so per-type vocabularies would need a mapping table in every view, forever.

- **`feature`** — all of them.
- **`chore`** — the same, usually skipping `groundwork`.
- **`issue`** — `todo → building → review → done`. `debug` hunts the cause and writes the fix as one act.
- **`topic`** — `todo → groundwork → done`. The map is the deliverable and was agreed decision by decision as it was written, so a review status would re-approve what is already approved.
- **`prototype`** — `todo → building → review → done`. The question arrives with the ticket, and the code is thrown away.

**`flow start <id>` picks the entry status from the type** — `groundwork` for feature, chore and topic; `building` for issue and prototype. This replaced the old wrinkle where every ticket entered at `brainstorm`, including an issue that `/debug` was about to hunt.

**A ticket cut from a spec still passes through `groundwork` for one command.** `flow start` cannot know it arrived decided, so `/start` corrects it with `flow plan <id>` immediately.

## The mechanism, checked against the docs 2026-08-20

- **A command and a skill are the same thing now.** Quoting Claude Code's docs: *"Custom commands have been merged into skills. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way."* **This kills the repo rule** that a command earns its place by running something before the model thinks, *"which is the one thing a skill cannot do"*.
- **An injected command runs before the model sees anything.** Claude Code reads the file, runs each `` !`cmd` ``, pastes the output over the placeholder, then sends the text. The agent cannot skip it, see it, or react to it failing.
- **Several injected commands are allowed**, in order, on every invocation. No conditional form. Output is not re-scanned, each runs under a 2-minute timeout, and a multi-line script goes in a fenced block opened with ` ```! `.
- **A non-zero exit aborts the whole invocation** and the model receives nothing. `flow` exits 1 on every refusal, so `/start` could never reach its own "refused → say why and stop" line. Fixed with `|| true`, in `commands/start.md` and `commands/merge.md`.

## Built 2026-08-20

**`flow`** — the status rename, the type rename, `flow groundwork <id>` as a verb, and two behaviour changes:

- **Entry status by type**, in `entryStatus()` beside `cmdStart`.
- **The guards are keyed to where a ticket comes from, not where it is going.** The old test was `status === 'brainstorm' || status === 'planning'`, which meant an issue entering at `building` walked past both the unmet-dependency and the open-children refusals. Now `from === 'todo' || from === 'parked' || status === 'planning'`. The third clause is kept on purpose: groundwork is where children get cut, so a parent whose work just moved into its children must not get a plan written for it.

Verified by running the whole loop against a scratch tree — every type's entry status, both refusals, all five transitions, park and revive, and every read view. `flow` has no test suite, so nothing here was checked by reading the diff.

**`/start`** — 34 lines to 21. Routes on `type:` and `status:`, invokes, stops. The split and the park are gone from it, and so is reading `brainstorm/map.md`: the status already answers whether the map is closed, which is what "give it metadata" turned out to mean.

**`/groundwork`** — the rename, plus what moved in: parking a ticket that turns out not worth building, and the rule that a parent keeps only what no child holds. `topic parents` in the map format became `group headings`, because `topic` is now a ticket type.

**`/prototype`** — gained an optional approach round before standing anything up: what gets built, which library and version, the fallback route, how many variants. It is not a status — nothing reaches disk, so a ticket resting in `planning` with nothing to open would be worse than `building`. The hard rule *"a prototype needing a plan is a ticket"* is deleted; the line above it already says span is what splits one.

**`execute`** — the pickup fork and the type map are gone, since `/start` and `/groundwork` own them. Phase 1 is now the entry condition plus writing `## Done when`.

## Still open

- **The ticket folder was still `brainstorm/`** — ✅ renamed 2026-08-21, along with `docs/brainstorms/<slug>/` → `docs/groundwork/<slug>/` and `--from-brainstorm` → `--from-groundwork`. Keeping it had been settled on a premise that turned out false: "it is data on disk in live projects", when Flow is installed nowhere and no project has been migrated, so no such data existed. Full entry in `refactor-agenda.md` item 11.
- **`execute`'s rewrite — ✅ done 2026-08-22.** 207 → 178 lines, 2513 → 2110 words. Phase numbering unchanged, so `references/review-code.md:3` still reads "Read at Phase 4" correctly.

  The first attempt was rejected for over-explanation: *"there is zero compression... I fully disapprove this shit."* The standard held to: **instruct, do not justify.**

  **The 100-line target was not met, and is not reachable without cutting rules.** It was set against 186 lines, before this session deliberately added `### When the built thing is wrong` — the U-turn, ~15 lines. `writing.md` §7 bans cutting rule count as a strategy, and every remaining section is dense with rules: `Dispatching a step` is 6 numbered rules plus 3 status outcomes, `The ticket folder` is 5 owners.

  What actually returned words, in order: **deleting duplication, not trimming sentences.** The 4-item loop list restated the 4 phase headings; the `## Scripts`-style status diagram restated command syntax the global `CLAUDE.md` already loads; `### Handing a job to a separate session` folded into `### Whether to delegate` as one bullet; the "Invoked on a `feature` or `chore`" opener restated the skill's own description verbatim. Line-level trimming returned about 1%, matching what `compression.md` measured on `brainstorm`.

  **A real path to 100 would have to move rules, not cut them** — `Dispatching a step` (266 words) is the only block that could leave whole. Rejected 2026-08-22: it is the block whose omission does silent damage, an unread diff or files pasted into a worker's prompt, and a ref that must be read to avoid silent damage is the worst split candidate. Reversible cheaply once the user knows how often delegation actually fires.
- **The repo `CLAUDE.md` carries a dead rule** — that a command earns its place by running something before the model thinks. Now factually false. It is the project instruction file, so it waits for the user.
- **`flow` crashes with `EPIPE` when its output is piped into `head`.** Node's default stdout handling, not introduced by any of this.
