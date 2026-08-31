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
`flow overlays`, `util` in full, and the test harness. Flow's suite passes 15 tests; `util`'s own
suite passes 29.

A large batch was decided on 2026-08-30 and two thirds of it was built the same day. The two records
behind it are `design-util.md` and `design-dev-loop.md`.

## Where each piece stands

**`flow install` builds two roots, and neither one exists on this machine.** Nothing is installed
here and that is the normal state, so `~/.claude/` and `~/.flow/` are both absent; `bash
lab/scripts/try.sh` builds them under `tmp/` instead. The split shipped 2026-08-30 with the
`--flow-home` flag the design had missed — one flag redirected the whole install beforehand, and
afterwards it covered half. `CLAUDE.md` → `## Repo rules` carries the rule.

**The off list names `web-pages` today**, and nothing else. Which groups are on moved out of
`CLAUDE.md` on 2026-09-01 and is now in `docs/dev/skills.md` → `## The groups`. Off globally and on
in one project is verified against Claude Code 2.1.251 and covered by a test.

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

**`docs/dev/` is written and `docs/manual/` is not, as of 2026-09-01.** 6 pages under `docs/dev/`:
an index, the repository layout, the two checkouts, the scratch session, the tests, and adding a
skill. Written to `references/style.md` § 10, and deliberately limited to what is locked — the
mechanics of changing Flow, `flow install`, `util`, the groups, the tree. Nothing describes the skill
set, which is still moving. The root `README.md` indexes both folders. `docs/manual/` waits on the
workflow being finished and the management skill existing.

**The repo `CLAUDE.md` is 154 lines, refactored 2026-09-01.** `## Layout` and `` ## `lab/` `` are
gone to `docs/dev/layout.md`, taking 42 lines with them; the 5 rules buried in those bullets came up
into `## Repo rules`. `## Authoring a skill` keeps the 6 decisions no page carries and hands the
how-to to `docs/dev/skills.md`. `## Trying a change` is 3 lines. `CHANGELOG.md`'s suspension sits in
`## Writing any file` now. **7 sections remain, and every one is a rule** — the file carries neither
status nor a map. `design-dev-loop.md` → `## The tree map left CLAUDE.md` has the measurements.

**`lab/toolbox/` is a submodule beside `lab/util/`, added 2026-09-01.** It holds external tools filed
by job — MCP servers, plugins, skills, libraries, apps. Nothing loads it, nothing installs from it,
and the rewrite that earns it a way back has not started. `repos/toolbox` is the old plain clone,
still on disk and redundant now.

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
  migration problem. Built, except the two checkouts, which are a procedure rather than code
