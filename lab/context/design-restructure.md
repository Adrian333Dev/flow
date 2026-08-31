# Restructure — the repo layout, the cleanup, and the test harness

Settled 2026-08-28 in conversation, and built the same day. All 8 steps ran. `## The second cut` was
not part of the plan — the user opened it after the build, and it is where `lab/context/` shrank from
6,500 lines to 4,005.

Sections below are written as the plan they were. Where the build departed from the plan, the section
says so.

## The decision

**Group by kind. Never by destination.**

A skill installs globally or into a project depending on which of the 2 lists names it — never on where
its folder sits. Destination is a per-skill choice that changes without moving a file. So a top-level
folder named for a destination carries no rule.

`global/` is the only folder named that way, and it is the one that breaks. 7 things install into
`~/.claude/`: skills, commands, agents, the global `CLAUDE.md`, `settings.json`, `scripts/`, `refs/`.
3 sit at the root, named for what they are. 4 sit inside `global/`, named for the property all 7 share.

Two costs, both paid today:

- The `flow` CLI hides at `global/scripts/flow/`. 3,500 lines of Node, the largest program in Flow,
  3 folders down under a name that says nothing about code.
- `global/skills` has nowhere to go. It names which skills install globally, so it would be the one
  file in `global/` that never gets copied anywhere. The skills build writes it, at `home/skills`.

## The layout

- **`home/`** → `~/.claude/`. `CLAUDE.md`, `settings.json`, `settings.md`, and `skills` — the list of
  globally linked skill names, 1 per line, read by `link.sh`
- **`skills/`** → `~/.claude/skills/`, a symlink per skill folder. Holds the 4 group folders:
  `phases/`, `tools/`, `standards/`, `stack/`
- **`commands/`** → `~/.claude/commands/`, a symlink per file
- **`agents/`** → `~/.claude/agents/`, a symlink per file
- **`scripts/`** → `~/.claude/scripts`, one symlink, plus 4 per-file symlinks in `~/.local/bin`. The
  Node package root
- **`references/`** → `~/.claude/flow/references`, one symlink. Renamed from `refs/`
- **`toolbox/`** → `~/.claude/flow/toolbox`. Submodule, unchanged
- **`project-template/`** — copied into a project. Unchanged
- **`docs/`** — guides, concepts, the philosophy behind each phase and tool. The first folder someone
  reads after cloning. **Authored, never moved into.** Starts empty and grows
- **`lab/`** — the design record and the evidence. What survives of `wip/`
- **`repos/`** — other people's repos, gitignored. The 9 clones, `deepseek-harness`, `Delapse`,
  `lumacraft_v2`
- **`tmp/`** — scratch and the test harness, gitignored. Deleted freely

`wip/` disappears, which closes the rename item.

## The build, in order

1. **Delete.** Print every path under `## What gets deleted`, get a yes, then remove them. Check:
   `git status` shows the deletions and nothing else.
2. **Move.** `global/` dissolves into `home/`, `scripts/`, `references/`. `wip/` becomes `lab/`. The
   clones come out into `repos/`. Check: `ls` at the root matches `## The layout`.
3. **Sweep the paths.** Roughly 370 mentions, plus every `refs/` that became `references/`. Sweep the
   records under `lab/` too — a design record read cold with wrong paths in it fails at the one job it
   has. Check: no tracked file greps for `global/`, `wip/` or `refs/`.
   **The rename went wider than the 2 folders named above**, on the argument that one name per concept
   is the whole point: the 4 `refs/` folders inside skills, and the `tmp/refs/<tool>/` docs cache that
   `research` writes into a project. Git's own `refs/heads/` and `refs/unfinished/` are untouched.
4. **Fix the 6 lines** under `## What breaks`. Check: `bash scripts/link.sh` prints the right targets
   without running — read it, never run it.
5. **Write `docs/repos.md` and `scripts/repos.sh`.** No `git rm --cached`: moving the clones into
   gitignored `repos/` makes git see 10 deletions, which an ordinary commit records. Check: after that
   commit, `git ls-files -s | awk '$1==160000'` lists `toolbox` alone.
6. **Build the harness** — `scripts/package.json`, `node --test`, `scripts/try.sh`. Check: `try.sh`
   builds `tmp/try/` and `~/.claude/` has no new mtime.
7. **Operate on `remaining.md`.** Extract the 2 locked sections at its top, delete the other 1,200
   lines. Check: nothing in the file predates 2026-08-08.
   **Ran as part of `## The second cut`, and the estimate was long** — the 2 locked sections are 360
   lines, so 868 went rather than 1,200.
8. **Rewrite `CLAUDE.md`** for the new layout, with the whole writing pass inside that edit.

`README.md` gets its rewrite after all 8, never before.

## What gets deleted

**Every path below needs an explicit yes before it goes.** Tracked files return from git; the 4
untracked ones never can.

**11 context files, ~2,550 lines.** All under `wip/context/`:

- `handoff.md` — the v1 sweep, finished
- `user-profile.md` — personal, and it belongs on the machine rather than in a public repo
- `design-explain-rework.md` — its own condition landed 2026-08-12, and its charset reasoning now sits
  in `visualize/SKILL.md` under *never predict a character from a property*
- `design-capture-rework.md` — capture dissolved into `CLAUDE.md`, built the day it was designed
- `design-project-genesis.md` — its successor's header says it supersedes this
- `design-skill-ecosystem.md` — the knowledge layer, now `file-findings` plus `docs/context/`
- `design-brainstorm-rework.md` — `groundwork` is built and reworked, and `refactor-agenda.md` §9
  carries the decision table and every rejection
- `brief-context-compression-research.md` — consumed; it produced `compression.md`
- `brief-explore-agent-skills.md` — consumed; it produced `research/agent-skills/`
- `how-to-kill-the-bloat-in-claude-codes-system-prompt.md` — a saved article, acted on
- `audit.md` — verified spent. Its `## Still open after the fix batch` reads "Nothing"

**5 folders:**

- `wip/archive/` — the old global `CLAUDE.md` is in git, and `check-frame.js` is superseded by
  `skills/visualize/scripts/canvas.js`
- `wip/archived-skills/` — 3 retired skills, all replaced: `brainstorm` → `groundwork`,
  `visualization` → `visualize`, `research-evaluation` → `research`
- `wip/rejected-init-flow/` — the rejected skill, and the record of why it was rejected went the same
  day in the second cut below
- `wip/v1-template/` — the previous generation, no longer needed
- `wip/study-cases/` minus `premature-implementation/` — so `bad-explanations/`, `delapse/`,
  `handoff/`, `handy-workspaces/` and `read-aloud-app/` go. Drop the `bad-explanations` pointer at
  `shit-explanations.md:6` with them

**4 untracked paths, permanent.** `wip/tmp/gsave-issues.md`, `wip/tmp/out/`, `wip/tmp/prod-specs/`,
`wip/tmp/tts-lab/`.

**Kept, and why:**

- `study-cases/premature-implementation/` — a `CLAUDE.md` rewritten without approval, and unproposed
  changes applied on a partial approval. Every other case documents a failure that got fixed; this one
  documents a failure that recurs
- `excalidraw/` — a skill gets built from it later
- `framework-build/` — the backlog wants it harvested into skills first
- `design-debug.md` and `design-browser-tooling.md` — both describe work awaiting a rewrite
- `session-new-plugin.md` — the only origin record for pre-refactor decisions, and no commits during
  the refactor replace it

Three of these were cut further the same day. `## The second cut` below says what happened to each.

`lab/context/` ends at 18 files, down from 29. The second cut below takes it to 17.

## The second cut — `lab/context/` itself, 2026-08-28

The first cut deleted whole folders and left every context file standing. The user then asked which of
the 17 remaining files were still needed. **Only 2 were dead. The weight was inside 4 files**, not spread
across the folder, so most of this cut is surgery rather than deletion.

Each file was tested 2 ways: whether `backlog.md` points at it, and whether its content already ships on
disk. The 2 files nothing pointed at are the 2 that went.

**Deleted whole:**

- **`design-debug-web-pages.md`**, 519 lines. Three documents written 2026-07-12 to 07-23, before Flow
  existed, describing an architecture `design-browser-tooling.md` had already decided to delete. All 3 of
  its own "still true" claims ship elsewhere: the bundle format in
  `skills/debug-web-pages/knowledge/capturing-and-querying.md`, the Chrome 136+ constraint in
  `design-browser-tooling.md`, the maintenance discipline in
  `skills/file-findings/references/write-skills.md`

**Cut down:**

- **`remaining.md`**, 1,276 → 368. The 2 locked sections stay and the header was rewritten. What went:
  build steps for skills never built under those names, `## Design threads still open` where every entry
  reads `[x] BUILT`, and a restructure plan for the file itself. Both items under
  `## Deferred deliberately` were checked first — the user had already closed the fifth ticket type, and
  the frontmatter question was already at `backlog.md`
- **`session-new-plugin.md`**, 774 → 146. Lines 111 to 641 logged sessions from 2026-07-01 to 07-27 under
  names that no longer exist: `agentic-setup`, `flow-skills`, `new-workflow/`, `plugin.json`. The 2 August
  sections survive, being origins and nothing else
- **`design-init-flow.md`**, 534 → 114, renamed **`design-project-docs.md`**. Nearly all of it was a front
  door skill rejected in full, plus a payload, a template repo and an installer. 4 parts are still live
  and 2 unbuilt jobs read them: the `docs/context/` design with its 4 file rules, the skill-versus-project
  routing test, the harvest boundary, and the 2026-07-29 survey of Delapse and lumacraft_v2. **The 4 rules
  exist nowhere on disk**, which is why the file survives at all
- **`threads.md`**, 726 → 671. `## command-surface` went; its own row already said the write-up moved to
  `design-cli-rework.md`. `## execute-cost` stays — also built, but the only record of why `execute` looks
  the way it does
- **`refactor-agenda.md`**, 405 → 385. The `## Status` table went. It contradicted its own body on 2 rows,
  which was an open backlog item, and every row restated a section above it

**Found while sweeping.** `skills/file-findings/references/write-skills.md` still said `refs/` on 2 lines,
so the file teaching how to write a skill was teaching the old folder name. The first cut's sweep missed
both because neither line names a skill. Fixed with `backlog.md:67`, which said the same.

`lab/context/` ends at 17 files and 4,005 lines, down from 18 and 6,500.

## What breaks

6 lines, all mechanical:

- **`link.sh:10`** — repo root reads `dirname/../..`, becomes `dirname/..`
- **`link.sh:41`** — the skill glob reads `*/`, and becomes `*/*/` only when the group folders exist.
  **Left alone.** The skills build creates them; widening the glob first would make `link.sh` find
  nothing at all today
- **`.gitignore`** — `tmp/` becomes `/tmp/`, and `/repos/` joins it
- **`.claude/settings.json`** — `**/global/CLAUDE.md` → `**/home/CLAUDE.md`, `**/wip/**` → `**/lab/**`,
  and `**/repos/**` joins them
- **`flow.js:8`** — a comment naming `global/refs/cli-design.md`
- **`work.js:22`** — a comment naming `wip/context/design-work-sync.md`. A shipped file pointing into
  the design lab, which `CLAUDE.md` forbids

**Verified unchanged.** `open.js:31`'s `../../fmerge.js` resolves the same after the move.
`store.js:365`'s `__dirname/../templates` holds. `global/settings.json` names its hooks through
`$HOME/.claude/scripts/`, which is a symlink. Every `require('./lib/…')` inside `flow/` is internal.

## The harness

`bash scripts/try.sh` builds a throwaway config directory, then prints the line to run:
`CLAUDE_CONFIG_DIR=…/tmp/try/home claude`. It prints rather than runs, because an interactive session
cannot start from inside one.

What it builds:

- **`tmp/try/home/`** — a complete fake `~/.claude`. `CLAUDE.md` and `settings.json` copied from
  `home/`. A symlink per skill folder, per command file and per agent file. `scripts` and
  `flow/references` as folder symlinks. `.credentials.json` symlinked to the real one, so the session
  authenticates
- **`tmp/try/project/`** — a real git repo. `project-template/` copied in, plus `.claude/flow/skills`

4 properties earn it:

- **Editing a skill is live in the running session.** The skills are symlinked, so `SKILL.md` is the
  same file the session loads. Write, save, invoke
- **Nothing outside the repo is written.** One read-only symlink reaches out, to the credential file.
  `~/.claude/` stays untouched, so the never-install rule holds and the holding is checkable
- **Gitignored**, since it lives under `tmp/`
- **It runs the real thing** — both skill lists, the project `CLAUDE.md`, the `flow` CLI against a real
  repo, the hooks

It never tests whether a real install works on a clean machine. That stays with the management skill,
which stays last.

The same scratch-project builder feeds `node --test`, which covers `flow`, `ptree`, `fmerge` and
`guard`.

**Order.** The restructure runs before the skills build, reversing the backlog. Its old reason expired:
the grouping is decided and the restructure never moves `skills/`. The new reason is `try.sh` — the 10
descriptions get tested in a real session as they are written, rather than blind.

## Verified — never re-derive

Every line below came from running something, 2026-08-28:

- **Node is v24.15.0 and `node --test` is built in.** Zero dependencies, no `node_modules`
- **251 tracked files, ~15,700 on disk.** `wip/` is 99% untracked clone material
- **10 orphan gitlinks**, mode `160000`, absent from `.gitmodules`: the 9 folders in `wip/refs/` plus
  `wip/research/deepseek-harness`. A fresh clone gets 10 empty directories. Every URL is still readable
  from each clone's own `.git/config`, and all 10 are recorded in the repos file step 5 writes
- **`.gitignore`'s `tmp/` matches at every depth**, with no leading slash. That is how `wip/tmp/` became
  ignored, and nobody chose it
- **Claude Code finds skills 1 level below `skills/`.** `skills/phases/groundwork/` is invisible until
  `link.sh` flattens it into `~/.claude/skills/groundwork`
- **`CLAUDE_CONFIG_DIR` relocates `~/.claude`**, proven against skill loading in the collision tests
- **`~/.claude/.credentials.json`** is the file a scratch config needs symlinked
- **`skills/visualize/scripts/canvas.js` exists.** The skill's pointer is live
- **Mention counts for the sweep:** `refs/` 244, `wip/` 151, `global/CLAUDE.md` 112,
  `global/scripts` 67, `global/refs` 30

**`CLAUDE.md` used to contradict `design-skills.md` on `skills/`**, saying "One skill, one folder. Flat
for now". Step 8 rewrote it: flat today, 4 group folders with the skills build, and the `link.sh` glob
named as the thing that widens with them.

## Rejected

- **Group by destination.** A skill installs both ways, decided per skill, so no destination folder can
  hold `skills/`
- **Keep `global/`, narrowed to the 2 config files.** It saves ~120 mentions in the sweep and fixes
  nothing: those files are global in exactly the sense `skills/` is, so the name still fails to
  distinguish them
- **`docs/` as the home for the design record.** `docs/` is authored guide material for a human
  learning Flow. The design record is `lab/`
- **Clones under `tmp/`.** `tmp/` is deleted without looking. `wip/tmp/` is the case: it collected
  `gsave-issues.md`, `prod-specs/`, `out/` and `tts-lab/`, none of them clones, none recoverable
- **The 10 gitlinks as real submodules.** This material is read for ideas, never built against, so a
  pinned commit buys nothing and `clone --recursive` would pull 15,000 files
- **`try.sh --skills` and `--project`.** The first was justified by a skill-firing risk that does not
  hold — a skill in context gets invoked, and the phase routing covers the rest. The second had nothing
  to point at, since Delapse is testable only after its migration
- **Moving the `/copy` habit into a `CLAUDE.md`.** `global/CLAUDE.md` is a public template and could
  never hold it, and the rule is minor. `user-profile.md` goes whole
