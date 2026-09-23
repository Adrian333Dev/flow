# State: what Flow is right now

**This file is maintained as the work moves. Where it disagrees with disk, this file is the bug.** Every other record under `lab/` is history, and disk wins over it.

Read it before touching skills installation, the scripts, or the docs tree. Open work is in `backlog.md`. The build history this file carried until 2026-09-15 is in git: `git log -p -- lab/context/state.md`.

## Nothing is installed on this machine

- **`~/.flow/`**: absent.
- **`~/.claude/`**: Claude Code's own folder. `CLAUDE.md` is empty. `skills/` holds 3 skills from outside Flow: `find-skills`, `improve-codebase-architecture` and `write-a-skill`. 6 plugins are installed beside them: frontend-design, playwright, typescript-lsp, greptile, superpowers and supabase. **None of the 9 is touched.** The user keeps them as the test material for the management skill, which takes over handling them once Flow runs on this machine. Set 2026-09-15.
- **`~/.codex/`**: Codex's own folder. Codex 0.155.0 is installed at `~/.local/share/pnpm/bin/codex` and kept current by the user, and it is signed in through `~/.codex/auth.json`. `agents/` holds about 20 `seo-*.toml` subagents from outside Flow. There is no `AGENTS.md` yet.
- **`~/.agents/`**: the folder not tied to either vendor, which Codex reads skills from. `skills/` holds the same 3 outside skills as `~/.claude/skills/`, beside a `.skill-lock.json` written by another tool. **None of it is touched.** When Flow installs, its one real copy of each file lands here: the rule file `AGENTS.md` and the plugin folder `skills/flow/`. `docs/manual/where-everything-lives.md` has the layout.
- **`~/.local/bin`**: `flow` and `fw` link to `scripts/flow/flow.js` in this clone. `util` and `u` link to `~/code/util/util.js`, a second clone at the same commit as `lab/util`. `gsave`, `ptree` and `fmerge` were removed by the user on 2026-09-16, having linked into the old `~/code/projects/agentic-setup/`. `util`'s own `git save`, `fs tree` and `fs merge` replace them.
- **`tmp/try/`**: where `bash lab/scripts/try.sh` builds a pretend computer and starts a Claude Code session inside it, or a Codex one with `--codex`. The session always runs under `bwrap`, with `tmp/try/root/` mounted over the real home folder's path, the rest of the disk read-only, and a cleared environment, so Linux only. The Claude Code login is the one real file bound in, writable, so a renewal lands in it. `--case` picks the starting computer: `with-flow` (default, `flow install --no-clone --drafts` run inside the sandbox, plus `home/settings.json`, and no rule file), `empty` (signed in, nothing else) or the name of a computer saved by `lab/scripts/save-computer.sh` into `tmp/computers/<name>/`, never rewritten. `empty` and a saved computer start by running `install.sh --use <this checkout> --no-clone --drafts`, then the session. The start command is written to `tmp/try/sandbox.sh`, and run straight away only when a terminal is attached. `--codex` copies `~/.codex/auth.json` in, and refuses when that login is less than a day from renewing, since a scratch renewal would sign the real Codex out. The scratch project is built from a seed under `lab/scripts/seeds/`, picked with `--project <name>`: `app` (default, a small expense tracker with 9 tickets that fit it), `guards`, `resume` and `empty`. Reworked 2026-09-23 to test `/flow:setup-machine`, and checked: all 3 cases, `install.sh` run twice, a real clone from GitHub inside the sandbox, a Codex session, and a signed-in `claude -p` answer.
- **`tmp/computers/before-flow/`**: this computer as it was on 2026-09-23, before Flow, saved by `save-computer.sh`. 47 MB.

## Reference clones under `repos/`, gitignored and never edited

- **`repos/codex`**: a full clone of [`openai/codex`](https://github.com/openai/codex), 738 MB, taken 2026-09-18. The Codex CLI's own source, Rust under `codex-rs/`, 4,378 files. **It is the documentation for Codex**: there is no page set to mirror `lab/research/claude-code-docs/`, and every fact Flow has about Codex skills, plugins and namespacing came out of its doc comments. `lab/context/handoff.md` → `## Where to look up anything about Codex` names the four places to look.
- **20 other clones** beside it, 2.1 GB in total, read for ideas and never edited. `read-repos-with-cat` binds all of them.

## The rule files

- **`home/AGENTS.md`**: 148 lines, the template for `~/.agents/AGENTS.md`, the one rule file. `home/CLAUDE.md` beside it is the one line `@~/.agents/AGENTS.md`, which `/flow:setup-machine` copies to `~/.claude/CLAUDE.md`, writing the full path in place of `~` when the home folder is a scratch root. Nothing links it into `~/.codex/` since 2026-09-23, when Codex left the design. `flow install` wrote all 3 until 2026-09-20 and now writes none of them: a copy made before that skill's interview holds nothing of the user. The rules moved from `home/CLAUDE.md` to `home/AGENTS.md` on 2026-09-18, and the one-line file took the old name the same day, so `home/` and `project-template/` now hold the same pair. Sections in order: `## The turn`, `## Reading`, `## Writing files`, `## Tools`, `## Workflow`, `## The user`, `## Preferences`, `## Capture`, `## Scripts`, `## Judgment`, `## The reply`. Every rule carries an id.
- **`CLAUDE.md`**: 147 lines, the rules for working on this repo. It only has to align roughly with the template, ruled by the user 2026-09-07.
- **`project-template/AGENTS.md`**: 8 lines. 2 fill-in comments and no rules. `project-template/CLAUDE.md` beside it is the one line `@AGENTS.md`.
- **`rules/comments.md`**: the one rule file. 11 rules, loaded only for JS, TS, Python, shell, SQL and CSS files. The user ruled comment shape minor.
- **`references/reminder.md`**: the one line `scripts/reminder.js` prints beside every message the user sends, silenced by `"reminder": false` in `~/.flow/settings.json`.
- **`references/style.md`**: the house style, 202 lines, read before writing any file. Split 3 ways on 2026-09-18: a rule file also reads `references/write-rules.md`, the rule ids, and a documentation page also reads `references/write-docs.md`, which adds that a page added, renamed or dropped updates its folder's `README.md` in the same edit.
- **`references/harnesses/claude-code.md`**: where Claude Code keeps its own files, on the machine and in a project, and which of those paths a migration may name. Written 2026-09-21, 42 lines. One file per harness in that folder, so a second harness is a file added there rather than an edit to 3 skills. Nothing reads it yet: `/flow:setup-machine`, `/flow:setup-project` and `/flow:migrate` are all unbuilt.

## 12 skills, typed `/flow:<name>`, each switched by its link

`skills/drafts/` is empty.

- **`phases/`**: `groundwork`, `execute`, `prototype`, `debug`
- **`tools/`**: `start`, `handoff`, `file-findings`, `research`, `tickets-from-spec`, `visualize`
- **`dev/`**: `review`, `apply-domain-findings`

**Every folder and every frontmatter `name` is bare, and the `flow:` is added at load time.** `skills/.claude-plugin/plugin.json` holds the one word `flow`. `flow install` links the set into `~/.agents/skills/flow/skills/`, copies that file to `~/.agents/skills/flow/.claude-plugin/plugin.json`, and links `~/.claude/skills/flow` to the folder. `lab/context/skills.md` → `### Flow is a plugin too` holds the argument.

**Proven on both harnesses 2026-09-18, in scratch installs.** Claude Code 2.1.275 loaded `flow@skills-dir` through the linked folder and read the rules through the import. Codex 0.155.0 named all 12 skills `flow:<name>` and read the rules through the link. Codex needs the manifest in the clone: it follows each skill's link to the real folder, then looks for a manifest above that folder and never above the link. The first Codex run, with the manifest only in the plugin folder, named every skill bare.

**A Flow skill is on while its link in `~/.agents/skills/flow/skills/` exists.** The 10 outside `dev/` are essential: always linked, left out of `flow skills ls`, refused by `on` and `off`, and a line naming one is a `flow doctor` problem. The 2 in `dev/` start off, and `flow skills on <name> --machine` or `--global` links one. `skills.essential()` in `scripts/flow/lib/skills.js` holds the test. There is no project level for a Flow skill: `skillOverrides` does not reach a plugin's skills, and `home/settings.json` no longer ships the key.

`/flow:start`, `/flow:tickets-from-spec` and `/flow:apply-domain-findings` are user only. `user-only-skills` in `home/AGENTS.md` names them, so every other file names them bare. A user-only skill missing from that list is marked `(user only)` where the agent first meets it, by `references/style.md` → `### Only in a loaded file`. `/flow:tickets-from-spec` was `/flow:cut-from-spec` until 2026-09-18. The 4 phase skills take a ticket id and load it with its files on their first line, since 2026-09-16. `/flow:debug` still sends a bug inside a web page to `/web-pages`, which left for `domain-skills` and waits on its rebuild there.

## `flow` has 10 command groups, and all 160 tests pass

One of them, *a worker hands the parent its diff and the command that deleted a file*, fails about one run in five when the machine is busy. It is a race in the test, not a bug in `changes.js`, and it has a line in `backlog.md`.

- **tickets**: `next`, `check`, `ls`, `tree`, `get`, `new`, `edit`, `dep`, `file`, `drop`, and one command per status move
- **setup**: `install`, `doctor`, `sync` and `uninstall`. `install` links everything, copies the plugin manifest, and records the machine's original before it creates anything. Under `~/.flow/` it makes 3 folder links into the clone, `scripts`, `references` and `docs`, the last added 2026-09-21 so `/flow:help` can name a manual page by a path that reads the same on both machines. It clones every missing repository into `~/.flow/repos/`: `flow` is a link to the clone that ran it, then `util`, `toolbox` and one `sources/<owner>_<repo>/` per skill repository, all `--depth 1`, and it runs util's own `util install` for the `util` and `u` names. `--no-clone` skips all of it. It writes no rule file any more, and ends by saying to restart Claude Code and type `/flow:setup-machine`. `doctor` checks all of it, `permissions.defaultMode` in `~/.claude/settings.json` included, and names the skill to type for each piece it finds missing. `--prereq` cuts the report to Flow's prerequisites, the 3 programs on PATH, which is the one form that runs on a machine Flow was never installed on: it is step 0 of all 3 management skills, and `scripts/flow/lib/prereq.js` holds the list. It opens on a stopped run, `~/.flow/run.json` on disk being a problem that names the step and both ways out, then compares the machine's `~/.flow/version` with the newest `CHANGELOG.md` entry and a project's `.flow/version` with the machine's, both notes suggesting `flow up`, and a number above the newest entry a problem. `--updates` adds the remote's newest `v<number>` tag, the one check that touches the network. `sync` brings the other machine's `~/.flow/` down, then sends this one up. `uninstall` puts every original back, then deletes `~/.flow/` and the clone. `install`, `doctor` and `uninstall` each take one `--root <dir>` standing in for the home folder
- **rules**: `scorecard`
- **sharing**: `contribute`, which opens one pull request per skill on `domain-skills`
- **cases**: `new`, `ls`, `get`, `edit`, `issues`. `new` fills in `model:` from the session's transcript and `effort:` from `CLAUDE_EFFORT`. This repo's own 14 cases were deleted on 2026-09-16, condensed into `lab/context/rejected-replies.md`.
- **skills**: `ls`, `add`, `on`, `off`, `drop`, built 2026-09-23 in place of `domain-skills`, `private-skills` and `npx skills`. A line `"skills": { "react": "on" }` sits at one of 3 levels, the project's `.flow/settings.json` (no flag), `~/.flow/settings.local.json` (`--machine`) or `~/.flow/settings.json` (`--global`), the nearest winning name by name. `scripts/flow/lib/skill-links.js` `apply()` makes the links match, and every command and every session start runs it. `off` in a project refuses a skill on for the whole machine, and names `--machine`. Every clone, pull, switch and install adds a line to `~/.flow/history.jsonl`. `lab/context/management.md` → `## Skills, sources and the machine's clones, ruled 2026-09-23` is the specification
- **overlays**: `get`
- **git**: `get`, `allow`, `ask`, `off`, the switch deciding whether the agent may run git commands that write. `--project` writes the project's `.flow/settings.local.json`, which the template ignores, since 2026-09-23, so `.flow/settings.json` can be committed with the project's skill lines
- **audit**: an index of Claude Code's transcripts, with queries over it
- **restore**: `ls`, `machine` and `project`, over `~/.flow/originals/<machine or project>/`, one folder per place holding every path as it was before Flow first touched it. The folder is written in one window and never added to: `flow install` opens the machine's, and the first `/flow:setup-machine` or `/flow:setup-project` closes it. A migration is carried out by `scripts/apply-migration.js`, never a `flow` command: the agent writes `migration.md` and `files/` under `~/.flow/migrations/`, and after the yes the skill runs the script, which records each path into the open window the moment before changing it, refuses when a file it would write or delete changed after the migration was written, and refuses when a prerequisite is not met, so a skipped step 0 still writes nothing. 4 locks keep `flow restore machine`, `flow restore project` and `flow uninstall` away from the agent: no session open, a word typed at `/dev/tty`, no flag that skips the prompt, and `deny` rules in `home/settings.json`. Built 2026-09-18 as snapshots, rebuilt 2026-09-20 as the original. `docs/manual/reference.md` → `## Migrations and the original` documents all 3

**`install.sh`, at the repo root, built 2026-09-23, is what the pasted `curl | bash` line runs.** It checks for git, node and claude, clones Flow into `~/.flow/repos/flow/` unless that exists, then runs `flow install` with every other argument. `--use <folder>` skips the clone. The branch it clones is `main` until a release writes its tag there. `lab/context/management.md` → `## One pasted line installs Flow, ruled 2026-09-23` is the specification

## 12 hooks, all in `home/settings.json`

- **`guard.js`**, before every shell command: enforces the git switch.
- **`changes.js`**, around every edit, write, shell and MCP call, and at subagent start and stop: records each change under the id of the agent that made it.
- **`rule-check.js`**, before every edit and write: runs the rule checks and records the results.
- **`instructions-loaded.js`**: records which rule files entered context.
- **`check-ticket.js`**, when a phase skill or `/flow:start` is typed with a ticket id: blocks the skill when the id matches nothing, so a typo loads nothing.
- **`reminder.js`**, on every message the user sends: prints `references/reminder.md`, unless `"reminder": false` says not to. It was a bare `cat` until 2026-09-20, and a `cat` reads no setting. Every line Flow prints by itself gets a key like it, read through `settings.prints(name)`.
- **`file-suggestion.js`**, not a hook but named by `fileSuggestion` in `home/settings.json`: builds the list `@` opens, git-ignored files included and the most recently changed first. It walks the project once, skipping a fixed list plus `fileSuggestionIgnore` from all 3 levels, saves the walk to `<os temp>/flow-file-suggestion/<hash>.txt`, and answers each keystroke from it, walking again in the background once the save is 2 seconds old. Measured 2026-09-23 on this repo's 33,500 files: 50 to 58 ms a typed query, 75 ms a bare `@`, 34 ms of each Node starting. The first `@` in a project waits 250 ms at most. The other `@` entries, subagent names among them, still show beside its paths: checked by the user in a live session 2026-09-23.
- **`session-check.js`**, when a session opens: one line when `~/.flow/run.json`, `~/.flow/version` or the project's `.flow/version` needs attention, and nothing when all 3 are fine. A stopped run silences the other version lines. It is also the only thing that names `/flow:migrate`, a skill the agent can never start. `"sessionCheck": false` silences the printing. The same hook makes every skill link match the settings, returning `reloadSkills: true` when one changed, starts `scripts/skills-pull.js` detached, and prints what that job left in `~/.flow/skills-update.json`.

## Every skill repository updates itself, built 2026-09-20, widened 2026-09-23

`scripts/skills-pull.js` runs detached from the session check, and `scripts/flow/lib/skills-update.js` holds all of it. It walks every clone under `~/.flow/repos/sources/`. Every skill from one is a symlink into its clone, so one pull makes every project holding one current.

- **Two guards, both read before anything is pulled**: uncommitted work in the clone, and a pull that would not be a fast-forward, which `git pull --ff-only` refuses by itself. Either one writes `~/.flow/skills-update.json` and the next session prints it.
- **`"skillsAutoUpdate": false`** turns the pull into a fetch that names the skills waiting, and the line prints every session until the user pulls.
- **It looks at most once every 6 hours**, reading the clone's `FETCH_HEAD`, and every session while a note is waiting, which is what makes the line stop once the user has pulled by hand.
- **`~/.flow/skills-update.json` and its lock stay on this machine**, both named in `flow-repo.js`'s ignore list.

## 1 rule check, and it only measures

`scripts/rule-checks/js-and-ts.js` counts a run of `//` lines above a function, a class or an arrow function. It records and never warns, since the user ruled comment shape minor. It fired correctly in a live session on 2026-09-10.

## The 3 submodules

- **`lab/util`**: the second command-line tool, [`Adrian333Dev/util`](https://github.com/Adrian333Dev/util). Namespaces `claude proxy`, `fs tree|merge|open|link`, `git save|work`, `github clone|bookmark`. 54 tests pass. Installed for real on this machine, from `~/code/util`.
- **`lab/toolbox`**: 155 outside tools, one file each, under `agent-tools/` and `software/`, most with the tool's README beside it. `bin/tool.js add` saves a tool and `refresh` rewrites what GitHub owns.
- **`lab/domain-skills`**: [`Adrian333Dev/domain-skills`](https://github.com/Adrian333Dev/domain-skills), public. It holds 2 drafts, `web-pages` and `excalidraw`, and no finished skill. On a machine it is the first entry of `sources`, cloned to `~/.flow/repos/sources/Adrian333Dev_domain-skills/`. This machine has no `~/.flow/` at all, so `flow skills` has nothing to read.

## Docs: 9 manual pages and 10 dev pages

- **`docs/manual/`**: `reference.md`, `settings.md`, `tickets.md`, `where-everything-lives.md`, plus the index, and `use/` holding `start.md`, `phases.md`, `status.md` and `resume.md`, shipped 2026-09-16 with examples captured from the scratch project's seeded board. The user may still have the set rewritten whole if the one-page-per-chunk shape reads badly. Still unwritten: what Flow is, and the approval discipline.
- **`docs/dev/`**: `agents.md`, `audit.md`, `checkout.md`, `claude-code.md`, `context-cost.md`, `layout.md`, `scratch-session.md`, `skills.md`, `tests.md`, plus the index. `context-cost.md` reads as a design finding, and nobody has decided whether it stays there.

## Built and never run for real

- `flow contribute` and `/flow:apply-domain-findings` against GitHub
- 2 change-record paths, named in `backlog.md` → `## After V1` → `### Subagents and dispatch`
- a warning carrying a rule's whole text because the rule's file never loaded
- `flow install` on this machine, by decision
- `apply-migration.js`, `flow restore` and `flow uninstall` against a real machine or project, since no setup or migration skill exists to write a migration
- `flow sync` against a real GitHub remote. Every test runs against a folder on this machine, so nothing proves the round trip through `git push` and `git pull`

## Rulings and measurements with no other home

- **A command that exists to print gets its whole output compared against a literal**, set 2026-09-11. A test reading only the filesystem passed over a bug where the command described the filesystem wrongly.
- **Stack content lives in a domain skill, never in a rule file with `paths:`**, set by the user 2026-09-10, rejecting a `rules/typescript.md`.
- **`CHANGELOG.md` is back, holding entry `1` dated 2026-09-20 and nothing else.** The next entry waits for the first machine Flow is installed on, since a migration is the only reader an entry has. An entry's number is the version: `~/.flow/version` holds the number a machine last applied, and a migration is every entry above it. **An entry stays a sentence, and the detail sits in a guide beside it**, `upgrades/12.md`, the step from 11 to 12, naming every path that moves and the state it ends in. `upgrades/README.md` is the format, and the folder holds nothing else yet. `CLAUDE.md` → `no-changelog-entry-yet` and its `a-machine-change-gets-a-guide` are the writing rules, and `lab/context/management.md` → `## The changelog comes back` holds the argument, the rejected `1.4.2` shape included.
## Which record covers what

All in `lab/context/`, flat. 20 files were merged into 9 on 2026-09-16, and `rejected-replies.md` was added the same day. Every one is history except this file.

- **`claude-code.md`**: what Claude Code cannot do that Flow needs. 6 issues filed, 3 on 2026-09-10 and 3 on 2026-09-21, all open. What it *can* do moved to `docs/dev/claude-code.md`.
- **`drawing.md`**: the settled `/flow:visualize` rulings, what `canvas.js` measured, and the engine that may never be built.
- **`handoff.md`**: the latest handoff, rewritten whole each time.
- **`knowledge-base.md`**: how `/flow:research` reaches outside tools and where Flow keeps what it learns about them: Context7 through a script, one folder per tool under `~/.flow/wiki/`, where a research report goes, and capture feeding a harvest into the tool's skill. Opened 2026-09-18. The design is agreed, and the file ends in a step-by-step build plan that waits for the management skills. The one record here that is not history yet. `context7-report.md` and `context-7-alternatives.md` beside it are the 2 reports the user supplied as input.
- **`management.md`**: the management skill's groundwork map, opened 2026-09-16: 8 branches, the user's rulings, and every earlier proposal filed under the branch it feeds. Walked to the end 2026-09-17, every branch closed, with a dated section per locked decision. The attack ran the same day against this machine and found 6 faults, all fixed in place. Routed the same day into `backlog.md` → `## V1` → `### The management skill, in build order`, 14 lines run in the order written, so the map is history like every other record here and the open work is on those lines. On 2026-09-18 `## Snapshot and restore` was rebuilt around 2 folders, a migration and the snapshot taken as it runs, and project setup split into its own skill, so the management skill is now 4 skills: `/flow:setup-machine`, `/flow:setup-project`, `/flow:migrate` and `/flow:help`. On 2026-09-20 `## The original replaces the snapshot` was appended: one original per place in place of every snapshot, `flow uninstall`, the 4 locks on it, the 2 refusals that catch a skipped setup, `~/.flow/` as one private git repository, and the 2 questions `flow install` asks.
- **`manual.md`**: what `docs/manual/` is, and the manual pages still planned.
- **`models.md`**: telling which model produced a piece of work, and running Flow on another harness. The port costs per component are locked; `### Codex namespaces plugin skills, and reads Claude Code's manifest` was added 2026-09-18 and decides how skills are named on both harnesses. `### The hooks on Codex, walked 2026-09-18` records the user deferring Codex until Flow ships on Claude Code, and holds the hook-by-hook design the port starts from.
- **`rejected-replies.md`**: every reply the user rejected, one line each with their words. The test set `## The reply` was built against.
- **`rules.md`**: the enforcement bridge, the conduct rules, the negation split, and the user's feedback on how a loaded file is written.
- **`skills.md`**: when a long skill takes an argument, how a plugin is switched on per project, the `domain-skills` pipeline, browser tooling and the toolbox.
- **`state.md`**: this file.
