# Backlog

Every open item in Flow, in one place. **An open item lives here and nowhere else** — the files under `wip/context/` keep the reasoning behind them, and none of those files is a work list.

- One line per item: what it is, then where the argument lives. Never the argument itself.
- A pointer names a file in `wip/context/` unless the line gives a path.
- `- [ ]` open, `- [x]` done. A partly done item carries **half done** on its line.
- **A section is an area, and the area is the only thing that decides where an item goes.** Everything about `flow` sits together, whatever state each piece is in.
- **State is a marker on the line, never a section.** **talk first** needs its own conversation before anything gets built; **parked** waits for a real case.
- `## Next` carries the order, and names items instead of repeating them.
- Once a section has no open item left, delete its checked items. Git holds them.

## Next

1. **The repo restructure** — the layout, then `skills/` into subfolders
2. **End-to-end testing** — after the restructure, so the setup is written against a layout that has stopped moving
3. **The install skill, then Delapse** — last, and only once everything above is still

## Mixed

- [] Project specific automated Skill/Command overrides.

## `flow`, the tool

- [x] **The `flow` command redesign** — one shape, statuses as data, prefix matching, per-command flag declarations. The rules are in `global/refs/cli-design.md`
- [x] **The `flow` surface rework — built 2026-08-23.** `tickets` is the default noun, status verbs generate from the table, `flow <id>` shows a ticket and prints the command it waits for, `edit --status` and `flow start` are gone, `/start` writes nothing. `design-cli-rework.md`
- [x] **`flow` crashed with `EPIPE`** when its output was piped into `head` — fixed with the rework, `flow.js` swallows it and exits 0
- [x] **`closed` recorded only the minute, so `last closed` guessed on a tie** — fixed with the rework, `store.now()` carries seconds
- [x] **`flow start` on a parked ticket destroyed progress** — a `feature` parked at `building` revived at `groundwork`. Fixed by deleting `start`; `park` stores the status it left and revive returns there
- [x] **Several ticket ids at once — dropped 2026-08-22.** The case behind it was a misreading: `file-findings` sweeps tickets that are *already* closed and marks them with `flow file t047 t048`, which already takes a list. `design-cli-rework.md`
- [x] **Existing tickets keep their long labels — dead 2026-08-22.** A ticket is never renamed after creation, so there is nothing on disk to sweep and no migration to run. `design-cli-rework.md`
- [x] **Prototype the `refs/unfinished/` transport** — all 4 answered 2026-08-24, GitHub accepts the namespace. `design-work-sync.md`
- [x] **`flow work` — move uncommitted work between the desktop and the laptop** — built 2026-08-24, 77 checks green including against a real GitHub remote. `design-work-sync.md`
- [x] **`flow open` — the one command behind `/start`, built 2026-08-24.** Bare for the board, an id for the ticket plus every file its `flow-open` block names, a second word for a status move, a path for loose work with no ticket. `design-resume.md`
- [x] **Simplify `flow` — dead 2026-08-24.** The item asked how many concepts the tool makes you hold, and the surface rework answered it: `flow build t047` replaced `flow tickets edit t047 --status building`
- [x] **A sixth ticket type for document work — dead 2026-08-24.** `chore` carries it. `review-code.md:3` already exempts a document ticket, and `/start` routes on open decisions rather than on the shape of the output
- [ ] **Frontmatter on files other than tickets**, spec files first — **parked**

## The writing pass

Each read end to end against `global/refs/writing.md`: plan the sections, then test every sentence. It is a compression pass as well.

- [x] **`execute`** — 207 → 178 lines, 2513 → 2110 words. Instruct, do not justify. 100 was unreachable without cutting rules; `design-pickup.md` records what a real path there would cost
- [x] **`refs/review-code.md:3` says "Read at Phase 4" — never a task.** The rewrite moved no phase number, so the line is correct as written
- [x] **`debug` — done 2026-08-24**, 114 → 119 lines. All 4 parked changes landed: the paste-it-back exchange is now a loop, the check is defined as a command *or* a sequence the user runs, "the red command" is "the failing check" everywhere, and both meaningless lines were rewritten with examples
- [x] **`file-findings` — done 2026-08-24**, 68 → 56 lines. `write-skills.md` moved to `refs/`, so no file sits at any skill root now. Method leads, inputs follow it, `## Hard rules` was 6 recaps and went
- [x] **`handoff` — done 2026-08-24**, inside the `flow open` build. Gained the `flow-open` block section, and `## Capture` is named in the global `CLAUDE.md` rather than the project one, which was the bug on the old line 97
- [x] **`prototype` — done 2026-08-24**, 88 → 77 lines. `/visualize` swept, the appearance branch moved out from under *What the ticket must carry* into `## When it is not a prototype`, `## Hard rules` folded 3 unique rules back and went
- [x] **`research` — done 2026-08-24**, 102 → 86 lines. The description listed the workflow, which `writing.md` §8 names as the failure that gets followed instead of the file
- [x] **`write-tickets` — done 2026-08-24**, 62 → 54 lines
- [x] **`groundwork` — done 2026-08-24**, 259 → 256 lines, and `refs/write-spec.md` 148 → 139 with it. Already close to the standard: the real finds were `map.md` naming `docs/spec/decisions.md` directly when Phase 4 says `write-spec.md` picks the file, and 3 of 6 hard rules being recaps
- [x] **A second pass on `global/CLAUDE.md` — done 2026-08-24.** Every section passes the always-loaded test and nothing moved out to a skill. What it did find: 2 over-long rules, a rebuttal clause, and 4 bare skill names
- [x] **The `/skill-name` sweep — done 2026-08-24.** `handoff/` and `research/` swept; `global/refs/study-cases.md` names no skill and never needed it. Bare backticks correctly still hold every ticket type and every status
- [ ] **`debug-web-pages`** — excluded until it is rebuilt on `browser-harness`

## Skills and commands

- [x] **`/run`, one command that runs any shell command** — replaces `/merge`, and covers `fmerge`, `ptree` and whatever comes next. Needs `|| true`, or a non-zero exit hands the model nothing. `threads.md` → `command-surface`
- [x] **`/start`'s routing line** — the status leads and the arrow points at the skill, nested under `feature` and `chore`
- [ ] **Rebuild `debug-web-pages` on `browser-harness`** — 1,059 lines to roughly 150: 54 in `SKILL.md`, 514 in `knowledge/`, 491 in 2 scripts. The capture transport dies, the investigation method stays. Waits for the move to Linux. `design-browser-tooling.md`
- [ ] **Introducing development skills** — **talk first**
- [ ] **`grill`** — decided and undesigned: a skill you fire at a finished artifact, `disable-model-invocation: true`, never model-invoked. **talk first**. `handoff.md`
- [ ] **Cold-reader `/grill`** — hand the stripped mechanism to subagents that never saw the conversation, so neither can defend it. **talk first**. `remaining.md`
- [ ] **A knowledge base per skill** — `docs/context/` has no shape for one and no self-improvement loop. `browser-harness` is the model: knowledge lives at `domain-skills/<host>/` and the navigation call surfaces it, so the agent never decides to look. Worth most once domain skills exist. **talk first**. `handoff.md`
- [ ] **What triggers `organize`** — the `review` status answers part of it; the wiring was never designed. **talk first**
- [ ] **The skill-creation trigger** — when a recurring pattern becomes a new skill, and who writes it. **talk first**. `design-skill-ecosystem.md` branch #6
- [ ] **Recommending a stack skill at install** — deferred because the catalog holds 8 process skills and no stack skills. **talk first**
- [ ] **Auditing current work against a skill's accumulated practice** — scope it to what the work touched, or the reads are unbounded. **talk first**
- [ ] **Is an in-session subagent dispatch the same document as a cross-session assignment?** `research/SKILL.md:49` describes the assign shape under another name. **talk first**. `remaining.md`
- [ ] **Whether a leaf ticket is always plannable in about 35 lines** — **parked**

## Rules and always-loaded files

- [x] **The two rejected explanations from 2026-08-23 — answered 2026-08-24.** `## Explaining` gained one idea per sentence, name the thing never point at it, and restate each question; `Define from zero` now reaches a word that is standard only inside a tool's own documentation. `writing.md` §5 widened to cover prose written to the user. `shit-explanations.md`
- [ ] **Merge `wip/study-cases/bad-explanations/` into `wip/context/shit-explanations.md`** — same class of failure, two folders. That file's own header asks for it
- [ ] **`## Explaining` in `global/CLAUDE.md` has no *UI is drawn, never described* bullet**, which the repo `CLAUDE.md` carries. A layout question in plain conversation loads no skill, so the rule has a moment with no owner. **talk first**
- [ ] **Two rules for `global/CLAUDE.md`, confirmed 2026-08-09, never written** — the agent may depart from the workflow, saying which part it set aside; and it records Flow's own faults unprompted. `remaining.md`
- [ ] **The repo `CLAUDE.md` states a rule that is now false** — that a command earns its place by running something before the model thinks. Claude Code merged commands into skills. `design-pickup.md`
- [ ] **Where the review paragraph lives** once a review step exists — the premise moved. `groundwork` Phase 3 is now *attack it before it stands*, delegating to `## Judgment`, so re-read it before deciding whether the question survives. **talk first**. `remaining.md`
- [ ] **Dependency discipline** — a check before any dependency is added, and how a bulk version bump gets reviewed. **talk first**
- [ ] **File size as its own review signal** — a small diff that pushes an already-large file past a healthy boundary. **talk first**
- [ ] **The negation split** — a prohibition where the agent breaks a rule under pressure, a positive recipe where the output comes out the wrong shape. **talk first**. `compression.md`
- [ ] **`wip` is banned as a word** — an abbreviation nobody expands. Covers `gsave.sh`, which generates `wip:` commit messages, and the folder rename already open below. `design-work-sync.md`
- [ ] **Move the git rule from `## Hard rules` into `## Preferences`**, once that section carries real content — **parked**

## Subagents and dispatch

- [ ] **Git worktrees** — a custom solution for git, and whether the ban on git mutations lifts with it. **talk first**
- [ ] **Parallel subagent calls** — blocked on git worktrees, and on `snapshot.js`, which records the whole tree either side of a dispatch and cannot tell two writers apart. **talk first**. `threads.md` → `execute-cost`
- [ ] **Tracking every session, subagent and tool call** — hooks carry `session_id`, `agent_id` and the file path natively, and are the only layer that can also block a call. Not designed. **talk first**. `wip/research/claude-audit.md`
- [ ] **Output contract, tool allowlist and model, per agent** — nothing fixes what a dispatched agent returns. **talk first**. `threads.md` → `extension-points`
- [ ] **Does `haiku-worker` survive at all?** — contested. **talk first**. `threads.md` → `extension-points`
- [ ] **What a parent can do to a subagent it dispatched** — revisit when one actually runs. **parked**. `threads.md` → `subagent-mechanics`

## Drawing

- [ ] **The ASCII engine** — hand it JSON, get back the drawing. You have read `design-ascii-engine.md` and mostly disagree with its recommendation; state your direction before anything in there gets argued. **talk first**
- [ ] **An SVG engine** — later than the ASCII one. It reopens the SVG ban, decided on a measured ~10 minutes and ~80k tokens per diagram in the main context, which a subagent changes. **talk first**. `threads.md` → `extension-points`
- [ ] **Excalidraw** — 3 third-party skills kept at `wip/excalidraw/`, still no verdict. **talk first**
- [ ] **Turn the glyph probe into a script** — `wip/research/ascii-glyph-probe.md` is evidence today. `scripts/glyph-probe.js` would make "show it to the user first" something the agent can carry out, and it has to render into a file as well as a terminal. `design-visualize-rework.md`

## Context and session boundaries

- [x] **Automate the resume after `/clear` — built 2026-08-24.** `handoff` writes a fenced `flow-open` block into `## State` or `handoff.md`, and `flow open` loads every file it names before the first turn. The `SessionStart` hook was not needed: `/start` is the second of the two typed steps, and `design-resume.md` set two as the ceiling
- [ ] **Nothing loads on a bare `/start` with no ticket and no path** — a `handoff.md` sits beside whichever thing is being worked, so there can be several and no id points at one. Left out of the 2026-08-24 build
- [ ] **Context engineering** — keep what loads as small as possible, and stop cache invalidation when a skill loads mid-session. **talk first**
- [ ] **Splitting `~/.claude/flow/notes.md`** — by kind, never by project. **parked**
- [ ] **A `PreCompact` hook** — a block-once state file, so auto-compaction gives way to `handoff`. The least important thing on this list, and the context-pulse hook beside it was deferred indefinitely 2026-08-08: at a 1M window you fire `handoff` yourself. **parked**

## Testing

- [ ] **Full end-to-end testing for every programmatic part** — `flow`, `ptree`, `fmerge`, `guard.js`. After the restructure, so the setup is written against a layout that has stopped moving
- [ ] **A test suite for `flow`** — about 2,000 lines of Node, verified only by hand. Every redesign has been walked command by command in a scratch tree, which is the case material. `handoff.md`
  - `tmp/proto-unfinished.sh` is 77 checks over `flow work`, written 2026-08-24, and `tmp/` is gitignored so it disappears on the next cleanup. Decide whether it is the first piece of this suite or a throwaway before that happens

## Repo structure

- [ ] **Restructure the repo** — the whole directory layout, and whatever state change makes the tooling, skills and commands easier to test
- [ ] **Group `skills/` into subcategories** — 10 skills sit flat today. This reverses the repo `CLAUDE.md` rule *"Flat for now"*, which gets rewritten when the grouping lands
- [ ] **Rename `wip/`** — nothing in the name says design lab
- [ ] **Move `tmp/model-creativity.md` into `wip/context/`**
- [ ] **Where general-purpose global scripts live** — `gsave` is not Flow-specific and the set keeps growing. **parked**. `remaining.md`

## The design record

- [ ] **`remaining.md` is stale under every BUILT heading** — those sections still carry content the 2 locked sections at the top later reversed
- [ ] **Restructure `remaining.md`** — move the migration steps out, split must from later, cut the settled argument out of the `[x]` items
- [ ] **`session-new-plugin.md` carries a stale "skills still to build" list**
- [ ] **`design-debug.md` still says "the red command"** in 3 places — the skill renamed it to "the failing check" 2026-08-24, so the origin record and the skill no longer share a word
- [ ] **`refactor-agenda.md`'s status table contradicts its own body** — row 10 says the writing pass reached `execute` on 2026-08-20 and the body says done 2026-08-22; row 11 says the `/start` routing line is open and its own section says done. The sections were updated and the table was not
- [ ] **Real commit messages** — changelogs are suspended until v1, so git is the only record of why something changed
- [ ] **Delete `design-explain-rework.md`?** — its stated condition landed 2026-08-12. Check first whether it still holds anything unique. **talk first**, either way

## Docs for whoever reads Flow

- [ ] **`README.md` still owes its real pass** — the surface sweep fixed the stale `flow` and `commands/` lines, and the install steps and layout section get rewritten once the restructure has moved paths
- [ ] **The guide** — the long form of `global/refs/workflow.md`, for a reader who knows none of this: every component, every decision, and the reasoning behind each

## Install and migration

- [ ] **The install skill** — one skill covering every starting state, and the last thing Flow gets. `threads.md` → `install`
- [ ] **The typed `flow`, `ptree`, `fmerge` and `gsave` run an old clone of this repo** — stopped at 2026-08-07, so `flow work` is unreachable by name. Still true 2026-08-24. `refactor-agenda.md` §8
- [ ] **Test built-in `/init` with `CLAUDE_CODE_NEW_INIT=1`** against a real repo first — it already does the codebase survey, the gap questions and a reviewable proposal
- [ ] **Migrate Delapse** — the real test, and where its conventions route into the project `CLAUDE.md` and `docs/context/`
- [ ] **Delete the project-local skills afterwards** — skills are global, one copy per machine
- [ ] **Harvest Delapse, `lumacraft_v2` and `framework-build` into skills** before that material is lost
- [ ] **Run `link.sh`** once the skill set is final
- [ ] **Repoint the stale `~/.local/bin` symlinks** — `ptree`, `flow`, `fmerge` and `gsave` all resolve into the deleted workbench repo, so `flow` runs old code. `refactor-agenda.md` item 8
- [ ] **Tune `guard.js`'s deny and ask lists** against real use — they were written from the rules, never against an observed false positive
- [ ] **An interview at install to fill `## The user`** — **parked**

## Research still to read

- [ ] **Expand `## Explaining` from the two ADHD skills** — both exist to stop an agent burying the answer, and neither is cloned yet: github.com/ayghri/i-have-adhd, github.com/UditAkhourii/adhd. Outranks the `deepseek-harness` read, because explanations to the user keep missing
- [ ] **Read `deepseek-harness` for ideas** — a plugin-based agent harness where everything is a plugin, cloned at `wip/research/deepseek-harness/`. Carries a second question: whether Flow ever runs outside Claude Code. Ranked last here — github.com/deepseek-ai/deepseek-harness
