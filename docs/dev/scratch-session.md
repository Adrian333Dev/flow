# The scratch session

`lab/scripts/try.sh` builds a pretend computer under `tmp/try/<name>/` from a saved one, installs this repo's Flow on it the way a new user would where it has none, then starts a real Claude Code or Codex session inside it. A change to Flow is usually five skills, a rule in `home/AGENTS.md`, and a settings key together. The scratch session is the way to test all of them at once without installing anything on your real computer.

## Table of contents

- [Running it](#running-it)
- [Runs](#runs)
- [Seeds](#seeds)
- [Saving a seed](#saving-a-seed)
- [What the session sees](#what-the-session-sees)
- [Why it is not an install](#why-it-is-not-an-install)
- [The Codex session](#the-codex-session)
- [Editing during a run](#editing-during-a-run)
- [The practice project](#the-practice-project)
- [What the sandbox cannot fake](#what-the-sandbox-cannot-fake)
- [What it is for, and what it is not](#what-it-is-for-and-what-it-is-not)

## Running it

```sh
bash lab/scripts/try.sh                                  # a new run from the before-flow seed, named before-flow
bash lab/scripts/try.sh --seed set-up                    # a new run from another seed, named after it
bash lab/scripts/try.sh --seed set-up --name research-1  # the same, the run named research-1
bash lab/scripts/try.sh --name research-1                # reopen research-1 as it was left
bash lab/scripts/try.sh --name research-1 --fresh        # build research-1 again from its seed
bash lab/scripts/try.sh --save set-up                    # save the last run opened as the seed set-up
bash lab/scripts/try.sh --list                           # every run and every seed
bash lab/scripts/try.sh --delete research-1              # delete that run
bash lab/scripts/try.sh --codex                          # a Codex session in place of Claude Code
bash lab/scripts/try.sh --project broken-board           # a new run's practice project from another folder
```

It starts by saying where the run lives:

```text
the run before-flow, from the before-flow seed
  home folder    /home/me/code/flow/tmp/try/before-flow/home, seen inside as ~
  Flow's files   /home/me/code/flow/tmp/try/before-flow/home/.flow
  project        /home/me/code/flow/tmp/try/before-flow/home/code/expense-tracker, seen inside as ~/code/expense-tracker
```

From a terminal, it then starts the session, which takes over the terminal. Run from somewhere with no terminal, such as an agent's shell, it builds everything and prints the line to start the session with:

```text
start the session from a terminal:

  bash /home/me/code/flow/tmp/try/before-flow/sandbox.sh
```

It needs Linux: the session runs under `bwrap`, which [What the session sees](#what-the-session-sees) covers.

## Runs

**Each run is a folder of its own, kept until you delete it.** `--name` names it, and a run with no name takes its seed's name. Everything the session changes stays in that folder, so a setup you said go to leaves a computer with Flow set up, ready to test the other skills on.

```text
tmp/try/before-flow/
  home/        the pretend computer's home folder, seen inside as ~
  home/code/expense-tracker   the practice project, seen inside as ~/code/expense-tracker
  remote.git   the stand-in for the GitHub repository ~/.flow/ lives in
  sandbox.sh   the bwrap line that starts the session, rewritten every run
  seed         the seed it was built from
  project      the practice project it holds
```

- **The first run of a name** copies its seed into `home/` and builds the practice project. A seed with no Flow on it then runs `install.sh`, and the install ends in the setup session. An ordinary session opens once you quit that one.
- **Running the same name again** reopens it as it was left, and starts the session with no install. A run built from an agent's shell was never started, so its computer has no Flow yet, and it installs the first time you open it.
- **`--fresh`** builds that one run again from its seed. No other run is touched.
- **`--list`** prints each run with its seed, then each seed. Both say how far the computer got: no Flow, installed with setup unfinished, or set up.
- **`--delete <name>`** deletes that run's folder.

## Seeds

A seed is a saved computer: a folder under `tmp/computers/<name>/`, laid out the way a home folder is. A new run starts as a copy of it, so a session can wreck its run freely, and the seed never changes. `--seed <name>` picks one, and `before-flow` is the default.

```text
runs
  research-1           from set-up           set up
seeds
  before-flow          no Flow
  set-up               set up
```

- **`before-flow`**: this computer as it was on 2026-09-23, before Flow, with its plugins, skills, rule files and settings. A run from it tests the install and `flow setup` on a computer that already has its own setup.
- **A seed saved from a run** that finished setup: the session opens set up, with no install and no setup. This is the seed for testing every other skill.

A seed with no Flow starts at `install.sh`, the script behind Flow's one pasted install line, the way a new user's first step does. It runs from this checkout, with `--use` pointing at it, so the test covers edits you have not committed. It is the real install: util, the toolbox and the skill repositories are cloned from GitHub into the run's `~/.flow/repos/`, and util links its own names. `--drafts` is added, for the reason [Why it is not an install](#why-it-is-not-an-install) gives, and `FLOW_HOME_REMOTE` points the install at the run's `remote.git` in place of GitHub.

A seed that has Flow brings its `~/.flow/`, which holds everything its old `remote.git` held. The new run makes its `remote.git` from that copy and points `~/.flow/` at it, so `flow sync` works from the first session.

## Saving a seed

**`--save <name>` saves a run's computer as a seed.** Run the setup session once, change anything else you want the seed to start with, then save:

```sh
bash lab/scripts/try.sh --save set-up
```

```text
saved the run before-flow as the seed set-up (54M)
```

It saves the last run opened, or the one `--name` names. It copies the run's `home/` except 3 things:

- **The practice project under `~/code/`.** Each new run builds its own.
- **What a session writes as it goes**: transcripts, history, caches and snapshots.
- **The logins.** Every run brings in your current one instead.

**A seed is never rewritten.** `--save` refuses a name that already exists, and `--fresh` never touches `tmp/computers/`.

Flow's links in a seed point at the checkout that installed them, so a seed saved from `~/code/flow-dev` runs that checkout's scripts.

**`lab/scripts/save-computer.sh <name>` saves this computer instead**, the way `before-flow` was made. It copies `~/.claude`, `~/.agents`, `~/.codex`, `~/.claude.json`, `~/.gitconfig` and the links in `~/.local/bin`, and leaves out the same session files and logins, plus what a skill carries to run itself, a `.venv` or `node_modules`. On this computer that last part is 800 MB, and setup never reads it. What is left is about 50 MB.

A link in a seed that points elsewhere under your real home dangles inside the sandbox, the way it would on a computer where that folder is gone.

## What the session sees

The session runs inside `bwrap` (bubblewrap), a small Linux program that starts another program with a changed view of the disk. Only that program sees the change. Here, the session sees:

- **The whole disk, read-only.** Nothing the session does can change your computer.
- **The run's `home/` as the home folder**, mounted at your real home's path. `~` and every path built from it read the way they do on a real computer, and a write to `~` lands in `tmp/try/<name>/home/`.
- **The repo, read-only**, since Flow's skills link into it. The run's own folder inside it stays writable, so the install can reach `remote.git`.
- **`node`, `claude`, and `codex` with `--codex`**, each brought in read-only from where it is installed under your home folder, and linked from the scratch `~/.local/bin`.
- **Your Claude Code login**, the one file bound from your real home, writable. Claude Code renews the login by writing that file, and a copy that renewed would use up the token your real file holds.
- **A copy of `~/.gitconfig`**, since the practice project commits. A seed holding its own brings that instead.

The session starts with a fresh environment, carrying only `HOME`, `PATH`, the terminal's variables and WSL's. A variable exported in your shell, `CLAUDE_CONFIG_DIR` or `FLOW_HOME` among them, never reaches it.

Every path Flow writes to therefore lands in the pretend computer. `flow cases new` writes a study case into the run's `home/.flow/`, and `flow audit` reads only the transcripts of earlier scratch sessions.

## Why it is not an install

Nothing outside `tmp/` is written, apart from a renewal of your Claude Code login. The install inside does reach the network, to clone from GitHub. `~/.flow` and `~/.agents` are never read.

Three files from your real home are read:

- **`~/.claude/.credentials.json`**: bound in, so the session is signed in as you
- **`~/.gitconfig`**: copied in, for a seed that has none
- **`~/.codex/auth.json`**, with `--codex` only: the Codex login

Everything else the session sees of Claude Code, the account, the onboarding answers and the theme, comes from the seed's own `~/.claude.json` and `~/.claude/settings.json`.

**`FLOW_HOME_REMOTE` keeps GitHub out of it.** The install finds the private repository `~/.flow/` lives in, `flow-home` on your GitHub account, through `gh`, and makes it where it is missing. The run's `remote.git` stands in for it, and `gh`'s login never enters the sandbox. The variable exists for this script and the tests alone. It is never a way to give Flow another repository.

**`--drafts` links the skills in `skills/drafts/`**, which a real install skips. A draft is unreachable anywhere else, so every run passes the flag.

## The Codex session

`--codex` starts Codex instead of Claude Code, on the same seed. Codex looks for skills in `~/.agents/skills/`, which is the pretend computer's. It sees Flow's skills as `$flow:groundwork`, and no rules: an install makes no Codex link, since Flow does not support Codex yet.

It starts signed in because `try.sh` copies `~/.codex/auth.json` into the scratch `~/.codex/`. A copy rather than a link, so nothing the session does can write your real login.

**It refuses when your Codex login is a day from renewing.** Codex renews the login by rewriting `auth.json` when the access token is 5 minutes from expiring, and a renewal uses up the old token. A scratch copy that renewed would sign your real Codex out. Run `codex` once anywhere, which renews the real file, and the next copy is fresh.

Codex has no Flow hooks yet. The scratch `~/.codex/` carries the seed's settings.

## Editing during a run

Skills and agents are symlinked into the pretend computer, so `SKILL.md` there is the file in your clone. Write, save, invoke: the running session reads what you just wrote.

`settings.json` is a copy. A change to it, or to `install.sh` or `flow install`, needs a new run from a seed with no Flow, or `--fresh` on the old one. A change to the setup's instructions in `scripts/flow/setup/` needs the setup session opened again: `flow setup` inside the run rewrites `~/.flow/setup-prompt.md`, the copy the session reads.

## The practice project

Each run has its own project at `home/code/<project>`, seen inside as `~/code/<project>`, the path a project has on a real computer. The session starts there. Its tickets, handoffs, and inbox entries accumulate with the run, and `--fresh` rebuilds it with the rest.

**A folder under `lab/scripts/test-projects/` fills it when the run is built.** `--project <name>` picks one for a new run. A new scenario is a new folder, and `try.sh` never changes.

- **A folder with a `build.sh` arrives set up.** Its `files/` folder is copied in over the project template, with `.flow/settings.json` and `.flow/version` as `flow setup project` leaves them, since every `flow` command refuses a project without `.flow/`. Then `build.sh` creates tickets with `flow new` and moves them with the verbs, so every status is `flow`'s own.
- **A folder with no `build.sh` arrives not set up.** Its `files/` folder is copied in and committed, with no template, no `.flow/` and no tickets.

The 4 projects:

- **`expense-tracker`**, the default: a small expense tracker with tests, and 9 tickets that fit it. A parent at groundwork with one question left open, a child mid-build whose plan names real files with 2 of 4 steps in the code, a child blocked by it, an issue with a real bug one command reproduces, a topic half walked with the prototype it cut, a parked feature, a chore at review, a feature done. `docs/spec/expense.md` holds 2 features not yet cut. Every phase skill runs against code here, and the captured examples in `docs/manual/use/` come from this board.
- **`broken-board`**: every refusal has a ticket to hit, and `flow check` finds 3 faults written by hand. `GUARDS.md` in the project lists the commands that refuse.
- **`unfinished-work`**: a ticket at every status a handoff can leave, each with a `## State` and an `open` block, and a loose `notes/handoff.md` beside a draft.
- **`not-set-up`**: the expense tracker's code as a project looks before Flow, for `flow setup project` and the reminder a session shows in a folder not set up. Its `files` is a link to `expense-tracker/files`. Once set up, its board is empty, which is where `flow new` and a bare `/flow:start` get tried.

The `expense-tracker` board, as `flow tree` prints it:

```text
t001  Budgets per category                                                           groundwork  -  0/2 done
├── t002  Store budgets and set them                                                 building    -
└── t003  Show what is left in the report                                            todo        -  blocked by t002
t004  Report merges January to September into one month                              building    -
t005  Move the store from JSON to SQLite                                             groundwork  -  0/1 done
└── t006  Does node:sqlite ship in the installed Node, and does it survive 10k rows  building    -
t007  Recurring expenses                                                             parked      -  waits on the store decision in t005: a rule is a row in SQLite and a second file in JSON
t008  Test that add refuses a negative amount                                        review      -

8 tickets, 1 done or dropped hidden: flow tree --all
```

It is a git repository of its own, and it has to be: `flow` finds a project root through `git rev-parse`, so without one, every ticket the scratch session filed would land in Flow itself.

## What the sandbox cannot fake

- **Your Claude account.** Anything synced to the account, plugins or settings, arrives whatever the home folder holds.
- **Another operating system.** It is the same Linux with a different home folder. Only a virtual machine covers that.
- **The Windows drives.** On WSL, `/mnt/c` stays readable from inside, read-only like the rest of the disk.

## What it is for, and what it is not

It is the only way to test a change to `settings.json`, a hook, or the install without installing. It is also the way to test anything that reads or changes the computer, and `flow setup` is tested there against a saved computer. It is how the `skillOverrides` values were verified against a real Claude Code release.

It is not a way to try a single skill. Editing a skill is already live everywhere, which is the property [the two checkouts](checkout.md) exist to manage.
