# The scratch session

`lab/scripts/try.sh` builds a throwaway install of Flow under `tmp/`, then starts a real Claude Code or Codex session against it. A change to Flow is usually five skills, a rule in `home/AGENTS.md`, and a settings key together. The scratch session is the way to test all of them at once without touching what your projects use.

## Table of contents

- [Running it](#running-it)
- [What it builds](#what-it-builds)
- [The Codex session](#the-codex-session)
- [Why it is not an install](#why-it-is-not-an-install)
- [Editing during a run](#editing-during-a-run)
- [The scratch project](#the-scratch-project)
- [What it is for, and what it is not](#what-it-is-for-and-what-it-is-not)

## Running it

```bash
bash lab/scripts/try.sh
bash lab/scripts/try.sh --codex     # the same install, in a Codex session
bash lab/scripts/try.sh --print     # rebuild, then print the command instead of starting
bash lab/scripts/try.sh --fresh     # delete tmp/try/ first, scratch project included
bash lab/scripts/try.sh --seed guards   # build the scratch project from another seed
```

The bare form ends by starting `claude`, or `codex` with `--codex`, which takes over the terminal and never returns. That is what you want from a terminal. From inside another session it is useless, so `--print` hands you the command to run yourself.

## What it builds

It runs the same command a real install runs, pointed at a folder that stands in for your home folder:

```sh
flow install --root tmp/try/root --no-bin --drafts
```

The scratch session therefore tests the arrangement an install produces, rather than a second arrangement the script assembled by hand. `.agents`, `.claude`, `.codex` and `.flow` all land under `tmp/try/root/`, and none of them in your real home folder.

`--drafts` links the skills in `skills/drafts/`, which a real install skips. A draft is unreachable anywhere else, so the scratch session passes the flag on every run.

`FLOW_HOME` is set for the session, so `flow cases new` writes a study case into `tmp/try/root/.flow/` rather than into your real ones.

`CLAUDE_CONFIG_DIR` is set too, to `tmp/try/root/.claude`, and `flow audit` reads transcripts from underneath it. A scratch session therefore sees only the scratch sessions before it, never your real history.

## The Codex session

`--codex` starts Codex instead of Claude Code, against the same install. Codex looks for skills in `~/.agents/skills/` under whatever `HOME` says, so the session gets `HOME=tmp/try/root`, and `CODEX_HOME=tmp/try/root/.codex` beside it. It sees Flow's skills as `$flow:groundwork` and the rules through the link `tmp/try/root/.codex/AGENTS.md`.

It starts signed in because `try.sh` copies `~/.codex/auth.json` into the scratch `.codex/`. A copy rather than a link, so nothing the session does can write your real login.

**It refuses when your Codex login is a day from renewing.** Codex renews the login by rewriting `auth.json` when the access token is 5 minutes from expiring, and a renewal uses up the old token. A scratch copy that renewed would sign your real Codex out. Run `codex` once anywhere, which renews the real file, and the next copy is fresh.

Codex has no Flow hooks yet, and the scratch `.codex/` carries none of your own settings.

## Why it is not an install

Everything lands under `tmp/`. Nothing outside it is ever written, and no name goes on your `PATH`: that is what `--no-bin` is for. `~/.flow` and `~/.agents` are neither read nor written, and `~/.codex/auth.json` is read only for `--codex`.

Three files under `~/.claude/` are read. Each one answers a question the session would otherwise ask you:

- `.credentials.json`: symlinked in, so the session authenticates as you
- `.claude.json`: the account, the onboarding flag, and the terminal key binding
- `settings.json`: the colour theme, and nothing else

The configuration is rebuilt on every run, so without them you answer all three every time.

**Named keys are copied, never the whole file.** Your `~/.claude.json` also carries every project you have opened, every connected MCP server, and every skill's usage count. A session pretending to be a fresh machine should see none of it, so `try.sh` names the keys it takes and ignores the rest.

## Editing during a run

Skills and agents are symlinked into the scratch configuration, so `SKILL.md` there is the file in your clone. Write, save, invoke: the running session reads what you just wrote.

The rule file `tmp/try/root/.agents/AGENTS.md` and `settings.json` are copies. Those two are the only reason to rebuild.

## The scratch project

`tmp/try/project/` is where the session works, and it survives between runs. Its tickets, handoffs, and inbox entries accumulate into something worth testing against. Wiping it every run destroyed that, so the project persists by default. `--fresh` is how you wipe it deliberately.

**A seed fills it the first time it is built.** A seed is a folder under `lab/scripts/seeds/`: a `files/` folder copied into the project, then a `seed.sh` that creates tickets with `flow new` and moves them with the verbs, so every status is `flow`'s own. `--seed <name>` picks one, and `--fresh` with it rebuilds the board. A new scenario is a new folder, and `try.sh` never changes.

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

## What it is for, and what it is not

It is the only way to test a change to `settings.json`, a hook, or the install arrangement without installing. It is how the `skillOverrides` values were verified against a real Claude Code release.

It is not a way to try a single skill. Editing a skill is already live everywhere, which is the property [the two checkouts](checkout.md) exist to manage.
