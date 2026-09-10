# Reference

Every command, skill, setting and file Flow gives you, in one place. Look one up here; the pages named alongside carry the long form.

## Table of contents

- [Installing](#installing)
- [Typing a command](#typing-a-command)
- [The board](#the-board)
- [One ticket](#one-ticket)
- [Status verbs](#status-verbs)
- [Cases](#cases)
- [Skill discovery](#skill-discovery)
- [Overlays](#overlays)
- [Git](#git)
- [Audit](#audit)
- [Rule checks](#rule-checks)
- [The skills](#the-skills)
- [Settings](#settings)
- [Files](#files)

## Installing

Flow lives in one clone, and installing creates symlinks pointing into it. Editing a file in the clone changes the installed workflow immediately, in every project and in every session already open.

```bash
node <clone>/scripts/flow/flow.js install
```

Run it by path the first time, because `flow` is not a command until that run has made it one. After that, the command is `flow install`.

The run links every skill and agent into `~/.claude/`, links `scripts/` and `references/` into `~/.flow/`, and puts `flow` and `fw` on your `PATH` in `~/.local/bin/`. Skills are linked one at a time and agents the same way: both `~/.claude/` directories can hold entries Flow did not create, and a folder-level symlink would replace all of them.

`--home <path>` moves where the Claude Code files go, and `--flow-home <path>` moves where the Flow files go. Passing one without the other is refused, because redirecting half the install writes the other half to the real machine.

**Two files become yours and stop tracking the repository.** `~/.claude/CLAUDE.md` is copied from the template on a first install and never rewritten, so your name, your machine and your preferences survive a re-run, and a rule added to the template later has to be carried across by hand. `~/.claude/settings.json` is never written at all: `flow install` prints the file to merge and stops, because merging Flow's hooks and permission rules into your own model and plugin settings is a judgment call.

**Install `util` first.** `util` is a separate command-line tool holding Flow's general-purpose commands, its own repository, included here as a submodule at `lab/util/`.

```bash
node <util-clone>/util.js install
```

Flow's rules name `util fs tree` for looking at directory structure, and `flow get --files` runs `util fs merge` to assemble context files. A machine without `util` still works: `flow get --files` prints that `util` is not on `PATH` where the files would have been, and carries on.

## Typing a command

```
flow <command> [id]... [--flags]
```

The command sits at position 1, always. A word naming no command is read as a ticket id, so `flow t047` and `flow get t047` do the same thing. Flags take two dashes and the full name: `--status`, never `-s` or `--stat`.

Five groups carry their own actions: `cases`, `skills`, `overlays`, `git`, `audit`. Each is spelled `flow <group> <action>`, and each names a default action that can be left out. `flow overlays groundwork` is `flow overlays get groundwork`.

Before the first install, the command is typed by path:

```bash
node <clone>/scripts/flow/flow.js <command>
```

After that, `flow` and `fw` are on `PATH`.

## The board

Commands that answer a question about the work as a whole.

### `flow next`

What to work on, ranked by priority.

Three sections, in order. Each appears only when it has content:

1. **In flight**: tickets someone is already working on (groundwork, planning, building, review). Shown first so a new session finishes existing work before starting more.
2. **Ready**: todo tickets whose dependencies are all satisfied and whose children (if any) are all closed. Ranked by effective priority: a child inherits its nearest ancestor's priority when it has none of its own.
3. **Blocked**: shown only when nothing is ready. Lists todo tickets with unsatisfied dependencies and names what each one waits on.

Flags: `--limit <n>` (show at most n ready tickets, default 10), `--all` (no limit).

### `flow check`

Integrity problems in the ticket graph. Exits 0 when clean, 1 when problems exist. Reports:

- **Dependency cycles**: t001 → t002 → t001
- **Dangling deps**: a ticket depends on an id that does not exist
- **Dropped blockers**: a ticket depends on a dropped ticket, so it can never become ready
- **Dangling parents**: a ticket names a parent that does not exist
- **Closed parents**: a ticket is still open but its parent is done or dropped

Only live tickets are reported. A done ticket that once depended on a dropped one is history.

### `flow ls`

List many tickets, filtered.

Flags: `--status <status>` (one of: todo, groundwork, planning, building, review, done, parked, dropped), `--type <type>` (one of: feature, issue, chore, topic, prototype), `--parent <id>` (children of this ticket), `--unfiled` (done tickets not yet swept by the filing pass).

### `flow tree`

The parent/child shape, nested. Children appear indented under their parents with tree-drawing characters. Each line shows the ticket's status, priority, and a note: how many children are done for a parent, what blocks a todo ticket, or the reason for a parked one.

Done and dropped tickets are hidden by default so the tree shows what is live.

Flags: `--parent <id>` (scope to a subtree), `--all` (include done and dropped).

## One ticket

Commands that name a ticket and act on it.

### `flow <id>` / `flow get`

Three shapes:

- **`flow get`**: the board: counts across every status, last closed ticket, in-flight work, ready tickets, parked tickets, and unfiled tickets. `flow <id>` is a shorthand for `flow get <id>`.
- **`flow get <id>`**: one ticket in full. Prints every field: status, type, priority (own and inherited), parent, deps (with their statuses), dependents, children (with a progress count), map questions and plan steps where those files exist, reports, closed and filed dates, the pickup command, and the ticket body.
- **`flow get <path>`**: reads a file (a handoff, a spec, loose notes) and loads any `open` block it contains.

An id is a number and a label: `t047-parser-split`. The number is the identity. Any unambiguous part resolves it: `t047`, `47`, `parser`, or the whole thing.

`--files` loads every file named in the ticket's `open` block, by running `util fs open --files-only` on `ticket.md` from the repo root. Off by default, so a second `get` in the same session never double-loads context. `/start` passes `--files` explicitly.

**The block format is util's, not Flow's.** `util fs open` parses it, resolves each path and merges the files. [The `open` block](https://github.com/Adrian333Dev/util/blob/main/docs/commands.md#the-open-block) in util's documentation defines it. Flow supplies only the working directory, which is what makes a path resolve beside the ticket first and then from the repo root.

**`--files-only` is why the ticket is not printed twice.** Run bare, `util fs open` prints the document first and then the files it names, because whoever opens a document cold needs both. `get` has already printed the ticket by the time it shells out, so it asks for the files alone.

Flags: `--files` (load the `open` block), `--limit <n>` and `--all` (for the bare-board shape).

### `flow new "<title>"`

Create a ticket. Returns the id, the path, and the pickup command.

Flags:

- `--type <type>`: feature (default), issue, chore, topic, or prototype
- `--priority <level>`: high, normal (default, not stored), or low
- `--parent <id>`: the ticket this one was split out of
- `--deps <id,id>`: tickets that must be satisfied before this one can start. Each id is validated against existing tickets
- `--label "<words>"`: 1-3 words for the folder name. Generated from the title when absent
- `--body "<text>"`: the ticket body, replacing the template
- `--body -`: read the body from stdin, so creating and filling a ticket is one command
- `--from-groundwork <path>`: move an existing groundwork folder in as this ticket's own

Every ticket gets a `groundwork/` folder with a `map.md` from birth. The folder exists whether groundwork is needed or not, because a ticket's path is fixed for life.

### `flow edit <id>`

Change a field on a ticket. Each flag changes one field.

Flags: `--title "<title>"`, `--type <type>`, `--priority <level>` (normal clears it), `--parent <id>` (empty clears it, refuses a cycle), `--label "<words>"` (renames the folder).

Status is never changed through edit. The [status verbs](#status-verbs) are the only way.

### `flow dep <id>`

Add or remove a dependency.

Flags: `--on <id>` (add), `--off <id>` (remove). Mutually exclusive. Adding a dependency that would close a cycle is refused.

### `flow file <id>...`

Stamp closed tickets as filed. Takes one or more ids. The filed date records that the filing pass swept this ticket, even when the ticket taught nothing worth keeping. A ticket already filed says so and skips. `--force` re-stamps.

`flow ls --unfiled` shows the queue this drains.

### `flow drop <id>`

Kill a ticket. `--reason` is always required: nothing else records why the work died.

The danger is what depended on it. `deps` is stored on one side only, so dropping a ticket silently strands everything that needed it. Three behaviors handle this:

- **Bare drop**: refuses when live dependents exist, and prints the whole chain (transitive, not just direct).
- **`--by <id>`**: re-points every direct dependent at the replacement ticket. The dropped ticket's edge is replaced, and anything further out keeps working.
- **`--force`**: drops every transitive dependent along with it.

`--by` and `--force` are mutually exclusive. `--by` refuses a dropped replacement (those dependents could never become ready) and refuses when re-pointing would close a cycle.

## Status verbs

Every status is a command, named for where the ticket lands:

```
flow groundwork <id>       settle the open questions
flow plan <id>             write the plan
flow build <id>            build it
flow review <id>           hand the work over
flow done <id>             close it
flow park <id>             set it aside
flow todo <id>             put it back in the queue
```

The lifecycle runs left to right: `todo → groundwork → planning → building → review → done`. Every ticket type uses a subsequence of this line, never a different order.

There is no `flow dropped` command. Dropping uses `flow drop` instead, because it must also repair or cascade dependents.

### Entry status

Where a ticket starts depends on its type:

- **Features, chores, topics** open at `groundwork`: questions to settle first
- **Issues and prototypes** open at `building`: no separate groundwork phase, the investigation happens while building

`flow <id>` prints the pickup command: `pick up with: flow groundwork t047` or `pick up with: flow build t047`.

### Parking and reviving

`flow park <id> --reason "<why>"` stores the status the ticket was in before parking. Reviving means typing the verb for that stored status: a feature parked at `building` is revived with `flow build <id>`, and it comes back at `building` rather than restarting at `groundwork`. The reason is cleared on revival.

`flow <id>` prints the revive command: `pick up with: flow build t047`.

### What blocks a move

Four guards, each refused with a message explaining what to do:

1. **Unmet dependencies**: picking up a todo ticket (or moving back to planning) refuses when any dep is unsatisfied. A dep is satisfied by `review` or `done`.
2. **Open children**: picking up a parent ticket refuses while children are still open. The parent's work runs after theirs.
3. **Done with open children**: `flow done` refuses on a parent whose children are still open.
4. **Reason required**: `flow park` refuses without `--reason`.

`--force` overrides guards 1, 2, and 3. Guard 4 has no override.

### Priority inheritance

A ticket with no priority inherits the nearest ancestor's through the parent chain. Marking one parent `high` lifts a whole feature without touching any child. An explicit value always beats an inherited one, so a `low` chore under a `high` feature stays `low`.

`flow get <id>` spells out the inheritance: `priority: high (inherited from t012)`.

## Cases

Study cases: recorded failures, filed by the kind of failure rather than the project. Stored globally at `~/.flow/study-cases/<issue>/<date>-<slug>.md`. The payoff is seeing one failure three times.

`flow cases` with no action prints help.

### `flow cases new "<title>"`

Create a study case. `--issue <name>` is required and names the kind of failure. The issue is the folder, and the folder is the whole mechanism: one failure having one name is what makes the count work.

A near-match (edit distance 2 or substring) refuses and suggests the existing issue. `--force` overrides when a genuinely new issue happens to look like an existing one.

Flags: `--rule "<rule>"` (the rule that failed), `--body "<text>"` or `--body -` (the case content).

### `flow cases ls`

List cases. Flags: `--issue <name>`, `--status <open|fixed>`.

### `flow cases get <ref>`

Show one case in full: issue, date, project, rule, fix, status, and the body.

### `flow cases edit <ref>`

Change a field. `--status fixed` requires `--by <file>` (the file that changed to fix it) unless the case already has a fix recorded. `--status open` clears the fix. `--rule "<rule>"` sets the rule that failed.

### `flow cases issues`

Every issue folder with its count, open count, latest date, and the rules that failed across its cases. Read this before creating a new case, so a repeat failure lands in the folder it already has.

## Skill discovery

Which skills this session is being shown, and where that was decided. [The skills](#the-skills) lists them; [Adding a skill](../dev/skills.md) covers writing one.

### `flow skills ls`

Every skill, its group, its on/off state, and where the state came from (default, machine, or project). A skill nobody names in `skillOverrides` is on by default. This is the default action: `flow skills` runs `ls`.

Two flags narrow it. `--group <group>` keeps one group, and naming a group that does not exist refuses with the list of ones that do. `--hidden` keeps only the skills this session is not being shown, meaning anything `off` or in `drafts/`, because a skill the session can already see is in context with its description and needs no listing.

## Overlays

A project extends a global skill by writing `.flow/overlays/<name>.md`. That content is appended to the skill's body when the skill loads in that project.

### `flow overlays get <name>`

Print the overlay for a skill. Prints nothing when no overlay file exists, which is the normal case and not an error. This is the default action: `flow overlays groundwork` is `flow overlays get groundwork`.

Every skill runs this at its end, so the overlay arrives after the skill's own content.

## Git

Git writes are off by default. The agent names a git command and you run it. The guard (`scripts/guard.js`) runs before every shell command and enforces the mode.

### `flow git`

Show the current mode: off, allow, or ask, and the scope it applies to.

### `flow git allow` / `flow git ask` / `flow git off`

Set the mode. `allow` lets git writes through. `ask` confirms each one. `off` restores the default.

The scope is the current session when a session id is available (the normal case inside Claude Code), and the current project otherwise. `--project` and `--global` widen it. The narrowest scope wins when more than one is set.

`--for <duration>` sets a timer: `30m`, `2h`, or `never`. The default is 1 hour. The entry is deleted the first time anything looks at it after the timer expires.

The agent cannot set the mode for itself. The guard denies `flow git allow` and `flow git ask` from inside a session. Type it yourself: `! flow git allow` in the input box.

Destructive commands (`push --force`, `reset --hard`, `clean -f`, `rebase`, `branch -D`) ask for confirmation regardless of the mode.

`git worktree` is instructed: it runs whatever the mode says, because worktrees are the mechanism for parallel dispatch.

## Audit

Session history, read back from the transcripts Claude Code writes at `~/.claude/projects/`. Nothing is recorded and nothing is intercepted: the audit reads what Claude Code already wrote.

### `flow audit index`

Walk the transcripts and build the SQLite index at `~/.flow/audit/audit.db`. Resumes from a byte offset, so a second run over an unchanged file opens nothing. `--rebuild` deletes the index and starts over, which is how a schema change lands. `--quiet` suppresses progress output.

### `flow audit sessions`

List every indexed session: id, project, date, turn count, tool count.

### `flow audit summary [<id>]`

Compact metrics for one session (by id prefix) or all sessions. Turn count, tool count, error count, and tool usage by name.

### `flow audit timeline <id>`

Every tool call in a session, in order: time, tool name, and outcome (ok or ERR).

### `flow audit read <id>`

Open a bounded turn range of the original conversation. `--turns <n>` is required: a single segment averages 270k tokens, so an unbounded read is refused. Shows prompts, assistant messages, and tool calls with their results.

### `flow audit sql "<query>"`

Run a read-only SQL query against the index. Only `SELECT` and `WITH` are allowed. The schema holds `session`, `segment`, `turn`, `event`, `tool_call`, and `file_touch` tables.

## Rule checks

Whether the rules Flow writes are actually being followed. A **rule check** is one JavaScript file at `scripts/rule-checks/<id>.js`, named after the rule id it enforces. Two hooks feed it, both wired in `home/settings.json`:

- `rule-check.js` runs on `PreToolUse` for Edit and Write. It runs every check against the edit and appends one line per result to `~/.flow/scorecards/<session>.jsonl`.
- `instructions-loaded.js` runs on `InstructionsLoaded`, recording which `CLAUDE.md` and rule files entered context. A warning names the rule id when the rule's file is loaded, and carries the rule's whole text when it is not.

Each check declares its own `tier`. `measure` records and interrupts nothing, `warn` puts a line in front of the agent, `block` refuses the edit. Every check starts at `measure`. The `.info` file in `scripts/rule-checks/` states the full export contract.

### `flow scorecard`

Add up every session file and print four lists: checks naming a rule no file defines, the rules broken most, the ones past the promotion threshold of 5 violations at 60%, and the ones that load every session and never once apply.

Broken check files print above all four, because a check that will not load is the whole report.

The command closes with its own coverage, as `12 rules measured, 89 not measurable`. Without that line a clean report reads as a clean session, when the usual truth is that most rules were never checked.

A result recorded before a check's `since` date is dropped, so rewriting a check throws away the counts the old version produced rather than averaging two different questions.

**Never violated is not a dead rule.** A rule only gets written after a real mistake, so zero violations means the fix took. The `never applied` list is the demotion signal: the situation the rule governs stopped arising.

The command only reads. Acting on it means editing a check file, which needs approval like any change.

## The skills

A skill is a folder under `skills/<group>/` holding a `SKILL.md`. Type `/name` to run one, or let Claude fire it from its description. The group decides whether a session is shown the skill at all, which [Settings](#settings) covers.

**`phases/`, the four states a piece of work passes through.** Shown in every session.

- **`/groundwork`**: refines the idea and designs the solution, walking every open decision including the ones nobody raised
- **`/execute`**: builds one ticket, plan through review
- **`/prototype`**: throwaway code answering one question, and a report of what it found. Naive on purpose
- **`/debug`**: finds the cause by evidence, proves it, fixes it

**`tools/`, the jobs that fit no phase.** Shown in every session.

- **`/start`**: opens a session on the board, one ticket, or a loose file. Typed only
- **`/handoff`**: writes what a session that was not here needs, the state itself rather than a reading list
- **`/file-findings`**: files what a session learned into the skills, rules and checks that will hold it next time
- **`/research`**: reads what an external tool actually does, from its own documentation and source
- **`/visualize`**: draws ASCII diagrams, screen mockups and HTML previews
- **`/cut-from-spec`**: cuts the next batch of work out of `docs/spec/` into tickets. Typed only

**`stack/`, knowledge about one technology.** Off by default, turned on per project.

- **`/web-pages`**: investigates and experiments on a live web page you do not control

**`dev/`, working on Flow itself.** Shown in every session.

- **`/flow-review`**: finds where Flow's rules failed, where friction repeated, and where the design was wrong

A skill under `skills/drafts/` installs nowhere. Moving it out of that folder is what ships it.

## Settings

Two files, and Flow contributes to one of them.

**`~/.claude/settings.json`** is Claude Code's, and `flow install` never writes it. It prints what to merge and stops. Flow contributes four keys:

- **`hooks`**: two pairs. The snapshot pair records the tree either side of a subagent dispatch. The rule-check pair runs Flow's rule checks on every edit and records which instruction files entered context
- **`permissions`**: an allow list, a deny list for Claude Code surfaces Flow does not use, and no git entries at all, because `flow git` owns git
- **`skillOverrides`**: which skills this machine is shown, keyed by skill name, with `on` and `off` the only two values Flow uses
- **`cleanupPeriodDays`**: how long Claude Code keeps session transcripts, which sets what `flow audit` can still read

[`home/settings.md`](../../home/settings.md) explains every key, every value Flow rejected, and why. A project overrides any of them in its own `.claude/settings.json`, and the two merge key by key rather than replacing.

**`~/.flow/settings.json`** is Flow's own, and only `flow git` writes it. It holds the git write state and nothing else. There is nothing to edit by hand.

## Files

**On the machine**, two directories, split by who reads them.

- **`~/.claude/`**: `CLAUDE.md` (the rules), `settings.json`, `skills/` (one symlink per skill), `agents/` (one symlink per agent), `rules/` (one symlink per rules file)
- **`~/.flow/`**: `scripts/` (the CLI and the hooks), `references/` (the house style and the workflow map), `settings.json`, `workflow-notes.md`, `study-cases/`, `scorecards/`, `audit/`

**In a project**, the same pair for the same reason.

- **`.claude/`**: `settings.json`, and any skill belonging to this project alone
- **`.flow/`**: `tickets/`, `groundwork/`, `inbox.md`, `handoff.md`, `overlays/`, `findings/`

**Everything else in a project is the project's own.** `docs/spec/` is what the product is, `docs/context/` is durable verified facts about this repository, and `CLAUDE.md` at the root holds rules the conventions do not already imply. Flow writes into all three and owns none of them.
