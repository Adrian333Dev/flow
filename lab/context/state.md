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
`flow overlays`, `flow audit`, `util` in full, and the test harness. Flow's suite passes 58 tests;
`util`'s own suite passes 29.

A large batch was decided on 2026-08-30 and two thirds of it was built the same day. The two records
behind it are `design-util.md` and `design-dev-loop.md`.

## Where each piece stands

**`flow install` builds two roots, and neither one exists on this machine.** Nothing is installed
here and that is the normal state, so `~/.claude/` and `~/.flow/` are both absent; `bash
lab/scripts/try.sh` builds them under `tmp/` instead. The split shipped 2026-08-30 with the
`--flow-home` flag the design had missed — one flag redirected the whole install beforehand, and
afterwards it covered half. `CLAUDE.md` → `## Repo rules` carries the rule. **From 2026-09-02 the
scratch configuration is seeded from `~/.claude/`** — the credentials, the account and the theme — so
a rebuilt session starts signed in instead of running first-install onboarding every time.

**`home/CLAUDE.md` opens with `## The turn`, added 2026-09-05.** 5 numbered steps covering one user
message from arrival to reply: telling an instruction from thinking, disagreeing before building,
scope, naming each action, and answering once at the end. It replaced 4 rules, 2 from `## Hard rules`
and 2 from `## Explaining`. `design-knowledge-base.md` → `## Locked decisions: conduct rules` carries
the arguments.

**The repo's own `CLAUDE.md` got a `## The turn` too, 2026-09-06.** 16 scattered bullets folded into
the same 5 steps: 11 approval rules plus `Move forward, never sideways`, `User dictates by voice` and
`Reason before agreeing` from `## Hard rules`, and `Assume only the final message is read`, `Think out
loud while you work` and `Never narrate being wrong` from `## Explaining`. Every dated ruling survives
inside the step that carries it. `## Hard rules` keeps 11 bullets, all conduct or repo mechanics, and
`Deletes need their own explicit confirmation` stays there because it has its own 2 exceptions. The
mirror rule is gone: the user ruled 2026-09-06 that the repo file no longer has to match the template,
since its content is replaced wholesale once the workflow is finished. The 2 `Mirror of
home/CLAUDE.md` preambles and the 3-bullet deviation note went with it.

**`home/CLAUDE.md` is 162 lines with no `## Hard rules`, 2026-09-06.** The flat section dissolved into
`## Reading` (3 bullets), `## Writing files` (6) and `## Tools` (3), and 4 bullets left it entirely:
`Skip a Flow step` to `## Workflow`, `User likely dictates` to `## The turn` step 1, `No cause without
evidence` to `## Judgment`, and `Every path named here is a default` to the top of the file. Grouping
first is what makes the split threshold measurable, and only `## Writing files` crosses it. `## The
turn` also absorbed `Never argue a decision already made` into step 2 and the capture confirmation
into step 5. `## Workflow` lost `/cut-from-spec` and `/start` from the chain and the whole typed-only
paragraph, so neither skill is named in the file now. Both `CLAUDE.md` files are at 0 em dashes.

**`## Scripts` was drained 2026-09-06, taking `home/CLAUDE.md` to 165 lines before the regrouping below cut it to 162.** The section went from 45
lines to 9: the 2 `util` commands with their signatures, and 3 sentences on `flow`. Out went
everything a bare `flow` prints, and every command the skill that runs it already names. 5 facts
moved to keep a home that loads when they fire: `--priority` only on request → `## Capture`;
`flow skills ls` → `## Workflow`, and on to `/research` when that paragraph was deleted 2026-09-06; create and fill in one command → `/groundwork` Phase 4; `done`
against `filed` → `/file-findings` step 8; id resolution → `references/workflow.md`. `flow edit`,
`flow dep`, `flow tree`, `flow check` and the `flow ls` flags are in no loaded file now, by decision:
the CLI's own help is their one home.

**`lab/study-cases/` holds 5 cases in 4 issue folders, as of 2026-09-06.** 3 were added that day, one
per behavior the user reported against Sonnet 4.6: `summary-instead-of-work`,
`reopened-settled-points` and `answered-before-acting`. Each quotes the user from the 2026-09-05
design transcript, because no failing session was kept. All 3 are `status: fixed` against
`home/CLAUDE.md`, since `## The turn` was written from them. The 2 older cases sit in
`premature-implementation`, both 2026-08-10 and both Opus 5.

**`/file-findings` is model-invocable as of 2026-09-06**, and `/start` and `/cut-from-spec` are the
only skills left carrying `disable-model-invocation`. The user accepted the trade: a hard switch
enforced by Claude Code becomes a soft rule the model follows. `/execute` now offers `/file-findings`
when a ticket closes and waits for a yes, which is where the suggestion belongs, since a ticket
closing is a moment no always-loaded file can see. `## Capture` keeps the other trigger, the 200-line
inbox, because inbox length has nothing to do with a ticket.

**`flow skills ls` takes `--group` and `--hidden` as of 2026-09-06.** `--hidden` keeps only what the
session is not being shown, which is the whole question when `/research` asks whether a skill for some
tool already exists: anything `on` is already in context with its description. An unknown `--group`
refuses with the list of real ones, because an empty table reads like a group with nothing in it.

**`docs/dev/context-cost.md` says which shortenings buy tokens**, written 2026-09-06. The short
answer: digits, symbols and abbreviations save nothing and abbreviations usually cost more; articles
are about 6% of `home/CLAUDE.md`; deleting a rule beats rewording thirty. It marks every claim as
measured on disk, documented by Anthropic, or derived from how byte-pair tokenizers work, because
Claude's tokenizer is not published.

**The off list names `web-pages` today**, and nothing else. Which groups are on moved out of
`CLAUDE.md` on 2026-09-01 and is now in `docs/dev/skills.md` → `## The groups`. Off globally and on
in one project is verified against Claude Code 2.1.251 and covered by a test.

**No list names a skill anywhere, as of 2026-08-30.** `home/skills` and `.claude/flow/skills` are
both deleted, along with `flow skills add` and `flow skills sync`. `flow install` reads the tree
instead, and the scratch session passes `--drafts` so a half-written skill is reachable there.

**`commands/` is dissolved, 2026-09-05.** The 4 skills it held moved to the group that fits what they
do: `start` and `handoff` to a new `session/`, `file-findings` to a new `knowledge/`,
`cut-from-spec` to `tools/`. The groups are `phases/`, `session/`, `knowledge/`, `tools/`, `stack/`,
`dev/` and `drafts/`. `standards/` is dissolved by the same decision and gone from every doc. Its
folder outlived the decision holding nothing but the `.info` file that kept an empty folder in git,
and the user confirmed the delete 2026-09-06. Nothing outside `skills/` reads a group name, so no code
changed and no install is owed. One path in `scripts/tests/skills.test.js` moved.

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

**The repo `CLAUDE.md` is 157 lines across 8 sections, and every one is a rule.** The file carries
neither status nor a map. The refactor that got it there ran 2026-09-01: `## Layout` and
`` ## `lab/` `` went to `docs/dev/layout.md`, taking 42 lines, and the 5 rules buried in those bullets
came up into `## Repo rules`. `## Authoring a skill` keeps the 6 decisions no page carries and hands
the how-to to `docs/dev/skills.md`. `## Trying a change` is 3 lines. `CHANGELOG.md`'s suspension sits
in `## Writing any file`. The 8th section is `## The turn`, added 2026-09-06.
`design-dev-loop.md` → `## The tree map left CLAUDE.md` has the measurements.

**`flow audit` is built, 2026-09-02.** It reads the transcripts Claude Code writes at
`~/.claude/projects/`, derives a SQLite index, and answers queries against it. Nothing is recorded
and nothing is intercepted, so the whole thing works on sessions that ran before it existed. **The
index is derived and rebuildable** — `flow audit index --rebuild` throws the file away and writes it
again, which is also what a schema change does. 3 modules under `scripts/flow/lib/audit/`: `store.js`
holds the schema, `scan.js` walks the transcripts, `files.js` decides which file a tool call touched.
`query.js` and `read.js` sit on top, and `/audit` is the skill. Measured on this machine: 51
transcripts, 241 MB, walked in 3 seconds into a 44 MB index of 79,676 events, 3,189 turns, 276
segments and 12,278 tool calls. **Reading resumes from a byte offset**, so a second run over an
unchanged file opens nothing. `design-audit.md` carries the design and what the build changed about
it; `backlog.md` → `## The audit` carries the 7 items left.

**Git writes are a switch, built 2026-09-01.** `flow git allow|ask|off` writes a `git` entry into
`~/.flow/settings.json`, and `guard.js` re-reads it before every shell command, so a change lands on
the next call with nothing to restart. Off is the default. Scope is the session unless `--project` or
`--global` widens it, an hour unless `--for` says otherwise, and the guard deletes an entry the first
time it looks at an expired one. All 19 git entries left `permissions.deny`, which makes `guard.js`
the only thing between the agent and git — so a throw there denies a git command rather than falling
through. Destructive commands ask however the mode is set, `worktree` joined `clone` as instructed,
and the agent running `flow git allow` is denied. `threads.md` → `git-writes` carries the arguments.

**`/run` was deleted 2026-09-01, replaced by Claude Code's shell mode.** Typing `! <command>` in the
input box shows the command beside its output and never reaches the model, which is what `/run` was
built to approximate. `home/settings.json` sets `respondToBashCommands: false`, so the output lands
in context and the next message decides what to do with it. **The guard does not fire on a shell-mode
command, verified 2026-09-02**, so `! flow git allow` is how the switch gets thrown and the input box
carries `CLAUDE_CODE_SESSION_ID` like the Bash tool does.

**Knowledge system capture and promotion are wired, 2026-09-04.** `home/CLAUDE.md` → `## Capture`
routes reusable knowledge to `.flow/findings/<subject>.md` with a duplicate filter against loaded
skills. `/file-findings` reads findings as a fourth input, routes to `rules/` alongside skills, and
deletes a findings file once drained. `rules/` exists at the repo top level, initially empty, and
`flow install` symlinks its files per-item to `~/.claude/rules/` in the same pass as skills and
agents. `design-knowledge-base.md` carries every locked decision.

**The enforcement bridge is designed in full, and only its skill is built, 2026-09-05.** One
`PreToolUse` hook on `Edit|Write` will run one script that records, warns and blocks, with each
check's own `tier` field deciding which. Checks are self-describing files at
`scripts/rule-checks/<id>.js`, so the folder is the registry. Every rule gets an ID written inline in
its bold label slot, and a check names the rule ID it enforces. An `InstructionsLoaded` hook tracks
which rule files are in context, so a warning carries the rule's text when the file is not loaded.
`flow scorecard` aggregates across sessions and prints stale checks, worst offenders, promotion
candidates and dead rules. The semantic-rule gap is closed: a check is any JavaScript function, and
rules no function can catch get a `UserPromptSubmit` reminder, which is the one piece still
undesigned.

**`/file-findings` owns the whole of it.** The user merged the separate `rule-checks` skill into it
on 2026-09-05, because a rule and its check are written in the same pass. The skill now reads `flow
scorecard` as a fifth input, writes a check for every rule it touches, and carries an 89-line
`references/write-checks.md` beside `write-skills.md`. **Nothing it describes exists yet**: no hook,
no `scripts/rule-checks/`, no `flow scorecard`. `design-knowledge-base.md` → `## Locked decisions —
the enforcement bridge` carries the design, and `## Build plan` carries the 6 steps left.

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
- `design-audit.md` — the audit: what a transcript line carries, why a segment is the grouping unit,
  the schema, the 3 tools the skill offers, and where the data lives. Built
- `design-knowledge-base.md` — the knowledge system: capture to `.flow/findings/`, promotion through
  `/file-findings`, the loading ladder, aging, and the enforcement bridge. Capture and promotion wired
  2026-09-04; enforcement bridge designed but unbuilt
