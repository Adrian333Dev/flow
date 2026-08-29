# Backlog

Every open item in Flow, in one place. **An open item lives here and nowhere else** — the files under `lab/context/` keep the reasoning behind them, and none of those files is a work list.

- One line per item: what it is, then where the argument lives. Never the argument itself.
- A pointer names a file in `lab/context/` unless the line gives a path.
- `- [ ]` open, `- [x]` done. A partly done item carries **half done** on its line.
- **A section is an area, and the area is the only thing that decides where an item goes.** Everything about `flow` sits together, whatever state each piece is in.
- **State is a marker on the line, never a section.** **talk first** needs its own conversation before anything gets built; **parked** waits for a real case.
- `## Next` carries the order, and names items instead of repeating them.
- Once a section has no open item left, delete its checked items. Git holds them.

## Next

1. **Try the skills build in a real session** — `bash scripts/try.sh`, then watch whether a fresh session reaches for the right skill from its description alone. The only test that decides whether the descriptions are right, and the one thing the `-p` runs of 2026-08-29 could not stand in for. `design-skills.md`, `design-commands-as-skills.md`
2. **End-to-end testing** — widen the `node --test` suite past the 17 tests it holds now
3. **The install skill, then Delapse** — last, and only once everything above is still

## Skills

Settled 2026-08-26, revised and **built 2026-08-28**. Flow keeps Claude Code's skills and adds 4 things: a group folder that only files a skill, every skill installed everywhere and on by default, with `skillOverrides` in a project turning off what it does not want, one shell line per skill for overlays, and a rule that a skill invoked over and over stays short. The playbook mechanism locked the day before is rejected in full. Every argument is in `design-skills.md`, and what is left open below is the plugin half, which waits for a real plugin.

- [x] **`flow overlays get <name>` — built 2026-08-28.** Prints the file, stops, and stays silent both when there is no overlay and when there is no repo. 3 tests
- [x] **One line at the bottom of each skill — done 2026-08-28.** All 10 carry `` !`flow overlays get <name>` ``. The other 2 halves were already true: no skill had an `argument-hint`, and no description carried a ticket id
- [x] **`home/skills` — written 2026-08-28.** The 9 that install globally, `#` for a comment, read by `flow install`
- [x] **`flow skills` — `ls`, `get`, `add`, `sync`, built 2026-08-28.** `add` refuses a name already in `home/skills`; `sync` warns about a name whose skill is gone and links the rest, so one stale line never blocks a clone
- [x] **`flow` resolves the clone from `__dirname` — done 2026-08-28.** `lib/clone.js`, and `open.js` now reaches `fmerge.js` through it rather than resolving its own
- [x] **`project-template/` — done 2026-08-28.** The 2 `.gitignore` lines, an empty `.claude/flow/skills`, and `.claude/flow/overlays/.info` so the folder commits. All 4 gitignore cases verified in a real repo: a folder tracks, a symlink either kind does not
- [x] **Group the 10 skills — done 2026-08-28.** 5 in `phases/`, 4 in `tools/`, 1 in `stack/`, and `standards/` held by a `.info`. Only 2 paths in the repo broke, because a link is flat and named for the skill
- [x] **Rewrite the 10 descriptions — done 2026-08-28.** Trigger out, what it is and what it covers in. **The real-session test has not run** — that is `## Next` item 1
- [x] **The phase routing block — done 2026-08-28.** `home/CLAUDE.md` → `## Which skill`, 5 outcomes on one decision. It absorbed the `Reach for a skill` bullet from `## Hard rules`, which said the same thing
- [x] **1 trigger line each for `research`, `visualize` and `handoff` — done 2026-08-28**, under the same heading
- [x] **`research` gains a search step — done 2026-08-28.** `## Look for one that already exists`: outward first, then `flow skills ls`, judge knowledge over process, write down what came back including nothing
- [x] **`cut-from-spec` becomes typed-only — done 2026-08-28.** `disable-model-invocation: true`, description down to 61 characters
- [x] **The no-argument rule — written 2026-08-28** into the repo `CLAUDE.md` and into `write-skills.md`, which ships
- [x] **The verb-first naming rule — gone 2026-08-28**, from the repo `CLAUDE.md` and from `write-skills.md`'s frontmatter block
- [x] **Commands merged into skills — done 2026-08-29.** Claude Code made a command a skill without a folder, so `start.md` and `run.md` became `SKILL.md` files in a fifth group, `skills/commands/`, beside `handoff` and `file-findings`. The top-level `commands/` folder is gone and `flow install` no longer links one. `design-commands-as-skills.md`
- [x] **The no-argument rule replaced — done 2026-08-29.** A render that differs between invocations is appended whole, so a short skill may take arguments and a long one may not. Rewritten in the repo `CLAUDE.md` and in `write-skills.md`
- [x] **`debug-web-pages` → `web-pages` — done 2026-08-29.** The skill investigates and never debugged, and a `stack/` skill is named for what it touches
- [x] **The 12 descriptions compressed again — done 2026-08-29.** Roughly 2,200 characters down to 1,050. `home/CLAUDE.md` → `## Which skill` became `## Workflow`, a pipeline carrying the order and the artifacts instead of 9 descriptions restated
- [x] **Every skill installs and every one is on by default — done 2026-08-29.** All 12 named in `home/skills`, and `home/settings.json` sets `skillOverrides` for none of them. A project turns off what it does not want in its own `.claude/settings.json`, so that file is the list of what is off there. Verified in 6 `-p` runs against Claude Code 2.1.251. `design-skills.md` → `## Installing and showing`
- [x] **Off-by-default reversed twice, then dropped — 2026-08-29.** `name-only` then `user-invocable-only` were both proposed as the machine default and both rejected: on a machine with one author, needing every skill everywhere, the default that has to be configured is the wrong one. `name-only` is never the value anywhere — it removes the description and leaves the skill invocable
- [x] **Naming a hidden skill in `~/.claude/CLAUDE.md` — rejected 2026-08-29.** That file loads everywhere, so a browser skill would announce itself in projects with no browser. Discovery is `flow skills ls` or reading `settings.json`, both of which already work
- [x] **`cut-from-spec` moved to `commands/` — done 2026-08-29.** `commands/` holds every skill the user mainly invokes and wins wherever two groups fit. `phases/` now holds 4. Closed by the user; do not reopen
- [x] **A second description pass — done 2026-08-29.** 5 of the 8 loaded descriptions were restating their own `## Workflow` line, which is the cost the 08-28 pass existed to remove. 1,269 characters to 1,077 over 12 skills, and 1,011 to 736 of what actually loads
- [x] **The `/skill-name` sweep for the new rule — done 2026-08-29.** `writing.md` §6 gained *name a skill with its slash* and nothing swept what already broke it, `writing.md` itself included. 11 names across `references/workflow.md`, `references/writing.md`, `home/settings.md`, `research/SKILL.md` and `fetch-docs.sh`. A status, a ticket type and the `debug` agent stay bare
- [x] **`/start` gained its overlay line — done 2026-08-29.** A project with its own ticket type has a routing table to override. `/run` has none and wants none: a shell passthrough has nothing to extend
- [x] **`flow skills add` stays — decided 2026-08-29.** It refuses a name already global, and every Flow skill is one, so it has no users today. Kept rather than archived: the install design is young enough to be reversed, and this is the command a reversal needs back. `design-skills.md` → `## Installing and showing`
- [ ] **`flow install` no longer prunes `~/.claude/commands/`** — a machine carrying an older Flow would keep dead links there beside the new skills. No machine has installed Flow, so nothing is broken; it belongs to the install skill
- [ ] **`project-template/` ships no `.claude/settings.json`** — a project that wants a skill at `on` has to create the file. Decide whether the template carries an empty `skillOverrides` or the docs just say where to write one
- [ ] **`/file-findings` needs a rewrite** — it never learned the groups exist, so its `needs skill:` flag reaches the author without the one decision they make next; and it applies its method at step 4 but reports at step 7, where the wanted order is sort, shape, show the grouped plan, take feedback, then write. **talk first**. `design-commands-as-skills.md`
- [ ] **External skills** — 1 project copies the folder into `.claude/skills/` and commits it. Several projects means vendoring it into Flow's tree with its origin recorded, then linking it like any Flow skill
- [ ] **Plugins are a fourth install state Flow does not control** — off by default. `extraKnownMarketplaces` in the committed settings, `enabledPlugins` in `.claude/settings.local.json`, and a flip takes effect next session. `skillOverrides` is not an off switch: it leaves the commands and the hooks running
- [ ] **Test whether a plugin skill beats a Flow skill of the same name** — 1 run, when a plugin goes in
- [ ] **How a design plugin gets used** — what fires it, whether design work is its own phase, what happens when 2 of them disagree, the boundary with `visualize`, what comes back into Flow afterwards. **Decided after the first real run in a project**, never before. Not essential; Flow works without one. **talk first**
- [ ] **`paths` in skill frontmatter** — loads a skill when the model touches a matching file. Rejected for `standards/` 2026-08-26: a standard loads early, from its description. Still open for `stack/`, where it costs nothing until it matches. **parked** until 1 project installs 5 or more `stack/` skills
- [x] **`disableBundledSkills` — already set 2026-08-28**, with `disableWorkflows` beside it in `home/settings.json`. Carried as undecided for weeks

## `flow`, the tool

- [x] **The `flow` command redesign** — one shape, statuses as data, prefix matching, per-command flag declarations. The rules are in `references/cli-design.md`
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
- [x] **Prefix matching out, a default action in — done 2026-08-29.** `cases`, `skills` and `overlays` read a word naming no action as an argument to `get`, which is the rule the flat namespace already runs one level up. `work` names no default: its `get` writes over the folder you are standing in. `fw` is a second `~/.local/bin` name for `flow`. `design-commands-as-skills.md`
- [ ] **`flow skills ls` prints `global` on every row** — every skill installs, so the `INSTALLED` column carries no information. It should print each skill's override state instead, read from the machine's settings and the project's. That is what makes the command answer *what did this project turn off*, which is the only way an agent finds out. `design-skills.md` → `## Installing and showing`
- [ ] **Frontmatter on files other than tickets**, spec files first — **parked**
- [ ] **The 4 rules for what a `docs/context/` file may hold ship nowhere** — one question per file, facts not process, verified only, rewrite never append. `home/CLAUDE.md` names the folder and says none of this. `design-project-docs.md`

## The writing pass

Each read end to end against `references/writing.md`: plan the sections, then test every sentence. It is a compression pass as well.

- [x] **`execute`** — 207 → 178 lines, 2513 → 2110 words. Instruct, do not justify. 100 was unreachable without cutting rules; `design-pickup.md` records what a real path there would cost
- [x] **`references/review-code.md:3` says "Read at Phase 4" — never a task.** The rewrite moved no phase number, so the line is correct as written
- [x] **`debug` — done 2026-08-24**, 114 → 119 lines. All 4 parked changes landed: the paste-it-back exchange is now a loop, the check is defined as a command *or* a sequence the user runs, "the red command" is "the failing check" everywhere, and both meaningless lines were rewritten with examples
- [x] **`file-findings` — done 2026-08-24**, 68 → 56 lines. `write-skills.md` moved to `references/`, so no file sits at any skill root now. Method leads, inputs follow it, `## Hard rules` was 6 recaps and went
- [x] **`handoff` — done 2026-08-24**, inside the `flow open` build. Gained the `flow-open` block section, and `## Capture` is named in the global `CLAUDE.md` rather than the project one, which was the bug on the old line 97
- [x] **`prototype` — done 2026-08-24**, 88 → 77 lines. `/visualize` swept, the appearance branch moved out from under *What the ticket must carry* into `## When it is not a prototype`, `## Hard rules` folded 3 unique rules back and went
- [x] **`research` — done 2026-08-24**, 102 → 86 lines. The description listed the workflow, which `writing.md` §8 names as the failure that gets followed instead of the file
- [x] **`write-tickets` — done 2026-08-24**, 62 → 54 lines
- [x] **`groundwork` — done 2026-08-24**, 259 → 256 lines, and `groundwork/references/write-spec.md` 148 → 139 with it. Already close to the standard: the real finds were `map.md` naming `docs/spec/decisions.md` directly when Phase 4 says `write-spec.md` picks the file, and 3 of 6 hard rules being recaps
- [x] **A second pass on `home/CLAUDE.md` — done 2026-08-24.** Every section passes the always-loaded test and nothing moved out to a skill. What it did find: 2 over-long rules, a rebuttal clause, and 4 bare skill names
- [x] **The `/skill-name` sweep — done 2026-08-24.** `handoff/` and `research/` swept; `references/study-cases.md` names no skill and never needed it. Bare backticks correctly still hold every ticket type and every status
- [ ] **`/web-pages`** — excluded from the writing pass until it is rebuilt on `browser-harness`

## Skills and commands

- [x] **`/run`, one command that runs any shell command** — replaces `/merge`, and covers `fmerge`, `ptree` and whatever comes next. Needs `|| true`, or a non-zero exit hands the model nothing. `threads.md` → `command-surface`
- [x] **`/start`'s routing line** — the status leads and the arrow points at the skill, nested under `feature` and `chore`
- [x] **`write-tickets` → `cut-from-spec`, narrowed 2026-08-25.** An audit found nearly all its general content already in `groundwork` Phase 4 or `home/CLAUDE.md` — one rule, `deps` for order, existed nowhere else and was copied across. The skill earns its place on the trigger, not the content: months later the pool is empty, the spec has `V1` work left, and nothing else fires there
- [x] **`/debug` — 5 changes 2026-08-25.** Look for your own way in before asking the user, three handback exits not two, the handback ticket is thin and points at the report, the report has a no-ticket home, and the heading matches the words the skill already uses
- [x] **`/handoff` — the `## State` rewrite splits 2026-08-25.** `Now` and `Touched` are rewritten whole, `Found` and `Open` are added to and pruned. A ticket's `## References` is written as the work moves, and `Found` routes out before the section dies at `review`
- [ ] **Rebuild `/web-pages` on `browser-harness`** — 1,059 lines to roughly 150: 54 in `SKILL.md`, 514 in `knowledge/`, 491 in 2 scripts. The capture transport dies, the investigation method stays. Waits for the move to Linux. `design-browser-tooling.md`
- [ ] **Introducing development skills** — skills that help build and improve Flow itself, not skills about writing code. **talk first**
- [ ] **`grill`** — decided and undesigned: a skill you fire at a finished artifact, `disable-model-invocation: true`, never model-invoked. **talk first**
- [ ] **Cold-reader `/grill`** — hand the stripped mechanism to subagents that never saw the conversation, so neither can defend it. **talk first**. `remaining.md`
- [ ] **A knowledge base per skill** — `docs/context/` has no shape for one and no self-improvement loop. `browser-harness` is the model: knowledge lives at `domain-skills/<host>/` and the navigation call surfaces it, so the agent never decides to look. Worth most once domain skills exist. **talk first**
- [ ] **What triggers `organize`** — the `review` status answers part of it; the wiring was never designed. **talk first**
- [ ] **The skill-creation trigger** — when a recurring pattern becomes a new skill, and who writes it. **talk first**
- [ ] **Recommending a stack skill at install** — deferred because the catalog holds 8 process skills and no stack skills. **talk first**
- [ ] **Auditing current work against a skill's accumulated practice** — scope it to what the work touched, or the reads are unbounded. **talk first**
- [ ] **Is an in-session subagent dispatch the same document as a cross-session assignment?** `research/SKILL.md:49` describes the assign shape under another name. **talk first**. `remaining.md`
- [ ] **Whether a leaf ticket is always plannable in about 35 lines** — **parked**

## Rules and always-loaded files

- [x] **The two rejected explanations from 2026-08-23 — answered 2026-08-24.** `## Explaining` gained one idea per sentence, name the thing never point at it, and restate each question; `Define from zero` now reaches a word that is standard only inside a tool's own documentation. `writing.md` §5 widened to cover prose written to the user. `shit-explanations.md`
- [ ] **`## Explaining` in `home/CLAUDE.md` has no *UI is drawn, never described* bullet**, which the repo `CLAUDE.md` carries. A layout question in plain conversation loads no skill, so the rule has a moment with no owner. **talk first**
- [x] **The toolbox is out of the workflow — 2026-08-25.** The `## References` bullet in `home/CLAUDE.md` and the `~/.claude/flow/toolbox` symlink in `README.md` are gone. The submodule stays in the repo, so every repo rule about it stands
- [x] **`references/writing.md` §9 keeps its toolbox example — kept 2026-08-25.** It quotes the deleted bullet as the before/after for *state the test, delete the illustrations*, and an example routes nobody anywhere. Replacing it would cost a hunt for another real pair and buy nothing
- [ ] **`references/writing.md` states one scope and holds two** — its sentence and word-choice rules govern anything Flow writes, including a `docs/` page that never enters a session; its shape and compression rules govern only a file that loads into context. §6 mixes both and splits into 2 sub-lists. **Held** while a second session restructures the file; the edit lands against whatever numbering survives. `design-public-docs.md` → `## Writing style`
- [ ] **`## Explaining` needs *resolve the referent*** — restating the user's words preserves their looseness, which is how a name the repo carries three times gets used bare. **talk first**. `shit-explanations.md` 2026-08-25
- [ ] **Two rules for `home/CLAUDE.md`, confirmed 2026-08-09, never written** — the agent may depart from the workflow, saying which part it set aside; and it records Flow's own faults unprompted. `remaining.md`
- [x] **The repo `CLAUDE.md` stated a rule that was false — fixed 2026-08-29.** A command no longer earns its place by running something before the model thinks: a skill runs a `!` line before the model reads too, and Claude Code merged the two anyway. Both halves of the rule are gone. `design-commands-as-skills.md`
- [ ] **Where the review paragraph lives** once a review step exists — the premise moved. `groundwork` Phase 3 is now *attack it before it stands*, delegating to `## Judgment`, so re-read it before deciding whether the question survives. **talk first**. `remaining.md`
- [ ] **Dependency discipline** — a check before any dependency is added, and how a bulk version bump gets reviewed. **talk first**
- [ ] **File size as its own review signal** — a small diff that pushes an already-large file past a healthy boundary. **talk first**
- [ ] **The negation split** — a prohibition where the agent breaks a rule under pressure, a positive recipe where the output comes out the wrong shape. **talk first**. `compression.md`
- [ ] **`wip` is banned as a word** — an abbreviation nobody expands. Covers `gsave.sh`, which generates `wip:` commit messages, and the folder rename already open below. `design-work-sync.md`
- [ ] **Move the git rule from `## Hard rules` into `## Preferences`**, once that section carries real content — **parked**

## Subagents and dispatch

- [ ] **Git worktrees** — a custom solution for git, and whether the ban on git mutations lifts with it. **talk first**
- [ ] **Parallel subagent calls** — blocked on git worktrees, and on `snapshot.js`, which records the whole tree either side of a dispatch and cannot tell two writers apart. **talk first**. `threads.md` → `execute-cost`
- [ ] **Tracking every session, subagent and tool call** — hooks carry `session_id`, `agent_id` and the file path natively, and are the only layer that can also block a call. Not designed. **talk first**. `lab/research/claude-audit.md`
- [ ] **Output contract, tool allowlist and model, per agent** — nothing fixes what a dispatched agent returns. **talk first**. `threads.md` → `extension-points`
- [ ] **Does `haiku-worker` survive at all?** — contested. **talk first**. `threads.md` → `extension-points`
- [ ] **What a parent can do to a subagent it dispatched** — revisit when one actually runs. **parked**. `threads.md` → `subagent-mechanics`

## Drawing

- [ ] **The ASCII engine** — hand it JSON, get back the drawing. You have read `design-ascii-engine.md` and mostly disagree with its recommendation; state your direction before anything in there gets argued. **talk first**
- [ ] **An SVG engine** — later than the ASCII one. It reopens the SVG ban, decided on a measured ~10 minutes and ~80k tokens per diagram in the main context, which a subagent changes. **talk first**. `threads.md` → `extension-points`
- [ ] **Excalidraw** — 3 third-party skills kept at `lab/excalidraw/`, still no verdict. **talk first**
- [ ] **`visualize/references/draw-mockups.md`'s editor mockup shows a stale tree** — `refs` and `global`, both gone since the restructure. It is example content inside an alignment-critical ASCII box, so fixing the strings means redrawing the box
- [ ] **Turn the glyph probe into a script** — `lab/research/ascii-glyph-probe.md` is evidence today. `scripts/glyph-probe.js` would make "show it to the user first" something the agent can carry out, and it has to render into a file as well as a terminal. `design-visualize-rework.md`

## Context and session boundaries

- [x] **Automate the resume after `/clear` — built 2026-08-24.** `handoff` writes a fenced `flow-open` block into `## State` or `handoff.md`, and `flow open` loads every file it names before the first turn. The `SessionStart` hook was not needed: `/start` is the second of the two typed steps, and `design-resume.md` set two as the ceiling
- [ ] **Nothing loads on a bare `/start` with no ticket and no path** — a `handoff.md` sits beside whichever thing is being worked, so there can be several and no id points at one. Left out of the 2026-08-24 build
- [ ] **A dropped file path costs a whole extra turn** — dragging a file from the editor into the terminal pastes its absolute path in quotes, and that is the only easy way to name a file `@` cannot find or that git ignores. The agent then spends one turn seeing the path and a second reading the file. Wanted: the content arrives with the prompt. `UserPromptSubmit` is the shape — it fires before the model processes the prompt and its stdout is added as context, so a hook could read every quoted absolute path and print the file. Undesigned. **talk first**. `lab/research/claude-code-docs/hooks.md`
- [ ] **Context engineering** — keep what loads as small as possible, and stop cache invalidation when a skill loads mid-session. **talk first**
- [ ] **Splitting `~/.claude/flow/notes.md`** — by kind, never by project. **parked**
- [ ] **A `PreCompact` hook** — a block-once state file, so auto-compaction gives way to `handoff`. The least important thing on this list, and the context-pulse hook beside it was deferred indefinitely 2026-08-08: at a 1M window you fire `handoff` yourself. **parked**

## Testing

- [ ] **Full end-to-end testing for every programmatic part** — `flow`, `ptree`, `fmerge`, `guard.js`. The harness landed 2026-08-28 with 7 tests, which prove the wiring and almost none of the behavior
- [ ] **A test suite for `flow`** — about 2,000 lines of Node, verified only by hand. Every redesign has been walked command by command in a scratch tree, which is the case material
  - `tmp/proto-unfinished.sh` is 77 checks over `flow work`, written 2026-08-24, and `tmp/` is gitignored so it disappears on the next cleanup. Decide whether it is the first piece of this suite or a throwaway before that happens

## Repo structure

Built 2026-08-28. `design-restructure.md` carries the plan, the delete list and the verified facts.

- [x] **Dissolve `global/`** — `home/`, `scripts/` and `references/` sit at the root. Grouped by kind, never by destination
- [x] **`refs/` → `references/`** — every mention, including the 4 folders inside skills
- [x] **`wip/` → `lab/`**, with the ~15,000 untracked clone files pulled out into a gitignored `repos/`
- [x] **The `lab/` cleanup** — 78 tracked files and 4 untracked paths, deleted after their own yes
- [x] **`docs/`** — authored guides, concepts, the philosophy behind each phase and tool. `repos.md` is the first
- [x] **10 orphan gitlinks** — the clones moved into gitignored `repos/`, so a commit records the deletion and no `git rm --cached` is needed. `docs/repos.md` names each one and `scripts/repos.sh` restores them
- [x] **`scripts/` becomes the Node package root** — `package.json`, `node --test`, zero dependencies
- [x] **`scripts/try.sh`** — a throwaway `CLAUDE_CONFIG_DIR` running a real session against this repo, installing nothing
- [x] **`link.sh` — replaced 2026-08-28 by `flow install`.** The glob question died with it: linking reads `home/skills` now, and `try.sh` calls the same command instead of carrying a second copy of it
- [x] **`try.sh` no longer symlinks `toolbox` — done 2026-08-29.** The toolbox left the workflow 2026-08-25 and `flow install` never linked it, so `try.sh` was the last place still building that link — over a folder that is not even checked out, which `ln -sfn` does silently. The scratch config is now the arrangement a real install produces, which is the one thing `try.sh` exists to give. The submodule stays in the repo
- [ ] **Move `tmp/model-creativity.md` into the design record**
- [ ] **Where general-purpose global scripts live** — `gsave` is not Flow-specific and the set keeps growing. **parked**. `remaining.md`

## The design record

- [x] **`lab/context/` cut to what is still live — done 2026-08-28.** 6,500 lines to 4,005, 18 files to 17. `remaining.md` keeps its 2 locked sections and loses 868 lines; `session-new-plugin.md` loses the pre-Flow log; `design-init-flow.md` becomes `design-project-docs.md`; `design-debug-web-pages.md` goes whole. `design-restructure.md` → `## The second cut`
- [x] **`session-new-plugin.md`'s stale "skills still to build" list — gone 2026-08-28** with the rest of the pre-Flow log
- [ ] **`design-debug.md` still says "the red command"** in 3 places — the skill renamed it to "the failing check" 2026-08-24, so the origin record and the skill no longer share a word
- [x] **`refactor-agenda.md`'s status table contradicted its own body — deleted 2026-08-28.** Every row restated a section above it, and 2 rows had gone stale against those sections
- [ ] **Real commit messages** — changelogs are suspended until v1, so git is the only record of why something changed
- [x] **`design-explain-rework.md` — settled 2026-08-28.** Its condition landed 2026-08-12 and its charset reasoning now sits in `visualize/SKILL.md`, so it is on the restructure's delete list

## Docs for whoever reads Flow

- [ ] **`README.md` still owes its real pass** — the install steps and layout section get rewritten once the restructure has moved paths. **Never edit it before then** (user, 2026-08-25): it is wrong as it stands, and the rewrite replaces it whole, so every patch until then is thrown away
- [ ] **The guide** — `docs/`, the long form of `references/workflow.md`, for a reader who knows none of this: every component, every decision, and the reasoning behind each. The first folder someone reads after cloning
- [ ] **`docs/` is designed and unwritten** — official documentation for a stranger, A to Z, 6 sections grouped by why you are reading. Nothing gets written until the workflow is finished and the install skill exists. The whole design lives in `lab/context/design-public-docs.md`, and the evidence behind it in `lab/research/doc-design/`
- [x] **Testing the examples in `docs/` — rejected 2026-08-29.** Both research reports named it the only way to stop docs going stale that does not rely on remembering, and it still does not fit: hand-written examples would cover the obvious tenth of the scenarios and miss every tricky one, so a green suite would report a safety nobody has. Flow's examples are also shell lines and JSON rather than compilable code, so nothing can run them. Reconsider only once the workflow is battle-tested and real examples exist. `lab/research/doc-design/`

## Install and migration

- [ ] **The install skill** — one skill covering every starting state, and the last thing Flow gets. It links every Flow skill globally, then leaves each project to turn off what it does not want. `threads.md` → `install`, and `design-project-docs.md` for what a migration harvests
- [ ] **The typed `flow`, `ptree`, `fmerge` and `gsave` run an old clone of this repo** — stopped at 2026-08-07, so `flow work` is unreachable by name. Still true 2026-08-24. `refactor-agenda.md` §8
- [ ] **Test built-in `/init` with `CLAUDE_CODE_NEW_INIT=1`** against a real repo first — it already does the codebase survey, the gap questions and a reviewable proposal
- [ ] **Migrate Delapse** — the real test, and where its conventions route into the project `CLAUDE.md` and `docs/context/`. `design-project-docs.md` carries the routing test and the 2026-07-29 survey of its docs
- [ ] **Keep Delapse's project-local skills, converted** — reversed 2026-08-26. They are not Flow's skills, and `.claude/flow/skills` is the list for those. Each one is vendored into Flow's tree under a group, then named in that list — `flow skills add` refuses a name it cannot find in the clone. `design-skills.md`
- [ ] **Harvest Delapse, `lumacraft_v2` and `framework-build` into skills** before that material is lost
- [ ] **Run `flow install`** once the skill set is final — it links per skill named in `home/skills`, so the `write-tickets` → `cut-from-spec` rename only reaches a machine through it
- [ ] **Repoint the stale `~/.local/bin` symlinks** — `ptree`, `flow`, `fmerge` and `gsave` all resolve into the deleted workbench repo, so `flow` runs old code. `refactor-agenda.md` item 8
- [ ] **Tune `guard.js`'s deny and ask lists** against real use — they were written from the rules, never against an observed false positive
- [ ] **An interview at install to fill `## The user`** — **parked**

## Research still to read

- [ ] **Expand `## Explaining` from the two ADHD skills** — both exist to stop an agent burying the answer, and neither is cloned yet: github.com/ayghri/i-have-adhd, github.com/UditAkhourii/adhd. Outranks the `deepseek-harness` read, because explanations to the user keep missing
- [ ] **Read `deepseek-harness` for ideas** — a plugin-based agent harness where everything is a plugin, cloned at `repos/deepseek-harness/`. Carries a second question: whether Flow ever runs outside Claude Code. Ranked last here — github.com/deepseek-ai/deepseek-harness
