# Backlog

Every open item in Flow, in one place. **An open item lives here and nowhere else** — the files under `lab/context/` keep the reasoning behind them, and none of those files is a work list.

- One line per item: what it is, then where the argument lives. Never the argument itself.
- A pointer names a file in `lab/context/` unless the line gives a path.
- **A finished item is deleted, never checked off.** Git holds what was done, `lab/context/` holds why. Cleared whole on 2026-08-30, 83 items.
- **State is a marker on the line, never a section.** **talk first** needs its own conversation before anything gets built. **parked** waits for a real case. **half done** marks a started item.
- **A section is an area, and the area is the only thing that decides where an item goes.** Everything about `flow` sits together, whatever state each piece is in.
- `## Next` carries the order and names items instead of repeating them.

## Next

1. **Splitting `home/CLAUDE.md`** — before the hard rules grow again
2. **Git worktrees** — the git toggle cleared the way, and worktrees unblock parallel dispatch
3. **End-to-end testing** — widen the two suites past the tests they hold now
4. **A manual page on what Claude Code already does** — features that would have replaced things Flow built
5. **The management skill** — last, and only once everything above is still

## The skill system

Settled 2026-08-26, built 2026-08-28, reversed on installation 2026-08-30 and rebuilt the same day. Flow keeps Claude Code's skills and adds 3 things: a group folder, which files a skill and decides only whether `drafts/` skips it; one shell line per skill for overlays; and a rule that a skill invoked over and over stays short. What a session is shown is per group — `phases/`, `commands/` and `tools/` on, `stack/` off, `standards/` decided per skill. Every argument is in `design-skills.md`.

- [ ] **`project-template/` ships no `.claude/settings.json`** — with `stack/` off by default, turning one on is the first thing a project needs, and there is no file to write it in. Decide whether the template carries an empty `skillOverrides` or the docs just say where to write one
- [ ] **Remove the `commands/` group and split its skills into semantic groups** — each skill moves to the group that fits what it does. **talk first**
- [ ] **`flow install` no longer prunes `~/.claude/commands/`** — a machine carrying an older Flow would keep dead links there beside the new skills. No machine has installed Flow, so nothing is broken; it belongs to the management skill
- [ ] **External skills** — 1 project copies the folder into `.claude/skills/` and commits it. Several projects means vendoring it into Flow's tree with its origin recorded, then linking it like any Flow skill
- [ ] **Plugins are a fourth install state Flow does not control** — off by default. `extraKnownMarketplaces` in the committed settings, `enabledPlugins` in `.claude/settings.local.json`, and a flip takes effect next session. `skillOverrides` is not an off switch: it leaves the commands and the hooks running
- [ ] **Test whether a plugin skill beats a Flow skill of the same name** — 1 run, when a plugin goes in
- [ ] **How a design plugin gets used** — what fires it, whether design work is its own phase, what happens when 2 of them disagree, the boundary with `/visualize`, what comes back into Flow afterwards. **Decided after the first real run in a project**, never before. Not essential; Flow works without one. **talk first**
- [ ] **`paths` in skill frontmatter** — loads a skill when the model touches a matching file. Rejected for `standards/` 2026-08-26: a standard loads early, from its description. Still open for `stack/`, where it costs nothing until it matches. **parked** until 1 project installs 5 or more `stack/` skills
- [ ] **`flow install --pin <name>`** — replaces one skill's symlink with a real copy, so clone edits stop reaching it. Designed and deferred 2026-08-30: a pin you must remember to remove freezes a skill silently. **parked** until the copy-into-drafts route annoys. `design-dev-loop.md`

## Individual skills

- [ ] **Rebuild `/web-pages` on `browser-harness`** — 1,059 lines to roughly 150: 54 in `SKILL.md`, 514 in `knowledge/`, 491 in 2 scripts. The capture transport dies, the investigation method stays. Waits for the move to Linux. It is also the 1 skill excluded from the writing pass until then. `design-browser-tooling.md`
- [ ] **`/file-findings` needs a rewrite** — it never learned the groups exist, so its `needs skill:` flag reaches the author without the one decision they make next; and it applies its method at step 4 but reports at step 7, where the wanted order is sort, shape, show the grouped plan, take feedback, then write. **talk first**. `design-commands-as-skills.md`
- [ ] **Introducing development skills** — skills that help build and improve Flow itself, not skills about writing code. `dev/` is the group, `/flow-review` is the first skill
- [ ] **`/grill`** — decided and undesigned: a skill you fire at a finished artifact, `disable-model-invocation: true`, never model-invoked. **talk first**
- [ ] **Cold-reader `/grill`** — hand the stripped mechanism to subagents that never saw the conversation, so neither can defend it. **talk first**. `remaining.md`
- [ ] **A knowledge base per skill** — `docs/context/` has no shape for one and no self-improvement loop. `browser-harness` is the model: knowledge lives at `domain-skills/<host>/` and the navigation call surfaces it, so the agent never decides to look. Worth most once domain skills exist. **talk first**
- [ ] **What triggers `organize`** — the `review` status answers part of it; the wiring was never designed. **talk first**
- [ ] **The skill-creation trigger** — when a recurring pattern becomes a new skill, and who writes it. **talk first**
- [ ] **Recommending a stack skill at install** — the catalog holds 8 process skills and 1 stack skill, and `stack/` is now off by default, so nothing turns one on. **talk first**
- [ ] **Auditing current work against a skill's accumulated practice** — scope it to what the work touched, or the reads are unbounded. **talk first**
- [ ] **Is an in-session subagent dispatch the same document as a cross-session assignment?** `research/SKILL.md:49` describes the assign shape under another name. **talk first**. `remaining.md`
- [ ] **Whether a leaf ticket is always plannable in about 35 lines** — **parked**

## `flow`, the tool

- [ ] **The 4 rules for what a `docs/context/` file may hold ship nowhere** — one question per file, facts not process, verified only, rewrite never append. `home/CLAUDE.md` names the folder and says none of this. `design-project-docs.md`
- [ ] **Frontmatter on files other than tickets**, spec files first — **parked**

## Rules and always-loaded files

- [ ] **Split `home/CLAUDE.md` before the hard rules grow again** — the always-loaded file only grows, and many more hard rules are coming. Two destinations: reference files it points at, and skills that fire on a situation. The example the user named is a skill firing whenever the agent plans a change, edits a file or runs a plan, carrying every rule about changing files. What it decides is which rules must be in context from turn 1 and which can arrive when they apply. **talk first**
- [ ] **Re-ask the 7 rejected questions in a scratch session**, against the rebuilt `## Explaining`. The rewrite is unmeasured until then, and 6 earlier rounds of rule-writing were never tested either. Only the newest is in `shit-explanations.md`; the other 6 are in git — `git log -p -- lab/context/shit-explanations.md`
- [ ] **`## Explaining` in `home/CLAUDE.md` has no *UI is drawn, never described* bullet**, which the repo `CLAUDE.md` carries. A layout question in plain conversation loads no skill, so the rule has a moment with no owner. **talk first**
- [ ] **Where the review paragraph lives** once a review step exists — the premise moved. `/groundwork` Phase 3 is now *attack it before it stands*, delegating to `## Judgment`, so re-read it before deciding whether the question survives. **talk first**. `remaining.md`
- [ ] **Dependency discipline** — a check before any dependency is added, and how a bulk version bump gets reviewed. **talk first**
- [ ] **File size as its own review signal** — a small diff that pushes an already-large file past a healthy boundary. **talk first**
- [ ] **The negation split** — a prohibition where the agent breaks a rule under pressure, a positive recipe where the output comes out the wrong shape. **talk first**. `compression.md`
- [ ] **A `UserPromptSubmit` hook reinforcing `## Explaining` rules**: appends a short reminder to every user message. **talk first**
- [ ] **Rewrite `home/CLAUDE.md` against `style.md`**: written with Opus 5, unintelligible lines throughout. Full pass, not patches

## `util`, the utility CLI

Locked 2026-08-30 and built the same day, all 3 namespaces; `util install` followed on 2026-08-31. A second command-line tool, separate from `flow`, holding every general-purpose script. Its own repository, a submodule of this one at `lab/util/`. Every argument is in `design-util.md`, and `## Built 2026-08-30` there says what shipped and the decisions the design did not carry.

- [ ] **`git init` never runs without `-b main`** anywhere in Flow — the install skill, the manual, any script that creates a repository. The `util` rename is what this is protecting against repeating
- [ ] **Rewrite the toolbox** — external tools filed by job, and nothing loads it today. It is a submodule at `lab/toolbox/`, added 2026-09-01, and the rewrite happens there on `lab/util/`'s terms. `repos/toolbox` is the old plain clone and is redundant now

## Subagents and dispatch

- [ ] **Git worktrees** — a custom solution for git. The git toggle no longer blocks it: `worktree` is instructed, so `guard.js` passes `worktree add` whatever the mode says. What is left is the `EnterWorktree` and `Agent(isolation:worktree)` denies in `home/settings.json`, both holds rather than verdicts, and who merges the work back. **talk first**. `threads.md` → `subagent-mechanics`
- [ ] **Parallel subagent calls** — blocked on git worktrees, and on `snapshot.js`, which records the whole tree either side of a dispatch and cannot tell two writers apart. **talk first**. `threads.md` → `execute-cost`
- [ ] **Output contract, tool allowlist and model, per agent** — nothing fixes what a dispatched agent returns. **talk first**. `threads.md` → `extension-points`
- [ ] **Does `haiku-worker` survive at all?** — contested. **talk first**. `threads.md` → `extension-points`
- [ ] **What a parent can do to a subagent it dispatched** — revisit when one actually runs. **parked**. `threads.md` → `subagent-mechanics`

## The audit

Built 2026-09-02, over the transcripts Claude Code already writes. `flow audit` indexes them into a SQLite file, answers queries against it, and opens a bounded turn range of the original conversation when the counts are not enough. Nothing is recorded and nothing is intercepted. `design-audit.md` carries the design.

- [ ] **A run is not wired to anything** — `run` and `run_session` are built and empty, every query treats them as optional, and nothing writes a row. A `SessionStart` hook has `session_id` and `cwd`, and `statuses.js` says which ticket is in flight. It also fires on `compact`, so a naive hook counts one session 4 times. **talk first**
- [ ] **Nothing scores a session against Flow's own rules** — no skill exists yet to do this. `/insights` scores friction as 5 fixed categories and caches the result per session; ours would be edited-before-approval, writing pass skipped, stopped at a checkpoint, `ls` where `util fs tree` is mandated. Deterministic where the index can decide it, and a model call only for what it cannot
- [ ] **The daily sweep is a second mode** — analysing every session since yesterday is batch, and batch wants parallel dispatch, which is blocked on git worktrees. The deterministic half runs at zero token cost over every new session and escalates only what it flags
- [ ] **`flow audit prune`** — `cleanupPeriodDays` is 365, so nothing bounds `~/.claude/projects/` for a year, and the index is 44 MB against 241 MB of transcripts as of 2026-09-02. Prune by run rather than by age, delete only what the index has fully read, and never sweep what a study case pins
- [ ] **A subagent's transcript is indexed and unreachable** — each one becomes its own session row carrying `agent_of`, and no query joins on it. A subagent's tool calls do not appear in its parent's totals
- [ ] **`~/.flow/workflow-notes.md` and study cases cite the audit** — both become readers of it. A case still extracts and commits what it cites, because the index is machine-local and the transcripts are swept. `references/study-cases.md` justifies writing one immediately because the conversation is the only copy, and retention weakens that premise. **talk first**
- [ ] **A file read inside a script is invisible** — `node build.js` opens a hundred files and the transcript records one command. Nothing recovers those, so every file count is a floor. Worth stating wherever a count is printed, and worth revisiting if a hook can see further

## The Claude Code reference

What Claude Code actually does, written down and kept current, so no session re-derives it. Started 2026-09-01 after a design ran on guesses that `claude-directory.md` and `sessions.md` had already answered. **It grows without limit** — every verified mechanic goes in, and the hard rule in `CLAUDE.md` sends every question here and to the docs before any experiment. The pages live in `docs/dev/`, decided 2026-09-02; `design-audit.md` carries the argument.

- [ ] **Write the first page** — `docs/dev/claude-code.md`. Session lifecycle is the subject already verified: what starts and ends a session, what compaction, `/clear`, `--resume` and `/branch` each do to the id, and where transcripts and subagent transcripts land on disk
- [ ] **The subjects still unwritten** — load order at startup, when `CLAUDE.md` is re-read and what invalidates the cache, how skills load and unload, every hook and what it can intervene in, how files are read and spilled, what survives compaction. **talk first**
- [ ] **Every page cites a published URL, never the clone** — `lab/research/claude-code-docs/` is Anthropic's documentation cloned for reading and it gets deleted. A mechanic verified by experiment says so instead, and says which version it was measured on
- [ ] **Deleting the clone breaks the pointers into it** — the `CLAUDE.md` hard rule on reading the docs names `lab/research/claude-code-docs/` and its `llms.md` index, and 2 lines in this file cite pages inside it. All of them go stale that day. Sweep them to URLs before the delete, not after
- [ ] **The `docs/dev/` pages need a full rewrite**: structure, wording, and the table of contents format across every page

## Drawing

- [ ] **The ASCII engine** — hand it JSON, get back the drawing. You have read `design-ascii-engine.md` and mostly disagree with its recommendation; state your direction before anything in there gets argued. **talk first**
- [ ] **An SVG engine** — later than the ASCII one. It reopens the SVG ban, decided on a measured ~10 minutes and ~80k tokens per diagram in the main context, which a subagent changes. **talk first**. `threads.md` → `extension-points`
- [ ] **Excalidraw** — 3 third-party skills kept at `lab/excalidraw/`, still no verdict. **talk first**
- [ ] **`visualize/references/draw-mockups.md`'s editor mockup shows a stale tree** — `refs` and `global`, both gone since the restructure. It is example content inside an alignment-critical ASCII box, so fixing the strings means redrawing the box
- [ ] **Turn the glyph probe into a script** — `lab/research/ascii-glyph-probe.md` is evidence today. `scripts/glyph-probe.js` would make "show it to the user first" something the agent can carry out, and it has to render into a file as well as a terminal. `design-visualize-rework.md`

## Context and session boundaries

- [ ] **Nothing loads on a bare `/start` with no ticket and no path** — a `handoff.md` sits beside whichever thing is being worked, so there can be several and no id points at one. Left out of the 2026-08-24 build
- [ ] **A dropped file path costs a whole extra turn** — dragging a file from the editor into the terminal pastes its absolute path in quotes, and that is the only easy way to name a file `@` cannot find or that git ignores. The agent then spends one turn seeing the path and a second reading the file. Wanted: the content arrives with the prompt. `UserPromptSubmit` is the shape — it fires before the model processes the prompt and its stdout is added as context, so a hook could read every quoted absolute path and print the file. Undesigned. **talk first**. `lab/research/claude-code-docs/hooks.md`
- [ ] **Context engineering** — keep what loads as small as possible, and stop cache invalidation when a skill loads mid-session. **talk first**
- [ ] **Splitting `~/.flow/workflow-notes.md`** — by kind, never by project. **parked**
- [ ] **A `PreCompact` hook** — a block-once state file, so auto-compaction gives way to `/handoff`. The least important thing on this list, and the context-pulse hook beside it was deferred indefinitely 2026-08-08: at a 1M window you fire `/handoff` yourself. **parked**

## Testing

- [ ] **Full end-to-end testing for every programmatic part** — `flow` and `guard.js` here, `fs tree` and `fs merge` in `util` once they move. The harness landed 2026-08-28 with 7 tests and holds 15 here and 29 in `util`, which prove the wiring and almost none of the behavior
- [ ] **A test suite for `flow`** — about 2,000 lines of Node, verified only by hand. Every redesign has been walked command by command in a scratch tree, which is the case material
  - `tmp/proto-unfinished.sh` was 77 checks over `flow work`, written 2026-08-24. **It is gone** — `tmp/` is gitignored, so git never held a copy and nothing was salvaged. Those checks get written again from scratch

## Repo structure

Built 2026-08-28. `design-restructure.md` carries the plan, the delete list and the verified facts.

- [ ] **Set up the dev checkout** — `git worktree add ../flow-dev <branch>`, so a multi-file rework is testable without reaching any real project. Works today with no code change: `lib/clone.js` derives the clone from `__dirname`, so a `try.sh` in the dev checkout installs the dev checkout. `design-dev-loop.md`

## The design record

- [ ] **`design-debug.md` still says "the red command"** in 3 places — the skill renamed it to "the failing check" 2026-08-24, so the origin record and the skill no longer share a word
- [ ] **Real commit messages** — changelogs are suspended until v1, so git is the only record of why something changed

## Docs for whoever reads Flow

- [ ] **A manual page on what Claude Code already does** — `/run` spent months doing a worse version of shell mode, a built-in feature nobody knew was there, and was deleted the day it surfaced. The page lists the built-ins worth knowing and the Flow-shaped mistake each one prevents: shell mode against building a command skill, `permissions.deny` being additive against any switch layered over it, the documented hook payload against guessing what a hook receives. It grows every time a feature turns out to have been there all along. **talk first** on where it sits — its own page, or a section of one that exists
- [ ] **`docs/manual/` is designed and unwritten** — official documentation for a stranger, A to Z, 6 sections grouped by why you are reading, indexed by `README.md`. The first thing someone reads after cloning. Nothing gets written until the workflow is finished and the install skill exists. `design-public-docs.md` carries the whole design, `lab/research/doc-design/` the evidence

## Install and migration

- [ ] **The management skill** — Flow's whole life in one skill, and the last thing Flow gets. Installing is one job inside it: every starting state, then updating a machine, re-installing over the two personalised files, converting a project that has its own workflow, and every migration after that. **Far larger than an installer**, decided 2026-09-01. `threads.md` → `install`, and `design-project-docs.md` for what a migration harvests
- [ ] **The management skill diffs the 2 personalised files on re-install** — `~/.claude/CLAUDE.md` and `~/.claude/settings.json` are copied then personalised, so a new Flow version never reaches them. Everything else updates with `git pull`, because every other path is a symlink. That is the whole migration problem. `design-dev-loop.md`
- [ ] **Flow's install steps name `util` first** — the dependency landed 2026-08-30 with the move of `ptree` and `fmerge`. `home/CLAUDE.md` mandates `util fs tree` in every session, and `open.js` runs `util fs merge` off `PATH`. The management skill checks for `util` before anything else. Only acceptable while `util` is public. `design-util.md`
- [ ] **The management skill reads `docs/` before writing into it** — a project that already has `docs/spec/` or `docs/research/` needs those merged, never overwritten. The working store moving to `.flow/` on 2026-08-30 removed most of the collision and not this part. `design-public-docs.md` → `## The docs collision`
- [ ] **`docs/intake/` has no always-loaded mention** — it holds a project's pre-Flow material, and the `## References` section that named it was deleted from `home/CLAUDE.md` on 2026-08-29. `references/workflow.md` is the only file naming it now, and that loads only when the workflow is unclear. Its real owner is the management skill
- [ ] **Every typed command runs a dead clone** — `flow`, `ptree`, `fmerge` and `gsave` resolve through `~/.local/bin` into the workbench repo deleted on 2026-08-07, so `flow work` is unreachable by name and `flow` runs old code. `flow install` repoints `flow` and `fw`, and `util install` adds `util` and `u`. The 3 old names belong to nobody now and get deleted by hand. Waits until the skill set is final. `refactor-agenda.md` §8
- [ ] **Test built-in `/init` with `CLAUDE_CODE_NEW_INIT=1`** against a real repo first — it already does the codebase survey, the gap questions and a reviewable proposal
- [ ] **Migrate Delapse** — **parked** until the workflow is finished. The real test, and where its conventions route into the project `CLAUDE.md` and `docs/context/`. `design-project-docs.md` carries the routing test and the 2026-07-29 survey of its docs
- [ ] **Keep Delapse's project-local skills, converted** — **parked** with the migration. Reversed 2026-08-26. They are not Flow's skills. With `.claude/flow/skills` gone, each one is either copied into `<project>/.claude/skills/<name>/` and committed with Delapse, or vendored into Flow's tree under a group when a second project wants it. `design-skills.md`
- [ ] **Harvest Delapse, `lumacraft_v2` and `framework-build` into skills** before that material is lost — **parked** with the migration, and the material sits in repositories that are not going anywhere
- [ ] **Tune `guard.js`'s deny and ask lists** against real use — they were written from the rules, never against an observed false positive
- [ ] **An interview at install to fill `## The user`** — **parked**

## Other people, other models

- [ ] **Name what in Flow is Claude Code and what is portable** — **talk first**, and the first step of everything below. Skills, hooks, `~/.claude/`, `settings.json`, subagents and the audit are one vendor's shapes. The rules, the ticket model, the phases and `util` are not. Nothing records the split
- [ ] **Run Flow on models other than Claude** — **talk first**. GPT, Qwen and GLM are the targets. Claude Code speaks only the Anthropic Messages API, and gateway model discovery keeps an id only when it contains `claude` or `anthropic`. Whether a translating proxy defeats that filter is open, and the research decides it. `lab/research/claude-code-docs/llms.md` indexes the gateway protocol page
- [ ] **Survey the harnesses that could host Flow besides Claude Code** — **talk first**. Codex, `deepseek-harness`, and whatever else the search turns up. Each one splits Flow differently, so the survey sizes the portability work
- [ ] **Build Flow for a stranger** — **talk first**. `home/CLAUDE.md` carries a personal profile, the install has never run on a second machine, and no page explains Flow to somebody who has never seen it. A setup script is fine, and a one-command npm install is not required

## Research still to read

- [ ] **Read `agent-toolkit/skills/game-changing-features` and `adhd` for `/groundwork`'s idea generation** — **after the V1 release**. Both produce ideas rather than shape one, which is the half `/groundwork` does least: `game-changing-features` forces the *what would make this 10x more valuable* question, and `adhd` is a divergent-ideation engine. `adhd` was already read once, on 2026-08-29, for its writing rules only — this is a different question and the earlier verdict does not carry. `bash lab/scripts/repos.sh` restores both
- [ ] **Read `claude-task-master` for initialization, the ticket system and the workflow shape** — **after the V1 release**. An AI task-management system that drops into Cursor, Windsurf, Roo and others, 28k stars, JavaScript, last pushed 2026-04-28. It is the closest thing to a direct competitor Flow has: it solves the same ticket problem for many editors where Flow solves it for one, so its onboarding and its task model are the 2 things to read. github.com/eyaltoledano/claude-task-master
- [ ] **Read `deepseek-harness` for ideas** — a plugin-based agent harness where everything is a plugin, cloned at `repos/deepseek-harness/`. Ranked last here. `## Other people, other models` now carries the portability question it raised — github.com/deepseek-ai/deepseek-harness
