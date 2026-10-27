# Developing Flow

How to change Flow itself: where the running copy lives, how an edit reaches a session, and which branch carries release 1.

## Table of contents

- [One copy runs on the machine](#one-copy-runs-on-the-machine): the dev copy is the installed copy
- [What an edit reaches at once](#what-an-edit-reaches-at-once): and what needs `flow install`
- [Taking a newer Flow](#taking-a-newer-flow): why `flow update` leaves the dev copy alone
- [The `v1` branch](#the-v1-branch): the branch release 1 is built on, and the return to `main`
- [Running the tests](#running-the-tests): the check before a change counts

## One copy runs on the machine

Flow runs from `~/.flow/repos/flow`. When you run `flow install` from a clone that lives somewhere else, that path becomes a link to the clone, so the clone you edit is the copy that runs. Here the clone is `~/code/flow-dev`:

```console
$ ls -ld ~/.flow/repos/flow
lrwxrwxrwx 1 me me 22 Oct 18 00:08 /home/me/.flow/repos/flow -> /home/me/code/flow-dev
```

`~/.flow/scripts`, `~/.flow/guides` and `~/.flow/docs` point into the same copy. No second copy exists to fall out of date.

## What an edit reaches at once

- **A script, a hook or a reference file**: the next command or the next session that reads it.
- **A skill's text**: a running session sees the edit without a restart.
- **A skill added, renamed or removed**: run `flow install`, which links skills one by one.

## Taking a newer Flow

`flow update` pulls Flow's clone and runs `flow install`. A linked clone is a checkout of your own, with work in it that a pull could disturb, so `flow update` refuses it and changes nothing:

```console
$ flow update
flow: ~/.flow/repos/flow is a link to /home/me/code/flow-dev, a checkout of your own that update leaves alone. Pull it yourself, then run flow install.
```

Pull in the dev copy with `git pull`, then run `flow install`.

## The `v1` branch

Release 1 uses a one-time development branch named `v1`. An installed copy never follows it. After release day the dev copy returns to `main`, and work carries on there.

## Running the tests

`npm test` inside `scripts/` runs Flow's suite. Its summary prints the passing and failing counts:

```text
ℹ pass 292
ℹ fail 0
```
