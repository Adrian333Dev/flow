# This session sets up this project

`flow init` opened this session in the project's folder. This run reads the project, sorts everything worth keeping into Flow's places, and writes one form, `migration.md`, which the user reads and approves once. It asks the user nothing. Nothing in the project changes before that yes.

Flow's rules and hooks are loaded. Nothing of the project's is: no `CLAUDE.md`, no skill, no setting, no MCP server. `~/.flow/run.json` names the project, its Claude Code memory folder, and the migration folder under `~/.flow/migrations/`. Edits inside `~/.flow/` go through without asking.

Claude Code asks before every write to a path holding a `.claude` folder, `files/` included, since it mirrors the project's `.claude/`. Before the first write there, tell the user in one line that Claude Code is about to ask, and that **allow Claude to edit its own settings for this session** covers the rest.

Flow's clone is `~/.flow/repos/flow/`. Every path below starting `project-template/` sits inside it.

The message that opened this session names the job:

- **`Set up this project.`** → every step below.
- **`Fold this machine's old memory into this project.`** → `run.json` says `"memoryOnly": true`. The project is set up already, on the user's other machine, and this machine's Claude Code memory for it was never read. `## When only the memory is read`, at the end, changes steps 1 to 3.

A message starting `Carry on` is the same job, stopped part way.

## Steps

0. **`flow init --check`.** A failure → print what it said and stop.
   - `step` in `run.json` above 0 → a run stopped part way. Carry on from the step after it, and tell the user in one line.
   - Rewrite `step` in `run.json` as each step below finishes.
1. **Read what Flow brings**: every file in `~/.flow/references/harnesses/`, every file in `project-template/`, and the form's template, `~/.flow/scripts/sessions/project-form.md`.
2. **Read the project.** `## Reading the project` below.
3. **Sort what you found**, and write the new files. `## Where each finding goes` and `## The files it writes` below.
4. **Write the form** into `~/.flow/migrations/<migration>/migration.md`, by its template. Then hand it over in one message: its full path, one line saying ticked items go and unticked ones stay, and that saying go runs it. Then stop. A `migration.md` that already exists is never rewritten: a request to save it copies it to `migration.original.md` beside it first.
5. **Take the answer.** Read `migration.md` again, against the form as you wrote it. The file wins over anything said in chat.
   - A line changed beyond its box mark or a text box, or deleted → name the line, ask what the user meant, and wait. Nothing changes before they answer.
   - Nothing changed → step 6.
   - Something changed → `## The second check` below, then wait for go.
6. **Record the originals**: `node ~/.flow/scripts/record-originals.js <path>...`, naming every path under `## Every file this changes`, ticked or not. A path with no `~` sits inside the project. A refusal → print it whole and stop: nothing has changed yet.
7. **Make the changes.** `## After the yes` below.
8. **Check it**: `flow doctor`. Its `run.json` line is expected until step 9. Any other problem → name it, with the fix doctor gives, in the last message. It never holds back the stamp.
9. **Stamp it**: `flow init --finish`.
10. **The last message**: what changed, in the form's own words; that nothing in the code is committed, while the tickets are saved on the branch `flow`, or in the Flow home where `.flow/` links there; `flow restore project` to undo it all; then "Quit this session and start `claude` again: this project's new rules load when a session starts."

## Reading the project

**Goal: know the project well enough to keep every rule, fact and piece of open work worth keeping.** The code is the truth. Where a doc disagrees with it, the code wins, and the doc becomes a ticket.

- Start with `util fs tree`.
- Read files git keeps. `git ls-files` lists them. Claude Code's own files are the exception, read whether git keeps them or not: `CLAUDE.local.md`, `.claude/settings.local.json`, and every other project path in the harness file.
- Read every rule file, at any depth: `CLAUDE.md`, `AGENTS.md`, `CLAUDE.local.md`, `.claude/rules/`, and the like.
- Read every doc written for this project: specs, plans, decisions, work lists.
- Leave documentation copied in from elsewhere unread, such as a library's own docs.
- Run `flow survey --project <folder>`: the project's rule files, settings, skills, agents, commands, MCP servers and the plugins installed for it, then the problems it found. Run `flow survey` for the machine's plugins, each with whether it is on, and `flow skills ls` for every outside skill Flow holds. Take each list as the machine's setup does, by `## What to look at` in `machine.md` beside this file: look beyond it, and log what it missed.
- Read the memory folder `run.json` names, where one exists. List the folders in `~/.claude/projects/` too: one whose project is gone from disk may be this project under an old name. List each one in the form, never read it.
- Explore the code in its own right: the stack, how the pieces fit, the commands that build and test it. Skip what doesn't matter.
- Use subagents where they help.
- A stopped run reads again. Files already under `files/` stay.

## Where each finding goes

**A line kept is a line the agent would get wrong without it.** Standard practice is never a rule: "all LLM calls go through `LlmService`" is ordinary design a capable agent reads off the code.

- **A rule for working in this project** → `CLAUDE.md` → `## Rules`. A rule from a subfolder's rule file names that folder.
- **A fact most sessions need** → `CLAUDE.md`, wherever it fits.
- **A lasting fact only some work needs** (a deploy path, a service's limit) → `docs/context/<subject>.md`, one question per file. Keep each file short.
- **Open work from an explicit list** → one ticket per item. Never a ticket for a feature a spec describes.
- **An idea nobody committed to** → `.flow/inbox.md`, raw.
- **A lesson about an outside tool** (a library misbehaving, and the workaround) → `~/.flow/wiki/<tool>/findings/<what-was-learned>.md`, with no detail of the project or its client. `<tool>` is the tool's GitHub repository name.
- **Any other lesson worth reusing** → `.flow/findings/<what-was-learned>.md`.
- **How the user wants Claude to work, or a fact about them** → `~/.flow/CLAUDE.md`, `## Preferences` or `## The user`. Same test as the machine's setup: would they still want it had Flow been there from the start. Skip a line already there.
- **A Flow rule does the same job** → `dropped.md` beside the form: the line, then the rule's id.
- **Anything else** → dropped too, with no rule named.

**Always 2 more tickets**, each where it applies, made with `--priority high`, since each finishes the setup:

- **"Write the product spec"** → where the project holds plans, specs or decisions. Its body lists each source with one line saying what it holds. Setup writes no spec.
- **"Find skills, plugins and MCP servers for this stack"** → where there is code. Its body names the stack and what is already installed.

## What stays and what goes

**Everything the project's settings and folders hold gets the machine's competitor test**, `## The competitor test` in `machine.md` beside this file, one thing at a time: plugins in `enabledPlugins`, hooks, permissions, MCP servers in `.mcp.json`, skills, agents, commands, and both settings files.

- **Tells Claude how to work in every session** (a plugin that injects instructions, a `SessionStart` hook) → removed with no box, under `## What Flow sets up`.
- **Overlaps Flow, and fires only when invoked or matched** → a box under `## 🔴 Removed unless you untick it`.
- **Knows the project's field** → stays, named in one line.
- **A permission** stays, unless it undoes one of Flow's `deny` rules.
- **A plugin** is switched off in the project's `.claude/settings.json`. Never uninstalled.
- **A skill from a source Flow knows** → `flow skills on <name>`, after its folder's delete.
- **Any other outside skill** → sorted by `~/.flow/references/knowledge.md` → `## An outside skill`, and added as that section says.
- **The memory folder** → a box under `## 🔴 Removed unless you untick it`.
- **The project's own `AGENTS.md`**, once its rules are read into `CLAUDE.md` → a box under `## 🔴 Removed unless you untick it`. Claude skips it beside a `CLAUDE.md`, so a kept copy only goes stale.

**A plugin or an outside skill that is off here, and the project's code uses it** → a box under `## Switched on for this project`, naming what in the code uses it. Off here means a plugin `flow survey` shows `off`, or a skill `flow skills ls` shows off. Used whole only: a skill waiting for a harvest stays off.

- **A plugin** → `"<id>": true` under `enabledPlugins` in `files/…/.claude/settings.json`.
- **A skill** → `flow skills on <name>`, run at go.

## The files it writes

Every new version goes under `files/<full path>`, beside the form. `project-template/` is the base for each file it holds.

- **`CLAUDE.md`**: the template, with `## Project` written from the code and the rest from what was sorted into it, in place of what it holds now. Under 100 lines.
- **`.claude/settings.json`**: the project's file with the template's keys added, and what the form removes taken out.
- **`.claude/settings.local.json`**: the same, where one exists.
- **`.gitignore`**: the project's lines, then each line of the template's it lacks.
- **`.uncommitted-include`**: the template's, where the project has none.
- **`.flow/settings.json`**: a copy of the project's own, which `flow init` wrote before this session opened. It holds `ticketPrefix`, the word every ticket id here starts with, and `flow` reads a project by this folder existing.
- **`.flow/tickets/`**: made by `flow new` once `.flow/settings.json` is written, run with `FLOW_PROJECT` set to the project's folder under `files/`.
- **`.flow/inbox.md`**, **`.flow/findings/`**, **`docs/context/`**: where there is something to put in them.
- **`~/.flow/CLAUDE.md`**: the machine's file, with the user's new lines added.
- **`~/.flow/wiki/<tool>/findings/`**: one file per lesson about a tool.

Build JSON with `node`, never by hand. A settings file that doesn't parse is a fault to fix before step 4.

## The second check

One message, covering every change the user made:

- Each untick: what it costs, in one line.
- Each edited line: your short version of the new text.
- A ticked memory folder from under an old name: read it now, sort it like the rest, and list what it added.
- Then: go keeps these changes. Tick one again, then say go, to undo it.

There is no third check. The next go runs step 6.

## After the yes

Each unticked line means Flow leaves that thing exactly as the project has it. First carry the form into `files/`:

- **A hook or a plugin** unticked → put it back into `files/…/.claude/settings.json`.
- **A plugin under `## Switched on for this project`** unticked → take its key out of `files/…/.claude/settings.json`.
- **A line under `## Moving into Flow's files`** unticked → drop the files it wrote from `files/`.
- **The line of tickets from open-work lists** unticked → drop those tickets from `files/…/.flow/tickets/`.

Then make each change, in the order of the file list, with `.flow/settings.json` copied in before any `flow` command:

- **A file or folder with a new version under `files/`** → copy it into place. A real file newer than its new version changed after you built that version, which `[ <path> -nt files/<path> ]` tells: build the new version again from the file as it is now, and name it in the last message.
- **A path deleted**, such as a skill, the memory folder or `AGENTS.md` → `rm -rf`, unless its line is unticked.
- **A command**, such as `flow skills on <name>` → run it, unless its line is unticked.
- **A path the file list leaves out** → never touched.

A change that fails → say which and why, and stop. A run carried on checks each change against the disk, and makes only the ones not made yet.

## When only the memory is read

- **Step 1**: read `project-template/CLAUDE.md` and the form's template alone.
- **Step 2**: read the memory folder `run.json` names, and the project's own `CLAUDE.md` and `docs/context/`, to know what is already kept. Nothing else.
- **Step 3**: sort each memory line by `## Where each finding goes`. Skip a line the project's files already say. No ticket from the 2 always-written ones.
- **The form** holds only the sections with a line, and the memory folder's box under `## 🔴 Removed unless you untick it`.
- **Step 9 is `flow init --finish` all the same.** It ends the run and leaves the project's version alone.
