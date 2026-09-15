# State: what Flow is right now

**This file is maintained as the work moves. Where it disagrees with disk, this file is the bug.** Every other record under `lab/` is history, and disk wins over it.

Read it before touching skills installation, the scripts, or the docs tree. Open work is in `backlog.md`. The build history this file carried until 2026-09-15 is in git: `git log -p -- lab/context/state.md`.

## Nothing is installed on this machine

- **`~/.flow/`**: absent.
- **`~/.claude/`**: Claude Code's own folder. `CLAUDE.md` is empty. `skills/` holds 3 skills from outside Flow: `find-skills`, `improve-codebase-architecture` and `write-a-skill`. 6 plugins are installed beside them: frontend-design, playwright, typescript-lsp, greptile, superpowers and supabase. **None of the 9 is touched.** The user keeps them as the test material for the management skill, which takes over handling them once Flow runs on this machine. Set 2026-09-15.
- **`~/.local/bin`**: `flow` and `fw` link to `scripts/flow/flow.js` in this clone. `util` and `u` link to `~/code/util/util.js`, a second clone at the same commit as `lab/util`. `gsave`, `ptree` and `fmerge` were removed by the user on 2026-09-16, having linked into the old `~/code/projects/agentic-setup/`. `util git save`, `util fs tree` and `util fs merge` replace them, and `util git save` is now the commit-and-push command in daily use.
- **`tmp/try/`**: where `bash lab/scripts/try.sh` builds a throwaway install. It copies the credentials, the account and the theme from `~/.claude/`, so the session starts signed in.

## The 2026-09-15 build is uncommitted

Everything before it is committed, in Flow through `cf63643` and in all 3 submodules. The uncommitted build holds:

- the reminder hook
- `model:` and `effort:` on every new study case
- the backlog split into `## V1` and `## After V1`, plus a `backlog.md` in each submodule, untracked there
- 8 study cases converted from `lab/context/shit-explanations.md`, which is deleted
- the lab cleanup of 2026-09-15: 14 design records deleted, `lab/framework-build/` deleted, 10 records cut to what open items need, `design-audit.md` rewritten as `docs/dev/audit.md`, and the 3 Chrome extension guides moved to `lab/domain-skills/drafts/chrome-extension/`
- the merge of 2026-09-16: 20 context records down to 9, `docs/dev/claude-code.md` written from 2 of them, the routing test and the `docs/context/` rules added to `/file-findings`, and `threads.md`, `design-subagents.md` and `design-project-docs.md` deleted
- the backlog split of 2026-09-16: `## V1` from 7 items to 39, `## After V1` down to 20

## The rule files

- **`home/CLAUDE.md`**: 152 lines, the template for `~/.claude/CLAUDE.md`. Sections in order: `## The turn`, `## Reading`, `## Writing files`, `## Tools`, `## Workflow`, `## The user`, `## Preferences`, `## Capture`, `## Scripts`, `## Judgment`, `## Explaining`. Every rule carries an id.
- **`CLAUDE.md`**: 156 lines, the rules for working on this repo. It only has to align roughly with the template, ruled by the user 2026-09-07.
- **`project-template/CLAUDE.md`**: 8 lines. 2 fill-in comments and no rules.
- **`rules/comments.md`**: the one rule file. 11 rules, loaded only for JS, TS, Python, shell, SQL and CSS files. The user ruled comment shape minor.
- **`references/reminder.md`**: the one line the reminder hook prints beside every message the user sends.

## 12 skills, and every one is on

`home/settings.json` ships `skillOverrides` empty, so nothing is switched off. `skills/drafts/` is empty.

- **`phases/`**: `groundwork`, `execute`, `prototype`, `debug`
- **`tools/`**: `start`, `handoff`, `file-findings`, `research`, `cut-from-spec`, `visualize`
- **`dev/`**: `flow-review`, `fold`

`/start`, `/cut-from-spec` and `/fold` are typed-only. `/debug` still sends a bug inside a web page to `/web-pages`, which left for `domain-skills` and waits on its rebuild there.

## `flow` has 11 command groups, and 114 tests pass

- **tickets**: `next`, `check`, `ls`, `tree`, `get`, `new`, `edit`, `dep`, `file`, `drop`, and one command per status move
- **setup**: `install`, `doctor`
- **rules**: `scorecard`
- **sharing**: `contribute`, which opens one pull request per skill on `domain-skills`
- **cases**: `new`, `ls`, `get`, `edit`, `issues`
- **skills**: `ls`, with `--group` and `--hidden`
- **domain-skills**: `ls`, `add`, `drop`, per project
- **private-skills**: `ls`, `add`, `drop`, per project or with `--global`
- **overlays**: `get`
- **git**: `get`, `allow`, `ask`, `off`, the switch deciding whether the agent may run git commands that write
- **audit**: an index of Claude Code's transcripts, with queries over it

## 10 hooks, all in `home/settings.json`

- **`guard.js`**, before every shell command: enforces the git switch.
- **`changes.js`**, around every edit, write, shell and MCP call, and at subagent start and stop: records each change under the id of the agent that made it.
- **`rule-check.js`**, before every edit and write: runs the rule checks and records the results.
- **`instructions-loaded.js`**: records which rule files entered context.
- **The reminder**, on every message the user sends: `cat` of `references/reminder.md`.

## 1 rule check, and it only measures

`scripts/rule-checks/js-and-ts.js` counts a run of `//` lines above a function, a class or an arrow function. It records and never warns, since the user ruled comment shape minor. It fired correctly in a live session on 2026-09-10.

## 14 study cases in 8 folders

All under `lab/study-cases/`. `flow cases new` fills in `model:` from the session's transcript and `effort:` from `CLAUDE_EFFORT`, since 2026-09-15. The 8 cases converted that day were given their model by searching the transcripts for the user's rejection.

## The 3 submodules

- **`lab/util`**: the second command-line tool, [`Adrian333Dev/util`](https://github.com/Adrian333Dev/util). Namespaces `claude proxy`, `fs tree|merge|open|link`, `git save|work`, `github clone|bookmark`. 54 tests pass. Installed for real on this machine, from `~/code/util`.
- **`lab/toolbox`**: 155 outside tools, one file each, under `agent-tools/` and `software/`, most with the tool's README beside it. `bin/tool.js add` saves a tool and `refresh` rewrites what GitHub owns.
- **`lab/domain-skills`**: [`Adrian333Dev/domain-skills`](https://github.com/Adrian333Dev/domain-skills), public. It holds 2 drafts, `web-pages` and `excalidraw`, and no finished skill. `domainSkills` is unset on this machine, so `flow domain-skills` has nothing to read.

## Docs: 5 manual pages and 10 dev pages

- **`docs/manual/`**: `reference.md`, `settings.md`, `tickets.md`, `where-everything-lives.md`, plus the index. Use Flow is the page left.
- **`docs/dev/`**: `agents.md`, `audit.md`, `checkout.md`, `claude-code.md`, `context-cost.md`, `layout.md`, `scratch-session.md`, `skills.md`, `tests.md`, plus the index. `context-cost.md` reads as a design finding, and nobody has decided whether it stays there.

## Built and never run for real

- `flow contribute` and `/fold` against GitHub
- 2 change-record paths, named in `backlog.md` → `## After V1` → `### Subagents and dispatch`
- a warning carrying a rule's whole text because the rule's file never loaded
- `flow install` on this machine, by decision

## Rulings and measurements with no other home

- **A command that exists to print gets its whole output compared against a literal**, set 2026-09-11. A test reading only the filesystem passed over a bug where the command described the filesystem wrongly.
- **Stack content lives in a domain skill, never in a rule file with `paths:`**, set by the user 2026-09-10, rejecting a `rules/typescript.md`.

## Which record covers what

All in `lab/context/`, flat. 20 files were merged into these 9 on 2026-09-16. Every one is history except this file.

- **`claude-code.md`**: what Claude Code cannot do that Flow needs. 3 issues filed 2026-09-10. What it *can* do moved to `docs/dev/claude-code.md`.
- **`drawing.md`**: the settled `/visualize` rulings, what `canvas.js` measured, and the engine that may never be built.
- **`handoff.md`**: the latest handoff, rewritten whole each time.
- **`management.md`**: the management skill. Nothing approved, 3 open questions, plus where the idea came from.
- **`manual.md`**: what `docs/manual/` is, and the manual pages still planned.
- **`models.md`**: telling which model produced a piece of work, and running Flow on another harness. Nothing locked.
- **`rules.md`**: the enforcement bridge, the conduct rules, the negation split, and the user's feedback on how a loaded file is written.
- **`skills.md`**: why a long skill takes no arguments, how a plugin is switched on per project, the `domain-skills` pipeline, browser tooling and the toolbox.
- **`state.md`**: this file.
