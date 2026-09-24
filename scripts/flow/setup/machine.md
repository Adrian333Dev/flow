# This session sets up this machine

`flow install` made Flow's links, cloned what Flow reads, and opened this session through `flow setup`. This run does the rest: Flow's rule file, the line loading it, Flow's keys in `~/.claude/settings.json`, and whatever the machine already holds that works against Flow. It asks the user nothing. Everything goes into one form, `migration.md`, which the user reads, edits and approves once. Nothing on disk outside `~/.flow/` changes before that yes.

The session runs in safe mode, so no skill, plugin or hook of the machine's is loaded, Flow's included. It starts in the home folder, so reading anything under `~` asks nothing. Edits inside `~/.flow/` go through without asking. So do `flow setup`, `flow doctor`, `util fs tree`, `util fs merge` and `node ~/.flow/scripts/apply-migration.js`, typed exactly so.

One edit asks anyway. Claude Code asks before every write to a path holding a `.claude` folder, `~/.flow/` or not, and `files/` mirrors `~/.claude/`. Before the first write there, tell the user in one line that Claude Code is about to ask, and that **allow Claude to edit its own settings for this session** covers the rest.

Flow's clone is `~/.flow/repos/flow/`. Every path below starting `home/` sits inside it.

## Steps

0. **`flow setup check`.** A failure → print what it said and stop. `~/.flow/version` exists → say this machine is already set up, and stop.
   - `~/.flow/run.json` has a `step` above 0 → a run stopped part way. Carry on from the step after it, and tell the user in one line.
   - Rewrite `step` in `run.json` as each step below finishes.
1. **Read what Flow brings**: every file in `~/.flow/references/harnesses/`, `home/AGENTS.md`, `home/CLAUDE.md`, `home/settings.json`, and the form's template, `~/.flow/scripts/flow/setup/form.md`.
2. **Survey the machine.** `## What to look at` below. Read every rule file whole. For a skill, an agent or a command, read its `description` first, and open the body only where the description leaves the competitor test open.
3. **Sort what you found.** `## The competitor test` and `## Harvesting` below.
4. **Write the migration** into `~/.flow/migrations/<migration>/`, the folder `run.json` names as `migration`: `migration.md` by the form's template, and under `files/` the new version of every path a `write` line names, at `files/<full path>`. `## The files it writes` below.
5. **Hand over the form.** One message: the full path of `migration.md`, one line saying ticked items go and unticked ones stay, and that saying go runs it. Then stop.
6. **Take the answer.** Read `migration.md` again. The file wins over anything said in chat.
   - Nothing changed → step 7.
   - Something changed → `## The second check` below, then wait for go.
7. **Carry the form into the files.** `## After the yes` below.
8. **Apply it**: `node ~/.flow/scripts/apply-migration.js machine/<folder>`. A refusal → print it whole and stop. It stopped part way → say which line and why, and stop: running it again carries on from that line.
9. **Check it**: `flow doctor`.
   - A problem that says to run `flow setup` means this run left something undone. Fix it with a second migration in a new folder, shown to the user the same way, then check again.
   - Any other problem → name it, with the fix doctor gives, in the last message. It never holds back the stamp.
10. **Stamp it**: `flow setup finish`.
11. **The last message**: what changed, in the form's own words; the 2 commands that undo it, `flow restore machine` for the whole setup and `flow uninstall` for all of Flow; then "Quit this session and start `claude` again: Flow's rules and hooks load when a session starts."

## What to look at

The harness files name every path. Read `CLAUDE_CONFIG_DIR` before any of them. Look in this order:

1. **An older Flow**: any link into a Flow clone that `flow install` did not make just now, and any copy of a Flow rule file or skill. Each one is a `delete` line.
2. **Rule files**: `~/.claude/CLAUDE.md` and every file it imports with `@`, `~/.claude/rules/`, `~/.agents/AGENTS.md`.
3. **Skills, by all 4 routes**: a real folder in `~/.claude/skills/`, a link there into `~/.agents/skills/` (installed by `npx skills`, which names its repository in `~/.agents/.skill-lock.json`), the account-synced tree under `~/.claude/skills/synced/`, and plugins, read from `~/.claude/plugins/installed_plugins.json`. A plugin's skills, hooks and agents sit in its `installPath`.
4. **`~/.claude/settings.json`**, key by key, and `~/.claude/agents/`, `commands/` and `output-styles/`.

Never open a project, or a project's memory under `~/.claude/projects/`. `/flow:setup-project` reads those. Never open a transcript, a cache or the login.

## What goes in the form

**A line appears only where saying go changes something.** 2 tests, by what the thing is:

- **A setting is judged by its value.** The machine already holds Flow's value → no line. Memory already off gets no box, and a `deny` rule already present gets no mention.
- **An installed thing is judged by being there.** A plugin, a skill, a hook or an agent that fails the competitor test gets its line even when it is switched off, since it can be switched back on.

A section left with no line goes, heading included. `## Flow's skills` always stays.

## The competitor test

**The question is whether a thing tells Claude how to work on ground Flow already rules on.** Ground Flow rules on: every heading in `home/AGENTS.md`, and every job a Flow skill does. Where to put what you found:

- **Tells Claude how to work in every session**, invoked or not (a `SessionStart` hook, a rule file, a plugin that injects instructions) → a line under `### Always removed`, with no box. Flow cannot work beside it.
- **Overlaps Flow, and fires only when invoked or matched** (a skill, an agent, a command) → a box under `### Works against Flow's rules`. The line says what it does in plain words, then what Flow does instead.
- **Synced from the user's Claude account** and overlapping → a box too, removed through `skillOverrides`. Deleting its folder brings it back at the next sync.
- **Knows a subject Flow does not** (a framework, a service, a file format), or tells Claude how to work where Flow says nothing → it stays. A plugin or a synced skill that stays is named under `Left as they are`. Anything else that stays is left out of the form.
- **A plugin** goes by `claude plugin uninstall <name>@<marketplace>`. Never switch it off, and never delete its folder.
- **A hook of the user's own**, not from a plugin, goes through the same test. One that stays is written into `hooks` beside Flow's.
- **An MCP server** stays, and is left out of the form.

**Taking over an outside skill** is its own section of the form, for every skill that stays:

- **Installed by `npx skills`** → Flow's `flow skills add <owner/repo> <name> --machine`, the repository read from `~/.agents/.skill-lock.json`. Its lines: delete both copies, run the add, then write the lock file with that entry removed. Only taken-over entries leave the lock file.
- **A real folder copied in by hand** → moved into `~/.flow/private-skills/<name>/`, then `flow skills on <name> --machine`.

## Harvesting

Every line of every rule file found goes in 1 of 3 places:

- **A Flow rule does the same job** → dropped. Drop a line only where you can name that rule.
- **How the user wants Claude to work, and they would still want it had Flow been there from the start** → `### Your preferences`. `Never use em dashes` passes. `Always show me a diff before you edit` fails: it works around a missing workflow.
- **True of the user, and it changes what Claude does** → `### About you`. `Colour-blind, so never tell things apart by red and green alone.` Never a skill level, never what they don't know, never what they are working on, and never what every Flow user shares, such as dictating by voice.

Anything else is dropped too. Both boxes start empty, and most machines leave `### About you` that way. Rewrite each kept line in plain words, one rule per line.

## The files it writes

- **`~/.flow/AGENTS.md`**: `home/AGENTS.md`, with `## Preferences` and `## The user` holding the 2 boxes.
- **`~/.agents/AGENTS.md`**: a link to `~/.flow/AGENTS.md`, made by a `run` line when the migration applies, never in `files/`. `flow sync` carries `~/.flow/`, so the rules reach the user's other machine.
- **`~/.claude/CLAUDE.md`**: `home/CLAUDE.md`, the one import line.
- **`~/.claude/settings.json`**: the machine's file, with Flow's keys applied:
  - `hooks`: `home/settings.json`'s, plus each hook of the user's that stayed.
  - `permissions`: the machine's `allow` and `deny` with the template's added, and the template's `defaultMode` and `disableBypassPermissionsMode`.
  - Every other key in `home/settings.json`: the template's value.
  - `skillOverrides`: `"batch": "off"`, plus `"off"` for each synced skill ticked.
  - `enabledPlugins`: left for `claude plugin uninstall` to change. Its `run` line comes after this file's `write` line.
  - Every key the template does not name stays exactly as it is.
- **`~/.agents/.skill-lock.json`**, where a takeover changes it.

Build JSON with `node`, never by hand. A settings file that does not parse, or a hook that points at a missing script, is a fault to fix before step 5.

## The second check

One message, covering every change the user made. Untick in red or green, a deleted line counting as unticked, and an edited box:

- Each untick: what it costs, in one line.
- Each edited box: your short version of the new text.
- Then: go keeps these changes. Tick one again, then say go, to undo it.

There is no third check. The next go runs step 7.

## After the yes

Each unticked line means Flow leaves that thing exactly as the machine has it:

- **A key or a `deny` rule** → take it out of `files/…/settings.json`. Where the machine had its own value, keep that value.
- **A skill, a rule file, a hook or a plugin** → drop its `delete` or `run` line, or keep the hook in `hooks`.
- **A takeover** → drop all of its lines.
- **A green line**: `cleanupPeriodDays` keeps the machine's value. `skillsAutoUpdate`, `reminder` and `sessionCheck` are written `false` into `~/.flow/settings.json`, with a `write` line for it.

Write each box's text into the 2 sections of `files/…/.flow/AGENTS.md`. Every `write` line still needs its file under `files/`, and every `delete` line still needs to name a path.
