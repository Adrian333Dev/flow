# This session sets up this project

`flow setup project` opened this session in the project's folder. This run reads the project, sorts everything worth keeping into Flow's places, and writes one form, `migration.md`, which the user reads and approves once. It asks the user nothing. Nothing in the project changes before that yes.

Flow's rules and hooks are loaded. Nothing of the project's is: no `CLAUDE.md`, no skill, no setting, no MCP server. `~/.flow/run.json` names the project, its Claude Code memory folder, and the migration folder under `~/.flow/migrations/`. Edits inside `~/.flow/` go through without asking.

One edit asks anyway. Claude Code asks before every write to a path holding a `.claude` folder, and `files/` mirrors the project's `.claude/`. Before the first write there, tell the user in one line that Claude Code is about to ask, and that **allow Claude to edit its own settings for this session** covers the rest.

Flow's clone is `~/.flow/repos/flow/`. Every path below starting `project-template/` sits inside it.

## Steps

0. **`flow setup project check`.** A failure → print what it said and stop.
   - `step` in `run.json` above 0 → a run stopped part way. Carry on from the step after it, and tell the user in one line.
   - Rewrite `step` in `run.json` as each step below finishes.
1. **Read what Flow brings**: every file in `~/.flow/references/harnesses/`, every file in `project-template/`, and the form's template, `~/.flow/scripts/flow/setup/project-form.md`.
2. **Read the project.** `## Reading the project` below.
3. **Sort what you found**, and write the new files. `## Where each finding goes` and `## The files it writes` below.
4. **Write the form** into `~/.flow/migrations/<migration>/migration.md`, by its template. Then hand it over in one message: its full path, one line saying ticked items go and unticked ones stay, and that saying go runs it. Then stop.
5. **Take the answer.** Read `migration.md` again. The file wins over anything said in chat.
   - Nothing changed → step 6.
   - Something changed → `## The second check` below, then wait for go.
6. **Carry the form into the files.** `## After the yes` below.
7. **Apply it**: `node ~/.flow/scripts/apply-migration.js <migration>`. A refusal → print it whole and stop. It stopped part way → say which line and why, and stop: running it again carries on from that line.
8. **Check it**: `flow doctor`. Its `run.json` line is expected until step 9. Any other problem → name it, with the fix doctor gives, in the last message. It never holds back the stamp.
9. **Stamp it**: `flow setup project finish`.
10. **The last message**: what changed, in the form's own words; that nothing is committed; `flow restore project` to undo it all; then "Quit this session and start `claude` again: this project's new rules load when a session starts."

## Reading the project

**Goal: know the project well enough to keep every rule, fact and piece of open work worth keeping.** The code is the truth. Where a doc disagrees with it, the code wins, and the doc becomes a ticket.

- Start with `util fs tree`. Its line counts show a large file before you open it.
- Read files git keeps. `git ls-files` lists them. Claude Code's own files are the exception, read whether git keeps them or not: `CLAUDE.local.md`, `.claude/settings.local.json`, and every other project path in the harness file.
- Read every rule file, at any depth: `CLAUDE.md`, `AGENTS.md`, `CLAUDE.local.md`, `.claude/rules/`, and the like.
- Read every doc written for this project: specs, plans, decisions, work lists.
- Leave documentation copied in from elsewhere unread, such as a library's own docs.
- Read the memory folder `run.json` names, where one exists. List the folders in `~/.claude/projects/` too: one whose project is gone from disk may be this project under an old name. List each one in the form, never read it.
- Explore the code in its own right: the stack, how the pieces fit, the commands that build and test it. Skip what doesn't matter.
- Use subagents where they help.
- A stopped run reads again. Files already under `files/` stay.

## Where each finding goes

**A line kept is a line the agent would get wrong without it.** Standard practice is never a rule: "all LLM calls go through `LlmService`" is ordinary design a capable agent reads off the code.

- **A rule for working in this project** → `AGENTS.md`. A rule from a subfolder's rule file names that folder.
- **A lasting fact the code doesn't show quickly** (a verified command, a deploy path, a settled convention) → `docs/context/<subject>.md`, one question per file. Keep each file short.
- **Open work from an explicit list** → one ticket per item. Never a ticket for a feature a spec describes.
- **An idea nobody committed to** → `.flow/inbox.md`, raw.
- **A lesson about a tool** (a library misbehaving, and the workaround) → `.flow/findings/<what-was-learned>.md`.
- **How the user wants Claude to work, or a fact about them** → `~/.flow/AGENTS.md`, `## Preferences` or `## The user`. Same test as the machine's setup: would they still want it had Flow been there from the start. Skip a line already there.
- **A Flow rule does the same job** → `dropped.md` beside the form: the line, then the rule's id.
- **Anything else** → dropped too, with no rule named.

**Always 2 more tickets**, each where it applies:

- **"Write the product spec"** → where the project holds plans, specs or decisions. Its body lists each source with one line saying what it holds. Setup writes no spec.
- **"Find skills, plugins and MCP servers for this stack"** → where there is code. Its body names the stack and what is already installed.

## What stays and what goes

**Everything the project's settings and folders hold gets the machine's competitor test**, `## The competitor test` in `machine.md` beside this file, one thing at a time: plugins in `enabledPlugins`, hooks, permissions, MCP servers in `.mcp.json`, skills, agents, commands, and both settings files.

- **Tells Claude how to work in every session** (a plugin that injects instructions, a `SessionStart` hook) → removed with no box, under `## What Flow sets up`.
- **Overlaps Flow, and fires only when invoked or matched** → a box under `## 🔴 Removed unless you untick it`.
- **Knows the project's field** → stays, named in one line.
- **A permission** stays, unless it undoes one of Flow's `deny` rules.
- **A plugin** is switched off in the project's `.claude/settings.json`. Never uninstalled: other projects may use it.
- **A skill from a source Flow knows** → `flow skills on <name>`, after its folder's delete.
- **The memory folder** → a box under `## 🔴 Removed unless you untick it`. Flow keeps memory off.

## The files it writes

Every new version goes under `files/<full path>`, beside the form. `project-template/` is the base for each file it holds.

- **`AGENTS.md`**: the template's title and `## Project`, filled from the code, then the kept rules.
- **`CLAUDE.md`**: the template's, the one line `@AGENTS.md`.
- **`.claude/settings.json`**: the project's file with the template's keys added, and what the form removes taken out.
- **`.claude/settings.local.json`**: the same, where one exists.
- **`.gitignore`**: the project's lines, then each line of the template's it lacks.
- **`.work-include`**: the template's, where the project has none.
- **`.flow/settings.json`**: `{}`. `flow` reads a project by this folder existing.
- **`.flow/tickets/`**: made by `flow new` once `.flow/settings.json` is written, run with `FLOW_PROJECT` set to the project's folder under `files/`, so every ticket has the format and number `flow` gives it.
- **`.flow/inbox.md`**, **`.flow/findings/`**, **`docs/context/`**: where there is something to put in them.
- **`~/.flow/AGENTS.md`**: the machine's file, with the user's new lines added.

Build JSON with `node`, never by hand. A settings file that doesn't parse is a fault to fix before step 4.

## The second check

One message, covering every change the user made:

- Each untick: what it costs, in one line.
- Each edited line: your short version of the new text.
- A ticked memory folder from under an old name: read it now, sort it like the rest, and list what it added.
- Then: go keeps these changes. Tick one again, then say go, to undo it.

There is no third check. The next go runs step 6.

## After the yes

Each unticked line means Flow leaves that thing exactly as the project has it:

- **A skill, a hook, a plugin or the memory folder** → drop its `delete` line, or put it back into `files/…/.claude/settings.json`.
- **A line under `## Moving into Flow's files`** → drop the files it wrote from `files/`, with their `write` lines.
- **The line of tickets from open-work lists** → drop those tickets from `files/…/.flow/tickets/`.

Every `write` line still needs its file under `files/`, and every `delete` line still needs to name a path.
