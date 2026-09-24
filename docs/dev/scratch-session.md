# The scratch session

`lab/scripts/try.sh` builds a pretend computer under `tmp/try/<name>/`, installs this repo's Flow on it the way a new user would, then starts a real Claude Code or Codex session inside it. A change to Flow is usually five skills, a rule in `home/AGENTS.md`, and a settings key together. The scratch session is the way to test all of them at once without installing anything on your real computer.

## Table of contents

- [Running it](#running-it)
- [Runs](#runs)
- [The cases](#the-cases)
- [Saving a computer](#saving-a-computer)
- [What the session sees](#what-the-session-sees)
- [Why it is not an install](#why-it-is-not-an-install)
- [The Codex session](#the-codex-session)
- [Editing during a run](#editing-during-a-run)
- [The scratch project](#the-scratch-project)
- [What the sandbox cannot fake](#what-the-sandbox-cannot-fake)
- [What it is for, and what it is not](#what-it-is-for-and-what-it-is-not)

## Running it

```sh
bash lab/scripts/try.sh                                    # a new computer, the run named empty
bash lab/scripts/try.sh --case before-flow                 # a computer you saved, the run named before-flow
bash lab/scripts/try.sh --case before-flow --name setup-1  # the same, the run named setup-1
bash lab/scripts/try.sh --name setup-1                     # reopen setup-1 as it was left
bash lab/scripts/try.sh --name setup-1 --fresh             # build setup-1 again from its case
bash lab/scripts/try.sh --list                             # every run, and how far each got
bash lab/scripts/try.sh --delete setup-1                   # delete that run
bash lab/scripts/try.sh --codex                            # a Codex session in place of Claude Code
bash lab/scripts/try.sh --project guards                   # a new run's project from another seed
```

It starts by saying where the run lives:

```text
the run setup-1, from the before-flow case
  home folder    /home/me/code/flow/tmp/try/setup-1/home, seen inside as ~
  Flow's files   /home/me/code/flow/tmp/try/setup-1/home/.flow
  project        /home/me/code/flow/tmp/try/setup-1/home/code/app, seen inside as ~/code/app
```

From a terminal, it then starts the session, which takes over the terminal. Run from somewhere with no terminal, such as an agent's shell, it builds everything and prints the line to start the session with:

```text
start the session from a terminal:

  bash /home/me/code/flow/tmp/try/setup-1/sandbox.sh
```

It needs Linux: the session runs under `bwrap`, which [What the session sees](#what-the-session-sees) covers.

## Runs

**Each run is a folder of its own, kept until you delete it.** `--name` names it, and a run with no name takes its case's name. Everything the session changes stays in that folder, so a setup you said go to leaves a computer with Flow set up, ready to test the other skills on.

```text
tmp/try/setup-1/
  home/        the pretend computer's home folder, seen inside as ~
  home/code/app   the scratch project, seen inside as ~/code/app
  remote.git   the stand-in for the GitHub repository ~/.flow/ lives in
  sandbox.sh   the bwrap line that starts the session, rewritten every run
  case         the case it was built from
  project      the seed its project was built from
```

- **The first run of a name** builds the folder from its case, then runs `install.sh`, and the install ends in the setup session. An ordinary session opens once you quit that one.
- **Running the same name again** reopens it as it was left, and starts the session with no install.
- **`--fresh`** builds that one run again from its case. No other run is touched.
- **`--list`** prints each run, its case, and whether it is not installed, installed with setup unfinished, or set up.
- **`--delete <name>`** deletes that run's folder.

## The cases

`--case` picks what a new run's computer holds before the install. Every case is signed in to Claude Code, and the case is copied, so a session can wreck its run freely.

- **`empty`**, the default: signed in to Claude Code, and nothing else. This is the case for testing a first install on a computer that has never had Claude Code set up.
- **A saved computer's name**: a copy of a real computer, made earlier with `save-computer.sh`. This is the case for testing `flow setup` on a computer that already has its own setup: plugins, skills, rule files, settings.

Every case starts at `install.sh`, the script behind Flow's one pasted install line, the way a new user's first step does. It runs from this checkout, with `--use` pointing at it, so the test covers edits you have not committed. It is the real install: util, the toolbox and the skill repositories are cloned from GitHub into the run's `~/.flow/repos/`, and util links its own names. `--drafts` is added, for the reason [Why it is not an install](#why-it-is-not-an-install) gives, and `--repo` answers the repository question with the run's `remote.git`.

## Saving a computer

`lab/scripts/save-computer.sh <name>` copies this computer's Claude Code and Codex setup into `tmp/computers/<name>/`, for `--case <name>` to start from later:

```sh
bash lab/scripts/save-computer.sh before-flow
```

```text
saved this computer as /home/me/code/flow/tmp/computers/before-flow (47M)
start a session on it: bash lab/scripts/try.sh --case before-flow
```

**A saved computer is never rewritten.** The script refuses a name that already exists, and `--fresh` never touches `tmp/computers/`. The point is to keep a computer as it was: yours changes the day Flow is installed on it, and the copy is what setup gets tested against after that.

It copies `~/.claude`, `~/.agents`, `~/.codex`, `~/.claude.json`, `~/.gitconfig` and the links in `~/.local/bin`. It leaves out 3 things:

- **What a session writes as it goes**: transcripts, history, caches and snapshots.
- **The logins.** Every run brings in your current one instead.
- **What a skill carries to run itself**, a `.venv` or `node_modules`. On this computer that is 800 MB, and setup never reads it.

What is left is about 50 MB, and takes a second and a half to copy.

A link in the copy that points elsewhere under your real home dangles inside the sandbox, the way it would on a computer where that folder is gone.

## What the session sees

The session runs inside `bwrap` (bubblewrap), a small Linux program that starts another program with a changed view of the disk. Only that program sees the change. Here, the session sees:

- **The whole disk, read-only.** Nothing the session does can change your computer.
- **The run's `home/` as the home folder**, mounted at your real home's path. `~` and every path built from it read the way they do on a real computer, and a write to `~` lands in `tmp/try/<name>/home/`.
- **The repo, read-only**, since Flow's skills link into it. The run's own folder inside it stays writable, so the install can reach `remote.git`.
- **`node`, `claude`, and `codex` with `--codex`**, each brought in read-only from where it is installed under your home folder, and linked from the scratch `~/.local/bin`.
- **Your Claude Code login**, the one file bound from your real home, writable. Claude Code renews the login by writing that file, and a copy that renewed would use up the token your real file holds.
- **A copy of `~/.gitconfig`**, since the scratch project commits. A saved computer brings its own.

The session starts with a fresh environment, carrying only `HOME`, `PATH`, the terminal's variables and WSL's. A variable exported in your shell, `CLAUDE_CONFIG_DIR` or `FLOW_HOME` among them, never reaches it.

Every path Flow writes to therefore lands in the pretend computer. `flow cases new` writes a study case into the run's `home/.flow/`, and `flow audit` reads only the transcripts of earlier scratch sessions.

## Why it is not an install

Nothing outside `tmp/` is written, apart from a renewal of your Claude Code login. The install inside does reach the network, to clone from GitHub. `~/.flow` and `~/.agents` are never read.

Four files from your real home are read. Each one answers a question the session would otherwise ask you:

- **`~/.claude/.credentials.json`**: bound in, so the session is signed in as you
- **`~/.claude.json`**: the account, the onboarding flag, and the terminal key binding
- **`~/.claude/settings.json`**: the colour theme, and nothing else
- **`~/.codex/auth.json`**, with `--codex` only: the Codex login

**Named keys are copied from `~/.claude.json`, never the whole file.** Your `~/.claude.json` also carries every project you have opened, every connected MCP server, and every skill's usage count. A session pretending to be a new computer should see none of it, so `try.sh` names the keys it takes and ignores the rest. A saved computer is the exception: it carries its own whole copy, since that is the computer being tested.

**`--repo` keeps GitHub out of it.** The install asks for the private repository `~/.flow/` lives in, and pressing Enter would make a real one on your GitHub account every time a run is built. The run's `remote.git` stands in for it, and `gh`'s login never enters the sandbox.

**`--drafts` links the skills in `skills/drafts/`**, which a real install skips. A draft is unreachable anywhere else, so every run passes the flag.

## The Codex session

`--codex` starts Codex instead of Claude Code, on the same case. Codex looks for skills in `~/.agents/skills/`, which is the pretend computer's. It sees Flow's skills as `$flow:groundwork`, and no rules: an install makes no Codex link, since Flow does not support Codex yet.

It starts signed in because `try.sh` copies `~/.codex/auth.json` into the scratch `~/.codex/`. A copy rather than a link, so nothing the session does can write your real login.

**It refuses when your Codex login is a day from renewing.** Codex renews the login by rewriting `auth.json` when the access token is 5 minutes from expiring, and a renewal uses up the old token. A scratch copy that renewed would sign your real Codex out. Run `codex` once anywhere, which renews the real file, and the next copy is fresh.

Codex has no Flow hooks yet. The scratch `~/.codex/` carries none of your settings, except in a saved computer.

## Editing during a run

Skills and agents are symlinked into the pretend computer, so `SKILL.md` there is the file in your clone. Write, save, invoke: the running session reads what you just wrote.

`settings.json` is a copy. A change to it, or to `install.sh` or `flow install`, needs a new run, or `--fresh` on the old one. A change to the setup's instructions in `scripts/flow/setup/` needs the setup session opened again: `flow setup` inside the run rewrites `~/.flow/setup-prompt.md`, the copy the session reads.

## The scratch project

Each run has its own project at `home/code/<seed>`, seen inside as `~/code/<seed>`, the path a project has on a real computer. The session starts there. Its tickets, handoffs, and inbox entries accumulate with the run, and `--fresh` rebuilds it with the rest.

**A seed fills it when the run is built.** A seed is a folder under `lab/scripts/seeds/`: a `files/` folder copied into the project, then a `seed.sh` that creates tickets with `flow new` and moves them with the verbs, so every status is `flow`'s own. `--project <name>` picks one for a new run. A new scenario is a new folder, and `try.sh` never changes.

- **`app`**, the default: a small expense tracker with tests, and 9 tickets that fit it. A parent at groundwork with one question left open, a child mid-build whose plan names real files with 2 of 4 steps in the code, a child blocked by it, an issue with a real bug one command reproduces, a topic half walked with the prototype it cut, a parked feature, a chore at review, a feature done. `docs/spec/expense.md` holds 2 features not yet cut. Every phase skill runs against code here, and the captured examples in `docs/manual/use/` come from this board.
- **`guards`**: every refusal has a ticket to hit, and `flow check` finds 2 faults written by hand. `GUARDS.md` in the project lists the commands that refuse.
- **`resume`**: a ticket at every status a handoff can leave, each with a `## State` and an `open` block, and a loose `notes/handoff.md` beside a draft.
- **`empty`**: the template and nothing else.

The `app` board, as `flow tree` prints it:

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
