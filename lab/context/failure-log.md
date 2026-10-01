# The failure log and `~/.flow/logs/`

Designed with the user 2026-09-27 and built 2026-09-28. What got built is in `docs/manual/reference.md` → `## The failure log` and `docs/manual/where-everything-lives.md` → `logs/`. This file holds why it is shaped that way.

## What the user asked for

"Something kind of like a browser's console, but for our workflow." Any mechanical failure recorded at once, with full detail, for later: an MCP server that failed, a script, an API, a subagent that did not return its diff. Kept apart from `~/.flow/workflow-notes.md` and study cases, which record friction with Flow's rules, not broken machinery.

## Only what Flow built or chose

The user's rule. A `grep` that finds nothing exits with 1, and nobody would act on that later. The same goes for a `Read` of a missing file or an `Edit` that did not match: the agent's own stumbles with built-in tools.

- **Kept**: an MCP tool that returned an error, a Flow command or bundled script that exited with an error (`flow`, `fw`, `util`, `u`, anything under `~/.flow/scripts/` or `skills/flow/skills/`), an API error that ended a turn, and what the agent reports.
- **Dropped**: every other shell command, every built-in tool, and a call the user interrupted.

The Claude Code docs settled the one open question before the build: a Bash command that exits non-zero does fire `PostToolUseFailure`, with `Exit code N` as the error's first line. So the filter is needed, and it lives in `scripts/flow/lib/failures.js` → `flowCommand()`.

## 3 writers, one line

```json
{"at":"2026-09-27T14:02:11Z","source":"hook","what":"mcp__supabase__list_tables","error":"401 Unauthorized","project":"/home/me/code/shop","session":"b81748eb-…","call":"toolu_01…"}
```

- **`scripts/failures.js`**, on `PostToolUseFailure` for `Bash` and `mcp__*`, and on `StopFailure`.
- **Flow's scripts**, through `failures.record()`, for what runs where no session sees it: a clone `flow install` could not make, a pull or fetch the background update could not finish, a `flow sync` git could not complete. A `flow sync` refusal, such as another machine being ahead, is the design working and is never logged.
- **The agent**, by `home/AGENTS.md` → `## Capture`, for what no hook sees. It adds the line with a shell command. No writing command was built.

`context7.sh` was on the first list of scripts to call the shared function. It exits 1 on every failure, and the agent runs it, so the hook already logs it.

**The line points into the transcript, never copies it.** Claude Code already saves every failed call whole. `session` and `call` find it, and the line keeps the first 500 characters of the error, enough to group repeats.

## Read directly, no command

`flow failures` was proposed and rejected by the user: the agent can read the file. A session-start line counting new failures went with it, since it needed a record of what was last read.

**A failed background job is shown, since 2026-10-01**, asked for by the user: a failure nobody watches has to reach the user, and the agent should fix it on request. A sync failing on every run had stayed silent, so a second machine lacked the tickets with nobody knowing.

- **An open issue is a job whose last run failed.** The background ticket sync, the Flow home's sync and each skill repository's pull carry `job`. The next run that works appends `{"job":"sync ~/.flow","cleared":true}`. Nothing records what was last read, so the objection above no longer holds.
- **The status line shows the count**, `⚠ 2 Flow issues: ask Claude to fix them`, in every folder. A hook can't type into the input box, and the job fails after its hook has returned, so no hook could show it mid-session.
- **`flow doctor` lists them** under `issues`, and `home/AGENTS.md` → `fix-flow-issues` runs it when the user asks. A skill for it was rejected: it would only say "run `flow doctor`, fix each line".
- **A session-start line was rejected** for the status line, which shows the failure moments after it happens, mid-session too.

## `~/.flow/logs/`

The user asked for one folder for everything that records what happened. `logs/` won over `records/`, which clashes with the machine records in `machines/`, and over `reports/`, which fits only some of the files.

- **Moved in**: `install.log`, the history log, and `scorecards/`.
- **Left out**: `skills-update.json`, a waiting message deleted once printed; `audit/`, an index that can be rebuilt; `changes/`, working data a review reads mid-session and deletes after 7 days.
- **One ignore line**, `logs/`, in place of 3.

No machine had Flow installed, so the move needed no upgrade guide.

## One file per month

The user asked for the simplest way to stop a log growing forever. A log that grows is a folder of `<year>-<month>.jsonl` files, and the writer starts the new month's file on its first line. The month in the name is the archive.

- **An `archive/` folder was rejected**: moving last month's file is a step that can fail halfway, and the name already separates old from new.
- **Trimming to the newest 1,000 lines was proposed first and dropped**: a month of lines is a few kilobytes.
- **Nothing deletes an old month.** Deleting months past a year is one line to add if the folder ever grows.

`install.log` holds only the last run and never grows. `scorecards/` is already one file per session.
