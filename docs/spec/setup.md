# Setup

How Flow gets onto a machine and into a project, stays current, travels to a second machine, and comes off again. One pasted line installs Flow and opens a setup session. That session reads what the machine already holds and hands the user one form. Nothing changes before the user says go. `flow init` does the same for a project. `flow update` brings either one up to date, `flow sync` carries the machine's Flow to the user's other machines, and `flow restore` and `flow uninstall` put everything back.

## Scope

- **In**: `install.sh`, `flow install`, the machine's setup session and its form, `flow init` and the project's setup session, `flow update` and its migrations, the changelog and the version stamps, `flow sync` and the Flow home, `flow doctor`, the originals, `flow restore` and `flow uninstall`.
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
 │   apply-migration    │   changes the paths the form lists, and no other
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
- `V1` **The form's sections**: what Flow sets up, as plain lines. What is always removed, with no box. Flow's skills. What is removed unless unticked. Plugins switched on only in the projects that use them. Skills deleted because Flow has its own. Outside skills Flow takes over. The user's preferences and facts about the user. Every file it changes.
- `V1` **The competitor test**: anything telling Claude how to work on ground Flow already rules on goes. Something working in every session is always removed. A skill, agent or command that fires only when invoked gets a box. Anything knowing a subject Flow does not cover stays. An MCP server stays, and is left out of the form.
- `V1` **A plugin that goes is uninstalled**, never switched off. One synced from the claude.ai account is switched off with `claude plugin disable <name>@synced`, since uninstall cannot reach it. A plugin only some projects use is switched off machine-wide, and `flow init` switches it on where a project uses it.
- `V1` **A plugin installed for one project stays out of the machine's form.** It loads only in that project's sessions, so it never meets Flow's global session. Ruled by the user 2026-10-07, after the machine form wrote a machine-wide uninstall for 3 of them and edited another repository's committed settings.
- `V1` **The harvest drops a line from an old rule file only where it can name the Flow rule replacing it.** A kept preference passes a second test: the user would still want it had Flow been there from the start. `Never use em dashes` passes. `Always show me a diff before you edit` fails.
- `V1` **`## The user` never holds a skill level, what the user does not know, or what they are working on.** A level goes stale and makes the agent skip explanations. Ruled by the user 2026-09-21.
- `V1` **Every untick gets one second check**, naming what each costs. There is no third.
- `V1` **`~/.claude/CLAUDE.md` is replaced whole by one import line**, and `~/.agents/AGENTS.md` becomes a link to `~/.flow/AGENTS.md`, the copy `flow sync` carries.
- `V1` **A machine whose Flow home already holds `~/.flow/AGENTS.md`** starts the 2 boxes from it, and adds only what the harvest finds new.
- `never` **A pick-list question per setting**, `AskUserQuestion`: switching it on for one form a machine costs its schema in every request. Ruled by the user 2026-09-21.
- `never` **Auto mode switched off for every session** to let setup write: `--settings` switches it off for the setup session alone.
- `never` **A machine-wide MCP server switched on only in the projects that use it.** Dropped by the user 2026-10-05 for the simplest version, once the build showed its cost. Claude Code keeps `disabledMcpServers` per project, so Flow would have had to remove the server, keep its key outside the Flow home, and add a command to put it back per project. Tool search makes the saving small, since a tool's description loads only when the agent searches for it. Reopen only where tool search is off.

### Migrations

A migration is what any setup or update session proposes: `migration.md`, one line per change, plus the new version of each file it writes under `files/`.

- `V1` **The agent writes the migration, and `apply-migration.js` is its only writer.** 4 verbs make a line an action: `write`, `delete`, `move`, `run`. Everything else is prose for the user. A line the user deletes never happens.
- `V1` **An out-of-date migration refuses**: a file it would write or delete changed 30 seconds or more after the migration was written. So does a migration whose prerequisites fail.
- `V1` **A stopped migration carries on from the line that stopped**, and `~/.flow/run.json` names the step reached. `flow doctor` and the session-start line name the command that carries it on.
- `V1` **A file Claude Code rewrites itself, such as `~/.claude.json`, changes only through a `run` line.**
- `V1` **Every migration is shown whole, and runs on one yes**, with no size threshold. A threshold would make the agent judge which migration is small, and a hook change reads as one line while rewiring every session.

### Setting up a project

- `V1` **`flow init` sets up a project in one command**, walking its states in order: `git init` where there is no repository, the top folder, a stopped run, already set up, where the tickets live (`docs/spec/tickets.md`), `.flow/` in `.gitignore`, the prefix, and the template.
- `V1` **An empty folder gets `project-template/` at once**, with no session. Competing files open the setup session with no question. Any other file asks `Read them in a setup session first? (y/N)`, the template being the default.
- `V1` **The project's setup session loads Flow and nothing of the project's**: `claude --setting-sources user --strict-mcp-config`, plus `--add-dir` for `~/.flow` and the project's memory folder. The project's `CLAUDE.md`, skills, commands, subagents, settings and MCP servers stay unloaded, and stay in place until the yes. Probed 2026-09-25.
- `V1` **The project's survey is `flow survey --project <folder>`**: its `.claude/`, its `CLAUDE.md`, `CLAUDE.local.md` and `AGENTS.md`, its `.mcp.json`, and the plugins Claude Code's install record names for the folder. The same rules as the machine's survey hold.
- `V1` **A project's `AGENTS.md` prints off wherever Claude Code skips it**: by default, wherever a `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` sits in the project or a folder above it, with the file named. Ruled by the user 2026-10-07: `delapse` holds both files, its `AGENTS.md` written for Codex, and the setup merging them must know which lines Claude followed.
- `V1` **A server name a project's settings approve or refuse, and `.mcp.json` does not define, is a problem.** Names alone, so the survey copies no rule of Claude Code's for which servers are on. The form offers the stale name to the user.
- `V1` **The project's setup offers each plugin installed for the project**: keep, switch off, or uninstall. The machine's setup never touches one.
- `V1` **The code is read in its own right, and wins over every doc.** A doc the code contradicts becomes a ticket. Only files git would keep are read. Docs copied in from elsewhere stay unread.
- `V1` **Every finding lands in one place**: the project's `AGENTS.md`, `docs/context/`, a ticket, `.flow/inbox.md`, `.flow/findings/`, the user's 2 sections, left where it is, taken over as a skill, or dropped with its Flow rule named.
- `V1` **Project context stays short, and holds no rule for standard practice.** A rule is kept only where a capable agent reading the code would get it wrong. Ruled by the user 2026-09-25.
- `V1` **Tickets come only from explicit lists of open work**, one per item. Never a ticket for a feature a spec describes.
- `V1` **Setup writes no spec.** It makes the ticket "Write the product spec", listing each source, where the project holds plans, specs or decisions. A spec is the user's intent, and setup asks nothing.
- `V1` **Setup makes the ticket "Find skills, plugins and MCP servers for this stack"** where there is code, naming the stack and what is installed.
- `V1` **Setup switches on each plugin or outside skill the project's code uses**, that is off for the machine.
- `V1` **The project's form holds decisions with counts, never content**: `9 rules → AGENTS.md`. The files sit under `files/`, and each dropped line sits in `dropped.md` with the Flow rule replacing it.
- `V1` **A project's old Claude Code memory is folded in on its own**: a stamped project whose memory folder holds files gets a session reading the memory alone. The memory folder is deleted behind a box.
- `V1` **A second machine sets up a project with `flow init` in its clone**, which checks out the existing tickets and reports the project already set up.
- `never` **Moving the project's files out before the session**, the user's first idea, approved then replaced 2026-09-25: it changed the project before the yes. A tracked `CLAUDE.md` vanished from git mid-harvest, and another open session lost its rules.
- `later` **A private project in someone else's repository keeps its `AGENTS.md` uncommitted**, so a second machine gets the tickets through the Flow home without the rules.

### Updating

- `V1` **The version is a changelog entry's number.** `~/.flow/version` holds the last entry a machine applied, `.flow/version` a project's. A migration is every entry above it. A date could not tell 2 entries on one day apart.
- `V1` **An entry is 1 or 2 sentences, for the user. A guide beside it, `upgrades/<number>.md`, holds every path that moves and the state it ends in.** One guide per step, so a machine 4 entries behind reads 4 guides in order, and the later guide wins where 2 name one path.
- `V1` **`flow update` pulls Flow's clone, then opens an update session for each place behind**: the machine first, then the project it was typed in. A session opened after the pull always runs the newest steps. Ruled 2026-09-26, replacing a `/flow:migrate` skill that would have run the steps loaded before the pull.
- `V1` **The update form holds 3 sections**: what changed in Flow, one line per entry; the user's own lines found in Flow's files, each kept under a ticked box; every file it changes.
- `V1` **Flow's files are written whole, at every size.** The template is the truth outside the user's 2 sections, and a second run writes the same bytes.
- `V1` **A migration that changed a hook, the rule file or the skills proves itself** with `claude -p` and a read of that session through `flow audit`.
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

- `V1` **An original is written in one window and never added to.** `flow install` opens the machine's, and its setup session closes it. A project's opens and closes inside its first `flow init`.
- `V1` **A path that did not exist is recorded `absent`**, at its highest missing folder, so a restore deletes the folders Flow made.
- `V1` **Nothing under `~/.flow/` is ever recorded**, so putting a machine back keeps the user's notes, tickets and wiki.
- `V1` **`flow restore machine` and `flow restore project` hand over one form**, `~/.flow/restore.md`, one box per path. A ticked path goes back. An unticked one stays. A project's `AGENTS.md`, `CLAUDE.md` and `docs/` start unticked, as knowledge that works without Flow.
- `V1` **`flow uninstall` restores every project, then the machine, then deletes `~/.flow/` and the clone.** It refuses while `~/.flow/` holds work its remote lacks, naming `flow sync`. A clone holding uncommitted work or unpushed commits is kept.
- `V1` **4 locks keep restore and uninstall away from the agent**: no session open, a word typed at `/dev/tty`, no flag that skips the prompt, and `deny` rules in `home/settings.json`.
- `never` **A `changed since` mark on a restored path recorded `absent`.** Nearly every such path is one the user writes in, so the mark carries no signal. Closed 2026-10-01.
- `later` **Undoing one migration**, through a copy per run. Parked by the user 2026-09-20: the original matters for the first weeks, and nothing else earns a copy per run.

## The parts

- **`install.sh`**: the pasted line's script.
- **`scripts/commands/install.js`**: the check, the links, the clones, the Flow home, the machine's original. `--check` and `--finish` are the setup session's first and last steps.
- **`scripts/sessions/machine.md`, `form.md`**: the machine's setup session, 11 steps, and its form's template.
- **`scripts/commands/init.js`**, **`scripts/sessions/project.md`, `project-form.md`**: the same for a project.
- **`scripts/commands/update.js`**, **`scripts/sessions/migrate.md`**: the update and its session. **`CHANGELOG.md`** and **`upgrades/`** hold what it reads.
- **`scripts/apply-migration.js`**: the one writer of any migration. Off the PATH, so nobody types it weeks later.
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

The action lines of `migration.md`:

```markdown
- write ~/.flow/AGENTS.md: Flow's rules, with the 2 boxes above
- run mkdir -p ~/.agents && ln -sfn ~/.flow/AGENTS.md ~/.agents/AGENTS.md: writes ~/.agents/AGENTS.md
- run claude plugin uninstall superpowers@claude-plugins-official: writes ~/.claude/settings.json, ~/.claude/plugins/installed_plugins.json
- delete ~/.claude/skills/tdd: a skill ticked above
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
5. The setup session opens. `~/.flow/AGENTS.md` arrived with the other machine's 2 sections, so the boxes start from them. The survey finds superpowers installed, and the form marks it always removed.
6. The user says go. `apply-migration.js` records each path into the original, then changes it.
7. `flow doctor` passes. `flow install --finish` stamps `~/.flow/version`. The user restarts `claude`.
8. In a clone of a project, `flow init` checks out the project's tickets and reports the project already set up.

## How it fails

- **A prerequisite missing or too old** → `stopped: <why>`, nothing linked.
- **`gh` signed out, with no terminal** → stops, setup not started.
- **The Flow home is not a Flow home, or a download would overwrite a local file** → refused before setup starts.
- **The setup session quit halfway** → every `flow` command but 4 refuses, `flow doctor` names the step reached, and `flow install` carries it on.
- **A file changed after its migration was written** → `apply-migration.js` refuses and lists the files.
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
- **Nothing on disk changes before the yes**, and the yes covers the whole run. One document holds every decision. The run never comes back for a second yes, except the one check on an untick.
- **Every migration is a list of paths, applied by one script.** A path the list leaves out is never touched. A path it names never changes without first being recorded into the original.
  - Refused: a copy per migration, replaced 2026-09-20 by one original per place. A restore of the original runs twice and lands in the same state.
- **The machine's setup runs in safe mode. A project's runs with `--setting-sources user`.** Safe mode keeps the machine's plugins out. The project's flags keep its files out and leave them in place.
  - Refused for the machine: installing Flow, moving every competing file out, then a normal session. Plugins come back only by reinstalling, and the whole machine changes before the yes.
- **The Flow home is one repository, and `flow sync` covers `~/.flow/` and the project typed in.** Ruled by the user 2026-09-20.

## References

- `lab/context/management.md` in git history: the full design behind every ruling here.
