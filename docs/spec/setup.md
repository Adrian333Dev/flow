# Setup

How Flow gets onto a machine and into a project, stays current, travels to a second machine, and comes off again. One pasted line installs Flow and opens a setup session. That session reads what the machine already holds and hands the user one form. Nothing changes before the user says go. `flow init` does the same for a project. `flow update` brings either one up to date, `flow sync` carries the machine's Flow to the user's other machines, and `flow restore` and `flow uninstall` put everything back.

## Scope

- **In**: `install.sh`, `flow install`, the machine's setup session and its form, `flow init` and the project's setup session, `flow update` and its session, the changelog and the version stamps, `flow sync` and the Flow home, `flow doctor`, the originals, `flow restore` and `flow uninstall`.
- **Out**: where a project's tickets live and `flow store`, in `docs/spec/tickets.md`. Switching skills on and off, and skill sources, in `docs/spec/skills.md`. The hooks, the permissions and the session-start line, in `docs/spec/product.md` → `### Hooks and guardrails`.

## A machine, from nothing to set up

```text
   curl … | bash
        │
        ▼
 ┌──────────────────────┐
 │      install.sh      │   checks git, node, claude and gh, then clones Flow
 └──────────────────────┘
        │
        ▼
 ┌──────────────────────┐
 │     flow install     │   signs gh in, finds the Flow home, names the machine,
 └──────────────────────┘   links and clones, records the original
        │  setup-prompt.md
        ▼
 ┌──────────────────────┐
 │    setup session     │   surveys the machine, writes the form, stops
 └──────────────────────┘
        │  migration.md, ticked by the user
        ▼
 ┌──────────────────────┐
 │    setup session     │   records every listed path, then makes the ticked changes
 └──────────────────────┘
        │
        ▼
 ┌──────────────────────┐
 │ flow install --finish│   runs flow doctor, then stamps ~/.flow/version
 └──────────────────────┘
```

## Behaviors

### Installing on a machine

- `V1` **One pasted line installs Flow**: `curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/<tag>/install.sh | bash`. `install.sh` checks for git, node, claude and gh, clones Flow into `~/.flow/repos/flow/`, and runs `flow install`. It is bash because it runs before Flow is on disk. `--use <folder>` skips the clone. Ruled by the user 2026-09-23.
- `V1` **Prerequisites are checked by running them**: the 4 programs on the PATH, and Claude Code at `MIN_CLAUDE` (2.1.287) or later. A failure stops the run. A prerequisite is what Flow calls and never installs. Everything Flow installs itself is repaired, never a wall.
- `V1` **`flow install` checks everything before it links anything.** It signs `gh` in, finds the Flow home at `<login>/flow-home`, checks the repository is a Flow home, and asks the one question last: the machine's name. A failed check prints `stopped: <why>`, exits 1, and links nothing.
- `V1` **The machine's name is offered, never invented**: read from the hardware, as `<laptop|pc|server>-<wsl|distro>`, or a Mac's model, `macbook-pro`. It is shown dim, so Enter keeps it and the first key erases it. It is saved as git's `flow.machine`. With no terminal, the offer is taken.
- `V1` **`flow install` links per item, and never replaces anything that is not a link.** It clones util, the toolbox and every skill source with `--depth 1`, and records the machine's original before it creates anything.
- `V1` **`flow install` writes no rule file.** The setup session writes it, since a copy made before the form holds nothing of the user.
- `V1` **A second `flow install` leaves a set-up machine alone**: it rebuilds Flow's links, clones what is missing, and opens no session.
- `V1` **A machine installs the tag its other machines run**, `v<number>`, read from the highest `flowVersion` in the Flow home's machine records. Never the tip of `main`, which may hold a change pushed halfway.
- `V1` **Every `flow` command refuses until setup finishes**, except `install`, `doctor`, `survey`, `restore` and `uninstall`. No hook can catch a skipped setup: the hooks only reach a machine through setup.
- `never` **Flow shipped through npm**: its content is files the user reads and edits, and `node_modules` is neither.
- `never` **Flow shipped as a plugin alone**: a plugin cannot write `~/.claude/CLAUDE.md` or `~/.local/bin`, half of Flow.

### The machine's setup session

- `V1` **`flow install` opens the setup session itself**, in safe mode: `claude --safe-mode --permission-mode acceptEdits --add-dir ~/.flow --settings ~/.flow/setup-settings.json`. Safe mode loads no plugin or skill, so nothing it is about to remove runs beside it. Ruled 2026-09-24, after a setup skill ran beside the plugins it removed.
- `V1` **The session asks no question.** The form, `migration.md`, is the one thing the user touches. Ruled by the user 2026-09-21: `## The user` fills during work, so asking for it at setup buys nothing.
- `V1` **The survey starts from `flow survey`**, which lists every place Claude Code reads its setup from, each item with whether it is on, in plain text. It changes nothing. Ruled by the user 2026-10-07: on 2026-10-06 the agent's own survey missed the synced plugins and a util source listed twice, and a script can be tested where a prompt cannot. `fw-78`.
- `V1` **The agent looks beyond the survey's list, and beyond its problems.** Anything it finds goes in the form, and into the failure log as a miss to teach the script. Ruled by the user 2026-10-07: a machine the script was never written for holds something the script cannot see.
- `V1` **The disk says what exists, and `claude plugin list` says whether it is on**, run with `CLAUDE_CODE_SAFE_MODE` removed. The setup session's `--safe-mode` passes that variable to every command it runs, and the list then hides every synced plugin. Verified 2026-10-07 on 2.1.292. Whether a plugin is on is Claude Code's own rule across 4 scopes, so the script never copies it. Where the 2 disagree, the survey prints both.
- `V1` **The survey names the problems a machine can see**: a source listed twice, 2 clones of one repository, the disk and the list disagreeing, a link pointing nowhere, a settings file that is not JSON, a link into a Flow clone `flow install` did not make. `flow doctor` reports the same group.
- `V1` **A source the survey cannot read prints `unread:` and the error, and the rest still lists.** The form names each one under its own heading. Only an unreadable Claude Code folder stops the survey. An empty source and an unread one never look the same.
- `V1` **The form shows only what saying go changes.** A setting is judged by its value, so a key already set Flow's way gets no line. An installed thing is judged by being there, so a plugin switched off still gets its line.
- `V1` **The form's sections**, in the skeleton under `### The forms`: ❌ what works against Flow's rules. ⏸️ what is rarely used and sent with every message. ⏸️ plugins switched on only in the projects that use them. ❌ skills deleted because Flow has its own. Outside skills Flow takes over. The user's preferences and facts about the user. ✅ what Flow sets up, what is always removed, and Flow's skills. Every file it changes.
- `V1` **The competitor test**: anything telling Claude how to work on ground Flow already rules on goes. Something working in every session is always removed. A skill, agent, command or plugin that fires only when invoked gets a box. Anything knowing a subject Flow does not cover stays. An MCP server outside any plugin stays, and is left out of the form.
- `V1` **A plugin's line names every MCP server it brings**, since they go or stay with it. The survey prints the whole list, never cut at 8, so the form can name each one. Ruled by the user 2026-10-08, `fw-20`: the synced `engineering` plugin brought 10 servers needing sign-in, and no form line named them.
- `V1` **A plugin that goes is uninstalled**, never switched off. One synced from the claude.ai account is switched off with `claude plugin disable <name>@synced`, since uninstall cannot reach it. A plugin only some projects use is switched off machine-wide, and `flow init` switches it on where a project uses it.
- `V1` **A plugin installed for one project stays out of the machine's form.** It loads only in that project's sessions, so it never meets Flow's global session. Ruled by the user 2026-10-07, after the machine form wrote a machine-wide uninstall for 3 of them and edited another repository's committed settings.
- `V1` **The harvest drops a line from an old rule file only where it can name the Flow rule replacing it.** A kept preference passes a second test: the user would still want it had Flow been there from the start. `Never use em dashes` passes. `Always show me a diff before you edit` fails.
- `V1` **`## The user` never holds a skill level, what the user does not know, or what they are working on.** A level goes stale and makes the agent skip explanations. Ruled by the user 2026-09-21.
- `V1` **Every untick gets one second check**, naming what each costs. There is no third.
- `V1` **`~/.claude/CLAUDE.md` is replaced whole by a link to `~/.flow/CLAUDE.md`**, the copy `flow sync` carries.
- `V1` **A machine whose Flow home already holds `~/.flow/CLAUDE.md`** starts the 2 boxes from it, and adds only what the harvest finds new.
- `never` **A pick-list question per setting**, `AskUserQuestion`: switching it on for one form a machine costs its schema in every request. Ruled by the user 2026-09-21.
- `never` **A synced skill removed because this machine can't run it**, such as `computer-use` on Linux. Setup judges a synced skill by the competitor test alone, and whether one runs here is the user's own business. Ruled by the user 2026-10-08, `fw-20`.
- `never` **A "delete" choice for a synced plugin.** The next sync brings it back, so setup only switches one off. Dropped 2026-10-08, `fw-20`.
- `never` **A box turning both sync settings off** (`syncClaudeAiSkills`, `syncClaudeAiPlugins`) where every synced item competes with Flow. A synced skill is judged by the competitor test alone, and one knowing a file format such as `docx` or `pdf` always stays, so the box would almost never show. Dropped 2026-10-08, `fw-20`.
- `never` **Auto mode switched off for every session** to let setup write: `--settings` switches it off for the setup session alone.
- `never` **A machine-wide MCP server switched on only in the projects that use it.** Dropped by the user 2026-10-05 for the simplest version, once the build showed its cost. Claude Code keeps `disabledMcpServers` per project, so Flow would have had to remove the server, keep its key outside the Flow home, and add a command to put it back per project. Tool search makes the saving small, since a tool's description loads only when the agent searches for it. Reopen only where tool search is off.

### Migrations

A migration is what a setup session proposes: `migration.md`, the form the user reads and ticks, and the new version of each file it writes under `files/`.

- `V1` **The session applies its own migration.** At go, it reads the form and makes each ticked change with its own tools. Ruled by the user 2026-10-08: a script running the form added more complication than it removed.
- `V1` **Before its first change, the session records every path the form's file list names**, with one command, `record-originals.js <path>...`. Recording is the one job the session never does by hand: one path missed is a file `flow restore` cannot bring back.
- `V1` **The session changes no path its file list leaves out.**
- `V1` **A real file changed after the session built its new version is built again at go**, from the file as it is now, and named in the last message. `[ <path> -nt files/<path> ]` tells. Ruled by the user 2026-10-08, at `fw-87`'s plan: another session or `/config` can change `~/.claude/settings.json` while the user reads the form, and copying the old new version would undo it. `apply-migration.js` held the same check in code.
- `V1` **A stopped setup carries on where it stopped**: the command that opened it opens a new session, which reads what is already done. `~/.flow/run.json` names the step reached, and `flow doctor` and the session-start line name that command.
- `V1` **A file Claude Code rewrites itself, such as `~/.claude.json`, changes only through Claude Code's own command**, such as `claude plugin uninstall`, never an edit.
- `V1` **Every migration is shown whole, and runs on one yes**, with no size threshold. A threshold would make the agent judge which migration is small, and a hook change reads as one line while rewiring every session.

### The forms

The machine's, the project's and the restore's. An update has none, under `### Updating`. Each template's instructions point here, so a section added later keeps the same shape. The design behind each line: `.flow/tickets/fw-83-setup-forms-are/groundwork/map.md`.

- `V1` **A ticked box means Flow acts, and an unticked box means Flow leaves the thing as it is.** Never a box ticked to stop an action. Ruled by the user 2026-10-08, after a `Keep Codex as it is` box was ticked to do nothing.
- `V1` **A change an untick cannot leave undone takes no box.** Moving the old rules and facts into Flow's files is listed under ✅ with its counts, and the user edits the new file under `files/` before go. Unticked, setup would still replace the old file, so the rules would be lost, never left as they were.
- `V1` **Every form takes one skeleton, choices first**:
  1. A 3-line key: ticked, unticked, say go. Then the count of boxes and text boxes.
  2. Each section with boxes: ❌ removed, ⏸️ switched off, then the form's own, such as tickets or plugins switched on for a project.
  3. The text boxes.
  4. ✅ Set up with no choice, grouped under bold labels, with Flow's settings guide linked once at its top.
  5. Every file this changes, grouped under ➕ written, ➖ deleted and ▶️ commands, in the order they run.

  The first machine form put its first box at line 61 of 125, under 34 lines with no choice. The no-choice part stays in the form, since the user approves the whole change.
- `V1` **Every line takes one shape**: `- [x] **name** type: what happens to it. Why, in one sentence.` A name is bold, and a path or a command is in backticks. A settings key stays off the line: the user reads what a thing does, and `docs/reference/settings.md` holds the key.
- `V1` **7 emoji, each with one meaning**: ➕ written, ➖ deleted, ▶️ command, ❌ removed, ⏸️ switched off, ✅ set up with no choice, ⚠️ once. ⚠️ sits in the one section where unticking hurts, never repeated. A section with no obvious emoji takes none. Ruled by the user 2026-10-08: a symbol the reader has to puzzle out adds noise, so 🗑️ was refused.
- `V1` **A Claude Code feature links to Claude Code's own page**, as `([docs][name])`, with every address at the end of the form, so the line stays short.
- `V1` **Each template is its own file in `scripts/templates/`**, `setup-machine.md` and `setup-project.md`, named for the form's `type`. The agent copies one whole, then fills its gaps, so every fixed line stays as written. The restore form is drawn by `restore-form.js`, which keeps the same principles.
- `V1` **The form's file list names every path the ticked boxes and the ✅ section change.** It is written with every box ticked, and it is the list the session records before acting.
- `V1` **At go, an edit beyond a box mark or a text box stops the session**, naming the line, until the user says what they meant. A line deleted from the ✅ section cancels nothing, so a user who deleted one may believe they stopped a change.

### Setting up a project

- `V1` **`flow init` sets up a project in one command**, walking its states in order: `git init` where there is no repository, the top folder, a stopped run, already set up, where the tickets live (`docs/spec/tickets.md`), `.flow/` in `.gitignore`, the prefix, and the template.
- `V1` **An empty folder gets `project-template/` at once**, with no session. Competing files open the setup session with no question. Any other file asks `Read them in a setup session first? (y/N)`, the template being the default.
- `V1` **The project's setup session loads Flow and nothing of the project's**: `claude --setting-sources user --strict-mcp-config`, plus `--add-dir` for `~/.flow` and the project's memory folder. The project's `CLAUDE.md`, skills, commands, subagents, settings and MCP servers stay unloaded, and stay in place until the yes. Probed 2026-09-25.
- `V1` **The project's survey is `flow survey --project <folder>`**: its `.claude/`, its `CLAUDE.md`, `CLAUDE.local.md` and `AGENTS.md`, its `.mcp.json`, and the plugins Claude Code's install record names for the folder. The same rules as the machine's survey hold.
- `V1` **A project's `AGENTS.md` prints off wherever Claude Code skips it**: by default, wherever a `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` sits in the project or a folder above it, with the file named. Ruled by the user 2026-10-07: `delapse` holds both files, its `AGENTS.md` written for Codex, and the setup merging them must know which lines Claude followed.
- `V1` **Project setup is for Claude alone: another coding agent's files are leftovers, each behind a box.** Ruled by the user 2026-10-08: Flow's rules, hooks and skills run only in Claude Code. A kept agent is a choice per project.
- `V1` **The survey knows a fixed list of other agents**, in `survey.js`: per tool, the files it uses, where its MCP servers sit, and where its last-run date comes from. Codex, Cursor, Gemini CLI, GitHub Copilot, Windsurf, Cline, Roo, Kiro, Junie, Continue, opencode and Aider. The agent looks beyond the list and logs what it missed. A list can be tested, and an agent's own search missed files on 2026-10-06. Each entry is checked against its tool's docs before the build.
- `V1` **The form leads each other agent with when it last ran there**, such as `Codex last ran here 2026-06-07`. Codex's date comes from `~/.codex/sessions/`, whose records name each session's folder. A tool with no such record takes the last commit touching its files.
- `V1` **Another agent's MCP server gets a box moving it into `.mcp.json` only where it is on in that agent and missing from `.mcp.json`.** A server off there is listed under the box, never offered: the user refused it once. A move carries an environment variable's name, never its value.
- `V1` **A skill in `.agents/skills/` that no link in `.claude/skills/` reaches**: one wrapping something Claude already has gets a remove box, and any other a box linking it into `.claude/skills/`, then the competitor test.
- `V1` **One box resets Codex, ticked by default: `[x] Reset Codex in this project`.** Above it, the form warns what a reset removes: `AGENTS.md` once its rules are read, `.codex/config.toml` once its on servers move, and the skills only Codex sees. Unticked, setup touches no Codex-only file, and Codex keeps its own `AGENTS.md`, which Claude skips beside a `CLAUDE.md`. A kept Codex pointing into something setup removes anyway, such as a wrapper skill into a removed folder, is named beside the box.
- `V1` **A project's own `AGENTS.md`, once its rules are read into `CLAUDE.md`, gets a remove box, ticked by default.** Claude skips it beside a `CLAUDE.md`, so a kept copy only goes stale. Where the survey finds another agent ran there, the file sits in that agent's part of the form. Ruled by the user 2026-10-08, over detecting which tool still reads the file: the file alone cannot show it.
- `V1` **A server name a project's settings approve or refuse, and `.mcp.json` does not define, is a problem.** Names alone, so the survey copies no rule of Claude Code's for which servers are on. The form offers the stale name to the user.
- `V1` **The project's setup offers each plugin installed for the project**: keep, switch off, or uninstall. The machine's setup never touches one.
- `V1` **The code is read in its own right, and wins over every doc.** A doc the code contradicts becomes a ticket. Only files git would keep are read. Docs copied in from elsewhere stay unread.
- `V1` **Every finding lands in one place**: the project's `CLAUDE.md`, `docs/context/`, a ticket, `.flow/inbox.md`, `.flow/findings/`, the user's 2 sections, left where it is, taken over as a skill, or dropped with its Flow rule named.
- `V1` **Project context stays short, and holds no rule for standard practice.** A rule is kept only where a capable agent reading the code would get it wrong. Ruled by the user 2026-09-25.
- `V1` **Tickets come only from explicit lists of open work**, one per item. Never a ticket for a feature a spec describes.
- `V1` **Setup writes no spec.** It makes the ticket "Write the product spec", listing each source, where the project holds plans, specs or decisions. A spec is the user's intent, and setup asks nothing.
- `V1` **Setup makes the ticket "Find skills, plugins and MCP servers for this stack"** where there is code, naming the stack and what is installed.
- `V1` **Setup switches on each plugin or outside skill the project's code uses**, that is off for the machine.
- `V1` **The project's form holds decisions with counts, never content**: `9 rules → CLAUDE.md`, listed under ✅ with no box. The files sit under `files/`, and each dropped line sits in `dropped.md` with the Flow rule replacing it.
- `V1` **A project's old Claude Code memory is folded in on its own**: a stamped project whose memory folder holds files gets a session reading the memory alone. The memory folder is deleted behind a box.
- `V1` **A second machine sets up a project with `flow init` in its clone**, which checks out the existing tickets and reports the project already set up.
- `never` **Moving the project's files out before the session**, the user's first idea, approved then replaced 2026-09-25: it changed the project before the yes. A tracked `CLAUDE.md` vanished from git mid-harvest, and another open session lost its rules.
- `later` **A private project in someone else's repository keeps its `CLAUDE.md` uncommitted**, so a second machine gets the tickets through the Flow home without the rules.

### Updating

- `V1` **The version is a changelog entry's number.** `~/.flow/version` holds the last entry a machine applied, `.flow/version` a project's. An update applies every entry above it. A date could not tell 2 entries on one day apart.
- `V1` **An entry is 1 or 2 sentences, for the user. A guide beside it, `upgrades/<number>.md`, holds every path that moves and the state it ends in.** One guide per step, so a machine 4 entries behind reads 4 guides in order, and the later guide wins where 2 name one path.
- `V1` **`flow update` pulls Flow's clone, then opens an update session for each place behind**: the machine first, then the project it was typed in. A session opened after the pull always runs the newest steps. Ruled 2026-09-26, replacing a `/flow:migrate` skill that would have run the steps loaded before the pull.
- `V1` **The update session changes the files itself**, with no form and no go. Ruled by the user 2026-10-08: an update holds few choices or none, and merging the user's own changes needs judgment a script cannot make.
- `V1` **The session reads what changed on both sides before it writes**: each guide, and every change the user made to Flow's files. It merges the 2. A line of the user's own stays, unless a new Flow rule covers it.
- `V1` **The session asks only where a Flow change clashes with something of the user's**, such as a preference the new rule contradicts: keep it, or drop it. Everything else it decides alone.
- `V1` **The last message lists what changed, in a few lines.** `~/.flow/` and a project are git repositories, so `git diff` shows and undoes every change.
- `V1` **An update that changed a hook, the rule file or the skills proves itself** with `claude -p` and a read of that session through `flow audit`.
- `never` **An update form, approved once, then written by a script.** Dropped by the user 2026-10-08: its boxes held only the user's own lines, and unticking one deleted the line, against the rule that an unticked box leaves a thing as it is.
- `V1` **Nothing behind prints one line and runs nothing.** A pull git refuses stops with git's message.
- `never` **Version numbers of the `1.4.2` sort**: Flow is a clone the user pulls, with no registry and nobody pinning a range. Ruled by the user 2026-09-20.

### Syncing machines

- `V1` **`~/.flow/` is one private GitHub repository, the Flow home**, and that is the whole of how a second machine gets the user's rules, notes, tickets and wiki. Made by `flow install`, private, described `Managed by Flow. Never rename, edit or make public.`
- `V1` **`flow sync` fetches, commits this machine's work, merges, then pushes.** It refuses before anything moves when another machine runs a newer Flow. A merge git cannot finish is aborted, naming the files, with this machine's commit kept.
- `V1` **Typed in a project, `flow sync` also syncs the project's tickets.**
- `V1` **`~/.flow/` is also sent in the background**, after a reply when something waits and the last send was 30 minutes ago or more, and at session end.
- `V1` **What never travels** sits in `~/.flow/.gitignore`, opening `# What belongs to this machine alone.`: the version stamp, a stopped run, the originals, `settings.local.json`, the links into the clone, the clones, the logs, the audit index and every `downloads/`.
- `V1` **A setting holding a path lives in `settings.local.json`**, which stays on its machine.
- `V1` **A second machine joins with `flow install`**: it checks the Flow home's files out before setup starts, then commits its own record, `~/.flow/machines/<name>.json`. It refuses a repository that is not a Flow home, and a `~/.flow/` holding a file the download would overwrite.
- `V1` **Uncommitted code travels by `util git uncommitted`**, on the user's own command. The agent never runs it.
- `never` **A `~/.flow/private-scripts/` folder for the user's own scripts.** Dropped by the user 2026-10-02: such scripts are rare, and any folder in `~/.flow/` already reaches GitHub through `flow sync`.

### Checking

- `V1` **`flow doctor` checks everything Flow put on the machine**, and names the command or skill that fixes each problem. A stopped run comes first, then the open issues, then each background job whose last run failed. Being behind is a note suggesting `flow update`, never a problem.
- `V1` **`flow doctor --prereq`** checks the prerequisites alone, the one form that runs where Flow was never installed. **`--updates`** reads the remote's newest tag, the one check that touches the network.

### Undoing

An original is every path as it was before Flow first touched it, kept in `~/.flow/originals/<machine or project>/`.

- `V1` **An original is written in one window and never added to.** `flow install` opens the machine's, and `flow install --finish` closes it. A project's opens in its first `flow init`, and closes at `flow init --finish`, or inside `flow init` where no session follows. Closing at the stamp keeps the window open through a stopped run, so a run carried on still records. Ruled by the user 2026-10-08, at `fw-87`'s plan, over a `--close` flag the session would have to remember.
- `V1` **`--finish` also writes the setup's line in the history log**, `{ type, id, project }`, since `record-originals.js` runs before any change.
- `V1` **A path inside one already recorded counts as recorded**, so a setup run again after a stop never records a file Flow made.
- `V1` **A path that did not exist is recorded `absent`**, at its highest missing folder, so a restore deletes the folders Flow made.
- `V1` **Nothing under `~/.flow/` is ever recorded**, so putting a machine back keeps the user's notes, tickets and wiki.
- `V1` **`flow restore machine` and `flow restore project` hand over one form**, `~/.flow/restore.md`, one box per path. A ticked path goes back. An unticked one stays. A project's `CLAUDE.md` and `docs/` start unticked, as knowledge that works without Flow.
- `V1` **`flow uninstall` restores every project, then the machine, then deletes `~/.flow/` and the clone.** It refuses while `~/.flow/` holds work its remote lacks, naming `flow sync`. A clone holding uncommitted work or unpushed commits is kept.
- `V1` **4 locks keep restore and uninstall away from the agent**: no session open, a word typed at `/dev/tty`, no flag that skips the prompt, and `deny` rules in `home/settings.json`.
- `never` **A `changed since` mark on a restored path recorded `absent`.** Nearly every such path is one the user writes in, so the mark carries no signal. Closed 2026-10-01.
- `later` **Undoing one migration**, through a copy per run. Parked by the user 2026-09-20: the original matters for the first weeks, and nothing else earns a copy per run.

## The parts

- **`install.sh`**: the pasted line's script.
- **`scripts/commands/install.js`**: the check, the links, the clones, the Flow home, the machine's original. `--check` and `--finish` are the setup session's first and last steps.
- **`scripts/sessions/machine.md`, `scripts/templates/setup-machine.md`**: the machine's setup session, 11 steps, and its form's template.
- **`scripts/commands/init.js`**, **`scripts/sessions/project.md`, `scripts/templates/setup-project.md`**: the same for a project.
- **`scripts/commands/update.js`**, **`scripts/sessions/migrate.md`**: the update and its session. **`CHANGELOG.md`** and **`upgrades/`** hold what it reads.
- **`scripts/record-originals.js`**: records the paths a setup is about to change into the place's original, opening it at a project's first setup. Off the PATH, so nobody types it weeks later.
- **`scripts/lib/setup.js`**: writes `run.json` and the prompt, and opens each session.
- **`scripts/lib/machine/flow-repo.js`**, **`scripts/commands/sync.js`**: the Flow home and `flow sync`.
- **`scripts/lib/machine/prereq.js`**: the prerequisites and `MIN_CLAUDE`.
- **`scripts/lib/machine/originals.js`**, **`scripts/commands/restore.js`**, **`scripts/lib/machine/restore-form.js`**: the originals, both restores and the uninstall.
- **`references/harnesses/claude-code.md`**: where Claude Code keeps its own files, read by every setup and update session.

## What passes between them

`~/.flow/run.json`, a run in progress:

```json
{ "started": "2026-10-06T01:29:11.000Z", "type": "setup-machine", "migration": "machine/2026-10-06T01-29-11", "step": 0 }
```

2 boxes of `migration.md`:

```markdown
- [x] **/save-context** command: deleted. It saves notes so you can run /compact, which Flow switches off.
- [ ] **Jupyter notebooks** ([docs][notebook]): editing `.ipynb` files.
```

At go, the session records every path the file list names, then deletes `~/.claude/commands/save-context.md` and leaves Jupyter notebooks on:

```bash
node ~/.flow/scripts/record-originals.js ~/.flow/CLAUDE.md ~/.claude/CLAUDE.md ~/.claude/settings.json ~/.claude/commands/save-context.md
```

A machine's record in the Flow home, `~/.flow/machines/pc-wsl.json`:

```json
{ "name": "pc-wsl", "joined": "2026-10-05", "flowVersion": 1 }
```

## One real case: a second machine

1. The user pastes the install line on a laptop. `install.sh` finds git, node, claude and gh, and clones Flow.
2. `flow install` signs `gh` in, finds `<login>/flow-home` with files in it, and checks it opens with the Flow home's mark.
3. It offers `laptop-wsl`. The user presses Enter.
4. It checks the Flow home's files out into `~/.flow/`, links Flow, clones the skill sources, and commits `machines/laptop-wsl.json`.
5. The setup session opens. `~/.flow/CLAUDE.md` arrived with the other machine's 2 sections, so the boxes start from them. The survey finds superpowers installed, and the form marks it always removed.
6. The user says go. The session records every path the form lists into the original, then makes each ticked change.
7. `flow doctor` passes. `flow install --finish` stamps `~/.flow/version`. The user restarts `claude`.
8. In a clone of a project, `flow init` checks out the project's tickets and reports the project already set up.

## How it fails

- **A prerequisite missing or too old** → `stopped: <why>`, nothing linked.
- **`gh` signed out, with no terminal** → stops, setup not started.
- **The Flow home is not a Flow home, or a download would overwrite a local file** → refused before setup starts.
- **The setup session quit halfway** → every `flow` command but 4 refuses, `flow doctor` names the step reached, and `flow install` carries it on.
- **The form changed beyond its marks and text boxes, or was deleted** → the session stops before any change, names the line, and asks what the user meant.
- **`record-originals.js` fails on a path** → the session stops before any change.
- **Another machine runs a newer Flow** → `flow sync` refuses and names `flow update`.
- **A merge git cannot finish** → aborted, naming the files, this machine's commit kept.
- **A pull git refuses during `flow update`** → stops with git's message, and nothing runs.
- **A push refused on a project's branch** → `flow init` stops before making the branch, and offers `--private`.

## How you know it worked

- **The README's install line set up a real machine**: done, `fw-1`.
- **A second machine joins and shares the first one's rules and tickets.** Not yet: `flow sync`, the join and the sign-in have run only against repositories on disk.
- **`flow update` carries a machine from one entry to the next.** Not yet: `CHANGELOG.md` holds entry 1 alone.
- **`flow restore machine` and `flow uninstall` put a real machine back.** Not yet: run only in tests and the sandbox.
- **`flow init` sets up a real project with its own docs**: Delapse, the beta's test case.

## What is locked

- **Setup and update are sessions a command opens, never skills.** A skill runs inside a session already loaded with what setup removes, and runs the steps it loaded before a pull. Ruled 2026-09-24 for setup and 2026-09-26 for the update.
- **At setup, nothing on disk changes before the yes**, and the yes covers the whole run. One document holds every decision. The run never comes back for a second yes, except the one check on an untick.
- **Every setup changes a list of paths, each recorded into the original before it changes.** A path the list leaves out is never touched.
  - Refused: a copy per migration, replaced 2026-09-20 by one original per place. A restore of the original runs twice and lands in the same state.
- **The setup session applies the form itself, and a script only records the originals.** Ruled by the user 2026-10-08: every layer of script between the form and the change added complication, and a session reads a ticked form as well as a person does. The cost: the file list binds the session by instruction, never by code.
  - Refused: `apply-migration.js` running action lines inside the form. A markdown file a person edits broke it on small slips, and `fw-86` and a `run` command in backticks were 2 such breaks found in one session.
  - Refused: `apply-migration.js` running `actions.json`, one entry per change in 9 actions, with the form checked against a copy at go. Agreed, then dropped by the user 2026-10-08 before the build, as more machinery than the job needs.
  - Refused: a script drawing the form from data. It is more than the job needs. The fault it would prevent, counts drifting across edits, belongs to `fw-30`'s check of the result.
- **The machine's setup runs in safe mode. A project's runs with `--setting-sources user`.** Safe mode keeps the machine's plugins out. The project's flags keep its files out and leave them in place.
  - Refused for the machine: installing Flow, moving every competing file out, then a normal session. Plugins come back only by reinstalling, and the whole machine changes before the yes.
- **The Flow home is one repository, and `flow sync` covers `~/.flow/` and the project typed in.** Ruled by the user 2026-09-20.

## References

- `lab/context/management.md` in git history: the full design behind every ruling here.
- `.flow/tickets/fw-83-setup-forms-are/groundwork/`: the forms' design, with an example machine form and project form in the agreed layout, each beside an `actions.json` from a dropped design.
