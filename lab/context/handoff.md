# Handoff

Written 2026-09-27. Read this once, then rewrite it whole next time.

## Next: 4 conversations, then the final sweep

**The management skill is built apart from `/flow:help`, which is parked until the manual is rewritten.** The small batch, the second machine and the research redesign are built, below. What is left, in the order recommended to the user:

1. **4 conversations**: filling `## The user` and `## Preferences`, wrapping up when the context gets large, a bare `/flow:start`, and who reads `~/.flow/workflow-notes.md`.
2. **The final sweep.** The user warned it is much bigger than it looks.

## Built 2026-09-27: the research redesign

Every step of `lab/context/knowledge-base.md` → `## The build plan`, with the 3 open points approved as recommended. `lab/context/state.md` → the paragraph under the 12 skills holds the mechanism, and `docs/manual/research-and-capture.md` explains it to a user. The suite passed 188 of 188 after it; no script under `scripts/` changed.

- **One folder per outside tool, `~/.flow/wiki/<tool>/`**, shared by every project: `index.md`, `research/`, `findings/`, and `downloads/`, which never syncs.
- **Context7 through `context7.sh`**, never an MCP server. Trials ran against the real service: search, an unpinned and a pinned question, the id saved and reused, a stale line rewritten, a bad id, an unreachable address, an HTTP 500.
- **`fetch-docs.sh` downloads into the tool's folder** and logs the tool's latest release. Trials: Next.js, Context7 with a clone and a pull, a site with no `llms.txt`.
- **Never run**: `/flow:research` in a live `try.sh` session, since building a run needs the setup session at the user's terminal.
- **Each script call prompts**, since `home/settings.json` allows no `bash ~/.agents/skills/...` command. The same held for `fetch-docs.sh` before. Nobody has decided whether it should.

## Built 2026-09-27: every machine after the first joins the Flow home

The user's words for `~/.flow/` in this design are "the Flow home" and "the private flow repo". The suite passed 188 of 188 on the last whole run. `lab/context/state.md` → the `setup` bullet holds the mechanism. The decisions, each the user's or agreed:

- **The repository is always `<login>/flow-home`, found through `gh`, never renamed.** `--repo` and the address question are gone. `gh` is the 4th prerequisite. `FLOW_HOME_REMOTE` is for the tests and `try.sh` alone.
- **`gh` signs in with a pasted classic token**, since the browser sign-in fails on WSL. Scopes `repo`, `read:org`, `gist`, which the user tested; `delete_repo` stays off.
- **A new machine installs the release the Flow home is on**, read from the machine records. The user's idea.
- **A machine behind another's record syncs nothing until `flow up`.** The user wanted it to stop working entirely; the agreed version stops only sync, and sessions show a line. Each machine migrates its own copy, then git merges the two. The earlier idea of upgrade guides in 2 parts was dropped.
- **Records hold `name`, `joined`, `flowVersion`.** `lastSync` was proposed and left out: writing it on every sync would make every sync send a change.
- **`scorecards/`, `audit/` and `changes/` joined the ignore list.** The manual already said they stay, and the list said otherwise.
- **Install checks everything before it links anything**: sign-in, repository, records, version, files in the way, name. The user's idea. The checks stay in `flow install`, never `install.sh`, which only checks the 4 programs.
- **The name offered is `<type>-<system>`, `desktop-wsl`**, numbered on a clash with a record, and claimed by sending the record up at install. The prompt is `Machine name (default: desktop-wsl):`, the user's wording. A rebuilt machine takes its old name back through `<name> is taken. Replace it? (y/N)`. Dead machines' records stay: no command removes one.
- **The name is git's `flow.machine`**, the user's call. util reads it where `util.machine` is missing, changed in the `lab/util` submodule, where util is worked on, and committed by the user. `~/code/util` is the clone this machine runs, which pulls from GitHub, and is never edited. This machine's `util.machine = me-kmkw` came from testing, and the user will drop it before the clean install; `util uninstall` leaves git config alone. It also makes util's test *git work refuses to send from a machine with no name* fail on this machine only: 54 of 54 pass with an empty global config.
- **The Flow home carries a README**, 2 short paragraphs saying Flow manages it and a hand edit can break sync, with no list of files: the user cut the lists twice. The repository's description says `Managed by Flow. Never rename, edit or make public.`
- **Every line Flow prints stays short, with no explanation.** The user's rule, raised again this session: the manual explains, the CLI never does. Backlog item 5 of the writing passes is where the rules for printed lines get written.

Never seen for real: the `gh` sign-in, `gh repo create`, the tag switch and rerun inside `flow install`, the background fetch in a live session, the PowerShell chassis read inside an install, the taken-name question.

## Built 2026-09-26

**A test run made a commit in this repository**: `54272df start`, author `t <t@t>`, holding 13 of today's files as they stood at 14:24. 10 copies of `changes.test.js` shared one scratch folder, one deleted another's `.git`, and that copy's `git commit` climbed up to Flow's repository. Nothing was pushed. The user was told and committed the rest on top of it as `2c23bc9`. Both tests that commit now set `GIT_CEILING_DIRECTORIES`.

- **The session check never takes the home folder for a project.** `scripts/session-check.js` → `projectRoot()`. Before, a session opened outside a project unlinked every skill switched on for the whole machine. Test in `session-check.test.js`, shown failing on the old hook first.
- **`flow restore machine` offers the projects first**: `restore` for all, `machine` for the machine alone. `confirm.word()` takes a list of words. `docs/manual/reference.md` shows the prompt. The user ran it at a real terminal on a pretend machine, `node tmp/restore-try/build.js`, typed `restore`, and all 3 paths came back. The printed layout is messy, filed in `backlog.md` → `` `flow`, the tool ``.
- **A session opened in a git repository with no `.flow/` suggests `flow setup project`**, as a `systemMessage` the user sees and the agent is never told to act on. The user refused `AskUserQuestion`, switched off on this machine, and wanted no instruction to the agent. `"setupReminder": false` turns it off, `"setupReminderSkip"` lists folders it never shows in. `flow settings off setupReminder` writes the folder list for the repository it is typed in, and `--machine` or `--global` the key, the levels `flow skills` uses. The user wants the line shorter still, and accepted it for now. The home folder and `~/.flow/` never get it. Whether Claude Code shows the line at session start was read in the docs, never seen in a live session.
- **`/flow:groundwork`'s 6 `### When` cases** were moved to a reference file, then moved back the same day at the user's call: 52 lines saved cost a second read, and `references/style.md` §4 puts material some runs need in `### When` sections.
- **`flow sync`**: the first sync to an empty remote no longer refuses, and a refused pull prints git's real reason. `sync.test.js` runs a round trip through a bare repository.
- **`scripts/flow/lib/changes.js` → `snapshot()`** keeps the real index's modified time on its copy, which fixed the test that failed 1 run in 5. A new test forces the same-second timing and failed 3 of 3 before the fix.
- **`lab/research/claude-code-docs/`** fetched again, 3 pages added, 3 citations repointed.
- `references/workflow.md` → `Migration` says `flow restore` is the undo. The backlog moved 5 items that need Flow in real use to `## After V1`.

## Facts established

- **Bash output reaches the agent up to about 30,000 characters in total**, then a 2,000-character preview and a saved file.
- **Read returns 25,000 tokens per page**, and at most 2,000 lines by default, with `offset` and `limit`.
- **`--setting-sources user` skips project instructions at any depth, skills, commands, subagents, settings and `.mcp.json`.** Probed in `tmp/probe-sources/`.
- **The `util` on PATH runs `~/code/util`, an older copy than `lab/util/`.** Its tree shows no line counts.
- **A test's scratch folder sits inside Flow's repository**, so git finds Flow above a folder never initialised. `GIT_CEILING_DIRECTORIES` stops it, as the setup and update tests do.
- **`/doctor prompt-audit` needs Anthropic's bundled `claude-api` skill**, and `home/settings.json` sets `disableBundledSkills: true`, as does this machine's own `~/.claude/settings.json`. The user ran it 2026-09-26 and got that refusal. It stays filed under After V1, to run once Flow is installed.
- **`flow restore` and `flow uninstall` refuse inside any session**, this one included, since the lock looks for any running `claude` process on the machine.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Keep designs simple.** Goals and tips over procedure, no rules on how to use subagents, few options for the user.
- **Flow must stay flexible**: not every folder is a project, and nothing may force one to be. Said 2026-09-26.
- **Explain every term the first time**, in plain words, and answer every topic.
- **Push back once with the deciding argument** when the user's idea loses.
- **Never `cd` in a command.** Use absolute paths.

## Loose ends nobody has raised

- `scripts/flow/setup/` holds the update session's text too, so its name undersells it.
- util's test `git work refuses to send from a machine with no name` fails on this machine, since the global git config sets `util.machine`.
- `docs/manual/reference.md` has a heading `# Delapse into Flow` in the middle of `## Migrations and the original`, not written by this work.
- The scorecard records use a `kind` field.
- Claude Code now has `syncClaudeAiSkills`, which downloads the skills enabled on the claude.ai account into `~/.claude/skills/synced/`. Flow's setup does not know it exists. `settings-reference.md` → `### syncClaudeAiSkills`.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`, `tmp/docs-fetch/`, `tmp/probe-sources/`, `tmp/ps.md`.
