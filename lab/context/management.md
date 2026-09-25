# The management skill: the groundwork map

Opened as a map on 2026-09-16, by the groundwork method run in conversation. **Every question in it is closed**, each by a dated section below holding the argument. The record it replaces was opened 2026-09-11 and held proposals with no yes; those proposals sit below under the branch each one feeds. What the map produced is a list of things to build in one order: `backlog.md` → `## V1` → `### The management skill, in build order`.

**What it is.** Flow's assistant on a machine, for the life of the install. Four jobs on one spine. The spine: look at what is on the machine, compare it with what Flow expects today, write the gap down as a migration, get a yes, do it, then prove it worked. The jobs: prerequisites, setup, migrate, answer. The shape, the walk order and this file as the landing place were approved by the user 2026-09-16.

## The map

- [x] 0: The Migration Spine
  - [x] 0.0: what tells the agent what changed: the diff against the templates, the changelog, or both?
  - [x] 0.1: what the version is, and where the machine and each project record the one they last applied?
  - [x] 0.2: how a machine learns it is behind the clone, and the clone behind upstream?
  - [x] 0.3: how a project still on an old shape is detected when it is opened?
  - [x] 0.4: which files a machine migration may touch, `settings.local.json` and `.codex/` included?
  - [x] 0.5: what the fixed checklist says: where to look, what to check, in what order?
  - [x] 0.6: when the plan is written down and approved, and when one line is enough?
  - [x] 0.7: what a whole-workflow replacement does, step by step?
  - [x] 0.8: how a half-finished run is detected, and what says a run is done?
  - [x] 0.9: what a machine installs: the tip of `main` or a tagged commit?
  - [x] 0.10: what happens when a migration changes the management skill itself?
- [x] 1: Snapshot And Restore
  - [x] 1.0: what is copied, where, and what one restore puts back?
  - [x] 1.1: does a snapshot precede every run, or only a run that deletes?
- [x] 2: Proof
  - [x] 2.0: what `flow doctor` checks after a run, and what has to be added to it?
  - [x] 2.1: what the audit index proves: did a hook fire, did the rule file load?
  - [x] 2.2: what stays a live probe the user runs by hand?
- [x] 3: Setup On A Machine That Has Things
  - [x] 3.0: a survey with a written plan first, or one run?
  - [x] 3.1: the competitor test: what goes, what stays, what gets isolated to one project?
  - [x] 3.2: what is harvested from the old rule file before it is replaced?
  - [x] 3.3: `settings.json` key by key: which keys replace, which keep?
  - [x] 3.4: what "migrate this project" does to one project's memory and files?
  - [x] 3.5: what shape Flow ships in: a clone, an npm package or a Claude Code plugin?
- [x] 4: The 2 Personalised Files
  - [x] 4.0: does the live rule file import the template, or get transplanted section by section?
  - [x] 4.1: one profile section or two?
  - [x] 4.2: the interview that fills the profile, a child subject: what it asks, and when?
- [x] 5: The Answer Job
  - [x] 5.0: how the skill finds the page: an index generated from the headings, or the reference page?
  - [x] 5.1: what an answer is: a pointer to the section plus one line, and when more?
  - [x] 5.2: how "what do I do now" is answered, and where the line to `/flow:start` runs?
- [x] 6: Prerequisites
  - [x] 6.0: what is checked before any job: `util`, node, git, the domain-skills clone, the toolbox?
  - [x] 6.1: what changes here when the toolbox is replaced?
  - [x] 6.2: which operating systems, and what says so?
  - [x] 6.3: does the domain-skills clone update itself, and may one of its skills go global?
- [x] 7: Name, Group, Entry Points
  - [x] 7.0: the name and the group?
  - [x] 7.1: how the skill is invoked: typed, model-invoked, or from a session-start line?
  - [x] 7.2: what the session-start line says when the machine or the project is behind?

## Routed into a build order, 2026-09-17

The last phase of the method, after the walk closed all 8 branches and the attack ran against this machine. Every decision below is now a line in `backlog.md` → `## V1` → `### The management skill, in build order`, in the order the pieces have to be built: 3 sweeps over the repo, then `flow snapshot`, `flow install`, the changelog, `flow doctor`, `~/.flow/settings.json`, the `SessionStart` hook and the domain-skills pull, then `references/prerequisites.md` and the 3 skill bodies, then `flow up`. **Open work lives on those lines and not here**, by `backlog.md`'s own rule that an item lives in one place; this file keeps the argument behind each one.

**One thing the route found.** `CHANGELOG.md` has been suspended since 2026-08-09, and a migration's whole input is the entries newer than the date in `~/.flow/version`. So the file has to come back before `/flow:migrate` can ship, and lifting the suspension is the user's call.

**This map stays where it is.** The units are useful apart, so no folder moves onto a ticket, and every line in the build order points back here.

### Deferred, and why

- **A second harness.** `.codex/` and `.agents/` are not v1, said by the user, so `~/.codex/AGENTS.md` is not generated and `## The user` and `## Preferences` exist in one copy. Two harnesses would mean two inline copies and a capture reaching only one. `backlog.md` → **Flow on another harness and on another model** carries it.
- **Converting a project that already has its own workflow.** Set by the user 2026-09-08: it waits for such a project, because nothing here can be walked against a real one until one exists.
- **The interview's question list.** Written when `/flow:setup-machine` is written, against the harvest it follows, never before it.

## The version, locked 2026-09-16, numbered 2026-09-20

**The line is the entry's number rather than its date since 2026-09-20**, by `## The changelog comes back` below. The last bullet here predicted that change and names what forced it. Everything else in this section stands.

**Each machine and each project keeps a one-line file holding the last changelog entry it applied.** `~/.flow/version` on the machine, `.flow/version` in the project, written by the skill at the end of a run. The changelog is the file that returns at v1, one dated entry per change of behavior, newest first, and the date of its newest entry is Flow's version.

What follows from the file:

- `flow doctor` compares 3 pairs: the clone against upstream by a fetch, the machine's line against the newest entry, and inside a project, its line against the machine's. A session-start line prints only when one pair is behind. That answers 0.2, 0.3 and 7.2.
- **The fetch is `flow doctor --updates`**, named 2026-09-17 for the question it asks rather than for the network it uses. Every other check reads local files.
- **Being behind is a note, never a problem.** `doctor.js:227` already builds a `notes` list beside `problems`. The version comparisons go there, doctor suggests `flow up` and exits 0. A `run.json` left on disk is a problem and exits non-zero, because something really is half done.
- The agent's whole input to a migration is the entries newer than the machine's line, plus the diff of the live settings file and rule file against the templates. That answers 0.0.
- A date over a commit hash: a project reads it without git, and it names the entry it matches. What overturns it: 2 entries on one day needing separate migrations, and then the line becomes the date plus a counter.
- **Built 2026-09-20**: `scripts/flow/lib/version.js` reads the newest `CHANGELOG.md` entry and any `version` file, and `flow doctor` gained `checkRun`, `checkVersion` and `checkClone` over it, tested in `scripts/tests/doctor.test.js`. Behind is a note suggesting `flow up`, a number above the newest entry is a problem, and a submodule off its gitlink is a note. `--updates` reads the remote with `git ls-remote --tags`, which writes nothing on either side, rather than fetching.

## What a migration may touch, locked 2026-09-16

**What Flow put on the machine, plus `~/.claude/CLAUDE.md` and `~/.claude/settings.json`, and nothing else.**

- On the machine: `~/.claude/CLAUDE.md` outside `## The user` and `## Preferences`; `~/.claude/settings.json`, its hooks, permission rules and plugin lists; every symlink Flow made under `~/.claude/skills/`, `~/.claude/agents/`, `~/.claude/rules/`, `~/.flow/scripts/`, `~/.flow/references/` and `~/.local/bin/`; `~/.flow/settings.json`, `~/.flow/version` and Flow's own data such as `~/.flow/audit/audit.db`.
- In a project: `.claude/settings.json`, `.claude/settings.local.json`, the whole `.flow/` folder, and the lines in the project's `CLAUDE.md` that Flow wrote.
- Never: the user's own skills, plugins and MCP servers. Setup reaches them, under the competitor test. A migration does not.
- `settings.local.json` exists at a repository root only, per the Claude Code docs. The user level has `~/.claude/settings.json` alone.

## The 6 steps of a migration, locked 2026-09-17

Fixed order, each step naming the file it reads or writes.

1. **Open the migration's folder**: `~/.flow/migrations/<machine or project>/<date-time>/`, named for the time now, and `~/.flow/run.json` naming it. Nothing is copied yet. `apply-migration.js` copies each path at step 5, the moment before it changes, changed 2026-09-18 under `## Snapshot and restore`.
2. **Read what changed.** `~/.flow/version`, then every changelog entry newer than that date.
3. **Diff the 3 things Flow owns.** `home/settings.json` against `~/.claude/settings.json` for hooks and permission rules. `home/AGENTS.md` against `~/.agents/AGENTS.md`, skipping `## The user` and `## Preferences`. `flow skills ls` against the links under `~/.claude/skills/`.
4. **Write `migration.md` and every new file.** One line per path from steps 2 and 3, in the 4 verbs `## Snapshot and restore` lists, and each file it writes, whole, under `files/`. When it is approved is 0.6.
5. **Apply**: the skill runs `~/.flow/scripts/apply-migration.js <id>`. `flow install` for the links, and whatever an entry asked for, such as rebuilding the audit index, are `run` lines naming the paths they write.
6. **Prove and stamp.** `flow doctor`. On a pass, the newest entry's date goes into `~/.flow/version`.

The project half runs the same 6 inside the project when its `.flow/version` is behind the machine's, over `.claude/settings.json`, `.claude/settings.local.json` and `.flow/`.

## Snapshot and restore, locked 2026-09-17, rebuilt 2026-09-18, replaced 2026-09-20

**Replaced by `## The original replaces the snapshot, locked 2026-09-20` below.** What follows is the design as it stood, and the half of it that survives is the migration: `migration.md`, `~/.flow/migrations/` and `apply-migration.js` all work as written here. Every sentence about a snapshot is history.

**A migration is what the agent proposes, and a snapshot is the copies taken as it runs. They are 2 folders.** A migration is the list of changes and the new version of every file it writes. A snapshot is only what each path held before, and a list of those paths. Every run takes one, so 1.1 closes with 1.0. Rebuilt on the user's ask of 2026-09-18 that it hold every path a run could replace or remove, memory files and deletes included. Split the same day, the user's call: one folder holding the plan, `new/` and `old/` together left "apply a snapshot" meaning either side.

```text
~/.flow/migrations/home-me-code-projects-delapse/2026-09-20T10-12-40/
├─ migration.md     one line per change: write, delete, move or run
└─ files/           the new version of each file it writes, at files/<full path>

~/.flow/snapshots/home-me-code-projects-delapse/2026-09-20T10-15-02/
├─ manifest.json    the paths copied, how far the run got, and the migration it was taken for
└─ files/           each path as it was before, at files/<full path>
```

- **"Plan" means only a ticket's plan**, the user's call 2026-09-18. The setup side is a migration everywhere: `migration.md`, `~/.flow/migrations/`, `apply-migration.js`. All 3 skills write one. `references/workflow.md` → `## The pieces` defines it beside Ticket, with the rule where they meet: real project work a project setup finds becomes tickets, since a migration does only what one yes covers.
- **`migration.md` is the list, and `apply-migration.js` is the only writer.** The agent writes `migration.md` and `files/`, then stops for the yes. The skill then runs `~/.flow/scripts/apply-migration.js <id>`, which goes line by line, copying each path into a new snapshot the moment before changing it. A path the migration leaves out is never touched, and a path it names never changes without a copy. The design of 2026-09-17 had the agent type the paths into `flow snapshot new` first, and a path it forgot changed with no copy.
- **The script is off PATH and outside the `flow` command**, the user's call 2026-09-18. `flow apply <id>` read as a ticket command, since bare `flow <verb> <id>` is the ticket grammar, and a command on PATH can be typed weeks later or mid-work. Rejected on the way, never to return: `flow setup ls|apply|undo`, `undo` as a name, a top-level `flow apply`, and merging migrations into tickets. The machine has no tickets, project setup is what creates `.flow/tickets/`, and git cannot undo `~/.claude/` or an ignored file.
- **4 verbs make a line an action**: `- write <path>: <why>`, `- delete <path>: <why>`, `- move <path> -> <path>: <why>`, `- run <command>: writes <path>, <path>`. Everything else in `migration.md` is prose for the user, and a line the user deletes is a change that never happens. The frontmatter holds `type`, the skill that wrote it, and `project`, the project's full path, absent for the machine. A relative path sits in the project.
- **An out-of-date migration refuses**, the user's worry of 2026-09-18 about a run typed long after or mid-work. The script refuses when a file a `write` or `delete` line names, or any file inside a folder one names, changed after the time in the migration's folder name, and lists the files. `run` and `move` lines are exempt: a command acts on the file as it finds it, and a move takes whatever is there with it. Links are exempt, holding no content a new version was built from. Step 1 names the folder before anything is read, so a file changed while the agent reads is caught too. A snapshot and a restore keep each file's time, so a restored file never reads as changed. A `write` takes the time it happens.
- **The copies are taken at step 5, after the yes, never first.** A project's list exists only once the whole project has been read. A copy taken days before the yes would also restore a stale file.
- **A run may delete.** A file or a folder is copied whole before it goes, so a delete is as safe as a write. This reverses `Nothing is deleted at harvest` under `## Harvesting an existing setup`.
- **What is copied**: only what the migration names, never `~/.claude/` whole, which carries the session transcripts, 343 MB on this machine on 2026-09-18. A project's run names its own memory folder under `~/.claude/projects/`, since a line can name any path.
- **A path that does not exist is recorded as missing, at its highest missing folder**, so a restore deletes it and the folders made to hold it.
- **A symlink is recorded as a row, never copied.** The manifest holds the link's path and what it pointed at, and `flow snapshot restore` re-points it. Copying would follow the link and copy the target. `~/.local/bin` and `~/.claude/scripts` are in scope for setup on this machine, and both are links.
- **A file built from the old one is built before anything changes.** `files/` gets `~/.agents/AGENTS.md` whole, with `## The user` and `## Preferences` copied in from the live file, which stays untouched until step 5.
- **A run that stops part-way carries on in the same snapshot.** Running the script again finds the snapshot whose manifest names the migration, unfinished and never restored, and carries on from the line that stopped. An edited migration refuses, since the lines already done no longer match it. A migration whose stopped run was restored starts over in a new snapshot. An applied one refuses a second apply, and points at `flow snapshot restore`.
- **Restore is one command and no agent**: `flow snapshot restore <id>` puts the entries back newest first. It runs from a plain shell with no session open. It takes its own snapshot first, in a folder beside the one it restores, so a restore is undone the same way. `flow snapshot ls` shows the migration each snapshot was taken for, or the snapshot a restore undid.
- **A migration is blind to which harness a path belongs to**, walked 2026-09-18 on the user's question about 2 harnesses holding different context. One migration can name paths under `~/.claude/`, `~/.codex/` and `~/.agents/`, and one restore undoes them all. Context split between harnesses is merged into the files both read, `~/.agents/AGENTS.md` and the project's `AGENTS.md`, and the harness-only copy is deleted after its snapshot. It stays merged because Claude Code's memory is off in `home/settings.json` and Codex's is off by default. `backlog.md` holds the 2 things that could block it: one file per harness saying where it keeps things, and Codex's sandbox.
- **Projects snapshot into the same global folder**, never inside the project: a copy there would need ignoring in git and would vanish with the `.flow/` folder it restores. Copies rather than git, because git cannot restore an ignored file: Delapse ignores `.claude/settings.local.json`, and `media-reply` its whole `.claude/`. `flow snapshot ls` inside a project lists that project's alone, and `--all` lists every one.
- **One thing still rests on the agent**: a `run` line naming every path its command writes, such as `~/.claude.json` for `claude plugin uninstall`. A file a harness rewrites by itself, `~/.claude.json` again, changes through a `run` line, never a `write`, or the out-of-date check refuses it every time. If a live run shows the agent writing a real path itself, the next step is a `PreToolUse` hook refusing `Write` and `Edit` outside the migration's folder while `~/.flow/run.json` exists.
- **One folder for the machine, one per project, keyed by the project's full path. Locked 2026-09-18, the user's call.** Both trees share the layout. Machine runs go in `machine/<date-time>/`. A project's go in a folder named the way Claude Code names `~/.claude/projects/-home-me-code-projects-delapse/`, every character that is not a letter or a digit turned into `-`, with the leading dash dropped: `home-me-code-projects-delapse/`. flow reads a word starting with `-` as a flag, so `flow snapshot restore -home-me-code-app/2026-09-20T10-12-40` failed with `flags take two dashes`, tried 2026-09-18. 2 projects sharing a folder name never share runs. 2 paths can meet in one name, and the manifest's `project` field keeps them apart. The code reads no layout: an id is the folder's path below `migrations/` or `snapshots/`.
- **Built 2026-09-18**: `scripts/apply-migration.js`, and `flow snapshot ls` and `restore` in `scripts/flow/commands/snapshot.js`, over `scripts/flow/lib/migrations.js` and `snapshots.js`, tested in `scripts/tests/snapshot.test.js`. `flow snapshot new` was dropped, and `flow apply` removed the same day.

## The migration is always shown, locked 2026-09-17

Every migration is shown whole and runs on one yes, with no size threshold. It is a file the user edits, `migration.md`, described under `## A run stops once, at the migration`. A threshold makes the agent judge which migration is small, and a hook change reads as one line while rewiring every session. What overturns it: the yes becoming noise in the first weeks, and then the one exception is a migration touching symlinks only, which `flow install` already does alone.

## Setup and migration are two flows, locked 2026-09-17

**Setup runs once, on a machine that never had Flow. Migration runs on a machine that already has it.** They stay two procedures in the skill, never merged into one.

- Setup looks at what is already on the machine, asks the user about the skills, plugins and settings it finds, and interviews the user for `## The user` and `## Preferences` in `~/.claude/CLAUDE.md`. Branch 3 walks it.
- Migration reads `~/.flow/version`, then every changelog entry newer than that date, and plans from those. No survey, no interview. Branch 0 walks it.
- Both apply through `apply-migration.js`, which takes the snapshot. Both end with `flow doctor` and the version stamp. Nothing else is shared.
- **Setup is 2 skills, split 2026-09-18**: `/flow:setup-machine` once per machine, and `/flow:setup-project` once per project. The argument that keeps setup and migration apart holds between the two setups too: what they share is the migration, its apply and its snapshot, and those are code in `apply-migration.js` now. They read different things, write different things and run at different moments. Migration stays one skill, because the machine and a project run the same steps against a different folder.
- **The words are "setup" and "migration".** `flow install` already names the command that builds the symlinks, so "install" said of the whole first day reads two ways.
- **A third state exists: Flow's own leftovers with no version file**, found on this machine 2026-09-17. Setup's survey looks for it first, before the competitor test, because what it finds is Flow rather than a competitor. It reads `~/.local/bin`, `~/.claude/skills`, `agents`, `rules` and `scripts` for any link whose target is a Flow clone, this one or an older one, and writes each into `migration.md` as adopt or remove with the clone path shown.
- A whole-workflow replacement is a migration, the largest one, never setup. Flow is already on the machine, and `~/.flow/version` says which version it is on. `## A whole-workflow replacement` walks it.

## An unfinished run is a file on disk, locked 2026-09-17

**Before step 1 of any run, the management skill writes `~/.flow/run.json`.** It holds the date and time, the type (`setup-machine`, `setup-project` or `migrate`), the migration's folder, and the last step finished. Every step rewrites the last field. Step 6 deletes the file and writes the date into `~/.flow/version`.

- No `run.json` on disk and a current `~/.flow/version` means the run finished. `run.json` on disk means it did not, and the file names the step it stopped at.
- `flow doctor` reports it before anything else, names the step reached, and prints the 2 ways out: `flow snapshot restore <id>` to go back, or re-open the skill to carry on from that step.
- Reading it needs no agent and no session, which is the point.
- **Built 2026-09-20**, as the first check on `flow doctor`'s page. The 2 ways out it prints are the skill named by the file's `type`, which starts again at the step it holds, and `flow restore machine` or `flow restore project <path>`. The `flow snapshot restore <id>` above is history: `## The original replaces the snapshot` took per-run copies away, so going back now means putting the whole place back to before Flow.

## The check that runs by itself is a hook, locked 2026-09-17

**A new `SessionStart` hook prints one line when the machine or the project needs attention.** It reads 3 files, `~/.flow/version`, the project's `.flow/version` and `~/.flow/run.json`, and stays silent when all 3 are fine. Full `flow doctor` stays a typed command, since it runs the test suites.

- Today `home/settings.json` has no `SessionStart` hook. Its 11 hooks are 8 `PreToolUse`/`PostToolUse`/`Subagent` lines running `changes.js`, `guard.js` and `rule-check.js`, one `InstructionsLoaded`, one `UserPromptExpansion` running `check-ticket.js`, and the reminder on `UserPromptSubmit`.
- **Everything Flow prints gets a switch in `~/.flow/settings.json`**, read by the script that prints it. The reminder is first: `"reminder": false` silences it.
- The reminder runs on `UserPromptSubmit`, so it prints on every prompt. Its hook line becomes `node "$HOME/.flow/scripts/reminder.js"`, because a bare `cat` cannot read a setting. The version line goes on `SessionStart` instead, or it would repeat on every prompt.
- A VS Code startup task was rejected: it fires when the editor opens rather than when a session opens, and it helps only inside VS Code.
- **Built 2026-09-20, both halves.** `scripts/reminder.js` is the `UserPromptSubmit` hook and `scripts/session-check.js` the `SessionStart` one. `prints(name)` in `scripts/flow/lib/settings.js` is how either asks whether its line is switched on, and `"reminder": false` and `"sessionCheck": false` silence them. The session line reads the 3 files this section names, prints a stopped run alone, and stays silent when all 3 are fine.

## How Flow ships, locked 2026-09-17

**Flow stays a git clone the user reads and edits, and updating becomes one command.**

- **npm was rejected.** Flow's content is files the user opens: `skills/`, `references/`, `home/AGENTS.md`. npm puts them under `node_modules`, which nobody edits, and `npm install` overwrites it.
- **A Claude Code plugin was rejected.** A plugin ships skills and hooks. It cannot write `~/.claude/CLAUDE.md` or `~/.local/bin`, and those are half of Flow.
- **The clone is what the tools already need.** `flow doctor` and every migration compare the live files against the clone's templates. With no clone they have nothing to compare against.
- **`flow up`** on the machine does the whole update in one word: fetch, check what is newer, update the submodules, run the migration, run `flow doctor`. Inside a project it does the same against `.flow/version`.
- **One pasted line** clones the repo and starts setup on a machine that never had Flow.

## Proof, locked 2026-09-17

**Proof is 2 steps at the end of a run: `flow doctor` reads the disk, then one printed session shows the wiring firing.** Both are step 6, run by the management skill, after it has written the files.

- **What the transcript holds.** Checked against a real file under `~/.claude/projects/-home-me-code-flow/` on 2026-09-17: one record per hook that ran, carrying the hook's name, its event and the text it printed; the skill list the session was offered; the text of the rule file that loaded.
- **2.1, what the index proves.** In step 6 the skill asks that file 3 questions: did the session-start hook run and print `reminder.md`, was the new skill on the offered list, did `~/.claude/CLAUDE.md` reach the session. `flow audit` already indexes those files.
- **2.2, where the session comes from.** `flow doctor` only reads files, so it can see a hook written into `~/.claude/settings.json` and never see it run. In step 6 the skill runs `claude --print "ok"` in a scratch folder. That starts a second Claude Code session which answers once and exits, firing the hooks, and Claude Code writes its transcript. The skill reads that transcript.
- **When it runs.** Only when the run changed a hook, `~/.claude/CLAUDE.md` or the skill list. Otherwise step 6 is `flow doctor` alone. The cost is one small model call.
- Nothing is left for the user to run by hand.

## Prerequisites are checked by running them, locked 2026-09-17

**Overturned for util on 2026-09-23.** `flow install` now clones util and links it, so util is no longer a prerequisite. `## Skills, sources and the machine's clones, ruled 2026-09-23` holds it.


**Flow checks that the commands it calls work, never that a tool sits on a particular commit.** `lab/util`, `lab/toolbox` and `lab/domain-skills` are git submodules of this repo, so a gitlink already pins an exact commit. The pin answers "which commit" and Flow's question is "does what I call still work". The two come apart the moment the user edits `util` or decides not to update `domain-skills`.

- **`util`**: checked by running it. `doctor.js:46-48` lists `util fs tree`, `util fs merge` and `util fs open`, each with the callers needing it. The list grows when Flow starts calling a new command. A failure is a problem, because a hook breaks.
- **`domain-skills`**: Flow never calls it, so nothing is checked beyond the clone being found through `domainSkills` in `~/.flow/settings.json`. The user updates it when they choose. That closes 6.0.
- **`toolbox`**: temporary and replaced whole, so nothing to check. That closes 6.1.
- The gitlink stays as a record of what was tested together. A difference is a note, never a problem.
- When a migration needs a newer `util`, its changelog entry says so, and the migration runs the command check before applying. A missing command stops the migration and names `lab/util`.
- **Built 2026-09-20 as `references/prerequisites.md`, and replaced by code on 2026-09-21, the user's call.** A file of prose telling a skill which shell lines to type is the thing `doctor.js` already warns against: a skill asked to check things by hand gets one wrong and reports success. `flow doctor --prereq` is the check now, `scripts/flow/lib/prereq.js` holds it, and the markdown file is deleted.
  - **A prerequisite is what Flow calls and never installs**, which is `node`, `git` and `claude` on PATH plus the 3 util commands. Everything Flow puts on a machine stays in the rest of `flow doctor`, where a missing piece is repaired rather than treated as a wall. The 3 programs moved out of doctor's `names` check, which now covers the linked names alone.
  - **A failure stops the run, the user's rule of 2026-09-21.** `apply-migration.js` runs the same list again before it changes its first path, so the stop holds even where a skill body skipped step 0, and a machine is never left between 2 versions.
  - **The domain-skills clone left the list**, because Flow never calls it: a machine with no clone sets Flow up like every other one. `/flow:setup-machine`'s interview asks for the path instead. Stopping on it would have blocked a fresh machine over an optional add-on.
  - Two facts came off the disk rather than this map: nothing in a hook calls `util`, the callers being `tree-for-structure` and `merge-for-bulk-reads` in the rule file plus `flow get --files`; and the setup guard in `scripts/flow/lib/machine.js` refuses every `flow` command but `install`, `doctor`, `restore` and `uninstall` until `~/.flow/version` exists, which is why the check lives on one of the 4.

## What a machine installs, locked 2026-09-17

**A machine installs the last commit the user tagged, never the tip of `main`.** A tag is a name stuck on one commit, written by `git tag 2026-09-17`, and it never moves afterwards while `main` keeps moving. Without one, installing takes whatever `main` happens to be, including a push made halfway through a change.

- The tag's name is the date of the newest changelog entry, so the tag and `~/.flow/version` are the same string.
- `flow doctor --updates` compares the clone against the newest tag, never against `main`'s tip.
- **The user keeps pushing to `main`.** Branches buy code review and there is nobody here to review. A branch is for a change that leaves `main` unusable for longer than one session, such as replacing the whole workflow.
- The user types the tag command. Flow never runs it.
- **`flow install` builds symlinks and nothing else.** Writing `~/.claude/CLAUDE.md` moves to `/flow:setup-machine`, after the interview that fills `## The user` and `## Preferences`. Two reasons: `install.js:125` asks `fs.existsSync`, and the file on this machine exists at 0 bytes, so install keeps it and the template never lands; and install otherwise writes a rule file before the user has answered a question.

## Domain skills, locked 2026-09-17

**Replaced on 2026-09-23 by `## Skills, sources and the machine's clones`.** Domain skills became the first source, the lists and `--global` became the `skills` setting, and the pull and its 2 guards stay as built.


**The domain-skills clone pulls itself, and one of its skills may be installed globally when it deserves to be.**

- **A record of its own, separate from Flow's.** Flow being behind means running a migration, with a plan, a yes and files rewritten. A domain skill being behind means a `git pull` and nothing else. Two kinds of news, so two records and two printed lines. How often each one changes is not the reason.
- **Auto-update, on by default.** The `SessionStart` hook starts a `git pull` in `lab/domain-skills` detached in the background and returns at once. The skills are symlinks into that clone, so every project linking one is current the instant the pull lands. The hook reads the clone's `FETCH_HEAD` timestamp and pulls only when it is hours old, so nothing new is written to disk while this is on.
- **Two guards, both read before pulling.** Uncommitted changes in the clone, or a pull that would not be a fast-forward. Either one means no pull and one printed line saying why. Without them an automatic pull can wreck work sitting in that clone.
- **The toggle is `"domainSkillsAutoUpdate": false` in `~/.flow/settings.json`.** The key `domainSkills` there is already taken, holding the path to the clone's `skills/` folder. With the toggle off, the hook fetches instead of pulling, writes what is behind into `~/.flow/skills-update.json`, and prints the skill names every session until the user pulls.
- **A skill may go global, decided one skill at a time.** The repository holds tool skills as well as domain skills, and a tool skill belongs on the machine. `flow domain-skills add <name> --global` links into `~/.claude/skills/`, and `~/.flow/domain-skills.txt` lists the names so a second machine gets them back. `flow private-skills` already works this way, with `--global` and a `global.txt` list, and `lib/skill-links.js` already takes the place to link into.
- **The cost is said out loud at add time, never forbidden.** A skill installed globally has its description loaded in every session on the machine, React inside a Python project included. `add --global` says so and links it anyway. Until 2026-09-17 the code refused this outright, for that reason.
- The SSH remote on `domain-skills` is a repo chore rather than skill design. `backlog.md` -> `## V1` -> `### Install and migration` holds it.
- **Built 2026-09-20, both halves.** `scripts/domain-pull.js` is the detached job and `scripts/flow/lib/skills-update.js` holds it: the 2 guards, the pull, the fetch that `"domainSkillsAutoUpdate": false` switches to, and `~/.flow/skills-update.json`, the note the session check prints. The fast-forward guard is `git pull --ff-only` refusing by itself, so there is nothing to compare by hand. Looking costs one fetch every 6 hours, read off the clone's `FETCH_HEAD`, and every session while a note is waiting, which is what makes the line stop once the user has pulled. `flow domain-skills add <name> --global` links into `~/.claude/skills/` and lists the name in `~/.flow/domain-skills.txt`, saying the cost as it goes. 7 tests, 5 of them over 2 real repositories built under `tmp/`.

## A run stops once, at the migration, locked 2026-09-17

**Everything needing a decision goes into one document before anything is touched, and the run never comes back for a second yes.** The management skill writes it to `migration.md`, with every file it writes under `files/` beside it, so the user can open the new files before the yes.

- `migration.md` answers every question as a proposal rather than asking it: each plugin with its verdict, each settings toggle with Flow's choice and the reason, each harvested line with where it lands.
- The user edits the lines they disagree with, then says go. After that the run goes to the end.
- The only thing that stops it part-way is something unexpected, such as a pull that will not fast-forward. Then it stops and `~/.flow/run.json` holds the step it reached. That closes 3.0.

## The competitor test, locked 2026-09-17

**The question is not "does it instruct behavior". It is "does it instruct behavior on ground Flow already rules on".** Corrected by the user 2026-09-17, after the narrower test was proposed.

- **Overlap: it goes.** `superpowers` says to invoke a skill before any response and to brainstorm before creative work. Flow's `## The turn` and `design-in-conversation` rule the same ground, so the two fight and one wins.
- **Behavior with no overlap: it stays.** A skill saying "always run migrations inside a transaction" is behavior, and Flow says nothing about database migrations, so nothing competes.
- **Domain knowledge: it stays**, and moves into the projects needing it.
- **A third outcome beside keep and delete: cannot be removed.** The account-synced tree at `~/.claude/skills/synced/<uuid>_<uuid>/` is pushed from the user's Claude account, so deleting the folder brings it back on the next sync. 9 skills sit there on this machine, 2 of them, `grill-me` and `skill-creator`, on ground Flow rules on. They go into `migration.md` with the overlap named and the decision handed to the user, since the only real switch is in the account.
- **Removing a marketplace plugin is a settings edit.** A plugin is on because `enabledPlugins` in `~/.claude/settings.json` says so, such as `superpowers@claude-plugins-official: true`. The removal sets that entry to `false` and needs a restart. There is no folder to delete, and `migration.md` shows it as the key edit it is.
- **Skills reach a machine by 4 routes, and the survey reads all 4**: a plain folder in `~/.claude/skills/`, the synced tree under it, `enabledPlugins` in `~/.claude/settings.json`, and `~/.claude/plugins/installed_plugins.json`.
- **How the overlap is found.** The skill reads the candidate's instructions and the rule headings in `home/AGENTS.md`, then writes each collision into `migration.md` with both texts side by side. The user overrules any of them by editing the line. That closes 3.1.

## Harvesting an existing setup, locked 2026-09-17

**A line is dropped only when the migration can name the Flow rule replacing it.** `migration.md` shows it as a pair, `dropped: "always show a diff before editing" -> replaced by ## The turn`. A line with no named replacement is never dropped.

- The trap this closes, named by the user 2026-09-17: most of what a user wrote before Flow existed was a workaround for not having Flow, and harvesting it would carry the problem across. The named-replacement check catches exactly that, without letting the agent throw away what it merely failed to understand.
- **Three buckets, not two.** Replaced by a Flow rule, so named in the migration and dropped. A fact about the user or the project, so it becomes `## The user` and `## Preferences` on the machine, or a document inside the project. Everything else stays where it is.
- **The auto-memory files live on the machine, not in the projects.** Claude Code writes them to `~/.claude/projects/<project>/memory/`, keyed by project path, so setup reads them all without opening a single project. Checked 2026-09-17: 5 such folders out of 13 project folders here, 212 KB in all. Each file carries `name` and `description` frontmatter, so the agent sorts them without reading the bodies. `user_background.md` and the user lines of `MEMORY.md` become `## The user` and `## Preferences`; `project_*.md` waits for its own project's run, and `apply-migration.js` copies the folders before anything goes. One found here was `feedback_naming_kind_vs_type.md`, holding the `type` over `kind` rule the user has been enforcing by hand.
- **A run may delete what it harvested**, reversed 2026-09-18 from "nothing is deleted at harvest". `apply-migration.js` copies each file before it goes, so `flow snapshot restore <id>` puts back a file the user decides was harvested wrongly. That closes 3.2.

## What setup does to settings.json and to a project, locked 2026-09-17

**`~/.claude/settings.json` splits into 3 groups, and Flow's template carries 12 keys.**

- `hooks` replaces wholesale, because Flow's 11 hooks are the workflow itself.
- `permissions` merges, and every rule that conflicts is asked once in `migration.md`.
- **A key Flow's template does not carry is left exactly as it is**, and never appears in `migration.md`. This machine holds 12 of them on 2026-09-17, among them `model`, `statusLine`, `theme`, `voice` and `effortLevel`. Asking about them would mean asking the user about their own theme.
- The 7 opinion keys are each shown with Flow's choice and the reason: `disableBundledSkills`, `disableWorkflows`, `disableRemoteControl`, `disableClaudeAiConnectors`, `disableArtifact`, `autoMemoryEnabled`, `respondToBashCommands`. That closes 3.3.

**Setting up a project is its own skill, `/flow:setup-project`, run the first time the user opens that project.** Split from machine setup 2026-09-18, under `## Setup and migration are two flows`. Setup only ever sees `~/.claude/CLAUDE.md`, because a project's own `CLAUDE.md` lives inside the project, so nothing is gathered ahead of time.

- It builds `.flow/` from the template, writes `.claude/settings.json`, links the domain skills named in `.flow/domain-skills.txt`, and stamps `.flow/version`. An empty new project gets `project-template/` and nothing more.
- **It reads the whole project, not only `CLAUDE.md`**, widened by the user 2026-09-18: `AGENTS.md`, `.claude/`, `.agents/`, `.codex/`, `docs/` and the project's memory folder, sorted by the same 3 buckets into the project's context files, tickets and state. Delapse is the test case, with 182 files under `docs/` and 44 under `.agents/`. What it reads and in what order is its own design pass.
- It is a run like any other: a migration, then `apply-migration.js`. Its migration is also its snapshot's list. That closes 3.4.

## The 2 personalised files, locked 2026-09-17

**Two sections, not one, and an interview that asks only what the harvest left blank.**

- **Why two.** `home/AGENTS.md` already routes a new fact to one or the other: how the user wants to work goes to `## Preferences`, what they know or do not goes to `## The user`. One merged section leaves the agent picking a spot in a blob, and two named sections give it an address. That closes 4.1.
- **When the interview runs.** During setup, after the harvest, before the file is written, with its answers landing in `migration.md` like every other decision. On a machine with an existing rule file it is short, because the harvest already answered most of it. On a bare machine it is the only source.
- **What it asks**: what the user builds, which languages and tools, what they know well and what they do not, how long they want answers, whether terms get defined, how they work. The question list is its own design pass when the skill gets built. That closes 4.2.

## The interview is one open question, locked 2026-09-21

**`/flow:setup-machine` asks the user one question of its own, and everything else it needs is read off the disk or decided by a form.** **Cut to no question later the same day**, under `## Setup asks no question, ruled 2026-09-21` below. Set by the user 2026-09-21, cutting a proposal of 3 blocks down to this. The reason is that `## The user` is 3 lines long, so an interview sized to fill it is 1 question, not 10.

- **The order the user sees**: `flow doctor --prereq`, the survey, the competitor test, the harvest, then the interview, then `migration.md` and one yes, then the writing. The questions sit in the middle, and nothing on disk changes until the yes.
- **`## The user` is one open question**, `what are you fluent in, and what do you have no background in`, with the harvest's draft already in it to be corrected rather than written. Four closed questions were rejected: the user answers by voice, and one free answer is faster than four prompts. `what do you build` was cut later the same day, under the next bullet.
- **`## The user` holds what the user knows, never what they work on.** Ruled by the user 2026-09-21, after a sample draft opened on `Solo developer building a Claude Code workflow in Node`. The file is global, so what the user works on is a fact about one project and lives in that project's files. Nothing every Flow user shares goes in either: `solo developer` is true of all of them. `home/AGENTS.md` breaks the rule twice, in the line `Solo developer: one author, one branch context.` and in the example comment's `Solo web dev.`
- **`## Preferences` leaves the interview entirely and starts empty.** It fills from the harvest alone, and only where the harvest turned up real preference material. The user's reason on 2026-09-21, sharpening `## Harvesting an existing setup`: a line in a rule file written before Flow existed is usually a workaround for not having Flow, so surviving the named-replacement check is not enough. **The second test is whether the user would still want the line if Flow had been there from the start.** `always show me a diff before you edit` fails it and `never use em dashes` passes it. What fills the section properly is `## Capture` during ordinary work, which is its own backlog line.
- **A project's memory files are not opened at machine setup.** Ruled by the user 2026-09-21 on cost: the folders are large on a machine that uses the feature, `/flow:setup-project` opens the same files again for its own run, and `## The user` needs 3 lines out of all of it. Setup reads the `name` and `description` frontmatter, which is what sorts them, then lists what it found with sizes and asks which to open. The default is none. **The list goes in the interview message, beside the question, never in `migration.md`**, agreed 2026-09-21: a file opened after the yes would feed the rule file with text the user never saw.
- **The domain-skills clone is not asked for.** Ruled by the user 2026-09-21: the clone matters in project work, not on a fresh machine, and theirs is near empty. `/flow:setup-project` asks for it the first time a project wants a skill from it. The one case machine setup still needs it is a second machine where `~/.flow/domain-skills.txt` arrived through sync carrying names, because the relink cannot run without the path, and that is read off the file rather than asked.
- **The 7 opinion keys are a form in `migration.md`, not 7 questions.** Ruled by the user 2026-09-21, who called answering them one at a time inconvenient and named the migration file as the place to put the form. Each key is one checkbox carrying what the key does, Flow's choice and the reason. Checked applies Flow's choice, unchecked leaves the machine's value alone. The skill opens the file, the user toggles and saves, and the file wins over anything said in chat.
  - **It uses no new mechanism.** `migration.md` is already the one file the user reads and the one yes that runs the whole migration, so the form is that file growing checkboxes. Every other yes-or-no in it takes the same shape, each harvested line the migration would drop among them. The memory files sat on this list until later the same day, when they moved to the interview message.
  - **`AskUserQuestion` was considered and lost.** It takes a `multiSelect` flag, so 7 toggles in one dialog is buildable, and `home/settings.json` denies the tool by bare name, which keeps its schema out of every request. Turning it back on to save one pass of a file once per machine trades a permanent context cost for a one-time convenience. `docs/manual/settings.md` also gives the reason it was denied: Flow's shape is the agent recommending and the user reacting, which is what the form already is.
  - **The skill carries the ticks into the files, after the yes and before `apply-migration.js` runs.** Taken by the user 2026-09-21 on the recommendation. `scripts/flow/lib/migrations.js` reads only lines opening on `- write`, `- delete`, `- move` or `- run`, so a tick is text to it. An unticked line changes what sits inside `~/.claude/settings.json` or `~/.agents/AGENTS.md`, or takes out the `delete` line of a skill folder the user kept. So the skill rewrites those 2 under `files/` and drops the `delete` line of anything unticked, then runs the script, which changes only the paths listed when it starts. The script's refusals read the real files and never `files/`, so the rewrite trips none of them.
  - **The file reads as a form, ruled by the user 2026-09-21**: short lines, nothing explained beyond what a line needs, never documentation with a checklist in it. The shape is still open.

## Setup asks no question, ruled 2026-09-21

**2 parts replaced on 2026-09-23 by `## Skills, sources and the machine's clones`:** the clone arriving when a name needs it (now `flow install` clones), and the shape of `migration.md` (now `### The whole form, as approved`). The rest stands.


**`/flow:setup-machine` asks the user nothing, and `migration.md` is the only thing they touch.** Ruled by the user 2026-09-21, cutting the one open question above: `## The user` is a section filled over time, so asking for it at setup is unnecessary.

- **`## The user` and `## Preferences` are optional fields in `migration.md`.** Each holds what the harvest found, often nothing, and the user may write in either. Both fill during ordinary work through `## Capture` in the rule file.
- **`## The user` never holds a skill level.** Not `expert`, not `fluent`: someone who codes through an agent has long since forgotten syntax they once knew, so a level goes stale and makes the agent skip explanations. Ruled by the user 2026-09-21.
- **`## The user` never holds what the user does not know.** The agent assumes no background anyway, and `define-from-zero` already explains every term. Ruled by the user 2026-09-21.
- **The domain-skills clone arrives when a name needs it**, agreed 2026-09-21, so no setup ever asks where it is. One function, called by `scripts/domain-pull.js` when a session opens and by `flow domain-skills add`, reads the names in `~/.flow/domain-skills.txt` and the open project's `.flow/domain-skills.txt`. No names: nothing happens. Names and no clone: it clones `https://github.com/Adrian333Dev/domain-skills`, the address `flow contribute` already uses, into `~/.flow/domain-skills/`, then links every name. A clone present: the update runs as it does now.
  - **`~/.flow/domain-skills/` is used whenever `domainSkills` is unset**, so Flow writes only inside its own folder. The folder joins the ignore list in `scripts/flow/lib/flow-repo.js`, so `flow sync` never carries it. A user who wants the clone where they edit it clones it there and sets `domainSkills`, and the function then finds a clone and never makes one.
  - **2 machines drifting apart with `"domainSkillsAutoUpdate": false` needs nothing built.** Each machine compares its clone against the same GitHub copy, and the one behind prints `<clone> is behind. 2 domain skills changed: web-pages, excalidraw.` at every session until the user updates it. The one case it misses is commits made in one clone and never pushed, which `flow contribute` is how they leave.
- **Machine setup reads machine-wide context only**, agreed 2026-09-21. It opens no project's memory files: their one use here was `## The user`, which now fills during work, and `/flow:setup-project` reads a project's memory for that project. A project's `.claude/settings.local.json` belongs to that skill too, ruled by the user 2026-09-22. Claude Code keeps no such file at the machine level.
- **What setup finds is context of any type, never assumed to be a rule file.** Ruled by the user 2026-09-21: a line in a file, a skill, a plugin or a permission rule all count, and a machine may hold none of them. The places to look come from `references/harnesses/claude-code.md`. A machine with nothing on it gets no such section in the form.
- **`migration.md` is split by what happens to each thing**, ruled by the user 2026-09-22 after 2 drafts. The first put 8 ticked boxes under `## Turn off`, which a user reads as switching them on. The second made a tick mean "stays", which showed every Flow proposal as an empty box. The shape now:
  - **`## Marked for removal`**: every box starts ticked, and a tick means it goes. Its first line says so: `Ticked items are removed. Untick anything you want to keep.` 2 groups under it, `### Claude Code features` for the 7 opinion keys and `### From your current setup` for what the competitor test and the harvest found.
  - **`## Only you can remove these`**: the account-synced skills, plain lines with no box, each naming where the switch is.
  - **`## The user (optional)` and `## Preferences (optional)`**: text the user may write in, holding what the harvest found.
  - **`## Every file this changes`**: every path the run writes, deletes, moves or runs a command over, `~/.flow/version` included, and one line saying `~/.flow/originals/machine/` keeps a copy of each. Ruled by the user 2026-09-22, after an example listed 3.
  - **Every label is plain words for someone who never read the docs**, ruled 2026-09-21: `Artifacts` and `Claude's reply after a ! command` were named as meaningless. `Artifacts: Claude publishes what it made as a private web page on claude.ai` is the level. No line carries a reason, except the Flow rule that replaces a removed line.
- **2 edits to `home/AGENTS.md` follow, agreed 2026-09-21 and not built.** `## The user` becomes an empty section, losing `Solo developer: one author, one branch context.` and the example comment, because any example sets a format and what goes there is whatever `## Capture` writes. The `## Capture` line becomes: `How the user wants to work → ~/.agents/AGENTS.md#preferences. A fact about the user → #the-user, never a skill level and never what they don't know. Both inferred from evidence, never announced: the same correction twice, irritation at a habit, something they said about themselves.`

## The 2 personal sections stay inline, locked 2026-09-17

**`## The user` and `## Preferences` live inside `~/.claude/CLAUDE.md` itself, as they do today, and a migration carves them out by heading and pastes them back.** Set by the user 2026-09-17, against a proposal to move them into `~/.flow/profile.md` and import that file.

- **Why the separate file lost.** Capture writes a new fact into the profile during ordinary sessions. Claude Code imports, so it would see the change at once. Codex has no import, so `~/.codex/AGENTS.md` is a generated copy and would need rebuilding after every capture. A design needing a rebuild after every write is worse than the carve it replaces.
- **The carve is not dangerous.** The 2 sections are named headings, so taking each from its heading to the next `##` is deterministic, and the snapshot holds the original file anyway. Calling it the one destructive step in the migration was an overstatement.
- **`install.js:125` still has to be fixed.** It leaves an existing `~/.claude/CLAUDE.md` untouched rather than rewriting it around the 2 sections, so no migration can ship a new template until it changes.
- **Flow proposes every change to the 2 sections and never edits them silently.** Step 3 of a migration compares them against what the changelog entries removed. A line naming a removed feature becomes a line in `migration.md`, such as `stale: "always run the scorecard before closing" -> the scorecard was removed on 2026-08-14`, with a replacement proposed. Raised by the user 2026-09-17.
- **Open, and deferred to the Codex work.** Two harnesses means 2 inline copies, and a capture in one does not reach the other. Nothing is built for it while Claude Code is the only harness. `backlog.md` -> **Flow on another harness and on another model** carries it.

That closes 4.0.

## The answer job, locked 2026-09-17

**An answer is one line plus an address, and the skill finds the address in a generated index.**

- **The index already exists and is written by hand.** `docs/manual/README.md`, 30 lines, carries one line per page saying what is on it. The skill reads that, picks the page, then reads the page. A `flow docs index` command that generated one was rejected by the user 2026-09-17: a stale index is a wrong page title for a day, not an emergency, and a command earns nothing against that. That closes 5.0.
- **The rule that keeps it current goes in the docs-writing guidance.** Adding, renaming or dropping a page updates `docs/manual/README.md` in the same edit. `docs/dev/layout.md` line 65 already says each folder's README indexes its own pages.
- **The manual is not finished.** Pages may be rewritten, added or dropped, and the same holds for `docs/dev/`. A hand-written index costs one line per change, which is why the churn is affordable.
- **`flow install` links `~/.flow/docs` to the clone's `docs/`**, so the skill names the manual by a fixed path. Today it is reachable only as `~/.flow/scripts/../docs/`.
- **What an answer is.** One line saying the thing, then the page and the heading, such as `docs/manual/settings.md` -> `## Hooks`. More than one line only where the page does not answer it, and then the extra is a short walk of the case rather than a paraphrase. That closes 5.1.
- **"What do I do now" is state, not documentation.** The skill reads `~/.flow/run.json`, then the board, then `.flow/handoff.md`. A half-finished run is the answer whenever one exists. Otherwise one line, then `/flow:start`, which already renders the full picture from `skills/tools/start/SKILL.md`. The answer job never rebuilds `/flow:start`. That closes 5.2.
- Measured 2026-09-17: 8 pages under `docs/manual/`, 1,493 lines in all, `reference.md` 498 of them.

## Name, group and entry points, locked 2026-09-17

**The management skill is 4 skills, filed in `skills/tools/`, every one of them typed by the user.** 3 until 2026-09-18, when project setup split from machine setup.

- **`/flow:setup-machine`** puts Flow on a machine that never had it, or has somebody else's setup on it. Branch 3 is its body. Named `/flow:setup` until 2026-09-18.
- **`/flow:setup-project`** brings one project into Flow, the first time the user opens it: it reads the whole project and writes its context files, tickets and state. `## What setup does to settings.json and to a project` holds it. It became the command `flow setup project` 2026-09-25, under `## Project setup is a command`.
- **`/flow:migrate`** moves the machine forward, then a project, when Flow itself changed. Branch 0 is its body.
- **`/flow:help`** answers a question about Flow out of the manual, and answers "what do I do now". Branch 5 is its body.
- **Prerequisites is not a skill.** It was `references/prerequisites.md`, read by both setup skills and `/flow:migrate` as step 0, because 6.0 said it runs before any job and never on its own. **Replaced 2026-09-21 by `flow doctor --prereq`**, one command with an exit code: see `## Prerequisites are checked by running them`.

**One skill could not hold all 4 jobs.** A skill has one description and one `disable-model-invocation` line, and the jobs want different answers to both.

### The group is `tools/`

Said by the user 2026-09-17. `skills/dev/` holds what a maintainer runs, and both skills in it could be dropped later; these 3 ship forever and every user runs them. `skills/tools/` is "what you reach for around the work" in `docs/dev/skills.md`, which is what setting Flow up and moving it forward are. Nothing outside `skills/` reads a group name, so the filing is a `mv` away from changing.

### The `flow:` prefix, verified by probe 2026-09-17

**A plain skill can carry a colon in its name, with no plugin involved.** `/superpowers:brainstorming` reads that way because superpowers is a plugin, and the docs only ever describe the namespace as a plugin's. The probe found the colon is nothing but a character in the folder name.

- Built under `tmp/try/home/skills/` by `lab/scripts/try.sh`: one folder named `flow:probe-b`, one named `probe-a` carrying `name: flow:probe-a` in its frontmatter.
- The session listed `flow:probe-b` and `probe-a`. **The folder name is the command name**, and the frontmatter `name` did not override it.
- `/flow:probe-b` typed into `claude --print` ran the skill. Asked in words for "the skill that prints bravo", the model invoked `flow:probe-b` by itself. Both ways work.
- The one cost is native Windows, where a colon is illegal in a filename, so the clone would not check out. Windows outside WSL is already excluded under `## Which operating systems`, and the item to lift it sits in `backlog.md` -> `## After V1`.
- Undocumented behavior, so `flow doctor`'s existing check that every skill name resolves is what catches a version that takes it away.

### All 4 are typed, never model-invoked

`disable-model-invocation: true` on all 4. A model that decides by itself to snapshot the machine and rewrite `~/.claude/CLAUDE.md` is the worst thing this design can do, and the same line on `/flow:help` keeps the set consistent.

That line also takes a skill's description out of the session's context, so nothing shows the model the skill exists. Three things name them instead:

- The `SessionStart` hook from 7.2, printing `Flow is behind: /flow:migrate` when `~/.flow/version` is older than the newest changelog entry.
- `flow doctor`, whose note says the same when the user runs it.
- `user-only-skills` in `home/AGENTS.md` under `## Workflow`, beside `invoke-the-skill`, listing the user-only skills and saying to suggest them to the user.

### Setup opens in a terminal, not a session

`/flow:setup-machine` cannot be typed on a machine that never had Flow, because a skill becomes typeable only once `flow install` links it into `~/.claude/skills/`. So the first step is a shell command: clone, then `node <clone>/scripts/flow/flow.js install`. Its closing message, `scripts/flow/commands/install.js:136-141`, today tells the user to merge `home/settings.json` by hand; it becomes "restart Claude Code and type `/flow:setup-machine`", and the skill does that merge key by key under 3.3.

**That first install snapshots itself.** When `~/.flow/snapshots/` is empty, `flow install` writes the manifest of what it is about to create before creating it, so `flow snapshot restore` reaches the bootstrap links too.

### A user-only skill is marked `(user only)` once

Prose is the only place the model meets a user-only skill, and a bare name read first looks like something it can run. The mark goes once, where the agent reads it before any bare mention, and every other mention stays bare. `user-only-skills` in `home/AGENTS.md` is that place for the skills it lists, since every session loads it. A skill later dropped from that list gets the mark where the agent first meets it. Set by the user 2026-09-18, replacing the mark in every file set the day before, and the word `(user invoked)` with it.

The fault it fixed: `skills/phases/groundwork/references/write-spec.md` told the agent to invoke `/flow:tickets-from-spec`, which the agent cannot do. Today's set is `/flow:start`, `/flow:tickets-from-spec` and `/flow:apply-domain-findings`, and the 4 new skills join it.

## When a migration changes the management skill itself, locked 2026-09-17

**The old version of the skill applies the migration, and the new version takes effect from the next session.** The skill is a folder in `skills/`, symlinked into `~/.claude/skills/`, so a pull puts the new `SKILL.md` on disk at once. The running session keeps the text it loaded when it was invoked, which is what makes this safe rather than confusing.

- The stamp keeps it honest. Step 6 writes the newest changelog entry's date into `~/.flow/version`, so nothing is left looking applied that was not.
- **One case needs more.** A changelog entry whose migration the old steps cannot carry out says so in the entry. Step 2 reads that, the run stops after `flow install`, and the user is told to open a new session and run it again. `~/.flow/run.json` holds the step reached, so the second session carries on instead of starting over.
- Raised by the user 2026-09-17. That closes 0.10.

## A whole-workflow replacement, locked 2026-09-17

**A replacement is not a second procedure. It is a migration carrying many entries, run by the same 6 steps, and what makes it safe is that step 5 writes Flow's own files whole instead of patching lines.**

The case, in the user's words on 2026-09-08: a migration can be as large as replacing the whole workflow, and hooks are the common case, because the mechanism behind them changes and hooks get added, removed or rewritten. What it looks like on disk: the rule file restructured, every hook rewired, skills renamed, a folder in every project renamed. The `flow:` prefix sweep is one, and so is `references/style.md` splitting into three files.

### No size threshold, and no second mode

Every migration already shows its `migration.md` and runs on one yes. A replacement mode would make the agent judge which migration is large enough to deserve it, and the judgment buys nothing, because the steps do not change. `## Setup and migration are two flows` already refused a threshold for the same reason.

### Step 5 writes whole files, at every size

- **`~/.agents/AGENTS.md`**: `files/` gets `home/AGENTS.md` whole, with `## The user` and `## Preferences` copied in from the live file, and `apply-migration.js` puts it in place. Never a line-by-line patch, however small the change. The live file is Flow's file, so the template is the truth for everything outside those 2 sections.
- **`~/.claude/settings.json`**: `hooks` replaced whole from the template, `permissions` merged, an opinion key asked only where the template's value changed. Set under `## What setup does to settings.json and to a project`.
- **The links**: `flow install`. `pruneDead` at `scripts/flow/lib/links.js:43` already deletes a link that points into the clone at something gone, so a renamed skill's old link goes by itself.
- **Whatever the entry names**, such as a command that rewrites every ticket's frontmatter. Nothing else in the run can know about it, which is what the changelog entry is for.

Writing whole is also what makes a re-run harmless: the second run writes the same bytes.

### The one thing a whole write can destroy

A line the user added to `~/.claude/CLAUDE.md` by hand, outside the 2 personal sections. Step 3's diff against the template is what finds it, and it goes into `migration.md` on its own line: `yours, not in the template: "<line>" -> keep or drop`. Keep means the agent carries it into the new file under `files/`, beside the 2 sections.

### A migration is one line per file, not one per entry

A machine 3 months behind carries 40 entries, and 20 of them touching hooks are still one line in `migration.md`: hooks replaced. The entries are the input to step 2; the migration is the output of step 4, and its unit is the file.

### The session that applied it is stale

Rules load when a session launches, so after step 5 the session doing the work still holds the old `~/.claude/CLAUDE.md` in context. The skill says so in its last line and takes no further judgment call from rules it knows are gone. Step 6's proof runs `claude --print`, a new process that loads the new file, which is why proof is a second session rather than a claim this one makes.

### A stale name in `~/.local/bin`, found 2026-09-17

`flow install` prunes `~/.claude/skills`, `agents` and `rules`, and never `~/.local/bin`. The `BIN` map at `scripts/flow/commands/install.js:48` names `flow` and `fw`. Take a name out of that map and its symlink stays on the machine, pointing at a file that still exists, so nothing dangles and nothing detects it: the user keeps typing a command Flow no longer ships. `checkNames` at `doctor.js:138` only checks that the names Flow does ship resolve. The fix is a prune of any link in `~/.local/bin` pointing into the clone whose name Flow no longer ships, and it sits in `backlog.md` -> `## V1` -> `### Install and migration`.

### A clone older than the machine

`~/.flow/version` newer than the newest changelog entry means the clone was moved back, by a checkout or a bad pull. `flow doctor` calls that a problem and exits non-zero, rather than a note. No migration ever runs backwards: the way out is `flow snapshot restore <id>`, or moving the clone forward again.

## The original replaces the snapshot, locked 2026-09-20

**An original is every path as it was before Flow first touched it, kept in one folder per place.** A place is the machine, or one project. It replaces the whole snapshot system above: the copy a run took, the undo copy a restore took, and the folder per migration all go.

```text
~/.flow/originals/machine/
├─ manifest.json   one entry per path, and whether the window is still open
└─ files/          what each path held before, at files/<full path>
```

- **The folder's name is the place**, so nothing reads a date and there is no id to look up. A project's folder is named the way Claude Code names its own, every character that is not a letter or a digit turned into `-`.
- **It is written in one window and never added to.** `flow install` opens the machine's and records every path it is about to create. The first `/flow:setup-machine` adds each path its migration changes, then closes the window for good. A project's window opens and closes inside its first `/flow:setup-project`.
- **A second `flow install` adds nothing.** `~/.flow/scripts` existing is the tell that Flow was here before, and recording Flow's own links would make Flow the state to go back to.
- **A path that was not there is recorded `absent`**, at its highest missing folder, so a restore deletes the folders Flow made.
- **Nothing under `~/.flow/` is ever recorded**, so putting the machine's original back leaves the user's notes, tickets, study cases and wiki where they are.
- **The original survives a restore**, so the same command runs twice and lands in the same state. The snapshot design had a restore copy everything first, which made an undo of an undo.
- **Undoing one migration is parked.** The user ruled on 2026-09-20 that the original matters for the first week or two, while putting the machine back is still worth doing, and that nothing else earns a copy per run. `backlog.md` holds the parked pieces: per-migration snapshots, the undo copy, `flow snapshot new`, `flow snapshot drop`, hard links and chained restores.
- **Built 2026-09-20**: `scripts/flow/lib/originals.js` and `scripts/flow/commands/restore.js` replace `lib/snapshots.js` and `commands/snapshot.js`, giving `flow restore ls`, `flow restore machine` and `flow restore project`, tested in `scripts/tests/restore.test.js`. `apply-migration.js` records into the open window instead of snapshotting, closes it when the migration's `type` is a setup, and keeps how far it got in `applied.json` beside `migration.md`.

### `flow uninstall`, the command Flow never had

One command puts every project's original back, then the machine's, then deletes `~/.flow/` and the clone. It does all of it itself, because restoring the machine deletes `~/.local/bin/flow` and a second command would have nothing left to type. The projects come out of the originals, each manifest holding its project's path.

```text
$ flow uninstall
Restores delapse, backmark and this machine, then deletes ~/.flow/ and ~/code/flow.
Type uninstall to go on:
```

- **The message carries instructions and no explanation**, the user's call 2026-09-20.
- **The clone is kept where git says it holds work.** A file changed and not committed, or a commit no remote has, and the path is printed instead of deleted. Both checks are reads. Deleting a clone with a day's work in it is data loss, not an uninstall.
- **A machine with no original is still covered.** `scripts/flow/lib/installed.js` is the one list of what Flow puts on a machine, read by `flow install` to write the original and by `flow uninstall` to strip a machine that has none. Flow's hooks come out of `~/.claude/settings.json`, and the import line out of `~/.claude/CLAUDE.md`. A hook is Flow's when its command names a path inside `~/.flow/`. The permission rules are left, because nothing can tell a rule the user wrote from one that was merged in.
- **A rooted uninstall never deletes the clone.** `--root` builds a scratch machine under `tmp/`, and that machine does not own the clone it was built from.

### 4 locks keep restore and uninstall away from the agent

Both commands undo the machine, so the agent may never run either.

1. **Every session closed.** `confirm.noSessions()` refuses while any `claude` or `codex` process runs. The agent only exists inside one, so this lock alone stops it.
2. **A word typed at `/dev/tty`.** Opening that device from a command the agent ran fails with `No such device or address`, tested 2026-09-20.
3. **No flag skips the prompt**, so a pasted line and shell history cannot answer it.
4. **`deny` rules in `home/settings.json`** for `flow restore machine`, `flow restore project` and `flow uninstall`, under both typed names and the `node ~/.flow/scripts/flow/flow.js` path form. `flow restore ls` stays allowed, since it only prints. `apply-migration.js` is not denied, because `/flow:migrate` has to run it.

### A skipped setup is caught by code, never by a hook

`flow install` finishes half a machine, so a user who never types `/flow:setup-machine` has a machine where Flow's rules load nowhere. 2 refusals catch that, both in code that runs anyway.

- **`machine.requireSetup(root)`** refuses every `flow` command where `~/.flow/version` is missing, except the 4 marked `anywhere: true`: `install`, `doctor`, `restore` and `uninstall`. `lib/cli.js` runs it between the flags and the action.
- **`inFlow()` in `scripts/flow/lib/root.js`** refuses any project with no `.flow/`.
- **`scripts/check-ticket.js` runs both** before its ticket check, and blocks the expansion with whichever fired.
- **No hook can do this job.** Flow's hooks reach `~/.claude/settings.json` only when `/flow:setup-machine` merges them, so the machine that skipped setup has no hook to fire. `SessionStart` cannot block at all, and `UserPromptSubmit` exit 2 erases what the user typed.

### One private repository carries a machine's Flow to the next machine

`~/.flow/` is itself a git repository on GitHub, and that is the whole of how a second machine gets the user's rules, notes, study cases and wiki. `flow sync` brings the other machine's work down, then sends this one up.

- **Down first.** A pull that is not a fast-forward stops everything, and a commit made here first would only add a merge to clean up.
- **One repository for everything, never one per folder**, the user's call 2026-09-20, and it sends nothing up when nothing changed.
- **Syncing covers `~/.flow/` and never a project**, the user's call 2026-09-20.
- **7 things never travel**, and `~/.flow/.gitignore` names them: `version`, `run.json`, `originals/`, `settings.local.json`, the `scripts` and `references` links, and each wiki tool's `downloads/`. The 2 links were added on 2026-09-20: both point into this machine's clone, which sits somewhere else on the other machine.
- **A setting holding a path lives in `settings.local.json`**, which stays on the machine. `lib/settings.js` reads the pair as one file, the local one winning key by key, and `globalKey()` says which of the 2 holds a setting for a message that has to name a file. `domainSkills` and `clone` are the 2 paths there today.
- **Uncommitted work travels by `util git work`, on the user's own command.** The agent never runs it, ruled 2026-09-20. Its rename to `util git uncommitted` and the `get <machine> --branch` fix are in `lab/util/backlog.md`.
- **Built 2026-09-20**: `scripts/flow/lib/flow-repo.js` and `scripts/flow/commands/sync.js`, tested in `scripts/tests/sync.test.js` against a local folder. The round trip through a real GitHub remote is proved by nothing yet, and `backlog.md` carries that gap.

### `flow install` asks 2 questions, and only at a terminal

`confirm.hasTerminal()` decides. With nobody at the keyboard the install asks neither and says so in its output, because Enter on the second question makes a repository on GitHub and no default nobody typed may do that.

1. **A name for this machine**, saved as git's `util.machine`, where `util` already reads it. The default is the computer's name and 4 random letters, since WSL calls every machine `me` and 2 machines sharing a name overwrite each other's stored work.
2. **The private GitHub repository for `~/.flow/`.** Enter makes one with `gh`, an address uses one that exists, `skip` leaves the machine alone. Neither answer can fail the install: every link is made before the questions run, so a `gh` that is not logged in is a line in the output.

### `flow install` is half a machine, and names the other half

- **It writes no rule file.** `~/.agents/AGENTS.md`, the import line in `~/.claude/CLAUDE.md` and the link `~/.codex/AGENTS.md` all belong to `/flow:setup-machine` now, since a copy made before that skill's interview holds nothing of the user.
- **Its closing line is "restart Claude Code, then type /flow:setup-machine"**, in place of the hand merge of `home/settings.json` it used to print.
- **It prunes a name that left the `BIN` map.** `pruneUnlisted()` in `lib/links.js` drops a link into the clone's `scripts/` whose name Flow no longer ships. The dead-link check could never catch one: the old name still resolves and still runs.
- **`~/.flow/docs` was dropped**, reversing the line that added it. The clone's path goes in `~/.flow/settings.local.json` under `clone`, and `/flow:help` reads `<clone>/docs/manual/README.md` through it.
- **`flow doctor` gained 2 checks**: whether the machine has an original and whether its window is still open, and which names in a project's `domain-skills.txt` and `private-skills.txt` have no link in `.claude/skills/`. Both print notes rather than problems, and its messages for the rule file, the import line, the Codex link and `settings.json` now name `/flow:setup-machine`.

## The changelog comes back, and the version is an entry's number, locked 2026-09-20

**`CHANGELOG.md` exists again, holding entry `1` and nothing else.** It was suspended on 2026-08-09 because a file of entries nobody reads is churn. What brings it back is the migration design: a machine records the last entry it applied, and a migration is every entry above that one. Nothing below `## The version` in the build order can be built against a file that does not exist.

- **The second entry waits for the first machine.** An entry has one reader, a machine that already has Flow and has fallen behind, and no machine has Flow. Entries start the day `/flow:setup-machine` runs here, inside the management skill's own build, and from then on every change of behavior gets one.
- **Nothing is backfilled.** Setup installs the state of the day it runs rather than replaying the road to it, so the months of rule changes behind entry `1` need no entries at all. That history is in git and in `lab/context/`.
- **An entry is numbered, and the number is the version**: `## 2, 2026-11-02`, counting up from 1, newest first. `~/.flow/version` holds `2`. The date stays in the heading, for a user reading how old their machine is.
- **The counter is what the date-only line could not do.** `## The version` above ruled a date over a commit hash on 2026-09-16 and named the case that would overturn it: 2 entries on one day. A machine stamps the date, then reads entries newer than it, so the second entry of a day is never seen. A number cannot tie.
- **A version like `1.4.2` was rejected, the user's question of 2026-09-20.** That shape tells a stranger whether an upgrade is safe to take without looking. Flow is a clone the user pulls, with no registry, nobody pinning a range, and a migration shown whole before it runs. It would also make the agent rule on every change whether it is major, minor or a patch, and that judgment buys nothing here.
- **The git tag a machine installs from is named for the entry**, `v12`, so the clone's newest tag and the changelog's newest entry are the same fact.

### The entry stays short, and an upgrade guide holds the detail

**An entry is 1 or 2 sentences, for a user reading what changed. The guide beside it, `upgrades/12.md`, is what `/flow:migrate` reads, and it holds every path that moves.** The user ruled this on 2026-09-20, against a first proposal that left the agent to work the change out from step 3's diff. Deriving it is the failure: a diff shows text that differs, never which half is Flow's change and which is the user's own line.

- **The guides live in the clone**, at `upgrades/<number>.md`, beside `CHANGELOG.md`. `/flow:migrate` finds the clone through `clone` in `~/.flow/settings.local.json`. Not `~/.flow/`, which holds what a machine saved rather than what it pulled. Not `references/` either, which `~/.flow/references` links to, giving one file 2 addresses.
- **One guide per step, named for the entry alone.** `12.md` is the step from 11 to 12. A machine at 8 reads `9.md` through `12.md` in order and writes one `migration.md` from the 4. A file per pair of versions grows by the square, and `8-to-12.md` would have to be written by somebody who already knew a machine would sit at 8.
- **A guide names the state each path ends in, never a patch.** That is what makes a long gap work: where 2 guides name one path, the later one is the answer. Patches applied in sequence break on any line that moved in between them.
- **This adds to step 2 of `## The 6 steps of a migration`**: the entries above the machine's number, and the guide each one names. Step 3's 3 diffs still run, and they answer a different question. The guide says what Flow changed. The diff says what the user changed by hand, which no guide can know.
- **6 fixed headings**, written out in `upgrades/README.md`: what changed and why, how to migrate, every path and the state it ends in, what may be the user's own, can the old skill run it, proof. `How to migrate` is the user's ask of 2026-09-20, and the first proposal had no room for it: a change that is more than a replacement needs its method written down.
- **`Can the old skill run it` closes 0.10.** `## When a migration changes the management skill itself` needed an entry able to say the old steps cannot carry it out, and it is a heading on every guide now. The run stops at that guide, stamps its number into `~/.flow/version`, and the next session picks up the rest.

## One file per harness, built 2026-09-21

**Where a harness keeps its own files is one file in `references/harnesses/`**, `claude-code.md` being the first. The 3 setup and migration skills read every file in that folder, so a second harness is a file written there and no skill edited. This is the first line of `backlog.md` → `### The management skill, in build order`, and the 3 skill lines under it now name the folder.

- **Claude Code's own paths, never Flow's.** What Flow puts on a machine is `scripts/flow/lib/installed.js` and `flow doctor`'s report, and the file points at both rather than repeating either.
- **Paths here, behavior in `docs/dev/claude-code.md`.** That page says how a skill loads, what a hook sees and what an edit mid-session does, and it is written for a person. The reference file loads into an agent mid-task and lists where things sit.
- **4 rules say what a migration may name**, and they are what the 3 skills actually need: never a transcript, a cache or the login; `~/.claude.json` changes through a `run` line, since Claude Code rewrites that file itself; a project's auto memory is a machine path, so a project's migration names a folder outside the project; settings merge key by key, so a migration that moves 1 key leaves the rest of the file alone.
- **2 facts were written down nowhere before.** Auto memory is `~/.claude/projects/<project>/memory/`, one folder per repository, kept out of the `cleanupPeriodDays` sweep that deletes transcripts. `~/.claude.json` sits beside the config folder by default and inside it once `CLAUDE_CONFIG_DIR` is set, which is how a scratch session starts signed in.
- **Read from the published pages**, `code.claude.com/docs/en/claude-directory.md` and `memory.md`, on top of `lab/research/claude-code-docs/settings.md` and what `docs/dev/claude-code.md` already held. Nothing was probed: every fact is documented.

## `~/.flow/docs` comes back, ruled by the user 2026-09-21

**The `clone` key went on 2026-09-23.** Flow's clone always sits at `~/.flow/repos/flow/`, so `/flow:migrate` and `flow doctor` read `CHANGELOG.md` and `upgrades/` through that path.


**`flow install` links `~/.flow/docs` to the clone's `docs/`**, beside `scripts` and `references`. It was dropped on 2026-09-20, and the user reversed that: `/flow:help` names a manual page in its answer, and the address it names has to read the same on both machines, which a clone path does not.

- **One link, no copy.** The same `link()` loop install already ran for 2 names now runs for 3, so a page edited in the clone is the page a session reads.
- **The case against was 2 addresses for every page**, since a page is also reachable as `<clone>/docs/`. Overruled: what a skill prints has to be stable, and only the link is.
- **`clone` in `~/.flow/settings.local.json` stays**, for the 2 files no link under `~/.flow` reaches: `CHANGELOG.md` and `upgrades/<number>.md` at the clone's root, which `/flow:migrate` reads. `flow doctor` reads the same key.
- **Built before `/flow:help` rather than with it.** The install side is one name in a list, one line in `~/.flow/.gitignore` because a link into this clone never travels to the other machine, and one more path in `installed.paths()`, which is what `flow doctor` checks and `flow uninstall` removes. The skill then names a path that already resolves.

## Skills, sources and the machine's clones, ruled 2026-09-23

**One command installs and switches every skill Flow can reach, and one list of settings says which are on.** Ruled by the user across 12 replies on 2026-09-22 and 2026-09-23, the last saying "I approve everything, and I think we can proceed". The replies are kept word for word in `tmp/setup-form-reply-2026-09-22-a.md` to `-e.md`, on the machine they were written on. This section replaces parts of 4 earlier ones, each of which now says so at its top: `## Prerequisites are checked by running them`, `## Domain skills`, `## Setup asks no question`, and the one bringing back `~/.flow/docs`.

### Every clone lives in `~/.flow/repos/`, and `flow install` makes them

- **`~/.flow/repos/flow/`**: Flow's own clone. A clone kept somewhere else, like `~/code/flow`, is a link at this path. `flow install` makes the link from the clone it runs from, and refuses when the path already points at a different clone. `~/.flow/scripts`, `references` and `docs` link into it. The `clone` key in `~/.flow/settings.local.json` goes.
- **`~/.flow/repos/util/`**: util, cloned by `flow install`, which links `util` and `u` into `~/.local/bin`. util stops being a prerequisite. A migration updates Flow's copy instead of stopping on it.
- **`~/.flow/repos/toolbox/`**: the toolbox, read only by `/flow:research`. It is never pulled, since the library replaces it whole. A catalog grown too old is deleted by the user, and the next `flow install` clones it fresh.
- **`~/.flow/repos/sources/<owner>_<repo>/`**: one clone per skill repository in `sources`. The owner is in the name because 2 owners can share a repository name, as `mattpocock/skills` and `vercel-labs/skills` do on this machine. The `domainSkills` key goes.
- **One ignore line, `repos/`, keeps every clone out of `~/.flow/`'s git.** No record of commits either: the history log below holds what changed.
- **`flow install` clones every one that is missing, in the foreground, with `--depth 1`.** A clone that fails, offline say, prints a warning and install still finishes. A background clone was rejected: install runs once with the user watching, and a failure seen then beats a missing folder found days later.
- **Nothing else clones.** A command that finds a clone missing says `flow install` clones it. Running `flow install` again changes nothing that already exists, so it is always the fix.
- **`domainSkillsAutoUpdate` became `skillsAutoUpdate`, and `scripts/domain-pull.js` became `scripts/skills-pull.js`**, names left to the agent by the user 2026-09-23, since both cover every source.
- **The session-start hook pulls every source**, at most every 6 hours, under the 2 guards `## Domain skills` built: uncommitted work in the clone, and a pull that is no fast-forward. `"domainSkillsAutoUpdate": false` turns every source's pull into a fetch and a note.

### A source is a repository of skill folders

A skill folder holds a `SKILL.md` and whatever scripts and notes it uses. `sources` in `~/.flow/settings.json` lists the repositories Flow takes skills from, so every machine gets the same list through `flow sync`. With no `sources` key the list is `Adrian333Dev/domain-skills` alone. Domain skills are the first source and nothing more.

```json
{
  "sources": ["Adrian333Dev/domain-skills", "mattpocock/skills"],
  "skills": { "grill-me": "on", "review": "off" }
}
```

- **An entry is `owner/repo` for GitHub, or a full git address** for anywhere else.
- **Every `SKILL.md` in the clone counts, at any depth.** `mattpocock/skills` keeps them 2 folders down. A repository with `SKILL.md` at its root is one skill, named by the file's `name:` line.
- **A repository holding no `SKILL.md` is refused**, and the clone `add` just made is removed.
- **Flow links skill folders and nothing else.** A repository whose value lies in hooks, agents or an install script needs its own installer, the way Flow needs `flow install`. No warning for it: the user asked for the simple version.
- **No path, hash or date is stored per skill.** The `npx skills` record needs them because it keeps one copied folder and throws the repository away. Flow keeps the clone: the path is found by searching it, and the history log holds the commit and the dates. A stored path would break the day a repository moves its folders, and a commit in the shared settings would differ on every machine.

### `flow skills` replaces `flow domain-skills`, `flow private-skills` and `npx skills`

```text
flow skills ls [pattern...] [--source <name>]
flow skills add <owner/repo> [name...]
flow skills on <name...>
flow skills off <name...>
flow skills drop <name...>
```

- **The level comes from a flag:** none for this project, `--machine` for this machine, `--global` for all machines. Each level is one of the 3 settings files: `<project>/.flow/settings.json`, `~/.flow/settings.local.json`, `~/.flow/settings.json`. The project's file is committed: `flow git allow --project` writes its timed unlock to `.flow/settings.local.json` instead, which the template ignores, ruled by the user 2026-09-23 so a fresh clone gets its skills back.
- **`on` and `off` write the name's line at that level. `drop` removes the line**, so the level above decides again. Off keeps a skill installed and brings it back on `on`. A project cannot hide a skill on for the whole machine, since the machine's link loads in every session: `off` there refuses and names `--machine`. Kept by the user 2026-09-23, over writing `skillOverrides` for that one case.
- **`add` clones a repository into `sources/`, adds it to `sources`, and turns on the names given.** With no names it only clones and prints what it found. `drop <owner/repo>` removes a source and its clone.
- **`ls` shows every skill by source.** Each pattern is a regular expression matched against the name and the description, ignoring case, and a skill shows when it matches every one. `--source <name>` lists one source whole, which is how the agent lists every domain skill. `flow`, `private` and `outside` are fixed source names, and a repository goes by its name, or by `owner/repo` where 2 share one. A pattern that does not parse is refused by name. A bare `ls` shows Flow's skills, the private ones, and the source skills a settings file names, with a count for the rest of each source.
- **`ls` prints as little as it can**, ruled by the user: one header row, a source as a group line, one row per skill, and the level only where a line set it.

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

### The settings hold only the exceptions

- **Every file ships with no `skills` key.** A line appears only when the user switches something.
- **The nearest level wins, name by name.** Project over machine over global. `readGlobal` in `scripts/flow/lib/settings.js` replaces a top-level key whole, so `skills` gets its own merge.
- **A name no file names is off**, a source's skills and private skills being a library to pick from, so a domain skill a project uses is a line of its own. Flow's essential skills are the exception, always on.
- **A Flow skill has no project level**, since Flow's skills load as one plugin for the whole machine and `skillOverrides` skips a plugin's skills. The user accepted that. With no flag, the command refuses and names `--machine` and `--global`. Outside a project, no flag is refused too.
- **A name 2 sources share is refused**, and the command asks for `owner/repo:name`. A private skill can never share a name, which the private-skills command already refused.
- **A name the settings mention and no source has** shows as `missing` in `ls`, is skipped when links are made, and is a problem in `flow doctor`.
- **Essential skills cannot be switched, and `ls` hides them**, approved by the user 2026-09-23, replacing reply C's unnamed list. Essential is every Flow skill outside `skills/dev/`, read off the tree with no list kept, so 10 of the 12. The 2 in `dev/`, `review` and `apply-domain-findings`, are the only Flow skills `flow skills` switches, and both start off.
  - **`on` and `off` refuse an essential skill by name**, saying it is part of the workflow and always on. `drop` still removes a stray line.
  - **`ls` lists only the 2 switchable Flow skills** under `flow`.
  - **`apply` always links every essential skill.** A hand-written line naming one is ignored, and `flow doctor` reports it with the `drop` fix.
  - **A skill outside `dev/` that should be switchable** would need a frontmatter field instead of the folder rule.

### Links are the only switch, and one step makes them match

- **A skill is on when its link exists.** Flow's own sit in `~/.agents/skills/flow/skills/`. A source's or a private skill's sit in the project's `.claude/skills/` for the project level, and in `~/.claude/skills/` for the other 2.
- **One step makes every link match the settings**, and it runs inside every `flow skills` command, `flow install`, `flow sync` right after it pulls, every migration, and the session-start hook. The hook then asks Claude Code to scan the skill folders again (`reloadSkills`), so a change made on another machine or pulled with a project applies before the first prompt.
- **Whether that scan reaches the folder Flow's own skills load from is untested.** If it does not, a Flow skill switched on another machine applies one session later. Nothing else depends on the answer.
- **Outside skills stay independent.** A plugin, a skill synced from claude.ai, or a skill the setup form left alone: `ls` shows them under `outside`, and Claude Code's `/plugin` and `/skills` menus switch them. `flow skills` writes neither `skillOverrides` nor `enabledPlugins`. Both were proposed and dropped for the simple version, the user's call.
- **The lists go**: `.flow/domain-skills.txt`, `.flow/private-skills.txt`, `~/.flow/domain-skills.txt` and `~/.flow/private-skills/global.txt`. The setting replaces every one, so no bare `add` has to relink a list.
- **Codex is out of this design.** Flow does not support Codex yet, ruled 2026-09-23. `flow install` stops making `~/.codex/AGENTS.md`. `~/.agents/AGENTS.md` stays, being the folder no vendor owns.

### Every change Flow makes to the machine is one line in `~/.flow/history.jsonl`

Asked for by the user 2026-09-23, "so if there is any confusion, we could always have those records". One JSON object per line, added and never rewritten, the pattern `changes.js` and `scorecard.js` already use.

```json
{"at":"2026-09-24T09:12:03Z","type":"clone","source":"mattpocock/skills","commit":"4f2a91c"}
{"at":"2026-09-24T09:12:05Z","type":"skill","name":"grill-me","state":"on","level":"machine","by":"flow skills add"}
{"at":"2026-09-24T15:40:11Z","type":"pull","source":"domain-skills","from":"4f2a91c","to":"b7e03d2","changed":["react","vitest"]}
```

- **A line for every** clone, pull that changed something, switch, `flow install`, setup or migration applied, and `flow restore`.
- **It stays on the machine**, ignored by `~/.flow/`'s git. 2 machines adding to one shared file would clash at every `flow sync`.
- **The audit index was the wrong home.** `flow audit` indexes Claude Code's own transcripts and can be deleted and rebuilt. This log holds facts nothing else does.
- **No command reads it yet.** `grep` does. A `flow history` command is a backlog line.

### The setup form takes over outside skills

A section of `migration.md`, after `## 🟢 Turned on unless you untick it`:

```markdown
## Taken over by Flow unless you untick it

From now on `flow skills` installs, updates and switches these. Each one stays on for this machine, as it is now. An unticked one stays exactly as it is, and Flow never touches it.

- [x] find-skills, installed with npx skills from vercel-labs/skills: replaced by the same skill from Flow's own clone of that repository. `sources`, `skills`
- [x] my-helper, a folder copied in by hand: moved into ~/.flow/private-skills/ and linked back. `skills`

Left as they are: plugins, such as frontend-design, which /plugin switches.
```

- **Installed by `npx skills`**: a real folder in `~/.agents/skills/`, linked from `~/.claude/skills/`. `~/.agents/.skill-lock.json` names its repository.
- **Copied by hand**: a real folder in `~/.claude/skills/` that no record names.
- **Plugins and synced skills**: listed under `Left as they are`, with no box.
- **The lines it adds to `## Every file this changes`**, in the order they run. The delete comes first, because `add` refuses to replace a real folder with a link:

  ```markdown
  - delete ~/.claude/skills/find-skills and ~/.agents/skills/find-skills: the npx skills copy
  - run flow skills add vercel-labs/skills find-skills --machine
  - write ~/.agents/.skill-lock.json: find-skills removed from the record npx skills keeps, so npx skills update can't bring its old copy back
  - move ~/.claude/skills/my-helper to ~/.flow/private-skills/my-helper
  - run flow skills on my-helper --machine
  ```

- **The tick is the yes for the delete**, and `~/.flow/originals/machine/` keeps the folder for `flow restore machine`.
- **Only the taken-over entries leave the lock file.** An unticked skill stays with `npx skills`, whose update reads that entry. `npx skills` never updates by itself: its README names only `npx skills update`.
- **Entries already stale stay.** The file on this machine names 9 skills with 3 folders left, and those belong to `npx skills`.
- **Setup still writes `skillOverrides`** for the 2 removals it always made: Claude Code's `/batch`, and a synced skill that fights Flow's rules, like `grill-me`.

### The whole form, as approved

The form `/flow:setup-machine` writes, approved point by point on 2026-09-23 and merged here. It replaces the shape under `## Setup asks no question`. The sample machine has the superpowers plugin, a `tdd` skill, `grill-me` synced from a claude.ai account, `find-skills` from `npx skills`, the frontend-design plugin, and an old `~/.claude/CLAUDE.md`.

````markdown
---
type: setup-machine
---

# Setting up this machine

⚠️ Don't change anything in this file unless you know exactly why. Flow is built and tested as one setup, and a change here can break parts of it in ways you won't notice until later. Every key below is explained in ~/.flow/docs/manual/settings.md.

## What Flow sets up

- Flow's rules, read at the start of every session. `~/.agents/AGENTS.md`, loaded by `~/.claude/CLAUDE.md`
- Flow's hooks: guard.js, changes.js, rule-check.js, instructions-loaded.js, check-ticket.js, reminder.js, session-check.js. `hooks`
- Git commands that change anything stay blocked until you type `! flow git allow`, and commands that destroy work always ask. `guard.js`
- Claude sees exactly what each helper agent changed, even with several working at once. `changes.js`
- Shell commands, edits, web pages, web search and context7 (a library docs lookup) run without asking. `permissions.allow`
- Every session starts in Manual mode: Claude asks before anything the line above doesn't cover. `permissions.defaultMode`
- Claude can't run the commands that undo Flow. Only you can. `permissions.deny: Bash(flow restore …), Bash(flow uninstall …)`

### Always removed, because Flow can't work with them

- Plan mode: Claude can switch into a mode where it can't edit files, and Flow's planning writes files. `permissions.deny: EnterPlanMode, ExitPlanMode`
- Worktrees: Claude works in a separate copy of your project, without the uncommitted changes Flow's debugging looks at. `permissions.deny: EnterWorktree, Agent(isolation:worktree)`, `worktree.bgIsolation`
- /batch, Claude Code's skill for big changes: it needs worktrees. `skillOverrides`
- Bypass mode: Claude could switch off Flow's checks without asking you. `permissions.disableBypassPermissionsMode`
- superpowers plugin: at the start of every session it tells Claude to run one of its skills before replying, which overrides Flow's rules. `enabledPlugins`

## Flow's skills

Claude starts these on its own, so each one's description is in every session:
- /flow:groundwork, /flow:execute, /flow:prototype, /flow:debug: the 4 steps of work
- /flow:research, /flow:visualize, /flow:handoff: used inside the 4 steps
- /flow:review: writes up each time Flow itself fails

These cost nothing until you type them:
- /flow:start, /flow:tickets-from-spec, /flow:file-findings, /flow:apply-domain-findings

## 🔴 Removed unless you untick it

⚠️ Do not untick these. Flow was built and tested with every one of them gone. Keeping one makes Claude work against Flow's rules, or fills every session with text Flow never uses, and nothing will tell you it's happening. Anything you untick is shown to you again before setup goes ahead.

### Works against Flow's rules

- [x] Memory: notes Claude Code writes about each project and loads into every session, beside Flow's rules. `autoMemoryEnabled`
- [x] Forks: helper agents that start with a copy of the whole conversation. Flow's helpers see only what they're told. `permissions.deny: Agent(fork)`
- [x] Workflows: Claude writes a script that runs many helper agents at once, outside Flow's steps. `disableWorkflows`
- [x] Skills that come with Claude Code: /debug and /code-review do what Flow's own skills do, and all 6 add to every session. `disableBundledSkills`
- [x] Pick-list questions: Claude asks you to choose from options, where Flow has it recommend one. `permissions.deny: AskUserQuestion`
- [x] Artifacts: Claude publishes its work as a web page on claude.ai, where Flow draws it in the terminal. `disableArtifact`
- [x] The review findings tool: during a code review, Claude shows its findings in Claude Code's own layout instead of Flow's. `permissions.deny: ReportFindings`
- [x] Claude replying after a command you run yourself with `!`: Flow asks you to run commands such as `! flow git allow`, and a reply to each costs a turn. `respondToBashCommands`
- [x] tdd skill: tells Claude how to plan and test every change, which Flow's steps already do. `~/.claude/skills/tdd/`
- [x] grill-me, synced from your Claude account: interviews you with a list of questions, where Flow has Claude recommend. `skillOverrides`

### Rarely used, and each one is sent with every message

⚠️ These sound useful, but most people never use any of them. Each one is still sent to Claude with every message you type, used or not. Design sync alone is about 2,200 tokens, roughly 1,600 words. Flow keeps every session as small as it can, so they all go. Keep one only if you already use it every week.

- [x] Connectors you added on claude.ai, such as Google Drive: added for chatting on claude.ai. Flow never calls them. `disableClaudeAiConnectors`
- [x] Editing Jupyter notebooks: only for data-science notebook files (.ipynb). `permissions.deny: NotebookEdit`
- [x] Notifications: Claude alerts your desktop or phone when you've walked away from a long task. `permissions.deny: PushNotification`
- [x] Timers: Claude runs a prompt again later or on repeat. Mostly used by /loop, which Flow already removes. `permissions.deny: CronCreate, CronDelete, CronList, ScheduleWakeup`
- [x] Routines: prompts that run on a schedule on claude.ai's servers, on paid plans. `permissions.deny: RemoteTrigger`
- [x] Sending files: Claude sends a report or screenshot to your phone or the desktop app. `permissions.deny: SendUserFile`
- [x] Sharing a setup guide: uploads a guide for teammates joining a team, for /team-onboarding. `permissions.deny: ShareOnboardingGuide`
- [x] Messaging other sessions: for running several Claude Code sessions that talk to each other. `permissions.deny: ListAgents`
- [x] Design sync: syncing with a design app. Claude Code's own docs don't even list it. `permissions.deny: DesignSync`

## 🟢 Turned on unless you untick it

⚠️ Leave these on. Turning one off takes away something Flow relies on to keep working well.

- [x] Auto-update the skill repositories you added, each time a session opens. Off, each session tells you what's waiting instead. `skillsAutoUpdate`
- [x] Remind Claude how to reply, beside every message you send. `reminder`
- [x] Tell you when a session opens if Flow or your skill repositories need updating. `sessionCheck`
- [x] Keep session history for a year instead of 30 days, so a rule can be traced back to the session that caused it. `cleanupPeriodDays`

## Taken over by Flow unless you untick it

From now on `flow skills` installs, updates and switches these. Each one stays on for this machine, as it is now. An unticked one stays exactly as it is, and Flow never touches it.

- [x] find-skills, installed with npx skills from vercel-labs/skills: replaced by the same skill from Flow's own clone of that repository. `sources`, `skills`

Left as they are: plugins, such as frontend-design, which /plugin switches.

## Moving into Flow's rules

~/.claude/CLAUDE.md is replaced whole. What's worth keeping from it and your other files is below, and a copy of the old file is kept. Edit or delete any line.

### Your preferences

```text
Never use em dashes.
```

### About you

```text
```

## Every file this changes

- write ~/.agents/AGENTS.md: Flow's rules, with the 2 boxes above
- write ~/.claude/CLAUDE.md: one line loading Flow's rules, in place of what it holds now
- write ~/.claude/settings.json: every key named above. Your own settings, such as model and theme, stay as they are
- delete ~/.claude/skills/tdd/
- delete ~/.claude/skills/find-skills and ~/.agents/skills/find-skills: the npx skills copy
- run flow skills add vercel-labs/skills find-skills --machine
- write ~/.agents/.skill-lock.json: find-skills removed from the record npx skills keeps

~/.flow/settings.json is written too if you untick one of the first 3 green lines. ~/.flow/version is stamped once the check at the end passes. ~/.flow/originals/machine/ keeps a copy of every file above as it was, so `flow restore machine` can put this machine back.
````

The rulings behind it, each approved 2026-09-23:

- **The parser never sees the form.** `scripts/flow/lib/migrations.js` acts only on lines opening `- write `, `- delete `, `- move ` or `- run `. After the yes, the skill rebuilds those lines and the `files/` copies from the ticks, then runs `apply-migration.js`.
- **The second check is one message covering every box the user changed**, red and green alike, a deleted line counting as unticked. Nothing changed: setup writes at once. Something changed: nothing is written, and one message lists each change with what it costs, plus Claude's shortened version of any edited text box. Go keeps the changes, and ticking again, then go, undoes one. There is no third check.
- **"About you" starts empty, with no placeholder.** A line belongs only when it is true of the user and changes what Claude does, such as `Colour-blind, so never tell things apart by red and green alone.` Voice dictation is assumed of every user, so it never goes in.
- **A skill that costs nothing until typed is marked `disable-model-invocation: true`.** `/flow:file-findings` joins `/flow:start` and `/flow:tickets-from-spec`, since Claude only ever offers it. The 4 phases, `/flow:research`, `/flow:visualize`, `/flow:handoff` and `/flow:review` stay on the list Claude sees.
- **Everyone gets the same Flow, with no maintainer role.** All 12 skills, one rule file, one set of settings. A skill only some people can use checks for itself: `/flow:apply-domain-findings` checks for write access to domain-skills and stops with the reason.
- **Codex is never mentioned.**
- **The capture line in `home/AGENTS.md` that routes a Flow failure gains `→ /flow:review, if it's in your skill list`**, since the user can switch that skill off.

**Built 2026-09-24 as `skills/tools/setup-machine/references/form.md`, with 4 differences from the form above**, each forced by the code:

- **`fileSuggestion` gets a line under `## What Flow sets up`**, and **`disableRemoteControl` one under `### Rarely used`.** Both keys are in `home/settings.json`, and the form must name every key it writes.
- **`/flow:setup-machine` joins the list of skills that cost nothing until typed.** Taken back out the same day, when setup stopped being a skill.
- **`## Every file this changes` holds one path per line, in the parser's shape.** A `move` reads `->`, and a `run` line ends `: writes <paths>`, since `scripts/flow/lib/migrations.js` refuses anything else. The rule file is 2 lines, `~/.flow/AGENTS.md` and the link `~/.agents/AGENTS.md`, landing the move agreed 2026-09-20 in `backlog.md` → **Working on more than one machine**.

### Setup is not a skill, ruled 2026-09-24 after the first terminal run

The user ran the build through `try.sh` from a real terminal. What it found, and what was agreed in answer:

- **Setup leaves `skills/`.** Safe mode loads no skill, so the text only ever reached the session as a system prompt, and a typed `/flow:setup-machine` in a normal session would run beside the plugins it removes. It lives in `scripts/flow/setup/`: `machine.md` and `form.md`. Migrations stay skills, since they run on a machine setup already cleared.
- **`flow setup` comes back** as the command that opens the session, reversing its drop below. `flow install` calls it last, and typing it carries on a stopped setup. `flow setup check` checks the install is whole first, and `flow setup finish` stamps the version.
- **Auto mode refused the first write**, `~/.flow/run.json`, as the agent changing its own setup. The session now starts with `--permission-mode acceptEdits`, `--add-dir ~/.flow` and 3 allowed commands. `disableAutoMode` was rejected: it changes the user's own choice for every session.
- **A missing requirement stops setup.** The session met no `util`, since the sandbox skipped the clones, and fell back to `cat`.
- **The form shows only what go changes.** A setting is judged by its value, so memory already off gets no box. An installed thing is judged by being there, since one switched off can be switched on again.
- **An always-removed plugin has no box, and goes by `claude plugin uninstall`**, never by `enabledPlugins: false`.
- **The repository question has no skip.** Enter makes one with `gh`, signing in first when `gh auth status` fails. An address is read with `git ls-remote` before it is kept. With no terminal and no `--repo`, the install stops before setup.
- **The install prints a summary**, and every line to `~/.flow/install.log`.
- **`try.sh` runs are folders of their own**, `tmp/try/<name>/`, kept and reopened by name. Every run starts with the real install, clones from GitHub included, and `--repo` points at a local stand-in so no run makes a GitHub repository. `with-flow` is gone. The project sits at `~/code/<seed>`, the path a real one has.

A sandbox run of the moved setup, under `acceptEdits`, reached a correct form and then stopped on 4 things. Fixed the same day under the same approval:

- **`util fs tree` and `util fs merge` are allowed too**, 5 commands in all. Flow's own rules forbid `ls` and send every look at a folder through them.
- **The session starts in the home folder**, so reading `~/.claude/` and `~/.agents/` asks nothing.
- **`flow setup` names the migration folder in `run.json`.** The session has no allowed command that tells it the time.
- **`~/.agents/AGENTS.md` is made by a `run` line** at apply time, never as a link inside `files/`, since `ln` is not a command `acceptEdits` lets through.
- **One prompt stays.** Claude Code asks before any write to a path holding a `.claude` folder, `files/home/<user>/.claude/settings.json` included, and the docs say no allow rule skips it. The session warns the user first, and the prompt's for-this-session answer covers the rest. Renaming the mirror path was the alternative, and would change the migration format for one prompt.

### `flow install` starts setup, and a second run leaves it alone

- **`flow setup` is dropped. `flow install` ends by starting the setup session itself**, `claude --safe-mode` with one `--append-system-prompt-file`: the rule template joined with the setup skill. Safe mode was tested by the user and works. Only the last copy of that flag counts, so the 2 files are joined into one.
- **A quit halfway leaves every `flow` command refusing**: `Flow is not set up on this machine. Run flow install again.` Moving the user's files aside first was rejected: plugins and hooks live inside `settings.json`, a quit would leave the machine stripped, and `~/.flow/originals/machine/` already holds the copy.
- **On a machine already set up, install skips the setup session**, knowing from `~/.flow/version`, the file setup writes last. It only rebuilds Flow's links, clones what is missing, refuses to replace anything that is not a link, and copies the originals only the first time.
- **A project gets `flow setup project`**, paired with `flow restore project`.
- **No `flow update`.** The switch applies itself, `flow sync` carries it, and Flow updates through migrations.

## One pasted line installs Flow, ruled 2026-09-23

**A new machine gets Flow from one line, the way codex-seo installs.** Ruled by the user 2026-09-23, "I think I approve everything", after reading `repos/codex-seo/README.md`. It builds `## How Flow ships`'s "one pasted line".

```sh
curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/<tag>/install.sh | bash
```

- **`install.sh` sits at the repo root, is bash, and stays about 20 lines.** It checks for git, node and claude, clones Flow at the tag into `~/.flow/repos/flow/`, then runs `node scripts/flow/flow.js install`. Every other step stays in `install.js`.
- **Bash, because the line runs before Flow is on disk.** `install.js` lives inside the clone, so it cannot fetch the clone. Every machine has bash, and a missing node gets a sentence naming it rather than `node: command not found`.
- **`--use <folder>` skips the clone** and uses that folder as Flow. `lab/scripts/try.sh` passes the working copy, so a test covers uncommitted edits: a `git clone` of a local folder copies only commits.
- **A second run changes nothing.** Where `~/.flow/repos/flow/` exists, `install.sh` clones nothing and hands on to `flow install`, which already leaves a machine alone: `### flow install starts setup, and a second run leaves it alone`.
- **Updating Flow is `flow up`, never a rerun.** The session-start pull updates the skill sources in `~/.flow/repos/sources/` and never Flow's own clone, which moves only by tag, through a migration.
- **Built first in the `/flow:setup-machine` build**, since only that skill makes it testable end to end.

## Permissions have one owner per rule, ruled 2026-09-24 and 2026-09-25

What the setup form's `permissions` lines install. Claude Code's settings hold every rule a pattern can state, and `guard.js` keeps only the checks that read inside a command.

- **`Read` is allowed everywhere**, ruled 2026-09-24, and denied under `~/.ssh` and `~/.aws`. An asked-for read taught the agent that `cat` was the quiet way.
- **The bare `Bash` allow goes**, replaced by 23 patterns: `mkdir`, `touch`, `mv`, `cp`, `rm`, `ln`, `chmod`, `node`, `python3`, `flow`, `fw`, `util`, `npm test` and `npm run` with the same pair for pnpm, yarn and bun, `pytest`, `cargo test`, `go test`. The user approved the first 14, then asked for the other package managers and the other languages' test commands. A command the list misses asks once, and "don't ask again" saves a pattern for that project.
- **The deny list gains `sudo *`, `su *`, `mkfs*` and `* --dangerously-skip-permissions *`.** `mkfs*` has no space, to catch `mkfs.ext4`. `su *` was added 2026-09-25, since the old guard denied `su` beside `sudo`.
- **No `ask` rule anywhere**, since an ask rule beats every allow, a saved one included.
- **`guard.js` asks about 4 things and never allows**: a recursive or forced delete outside the working directory, a download piped into a shell (a deny until now), a shell startup file write, and the destructive git table. The install, `chmod 777`, `dd` and `mkfs` asks went, and fall to Claude Code's own prompt.
- **The timed git switch goes whole**, ruled 2026-09-25. Git writes are a preference, built against a plugin that committed after every edit, and Claude Code's prompt already asks before each one. The user accepted that auto mode can run a commit unasked. `flow git`, the `git` key, the project's `.flow/settings.local.json` and the rule `no-git-writes` went with it.
- **Chained commands get nothing built.** One can save a piece word for word. Revisit only if `.claude/settings.local.json` fills with word-for-word rules.

## Project setup is a command, ruled 2026-09-25

**`flow setup project`, typed in the project's folder, opens a normal session that loads Flow and nothing of the project's.** Agreed by the user 2026-09-25, in place of the planned `/flow:setup-project` skill. The launch is `claude --setting-sources user --strict-mcp-config`, set the same day.

- **The command beats a skill.** A skill runs in a session already open in the project, with its `CLAUDE.md`, hooks and plugins loaded, and cannot unload them. Delapse's superpowers startup hook is the case. A skill that moved the files out would still need a second session. The command's one cost is a terminal, so where none is attached it prints the line to paste, as `flow setup` does.
- **The 2 flags keep the project out.** `--setting-sources user` loads only `~/.claude`, where Flow lives by then. The docs say it skips the project's settings files and `.mcp.json`. A probe 2026-09-25 in `tmp/probe-sources/` showed it also skips the project's `CLAUDE.md`, its skills, commands and subagents, and a subfolder's `CLAUDE.md` read on demand: all 4 loaded without the flag, none with it. `--strict-mcp-config` skips the servers `claude mcp add` saved for the project in `~/.claude.json`. Auto memory is off in Flow's `settings.json`.
- **Nothing in the project changes before the form's yes.** The project's files stay in place, the harvest reads them there, and removing one is a line in the form. Files kept never move.
- **Rejected the same day: a script moving the project's files out first, then a normal session.** The user's idea, approved, then replaced by the flags. It changed the project before the yes: a tracked `CLAUDE.md` vanished from git mid-harvest, another open session lost its rules, a shared repository lost the team's files, and every file kept left and came back. Its one gain was working in any harness, since every harness loads by path. That gain survives as a fallback: each file in `references/harnesses/` names its launch that loads no project files, and a harness with none moves the files instead.
- **Machine setup stays in safe mode, ruled the same day.** The user asked whether the same model fits the machine: install Flow, move every competing file into the original, then harvest in a normal session. Rejected: plugins come back only by reinstalling, `~/.claude.json` is rewritten by Claude Code, synced skills only by downloading again, the whole machine changes before the yes, and the setup session needs no Flow skill or hook.

**3 harvest rulings, approved by the user 2026-09-25:**

- **Open work becomes tickets, one per open item**, and the files it came from stay where they are. Delapse keeps it in `docs/work/now.md`, `audit/bugs.md`, `audit/debt.md` and `roadmap.md`.
- **Memory about the user goes to the machine's preferences box**, under the same second test as machine setup: would the user still want it had Flow been there from the start. A rule the agent would get wrong without being told goes to the project's `AGENTS.md`, and a lasting fact the code does not show quickly to `docs/context/<subject>.md`, one question per file. A finished project note is dropped, and an open one becomes a ticket.
- **A renamed project's memory is offered, never guessed.** Claude Code names the folder for the path at the time, so Delapse-validation's sits under `-home-me-code-projects-backmark-validation`. With no folder matching the current path, the form lists every memory folder whose project is gone from disk, each unticked.

**3 rulings on what setup writes and on restore, set by the user 2026-09-25:**

- **Project context stays short.** The session may read the code for anything useful, beyond what the docs say. What it writes about the project stays small, because a long description goes out of date with the code and becomes upkeep.
- **No rule for standard practice.** A rule is kept only where a capable agent reading the code would likely get it wrong without it. Delapse's "all LLM calls go through `LlmService`" fails: one service injected where it is needed is ordinary design, and ruling on it would mean hundreds of rules like it.
- **A machine restore may leave the projects as they are.** It lists every project set up and offers to restore them first. Declining is allowed, with a warning.

**How the harvest runs, agreed 2026-09-25**, proposed and left unopposed:

- **Every stage of project works with the same steps**: an empty folder gets `project-template/` alone, docs with no code get `AGENTS.md` from the docs, a partly built project gets the full harvest, a large one more batches. Someone else's repository gives nothing to the user's preferences.
- **Only files git would keep are surveyed.** Delapse's `temp/repos/` holds about 50 rule files of other projects.
- **3 stages.** A survey writes `inventory.md` into the migration folder, one line per source with its path, type, size and whether it is read, so a stopped run carries on from the first unread line. Subagents read it in batches with `util fs tree` and `Read`, each writing findings beside it, and the main session holds only the inventory and the findings. Every finding lands in one place: the project's `AGENTS.md`, `docs/context/`, a ticket, `.flow/inbox.md`, `.flow/findings/`, the machine's 2 sections, left in place, taken over as a skill source, or dropped with its Flow rule named.
- **Sources are typed by content, never by file name**: intent, how it is built, decision, open work, rules for the agent, reference, history. Reference and history are never read whole: Delapse's largest doc is 860 KB of Inngest's own documentation, then finished milestone plans.
- **The code is read freely and wins over every doc.** A doc the code contradicts becomes a ticket.
- **`migration.md` holds decisions, never content.** One box per thing the user might reverse, with a count. Content sits in `files/`, and dropped lines in `dropped.md` beside the form, each with the Flow rule replacing it.
- **Setup writes no spec**, since a spec is the user's intent and setup asks nothing. It makes one ticket, "Write the product spec", listing every intent, build and decision source with a line each. That ticket's `/flow:groundwork` run checks each claim with the user and writes `product.md`, `tech.md` and `decisions.md`. The old docs stay until then, and deleting them is its own yes. Renaming old specs was rejected: 95% are below Flow's standard.
- **Tickets come only from explicit lists of open work**, never from features a spec describes.
- **Everything in the project's settings gets the keep-or-remove test one by one**, as skills do: plugins, hooks, permissions, MCP servers in `.mcp.json`, and `.claude/settings.local.json`. What knows the project's field is kept, and what tells the agent how to work goes. Lumacraft's project settings switch on 11 plugins.
- **An idea the user never committed to goes to `.flow/inbox.md`**, raw. It is neither open work nor a fact.
- **A lesson about a tool goes to `.flow/findings/<what-was-learned>.md`**, such as a library's misbehavior and its workaround. It is knowledge `/flow:file-findings` can promote, not a fact about the project.
- **Domain skills come back through `.flow/domain-skills.txt`**, which setup writes and links, as locked 2026-09-17. It asks for the domain-skills clone the first time a project wants a skill from it.
- **A `CLAUDE.md` in a subfolder needs nothing of its own.** The survey takes every file git keeps and types it by content, so a committed `packages/api/CLAUDE.md` is sorted like the root one. A repository cloned in later is usually gitignored, and is handled when it causes trouble.
- **Setup makes a second ticket, "Find skills, plugins and MCP servers for this stack"**, naming the stack read from the code and what is already installed. Its run uses `/flow:research`, and every install is its own yes. A project with no code gets none, since `/flow:groundwork` settles the stack.
- **The paths it writes**: `AGENTS.md`, `CLAUDE.md` as `@AGENTS.md`, `.claude/settings.json`, `.gitignore` lines, `.work-include`, `.flow/settings.json`, `.flow/tickets/`, `.flow/overlays/`, `.flow/inbox.md`, `.flow/findings/`, `.flow/domain-skills.txt`, `docs/context/`, `.flow/version` last. On the machine: `~/.flow/AGENTS.md`'s 2 sections, `~/.flow/migrations/<project>/<time>/`, `~/.flow/originals/<project>/`, one `history.jsonl` line.


Stated in the user's own messages, 2026-09-08 to 2026-09-16. Not proposals.

- **The skill owns Flow's whole life, and installing is one job inside it.** Corrected 2026-09-01 on seeing it scoped as an installer. 2026-09-16: it is also the assistant for a user who does not understand something or does not know the next step, and it runs for as long as Flow is on the machine.
- **A migration can be as large as replacing the whole workflow.** Never assume a rule added. Hooks are the common case: the mechanism behind them changes, hooks get added, removed or rewritten, scripts arrive. The first weeks after install bring one of these every few days.
- **The agent gets clear steps, never "make a plan".** Where to look, what to check, in what order, written into the skill.
- **A machine that migrated and a project that did not is a fault to detect mechanically.** The user's shape: a version recorded in every project and one recorded globally, compared.
- **A reliable check that the machine is up to date with the latest version.**
- **A snapshot before any migration**, so a user who does not want Flow reverts everything: files under `.claude/` and `.codex/` get replaced, and skills, plugins and MCP servers get deleted or isolated to one project.
- **`settings.local.json` is in the migration's scope.**
- **The answer job is the smallest one.** Mostly it references a section or sends the user to the page. Reading and rewriting the manual for them is the exception.
- **The skill uses the tools underneath**: `flow doctor`, `flow check` and the rest, and does not redo their work.
- **Prerequisites are checked first**: `util` with its commands, the domain-skills repository, and the toolbox.
- **The toolbox is temporary and gets replaced whole.** Its own README says so once the line is written.
- **Setup is a complete replacement, not a merge.** Read what is there, harvest what is worth keeping about the user, delete it, put Flow's rule file in place, fill the profile from the harvest.
- **`~/.claude/CLAUDE.md` is Flow's file**, the live version of the template.
- **Project memories are migrated on demand.** The user names a project. Walking every folder under `~/.claude/projects/` is refused.
- **A competitor is deleted, never scoped to a project.** Anything that answers the questions Flow answers fights the global rules.
- **Domain-specific things stay.** A skill, plugin or MCP server that knows a domain Flow does not.
- **`settings.json` is analysed key by key.** No blind merge.
- **`.codex/` and `.agents/` are not v1**, and the skill has to work for them once multi-harness support lands.
- **Overlays are project-scoped and minimal.** A machine-wide overlay was refused.
- **Install, verify and re-install across the user's 2 machines are v1.** Converting a project that already has its own workflow waits for such a project. Set 2026-09-08.
- **The 9 outside skills and plugins on this machine are the test material**, untouched until the skill runs here. Set 2026-09-15.

## The options on the table, by branch

None approved. Each is a position to argue in the walk, never the answer.

**The migration spine.** Two sources, because neither is enough alone. The diff: `home/settings.json` and `home/AGENTS.md` are the target state, the live files the current one, so hooks, scripts and the rule file outside the personal sections diff exactly. The changelog: the file suspended until v1 becomes the migration log, one entry per change saying what a machine or a project must do that no diff shows. Where the version comes from is open: the changelog carries no version numbers by rule, so the candidates are the date of the newest entry or the clone's commit. A migration has two halves, the machine and each project, and the project half runs when that project is opened. Earlier proposals folded here: migration reads git rather than a second clone, `git show <commit>:home/AGENTS.md` giving the version installed from, and resolution across 3 documents done by an agent reading them, never `git merge`. One global changelog rather than one per skill, because order across skills is where a migration matters.

**Snapshot and restore.** Copy `~/.claude/` and `~/.flow/` whole into `~/.flow/snapshots/<timestamp>/`, with a manifest of what was found and what the run intends. Restoring puts the tree back, which is the uninstall Flow does not have. The user widened it 2026-09-16 to `.codex/` and to what plugins and MCP servers a run removes or isolates.

**Proof.** `flow doctor` for what a function can check. The audit index, which holds every session's transcript, for what a function cannot: whether the new hook fired in the last session, whether the rule file loaded. The doctor's own header already says the skill runs it first and walks what no function reaches.

**Setup.** A survey producing a written plan the user approves before anything is touched: a real machine turns up 20 plugins and 40 memory folders, and approving that list is a different act from approving "set Flow up". The competitor test: anything telling the agent how to work goes, anything knowing a domain Flow does not stays and gets costed, and a plugin carrying both keeps its domain parts. Built-in `/init` with `CLAUDE_CODE_NEW_INIT=1` is tried on a real repository before the skill rebuilds what it does.

**The 2 personalised files.** Two shapes. Transplant: the live rule file stays a copy, the personal content lives in 2 named sections, and an update reads them out, writes the new template, puts them back. Import: the live file is a few lines importing Flow's template and a personal file, which Claude Code allows up to 4 hops deep, so a pull updates the rules and touches nothing personal. The settings file cannot import either way. One profile section against two: one, since nobody can state the line between a habit and a preference, and the interview then asks one set of questions.

**The answer job.** A command prints every manual page's headings, one line each, generated from the files so it is never stale. The skill reads the list and points at the section. `/flow:start` routes to a skill; this explains and stops. The reference page is already built for the reader who knows a feature exists and not its name.

**Prerequisites.** `flow doctor` already checks that the 3 `util` commands run. The domain-skills clone is reachable only if a setting names one. The toolbox is optional from the start, so its replacement changes nothing.

**Entry points.** A session-start hook compares the version the machine last applied with the clone's, and the project's with the machine's, and prints one line when either is behind. Without it the user forgets, and the update design is dead weight. Whether the skill is one typed entry that detects the state first, the way `/flow:start` does for a ticket, is branch 7.

**Code against judgment, across all branches.** Diffing, versioning, snapshotting and restoring are scripts and belong in `flow`. Reading a stranger's rule file, deciding which plugin competes, harvesting the profile and reading a changelog entry against this machine are judgment, and that is the skill's body.

## Which operating systems

Settled by lookup 2026-09-16. Linux and macOS, and Windows only inside WSL. Every hook command in `home/settings.json` is a shell line using `$HOME`, one of them `cat`. Every skill body carries a bash `case` line. `flow install` writes symlinks into `~/.local/bin`. The Claude Code docs say a hook on native Windows is written in PowerShell with `shell: powershell` on the entry, and the PowerShell tool becomes the primary shell there. `README.md` → `## Status` says so, and `backlog.md` → `## After V1` → `### Install and migration` holds the item to lift it.

## What already exists, so the skill never rebuilds it

- **`flow install`** links everything per item into `~/.claude/`, `~/.flow/` and `~/.local/bin/`, reads the skill list off the tree, and is idempotent. It refuses to touch `settings.json` and prints the file to merge instead.
- **`flow doctor`** makes every check a function can make: the names resolve, the 3 `util` commands run, `~/.claude/` is linked with its `CLAUDE.md` present, the hooks in `settings.json` are registered with every script on disk, `~/.flow/` resolves into this clone, both suites pass. It returns an exit code.
- **`flow audit`**, an index of every session transcript on the machine, with queries over it.
- **The 2 checkouts**, at `docs/dev/checkout.md`. Stable is `~/code/flow`, which every symlink points at. Dev is `~/code/flow-dev`, a worktree nothing points at. Shipping is a pull in stable.
- **Project overlays**, at `scripts/flow/commands/overlays.js`: a project writes `.flow/overlays/<name>.md` and the skill prints it from a shell line at the bottom of its body.
- **`/flow:file-findings`**, which writes `.flow/findings/<subject>.md` during real work and promotes a finding into a skill or a rule later.

## Faults found by the attack, 2026-09-17

Phase 3 of the method: one real case run end to end against this machine, which `## Settled by the user` names as the test material. The case is setup from the pasted clone line to a stamped `~/.flow/version`. Facts below were read off the disk, never assumed. Each fault is a step the run could not finish. All 6 were fixed the same day, each in the section it belongs to; the list stays as the record of what the design missed.

**The machine, as found.** `~/.claude/CLAUDE.md` exists and is 0 bytes. `~/.claude/settings.json` holds 20 keys and no `hooks`. `~/.claude/scripts` is a symlink into `/home/me/code/projects/agentic-setup/flow/global/scripts`, a predecessor of Flow still on disk. `~/.local/bin/flow` and `fw` are symlinks into this clone, made 2026-09-05; `u` and `util` point into `/home/me/code/util`. `~/.flow` does not exist. `~/.claude/skills/` holds 3 linked skills and a `synced/<uuid>_<uuid>/` tree of 9 more. `enabledPlugins` names 3 plugins, one of them turned off.

1. **An empty rule file passes the install's existence check.** `install.js:125` asks `fs.existsSync(rules)`, and `~/.claude/CLAUDE.md` exists at 0 bytes, so install keeps it and never copies the template. Flow's rules would load nowhere and nothing would say so.
2. **Setup has no branch for Flow's own leftovers.** This machine carries pieces of two different clones and no `~/.flow/version`, so every version check reads it as a machine that never had Flow. Nothing in the survey looks for a link into any clone.
3. **The snapshot does not cover the links.** `## Snapshot and restore` has setup copying the plugins folder, the skills folder, `~/.claude/settings.json` and `~/.claude.json`. `~/.local/bin` and `~/.claude/scripts` are exactly what setup rewrites here, and neither is in the list, so restore cannot put them back.
4. **12 live settings keys are outside the 3 groups.** `## What setup does to settings.json and to a project` splits the file into `hooks`, `permissions` and 7 opinion keys, all 12 of them Flow's template. The live file also holds `model`, `statusLine`, `theme`, `tui`, `voice`, `voiceEnabled`, `preferredNotifChannel`, `effortLevel`, `modelSettings`, `promptSuggestionEnabled`, `enabledPlugins` and `extraKnownMarketplaces`, and no rule says what happens to them.
5. **Deleting a competitor plugin is a settings edit, and no step names the key.** A marketplace plugin is turned on by `enabledPlugins` in `~/.claude/settings.json`, so the competitor test's delete is a key edit plus a restart, never a folder removal.
6. **Skills reach a machine by 4 routes and the survey knows one.** A plain folder in `~/.claude/skills/`, the account-synced tree under `~/.claude/skills/synced/<uuid>/`, a marketplace plugin through `enabledPlugins`, and `~/.claude/plugins/installed_plugins.json`. The synced tree is the hard one: it comes from the account, so deleting the folder brings it back next sync, and 2 of its 9 skills overlap ground Flow rules on.

## Faults found in the code, verified 2026-09-11

- **`flow install` does nothing on a machine that already has `~/.claude/CLAUDE.md`.** `install.js:125` copies Flow's rule file only when none is there, and otherwise prints `kept: CLAUDE.md, yours, already here`. Every skill still links, so the machine looks installed while none of Flow's rules load. `doctor.js:248` then reports success, because it checks the file exists and whether it still holds template placeholders, never whose file it is. Every real machine arrives this way. Branch 3 owns it.
- **An overlay reaches a `SKILL.md` and nothing else.** A `references/` page under a skill has nowhere to run a command, and neither does a file in `rules/`. In `backlog.md`, deliberately not designed here.
- **Flow has no uninstall.** Branch 1 owns it.

## Jobs recorded before the map, each under a branch now

- The machine that already has a rule file: branch 3.
- The 2 personalised files diffed on re-install, and the case a diff misses: Flow v1 ships a rule, the user overrides it in their copy, Flow v2 deletes the rule, and the override survives pointing at nothing. Branch 4.
- `util` checked before anything else. Depending on it is acceptable only while `util` is public; if it goes private, `ptree` and `fmerge` come back into Flow. Branch 6.
- `docs/` read before anything is written into it: a project with `docs/spec/` or `docs/research/` is merged, never overwritten, and the skill creates `docs/spec/`, `docs/context/`, `docs/research/` and `docs/intake/` and nothing else. Branch 3.
- A repository the skill creates starts with `git init -b main`. `util` started on `master` and was renamed by hand 2026-08-31. Branch 3.

## Rejected, so it is not proposed again

- **Flow as an npm package**, and **Flow as a Claude Code plugin**. Both lose what the clone gives, 2026-09-17. `## How Flow ships` holds the argument.
- **A VS Code startup task running `flow doctor`**, 2026-09-17. A `SessionStart` hook does it in every session on every machine.
- **`flow docs index`, a command generating an index of the manual's headings**, 2026-09-17. "Docs don't need any commands." A stale index is a wrong page title for a day, and `docs/manual/README.md` already indexes the pages by hand.

- **Moving Flow's rules out of `~/.claude/CLAUDE.md` into `~/.claude/rules/`.** "Forget about the rules folder." Rules under `rules/` are already symlinked per file by `install.js:102` and checked by `doctor.js:236`.
- **A machine-wide overlay, and a per-user fork of the skills.** Recorded with the pipeline in `skills.md`.
- **A migration as a folder of dated scripts run in order.** Proposed 2026-09-16, rejected the same day: a migration is planned by the agent from what changed, and can be the whole workflow.
- **The answer job as one rule line pointing at the manual.** Rejected 2026-09-16: the manual grows large, the user will not read it, and a specific question needs a lookup.

## Facts from the Claude Code docs, checked 2026-09-11

- **`@path` imports work in a `CLAUDE.md`.** Relative, absolute and `~`-prefixed paths, up to 4 hops deep, skipped inside code spans and fenced blocks. Imports in `~/.claude/CLAUDE.md` load without the approval dialog. Splitting saves no context: an imported file loads at launch like inlined text.
- **Rules with no `paths` frontmatter load at launch with the same priority as `.claude/CLAUDE.md`**, user-level before project. Nothing says what wins when a user line and a Flow line contradict. One live test.
- **Auto memory is on by default** and Flow turns it off in `home/settings.json`. It stores per repository under `~/.claude/projects/<project>/memory/`.
- **Plugins install at user, project or local scope**, written to `~/.claude/settings.json`, `.claude/settings.json` or `.claude/settings.local.json`. `enabledPlugins` honors project and local settings.
- **Scalars override by scope and permission rules merge across scopes.** Settings files reload without a restart.
- **Claude Code reads `CLAUDE.md` and ignores `AGENTS.md`.**
- **HTML comments in a `CLAUDE.md` are stripped before the content reaches context.**

## Facts about Codex, from `models.md`

Researched 2026-09-06 and 2026-09-07, and they decide 4.0.

- **Codex has no import of any sort.** `@include` and `@`-reference expansion are open feature requests, `openai/codex` issues 17401 and 28739. Modularity there comes only from walking the tree. So `~/.codex/AGENTS.md` has to be a flat file that Flow generates.
- **Codex truncates past 32 KiB**, its `project_doc_max_bytes`. `home/CLAUDE.md` measured 14,595 bytes on 2026-09-07.
- **A Claude Code `@` import expands at launch**, alongside the file naming it. No second read, no extra turn, and splitting saves no context.
- Codex uses the same hook event names as Claude Code and more, and its `PreToolUse` can deny a call or rewrite its input, and fires on file edits.

## Where the idea came from

Raised by the user 2026-08-15, as one skill instead of two. The plan had been `setup-flow-globals` for a bare machine and `migrate-to-flow` for a project with its own workflow, and neither was built. The user's reason for one: the starting states are open-ended. A bare machine, a machine with Flow and a fresh project, a project with its own rule file and docs, a project half-converted. There is no clean line to cut 2 skills along. Three questions from that day sit in the map: what the skill branches on first, at 3.0 and 7.1; whether install and convert share a spine, which the approved 4-job spine answers yes to, pending the walk; the name, at 7.0.

## References

- `scripts/flow/commands/install.js` and `doctor.js`: what the 2 setup commands do today, and the fault at `install.js:125`
- `home/settings.json`: the 11 hooks, every one a `$HOME` shell line, the target state a machine diffs against
- `home/AGENTS.md`: the template, `## The user` and `## Preferences` at lines 58 and 65
- `docs/dev/checkout.md`: stable and dev checkouts, shipping by pull
- `docs/manual/reference.md` → `## Installing`: what the manual promises about the 2 personalised files today
- `lab/research/claude-code-docs/memory.md` and `settings.md`: imports, scopes, plugins
- `lab/research/claude-code-docs/tools-reference.md` → the PowerShell tool: why native Windows is out
- `lab/context/skills.md`: how a plugin is switched on per project, the domain-skills pipeline, the toolbox
- `backlog.md` → `## V1` → `### The spine`: the item, and the profile item it absorbs
