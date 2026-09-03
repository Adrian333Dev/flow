# The `flow` CLI

`flow` manages tickets, dependencies, status transitions, study cases, uncommitted work, skill discovery, git write locking, and session history. This page covers every command and flag.

## Table of contents

- [The shape](#the-shape)
- [The board](#the-board)
- [One ticket](#one-ticket)
- [Status verbs](#status-verbs)
- [Cases](#cases)
- [Work](#work)
- [Skills](#skills)
- [Overlays](#overlays)
- [Git](#git)
- [Audit](#audit)
- [Install](#install)

## The shape

```
flow <command> [id]... [--flags]
```

The command sits at position 1, always. A word naming no command is read as a ticket id, so `flow t047` and `flow get t047` do the same thing. Flags take two dashes and the full name: `--status`, never `-s` or `--stat`.

Six groups carry their own actions: `cases`, `work`, `skills`, `overlays`, `git`, `audit`. Each is spelled `flow <group> <action>`, and each names a default action that can be left out. `flow overlays groundwork` is `flow overlays get groundwork`.

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

1. **In flight** — tickets someone is already working on (groundwork, planning, building, review). Shown first so a new session finishes existing work before starting more.
2. **Ready** — todo tickets whose dependencies are all satisfied and whose children (if any) are all closed. Ranked by effective priority: a child inherits its nearest ancestor's priority when it has none of its own.
3. **Blocked** — shown only when nothing is ready. Lists todo tickets with unsatisfied dependencies and names what each one waits on.

Flags: `--limit <n>` (show at most n ready tickets, default 10), `--all` (no limit).

### `flow check`

Integrity problems in the ticket graph. Exits 0 when clean, 1 when problems exist. Reports:

- **Dependency cycles** — t001 → t002 → t001
- **Dangling deps** — a ticket depends on an id that does not exist
- **Dropped blockers** — a ticket depends on a dropped ticket, so it can never become ready
- **Dangling parents** — a ticket names a parent that does not exist
- **Closed parents** — a ticket is still open but its parent is done or dropped

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

- **`flow get`** — the board: counts across every status, last closed ticket, in-flight work, ready tickets, parked tickets, and unfiled tickets. `flow <id>` is a shorthand for `flow get <id>`.
- **`flow get <id>`** — one ticket in full. Prints every field: status, type, priority (own and inherited), parent, deps (with their statuses), dependents, children (with a progress count), plan steps if a plan exists, reports, closed and filed dates, the pickup command, and the ticket body.
- **`flow get <path>`** — reads a file (a handoff, a spec, loose notes) and loads any `flow-open` block it contains.

An id is a number and a label: `t047-parser-split`. The number is the identity. Any unambiguous part resolves it: `t047`, `47`, `parser`, or the whole thing.

`--files` loads every file named in the ticket's `flow-open` block through `util fs merge`. Off by default, so a second `get` in the same session never double-loads context. `/start` passes `--files` explicitly.

Flags: `--files` (load the `flow-open` block), `--limit <n>` and `--all` (for the bare-board shape).

### `flow new "<title>"`

Create a ticket. Returns the id, the path, and the pickup command.

Flags:

- `--type <type>` — feature (default), issue, chore, topic, or prototype
- `--priority <level>` — high, normal (default, not stored), or low
- `--parent <id>` — the ticket this one was split out of
- `--deps <id,id>` — tickets that must be satisfied before this one can start. Each id is validated against existing tickets
- `--label "<words>"` — 1-3 words for the folder name. Generated from the title when absent
- `--body "<text>"` — the ticket body, replacing the template
- `--body -` — read the body from stdin, so creating and filling a ticket is one command
- `--from-groundwork <path>` — move an existing groundwork folder in as this ticket's own

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

- **Bare drop** — refuses when live dependents exist, and prints the whole chain (transitive, not just direct).
- **`--by <id>`** — re-points every direct dependent at the replacement ticket. The dropped ticket's edge is replaced, and anything further out keeps working.
- **`--force`** — drops every transitive dependent along with it.

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

- **Features, chores, topics** open at `groundwork` — questions to settle first
- **Issues and prototypes** open at `building` — no separate groundwork phase, the investigation happens while building

`flow <id>` prints the pickup command: `pick up with: flow groundwork t047` or `pick up with: flow build t047`.

### Parking and reviving

`flow park <id> --reason "<why>"` stores the status the ticket was in before parking. Reviving means typing the verb for that stored status: a feature parked at `building` is revived with `flow build <id>`, and it comes back at `building` rather than restarting at `groundwork`. The reason is cleared on revival.

`flow <id>` prints the revive command: `pick up with: flow build t047`.

### What blocks a move

Four guards, each refused with a message explaining what to do:

1. **Unmet dependencies** — picking up a todo ticket (or moving back to planning) refuses when any dep is unsatisfied. A dep is satisfied by `review` or `done`.
2. **Open children** — picking up a parent ticket refuses while children are still open. The parent's work runs after theirs.
3. **Done with open children** — `flow done` refuses on a parent whose children are still open.
4. **Reason required** — `flow park` refuses without `--reason`.

`--force` overrides guards 1, 2, and 3. Guard 4 has no override.

### Priority inheritance

A ticket with no priority inherits the nearest ancestor's through the parent chain. Marking one parent `high` lifts a whole feature without touching any child. An explicit value always beats an inherited one, so a `low` chore under a `high` feature stays `low`.

`flow get <id>` spells out the inheritance: `priority: high — inherited from t012`.

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

## Work

Uncommitted work, moved between two machines. The problem: committed work travels through `git push`, but uncommitted and untracked files have no route, so switching machines either loses them or forces a junk commit.

Each machine needs a name, set once: `git config --global flow.machine desktop`. The name decides which slot a copy is filed under. Two machines sharing a name overwrite each other silently.

`flow work` with nothing after it prints help, because the default action (`get`) overwrites your working tree and a mistyped action falling through to it is worth refusing.

### `flow work send`

Snapshot everything in the folder as a commit hanging off HEAD, file it under `refs/unfinished/<machine>/<branch>`, and push it. Nothing about the branch, the staging area, or the files on disk changes. Gitignored files travel only when named in `.flow-include` at the project root.

Flags: `--clear` (stash the working tree after sending, so a branch switch works), `--message "<text>"`.

### `flow work get [<machine>]`

Replay the other machine's copy onto the folder with a 3-way merge. Conflict markers appear where both sides changed the same lines. What was in the folder before the replay is backed up at `refs/unfinished-backup/<branch>`.

When multiple machines have copies, the command refuses and lists them. Name one explicitly: `flow work get laptop`.

### `flow work ls`

Every stored copy: machine, branch, age, file count. Fetches from the remote first. `--offline` skips the fetch.

### `flow work drop [<machine>]`

Delete a stored copy, locally and on the remote. `--all` drops every copy on this branch.

## Skills

Skill discovery. Every skill is a folder under `skills/<group>/` with a `SKILL.md`. See [Adding a skill](skills.md) for the groups and the frontmatter.

### `flow skills ls`

Every skill, its group, its on/off state, and where the state came from (default, machine, or project). A skill nobody names in `skillOverrides` is on by default. This is the default action: `flow skills` runs `ls`.

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
