# Reference

Every command, skill, setting and file Flow gives you, in one place. Look one up here; the pages named alongside carry the long form.

## Table of contents

- [Installing](#installing)
- [Migrations and the original](#migrations-and-the-original)
- [Typing a command](#typing-a-command)
- [The board](#the-board)
- [One ticket](#one-ticket)
- [Status verbs](#status-verbs)
- [Cases](#cases)
- [Skill discovery](#skill-discovery)
- [Overlays](#overlays)
- [Audit](#audit)
- [Rule checks](#rule-checks)
- [Sharing findings](#sharing-findings)
- [The skills](#the-skills)
- [Agents read files with Read, never `util fs merge`](#agents-read-files-with-read-never-util-fs-merge)
- [Settings](#settings)
- [Files](#files)

## Installing

Flow lives in one clone, and installing creates symlinks pointing into it. Editing a file in the clone changes the installed workflow immediately, in every project and in every session already open.

```bash
node <clone>/scripts/flow/flow.js install
```

Run it by path the first time, because `flow` is not a command until that run has made it one. After that, the command is `flow install`.

What one run puts on the machine:

- **`~/.agents/skills/flow/`**: a real folder holding a copy of the manifest that names every skill `flow:`, and one link per skill into the clone. Codex reads skills from this folder.
- **`~/.claude/skills/flow`**: a link to that folder, which is how Claude Code finds the same skills.
- **`~/.claude/agents/` and `~/.claude/rules/`**: one link per file into the clone. Both folders can hold entries Flow did not create, and a link to the whole folder would replace all of them.
- **`~/.flow/scripts`, `~/.flow/references` and `~/.flow/docs`**: links into the clone. Every file Flow names by a fixed path sits under one of the 3, so the path is the same on every machine whatever the clone is called.
- **`~/.local/bin/flow` and `fw`**: links to `flow.js`, so both are on your `PATH`. A name Flow used to ship and has since renamed is unlinked here, since its link still resolves and would still run.
- **`~/.flow/repos/`**: every clone Flow reads. `flow/` is a link to the clone you ran the install from. `util/` and `toolbox/` sit beside it, and `sources/<owner>_<repo>/` holds one clone per skill repository, covered in [Skill discovery](#skill-discovery). Each missing one is cloned, newest commit only. A clone that fails, offline say, prints a line and the install still finishes, so running it again is the fix. `--no-clone` skips every clone.
- **`~/.local/bin/util` and `u`**: made by util's own installer, which the install runs from `~/.flow/repos/util/`.
- **`~/.flow/history.jsonl`**: one line saying the install ran. Every change Flow makes to the machine adds a line here, and nothing rewrites one.
- **`~/.flow/install.log`**: every line of the last run. The screen shows a summary, plus each line saying something changed or failed.
- **`~/.flow/originals/machine/`**: every path in this list as it was before Flow, copied before anything is created. [Migrations and the original](#migrations-and-the-original) covers it. Only a machine Flow was never on gets one, because on any other the paths are already Flow's own.

`--root <dir>` puts the whole install under `<dir>` in place of your home folder: `<dir>/.agents`, `<dir>/.claude`, `<dir>/.flow` and `<dir>/.local/bin`. It is how the tests and the scratch session build a machine inside `tmp/`. One flag covers every folder, so no run can redirect part of the install and write the rest to the real machine.

**At a terminal it asks 2 questions.** The first is a name for this machine, saved as git's `util.machine`, which is how work sent between your machines says where it came from. The default is your computer's name and 4 random letters, because a computer's name is not reliably different: WSL calls every machine it is installed on `me`. A machine that already has a name is not asked again.

The second is the private GitHub repository `~/.flow/` lives in. `~/.flow/` holds your rules, notes and study cases, and the repository is both their copy off this machine and how your other machine gets them, covered in [flow sync](#flow-sync). There is no skip:

```text
~/.flow holds your rules, notes, study cases and the tickets that belong to no
project. It lives in one private GitHub repository, which keeps a copy of it and is
how a second machine gets it.
  Enter      make one now, private, with gh
  <address>  use one you already made
Which:
```

- **Enter** makes the repository with `gh`, GitHub's command-line tool. The install checks `gh auth status` first. Not signed in, the line reads `sign in to GitHub with gh, then make one`, and Enter runs `gh auth login` before making it.
- **An address** is read with `git ls-remote` before it is kept. An address git cannot reach, or one it has no sign-in for, is refused on the spot and the question comes back.
- **`--repo <address>`** answers the question without asking it.

A repository already set is kept without asking. Run where no terminal is attached and without `--repo`, the install stops at this question: every link is made, and setup does not start.

**Installing is half of putting Flow on a machine.** The other half is [`flow setup`](#flow-setup), and the install runs it as its last step.

**Every `flow` command refuses until the setup has finished**, except `install`, `setup`, `doctor`, `restore` and `uninstall`. `~/.flow/version` is what says the setup finished, and a command that finds it missing answers `Flow is not set up on this machine. Run flow setup.` A setup that is running passes too, since its own form runs `flow skills`.

**util comes with the install.** `util` is a separate command-line tool holding Flow's general-purpose commands, in its own repository. Flow's rules name `util fs tree` for looking at directory structure, and `flow get --files` runs `util fs open` to assemble context files. A machine without `util` still works: `flow get --files` prints that `util` is not on `PATH` where the files would have been, and carries on.

### `flow setup`

Sets Flow up on this machine: the rule file, the line loading it, Flow's keys in `~/.claude/settings.json`, and whatever the machine already holds that works against Flow. `flow install` runs it as its last step. Typed again, it carries on a setup that stopped part way.

It opens a Claude Code session in safe mode, which loads none of your own rules, skills, plugins or hooks, so nothing already on the machine argues with the setup. The session is handed Flow's rules and the setup's instructions, `scripts/flow/setup/machine.md` in the clone. It reads what your machine already holds, then lists every change in one form for you to check. Nothing outside `~/.flow/` changes before you say go.

After your yes, it writes the rule file `~/.flow/AGENTS.md`, makes `~/.agents/AGENTS.md` a link to it, and replaces `~/.claude/CLAUDE.md` with the one line `@~/.agents/AGENTS.md`. It also merges Flow's hooks and permission rules into `~/.claude/settings.json`, key by key, because that file already holds your model, your plugins and your effort level. A rule file written before that form would be the template with nothing of yours in it, which is why `flow install` writes none of the 3.

**The form shows only what saying go would change.** A setting is judged by its value, so memory already switched off gets no line. An installed plugin or skill that works against Flow is judged by being there, so it gets a line even when it is switched off: it could be switched back on. A plugin goes by `claude plugin uninstall`.

**The session runs in its own permission mode**, whatever yours is. It starts in your home folder, so reading your setup asks nothing. Edits inside `~/.flow/` go through without asking. So do `flow setup`, `flow doctor`, `util fs tree` and the script that applies the form. Anything else asks you first. Auto mode's own check refused the setup's first write in testing, which is why the setup never runs under it.

**Claude Code asks you once, partway through.** It asks before any write to a path with a `.claude` folder in it, and the form keeps its new `~/.claude/settings.json` under `~/.flow/migrations/`, at a path that ends in `.claude/settings.json`. No setting skips that question. The session tells you it is coming, and answering **allow Claude to edit its own settings for this session** covers every later one.

**It refuses to start on an unfinished install.** `flow setup check` runs the same check on its own: `node`, `git` and `claude`; `flow`, `fw`, `util` and `u` in `~/.local/bin`; every clone in `~/.flow/repos/`; and the repository `~/.flow/` lives in. Any one missing is named, and `flow install` is the fix for all of them.

Run where no terminal is attached, or with `--root`, it prints the line that starts the session instead:

```text
One step left: setting up this machine. Start it from a terminal:

  cd /home/me && claude --safe-mode --permission-mode acceptEdits --add-dir /home/me/.flow --allowedTools 'Bash(flow setup:*)' 'Bash(flow doctor:*)' 'Bash(node ~/.flow/scripts/apply-migration.js:*)' 'Bash(util fs tree:*)' --append-system-prompt-file /home/me/.flow/setup-prompt.md 'Set up this machine.'
```

- **`~/.flow/setup-prompt.md`**: Flow's rules followed by the setup's instructions, rewritten each time the session starts.
- **`~/.flow/run.json`**: how far the setup got, and the folder its form goes in. `flow setup` writes it, the session updates it after each step, and the next `flow setup` carries on from there:

  ```json
  { "started": "2026-09-24T01:45:46.858Z", "type": "setup-machine", "migration": "machine/2026-09-24T04-45-46", "step": 4 }
  ```
- **`flow setup finish`**: the session's last step. It stamps `~/.flow/version` and deletes `run.json`.

### `flow setup project`

Sets up the project you are in: Flow's rule file `AGENTS.md`, a `CLAUDE.md` loading it, `.flow/`, and tickets for the open work the project already lists. Type it in the project's folder, on a machine `flow setup` finished. Typed again, it carries on a setup that stopped part way.

It opens a normal Claude Code session, which loads Flow's rules and hooks and nothing of the project's: no `CLAUDE.md`, no skill, no setting and no MCP server. The launch does this with 2 flags, `--setting-sources user` and `--strict-mcp-config`. The session follows `scripts/flow/setup/project.md` in the clone. It reads the project's rule files, its docs, its code and its Claude Code memory, then lists every change in one form, `migration.md`. Nothing in the project changes before you say go.

**The form holds decisions, and the content sits beside it.** Each line says what happens and where, with a count: `9 rules → AGENTS.md`. The new version of every file is under `files/` beside the form, and `dropped.md` lists each line left behind with the Flow rule that already does its job. Anything that works against Flow is under `🔴 Removed unless you untick it`. Lines it finds about you, rather than the project, go into your own rules in `~/.flow/AGENTS.md`.

**The code wins over the docs.** Where a doc says something the code contradicts, that becomes a ticket. Every project gets 2 more tickets where they apply: "Write the product spec", listing the docs that hold your plans today, and "Find skills, plugins and MCP servers for this stack". The setup writes no spec: a spec is your intent, and the setup asks you nothing.

**It refuses where it can't start**: a machine `flow setup` never finished, a folder outside a git repository, or another setup stopped part way. `flow setup project check` runs the same check on its own. An empty repository gets the project template and nothing more.

Run where no terminal is attached, or with `--root`, it prints the line that starts the session instead:

```text
Setting up ~/code/shop runs in its own session. Start it from a terminal:

  cd /home/me/code/shop && claude --setting-sources user --strict-mcp-config --permission-mode acceptEdits --add-dir /home/me/.flow --add-dir /home/me/.claude/projects/-home-me-code-shop/memory --allowedTools 'Bash(flow setup:*)' 'Bash(flow doctor:*)' 'Bash(node ~/.flow/scripts/apply-migration.js:*)' 'Bash(util fs tree:*)' 'Bash(git ls-files:*)' --append-system-prompt-file /home/me/.flow/setup-prompt.md 'Set up this project.'
```

- **`--add-dir`**: `~/.flow`, where the form is written, and the project's memory folder, where one exists, so neither asks each time.
- **`~/.flow/run.json`**: the same file as the machine's setup, with `type` `setup-project`, the project's path and its memory folder.
- **`flow setup project finish`**: the session's last step. It stamps the project's `.flow/version` and deletes `run.json`.
- **`flow restore project`** puts the project back as it was before, `.flow/` deleted with it.

### `flow doctor`

Everything about an installed machine a function can decide. It writes nothing, prints one line per area when that area is clean and one line per problem when it is not, and exits 1 if anything failed. Run it after installing, and again whenever something behaves as though it were not installed.

- **A run that stopped part-way**: `~/.flow/run.json` exists only while a setup or a migration is running, so a file left on disk means the machine is half way through a change. It is reported before anything else, naming the step it stopped at and both ways out: carry on in a new session, or put the place back to how it was before Flow.
- **How current the machine is**: the entry number in `~/.flow/version` against the newest entry in `CHANGELOG.md`, and a project's `.flow/version` against the machine's. Being behind is a note suggesting `flow up`, because the machine still works. A number above the newest entry is a failure, since only a clone that moved backwards produces one.
- **The clone**: every submodule sits on the commit the clone points at. With `--updates` it also reads the newest `v<number>` tag the remote carries, which is the one check here that touches the network.
- **The names you type**: `flow`, `fw`, `util` and `u` are links that resolve, `flow` runs this clone rather than an older one, and `~/.local/bin` is on your `PATH`.
- **The programs Flow shells out to**: `node`, `git` and `claude` are on your `PATH`.
- **The 2 util commands Flow calls**: `util fs tree` and `util fs open`, each proved by running it. A failure is then explained against `~/.util/sources`, because a `util` on `PATH` with no registered source carries no commands at all. `flow install` fixes every case.
- **`~/.agents/`**: `skills/flow/` is a real folder, it holds one link into this clone per skill switched on, and its manifest names `flow`. `AGENTS.md` is present.
- **`~/.claude/`**: `skills/flow` links to the plugin folder, one link per agent and rule points into this clone, and `CLAUDE.md` holds the line importing `~/.agents/AGENTS.md`.
- **`~/.claude/settings.json`**: it parses, every hook the template declares is registered, every hook script is on disk, and no `skillOverrides` key names a Flow skill, which would do nothing because Flow's skills load as a plugin. `permissions.defaultMode` must be set, since without it a session on a Pro, Max or Team plan starts in auto mode. A mode other than the template's `default` is a note, not a failure.
- **`~/.flow/`**: `scripts`, `references` and `docs` resolve into this clone.
- **Skills**: every skill repository in `sources` is cloned, every name a `skills` line switches is held by some source, no line names a Flow skill that is always on, and every skill switched on has its link. A link out of step is fixed by the next session start, or at once by `flow skills ls`.
- **Both test suites**, Flow's and util's. They are the only slow part, and `--no-tests` drops them.

`--root` and `--no-bin` mirror `flow install`, so an install redirected into a scratch tree can be verified where it sits. `--updates` adds the one check that goes to the network, and everything else is a read of this machine. A machine with nothing installed gets a single message saying so, instead of every check failing separately.

**`--prereq` is the programs check alone**, and it is the only form that runs on a machine Flow has never been installed on. `node`, `git` and `claude` are Flow's prerequisites: things Flow calls and never installs. Everything else in the report describes an install, which is why the flag skips it.

```text
$ flow doctor --prereq
ok    programs: node, git, claude all resolve
ok    util: fs tree, fs open all run

nothing to fix.
```

Setting Flow up and migrating it both start here, and both stop when it exits 1. `apply-migration.js` runs the same 2 checks again before it changes its first path, so a migration never begins on a machine that cannot finish it.

`flow check` is the other verification command and answers a different question: the ticket graph in the project you are standing in.

### `flow sync`

`~/.flow/` is one private git repository, and that repository is the whole of how Flow reaches your second machine. Everything of yours that should travel already lives there: the rules, the workflow notes, the study cases, the private skills, the wiki and the tickets that belong to no project. A project travels through its own repository, and Flow leaves it alone.

`flow sync` brings the other machine's work down, then sends this machine's up. Down first: a pull that is not a fast-forward stops everything and says to sort `~/.flow/` out by hand, and a commit made here first would only add a merge to untangle. Nothing runs by itself. You type it.

A commit is named for the machine that made it, so a line in a note can be traced back to where it was written:

```text
$ flow sync
came down: Updating 8f21a0c..3d4b19e
went up: desktop: 2 files
```

What describes one machine never travels, and `~/.flow/.gitignore` names all of it: `version`, `run.json`, `originals/`, `settings.local.json`, the `scripts` and `references` links, and each wiki tool's `downloads/`.

### `flow uninstall`

Takes Flow off this machine and leaves it as it was. It puts each project's original back, then the machine's, then deletes `~/.flow/` and the clone. It does all of that itself rather than asking you to run `flow restore` first, because putting the machine's original back deletes `~/.local/bin/flow` and a second command would have nothing left to type.

```text
$ flow uninstall
Restores delapse, backmark and this machine, then deletes ~/.flow/ and ~/code/flow.
Type uninstall to go on:
```

The clone stays where git says it holds something you would lose: a file changed and not committed, or a commit no remote has. The path is printed instead, for you to delete yourself.

A machine with no original is still covered. Every path Flow owns is removed, Flow's hooks come out of `~/.claude/settings.json`, and the import line comes out of `~/.claude/CLAUDE.md`. What those paths held before Flow is gone, which is what the original exists to prevent.

The same 4 locks as `flow restore` guard it, the first 2 being every Claude Code and Codex session closed and the word `uninstall` typed at a terminal. [Migrations and the original](#migrations-and-the-original) lists all 4.

## Migrations and the original

A migration is a change to where Flow, Claude Code and Codex keep their files. Only 3 things write one: `flow setup` moves your machine onto Flow, `flow setup project` moves a project, and `/flow:migrate` moves either one to a newer Flow.

The original is every path as it was before Flow first touched it. There is one per place, a place being this machine or one project, and putting it back is how you undo Flow.

A migration is not a ticket. A ticket is your project's own work, and git undoes it. A migration changes files git never sees, such as `~/.claude/`, so the original undoes it.

**The original is written in one window, and nothing is ever added to it afterwards.** `flow install` opens the machine's and copies every path it is about to create. The first `flow setup` adds each path its migration changes, and closing the window is the last thing that run does. A project's window opens and closes inside its first `flow setup project`. After that, a migration months later copies nothing: a file you made last week is yours, not part of the machine you had before Flow, and nothing on disk can tell the two apart.

**What it is for is the first week or two**, where you try Flow and decide against it. Undoing one migration is a different job, and Flow does not do it.

A migration gets a folder per run, and a place gets one original:

```text
~/.flow/migrations/home-me-code-projects-delapse/2026-09-20T10-12-40/
├─ migration.md     one line per change: write, delete, move or run
├─ applied.json     how far the run got, written as it goes
└─ files/           the new version of each file it writes, at files/<full path>

~/.flow/originals/home-me-code-projects-delapse/
├─ manifest.json    one entry per path, and whether the window is closed
└─ files/           each path as it was before Flow, at files/<full path>
```

A migration of the machine goes in `machine/`. A project's goes in a folder named for the project's full path, with every character that is not a letter or a digit turned into `-`, so `/home/me/code/projects/delapse` becomes `home-me-code-projects-delapse`. An original is filed under the same name, and that name is the whole of how it is found: no date is read, and there is no id to look up. A migration id is the folder's path below `migrations/`, such as `machine/2026-09-18T21-30-05`.

**A path that was not there is recorded as absent**, along with any folder made to hold it, so putting the original back deletes it. That is why restoring a project's original takes its whole `.flow/` with it.

**Nothing under `~/.flow/` is ever recorded.** Putting the machine's original back leaves your notes, tickets and study cases exactly where they are. Only `flow uninstall` deletes that folder.

Claude writes the migration, then stops for your yes. You read `migration.md`, delete any line you refuse, and say go. Claude never writes a real path itself. The skill runs `apply-migration.js`, which carries out `migration.md` one line at a time, so a path the migration leaves out is never touched.

`migration.md` opens with 2 frontmatter fields. `type` names what wrote it: `setup-machine` for `flow setup`, `setup-project` for `flow setup project`, and `migrate` for `/flow:migrate`. `project` is the project's path, left out for the machine. A line starting with one of 4 verbs is an action, and everything else in the file is for you to read:

- **`- write <path>: <why>`**: the copy at `files/<full path>` replaces it, a file or a whole folder.
- **`- delete <path>: <why>`**: removes a file or a whole folder.
- **`- move <path> -> <path>: <why>`**: the second path must not exist yet.
- **`- run <command>: writes <path>, <path>`**: runs the command from the project, or from your home folder for the machine. The line names every path the command writes, or says `writes nothing`, because only a named path is copied first.

`~` is your home folder. A path starting with neither `~` nor `/` sits inside the project.

```md
---
type: setup-project
project: ~/code/projects/delapse
---

# Delapse into Flow

- write CLAUDE.md: one line importing AGENTS.md
- delete ~/.claude/projects/-home-me-code-projects-delapse/memory/: 24 files, carried into docs/
- move docs/work/ -> .flow/tickets/: the old work, as tickets
```

### `~/.flow/scripts/apply-migration.js <id>`

Carries out a migration. The skill that wrote the migration runs it after your yes, and you never type it. It is not a `flow` command and not on your `PATH`, so it cannot run by accident.

Before each line runs, every path that line changes is copied into the place's original, once per path, and only while that window is open. A symlink is recorded with the path it points at, never copied. A `setup-machine` or `setup-project` migration closes the window on its way out, and every migration after that copies nothing.

Every line is checked before the first one runs. Any of these refuses the whole migration and changes nothing:

- a folder not named for a time, such as `2026-09-20T10-12-40`
- no `type` in the frontmatter
- a relative path in a migration with no `project`
- a `write` line whose file `files/` does not hold
- a `run` line that names no path and does not say `writes nothing`
- a path inside `~/.flow/migrations/` or `~/.flow/originals/`, or a folder holding either
- a migration already applied
- a file named by a `write` or `delete` line, or any file inside a folder one names, that changed after the time the migration's folder is named for
- a prerequisite of Flow's that is not met, which is the same list [flow doctor](#flow-doctor) checks with `--prereq`

The changed-file check catches a migration run long after it was written, or in the middle of your work. It lists every changed file, and Claude writes the migration again from what is there now. `run` and `move` lines are left out of it, since a command acts on the file as it finds it, and a move takes whatever is there with it.

A line that fails stops the run there, and `applied.json` beside `migration.md` holds how far it got. Fix what failed, and the skill runs the script again, which carries on from the line that stopped. A migration edited in between refuses to carry on, because the lines already done no longer match the file.

### `flow restore ls`

Every original on this machine, the machine's first: where it is of, how many paths it holds, when it was written, and whether its window is closed. This is the default action, so `flow restore` with nothing after it prints the same list.

```text
machine                   7 paths   written 2026-09-18T21:30:05   closed
~/code/projects/delapse   3 paths   written 2026-09-20T10:15:02   closed
```

### `flow restore machine` and `flow restore project`

Puts every path in one original back the way it was, the newest entry first, with its old time. A path recorded as absent is deleted. Each needs no agent and no session, so both work from a plain shell after a migration that broke Claude Code itself.

The original survives a restore, so the same command runs again and lands in the same place. Each restore adds a line to `~/.flow/history.jsonl`:

```json
{"at":"2026-09-25T10:04:31Z","type":"restore","paths":7}
```

A project's restore adds its folder as `project`.

Restoring the machine deletes `~/.local/bin/flow` along with everything else `flow install` made, so the last line says how to put Flow back. It leaves `~/.flow/` alone: only `flow uninstall` deletes that.

**4 locks stand in front of both, and in front of `flow uninstall`.** Each one alone stops an agent, and together they mean this only ever happens because you typed it:

1. **Every session closed.** A running `claude` or `codex` process refuses the command outright. Claude Code also rewrites `~/.claude.json` as it goes, and would write its own copy over the one just put back.
2. **A word typed at the terminal.** `restore` or `uninstall`, read from `/dev/tty` rather than from the input, so a pipe, a heredoc and `yes |` all miss it. A command run by an agent has no terminal at all.
3. **No flag skips the prompt.** There is nothing to paste and nothing to pull out of your shell history.
4. **`deny` rules in `~/.claude/settings.json`** covering `flow`, `fw` and the script's own path.

`--root <dir>` on the script and every one of these commands stands in for your home folder, as it does for `flow install`.

## Typing a command

```text
flow <command> [id]... [--flags]
```

The command sits at position 1, always. A word naming no command is read as a ticket id, so `flow t047` and `flow get t047` do the same thing. Flags take two dashes and the full name: `--status`, never `-s` or `--stat`.

Six groups carry their own actions: `cases`, `skills`, `overlays`, `audit`, `restore`, `setup`. Each is spelled `flow <group> <action>`, and each names a default action that can be left out. `flow overlays groundwork` is `flow overlays get groundwork`.

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

`--files` loads every file named in the ticket's `open` block, by running `util fs open --files-only` on `ticket.md` from the repo root. Off by default, so a second `get` in the same session never double-loads context. `/flow:start` passes `--files` explicitly, and so does each phase skill when typed with a ticket id.

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

```text
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

The frontmatter records which model failed, read and never guessed. `model` is the model of the session's last reply, read from the session's own transcript, which `CLAUDE_CODE_SESSION_ID` names. A `/model` switch mid-session cannot mislabel a case. `effort` comes from `CLAUDE_EFFORT`. Outside Claude Code, both are left out.

```md
---
date: 2026-09-15
project: flow
model: claude-opus-5
effort: xhigh
rule: short-is-the-default
status: open
---
```

### `flow cases ls`

List cases. Flags: `--issue <name>`, `--status <open|fixed>`.

### `flow cases get <ref>`

Show one case in full: issue, date, project, model, effort, rule, fix, status, and the body.

### `flow cases edit <ref>`

Change a field. `--status fixed` requires `--by <file>` (the file that changed to fix it) unless the case already has a fix recorded. `--status open` clears the fix. `--rule "<rule>"` sets the rule that failed.

### `flow cases issues`

Every issue folder with its count, open count, latest date, and the rules that failed across its cases. Read this before creating a new case, so a repeat failure lands in the folder it already has.

## Skill discovery

Every skill Flow can reach, and switching each one on or off for a project, for this machine or for every machine. [The skills](#the-skills) lists Flow's own; [Adding a skill](../dev/skills.md) covers writing one.

### `flow skills`

One command lists, adds and switches skills from 4 places, each shown in `ls` as a source:

- **`flow`**: the 2 Flow skills in `skills/dev/`, `/flow:review` and `/flow:apply-domain-findings`. Off until you switch one on. Every other Flow skill is part of the workflow and always on, so `ls` leaves it out.
- **A skill repository**: a repository of skill folders, cloned whole into `~/.flow/repos/sources/<owner>_<repo>/`. Every `SKILL.md` in it is a skill, at any depth, and a `SKILL.md` at the root makes the repository one skill. `ls` names it by its repository name, `domain-skills` for the first. Off until you switch one on.
- **`private`**: skills you write yourself, in `~/.flow/private-skills/<name>/`. Off until you switch one on.
- **`outside`**: plugins, and skill folders another tool put in `~/.claude/skills/`. `ls` shows them, and nothing here switches them: Claude Code's `/plugin` and `/skills` menus do.

`sources` in `~/.flow/settings.json` lists the skill repositories, as `owner/repo` for GitHub or a full git address for anywhere else. With no `sources` key the list is the [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) repository alone. `flow install` clones every one that is missing.

```json
{ "sources": ["Adrian333Dev/domain-skills", "mattpocock/skills"] }
```

The commands:

- **`flow skills ls [pattern...] [--source <name>]`**: every skill by source, with its state. Each pattern is a regular expression matched against the name and the description, ignoring case, and a skill shows when it matches every one. `--source` lists one source whole, by its name or its `owner/repo`. With neither, a skill repository shows only the skills a settings line names, plus a count of the rest. This is the default action, so `flow skills react` is `flow skills ls react`.
- **`flow skills on <name...>`** and **`flow skills off <name...>`**: write the name's line at one level, then make the links match.
- **`flow skills drop <name...>`**: remove the name's line at that level, so the level above decides again. `drop <owner/repo>` removes a skill repository from `sources` and deletes its clone.
- **`flow skills add <owner/repo> [name...]`**: clone a skill repository, add it to `sources`, and turn on each name given. With no name it lists what it found and switches nothing. A repository holding no `SKILL.md` is refused, and its clone removed.

**The level comes from a flag.** No flag is this project, `--machine` this machine, and `--global` every machine. Each level is one settings file, holding a `skills` key with a line per name switched:

- **This project**: `<project>/.flow/settings.json`, committed with the project, so a fresh clone of it gets its skills back.
- **This machine**: `~/.flow/settings.local.json`, which stays on this machine.
- **Every machine**: `~/.flow/settings.json`, which [`flow sync`](#flow-sync) carries to your other machine.

```json
{ "skills": { "react": "on", "review": "on" } }
```

The nearest level wins, name by name: the project over the machine, the machine over every machine. A name no file mentions is off. So the files hold only what you switched.

**A skill is on where its link exists**, and nothing else switches one. A skill on for a project is linked in that project's `.claude/skills/<name>`, and one on for the machine in `~/.claude/skills/<name>`. Flow's own are linked in `~/.agents/skills/flow/skills/<name>`. Every `flow skills` command makes the links match the settings, and so does every session start, which asks Claude Code to scan the skill folders again when a link changed.

```text
$ flow skills ls
                         state    level
flow
  apply-domain-findings  off
  review                 on       global
domain-skills            41 more
  react                  on       project
  vitest                 off      machine
private
  my-notes               on       global
outside
  frontend-design        plugin
```

`level` shows only where a line set the state. An empty one is the source's default.

What each command refuses, and what it says instead:

- **A Flow skill outside `skills/dev/`, in `on` or `off`.** It is part of the workflow and always on. A line naming one does nothing, and `drop` still removes it.
- **A Flow skill with no flag.** Flow's skills load for the whole machine as one plugin, so they have no project level. Add `--machine` or `--global`.
- **`off` in a project, for a skill on for the machine.** The machine's link loads in every session, so a project cannot hide it. `off --machine` switches it off everywhere on this machine.
- **A name 2 skill repositories share.** Name the one you mean as `owner/repo:name`.
- **A real folder, or a link another tool made, where the link would go.** It is left alone and reported.
- **No flag outside a project.** Add `--machine` or `--global`.

`on --machine` and `on --global` say what they cost as they go: every session on the machine loads that skill's description, in a project it has nothing to do with too. The first link into a skills folder that did not exist needs a Claude Code restart, since Claude Code only watches a skills folder that existed when the session started. A line naming a skill no source holds shows under `ls` as `missing`, with the `drop` that removes it.

Every switch, clone and pull adds a line to `~/.flow/history.jsonl`:

```json
{"at":"2026-09-24T09:12:05Z","type":"skill","name":"react","state":"on","level":"project","by":"flow skills on"}
```

**The clones update themselves when a session opens.** The skills are links into them, so a pull makes every project holding one current at once. [`skillsAutoUpdate`](settings.md#skillsautoupdate) covers the pull, the 2 guards that stop it, and the switch.

## Overlays

A project extends a global skill by writing `.flow/overlays/<name>.md`. That content is appended to the skill's body when the skill loads in that project.

Every project shares the machine's one copy of a skill, so a project changes a skill here and never edits it. Removing works by adding too: "skip phase 3 here" is enough, because the overlay arrives after the phase it changes.

### `flow overlays get <name>`

Print the overlay for a skill. Prints nothing when no overlay file exists, which is the normal case and not an error. This is the default action: `flow overlays groundwork` is `flow overlays get groundwork`.

Every skill runs this at its end, so the overlay arrives after the skill's own content.

## Audit

Session history, read back from the transcripts Claude Code writes at `~/.claude/projects/`. Nothing is recorded and nothing is intercepted: the audit reads what Claude Code already wrote.

**Every file count is a floor.** A transcript records the command a session ran, never the files that command opened. `node build.js` reading a hundred files shows up as one command and no file.

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

Each check declares its own `tier`. `measure` records and interrupts nothing, `warn` puts a line in front of the agent, `block` refuses the edit. Every check starts at `measure`. `/flow:file-findings`' `references/write-checks.md` states the full export contract.

### `flow scorecard`

Add up every session file and print four lists: checks naming a rule no file defines, the rules broken most, the ones past the promotion threshold of 5 violations at 60%, and the ones that load every session and never once apply.

Broken check files print above all four, because a check that will not load is the whole report.

The command closes with its own coverage, as `12 rules measured, 89 not measurable`. Without that line a clean report reads as a clean session, when the usual truth is that most rules were never checked.

A result recorded before a check's `since` date is dropped, so rewriting a check throws away the counts the old version produced rather than averaging two different questions.

**Never violated is not a dead rule.** A rule only gets written after a real mistake, so zero violations means the fix took. The `never applied` list is the demotion signal: the situation the rule governs stopped arising.

The command only reads. Acting on it means editing a check file, which needs approval like any change.

## Sharing findings

A finding about a domain skill goes back to the repository the skill came from, as a pull request.

### `flow contribute`

Sends every finding waiting in `.flow/findings/<skill>/` to the `domain-skills` repository, one pull request per skill, titled `Findings for <skill>`. `/flow:file-findings` moves a finding there and runs this command when you say yes to sending it.

```sh
$ flow contribute
postgres: 1 sent, https://github.com/Adrian333Dev/domain-skills/pull/13
react: 2 sent, https://github.com/Adrian333Dev/domain-skills/pull/14
```

- **Only `gh` is needed**, logged in once with `gh auth login`. The command works through GitHub's API, so it needs no checkout and never touches your clone.
- **Without push access to the repository**, it makes your fork first and opens the pull request from there.
- **Each file is deleted once sent.** A skill whose send fails keeps its files for the next run, the other skills still go, and the command exits 1. A skill the repository does not hold fails the same way.
- **The pull request is never merged.** The maintainer checks each finding, writes the true ones into the skill with `/flow:apply-domain-findings`, and closes the pull request with a comment saying what went in and why.

## The skills

A skill is a folder under `skills/<group>/` holding a `SKILL.md`. Type `/flow:name` to run one, or let Claude fire it from its description.

**`(user only)` marks a skill only you can start.** Claude never sees its description, so it never fires one on its own. When one is the next step, Claude suggests it to you.

**The `flow:` in front of every one comes from a single file.** `skills/.claude-plugin/plugin.json` in the clone holds the one word `flow`. `flow install` links the whole set into `~/.agents/skills/flow/`, beside a copy of that file, and links `~/.claude/skills/flow` to the same folder. Both Claude Code and Codex read the file and offer every skill below it as `flow:<name>`, so no folder and no `SKILL.md` in the clone carries a prefix. Codex spells the same command `$flow:groundwork`. Changing the word in the manifest renames every command at once. [`flow skills on review --machine`](#flow-skills) adds one of the 2 `dev/` skills to every session on the machine.

**`phases/`, the four states a piece of work passes through.** Shown in every session. Each takes a ticket id, `/flow:execute t047`, and loads the ticket and its files itself. Typed bare, it loads nothing.

- **`/flow:groundwork`**: refines the idea and designs the solution, walking every open decision including the ones nobody raised
- **`/flow:execute`**: builds one ticket, plan through review
- **`/flow:prototype`**: throwaway code answering one question, and a report of what it found. Naive on purpose
- **`/flow:debug`**: finds the cause by evidence, proves it, fixes it

**`tools/`, the jobs that fit no phase.** Shown in every session.

- **`/flow:start`** (user only): opens a session on the board, one ticket, or a loose file
- **`/flow:handoff`**: writes what a session that was not here needs, the state itself rather than a reading list
- **`/flow:file-findings`** (user only): files a session's findings into skills, rules and checks
- **`/flow:research`**: reads what an external tool actually does, from its own documentation and source
- **`/flow:visualize`**: draws ASCII diagrams, screen mockups and HTML previews
- **`/flow:tickets-from-spec`** (user only): cuts the next batch of work out of `docs/spec/` into tickets

**`dev/`, maintaining Flow and the `domain-skills` repository.** Off until [`flow skills on <name> --machine`](#flow-skills) turns one on. These 2 are the only Flow skills that switch.

- **`/flow:review`**: finds where Flow's rules failed, where friction repeated, and where the design was wrong
- **`/flow:apply-domain-findings <skill>`** (user only): checks the findings sent to one domain skill, writes the true ones into its body and pages, and closes their pull requests

A skill under `skills/drafts/` installs nowhere. Moving it out of that folder is what ships it.

## Agents read files with Read, never `util fs merge`

Flow's rules send every file an agent opens through Read, Claude Code's own tool for opening a file, and ask for all the files a step needs at once. `util fs merge`, the util command that prints many files as one text, is left out on purpose. Its line in `util ls` says it is not designed for Claude Code.

**The reason is a size limit.** Claude Code hands a shell command's output to the agent up to about 30,000 characters, counted across everything the command printed. Past that, the agent sees a 2,000-character preview and the path of a file holding the rest. A Read call gets its own page of 25,000 tokens, about 100,000 characters, and Read calls sent together each get a full page. 10 files read together arrive whole. The same 10 through `merge` arrive as a preview.

**No setting raises the limit for `merge` alone.** Claude Code's `bashOutputMaxChars` raises it for every command on the machine, or for every command in one session when passed with `--settings`. Neither was worth the change for one command.

**Leave `merge` out of your preferences.** A line in the `## Preferences` section of `~/.agents/AGENTS.md` telling agents to use it brings the limit back. `merge` stays useful to you: it prints a set of files ready to paste into a chat.

## Settings

Two files, and Flow contributes to one of them.

**`~/.claude/settings.json`** is Claude Code's, and `flow install` never writes it. `flow setup` merges Flow's keys into it, key by key. Flow contributes four keys:

- **`hooks`**: 6 jobs. `guard.js` asks you before a shell command that could destroy work: a delete outside the project, a download piped into a shell, a write into a shell startup file, or a git command that throws work away. `changes.js` records what each subagent changed and hands the parent a diff when the subagent finishes. `rule-check.js` and `instructions-loaded.js` run Flow's rule checks on every edit and record which instruction files entered context. `check-ticket.js` refuses a typed phase skill whose ticket id matches nothing, before the skill loads. `reminder.js` prints `references/reminder.md` beside every message, pointing the agent back at the rules for writing a reply. `session-check.js` opens a session with one line when this machine or this project needs attention, and nothing when neither does. It also makes every skill link match the settings, and sends every skill repository to update itself in the background
- **`permissions`**: an allow list and a deny list. The allow list covers edits, reads, web lookups and the everyday shell commands, such as `mv`, `node`, `npm test` and `flow`, so every other command asks you, every git write included. The deny list covers the Claude Code surfaces Flow does not use, the key folders `~/.ssh` and `~/.aws`, `sudo`, `su`, `mkfs`, the `--dangerously-skip-permissions` flag, and `flow restore machine`, `flow restore project` and `flow uninstall`, which are yours to type and never an agent's to run
- **`cleanupPeriodDays`**: how long Claude Code keeps session transcripts, which sets what `flow audit` can still read
- **`fileSuggestion`**: `file-suggestion.js` builds the list `@` opens, offering git-ignored files and putting the most recently changed first

A project overrides any of them in its own `.claude/settings.json`, and the two merge key by key rather than replacing. `flow setup` also writes `skillOverrides`, Claude Code's key for hiding a skill, for the ones it switches off: Claude Code's own `/batch`, and a skill synced from your Claude account that works against Flow's rules. `flow skills` never writes it.

**`~/.flow/settings.json`** and **`~/.flow/settings.local.json`** are Flow's own, and Flow reads the pair as one file with the local one winning. The split is your second machine: `~/.flow/` is one git repository shared between the two, and the local file is the part git ignores. Together they hold 6 keys:

- **`sources`**: the skill repositories [`flow skills`](#flow-skills) takes skills from, in the shared file. `flow skills add` and `drop` write it
- **`skills`**: which skills are switched on or off, a line per name, in either file and in a project's `.flow/settings.json`. The nearest file wins, name by name. `flow skills` writes it
- **`reminder`**: whether the reminder prints beside every message, in the shared file. `false` silences it, and every line Flow prints by itself gets a key like it
- **`sessionCheck`**: whether the line naming what needs attention prints when a session opens, in the shared file. `false` silences it
- **`skillsAutoUpdate`**: whether every skill repository pulls itself when a session opens, in the shared file. `false` turns each pull into a fetch that names what is waiting
- **`fileSuggestionIgnore`**: folders and files the `@` list never offers, in either file and in a project's `.flow/settings.json`. The lists add up

[Settings](settings.md) explains every key in both files, every value Flow rejected, and why.

## Files

Flow keeps the one real copy of its rules and its plugin folder in `~/.agents/`, what Claude Code reads in `~/.claude/`, and what only Flow reads in `~/.flow/`, its clones included. A project splits into `.claude/` and `.flow/`. [Where everything lives](where-everything-lives.md) shows every folder in one tree and says what writes each entry.
