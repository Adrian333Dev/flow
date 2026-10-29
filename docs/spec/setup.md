# Setup

How Flow gets onto a machine and into a project, stays current, and shares the user's rules, notes and tickets across machines. One pasted line installs Flow. `flow install` links it in, joins the Flow home and opens one setup session that merges the machine's old Claude Code files with Flow's. `flow init` sets up a project with no session. `flow update` pulls Flow and runs `flow install` again. `flow sync` carries `~/.flow/` to GitHub. `flow doctor` checks all of it.

## Scope

- **In**: `install.sh`, `flow install`, the machine's setup session, `flow init`, `flow update`, `flow sync` and the Flow home, `flow doctor`.
- **Out**: where a project's tickets live and the ticket commands, in `docs/spec/tickets.md`. Skills and their sources, in `docs/spec/skills.md`. The hooks and the session-start line, in `docs/spec/product.md` → `### Hooks and guardrails`. The permissions, in `docs/spec/permissions.md`.

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
 └──────────────────────┘   links Flow, owes the setup session
        │  logs/setup-pending
        ▼
 ┌──────────────────────┐
 │    setup session     │   harvests the old rules, merges the settings,
 └──────────────────────┘   runs flow doctor, removes the marker
```

## Behaviors

### Installing on a machine

- `V1` **One pasted line installs Flow**, the README's install line. `install.sh` checks for git, node, claude, gh, pnpm and rg (ripgrep, which `flow tickets delete` searches with), clones Flow into `~/.flow/repos/flow/`, and runs `flow install`, which installs `scripts/`'s dependencies with `pnpm install --frozen-lockfile` (the user, 2026-10-27: pnpm for every package, never npm). It is bash because it runs before Flow is on disk. `--use <folder>` skips the clone. Ruled by the user 2026-09-23.
- `V1` **Prerequisites are checked by running them**: the 5 programs on the PATH, Node at `MIN_NODE` (24.12.0) or later, and Claude Code at `MIN_CLAUDE` (2.1.310, the newest release read against Flow) or later. A failure stops the run. A Claude Code newer than `MIN_CLAUDE` adds a note to `flow doctor` and never fails it. A prerequisite is what Flow calls and never installs.
- `V1` **`flow install` checks everything before it links anything.** It signs `gh` in, finds the Flow home at `<login>/flow-home`, checks the repository is a Flow home, and asks the one question last: the machine's name. A failed check prints `stopped: <why>`, exits 1, and links nothing.
- `V1` **The machine's name is offered, never invented**: read from the hardware, as `<laptop|pc|server>-<wsl|distro>`, or a Mac's model, `macbook-pro`. It is shown dim, so Enter keeps it and the first key erases it. It is saved as git's `flow.machine`. With no terminal, the offer is taken.
- `V1` **`flow install` links per item, and never replaces anything that is not a link.** `flow` and `fw` link to `scripts/flow.ts`. `util` and `u` come from `util install`, and util is cloned with `--depth 1` into `~/.flow/repos/`.
- `V1` **`flow install` starts `~/.flow/CLAUDE.md` from `home/CLAUDE.md` where it is absent**, and links `~/.claude/CLAUDE.md` to it. It never edits `~/.claude/settings.json`: the setup session does.
- `V1` **A machine joins the Flow home with `flow install`.** The first machine makes the private repository `<login>/flow-home`, described `Managed by Flow. Never rename, edit or make public.` A later machine pulls it before anything else, then commits its own record, `machines/<name>.json`. It refuses a repository that is not a Flow home (its `.gitignore` opens with a fixed mark), and a `~/.flow/` holding a file the download would overwrite.
- `V1` **`flow install` owes the setup session** where `~/.claude/CLAUDE.md` is not yet Flow's link, and opens it last. `flow update` owes it on every run. The marker is `~/.flow/logs/setup-pending`. A run that owes nothing opens no session. The run's output goes to `~/.flow/logs/install.log`.
- `never` **Flow shipped through npm**: its content is files the user reads and edits, and `node_modules` is neither.
- `never` **Flow shipped as a plugin alone**: a plugin cannot write `~/.claude/CLAUDE.md` or `~/.local/bin`, half of Flow.

### The setup session

`prompts/setup-session.md` is the session's instructions. It asks the user nothing and reports what changed.

- `V1` **It runs in safe mode** (`claude --safe-mode`), which loads no plugin, skill or hook of the machine, so nothing it is about to change runs beside it. Ruled 2026-09-24, after a setup skill ran beside the plugins it removed.
- `V1` **It harvests the old rules.** It reads the old `~/.claude/CLAUDE.md`, drops each line a rule of `~/.flow/CLAUDE.md` already covers (naming that rule), and writes the rest to `~/.flow/archive/old-claude-md.md`, which no session loads.
- `V1` **It merges `~/.claude/settings.json` with `home/settings.json`.** The live file ends up holding everything the template names, with the template's value. A hook of Flow's is replaced by the template's, a setting that works against Flow goes, and every other key stays.
- `V1` **It runs `flow doctor`, fixes what it names in those 2 files, and removes the marker.** It keeps the marker where a step failed, so the next `flow install` opens the session again.
- `V1` **The files as they were stay in `~/.flow/logs/before/`.** Git also holds `~/.flow/`.
- `never` **Setup as a skill.** A skill runs inside a session already loaded with what setup changes, and runs the steps it loaded before a pull. Ruled 2026-09-24.

### Setting up a project

- `V1` **`flow init` sets up a project in one command**, with no session and one question, the ticket prefix. It runs `git init` where there is no repository, works at the top folder, and says so where the project is set up already.
- `V1` **`flow init` links `.flow/` to the project's folder in the Flow home**, `~/.flow/projects/<name>/`. Where another machine made that folder, `flow init` finds it by the `repository` in its `settings.json`. Else it makes the folder. `.git/info/exclude` hides the link, and the project's `.gitignore` gets no `.flow` line. Where the tickets live: `docs/spec/tickets.md`.
- `V1` **It writes `project-template/` only where files are missing**: `CLAUDE.md`, `.gitignore`, `.uncommitted-include` and `.claude/settings.json`.
- `V1` **It asks `ticketPrefix` once**, and `--prefix <word>` answers it. The registry refuses a word another folder holds.
- `V1` **A machine keeps a registry of its projects**: `registry.json` in the Flow home, `prefix → absolute folder`, on the sync's ignore list since a path differs per machine. `flow init` registers its project after checking the prefix against it, and refuses a prefix another existing folder holds, offering the next free word. A project whose `.flow/` exists registers on its first ticket-writing command; a read never registers, and a folder without `.flow/` is never brought in. Registering asks nothing, since an agent runs these commands: a clash leaves the later project unregistered, silently, and `flow doctor` names it. A registered path that is gone holds nothing and is updated by a ticket-writing command in the moved folder. A folder that takes a new prefix loses its line under the old one. Decided with the user 2026-10-19 and 2026-10-20, at `fw-209`.
- `later` **A private project in someone else's repository keeps its `CLAUDE.md` uncommitted**, so another machine gets the tickets through the Flow home without the rules.

### Updating

- `V1` **`flow update` pulls Flow's clone with `--ff-only`, then runs `flow install` as a new process**, so the newest install steps run. With nothing new to pull it still runs the install.
- `V1` **A pull git refuses stops with git's message**, owes nothing and logs one line.
- `V1` **`flow update` refuses a clone that is a link to another checkout**, such as the dev checkout (`docs/spec/product.md` → `### Working on Flow itself`), and a missing clone.
- `never` **Version numbers of the `1.4.2` sort**: Flow is a clone the user pulls, with no registry and nobody pinning a range. Ruled by the user 2026-09-20.

### Syncing machines

- `V1` **`~/.flow/` is one private GitHub repository, the Flow home**, and that is the whole of how another machine gets the user's rules, notes, tickets and wiki. A project's tickets sit in it as well (`docs/spec/tickets.md`).
- `V1` **`flow sync` fetches, commits this machine's work, merges, then pushes.** Each commit is named for its machine, `pc-wsl: 2 files`. A merge git cannot finish is aborted, naming the files, with this machine's commit kept. A ticket number 2 machines took is renumbered, keeping `was:`.
- `V1` **`~/.flow/` is also sent in the background**, after a status move on a ticket, after a reply when something waits and the last send was 30 minutes ago or more, and at session end.
- `V1` **What never travels** sits in `~/.flow/.gitignore`, opening `# What belongs to this machine alone.`: the links into the clone (`scripts`, `guides`, `docs`, `prompts`), `repos/`, `logs/`, `audit/`, `changes/`, `registry.json`, `settings.local.json` and every wiki `downloads/`. `flow install` writes the file on every run. `flow sync` untracks (`git rm --cached`) every committed file that file now names, since git ignores only untracked files. The file stays on disk. Another machine merging that commit loses its copy of the file, which only a path committed before its ignore line existed can cause. Decided at `fw-281`.
- `V1` **A setting holding a path lives in `settings.local.json`**, which stays on its machine.
- `V1` **Uncommitted code travels by `util git uncommitted`**, on the user's own command. The agent never runs it.
- `never` **A `~/.flow/private-scripts/` folder for the user's own scripts.** Dropped by the user 2026-10-02: such scripts are rare, and any folder in `~/.flow/` already reaches GitHub through `flow sync`.

### Checking

- `V1` **`flow doctor` checks everything Flow put on the machine**: the links, the PATH, util, the skills and the hooks. It names the command or skill that fixes each problem. Under `issues` it lists each background job whose last run failed. Inside a project it also names each ticket still in the old format: a folder named with more than its id, a `groundwork/map.md` that is only the empty template, and a title that is one of the ticket's own labels. Decided with the user 2026-10-18, so a ticket made before the format is never fixed by hand unseen.
- `V1` **`flow doctor` has a `projects` section**: the registered prefixes and paths, then a path that is gone, a clash on the current folder's prefix (fixed by `ticketPrefix` in `.flow/settings.json`), a line whose folder changed its `ticketPrefix`, and the current folder having a prefix and no line. It reads the registry, changes nothing and never scans the disk.
- `V1` **`flow doctor --prereq`** checks the prerequisites alone, the one form that runs where Flow was never installed.

## The parts

- **`install.sh`**: the pasted line's script.
- **`scripts/commands/install.ts`**: the check, the links, the clones, the Flow home.
- **`scripts/commands/init.ts`**, **`project-template/`**: the project's setup and its scaffold.
- **`scripts/commands/update.ts`**: the pull and the new install.
- **`scripts/commands/sync.ts`**, **`scripts/features/machine/flow-repo.ts`**: `flow sync`, the Flow home, the machine records and the list of what never travels.
- **`scripts/commands/doctor.ts`**: the checks.
- **`scripts/features/machine/`**: the links, the machine's name, the prerequisites, `MIN_NODE` and `MIN_CLAUDE`, and the owed setup session.
- **`scripts/shared/registry.ts`**: the registry.
- **`prompts/setup-session.md`**: the setup session's instructions.

## What passes between them

A machine's record in the Flow home, `machines/pc-wsl.json`:

```json
{ "name": "pc-wsl", "joined": "2026-10-05" }
```

The marker `~/.flow/logs/setup-pending` exists while a setup session is owed, and `flow doctor` and the next `flow install` read it.

## One real case: a machine joins an existing Flow home

1. The user pastes the install line. `install.sh` finds git, node, claude, gh, pnpm and rg, and clones Flow.
2. `flow install` signs `gh` in, finds `<login>/flow-home` with files in it, and checks it opens with the Flow home's mark.
3. It offers `laptop-wsl`. The user presses Enter.
4. It checks the Flow home's files out into `~/.flow/`, links Flow, and commits `machines/laptop-wsl.json`.
5. The setup session opens in safe mode. `~/.flow/CLAUDE.md` arrived with the Flow home, so the harvest sorts the old rules against it. The merge adds Flow's settings to `~/.claude/settings.json`.
6. `flow doctor` passes and the marker goes. The user restarts `claude`.
7. In a clone of a project, `flow init` finds the project's folder in the Flow home, links `.flow/` to it and reports the project set up.

## How it fails

- **A prerequisite missing or too old** → `stopped: <why>`, nothing linked.
- **`gh` signed out, with no terminal** → stops, nothing linked.
- **The repository is not a Flow home, or a download would overwrite a local file** → refused before anything links.
- **The setup session quit halfway** → the marker stays, and the next `flow install` or `flow update` opens the session again.
- **A merge git cannot finish** → aborted, naming the files, this machine's commit kept.
- **A pull git refuses during `flow update`** → stops with git's message.
- **A link someone replaced with a real file or folder** → `flow install` refuses to replace it.

## How you know it worked

- **The README's install line set up a real machine**: done, `fw-1`.
- **`npm test` covers `flow install`, `flow update` and `flow sync`**, against repositories on disk.
- **Another machine joins and shares the first one's rules and tickets.** Not yet: the join and the sign-in have run only against repositories on disk.

## What is locked

- **Setup is a session a command opens, never a skill.** Ruled 2026-09-24.
- **The Flow home is one repository, and `flow sync` covers `~/.flow/`.** Ruled by the user 2026-09-20.

## References

- `lab/archive/`: the retired survey, forms, originals, `flow restore` and `flow uninstall`, and the update sessions. `.flow/tickets/16/context.md` → `## 25` says why.
