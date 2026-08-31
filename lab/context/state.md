# State — what Flow is right now

**This file is maintained as the work moves. Where it disagrees with disk, this file is the bug.**
Every other record under `lab/` is the opposite: a design doc says what was decided, and the code on
disk wins wherever the two have drifted apart.

**Read this file before touching skills installation, the scripts, or the docs tree.**

Status lives here rather than in `CLAUDE.md` because `CLAUDE.md` loads in every session. Editing it
costs a cache miss, and a test count changes far more often than a rule does. Nothing dated, counted
or half-built belongs in that file.

Open items are in `backlog.md`, at the repo root. This file says what exists; that one says what is
owed.

## What works today

`home/CLAUDE.md`, the `flow` tool, `project-template/`, every skill, `flow install`, `flow skills`,
`flow overlays` and the test harness. Flow's suite passes 15 tests; `util`'s own suite passes 29.

A large batch was decided on 2026-08-30 and two thirds of it was built the same day. The two records
behind it are `design-util.md` and `design-dev-loop.md`.

## Where each piece stands

**`flow install` builds two roots, and neither one exists on this machine.** Nothing is installed
here and that is the normal state, so `~/.claude/` and `~/.flow/` are both absent; `bash
lab/scripts/try.sh` builds them under `tmp/` instead. The split shipped 2026-08-30 with the
`--flow-home` flag the design had missed — one flag redirected the whole install beforehand, and
afterwards it covered half. `CLAUDE.md` → `## Repo rules` carries the rule.

**The off list names `web-pages` today**, and nothing else. Which groups are on is a rule, in
`CLAUDE.md` → `## Authoring a skill`. Off globally and on in one project is verified against Claude
Code 2.1.251 and covered by a test.

**No list names a skill anywhere, as of 2026-08-30.** `home/skills` and `.claude/flow/skills` are
both deleted, along with `flow skills add` and `flow skills sync`. `flow install` reads the tree
instead, and the scratch session passes `--drafts` so a half-written skill is reachable there.

**`util` is a second CLI and a submodule of this repo at `lab/util/`,** built 2026-08-30 and
finished 2026-08-31. Working today: the dispatcher, the `~/.util/sources` registry, `util source
add/ls/drop`, namespace resolution, `util ls`, `util install`, and 3 namespaces — `git save`,
`fs tree|merge|link`, `github clone|bookmark`. Nothing in `design-util.md` is unbuilt. The repository
is [`Adrian333Dev/util`](https://github.com/Adrian333Dev/util), and its default branch was `master`
until 2026-08-31, because `git init` ran without `-b main`. **Nothing has run outside a test and a
scratch registry.** `util install` writes the `util` and `u` links into `~/.local/bin`, and it has
never been run against the real one.

**Flow depends on `util`, and 3 scripts left `scripts/` to make that true.** `gsave.sh`, `ptree.js`
and `fmerge.js` moved on 2026-08-30, becoming `git save`, `fs tree` and `fs merge`. `flow install`'s
`BIN` is down to `flow` and `fw`, and `util install` owns the other links. **The prerequisite is
real but soft:** `open.js` runs `util fs merge` off `PATH`, and a machine without `util` still opens
the ticket and prints `util is not on PATH` where the files would have been. The coupling is
acceptable only while `util` is public.

## Which design record covers what

All under `lab/context/`, and every one is history rather than status.

- `design-restructure.md` — why `global/` dissolved, and where everything moved
- `design-skills.md` — how a skill installs. `## Installing and showing` leads with the 2026-08-30
  reversal and keeps the superseded states below it
- `design-commands-as-skills.md` — why `commands/` is a group, and the verified Claude Code behavior
  behind it
- `design-public-docs.md` — the manual, the scopes in `style.md`, why the working store is `.flow/`,
  and the `~/.flow/` and `docs/dev/` decisions
- `design-util.md` — the utility CLI: why it is not `flow`, the namespaces, the source registry, and
  what it costs Flow. Built in full
- `design-dev-loop.md` — two checkouts, the scratch session, the `drafts/` group, and the real
  migration problem. Unbuilt
