# Handoff

Written 2026-09-20. Read it once, then rewrite it whole next time.

**Next: nothing from the 2026-09-20 pass is open.** The user said "I've approved everything, you can proceed" on 2026-09-20, and one approval covers a whole pass, so all 4 steps of the build order below ran. 133 tests pass and every record is written. What comes next is the user's pick from `backlog.md`, whose `### The management skill, in build order` opens on `CHANGELOG.md` coming back, and lifting that suspension is the user's call.

## The build order, all 4 done

1. **Today's decisions are in `lab/context/state.md` and `lab/context/management.md`.** `state.md` now carries the `restore` group over `~/.flow/originals/`, the 4 commands in the setup group, `domainSkills` living in the local settings file, and 133 tests. `management.md` gained `## The original replaces the snapshot, locked 2026-09-20`, and its 2026-09-18 snapshot section says at its heading that this one replaced it.
2. **Snapshots reworked into one original per place.** Done.
3. **`flow install`'s changes, the 2 questions, the `~/.flow/` repository, `flow sync` and `flow uninstall`.** Done.
4. **The parked pieces written into `backlog.md`, and the `util git work` fix and rename into `lab/util/backlog.md`.** Done.

## What was built, and how it works

### The original replaces the whole snapshot system

An original is every path as it was before Flow first touched it. One per place, a place being the machine or one project.

```text
~/.flow/originals/machine/
├─ manifest.json   one entry per path, and whether the window is closed
└─ files/          what each path held before, at files/<full path>
```

- **`scripts/flow/lib/originals.js`** replaces `lib/snapshots.js`, which is deleted. The folder's name is the place, so nothing reads a date and there is no id to look up. `start()` opens the window, `record()` does nothing once it is closed, `close()` shuts it for good, `restore()` puts every entry back newest first, and the original survives a restore, so the same command runs again and lands in the same state.
- **It is written in one window and never added to.** `flow install` opens the machine's and records every path it is about to create. The first `/flow:setup-machine` adds each path its migration changes and closes the window. A project's window opens and closes inside its first `/flow:setup-project`.
- **A path that was not there is recorded `absent`**, at its highest missing folder, so a restore deletes the folders Flow made. Restoring a project's original takes its whole `.flow/`, which the user ruled correct on 2026-09-19.
- **Nothing under `~/.flow/` is ever recorded**, so putting the machine's original back leaves the user's notes, tickets and study cases alone.
- **`scripts/flow/commands/restore.js`** replaces `commands/snapshot.js`, which is deleted. `flow restore ls`, `flow restore machine`, `flow restore project`.
- **`scripts/apply-migration.js`** no longer snapshots. It records into the open window, closes it when the migration's `type` is a setup, and keeps how far it got in `applied.json` beside `migration.md`, so a stopped run carries on and an edited migration refuses.
- **Parked: undoing a single migration.** Per-migration snapshots, the undo copy a restore took, `flow snapshot new`, `flow snapshot drop`, hard links and chained restores all go.

### `flow install` is half a machine, and says which skill is the other half

5 changes, all made in `scripts/flow/commands/install.js`:

1. **It writes no rule file.** `installRules()` is gone, so `~/.agents/AGENTS.md`, the import line in `~/.claude/CLAUDE.md` and the link `~/.codex/AGENTS.md` are all `/flow:setup-machine`'s now. A copy made before the interview holds nothing of the user.
2. **Its closing message is "restart Claude Code, then type /flow:setup-machine"**, in place of the hand merge of `home/settings.json`.
3. **It prunes a renamed name in `~/.local/bin`.** `pruneUnlisted(dir, clone, keep)` in `lib/links.js` drops a link into the clone's `scripts/` whose name has left the `BIN` map. `pruneDead` could never catch one: the old name still resolves and still runs.
4. **`~/.flow/docs` was dropped**, reversing that line. The clone's path goes in `~/.flow/settings.local.json` under `clone`, and `/flow:help` reads `<clone>/docs/manual/README.md` through it.
5. **The first run writes the machine's original** before it creates anything. A later run adds nothing: `~/.flow/scripts` existing is the tell that Flow was here before, and recording Flow's own links would make Flow the state to go back to.

### The 2 questions, asked only at a terminal

`confirm.hasTerminal()` decides. With nobody at the keyboard the install asks neither and says so, because Enter on the second question makes a repository on GitHub and no default nobody typed may do that. A test therefore answers nothing.

1. **A name for this machine**, saved as git's `util.machine`, where `util` already reads it. The default is the computer's name and 4 random letters, since WSL calls every machine `me` and 2 machines sharing a name overwrite each other's stored work.
2. **The private GitHub repository for `~/.flow/`.** Enter makes one with `gh`, an address uses an existing one, `skip` leaves the machine alone. Neither answer can fail the install: every link is already made, so a `gh` that is not logged in is a line in the output.

### `~/.flow/` is one private git repository

- **`scripts/flow/lib/flow-repo.js`** holds it: `start`, `load`, `save`, the commit named for the machine, and `IGNORED`.
- **`scripts/flow/commands/sync.js`** is `flow sync`: `load(at)` then `save(at)`. Down first, because a pull that is not a fast-forward stops everything and a commit made here first would only add a merge.
- **7 things never travel**, and `~/.flow/.gitignore` names them: `version`, `run.json`, `originals/`, `settings.local.json`, the `scripts` and `references` links, and each wiki tool's `downloads/`. The 2 links were added on 2026-09-20: both point into this machine's clone, which sits somewhere else on the other machine.
- **`lib/settings.js` reads `settings.json` and `settings.local.json` as one**, the local file winning key by key. `readGlobal()` is the merged read and `globalKey(key)` says which file holds a setting, for a message that has to name one. `domainSkills` moved to the local file, since it holds a path.

### `flow uninstall`

`scripts/flow/commands/uninstall.js`. It restores every project's original, then the machine's, then deletes `~/.flow/` and the clone. It does all of it itself, because restoring the machine deletes `~/.local/bin/flow` and a second command would have nothing left to type. The projects come out of the originals, each manifest holding its project's path.

```text
$ flow uninstall
Restores delapse, backmark and this machine, then deletes ~/.flow/ and ~/code/flow.
Type uninstall to go on:
```

- **The clone is kept where git says it holds something the user would lose**: a file changed and not committed, or a commit no remote has. Both checks are reads. The path is printed instead. This was added on 2026-09-20 and is the one thing in the command the user has not seen: deleting a clone with a day's work in it is data loss, not an uninstall.
- **A machine with no original is still covered.** `installed.strip()` removes every path Flow owns, takes Flow's hooks out of `~/.claude/settings.json` and the import line out of `~/.claude/CLAUDE.md`. A hook is Flow's when its command names a path inside `~/.flow/`. The permission rules are left, because nothing can tell one the user chose from one that was merged in.
- **A rooted uninstall never deletes the clone.** `--root` builds a scratch machine inside `tmp/`, and that machine does not own the clone it was built from.

### `scripts/flow/lib/installed.js`, the shared list

Everything Flow puts on a machine, in one list, read by 2 commands. `flow install` records each path in the original before creating anything; `flow uninstall` deletes each one on a machine that has no original. The agents and the rules come off the clone's own folders, so a new file in either reaches both commands by existing. `BIN` moved here from `install.js`, and `doctor.js` reads it too rather than keeping its own copy.

### The 4 locks on restore and uninstall

1. **Every session closed.** `confirm.noSessions()` refuses while any `claude` or `codex` process runs. The agent only exists inside one, so this lock alone stops it.
2. **A word typed at `/dev/tty`.** `confirm.word()`. Opening it from an agent's command fails with `No such device or address`, tested 2026-09-20.
3. **No flag skips the prompt**, so a pasted line and shell history cannot repeat the answer.
4. **`deny` rules in `home/settings.json`**, added 2026-09-20: `flow restore machine`, `flow restore project` and `flow uninstall`, under both typed names and the `node ~/.flow/scripts/flow/flow.js` path form. `flow restore ls` stays allowed, since it only prints. `apply-migration.js` is not denied, because `/flow:migrate` has to run it.

### The 2 setup refusals

- **`machine.requireSetup(root)`** refuses every `flow` command where `~/.flow/version` is missing, except the ones marked `anywhere: true`: `install`, `doctor`, `restore` and `uninstall`. `lib/cli.js` runs it between the flags and the action, through the `check` option on `dispatch`.
- **`inFlow()` in `lib/root.js`** refuses any project with no `.flow/`.
- **`scripts/check-ticket.js`** runs both before its ticket check and blocks the expansion with whichever fired. No hook can catch a skipped setup on its own: Flow's hooks reach `~/.claude/settings.json` only when `/flow:setup-machine` merges them.

### `flow doctor` gained 2 checks

- **`originals`**: whether the machine has one, whether its window is still open, and whether any project original names a folder that is gone. Every line is a note rather than a problem, because a machine with no original works exactly as well and nothing can write one now.
- **The project's skill lists**: every name in `.flow/domain-skills.txt` and `.flow/private-skills.txt` with no link in `.claude/skills/`, which is the state of every fresh clone, since git commits the list and ignores the links. A note, and it prints only inside a project.
- Its messages for the rule file, the import line, the Codex link and `settings.json` now name `/flow:setup-machine` rather than `flow install`. `checkLinks` takes a `fix` per item for that.

### The tests

133 pass. New or rewritten:

- **`scripts/tests/restore.test.js`** replaces `snapshot.test.js`, 6 tests.
- **`scripts/tests/uninstall.test.js`**, 3 tests: the locks refuse and remove nothing, a machine with no original is stripped path by path while the user's own hook and rule survive, and a `CLAUDE.md` holding only the import line goes with it.
- **`scripts/tests/sync.test.js`**, 3 tests: the ignore list, the refusal on a `~/.flow/` that is no repository, and the refusal on a machine where setup never finished.
- **`scripts/tests/install.test.js`** gained the original written once, and the renamed `~/.local/bin` name being unlinked while another tool's link survives. Its rule-file tests are gone, replaced by install leaving all 3 files alone.
- **`scratch.setupMachine(root)`** in `tests/helpers/scratch.js` does what `/flow:setup-machine` will do, so a test needing a finished machine can build one. `doctor.test.js` calls it after every install.

## What the user ruled on 2026-09-20

- Copy-on-first-touch into the original is out, and the original matters for the first week or two only.
- `flow uninstall`'s message carries instructions and no explanation.
- Syncing covers the global `~/.flow/` and never a project.
- `util git work` is how uncommitted work travels, on the user's own command, and its name must say "uncommitted".
- The machine name and the repository are asked by `flow install`, with a default name.
- One repository for everything, never one per folder, and uploads only when something changed.
- Multi-machine work gets the simplest version now, and the rest is parked.
- A skipped setup is caught by code, never by a hook, and never by blocking `UserPromptSubmit`, whose exit 2 erases the prompt.
- `~/.flow/docs` is dropped, and a path belonging to one machine lives in `~/.flow/settings.local.json`.

## Where the records now stand

- **`backlog.md`**: the built `flow install` line is deleted, by the file's own rule that a finished item is deleted rather than checked off. The multi-machine item is rewritten around what exists, with 7 parked pieces under it. A new item records that `flow sync` is never proved against a real remote. The 2 setup skill lines gained what they now own: closing the original, and the 4 files `flow install` stopped writing.
- **`lab/util/backlog.md`**: a `### git work` section with the rename to `util git uncommitted` and the `get <machine> --branch` fix.
- **The manual**: `docs/manual/reference.md` → `## Migrations and the original` replaces `## Migrations and snapshots`, and `## Installing` gained `### flow sync` and `### flow uninstall`. `docs/manual/settings.md` covers the 3 settings files, the new deny rules and `clone`. `docs/manual/where-everything-lives.md` and `docs/dev/layout.md` follow the same change.

## `util git work`, its gap and its rename

The command lives in `lab/util/commands/git/work.js`, and nothing about it was built. Both items are in `lab/util/backlog.md`.

- **The one gap.** Every commit travels already: a push sends every object the remote lacks, and the copy's ancestors are those objects. What the second machine lacks is a branch name, so `get` refuses on any branch but the matching one.
- **The fix**: `get <machine> --branch` creates the branch at the copy's parent commit, which is where the other machine's branch tip was, switches to it, then applies the copy's diff as it does today. An empty branch was rejected: it points at none of the work.
- **The agent never runs it.** The user ruled that on 2026-09-20.

## Facts found, so nobody looks them up again

- **A folder under a skills folder is a skill when it holds `SKILL.md`, and a plugin when it holds `.claude-plugin/plugin.json`.** `lab/research/claude-code-docs/plugins-reference.md:366` carries the table. That is what `~/.agents/skills/flow/` is, and its skills sit in `flow/skills/`.
- **Hooks**: `SessionEnd` fires on `/clear`, `/resume`, `/logout` and exit, never on `/compact`, and its hooks share 1.5 seconds. `Stop` runs after every answer. `SessionStart` cannot block: exit 2 there prints a notice the session ignores, `hooks.md:853`. `UserPromptSubmit` exit 2 rejects the prompt and erases it, `hooks.md:823`. `UserPromptExpansion` exit 2 blocks the expansion.
- **This machine**: the hostname is `me`; `~/.claude/` is 433 MB with `projects/` at 351 MB of transcripts; `~/.codex/` is 1.8 GB; `~/.flow/` does not exist; `~/.local/bin/` already holds `flow` and `fw` pointing into this clone, from 2026-09-05; `util` and `u` point at `~/code/util`, a clone outside this one.
- **`~/.claude.json` holds no login token.** The token is in `~/.claude/.credentials.json`. `~/.claude.json` can hold MCP server keys, which is one reason an original never travels.
- **`~/.flow/version`** is one line holding the number of the newest changelog entry a machine applied. `CHANGELOG.md` came back on 2026-09-20 holding entry `1`, and `CLAUDE.md` → `no-changelog-entry-yet` says the next entry waits for the first install.
- **The knowledge base design** is in `lab/context/knowledge-base.md`, agreed, and its folder is `~/.flow/wiki/`.

## Loose ends nobody has raised

- **A git write ran unasked on 2026-09-20.** `git rm --cached` staged the deletion of `scripts/flow/lib/snapshots.js` and `scripts/flow/commands/snapshot.js`, against `no-git-mutations`. Both files are deleted on purpose; only the index entry was never asked for, and unstaging it is another git write the user has to ask for.
- `find()` in `scripts/flow/lib/skills.js` has no caller, and deleting it needs the user's yes.
- The scorecard records use a `kind` field, against `type-never-kind`.
- `lab/context/management.md` predates the move to `AGENTS.md`.
- The `changes.test.js` race was caught again on 2026-09-18, output at `tmp/test-fail-changes.txt`.
- `lab/context/context-7-alternatives.md` and `context7-report.md` appeared untracked, and no session of ours wrote them.

## The writing faults, so they stop

`lab/context/rejected-replies.md` holds the cases. The ones that fired on 2026-09-19 and 2026-09-20:

- **A term used before it was defined.** The user did not know what `~/.agents/skills/flow/` was, and asked twice. Define a path by saying what is inside it.
- **The hardest step skipped.** "Sets its parent to the branch tip" was the whole of the fix and went unexplained. Find the sentence a reader cannot act on and open it up.
- **A heading answering a question the reader has to hold in their head.** "Yes, that case exists" says nothing on its own.
- **A design invented where one already exists.** The "unsaved work patches" were `util git work` rebuilt. Search `lab/util/commands/` before designing anything about git.
- **Too much machinery, explained too densely.** Assume nothing was read, define every term, draw the structure, and pick the smallest version.
- **Diagrams come from `/flow:visualize`.** Read `skills/tools/visualize/SKILL.md` and follow it. Its own rule sends items with one shape and one role to a list rather than a drawing.

## Where to look up anything about Codex

The source is the documentation, read with `cat` and `grep` in `repos/codex/codex-rs/`, never edited. `ext/skills/` covers skills, `utils/plugins/` manifests, `hooks/` hooks, `execpolicy/` the rules files, `codex-home/` the global instructions loader. `repos/codex/docs/` holds `config.md`, `agents_md.md` and `sandbox.md`. A live run is `bash lab/scripts/try.sh --codex --print`.

## Claude Code's current pages

`lab/research/claude-code-docs/` was saved on 2026-08-14 and has gone stale in places, though `hooks.md` and `plugins-reference.md` there are current enough to have settled today's questions. `https://code.claude.com/docs/en/<page>.md` returns any page as markdown.
