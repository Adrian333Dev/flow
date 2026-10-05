# Trying a change

How to test a change to Flow before it reaches real work: the 2 test suites, a dev copy of Flow beside the release, and the scratch session, a real Claude Code session on a pretend computer.

## Table of contents

- [The tests](#the-tests): 2 suites, no dependencies, and where they write
- [A dev copy beside the release](#a-dev-copy-beside-the-release): edit Flow while your other projects stay on the release
  - [Starting a session on the dev copy](#starting-a-session-on-the-dev-copy): one alias, in any project
  - [What stays on the release](#what-stays-on-the-release): hooks, the status line, the `flow` command
  - [Releasing a change](#releasing-a-change): branches, merge, `flow update`
- [The scratch session](#the-scratch-session): a real session on a pretend computer
  - [Runs and seeds](#runs-and-seeds): a run is one pretend computer, a seed is the saved one it starts from
  - [What the session sees](#what-the-session-sees): your disk read-only, its own home folder
  - [The practice projects](#the-practice-projects): the boards a run starts with
  - [What it cannot fake](#what-it-cannot-fake): your account, another system

## The tests

```sh
cd scripts   && npm test     # flow
cd lab/util  && npm test     # util
```

Neither suite has a dependency: `node --test` is built into Node. `scripts/` is Flow's package root, with `tests/` beside the code. `lab/util/` is a submodule with its own suite. `node --test tests/<file>.test.js` runs one file.

Flow's tests write into `tmp/tests/`, and util's into `lab/util/tmp/tests/`. Each test gets a fresh folder, wiped before it runs.

Both tools write to real folders in normal use, so the suites move every one of them:

- **`--root <dir>`** stands in for `~` on `install`, `doctor` and the other setup commands, so `.agents`, `.claude`, `.flow` and `.local/bin` all land under `<dir>`. [Designing a flow command](commands.md#hidden-from-help) lists the other hidden flags.
- **`FLOW_HOME`**: the Flow home, normally `~/.flow/`.
- **`FLOW_PROJECT`**: the project, normally found through `git rev-parse`.
- **`FLOW_CHECKS`**: where the rule checks live, normally `scripts/rule-checks/`.
- **`FLOW_HOME_REMOTE`**: a folder standing in for the `flow-home` repository on GitHub, so `gh` is never asked.
- **`FLOW_GIT_BASE`**: stands in for `https://github.com/`, so the skill repositories, util and toolbox are cloned from folders on disk.
- **`FLOW_MACHINE_DEFAULT`**: the computer's offered name, in place of asking the hardware, which takes minutes under WSL.
- **`FLOW_VISIBILITY`**: whether the project's repository counts as public, in place of asking GitHub.
- **`UTIL_HOME`**, **`UTIL_PROJECT`** and **`UTIL_BIN`**: util's registry, its project, and where `util install` links. `tests/helpers/scratch.js` sets all 3 on every test, since a test left with one unset can put links on the real `PATH`.

Neither suite covers a real Claude Code session. The scratch session does, checked by hand.

## A dev copy beside the release

Every skill and hook a session runs comes from one copy of Flow's repository. Install Flow with the README's line, which keeps the release at `~/.flow/repos/flow`. Only `flow update` moves the release. Then clone a second copy, the one you edit:

```sh
git clone https://github.com/Adrian333Dev/flow.git ~/code/flow-dev
```

A session runs the release until you start it on the dev copy, so a file you save in `~/code/flow-dev` never reaches your other projects.

### Starting a session on the dev copy

`--plugin-dir` loads a plugin from a folder for one session, and it replaces the installed plugin of the same name, `flow`. An alias, a short name the shell expands into a longer command, saves typing the flag every time. Add it to `~/.bashrc`, the file bash reads whenever a terminal opens, then load it into the terminal you are in:

```sh
echo "alias claude-dev='claude --plugin-dir ~/code/flow-dev/skills'" >> ~/.bashrc
source ~/.bashrc
```

Pasting the `alias` line alone into a terminal works in that terminal only, until it closes. Every new terminal reads `~/.bashrc` by itself.

- **`claude-dev`**, typed in any folder, starts a session on the dev copy's skills and mods. A skill that misbehaves in one of your projects can be fixed in `~/code/flow-dev` and tried in that project.
- **`claude-dev --resume`** lists this folder's sessions to pick one, and reopens it on the dev copy.
- **`claude-dev --resume <id>`** reopens one session by its id, such as `claude-dev --resume 4f2a9c1e-7b3d-4e8a-9f10-2c6d5e8b7a31`. Claude Code looks in the current folder's sessions first, then in every other project's, so it works from any folder. Each session is saved as `~/.claude/projects/<folder>/<id>.jsonl`, so the file name is the id.
- **A skill edit** shows the next time the skill loads. A new skill shows after `/reload-plugins`. A mod reloads on every save.

A session started any other way, from an editor's panel for one, runs the release's skills.

### What stays on the release

The alias reaches skills and mods alone. These still run from the release, through `~/.flow/scripts` and `~/.claude/`:

- the hooks and the status line
- the `flow` command, and every script a skill runs by its path under `~/.flow/scripts/`
- the helper agent, `/capture` and the rules for code comments

Try a change to one of them in [the scratch session](#the-scratch-session), which builds its run from the copy holding `try.sh`. Try a changed command with `node scripts/flow.js`.

### Releasing a change

The dev copy is an ordinary clone, and its branches are yours to manage:

1. Keep unfinished work on a branch. Changing one skill usually means changing 4 more, `home/AGENTS.md` and `home/settings.json`, and that takes several passes.
2. Switch back to `main` before fixing something another project needs today.
3. Merge the branch into `main` and push it.
4. Run `flow update`. The release pulls `main`, and every session runs the change.

## The scratch session

`lab/scripts/try.sh` builds a pretend computer under `tmp/try/<name>/`, installs this checkout's Flow on it the way a new user would, then starts a real Claude Code session inside it. It is the only way to test a change to `settings.json`, a hook or the install without installing anything. It needs Linux.

```sh
bash lab/scripts/try.sh                                  # a new run from the before-flow seed
bash lab/scripts/try.sh --seed set-up --name research-1  # a new run from another seed, with a name
bash lab/scripts/try.sh --name research-1                # reopen research-1 as it was left
bash lab/scripts/try.sh --name research-1 --fresh        # build research-1 again from its seed
bash lab/scripts/try.sh --save set-up                    # save the last run opened as the seed set-up
bash lab/scripts/try.sh --list                           # every run and every seed
bash lab/scripts/try.sh --delete research-1              # delete that run
bash lab/scripts/try.sh --project broken-board           # a new run's practice project from another folder
bash lab/scripts/try.sh --codex                          # a Codex session in place of Claude Code
```

From a terminal it starts the session, which takes the terminal over. From an agent's shell, it builds everything and prints the line to start it with:

```text
start the session from a terminal:

  bash /home/me/code/flow/tmp/try/before-flow/sandbox.sh
```

A skill edited in the clone is live inside a running session, since the pretend computer links to it. A change to `settings.json`, `install.sh` or `flow install` needs a new run, or `--fresh`. A change to `scripts/sessions/` needs the setup session opened again with `flow install` inside the run.

### Runs and seeds

**A run is one pretend computer**, a folder kept until you delete it:

```text
tmp/try/before-flow/
  home/        the pretend computer's home folder, seen inside as ~
  home/code/expense-tracker   the practice project
  remote.git   the stand-in for the flow-home repository
  sandbox.sh   the line that starts the session, rewritten every run
```

The first run of a name copies its seed into `home/`, builds the practice project, and runs `install.sh` where the seed has no Flow, ending in the setup session. Reopening the run starts a session with no install. Everything the session changes stays in the run.

**A seed is a saved computer**, under `tmp/computers/<name>/`, laid out like a home folder. A run starts as a copy of it, so a seed never changes:

- **`before-flow`**, the default: this computer as it was on 2026-09-23, with its own plugins, skills, rule files and settings. It tests `flow install` on a computer that already has a setup.
- **A seed saved from a run** that finished setup, such as `set-up`: the session opens with Flow already set up, for testing every other skill.

`--save <name>` saves a run's home folder as a seed, leaving out the practice project, session records and logins. It refuses a name that exists. `lab/scripts/save-computer.sh <name>` saves this computer instead, the way `before-flow` was made.

The install in a run is the real one: `install.sh --use` on this checkout, so uncommitted edits are tested, cloning from GitHub, with `--drafts` so the skills in `skills/drafts/` are reachable, and `FLOW_HOME_REMOTE` pointing at the run's `remote.git`.

### What the session sees

The session runs inside `bwrap` (bubblewrap), a Linux program that starts another program with a changed view of the disk:

- **The whole disk, read-only**, so the session cannot change your computer.
- **The run's `home/` as the home folder**, at your real home's path, so every `~` path lands in the run.
- **The repository, read-only**, apart from the run's own folder.
- **`node`, `claude`, and `codex` with `--codex`**, brought in read-only.
- **Your Claude Code login**, the one writable file from your real home, since Claude Code renews it by writing it.
- **A copy of `~/.gitconfig`**, since the practice project commits.

It starts with a fresh environment, so a variable exported in your shell, such as `FLOW_HOME`, never reaches it. `--codex` copies your Codex login in, and refuses when that login is a day from renewing, since a renewal inside would sign your real Codex out.

### The practice projects

A folder under `lab/scripts/test-projects/` fills the run's project, `--project <name>` picks one, and a new scenario is a new folder:

- **`expense-tracker`**, the default: a small expense tracker with tests and 9 tickets at every status, for running every phase against real code.
- **`broken-board`**: a ticket for every refusal, and 3 faults `flow check` finds.
- **`unfinished-work`**: a ticket at every status a handoff can leave, each with a `## State`.
- **`not-set-up`**: the expense tracker before Flow, for `flow init`.

A folder with a `build.sh` arrives set up, its tickets made by `flow new` and moved by the status commands. One without arrives not set up. Each project is a git repository of its own, since `flow` finds a project through `git rev-parse`.

### What it cannot fake

- **Your Claude account.** Plugins and settings synced to the account arrive whatever the home folder holds.
- **Another operating system.** Only a virtual machine covers that.
- **The Windows drives.** On WSL, `/mnt/c` stays readable inside.
