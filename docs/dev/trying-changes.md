# Trying a change

How to test a change to Flow before it reaches real work: the 2 test suites, a second checkout for a rework across several files, and the scratch session, a real Claude Code session on a pretend computer.

## Table of contents

- [The tests](#the-tests): 2 suites, no dependencies, and where they write
- [Two checkouts](#two-checkouts): a rework stays out of real projects until it holds
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

## Two checkouts

Every skill is a link into your clone, so saving a `SKILL.md` changes that skill at once, in every project and every open session. A rework across 5 skills would be half applied in real work for as long as it takes. 2 working copies of the repository solve it:

- **Stable, `~/code/flow`**: every link on the computer points here. Real projects run it.
- **Dev, `~/code/flow-dev`**: a second working copy on a branch, `git worktree add ../flow-dev <branch>`. Nothing points at it.

A quick fix you want live now goes in stable. A rework goes in dev, runs through the scratch session, and ships by merging the branch and pulling in stable. Run `flow install` again only when a skill was added, renamed or removed, since a link is named for its skill.

The unit of change is the whole clone, not one skill: changing one skill usually means changing 4 more, `home/AGENTS.md` and `home/settings.json`.

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
