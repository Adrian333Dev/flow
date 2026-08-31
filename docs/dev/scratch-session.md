# The scratch session

`lab/scripts/try.sh` builds a throwaway Claude Code configuration under `tmp/`, then starts a real session against it. A change to Flow is usually five skills, a rule in `home/CLAUDE.md` and a settings key together, and this is the way to run all of it at once without touching what your projects use.

- [Running it](#running-it)
- [What it builds](#what-it-builds)
- [Why it is not an install](#why-it-is-not-an-install)
- [Editing during a run](#editing-during-a-run)
- [The scratch project](#the-scratch-project)
- [What it is for, and what it is not](#what-it-is-for-and-what-it-is-not)

## Running it

```bash
bash lab/scripts/try.sh
bash lab/scripts/try.sh --print     # rebuild, then print the command instead of starting
bash lab/scripts/try.sh --fresh     # delete tmp/try/ first, scratch project included
```

The bare form ends in `exec claude`, which never returns. That is what you want from a terminal and useless from inside another session, so `--print` hands you the command to run yourself.

## What it builds

It runs the command a real machine runs, with both roots redirected:

```
flow install --home tmp/try/home --flow-home tmp/try/flow --no-bin --drafts
```

The scratch session therefore tests the arrangement an install produces, rather than a second arrangement the script assembled by hand. Both roots move together because `flow install` refuses one flag without the other.

`--drafts` links the skills in `skills/drafts/`, which a real install skips. A draft is unreachable anywhere else, so the scratch session passes the flag on every run.

`FLOW_HOME` is exported into the session, so `flow cases new` writes a study case into `tmp/try/flow/` rather than into your real ones.

## Why it is not an install

Everything lands under `tmp/`. `~/.claude` and `~/.flow` are neither read nor written, and no name goes on your `PATH` — that is what `--no-bin` is for.

The one path reached outside the repository is `~/.claude/.credentials.json`, symlinked into the scratch configuration so the session can authenticate. Without it the session starts and asks you to log in, which the script warns about.

## Editing during a run

Skills and agents are symlinked into the scratch configuration, so `SKILL.md` there is the file in your clone. Write, save, invoke — the running session reads what you just wrote.

`CLAUDE.md` and `settings.json` are copies. Those two are the only reason to rebuild.

## The scratch project

`tmp/try/project/` is where the session works, and it survives between runs. Its tickets, handoffs and inbox entries accumulate into something worth testing against, which wiping it every run destroyed. `--fresh` is how you wipe it deliberately.

It is a git repository of its own, and it has to be: `flow` finds a project root through `git rev-parse`, so without one every ticket the scratch session filed would land in Flow itself.

## What it is for, and what it is not

It is the only way to test a change to `settings.json`, a hook, or the install arrangement without installing — it is how the `skillOverrides` values were verified against a real Claude Code release.

It is not a way to try a single skill. Editing one is already live everywhere, which is the property [the two checkouts](checkout.md) exist to manage.
