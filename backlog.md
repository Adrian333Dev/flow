# Backlog

Every open item in Flow, in one place. **An open item lives here and nowhere else** — the files under `wip/context/` keep the reasoning behind them, and none of those files is a work list.

- One line per item: what it is, then where the argument lives. Never the argument itself.
- A pointer names a file in `wip/context/` unless the line gives a path.
- `- [ ]` open, `- [x]` done. A partly done item carries **half done** on its line.
- Once a group has no open item left, delete its checked items. Git holds them.

Sections group by area. Only `## In front of us` is ordered.

## In front of us

- [x] **The `flow` command redesign** — one shape, statuses as data, prefix matching, per-command flag declarations. The rules are in `global/refs/cli-design.md`
- [x] **`/run`, one command that runs any shell command** — replaces `/merge`, and covers `fmerge`, `ptree` and whatever comes next. Needs `|| true`, or a non-zero exit hands the model nothing. `threads.md` → `command-surface`
- [ ] **`/start`'s routing line** — the status leads and the arrow points at the skill, nested under `feature` and `chore`. The shell branch and the command names are already updated. `refactor-agenda.md` item 11
- [ ] **`execute`'s rewrite** — 193 lines toward 100. Instruct, do not justify. `design-pickup.md`

## Mixed

- [ ] full end-to-end testing for all the programmatic parts.
- [ ] possibly full restructure of the current directory structure. And possibly improving the state to simplify the testing of latest tooling, skills, commands, or anything.
- [ ] Introducing development skills.

## The writing pass — still owed

Each read end to end against `global/refs/writing.md`: plan the sections, then test every sentence. It is a compression pass as well.

- [ ] **`debug`** — 4 parked changes land with it: the collaboration loop generalized out of `debug-web-pages`, a failing check that is not always a command, "the red command" renamed, and 2 lines that carry no meaning as written. `refactor-agenda.md` item 10
- [ ] **`file-findings`** — `write-skills.md` moves into `refs/` with it, the last file sitting at a skill root
- [ ] **`handoff`** — `SKILL.md:97` needs checking too: "Capture in the project `CLAUDE.md`" looks wrong
- [ ] **`prototype`** — it writes `visualize` bare at lines 3, 36, 38 and 83, where a skill is written `/visualize`
- [ ] **`research`**
- [ ] **`write-tickets`**
- [ ] **`groundwork`** — had its rework, never this pass
- [ ] **A second pass on `global/CLAUDE.md`** — apply the always-loaded test in `writing.md` §3 to every section, not just `## Scripts`: name a moment the rule fires with no skill loaded, and where you cannot, move it to the skill that owns it. The `flow` block had this pass 2026-08-21
- [ ] **Finish the `/skill-name` sweep** — `handoff/`, `research/`, `global/refs/study-cases.md`
- [ ] **`debug-web-pages`** — excluded until it is rebuilt on `browser-harness`, under `## Structure and names`

## `flow` and the commands

- [ ] **Several ticket ids at once** — `edit`, `start` and `drop` still take exactly one, and `file-findings` closes several in a pass. The parser already collects a list; decide what a partial failure prints. `threads.md` → `command-surface`
- [ ] **A test suite for `flow`** — about 2,000 lines of Node, verified only by hand. The redesign was walked command by command in `tmp/flowtest/`, which is the case material. `handoff.md`
- [ ] **`flow` crashes with `EPIPE`** when its output is piped into `head` — Node's default stdout handling
- [ ] **`closed` records only the minute, so `last closed` guesses on a tie** — `graph.js:135` breaks it by highest id, which was wrong in the walk on 2026-08-21. Seconds would settle it
- [ ] **`refs/review-code.md:3` says "Read at Phase 4"** — renumber it with `execute`'s rewrite
- [ ] **Existing tickets keep their long labels** — `labelize` cuts to 3 words at creation, and nothing rewrites what is already on disk. `flow tickets edit <id> --label` does one at a time
- [ ] **Simplify `flow`, maybe** — how many concepts it makes you hold, never the code. Low priority, and deliberately vague. `remaining.md`

## Sessions still to hold

Each needs its own conversation before anything gets built.

- [ ] **Context engineering** — keep what loads as small as possible, and stop cache invalidation when a skill loads mid-session
- [ ] **A knowledge base per skill** — `docs/context/` has no shape for one and no self-improvement loop. `browser-harness` is the model: knowledge lives at `domain-skills/<host>/` and the navigation call surfaces it, so the agent never decides to look. Worth most once domain skills exist. `handoff.md`
- [ ] **Git worktrees** — a custom solution for git, and whether the ban on git mutations lifts with it
- [ ] **Parallel subagent calls** — blocked on git worktrees, and on `snapshot.js`, which records the whole tree either side of a dispatch and cannot tell two writers apart. `threads.md` → `execute-cost`
- [ ] **The ASCII engine** — hand it JSON, get back the drawing. You have read `design-ascii-engine.md` and mostly disagree with its recommendation; state your direction before anything in there gets argued
- [ ] **An SVG engine** — later than the ASCII one. It reopens the SVG ban, decided on a measured ~10 minutes and ~80k tokens per diagram in the main context, which a subagent changes. `threads.md` → `extension-points`
- [ ] **Tracking every session, subagent and tool call** — hooks carry `session_id`, `agent_id` and the file path natively, and are the only layer that can also block a call. Not designed. `wip/research/claude-audit.md`
- [ ] **`grill`** — decided and undesigned: a skill you fire at a finished artifact, `disable-model-invocation: true`, never model-invoked. `handoff.md`
- [ ] **Excalidraw** — 3 third-party skills kept at `wip/excalidraw/`, still no verdict
- [ ] **Read `deepseek-harness` for ideas** — a plugin-based agent harness where everything is a plugin, cloned at `wip/research/deepseek-harness/`. Carries a second question: whether Flow ever runs outside Claude Code. Ranked below every other session here — github.com/deepseek-ai/deepseek-harness
- [ ] **Expand `## Explaining` from the two ADHD skills** — both exist to stop an agent burying the answer, and neither is cloned yet: github.com/ayghri/i-have-adhd, github.com/UditAkhourii/adhd. Outranks the `deepseek-harness` read, because explanations to the user keep missing

## Structure and names

- [ ] **Group `skills/` into subcategories** — 10 skills sit flat today. This reverses the repo `CLAUDE.md` rule *"Flat for now"*, which gets rewritten when the grouping lands
- [ ] **Rename `wip/`** — nothing in the name says design lab
- [ ] **Rebuild `debug-web-pages` on `browser-harness`** — 1,299 lines to roughly 150. The capture transport dies, the investigation method stays. Waits for the move to Linux. `design-browser-tooling.md`

## For whoever reads Flow

- [ ] **`README.md`** — written at the end
- [ ] **The guide** — the long form of `global/refs/workflow.md`, for a reader who knows none of this: every component, every decision, and the reasoning behind each

## Install and migration

- [ ] **The install skill** — one skill covering every starting state, and the last thing Flow gets. `threads.md` → `install`
- [ ] **Test built-in `/init` with `CLAUDE_CODE_NEW_INIT=1`** against a real repo first — it already does the codebase survey, the gap questions and a reviewable proposal
- [ ] **Migrate Delapse** — the real test, and where its conventions route into the project `CLAUDE.md` and `docs/context/`
- [ ] **Delete the project-local skills afterwards** — skills are global, one copy per machine
- [ ] **Harvest Delapse, `lumacraft_v2` and `framework-build` into skills** before that material is lost
- [ ] **Run `link.sh`** once the skill set is final
- [ ] **Repoint the stale `~/.local/bin` symlinks** — `ptree`, `flow`, `fmerge` and `gsave` all resolve into the deleted workbench repo, so `flow` runs old code. `refactor-agenda.md` item 8
- [ ] **Tune `guard.js`'s deny and ask lists** against real use — they were written from the rules, never against an observed false positive

## Open questions with no build item

- [ ] **Two rules for `global/CLAUDE.md`, confirmed 2026-08-09, never written** — the agent may depart from the workflow, saying which part it set aside; and it records Flow's own faults unprompted. `remaining.md`
- [ ] **Is an in-session subagent dispatch the same document as a cross-session assignment?** `research/SKILL.md:49` describes the assign shape under another name. `remaining.md`
- [ ] **Dependency discipline** — a check before any dependency is added, and how a bulk version bump gets reviewed
- [ ] **File size as its own review signal** — a small diff that pushes an already-large file past a healthy boundary
- [ ] **The negation split** — a prohibition where the agent breaks a rule under pressure, a positive recipe where the output comes out the wrong shape. `compression.md`
- [ ] **Output contract, tool allowlist and model, per agent** — nothing fixes what a dispatched agent returns. `threads.md` → `extension-points`
- [ ] **Does `haiku-worker` survive at all?** — contested. `threads.md` → `extension-points`
- [ ] **What a parent can do to a subagent it dispatched** — parked, revisit when one actually runs. `threads.md` → `subagent-mechanics`
- [ ] **Where the review paragraph lives** once a review step exists — 5 lines sitting in `groundwork` Phase 3. `remaining.md`
- [ ] **What triggers `organize`** — the `review` status answers part of it; the wiring was never designed
- [ ] **The skill-creation trigger** — when a recurring pattern becomes a new skill, and who writes it. `design-skill-ecosystem.md` branch #6
- [ ] **Recommending a stack skill at install** — deferred because the catalog holds 8 process skills and no stack skills
- [ ] **Auditing current work against a skill's accumulated practice** — scope it to what the work touched, or the reads are unbounded
- [ ] **Cold-reader `/grill`** — hand the stripped mechanism to subagents that never saw the conversation, so neither can defend it. `remaining.md`
- [ ] **Where general-purpose global scripts live** — `gsave` is not Flow-specific and the set keeps growing. Parked by you. `remaining.md`
- [ ] **The repo `CLAUDE.md` states a rule that is now false** — that a command earns its place by running something before the model thinks. Claude Code merged commands into skills. `design-pickup.md`

## Cleaning the records

- [ ] **`remaining.md` is stale under every BUILT heading** — those sections still carry content the 2 locked sections at the top later reversed
- [ ] **Restructure `remaining.md`** — move the migration steps out, split must from later, cut the settled argument out of the `[x]` items
- [ ] **`session-new-plugin.md` carries a stale "skills still to build" list**
- [ ] **Real commit messages** — changelogs are suspended until v1, so git is the only record of why something changed
- [ ] **Turn the glyph probe into a script** — `wip/research/ascii-glyph-probe.md` is evidence today. `scripts/glyph-probe.js` would make "show it to the user first" something the agent can carry out, and it has to render into a file as well as a terminal. `design-visualize-rework.md`
- [ ] **Move `tmp/model-creativity.md` into `wip/context/`**
- [ ] **Delete `design-explain-rework.md`?** — its stated condition landed 2026-08-12. Check first whether it still holds anything unique. Needs your confirmation either way

## Deferred on purpose — no action until a real case

- [ ] Whether a leaf ticket is always plannable in about 35 lines
- [ ] A fifth ticket type, for document work that is not research
- [ ] Splitting `~/.claude/flow/notes.md` — by kind, never by project
- [ ] Frontmatter on files other than tickets, spec files first
- [ ] An interview at install to fill `## The user`
- [ ] Move the git rule from `## Hard rules` into `## Preferences`, once that section carries real content

## Not important

- [ ] **A `PreCompact` hook** — a block-once state file, so auto-compaction gives way to `handoff`. The least important thing on this list. The context-pulse hook beside it was deferred indefinitely 2026-08-08: at a 1M window you fire `handoff` yourself
