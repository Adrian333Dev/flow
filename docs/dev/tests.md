# The tests

Two suites, one per tool, and neither has a dependency. `node --test` is built into Node, so there is no runner to install and no `node_modules` to restore.

- [Running them](#running-them)
- [Where they write](#where-they-write)
- [The redirects](#the-redirects)
- [What they cover](#what-they-cover)

## Running them

```bash
cd scripts   && npm test     # flow
cd lab/util  && npm test     # util
```

`scripts/` is Flow's Node package root: `package.json` and `tests/` sit there, beside the code they test. `lab/util/` is a submodule with its own package root and its own suite, run the same way.

## Where they write

Flow's tests write into `tmp/tests/`, and `util`'s into `lab/util/tmp/tests/`. Both are gitignored, and neither suite writes anywhere else.

Each test gets a fresh folder, wiped before it runs. A test inheriting another test's registry or source tree fails in ways that look like a bug in the code.

## The redirects

Both tools write to real directories in normal use, so both take the real directory from the environment and the tests move it.

Flow's install has a flag per root — `--home` and `--flow-home` — and refuses one without the other.

`util` has three environment variables, and `tests/helpers/scratch.js` sets every one of them on every test:

- **`UTIL_HOME`** — where the source registry lives, normally `~/.util/`
- **`UTIL_PROJECT`** — the enclosing project, normally found through `git rev-parse`
- **`UTIL_BIN`** — the directory `util install` links into, normally `~/.local/bin`

They are set whether the test needs them or not. Unset, a test that dispatches from inside this repository picks up a real project source, and a test that runs `util install` puts symlinks on the `PATH` of whoever ran the suite.

## What they cover

Flow's suite covers the install arrangement, skill discovery and the group overrides, the `PreToolUse` guard, and the project overlays.

`util`'s suite covers the source registry, namespace resolution and the short form, a name claimed by two sources, the description reader, the shipped commands, and `util install`.

Neither suite covers a real Claude Code session. That is what [the scratch session](scratch-session.md) is for, and it is checked by hand.
