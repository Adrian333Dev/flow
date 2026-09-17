# State: what Flow is right now

**This file is maintained as the work moves. Where it disagrees with disk, this file is the bug.** Every other record under `lab/` is history, and disk wins over it.

Read it before touching skills installation, the scripts, or the docs tree. Open work is in `backlog.md`. The build history this file carried until 2026-09-15 is in git: `git log -p -- lab/context/state.md`.

## Nothing is installed on this machine

- **`~/.flow/`**: absent.
- **`~/.claude/`**: Claude Code's own folder. `CLAUDE.md` is empty. `skills/` holds 3 skills from outside Flow: `find-skills`, `improve-codebase-architecture` and `write-a-skill`. 6 plugins are installed beside them: frontend-design, playwright, typescript-lsp, greptile, superpowers and supabase. **None of the 9 is touched.** The user keeps them as the test material for the management skill, which takes over handling them once Flow runs on this machine. Set 2026-09-15.
- **`~/.local/bin`**: `flow` and `fw` link to `scripts/flow/flow.js` in this clone. `util` and `u` link to `~/code/util/util.js`, a second clone at the same commit as `lab/util`. `gsave`, `ptree` and `fmerge` were removed by the user on 2026-09-16, having linked into the old `~/code/projects/agentic-setup/`. `util`'s own `git save`, `fs tree` and `fs merge` replace them.
- **`tmp/try/`**: where `bash lab/scripts/try.sh` builds a throwaway install. It copies the credentials, the account and the theme from `~/.claude/`, so the session starts signed in. The scratch project is built from a seed under `lab/scripts/seeds/`, picked with `--seed <name>`: `app` (default, a small expense tracker with 9 tickets that fit it), `guards`, `resume` and `empty`. Set 2026-09-16.

## Reference clones under `repos/`, gitignored and never edited

- **`repos/codex`**: a full clone of [`openai/codex`](https://github.com/openai/codex), 738 MB, taken 2026-09-18. The Codex CLI's own source, Rust under `codex-rs/`, 4,378 files. **It is the documentation for Codex**: there is no page set to mirror `lab/research/claude-code-docs/`, and every fact Flow has about Codex skills, plugins and namespacing came out of its doc comments. `lab/context/handoff.md` → `## Codex comes before the rest of the management skill` names the four places to look.
- **20 other clones** beside it, 2.1 GB in total, read for ideas and never edited. `read-repos-with-cat` binds all of them.

## The rule files

- **`home/CLAUDE.md`**: 147 lines, the template for `~/.claude/CLAUDE.md`. Sections in order: `## The turn`, `## Reading`, `## Writing files`, `## Tools`, `## Workflow`, `## The user`, `## Preferences`, `## Capture`, `## Scripts`, `## Judgment`, `## The reply`. Every rule carries an id.
- **`CLAUDE.md`**: 146 lines, the rules for working on this repo. It only has to align roughly with the template, ruled by the user 2026-09-07.
- **`project-template/CLAUDE.md`**: 8 lines. 2 fill-in comments and no rules.
- **`rules/comments.md`**: the one rule file. 11 rules, loaded only for JS, TS, Python, shell, SQL and CSS files. The user ruled comment shape minor.
- **`references/reminder.md`**: the one line the reminder hook prints beside every message the user sends.

## 12 skills, typed `/flow:<name>`, every one always on

`skills/drafts/` is empty.

- **`phases/`**: `groundwork`, `execute`, `prototype`, `debug`
- **`tools/`**: `start`, `handoff`, `file-findings`, `research`, `cut-from-spec`, `visualize`
- **`dev/`**: `review`, `fold`

**Every folder and every frontmatter `name` is bare, and the `flow:` is added at load time.** `flow install` links the set into `~/.claude/skills/flow/skills/` and copies `home/plugin.json` to `~/.claude/skills/flow/.claude-plugin/plugin.json`, which holds the one word `flow`. Claude Code and Codex both read that file. Built 2026-09-18, and proven the same day: a scratch session reported `flow@skills-dir` loaded and named its own skills `flow:groundwork`, `flow:handoff`, `flow:visualize`. `lab/context/skills.md` → `### Flow is a plugin too` holds the argument.

**There is no per-skill off switch any more.** `skillOverrides` does not reach a plugin's skills, so `home/settings.json` ships it empty and it now governs domain, private and other outside skills alone. `claude plugin disable flow@skills-dir` takes the whole set. `flow skills ls` still prints `STATE` and `SET BY` columns that read the key, and they now say the same thing on every row; taking them out is an open item in `backlog.md`.

`/flow:start`, `/flow:cut-from-spec` and `/flow:fold` are typed-only. The 4 phase skills take a ticket id and load it with its files on their first line, since 2026-09-16. `/flow:debug` still sends a bug inside a web page to `/web-pages`, which left for `domain-skills` and waits on its rebuild there.

## `flow` has 11 command groups, and all 116 tests pass

One of them, *a worker hands the parent its diff and the command that deleted a file*, fails about one run in five when the machine is busy. It is a race in the test, not a bug in `changes.js`, and it has a line in `backlog.md`.

- **tickets**: `next`, `check`, `ls`, `tree`, `get`, `new`, `edit`, `dep`, `file`, `drop`, and one command per status move
- **setup**: `install`, which links everything and copies the plugin manifest, and `doctor`, which checks both
- **rules**: `scorecard`
- **sharing**: `contribute`, which opens one pull request per skill on `domain-skills`
- **cases**: `new`, `ls`, `get`, `edit`, `issues`. `new` fills in `model:` from the session's transcript and `effort:` from `CLAUDE_EFFORT`. This repo's own 14 cases were deleted on 2026-09-16, condensed into `lab/context/rejected-replies.md`.
- **skills**: `ls`, with `--group` and `--hidden`
- **domain-skills**: `ls`, `add`, `drop`, per project
- **private-skills**: `ls`, `add`, `drop`, per project or with `--global`
- **overlays**: `get`
- **git**: `get`, `allow`, `ask`, `off`, the switch deciding whether the agent may run git commands that write
- **audit**: an index of Claude Code's transcripts, with queries over it

## 11 hooks, all in `home/settings.json`

- **`guard.js`**, before every shell command: enforces the git switch.
- **`changes.js`**, around every edit, write, shell and MCP call, and at subagent start and stop: records each change under the id of the agent that made it.
- **`rule-check.js`**, before every edit and write: runs the rule checks and records the results.
- **`instructions-loaded.js`**: records which rule files entered context.
- **`check-ticket.js`**, when a phase skill or `/flow:start` is typed with a ticket id: blocks the skill when the id matches nothing, so a typo loads nothing.
- **The reminder**, on every message the user sends: `cat` of `references/reminder.md`.

## 1 rule check, and it only measures

`scripts/rule-checks/js-and-ts.js` counts a run of `//` lines above a function, a class or an arrow function. It records and never warns, since the user ruled comment shape minor. It fired correctly in a live session on 2026-09-10.

## The 3 submodules

- **`lab/util`**: the second command-line tool, [`Adrian333Dev/util`](https://github.com/Adrian333Dev/util). Namespaces `claude proxy`, `fs tree|merge|open|link`, `git save|work`, `github clone|bookmark`. 54 tests pass. Installed for real on this machine, from `~/code/util`.
- **`lab/toolbox`**: 155 outside tools, one file each, under `agent-tools/` and `software/`, most with the tool's README beside it. `bin/tool.js add` saves a tool and `refresh` rewrites what GitHub owns.
- **`lab/domain-skills`**: [`Adrian333Dev/domain-skills`](https://github.com/Adrian333Dev/domain-skills), public. It holds 2 drafts, `web-pages` and `excalidraw`, and no finished skill. `domainSkills` is unset on this machine, so `flow domain-skills` has nothing to read.

## Docs: 9 manual pages and 10 dev pages

- **`docs/manual/`**: `reference.md`, `settings.md`, `tickets.md`, `where-everything-lives.md`, plus the index, and `use/` holding `start.md`, `phases.md`, `status.md` and `resume.md`, shipped 2026-09-16 with examples captured from the scratch project's seeded board. The user may still have the set rewritten whole if the one-page-per-chunk shape reads badly. Still unwritten: what Flow is, and the approval discipline.
- **`docs/dev/`**: `agents.md`, `audit.md`, `checkout.md`, `claude-code.md`, `context-cost.md`, `layout.md`, `scratch-session.md`, `skills.md`, `tests.md`, plus the index. `context-cost.md` reads as a design finding, and nobody has decided whether it stays there.

## Built and never run for real

- `flow contribute` and `/flow:fold` against GitHub
- 2 change-record paths, named in `backlog.md` → `## After V1` → `### Subagents and dispatch`
- a warning carrying a rule's whole text because the rule's file never loaded
- `flow install` on this machine, by decision

## Rulings and measurements with no other home

- **A command that exists to print gets its whole output compared against a literal**, set 2026-09-11. A test reading only the filesystem passed over a bug where the command described the filesystem wrongly.
- **Stack content lives in a domain skill, never in a rule file with `paths:`**, set by the user 2026-09-10, rejecting a `rules/typescript.md`.

## Which record covers what

All in `lab/context/`, flat. 20 files were merged into 9 on 2026-09-16, and `rejected-replies.md` was added the same day. Every one is history except this file.

- **`claude-code.md`**: what Claude Code cannot do that Flow needs. 3 issues filed 2026-09-10. What it *can* do moved to `docs/dev/claude-code.md`.
- **`drawing.md`**: the settled `/flow:visualize` rulings, what `canvas.js` measured, and the engine that may never be built.
- **`handoff.md`**: the latest handoff, rewritten whole each time.
- **`management.md`**: the management skill's groundwork map, opened 2026-09-16: 8 branches, the user's rulings, and every earlier proposal filed under the branch it feeds. Walked to the end 2026-09-17, every branch closed, with a dated section per locked decision. The attack ran the same day against this machine and found 6 faults, all fixed in place. Routed the same day into `backlog.md` → `## V1` → `### The management skill, in build order`, 14 lines run in the order written, so the map is history like every other record here and the open work is on those lines.
- **`manual.md`**: what `docs/manual/` is, and the manual pages still planned.
- **`models.md`**: telling which model produced a piece of work, and running Flow on another harness. The port costs per component are locked; `### Codex namespaces plugin skills, and reads Claude Code's manifest` was added 2026-09-18 and decides how skills are named on both harnesses.
- **`rejected-replies.md`**: every reply the user rejected, one line each with their words. The test set `## The reply` was built against.
- **`rules.md`**: the enforcement bridge, the conduct rules, the negation split, and the user's feedback on how a loaded file is written.
- **`skills.md`**: when a long skill takes an argument, how a plugin is switched on per project, the `domain-skills` pipeline, browser tooling and the toolbox.
- **`state.md`**: this file.
