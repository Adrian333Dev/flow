# The failure log

How Flow records its own broken machinery, and where every log it keeps lives. The failure log is one line per failure of something Flow built or chose: an MCP tool returning an error, a Flow command exiting with one, a background sync that could not finish. The user asked for "something kind of like a browser's console, but for our workflow". Every log sits in `~/.flow/logs/`.

## Scope

- **In**: what counts as a failure, the 3 writers, the line, open issues and how they reach the user, `~/.flow/logs/` and its files, and how a log stops growing.
- **Out**: friction with Flow's rules, which goes to workflow notes and study cases through `/flow:review`, in `docs/spec/product.md` → `### The audit and study cases`. The scorecard's files, in `docs/spec/rules.md`. The status line as a whole, in `docs/spec/product.md`.

## From a failure to the user

```text
 ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
 │    failures.js    │   │   Flow's scripts  │   │     the agent     │
 │                   │   │                   │   │                   │
 │  a failed MCP     │   │  install, the     │   │  what no hook     │
 │  tool, Flow       │   │  background pull, │   │  sees: a missing  │
 │  command, API     │   │  flow sync        │   │  change record    │
 └───────────────────┘   └───────────────────┘   └───────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │  one line each
                                   ▼
               ┌───────────────────────────────────────┐
               │  ~/.flow/logs/failures/2026-10.jsonl  │
               └───────────────────────────────────────┘
                                   │  a job whose last run failed
                                   ▼
               ┌───────────────────────────────────────┐
               │  the status line: ⚠ 2 Flow issues     │
               │  flow doctor: listed under issues     │
               └───────────────────────────────────────┘
```

## Behaviors

### What counts

- `V1` **Only what Flow built or chose**, the user's rule: an MCP tool that returned an error, a Flow command or bundled script that exited with one (`flow`, `fw`, `util`, `u`, anything under `~/.flow/scripts/` or a Flow skill's folder), an API error that ended a turn, and what the agent reports.
- `V1` **Left out: every other shell command, every built-in tool, and a call the user interrupted.** A `grep` finding nothing exits 1, and nobody would act on it later. Claude Code fires the failure hook on any shell command exiting non-zero, so the filter is needed.
- `V1` **A refusal working as designed is never logged**, such as `flow sync` refusing because another machine is ahead.

### The 3 writers

- `V1` **`failures.js`, on `PostToolUseFailure` for `Bash` and `mcp__*`, and on `StopFailure`.**
- `V1` **Flow's own scripts, through `failures.record()`**, for what runs where no session sees it: a clone `flow install` could not make, a background pull or fetch, a `flow sync` git could not finish.
- `V1` **The agent, by `home/AGENTS.md` → `## Capture`**, with a shell command, for what no hook sees: a subagent that changed files and sent no change record, a skill's command that did nothing. No command was built for writing.

### The line

- `V1` **One JSON line, pointing into the transcript, never copying it.** `session` and `call` find the whole failure in Claude Code's saved transcript. The line keeps the first 500 characters of the error, enough to group repeats.
- `V1` **A background job's line carries `job`**, naming it: `sync /home/me/code/shop`, `sync ~/.flow`, `skills obra/superpowers`. The next run that works adds `{"job":…,"cleared":true}`.

### Open issues

- `V1` **An open issue is a job whose last line is a failure.** Asked for by the user 2026-10-01: a sync failing on every run had stayed silent, so a second machine lacked the tickets with nobody knowing.
- `V1` **The status line counts them in every folder**: `⚠ 2 Flow issues: ask Claude to fix them`. The job fails after its hook has returned, so no hook could show it mid-session.
- `V1` **`flow doctor` lists them under `issues`**, and `home/AGENTS.md` → `fix-flow-issues` runs it when the user asks. A line goes by itself once its job next works.
- `never` **`flow failures`, a command to read the log**, rejected by the user: the agent reads the file.
- `never` **A skill for fixing issues**: it would only say "run `flow doctor`, fix each line".
- `never` **A session-start line counting failures**: the status line shows a failure moments after it happens, mid-session too.

### `~/.flow/logs/`

- `V1` **One folder for every record of what happened**, the user's ask: `install.log`, `history/<month>.jsonl`, `failures/<month>.jsonl` and `scorecards/`. One ignore line keeps it off the Flow home. `logs/` won over `records/`, which clashes with `machines/`, and over `reports/`, which fits only some files.
- `V1` **The history log adds a line for every clone, pull, switch, install, migration and restore.**
- `V1` **Left out of `logs/`**: `skills-update.json`, a waiting message deleted once printed; `audit/`, an index that rebuilds; `changes/`, working data a review reads mid-session.
- `V1` **A log that grows is a file per month**, `<year>-<month>.jsonl`, started by the writer on its first line of the month. Nothing moves, trims or deletes one. A month is a few kilobytes. `install.log` holds the last run alone, and `scorecards/` is a file per session.
- `never` **An `archive/` folder**: moving last month's file is a step that can fail halfway, and the name already separates old from new.
- `later` **Months past a year deleted**, one line to add if the folder ever grows.
- `later` **`flow history`**, filtering the history log by type, name and date, once grepping it gets tedious.
- `later` **Failures from Codex.** Codex has no `PostToolUseFailure` hook, so a failure there writes nothing.

## The parts

- **`scripts/hooks/failures.js`**: the hook, and the filter on which commands count.
- **`scripts/lib/logs/failures.js`**: `record()`, the line, and which jobs are open.
- **`scripts/lib/logs/logs.js`**: the folder and the file per month.
- **`scripts/commands/status-line.js`** and **`scripts/commands/doctor.js`**: the 2 readers of open issues.

## What passes between them

A line from the hook:

```json
{"at":"2026-09-27T14:02:11Z","source":"hook","what":"mcp__supabase__list_tables","error":"401 Unauthorized","project":"/home/me/code/shop","session":"b81748eb-…","call":"toolu_01…"}
```

A background job failing, then clearing:

```json
{"at":"2026-10-01T09:00:03Z","source":"sync","what":"flow sync","job":"sync ~/.flow","error":"Could not resolve host: github.com"}
{"at":"2026-10-01T09:30:12Z","job":"sync ~/.flow","cleared":true}
```

## One real case: a sync breaks with nobody watching

1. `flow sync` runs for the Flow home, and git cannot reach GitHub. It writes a line carrying `job: "sync ~/.flow"`.
2. The status line counts one open issue: `⚠ 1 Flow issue: ask Claude to fix them`.
3. The user asks. The agent runs `flow doctor`, which names the job and git's words, then fixes the cause.
4. The next sync works and adds the `cleared` line. The status line drops the count.

## How it fails

- **The log cannot be written** → the failure goes unrecorded, and the tool call carries on.
- **A job never runs again** → its issue stays open until the user runs the job by hand.
- **The agent forgets to write a line** → the failure lives only in the transcript, found later through `flow audit`.

## How you know it worked

- **`npm test` feeds `failures.js` the calls the Claude Code docs describe.** In a live session: not yet.
- **An open issue shown, fixed on request and cleared** in the beta.

## What is locked

- **Only Flow's own machinery is logged**: a log of every stumble would bury the failures anyone acts on.
- **The line points into the transcript**, since Claude Code already keeps the whole failure.
- **The status line shows open issues**, never a session-start line or a command.
- **A file per month, never moved or trimmed.**
