# State: what Flow is right now

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
`flow overlays`, `flow audit`, `flow scorecard`, `util` in full, and the test harness. Flow's suite
passes 75 tests; `util`'s own suite passes 29.

A large batch was decided on 2026-08-30 and two thirds of it was built the same day. The two records
behind it are `design-util.md` and `design-dev-loop.md`.

## Where each piece stands

**`flow install` builds two roots, and neither one exists on this machine.** Nothing is installed
here and that is the normal state, so `~/.claude/` and `~/.flow/` are both absent; `bash
lab/scripts/try.sh` builds them under `tmp/` instead. The split shipped 2026-08-30 with the
`--flow-home` flag the design had missed: one flag redirected the whole install beforehand, and
afterwards it covered half. `CLAUDE.md` → `## Repo rules` carries the rule. **From 2026-09-02 the
scratch configuration is seeded from `~/.claude/`** (the credentials, the account and the theme) so
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
first is what made the split threshold measurable, and `## Writing files` was the only group to cross
it, which is the split the user then cancelled the next day. `## The turn` also absorbed `Never argue a decision already made` into step 2 and the capture confirmation
into step 5. `## Workflow` lost `/cut-from-spec` and `/start` from the chain and the whole typed-only
paragraph, so neither skill is named in the file now. Both `CLAUDE.md` files are at 0 em dashes, and so is the rest of the repo since the sweep of 2026-09-08.

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

**The enforcement bridge machinery is built and empty, 2026-09-07.** Steps 4 and 5 of
`design-knowledge-base.md` → `## Build plan`, brought forward because they are code and the rest of
that plan is writing. `scripts/rule-check.js` is the `PreToolUse` hook on `Edit|Write`, running every
check in `scripts/rule-checks/` and appending one line per result to
`~/.flow/scorecards/<session>.jsonl`. `scripts/instructions-loaded.js` is the `InstructionsLoaded`
hook, recording which rule files entered context, which is what decides whether a warning names a rule
id or injects the rule's whole text. `scripts/flow/lib/checks.js` loads and validates check files and
reads rule ids out of markdown; `scripts/flow/lib/scorecard.js` owns the append-only store; `flow
scorecard` prints the 4 lists and its own coverage. Both hooks are in `home/settings.json`.
**`scripts/rule-checks/` ships empty**, so both hooks return immediately, and the folder's `.info`
states the export contract. The first real check is now unblocked, because every rule has an id.
`FLOW_CHECKS` overrides the folder, which is how the 15 new tests drive it.

**Every rule in both `CLAUDE.md` files carries an id, 2026-09-07.** 57 in `home/CLAUDE.md` and 85 in
the repo file, 102 distinct once the two files' shared rules are counted once, which `flow scorecard`
prints as `0 rules measured, 102 not measurable`. The id sits in the bold slot the label used to
fill, so `- **Never run git mutations.** No `add`...` became ``- **`no-git-mutations`** No `add`...``
and nothing was paid twice. The user dropped the "run this pass on Sonnet 4.6" ruling the same day,
so it ran on Opus 5. **A shared rule shares its id on purpose**: `one-idea-per-sentence` is defined
in both files, `definedRules` in `scripts/flow/commands/scorecard.js` keeps the first, and the
scorecard counts the rule once rather than twice. A heading is a target too, from 2026-09-07:
`checks.js` collects heading slugs beside rule ids, `ruleText` returns a whole section when a check
names one, and `duplicateIds` reports an id its own file defines twice.

**Three rule shapes carry an id, not one.** `scripts/flow/lib/checks.js` matched only a bullet, so
`## The turn`'s numbered steps and every section-governing paragraph would have had no id. `ID_LINE`
now matches a bullet, a `1.` step and a bare paragraph, and the turn steps became a real ordered list
to fit. Extracting one rule's text also changed: a rule ends at the next rule that is **no deeper**
than it is, so a sub-bullet like `one-approval-runs-to-the-end` stops at the numbered step below
instead of swallowing it. 2 new tests, and the scorecard report test no longer pins the
not-measurable total, which now moves with every rule added to either file.

**Splitting `home/CLAUDE.md` into `rules/` files is off, 2026-09-07.** The user approved the split
earlier the same day, then reversed it: a rule file with no `paths:` loads every session at
`CLAUDE.md` priority, so the move buys length in the core file and nothing else, and that does not pay
for a second always-loaded file. `rules/` stays on disk holding only its `.info`, and it fills from
mining real projects rather than from moving existing text. The rule-ID pass survives on its own,
because a check names the rule ID it enforces.

**Both `CLAUDE.md` files were rewritten direct on 2026-09-07**, a first cut on Opus 4.8 and the rest
on Fable 5.1 against the user's line-by-line feedback. Direct means the rule stated and nothing arguing
for it: no mechanism behind it, no consequence the reader infers, no contrast with a rejected reading.
`home/CLAUDE.md` is 147 lines. It lost the path-default line, the `docs/` and `.flow/` paragraph, the
git-repo line (`scripts/flow/lib/root.js` already refuses to run outside one), and the `/debug`,
`/prototype` and `/research` triggers (their descriptions sit in context, and `/execute` and
`/groundwork` route to them). The 3 description bullets became 1. `## Capture` names the file behind
every route and sends a rule to `.flow/findings/` for `/file-findings` to promote, instead of straight
to `## Rules`; it also gained the `.flow/findings/scorecard.md` route the design had locked.
`## Explaining` gained `Recommend, never enumerate`, `Show the data`, `A synonym is not a definition`
and `Never point at an earlier message`, and a readable heading example. The repo `CLAUDE.md` is 152
lines, keeps every dated ruling and lost the story behind each. Its *This repo only, never carry it
back* clause went as stale: `## The turn` step 3 carried *one instruction runs to the last file* back
into `home/CLAUDE.md` on 2026-09-05. Model comparison tests ran the same day across Opus 4.6, Sonnet
4.6, Opus 4.8 and Opus 5: Opus 4.8 made the best cuts, Opus 4.6 dropped trigger conditions, Sonnet 4.6
cut least, Opus 5's prose is heaviest. `references/style.md` §6, §7 and §9 carry the direct-writing
rule. `lab/context/writing-feedback.md` carries the user's feedback verbatim and replaced
`rewrite-plan.md`. **Two more rulings landed on the rewrite itself.** The writing pass covers
*every markdown file*, never every file, because a TypeScript file has no use for it; it stayed in
`home/CLAUDE.md` because a plain "write me a README" loads no skill. A section pointer is written as
an anchor, `~/.claude/CLAUDE.md#preferences` rather than `` `## Preferences` in
`~/.claude/CLAUDE.md` ``.

**A project rule has two homes by scope, not one, settled 2026-09-07.** The user ruled that the
`## Rules` section of a project `CLAUDE.md` and `.claude/rules/` are the project-level copy of the
global split: always relevant goes in the always-loaded file, tied to a stack or a file type goes in
a rule file with `paths:`. `/file-findings` → `## Routing` now carries 4 lines instead of 3, and the
global half changed with it: a universal rule that is always relevant goes to the section of
`~/.claude/CLAUDE.md` that owns the subject, never to a `rules/` file with no `paths:`, which is the
second always-loaded file the user rejected earlier the same day.

**The rule-file review closed 2026-09-07, and 6 changes came out of it.** The user answered the id
pass with 10 topics, then 2 rounds of feedback on the answers. Built: `one-turn` cut, so `## The
turn` carries the id `the-turn` and the sentence under it is plain framing; a heading is a target,
its id being the slug of its own text; an id defined twice in one file reported by `flow scorecard`;
`references/style.md` § 11 stating the rule format; `## Scripts` reduced to signatures, with its
mandates moved to `## Reading` and `## Tools`; and `project-template/CLAUDE.md` dropping `## Rules`
for sections named after their subject. `rules-review.md` carries the decisions and the 3 items left
open.

**A duplicate id is only ever checked inside one file.** `home/CLAUDE.md` and the repo `CLAUDE.md`
shared 40 ids the day it was measured, deliberately, so flagging a cross-file duplicate would fire 40
times on a correct tree. Twice in one file has no legitimate case, and the check caught one on its
first run: `## Capture` and the rule `capture` inside it both slugged to `capture`, so the rule is
now `capture-on-sight`.

**The repo's own `CLAUDE.md` only has to align roughly**, ruled by the user 2026-09-07. It is not
part of the workflow, nothing installs from it, and duplicate ids inside it do not matter until
`home/CLAUDE.md` is installed. `home/` is the file that counts.

**Capture may write a file that is already loaded**, ruled by the user 2026-09-07. A mid-session edit
to `~/.claude/CLAUDE.md` is silently inert for that session, which is the wanted behavior: the write
lands on disk for the next session, and the agent that made it already knows what it wrote. No rule
was written about loaded files. The routing through `.flow/inbox.md` and `.flow/findings/` stays,
because a capture is an unreviewed guess and `/file-findings` is the review.

**Auto memory is off and was never a replacement for `## Capture`.** `home/settings.json` sets
`autoMemoryEnabled: false` and `home/settings.md` gives the reason, being per repository and
machine-local. A 2026-09-07 research pass read Anthropic's docs without reading Flow's own settings
and reported it as live. `claude-code-memory.md` settles 2 things the design did have wrong: editing
a loaded `CLAUDE.md` mid-session applies nothing and invalidates no cache, and a conduct rule is
checkable from the turn, because `MessageDisplay` carries Claude's prose, `PreToolUse` carries a
`prompt_id`, and `Stop` carries the final message and can block.

**No hook loads a skill or a rule file, closed 2026-09-07.** A condition richer than a path glob has
no mechanism: `InstructionsLoaded` cannot modify loading, `SessionStart` → `reloadSkills` only
re-scans the folder, and `UserPromptExpansion` fires only on a typed `/name`. A skill does take
`paths:` frontmatter, the same as a rule file, which Flow uses nowhere yet.

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
add/ls/drop`, namespace resolution, `util ls`, `util install`, and 3 namespaces: `git save`,
`fs tree|merge|link`, `github clone|bookmark`. Nothing in `design-util.md` is unbuilt. The repository
is [`Adrian333Dev/util`](https://github.com/Adrian333Dev/util), and its default branch was `master`
until 2026-08-31, because `git init` ran without `-b main`. **Nothing has run outside a test and a
scratch registry.** `util install` writes the `util` and `u` links into `~/.local/bin`, and it has
never been run against the real one.

**`docs/dev/` is written and `docs/manual/` is not, as of 2026-09-01.** 6 pages under `docs/dev/`:
an index, the repository layout, the two checkouts, the scratch session, the tests, and adding a
skill. Written to `references/style.md` § 10, and deliberately limited to what is locked: the
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
index is derived and rebuildable**: `flow audit index --rebuild` throws the file away and writes it
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
the only thing between the agent and git, so a throw there denies a git command rather than falling
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

**The enforcement bridge design, 2026-09-05. Its machinery landed 2026-09-07; see above.** One
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
`references/write-checks.md` beside `write-skills.md`. **Everything it describes now exists and holds
nothing**: both hooks, `scripts/rule-checks/` and `flow scorecard` all shipped 2026-09-07, and the
folder is empty until a rule has an id to name. `design-knowledge-base.md` → `## Locked decisions:
the enforcement bridge` carries the design, and `## Build plan` carries what is left.

**`lab/toolbox/` is a submodule beside `lab/util/`, added 2026-09-01.** It holds external tools filed
by job: MCP servers, plugins, skills, libraries, apps. Nothing loads it, nothing installs from it,
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

- `design-restructure.md`: why `global/` dissolved, and where everything moved
- `design-skills.md`: how a skill installs. `## Installing and showing` leads with the 2026-08-30
  reversal and keeps the superseded states below it
- `design-commands-as-skills.md`: why `commands/` is a group, and the verified Claude Code behavior
  behind it
- `design-public-docs.md`: the manual, the scopes in `style.md`, why the working store is `.flow/`,
  and the `~/.flow/` and `docs/dev/` decisions
- `design-util.md`: the utility CLI: why it is not `flow`, the namespaces, the source registry, and
  what it costs Flow. Built in full
- `design-dev-loop.md`: two checkouts, the scratch session, the `drafts/` group, and the real
  migration problem. Built, except the two checkouts, which are a procedure rather than code
- `design-audit.md`: the audit: what a transcript line carries, why a segment is the grouping unit,
  the schema, the 3 tools the skill offers, and where the data lives. Built
- `design-knowledge-base.md`: the knowledge system: capture to `.flow/findings/`, promotion through
  `/file-findings`, the loading ladder, aging, and the enforcement bridge. Capture and promotion wired
  2026-09-04; enforcement bridge designed but unbuilt
- `harness-portability.md`: running Flow on another harness or another model. What Claude Code needs
  to reach a non-Anthropic model, which providers sell a plan, what breaks, what Flow costs to port
  to Codex, and the `.agents/` layout. Researched 2026-09-06 and 2026-09-07, nothing locked
- `claude-code-memory.md`: what Claude Code does about instruction files, its own auto memory, and
  what a hook can load or see. Every fact documented rather than measured, with the page named.
  Researched 2026-09-07, nothing locked, and `docs/dev/claude-code.md` is its public home once
  written
- `rules-review.md`: the 2026-09-07 review of both `CLAUDE.md` files. Closed. What got built, the
  decision behind each change, and the 3 items left open
- `model-identity.md`: telling which model produced a piece of work. What each harness exposes, the
  status line as the sensor, and the 2 fields the scorecard record is missing. Researched 2026-09-06
  and 2026-09-07, nothing locked
