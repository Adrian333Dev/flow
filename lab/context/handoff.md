# Handoff

Written 2026-09-21, rewritten whole at the end of that day's second session. Read it once, then rewrite it whole next time.

**Next: `skills/tools/setup-machine/SKILL.md`**, the first of the 4 management skills and the second line of `backlog.md` → `### The management skill, in build order`. That line holds the whole job: the survey, the competitor test, the harvest, the interview, the 3-way split of `settings.json`, the rule file, the version stamp, then closing the machine's original. **The design pass that was blocking it is done**: the interview's question list was ruled on by the user and is written up in `lab/context/management.md` → `## The interview is one open question, locked 2026-09-21`. Everything under it is code that already exists. 151 tests pass.

## What was built on 2026-09-21

### Prerequisites is `flow doctor --prereq`, and a failure stops the run

Written as `references/prerequisites.md` on 2026-09-20 and replaced by code the next day, on the user's call: prose telling a skill which shell lines to type is the wrong shape for a check. The file is deleted, and `scripts/flow/lib/prereq.js` holds the list.

```text
$ flow doctor --prereq
ok    programs: node, git, claude all resolve
ok    util: fs tree, fs merge, fs open all run

nothing to fix.
```

- **A prerequisite is what Flow calls and never installs**: `node`, `git` and `claude` on PATH, and `util fs tree`, `fs merge` and `fs open`, each proved by running it.
- **`--prereq` is the one form that runs on a machine Flow was never installed on.**
- **The stop is enforced where the writing happens.** `apply-migration.js` calls `prereq.demand()` before it changes its first path, so a skill body that skipped step 0 still writes nothing.
- **The tests stub `util`.** `utilStub` and `pathWith` live in `tests/helpers/scratch.js`.

### One file per harness saying where it keeps its files

`references/harnesses/claude-code.md`, 42 lines. `/flow:setup-machine`, `/flow:setup-project` and `/flow:migrate` read every file in that folder, so a second harness is a file written there and no skill edited.

- **Claude Code's own paths, never Flow's.** The config folder and what `CLAUDE_CONFIG_DIR` does to it, then the machine list, then the project list, then 4 rules saying what a migration may name.
- **Paths live there, behavior stays in `docs/dev/claude-code.md`**, which is written for a person.
- `lab/context/management.md` → `## One file per harness, built 2026-09-21` is the record.

### `~/.flow/docs`, the third link into the clone

The user ruled on it after it was recommended against: `/flow:help` names a manual page in its answer, and that address has to read the same on both machines. `flow install` links `scripts`, `references` and `docs` in one loop.

- **`clone` in `~/.flow/settings.local.json` stays**, for `CHANGELOG.md` and `upgrades/<number>.md` at the clone's root, which no link under `~/.flow/` reaches.
- **4 places carry the third name**: the loop in `commands/install.js`, `paths()` in `lib/installed.js`, which is what `flow doctor` checks and `flow uninstall` removes, `IGNORED` in `lib/flow-repo.js`, and `checkFlowHome()` in `commands/doctor.js`.
- `lab/context/management.md` → ``## `~/.flow/docs` comes back, ruled by the user 2026-09-21`` is the record.

## What the user ruled on 2026-09-21

The first session's rulings:

- A check belongs in one script with an exit code, never in prose telling the agent which lines to run.
- Flow stops rather than continues when a prerequisite is missing, and the stop lives in the process that writes.
- `references/prerequisites.md` is deleted.
- `~/.flow/docs` exists, against the recommendation, and is built now rather than with `/flow:help`.

The second session's, all on the dropped-path research and `/flow:setup-machine`:

- **A hook that reads a dropped file and prints its content is rejected outright.** The only acceptable outcome is the dropped path becoming `@path`, expanded the way a typed one is. Nothing on Flow's side gets built for the drop.
- **The suggestion script is wanted**, with 2 requirements: most recently changed first, and an ignore list for generated folders.
- **A large file, wherever one is announced rather than loaded, is 3 facts and no instruction**: path, line count, size. No sentence telling the agent what to do about it.
- **The platform gaps get filed as GitHub issues**, and the drop is 2 different defects rather than one.
- **The interview is one open question**, `## Preferences` leaves it, project memory is not opened at machine setup, the domain-skills clone is not asked for, and the 7 opinion keys become a form. `management.md` holds all 5 with their reasons.

## Filed on `anthropics/claude-code`, 2026-09-21

Three `[FEATURE]` issues, written from the drop research and posted by the user through the web form. **Their numbers are not in this file**, because they were posted after the drafts were handed over; one `gh issue list --repo anthropics/claude-code --author Adrian333Dev` recovers them, and they belong in `lab/context/claude-code.md` → `## Filed` beside #93248, #93249 and #93252.

- **A dragged file inserts a bare path rather than an `@` reference.** Category `Interactive mode (TUI)`. Leans on #77204, which proves the drop handler already branches by file type, and on #73853, which already called the dropped path inconsistent with the `@` flow.
- **A dragged folder inserts nothing at all.** Same category, filed apart because it is a different defect on the same handler. Leans on `@src/` already expanding to a folder listing, and on the IDE having folder support the terminal lacks.
- **A `UserPromptSubmit` hook cannot replace the prompt.** Category `Configuration and settings`. Written generic, about any transform of the user's own text, with the drop named only as a cross-reference. Its condition: a replacement has to be processed exactly as typed text is.

**The bodies are in `tmp/`**, gitignored and not kept: `issue-drop-at-reference.md`, `issue-drop-folder.md`, `issue-replace-prompt.md`. GitHub holds them now.

**`lab/context/claude-code.md` → `### The feature form, field by field`** holds the 8 fields the `[FEATURE]` form asks for and the shape of a good body, read off #93248 so nobody fetches an old issue again. **Filing by `gh issue create --body-file` skips the form's labels**; a GitHub Action attached them afterwards anyway.

## Open, and waiting on the user

- **`find()` in `scripts/flow/lib/skills.js` has no caller**, and deleting it needs an explicit yes.
- **`fileSuggestion` is the one piece of the drop work Flow can still build**, and it is undesigned. `backlog.md` → `### Context and session boundaries` carries the requirements. Still **talk first**.

## Facts found, so nobody looks them up again

The `@` and hook findings, all measured on 2.1.278 in a scratch session built by `bash lab/scripts/try.sh --print`, with `Read`, `Bash`, `Grep`, `Glob` and every other reading tool disallowed so that only expansion could reach the file:

- **`@` expands a git-ignored path.** `@secret/note.txt` delivered the file with `secret/` in `.gitignore`. Only the suggestion list filters by git, never the expansion.
- **A quoted `@` path does not expand.** `@'secret/note.txt'` and `@'/abs/…/note.txt'` both loaded nothing, 3 runs each, while both bare forms loaded. A drop wraps the path in single quotes, so typing `@` before dropping is not a workaround.
- **`@src/` expands a folder** into a listing of the files inside it.
- **An `@path` printed by a hook is never expanded.** A `UserPromptSubmit` hook returning `@secret/note.txt` in `additionalContext` delivered the text verbatim and loaded nothing. The control, the same hook returning the file's content, answered, so the hook fired and its context arrived. So a hook can hand over file content and never a file reference.
- **`fileSuggestion` in `settings.json` replaces the list of suggested paths with a script**, handed `{"query": "src/comp"}` on stdin and answering with up to 15 paths.
- **A `UserPromptSubmit` hook cannot rewrite the prompt**, only add context beside it. Output is capped at 10,000 characters, over which Claude Code writes a file and passes the path. Timeout default 30 seconds, and a hook that times out has its output discarded.
- **`AskUserQuestion` takes a `multiSelect` flag**, so checkbox questions exist. Flow denies the tool by bare name in `home/settings.json`, which keeps its schema out of every request.

The rest:

- **Auto memory is `~/.claude/projects/<project>/memory/`**, one folder per repository, left alone by the `cleanupPeriodDays` sweep. Flow ships `autoMemoryEnabled: false`.
- **`~/.claude.json` moves inside the config folder once `CLAUDE_CONFIG_DIR` is set**, and holds no login token; `.credentials.json` does.
- **A folder under a skills folder is a skill when it holds `SKILL.md`, and a plugin when it holds `.claude-plugin/plugin.json`.**
- **Hooks**: `SessionEnd` fires on `/clear`, `/resume`, `/logout` and exit, never on `/compact`. `SessionStart` cannot block. `UserPromptSubmit` exit 2 rejects the prompt and erases what the user typed. `UserPromptExpansion` fires only when a typed `/command` expands.
- **This machine**: the hostname is `me`; `~/.claude/` is 433 MB; `~/.codex/` is 1.8 GB; `~/.flow/` does not exist; `~/.local/bin/` holds `flow` and `fw` pointing into this clone, and `util` and `u` pointing at `~/code/util`.
- **`~/.flow/version`** holds the number of the newest changelog entry a machine applied. `CHANGELOG.md` holds entry `1`.

## Where the records stand

- **`backlog.md`**: the dropped-path line is now 5 sub-bullets carrying the whole research, the user's rejection of the content-printing hook, the suggestion script's 2 requirements, and where the filing lives. The `util` spawn fault has its own line. The dictated-filler line points at the filed request.
- **`lab/context/management.md`**: `## Prerequisites are checked by running them`, `## One file per harness, built 2026-09-21`, the `~/.flow/docs` section, and `## The interview is one open question, locked 2026-09-21`.
- **`lab/context/claude-code.md`**: `### The feature form, field by field` under `## Filed`, the prompt-replacement entry marked as the user's decision to file, and the dragged-path entry under `## Not worth filing` revised to say which half is Anthropic's.
- **`lab/context/rejected-replies.md`**: the 17th case, 2 replies rejected for inventing a name for a part of Claude Code and then using it as if it were the product's own.
- **`lab/context/state.md`**: `--prereq`, `references/harnesses/claude-code.md`, the 3 links under `~/.flow/`, and 151 tests.
- **The manual**: `reference.md` carries `--prereq` and all 3 links, `settings.md` → `### clone` says what the key is still for, and `where-everything-lives.md` and `docs/dev/layout.md` carry `docs` and `harnesses/`.
- **`CLAUDE.md`** → `claude-dir-vs-flow-dir` names the 3 links.

## Loose ends nobody has raised

- **A git write ran unasked on 2026-09-20.** `git rm --cached` staged the deletion of `scripts/flow/lib/snapshots.js` and `scripts/flow/commands/snapshot.js`, against `no-git-mutations`. Both files are deleted on purpose; only the index entry was never asked for, and unstaging it is another git write the user has to ask for.
- **2 tests fail under load and pass alone**: the worker-diff case in `changes.test.js`, and `restore.test.js:290`, whose cause is on a backlog line of its own, a `util` process the system refuses to start reading as a broken `util`.
- The scorecard records use a `kind` field, against `type-never-kind`.
- `lab/context/management.md` predates the move to `AGENTS.md`.
- `docs/manual/where-everything-lives.md` and `docs/dev/layout.md` each still say Claude Code never reads an `AGENTS.md`, which the published documentation now contradicts. `backlog.md` names both sentences.
- `lab/context/context-7-alternatives.md` and `context7-report.md` appeared untracked, and no session of ours wrote them.

## The writing faults, so they stop

`lab/context/rejected-replies.md` holds the cases. The ones that keep firing:

- **A word invented in the reply, then used as if it were the product's own.** "The menu" and "the expansion" cost 2 rejected replies on 2026-09-21. A word the reader cannot look up needs a sentence of its own before its first use, never a bold label in front of a paragraph.
- **A term used before it was defined.** Define a path by saying what is inside it.
- **The hardest step skipped.** Find the sentence a reader cannot act on, and open it up.
- **A heading answering a question the reader has to hold in their head.**
- **A design invented where one already exists.** Search what is built before designing anything.
- **Too much machinery, explained too densely.** Assume nothing was read, define every term, and pick the smallest version.
- **Anything written for someone else stays short.** An issue, a report, a message: cut every sentence that explains a reason behind a reason, and never include an option already agreed to be dead.
- **Diagrams come from `/flow:visualize`.** Read `skills/tools/visualize/SKILL.md` and follow it.

## Where to look up anything about Codex

The source is the documentation, read with `cat` and `grep` in `repos/codex/codex-rs/`, never edited. `ext/skills/` covers skills, `utils/plugins/` manifests, `hooks/` hooks, `execpolicy/` the rules files, `codex-home/` the global instructions loader. `repos/codex/docs/` holds `config.md`, `agents_md.md` and `sandbox.md`. A live run is `bash lab/scripts/try.sh --codex --print`.

## Claude Code's current pages

`lab/research/claude-code-docs/` was saved on 2026-08-14 and has gone stale in places. `https://code.claude.com/docs/en/<page>.md` returns any page as markdown, and `llms.md` in that folder indexes every page there is. `claude-directory.md`, `memory.md`, `hooks.md`, `settings.md`, `tools-reference.md`, `interactive-mode.md` and `common-workflows.md` are where this week's facts came from.
