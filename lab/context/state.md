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

`home/CLAUDE.md`, the `flow` tool, `project-template/`, every skill, `flow install`, `flow doctor`,
`flow skills`, `flow overlays`, `flow audit`, `flow scorecard`, `util` in full, and the test harness.
Flow's suite passes 89 tests; `util`'s own suite passes 37.

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
`flow dep`, `flow tree` and the `flow ls` flags are in no loaded file now, by decision:
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
The folder's `.info` states the export contract. `FLOW_CHECKS` overrides the folder, which is how the
15 tests drive it. **The folder stopped being empty on 2026-09-10**; see below.

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

**The skill groups are 3, cut from 5 on 2026-09-08.** `phases/`, `tools/` and `stack/`, plus `dev/`
and `drafts/`. `session/` and `knowledge/` were dissolved into `tools/`, taking `start`, `handoff` and
`file-findings` with them. The deciding argument is that a group's only function is the on/off switch:
`stack/` is the only group set differently, `phases/` is the only closed set with a rule behind it, and
nothing distinguished the other 3 from each other. `knowledge/` held 1 skill and was never going to hold
more. No code changed, because `flow install` reads the tree. `docs/dev/skills.md`, `docs/dev/layout.md`,
`references/write-skills.md`, `home/settings.md`, `README.md`, the repo `CLAUDE.md` and one path in
`skills.test.js` moved with it.

**`project-template/CLAUDE.md` is 8 lines and holds no rules, 2026-09-08.** 2 comments, both fill-in
prompts, both deleted the moment their section is written. The 3 rules that had been sitting in comments
are gone: section naming and `.claude/rules/<topic>.md` with `paths:` were already in `/file-findings` →
`## Routing`, and the *global rules live at `~/.claude/CLAUDE.md`* line was cut by the user, on the
grounds that a machine without the install skill is broken whatever the template says. A rule in a
comment is broken by construction, since `placeholder-comments-are-deleted` deletes the comment.
`project-template/.claude/settings.json` now ships too, holding an empty `skillOverrides`, which is what
a project writes into to turn a `stack/` skill on.

**`/groundwork` was rewritten around a pile of input, 2026-09-08.** Phase 1 gained the greenfield
folder, `groundwork/<slug>/` where you are standing, and the case of a directory that becomes a project
mid-run. `## Arriving` had 3 entry paths for one day and was cut back to 2 the same day: the 3-way list
branched on where you were standing, every arrow pointed at Phase 1, and it repeated `### 1. Pick the
folder` 12 lines above it. The only thing that actually differs on arrival is whether a ticket has a
status to move. The 2026-08-09 two-mode decision in `remaining.md` had covered the product path, and the
modes dissolving took it with them. **The product mode's outputs never went**: Phase 4 still routes
through `references/write-spec.md` and still invokes `/cut-from-spec`.

**Nothing written before the session is settled, 2026-09-08.** The rule the whole intake design rests
on, set by the user against 5 real folders at `tmp/planned-projects/`: 34,327 lines, 62 files, the
largest folder 12,209 lines on its own. One of them carries a heading reading *Decisions locked* with 25
entries, all reached in a context-starved web chat with no compaction. The user's ruling: those are not
decisions and they are not proposals either, because a weaker model produced them and an agent must
never launder them into its own Phase 2 recommendation. What a pile is reliable about is **which
questions exist**, never the answers, and a constraint somebody hit, because that is a consequence
rather than a judgment. Every claim becomes a branch walked from the start.

**`references/read-intake.md` is the procedure for a large pile, 2026-09-08.** 70 lines, loaded only
when a folder of pre-Flow material exists, following `style.md` §4: a case changing more than half a
step gets its own file. List with sizes before reading anything, read the small navigation files first,
write `index.md`, propose the cleanup, leave the big files closed until a branch needs one. **The
deciding evidence came from the user's own good folder**: a 129-line master index was the only place
recording that a 296-line design beside it had been rejected. Reading that design first, an agent has no
way to tell. `docs/intake/index.md` is agent-written and rewritten whole, so later runs read 129 lines
instead of 12,000. `references/workflow.md` no longer says intake is *preserved as-is*, and a ticket
folder may now hold `intake/` for material dropped in for one job.

**Rejected is not dead**, set by the user 2026-09-08. A design turned down because its mechanism failed
is a live open decision carrying evidence about what does not work, which is worth more than a blank
branch. It stays in intake, marked rejected.

**A child map splits on independence, never on size, 2026-09-08.** `/groundwork` Phase 2 used to say
*most never need it* about `--type topic --parent`, which is right for a feature and wrong for a
product. The criterion is now whether the branch can be settled without answers from its siblings, since
one `map.md` already spans as many sessions as it takes and a long section spills to
`<index>-<name>.md`. **A decision binding more than 1 child goes to the parent's map**, named with the
child that raised it. That last rule is unproven and logged in `backlog.md`: no product has been split
into child maps yet.

**The first rule check shipped 2026-09-10, and it is not the one the backlog named.**
`scripts/rule-checks/js-and-ts.js`, `measure` tier, `needs: 'added'`, against the `js-and-ts` rule in
`rules/comments.md`. It counts a run of 2 or more `//` lines directly above a top-level function,
class, or `const` bound to an arrow. 8 tests in `scripts/tests/rule-checks.test.js`, every example
taken off disk or out of `git show HEAD~1`.

**`never-restate-the-line` was the first candidate and it does not survive measurement.** The
proposed matcher took the comment's words, dropped stopwords, and fired when every remaining word
appeared in the identifiers on the line below. Run over all 63 JS files it returned 1 hit, and the
hit was a `// ---- rule ids` section divider above a `test('rule ids …')` call. Zero real
violations, one false positive. `references/write-checks.md` had already ruled it out: its giveaway
sentence cannot be finished for a rule about whether a comment carries information. The backlog now
carries the measurement so nobody retries it.

**The check was narrowed by counting, not by taste.** A run of `//` above any top-level `const` is
21 sites in this repo, and one of them sits on a `require` line, so plain values are skipped: the
rule names a file header, a class or a function, and nothing else. Narrowed that way the repo has 0
violations today, which is the expected state for a rule already being followed, and `needs: 'added'`
means the check measures new code rather than the 21.

**The user ruled comment shape minor, 2026-09-10.** Their words: comments are "not a major issue",
"we shouldn't make the agent deal with it while we have a lot more important things to focus on",
keep the rules "a little bit loose". Three consequences. `rules/comments.md` opens with a line saying
none of it is worth stopping work for. The check stays at `measure` permanently rather than earning
`warn`, which is now written into both `scripts/rule-checks/.info` and `write-checks.md` as a general
rule: a rule the user has called minor never gets promoted, whatever the scorecard says. And nothing
in a live `try.sh` run will print a warning, because `rule-check.js` skips `additionalContext` at
that tier.

**What was actually missing was a trigger, not an instruction.** `references/write-checks.md` beside
`/file-findings` already said find the giveaway first, collect real examples, never invent one, and
start every check at `measure`. It was not read, because that file is reached through a skill that
only runs during a filing pass, and this check was written straight off the backlog.
`scripts/rule-checks/.info` now carries the requirement, since it is the file an agent opens at the
moment it decides to add a check.

**The enforcement loop ran live for the first time, 2026-09-10.** A session under
`bash lab/scripts/try.sh`, the user driving. Asked for a small TypeScript file, the agent wrote two
`//` lines above `function formatDuration`, `js-and-ts` fired, and `flow scorecard` read the row back
as 1 broken of 1. **A true positive nobody set up**: the agent was never told anything about comment
style, and it reached for the line form on a declaration by itself, which is the habit the rule
exists to catch. Both hooks work: `instructions-loaded.js` recorded 3 `loaded` rows, and the result
row carried `effort: "high"`, the first time a real effort level has been captured.

**The path-scoped rule really does miss a file being created, and that is the hook's whole
justification.** `rules/comments.md` is **not** in the session's `loaded` rows. Only the 3
`CLAUDE.md` files loaded. The session opened no TypeScript file, so the path glob never matched, so
the comment rules were never in context when the agent wrote TypeScript. `scripts/rule-check.js`
opens by claiming exactly this hole exists; the run is the first evidence for it rather than an
argument.

**The hole is new files only, and the documentation says so, 2026-09-10.** The memory page states it
outright: *Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool
use.* Editing or overwriting a file that already exists requires reading it first, so the rule loads
before the edit lands and every edit to existing code is covered. Creating a file is the entire gap.
Nothing widens it: `InstructionsLoaded` fires after a file loads and cannot change what loads, which
was researched and closed 2026-09-07. The consequence is now written into
`skills/tools/file-findings/references/write-checks.md` and `scripts/rule-checks/.info`: **a
path-scoped rule that matters starts at `warn`**, because that is the tier where the hook injects the
rule's whole text at the moment it is broken. `rules/comments.md` stays at `measure` anyway, since
the user ruled comment shape minor, and a minor rule absent on a new file is a coherent outcome.

**The hook costs 31 ms, measured over 10 runs, against a guess of 50 to 100.** Almost all of it is
Node starting up: the check itself walks a few dozen lines. Nothing here needs optimising.

**What the run could not reach.** At `measure` the agent is told nothing, so it never learned and
would write the same thing again. That is the trade the user chose for comment shape and it is
correct for a minor rule. It also means the rule-text injection path, where a warning carries the
rule's whole text because the rule's file never loaded, has still never run under Claude Code.
`checks.ruleText` is unit-tested only. The backlog now carries that gap.

**Every scorecard result records the effort level, 2026-09-08.** `PreToolUse` carries `effort` as an
object with a `level` field, so `scripts/rule-check.js` stores it beside `project`. The model does not
follow: `model` reaches a hook on `SessionStart` alone, where it can be omitted and where a later
`/model` switch is invisible. Both are impossible to backfill, which is why effort went in before any
check exists to produce a row.

**`flow check` has never existed**, and this file said it did until 2026-09-08. The verification command
is `flow doctor`, named by the user to match Claude Code's own `/doctor`. It owns what a function can
decide about an installed machine; the management skill owns the live half.

**The skills passed the `style.md` writing pass, 2026-09-08.** 75 spelled-out counts became digits under
§6 across 16 files, and 6 sentences that had to be read twice were split. `/web-pages` is excluded until
it is rebuilt on `browser-harness`. The em dash sweep was finished separately by the user the same day:
3,529 dashes across 151 files, with 6 left on purpose as data. `/groundwork` got a second, deeper pass
later that day on the user's report that it read as unintelligible. The fault was a compressed
aphoristic style that only works for a reader who already knows the answer: *the work before the work*,
*order is a dependency claim*, *turning the crank*, *force a distant analogue*, *a group with nothing
under it is an agenda*.

**`style.md` §4 has a 4th branch shape, 2026-09-08: the entrance.** The other 3 are exits, matched
against by a reader who does not yet know which line is theirs, so a label there is a test. A reader
arriving already knows how they got here, so a label is recognition and has to name what they can see.
3 drafts of `/groundwork`'s `## Arriving` were rejected before the shape was named, all 3 because they
labelled cases by a state the reader would have to work out.

**`ui-is-drawn` was merged into `invoke-the-skill`, 2026-09-08.** `home/CLAUDE.md:49` now reads *Anything
drawn: structure, architecture, layout, density, hierarchy, colour → `/visualize`*. The rule it replaced
added 3 nouns and a *never improvise a diagram or a mockup* clause that `invoke-the-skill` already
carried as *never improvise its job*. The repo's own copy at `CLAUDE.md:82` stays, because this file has
no `## Workflow` section to fold into.

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
add/ls/drop`, namespace resolution, `util ls`, `util install`, `util uninstall`, and 4 namespaces:
`claude proxy`, `fs tree|merge|open|link`, `git save|work`, `github clone|bookmark`. The last three
commands arrived from Flow on 2026-09-09. Nothing in `design-util.md` is unbuilt. The repository
is [`Adrian333Dev/util`](https://github.com/Adrian333Dev/util), and its default branch was `master`
until 2026-08-31, because `git init` ran without `-b main`. **Nothing has run outside a test and a
scratch registry.** `util install` writes the `util` and `u` links into `~/.local/bin`, and it has
never been run against the real one.

**`util uninstall` shipped 2026-09-11**, and the suite is 41 tests. It removes what `install` wrote
and nothing else: the two links, and this clone's `commands/` line in the registry. A source
registered by hand stays, `~/.util` stays, and the clone stays. A name it did not create is left
alone and named in the output, which covers a real file somebody else owns and a link into a second
util clone. Already gone exits 0, so re-running is safe. `README.md` § Installing now starts at
`git clone`, because it opened on `node <clone>/util.js install` and never said where the clone came
from.

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

**`/groundwork` was audited against the `flow` source 2026-09-09, and 8 issues came out.** Nothing is
fixed yet; the list is the deliverable. **The status and the artifact can disagree, and today the
skill trusts the status**: `## Arriving` branches on `status: groundwork` plus whether anything is
still `[ ]`, and an untouched `map.md` has nothing `[ ]`, so it takes the finished branch and routes
decisions nobody made. **The user overturned the patch**: the rule is that the artifact decides which
phase you are in and the status is corrected to match, because a third branch fixes one mismatch and
leaves `todo` with a half-walked map, `building` with open questions, and a finished map whose tickets
already exist. `lab-records-are-history` already says disk wins over a record. The other 7: `flow new
--body` replaces the ticket template outright (`store.js:269`) so `## Done when` never lands, which
`/execute:34` already catches but describes wrongly; the skill lists 3 groundwork folders and
`workflow.md:30` lists 2; `## Assumptions` at `SKILL.md:194` names no file and appears nowhere else in
the repo; Phase 3 is numbered as a step but runs at 3 moments, 2 of them inside Phase 2's walk; "not
worth building" reaches for `flow park` where `flow drop` is the verb, and `statuses.js:51` gives
`parked` `satisfies: false` so dependents block forever with no repair path; the `map.md` template puts
rules inside a placeholder comment, against `placeholder-comments-are-deleted`; and `research:95` says
"A question never becomes a ticket of its own" with no qualifier, colliding on the page with
`groundwork:135` cutting a `prototype` ticket.

**Intake is material carrying work already done, not files and not age.** Ruled by the user
2026-09-09, replacing two wrong definitions in a row: "a pile from before Flow" (`read-intake.md:1`)
and "the run was pointed at files instead of being told the idea". Neither holds, because a file
holding only the user's idea is ordinary input and a research report generated yesterday is intake.
The test is whether the material carries conclusions somebody else reached. That is also the danger:
it looks settled because real work went into it. `read-intake.md` is still written around the specific
folders under `tmp/planned-projects/`, quoting an audit of them as evidence, which the user rejected as
over-fitting. Unbuilt.

**`## References` and the `open` block are different mechanisms, and only `/execute:187` said so.**
`## References` is durable, written by whoever cut the ticket, and survives to `done`; `## State`
holds work in flight and is deleted at review. The `open` block is a fenced block inside `##
State`, `/handoff` writes it, and `flow get --files` loads every file it names before the session's
first turn. **The user ruled 2026-09-09 that `/groundwork` says nothing about any of this**: the
manuals explain the mechanism, `references/workflow.md` gets a note for the agent, and the block is
generalized to work with any file. The section's example lists `/visualize`, which is correct: the
rule above it names "a skill that covers it" as a reference worth a line.

**A ticket body cannot legitimately run long, and 8 of the 9 creation sites already cap it.** Walked
2026-09-09. Capture and `--from-groundwork` write no body at all; `/debug` carries 3 things and never
the hunt, which lives in `reports/`; `/prototype` caps at 3 questions; `/cut-from-spec` says never copy
a whole spec section; `/groundwork:202` says copy only the lines that ticket needs. The uncapped one is
the child topic ticket at `/groundwork:120` and `:203`, "carrying what this map already settled about
it", which is where 300 lines could really come from and should point at the parent's map instead. The
user was convinced by the 4 costs of `--body -` and invited pushback; **the pushback is that `--body -`
stays**, because every post-stdin failure (`--deps`, `--parent`, empty title, existing directory, bad
`--type`) is knowable before the command runs, what is lost is now 20 to 60 lines, and the atomicity it
buys does not shrink with size. Create-then-`Write` is the escape hatch past about 100 lines, and
`flow new` prints both file paths so nothing has to guess one.

**`docs/manual/tickets.md` is the home for the ticket shape**, decided by the user 2026-09-09: a page
saying what a ticket is, what each status means, and what belongs in the body against the map or the
spec, with a placeholder template at the bottom rather than a filled-in sample. Every frontmatter field
carries its alternatives in a trailing `#` comment, and `frontmatter.js` → `parseBlock` skips full-line
comments and strips trailing ones, so the shape parses as a real file.

**Global groundwork goes to `~/.flow/groundwork/<slug>/`**, proposed by the user 2026-09-09 to replace
`groundwork/<slug>/` in whatever directory you are standing in, which is litter nobody finds again.
`~/.flow/study-cases/` is the precedent. **"No project" means no git repository**, not a missing
`.flow/` folder: `root.js` runs `git rev-parse --show-toplevel` and throws when it fails. **`FLOW_PROJECT` is the way through**, and it needs no code: `projectRoot()` checks only that the
override path exists and never that it is a repository, so `FLOW_PROJECT=$HOME flow new "…"` runs
outside git today and writes to `~/.flow/tickets/` on its own id sequence. **The user ruled 2026-09-09
that nothing global reaches `docs/`**, because there is no product to hold a spec: every `docs/` route
in a global run lands under `~/.flow/` instead, and the rest lands in the ticket. One defect survives.
`store.js:282` moves a groundwork folder in with `fs.renameSync` under a comment reading "Same
filesystem by construction", which a global-to-project move breaks: `EXDEV`, after the ticket folder
has already been created.

**The audit's fixes landed 2026-09-09, on the user's go-ahead**, across 9 files. The rule that binds
everything else: **the artifact decides the phase, and the status is corrected to match.** It is in
`references/workflow.md` as the general statement and operative in all 4 phase skills, each naming its
own artifact. `/groundwork`'s `## Arriving` now branches on `map.md` rather than on the status, and
writes the correcting command after; `/execute` Phase 1 gained the artifact-wins rule plus a check that
any `[ ]` left in `groundwork/map.md` is groundwork that never closed; `/debug` reads `## State`
before step 1 and resumes at the first live hypothesis. `references/workflow.md` also gained the
`open` block agent note and the `## References` distinction. `read-intake.md` was rewritten whole around input that arrives as files somebody already
worked on, with the `tmp/planned-projects/` audit numbers stripped and a 2000-line gate above the 5
steps. `docs/manual/tickets.md` exists. `/groundwork` lost 145
words to compression and gained the global-folder rule, the child topic body cap, and `drop` where it
said `park`. `scripts/flow/templates/map.md` lost the rules from its placeholder comment. `/research`'s
"a question never becomes a ticket" now reads "a question reading can answer". 75 of 75 tests pass and
`rule-check.js` is silent.

**The manual page and the pickup rules were corrected 2026-09-09, in a second pass.** The user
rejected four things from the first one and approved the fixes.

**The `open` block left Flow for `util`.** It was `flow-open`, parsed inside `flow get` by
`store.openBlock`. The user's argument: it is a feature, not a ticket format, and it belongs wherever
features are defined. The code agreed, because `flow get <path>` already loaded the block out of any
file with no ticket involved. It is now `util fs open <file>`, in the `fs` namespace beside `fs merge`,
which already took the same `:40-120` range syntax and did the printing. **Flow supplies only the
working directory**: that command resolves a path beside the named document first and then from its own
cwd, so running it at the repo root against `ticket.md` gives exactly the two bases a ticket needs, and
the `--base` flag proposed for it was never built. `store.openBlock`, `resolveSpec`, `splitRange` and
`loadRefs` are deleted, about 60 lines, and the fence is now ```` ```open ````. Free to rename because
Flow is installed nowhere and no ticket exists on any machine. `lab/util/README.md` gained a
`## Commands` section, the page the user asked for: every shipped command, with the block format under
it. Two tests in `lab/util/tests/commands.test.js`, which is more than the block ever had in Flow.

**`flow get` prints a `map:` line, and the skills stopped restating it.** The user's objection was that
the first pass added the same paragraph to four skills without asking where it belonged. It belonged in
the header every pickup already prints: `map: groundwork/map.md 2/4 answered`, beside `plan:` and
`reports:`. `store.mapQuestions` counts every box at any indent, because a group is a question at the
coarse level. **A commented-out box is not a box**: both templates ship their example inside an HTML
comment, so `countBoxes` strips comments first, and `planSteps` was reading them too. An untouched map
prints no line at all, so the line appearing means real questions exist.

**The `reports/` checks came out of `/debug` and `/prototype`.** The user called them an unnecessary
read for a case that should not happen. The premise was off, since `reports/` is inside the ticket
folder and never holds another job's files, but the conclusion held for a better reason: `flow get`
already prints `reports:` with every filename, so the instruction looked up something already on
screen.

**`docs/manual/tickets.md` was rewritten**, 208 lines to 186. Its table of contents was plain text
rather than links, against `style.md` §10, and missing the two `###` headings. The page defined the 11
frontmatter fields twice, the 4 body sections twice, and `## State`'s labels a third time after
`/handoff`. **The annotated placeholder became one filled ticket**, which kills all three copies: a
stranger learns more from a ticket that looks right than from a form with instructions in it, and
`flow new` makes the tickets anyway. The `flow` command owning the id, the folder and the frontmatter
moved to the opening, where the user asked for it.

**Two more features left Flow for `util` on 2026-09-09**, on the user's approval, in the same
conversation that moved the `open` block. The user asked what else could go, naming a half-remembered
command that saved uncommitted work "like an invisible branch".

**`flow work` is `util git work`.** It carries uncommitted files between the desktop and the laptop by
building a commit, hanging it off the commit you are on, and writing its name into a label under
`refs/unfinished/<machine>/<branch>`: outside `refs/heads/`, so nothing switches to it and committing
never moves it. **The line that decided the move: it never touches `.flow/`.** A git repository and a
remote are the whole of what it needs, and `projectRoot()`, its only real import from Flow, was one
`git rev-parse --show-toplevel`. Applied across the whole surface that line catches this command and
stops. `flow audit` passes the letter, reading `~/.claude/projects/` with no ticket involved, and fails
it on `~/.flow/audit/`, and the four hooks cannot move at all, having no command to type.

**The move renamed three things.** `git config util.machine` replaces `flow.machine`, `UTIL_MACHINE`
replaces `FLOW_MACHINE`, and `.work-include` replaces `.flow-include`, which is also renamed in
`project-template/`. **The refs are untouched**: `refs/unfinished/` never said "flow", so a copy stored
before the move still reads. The cost was the framework rather than the git code: `flow/lib/cli.js`
supplied the flag parsing and the help text, and util has no shared library, so the file hand-rolls
both plus a 10-line column printer. `references/work-sync.md` is deleted and its 80 lines are
compressed into `lab/util/README.md` under `### Moving uncommitted work`, because a page describing a
util command cannot install to `~/.flow/references/`.

**The second argument for the move was the tests.** `flow work` had none. `backlog.md` recorded that a
77-check prototype over it was written into `tmp/`, which git ignores, and lost. It is the one command
in either repo that overwrites the folder you are standing in, and it had zero coverage for two weeks.
It now has 4 tests in util, against two real clones of a bare remote: the round trip, `.work-include`
carrying a gitignored file, the unnamed-machine refusal, and the missing default action.

**One defect was found and left alone.** `drop` reads only the labels this clone already has, while
`ls` and `get` fetch first, so `drop <machine>` on a clone that has never listed reports no copy. It is
inherited behavior, and a port that quietly fixes things is a port nobody can trust, so `backlog.md`
has it instead.

**`lab/scripts/proxy.mjs` is `util claude proxy`.** A zero-dependency logging proxy that sits between
Claude Code and the API and writes one Markdown document per request, led by a table ranking what is
eating the context. Not Flow's code and never was: the user supplied the origin, Matt Pocock's
`agent-proxy` gist, and the header now credits it along with r1cc4rd0m4zz4's fork. **Two changes came
off that gist page.** The fork's `UPSTREAM_URL` is in, so the proxy points at any Anthropic-compatible
endpoint. A commenter's report that tool search switches off under the proxy checked out against
Claude Code's own documentation, and the commenter had it right: the trigger is an
`ANTHROPIC_BASE_URL` pointing at a **non-first-party host**, which a localhost proxy is. A claim here
on 2026-09-09 that **any** custom base URL did it was wrong, corrected 2026-09-10 against
`agent-sdk/tool-search`, which also carries the override: `ENABLE_TOOL_SEARCH=true` forces tool search
back on, and survives a proxy that forwards the request body unmodified, as this one does. That is why another commenter measured 14.5k
tokens without the proxy and 68k with it, and both facts are now in the README beside the command.
**One change the move forced**: the documents landed in `path.join(HERE, "logs")`, beside the script,
which for a command on `PATH` means writing into the util clone. They land in the working directory
now, with `PROXY_LOGS` to move them.

**`lab/util/README.md` was rewritten whole the same day**, on the user's ruling that the `open` block
section was unreadable. The fault: it opened on "a document naming the files that go with it", which
describes a document rather than a block, and closed on "a saved argument list, written where the
reason for it already lives", which names nothing. It opens now on the sentence that is the whole
feature, that a document can carry the list of files that go with it and `util fs open` prints them,
and the fence is shown wrapped so the backticks are visible. The order changed too: `## Installing`
moved up ahead of the commands, and the five sections on extending it became `###` sections under one
`## Adding a command`. **Every existing anchor survived**, which is what let the cross-references
land. `refs/unfinished/` is now defined where it is used: git keeps its named pointers under `refs/`,
a branch is the kind under `refs/heads/`, and a copy is written outside that so nothing acts on it.

**`lab/util/lib/command.js` is util's first shared library for commands, approved 2026-09-10.** The
case for it was not duplication, it was `--help`. Run against every shipped command, `--help` did 4
different things: `git work` and `git save` printed their whole header, `fs open` and `fs merge`
printed one usage line, `fs link` refused it as an unknown flag, and **`fs tree --help` printed a
directory tree of wherever you were standing**. The README's claim that `--help` on any of them was
that command's own help was false for 4 of 6. `command.js` exports `usage(file)`, `wantsHelp(argv)`
and `helpOrRun(file, argv)`; it reuses `describe.js`'s `COMMENT` regex, now exported, and handles a
`/* */` block, a run of `//` lines and a run of `#` lines, skipping a shebang and a `'use strict';`
above them. Five CJS commands wire it in one line, `proxy.mjs` does it through `createRequire`, and
`work.js` dropped its own copy. `git save` keeps its awk reader, because a shell script cannot require
a Node module. **Optional by design**: a command in a private source cannot reach `lib/` at all, so
util's promise that any executable in any language works is untouched. One test covers all 7 commands,
36 total in util.

**`util fs open` was printing everything except the document it was given, fixed 2026-09-10.** It read
`notes.md`, printed the files the `open` block named, and never printed `notes.md` itself. The command
exists so a session arrives at a document and its files in one shot, and the document was the one
thing missing. The gap survived a day because Flow's only caller hid it: `flow get --files` prints the
ticket through `render.show`, then a rule, then this output, so the ticket was on screen by the time
the hole would have shown. The command now prints the document first, whole, ahead of everything its
block named, and `flow get --files` passes the new `--files-only` flag, for a caller already holding
the document. Two more corrections came with it, both the user's. **`merge.js` fenced with exactly
three backticks and never escalated**, so any markdown file carrying a code block closed the wrapper
early; the fence now runs one backtick wider than the longest fence inside the file, which is what
made printing a document possible at all. **The language label is gone from the opener**: three
backticks then `markdown plan.md` is now three backticks then `plan.md`, because the extension already
says it and the word repeated on every file in the stream. `EXT_TO_LANG` is deleted. The path label
was already the full path relative to the directory the command ran in, and did not change. 37 tests
in util.

**The Delapse and lumacraft_v2 harvest ran and closed on 2026-09-10, and produced almost nothing.**
All 7 files were read, 1,004 lines: both `CLAUDE.md` files, both `docs/agents/conventions.md`,
Delapse's `workflow-rules.md` and `superpowers-overrides.md`, lumacraft's `testing.md`. **Flow already
had most of it.** Chaining shell steps with `&&` is `batch-calls`. The git prohibition is
`no-git-writes`. `pnpm add` and CLI-first scaffolding are `never-hand-write-generated`. Delapse's
whole `explain` skill is Flow's `## Explaining`, in places word for word. Of the 7 rules proposed to
the user, 5 were already covered and checked against the files: `AskUserQuestion` is denied at
`home/settings.json:87`, so no rule is needed; confirming a root cause before coding and treating
debugging as a two-person activity are both what `skills/phases/debug/SKILL.md` is built out of;
speculative generality is `skills/phases/execute/references/review-code.md:33`. **The user rejected a
`rules/typescript.md`**: stack content lives in a `stack/` skill, never split across a rules file with
`paths:`, which reverses step 2 of `design-knowledge-base.md` on that point. A `rules/tests.md` was
dropped too, since neither project's testing doctrine proved itself. **One genuine gap was found and
filled**: nothing in Flow caught the agent looping while unblocked. `debug/SKILL.md:20` stops when a
step cannot be finished, which fires when the agent is stuck, never when it is fixing away in the
wrong direction. Both projects state a two-strike rule, Delapse three separate times, and the user
rejected the count as the wrong shape: `execute/SKILL.md` already says **never count attempts**,
because 3 obvious fixes cost less than one hunt. The user's own framing is the rule that went in.
**A run of mechanical fixes that changes nothing means the assumption is wrong, not the fix**, and the
next move is to name the assumption to the user rather than hunt it, because they read the direction
from outside the attempt. Two paragraphs in `skills/phases/execute/SKILL.md` under
`### When a step fails`, sitting between the mechanical-fixes line and the existing stop rule.

**`rules/comments.md` is written**, 11 rules over 2 sections, and it is the first file in `rules/`.
It carries `paths:` frontmatter over 5 language groups: the JS and TS extensions, `.py`, `.sh` and
`.bash`, `.sql`, and `.css` with `.scss`. The rule never loads while the session is in markdown.
Section 1 decides whether a comment is worth writing, section 2 which form it takes, and the form
rule generalises past JS: **position decides the form**, so a declaration takes whatever the language
surfaces at the call site, which is `/** */` in JS and TS and a docstring in Python. Bash has no
second form and CSS has no line form, both stated rather than left to inference.

**Frontmatter is not a toggle**, which the user expected it to be. `paths:` is the only field a rules
file takes, confirmed against the memory page 2026-09-10. Two real switches exist: `flow install`
links `rules/*.md` one file at a time, so not linking one turns it off, and `claudeMdExcludes` in
`settings.json` drops a rules file by glob without touching the install. **The reason it lives in
`rules/` and not `home/CLAUDE.md`** is still the user's: some developers ban comments outright, and a
`CLAUDE.md` line has neither switch.

The first draft was 6 rules written as bare ids with no verb in them, and the user rejected it as
unreadable and as not explaining the situation to the agent. The rewrite names the situation above
each list and gives every rule a verb. `docs/dev/layout.md:50` already documented `paths:`, so the
first draft missed a mechanism Flow had written down.

The `description:` collision resolved with 1 word rather than a rule: `home/CLAUDE.md`'s
`describe-an-opaque-name` now reads **the same header comment**, because the marker is that comment's
first line and never a second comment above it. `describe.js` reads the marker and `command.js:49`
strips it before printing the rest as `--help`. 10 sites in Flow and util had a `//` above a
declaration and were converted. One was a real bug: the comment at `scripts/guard.js:61` described
`GIT_DESTRUCTIVE` while two one-line helpers sat between them, so the helpers moved above it.

**Neither `/context` nor the proxy is the answer to "what was in the context".** The user rejected
both on 2026-09-10: the agent must be able to check on its own, without the user present, and about
any past session including one already compacted or cleared. `/context` is a slash command only the
user can type and shows only the live session. The proxy has to be started in advance. **The
mechanism that does meet the bar already exists in Flow and predates the question**:
`scripts/instructions-loaded.js` is the `InstructionsLoaded` hook, which Claude Code fires whenever a
`CLAUDE.md` or a `.claude/rules/*.md` enters context, including once more with `load_reason: "compact"`
after a compaction. It appends `{kind: 'loaded', file, memory, why}` to
`~/.flow/scorecards/<session-id>.jsonl`, one file per session, permanent and readable by any later
session. `rule-check.js` already reads it back. **What it does not record**: skills, tool definitions,
subagent definitions and message sizes. Extending the same hook record to cover those is the shape of
the fix, not a new instrument.

**Four Flow files link the `open` block section by URL**: `docs/manual/tickets.md`, `docs/dev/cli.md`,
the root `README.md` and `references/workflow.md`, all at
https://github.com/Adrian333Dev/util#the-open-block. The user's rule is that a referenced feature gets
a link the reader can click, and a `lab/` path is not one once Flow is installed.
`skills/tools/handoff/SKILL.md` was left alone: it teaches the whole format inline, so it sends nobody
anywhere.

**`docs/` split by audience on 2026-09-10, on the user's rule that `dev/` holds only what `manual/`
does not.** `docs/dev/cli.md` was the manual sitting in the developer folder: 321 lines of every
`flow` command, which is what the designed Reference page is. It moved to `docs/manual/reference.md`
and grew the 3 lists it was missing: the skills by group, the settings keys Flow contributes, and the
files on a machine and in a project. The install sections came out of `docs/dev/README.md` and into
Reference's `## Installing`, so 4 of that page's 5 sections were user-facing and are now gone from it.
Both folders carry a `README.md` indexing their own pages; `manual/` had none. `docs/` is 4 pages in
`manual/` terms and 6 in `dev/`, and no page restates another. **`## Next` item 4 is most of the way
done by this**: Reference exists, and what is left of the manual is `Use Flow` plus the 4 sections
outside v1.

**`context-cost.md` is the one page nobody placed.** It reads as a design finding rather than a page
a reader arrives at with a question, so `lab/context/` may be its real home. Left in `docs/dev/` and
not decided.

**util's `## Commands` became `lab/util/docs/commands.md` on 2026-09-10.** 172 lines out of the
README, which keeps a 2-line pointer. The 4 Flow files linking the `open` block by URL now point at
`.../blob/main/docs/commands.md#the-open-block`; the anchor did not change because the 3 deep-dive
headings were promoted from `###` to `##` inside their own page.

**Two rules landed 2026-09-10.** `short-is-the-default` sits above `size-by-worth` in both
`CLAUDE.md` files: the user is always short on time, so length is spent and never earned.
`size-by-worth` ranks topics against each other and never capped the total, which is why it did not
fire. `docs-context-holds-verified-facts` closes `## Capture` in `home/CLAUDE.md` and ships the 4
rules `design-project-docs.md` recorded and nothing carried: one question per file, facts and never
process, rewritten rather than appended.

**`design-debug.md` stopped saying "the red command".** The skill renamed it to "the failing check" on
2026-08-24 and the origin record never followed, so the 2 files named the same artifact differently
for 17 days. 4 sites, including the definition sentence, which also said "goes red" and "red signal".

**`flow doctor` shipped 2026-09-11**, the deterministic half of verifying a machine, and it writes
nothing. 6 areas: the names on `PATH`, the 3 util commands Flow calls, `~/.claude/`,
`~/.claude/settings.json`, `~/.flow/` and both test suites. It prints one line per clean area and one
line per problem, and exits 1 when anything failed. Named `doctor` because `flow check` was already
taken by the ticket graph, which needs a project where this needs a machine.

**The util check is the half no symlink check reaches.** Nothing is built into `util`: it reads
`~/.util/sources` and every command comes out of a directory named there, so a `util` on `PATH` with
an empty registry carries no commands at all. Doctor runs `util fs tree`, `util fs merge` and `util
fs open` with `--help`, which exits 0 only when the command resolved and ran, then explains a failure
against that registry. Those 3 names are the only hand-maintained list in the file: the skills come
off the tree and the hooks out of `home/settings.json`, so neither can fall behind.

**The empty case gets 1 message.** A machine with no install would otherwise read as 20 separate
failures that are all the same failure, and that is the state this machine is in until install day.
5 tests cover it, and they cover `flow install` as a side effect: each one runs the real install into
a scratch tree and then verifies what it wrote.

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
- `claude-code-gaps.md`: what Claude Code cannot do that Flow needs. 3 issues filed on
  `anthropics/claude-code` 2026-09-10 (#93248 `paths:` fires on reads only, #93249 no `exclude:`
  field, #93252 a hook cannot load a rule, a skill or a file), 9 gaps worth filing, 3 ruled out.
  A record of upstream state, so nothing on it is an open Flow item
