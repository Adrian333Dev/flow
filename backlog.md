# Backlog

Every open item in Flow, in one place. **An open item lives here and nowhere else**: the files under `lab/context/` keep the reasoning behind them, and none of those files is a work list. Each submodule keeps its own: `lab/domain-skills/backlog.md`, `lab/util/backlog.md` and `lab/toolbox/backlog.md`. An item about how Flow uses one of them stays here.

- One line per item: what it is, then where the argument lives. Never the argument itself.
- A pointer names a file in `lab/context/` unless the line gives a path.
- **A finished item is deleted, never checked off.** Git holds what was done, `lab/context/` holds why.
- **`## V1` blocks the first release.** Its `### The spine` runs in the order written, and the final sweep is last. Every other V1 section is filed by area and gets built wherever it fits before that sweep.
- **`## After V1`** holds what cannot be built yet, one subsection per area, the lowest priority last.
- **A marker on the line says what else holds an item back.** **talk first** needs its own conversation before anything gets built. **parked** waits for a real case. **half done** marks a started item.

## V1

Everything here has to be true before Flow installs on a machine and gets used.

**V1 went from 7 items to 39 on 2026-09-16**, when the user ruled that everything minor and obvious belongs here. What stayed behind needs a case only live use produces, is a drawing engine Flow works without, or targets another harness or model.

### The spine

- [ ] **Phase skills take a ticket id.** `/execute t047` loads the skill, the ticket and every file the ticket names in one message, the way `/start` does today with `` !`flow get $ARGUMENTS --files` ``. A user who knows the phase then skips `/start`. High priority. The main case is a skill run with no id, then run again with one; different ids in one session are rare. **The fact to design against:** a second run whose rendered text differs from the first appends the whole skill again, and the main case differs. `short-skill-no-arguments` in `CLAUDE.md` forbids arguments on a long skill today, and `/groundwork` is 292 lines. Lifting that rule for the 4 phase skills was proposed, which changes `CLAUDE.md`, `docs/dev/skills.md` and `write-skills.md` together. **talk first**, when its turn comes. `skills.md`
- [ ] **The management skill**: Flow's whole life on a machine in one skill, and the last skill Flow gets. **Far larger than an installer**, decided 2026-09-01. Install, verify and re-install across the user's 2 machines are v1. Updating a machine and every migration follow, and converting a project with its own workflow waits for such a project. It also carries the live checks `flow doctor` cannot make: whether a hook fires, whether a rule holds under load. `management.md` → `## Parts the skill carries` lists the jobs moved out of this file, among them the machine that already has `~/.claude/CLAUDE.md` and so loads none of Flow's rules. **talk first**: 3 open questions. `management.md`
- [ ] **`## The user` and `## Preferences` get filled**, by one instruction that pushes the agent to fill them and by an interview at install. The route line in `## Capture` is passive, so an agent with no profile writes nothing and the sections stay empty. Wanted: push hard while the profile is thin, ease off once the base is there, and stay compressed the whole way. The sections hold anything useful about the user, habits and preferences included. Auto memory does not cover it: it is off in `home/settings.json`, and `docs/manual/settings.md` says why. Open: whether the 2 sections merge or stay split with a stated line between them, which the interview depends on. A proposal on *how* to write each line was rejected 2026-09-07 as the wrong problem. Done inside the management skill, ruled 2026-09-08. **talk first**
- [ ] **The final sweep: finish the workflow in 4 passes, starting once the management skill is built.** Raised by the user 2026-09-15. Each pass ends before the next starts. It runs before the manual, because pass 2 may remove a feature a page would describe.
  1. **Walk the whole workflow from start to end through real scenarios.** Look for what breaks, what is missing and what makes no sense.
  2. **Simplify.** Find what is overbuilt, and every rule that costs flexibility. Aim for the simplest workflow a beginner can follow, and the most flexible one. A feature may shrink or go here.
  3. **Compress every skill.** Cut the detail and explanation an agent does not need, pass after pass, until the user is happy. `/groundwork` is the user's example of a skill that over-explains.
  4. **Compress and simplify the writing of every file.** Opus 5's prose is unreadable in long stretches: clauses compressed past meaning, terms used before they are defined, a path standing where an explanation belongs. A full pass per file, never patches, ruled 2026-09-05. Done: both `CLAUDE.md` files and the skills. Left: `references/`, `docs/manual/settings.md`, the 2 templates under `scripts/flow/templates/`, and `docs/dev/`, whose pages also need their structure and table of contents format redone. `/web-pages` waits for its rebuild.
- [ ] **`docs/manual/`: Use Flow is the page left.** What Flow is, the 4 phases, tickets and the approval discipline. It is written for a stranger who cloned the repo, and its first reader is the author, who forgets which features exist. Reference shipped 2026-09-10 and is the features list: one entry per unit, and the place a mechanism used in more than one spot gets defined. `tickets.md` shipped 2026-09-09. The other 4 planned pages wait: `Why it works this way` needs `lab/context/` read end to end, and `Configure`, `Extend` and `Work on Flow` overlap `docs/dev/`. `manual.md`
- [ ] **Document everything, with a real captured example on every page.** Every page describing a file shape or a command carries an example produced by running the thing, never written by hand: a ticket, `map.md`, `plan.md`, a handoff, `flow get`, `flow next`, `flow audit read`, `util fs open`, `util fs tree`, `util fs merge`. The point is detection: the user reads one example and sees the mistake. `util fs open` shipped 2026-09-09 printing every file its block named and never the document it was handed, and survived a day because no page showed its output. The `open` block section in util's README is the density to match.
- [ ] **Widen the tests over the ticket commands**, the programmatic part still uncovered. `flow install` is covered by the `flow doctor` tests. Rules and skills are tested by real work only, never by a prepared scenario, until the workflow is finished: a written-out prompt is too clean to fail, ruled 2026-09-06.

### The skill system

- [ ] **Plugins are a fourth install state Flow does not control**: off by default. `extraKnownMarketplaces` in the committed settings, `enabledPlugins` in `.claude/settings.local.json`, and a flip takes effect next session. `skillOverrides` is not an off switch: it leaves the commands and the hooks running

### Individual skills

- [ ] **`/grill`**: a skill fired at a finished artifact, `disable-model-invocation: true`, never model-invoked. Decided and undesigned. One form hands the stripped mechanism to subagents that never saw the conversation, so none of them can defend it. **talk first**

- [ ] **The skill-creation trigger**: when a recurring pattern becomes a new skill, and who writes it. **talk first**

- [ ] **Auditing current work against a skill's accumulated practice**: scope it to what the work touched, or the reads are unbounded. **talk first**

### `flow`, the tool

- [ ] **A study case says `fixed` the moment a rule changes, and nothing checks that the rule worked.** `open` and `fixed` are the only 2 statuses, so writing the fix and declaring it good are one act. All 3 cases written 2026-09-06 say `fix: home/CLAUDE.md`, and `## The turn` has never run in a session. Wanted: `addressed` in the middle, meaning the file changed and the change is unproven. Changes `CASE_STATUSES` in `lib/cases.js`, the `--status` values on `flow cases ls` and `edit`, and `references/study-cases.md` → `## Closing`. **What blocks it is who promotes a case to `fixed`:** nothing watches a session today, so `addressed` becomes the terminal state and the third status buys nothing. **talk first**. `rules.md`

- [ ] **`~/.flow/` as a git repository of its own.** Raised by the user 2026-09-09, so the global half of Flow gets version history and a way to travel between machines. Today it is a mix: `scripts/` and `references/` are symlinks into this clone, while `study-cases/`, `scorecards/`, `audit/` and `settings.json` are real local files that exist on one machine only. **Running `flow` outside a project is already solved and is not what this entry is for**: `FLOW_PROJECT=$HOME flow new "…"` works today. The value here is versioning and sync alone. Decide what is committed and what stays local: `audit/audit.db` is derived and 44 MB, and `scorecards/` is per session. **talk first**

- [ ] **An overlay reaches a `SKILL.md` and nothing else.** The mechanism is a shell line at the bottom of a skill body, ``!`flow overlays <name>` ``, and 10 skills carry one. A `references/` page under a skill has no place to run a command, and neither does a file in `rules/`, so a project cannot extend either one. Raised by the user 2026-09-11, designing the management skill. **talk first**

### Rules and always-loaded files

- [ ] **The reminder varies with the work.** The `UserPromptSubmit` hook prints one fixed line from `references/reminder.md`, pointing at `## The reply`. A second text, by phase or by loaded skill, waits until one is needed. What a condition can read: the message text, the transcript (skills run, the model on every reply, token counts) and the ticket status under `cwd`. The hook gets no effort level. **talk first**

- [ ] **The agent argues for the user's idea instead of testing it.** `home/CLAUDE.md` and this repo's `CLAUDE.md` both say to test feedback and disagree where it fails, and it still happens. Seen 2026-09-13: the user said the toolbox inbox felt more fitting as one file than as a folder. The reply recommended going back to `inbox.md` on 2 arguments built to support it: a list reads in one look, and a tool file and its README would never move as a pair. The folder already answered both. `grep -r "^description:" inbox/` prints every waiting tool on one line, and `mv inbox/owner_repo.* <folder>/` moves the pair in one command. The user caught it the next turn and named the cost: decisions taken on the user's word may already be faulty. Open: what makes the rule hold, with the reminder hook as one candidate. Also open: whether to re-test the decisions that started as the user's suggestion. **talk first**

- [ ] **A rule id is written by hand and nothing checks the naming.** The convention lives in `references/style.md` §11, and `flow scorecard` reports an id defined twice in one file. Left open: whether the same rule in `home/CLAUDE.md` and the repo `CLAUDE.md` must keep the same id, which is what makes `flow scorecard` count it once. **parked** until rules are added from mining rather than by rewriting

- [ ] **Where the review paragraph lives** once a review step exists: the premise moved. `/groundwork` Phase 3 is now *attack it before it stands*, delegating to `## Judgment`, so re-read it before deciding whether the question survives. **talk first**

- [ ] **Dependency discipline**: a check before any dependency is added, and how a bulk version bump gets reviewed. **talk first**

- [ ] **The negation split**: a prohibition where the agent breaks a rule under pressure, a positive recipe where the output comes out the wrong shape. **talk first**. `rules.md`

- [ ] **Symlinked rules do not load in Cowork desktop sessions.** Those sessions skip a symlinked `~/.claude/rules/` file resolving outside the working directory, and `flow install` links every one of them into the clone. Terminal and IDE sessions are unaffected, and `CLAUDE.md` is copied rather than linked, so that half is safe. No decision yet on whether Flow cares. `rules.md` → `## .claude/rules/ is a standard Claude Code feature`

- [ ] **`## The reply` has never been measured.** It replaced `## Explaining` on 2026-09-16, built against the 14 recorded failures in `lab/context/rejected-replies.md`: 3 ordered steps and 5 tests run on the finished draft, where the old section was 20 rules in one flat list. Whether the 5 tests fire is unknown, and the old section's own faults were invisible for 6 weeks. Watch the next rejected reply: a failure the tests do not catch is the signal to change the shape again, never to add a sixth test. `rules.md`

### The audit

- [ ] **Scoring a session against Flow's rules, conduct rules included.** The machinery landed 2026-09-07 and holds no checks, so nothing is scored yet. A check is a function where a function can decide, and a model call only where it cannot. `rules.md` assumes one `PreToolUse` hook on `Edit|Write` and leaves conduct rules to a reminder, but 3 documented hooks reach further. `MessageDisplay` streams Claude's prose with a `turn_id`. `PreToolUse` carries the `prompt_id` of the user prompt in progress. `Stop` carries `last_assistant_message` and can block, up to 8 times in a row. Text against edits inside one turn is readable, so `the-turn` and `the-reply` become enforceable and not only measurable. Raised by the user 2026-09-07. **talk first**, a design pass. `rules.md` → `## Locked decisions: the enforcement bridge`, `docs/dev/claude-code.md` → `## What a hook can see of the conversation`

- [ ] **A run is not wired to anything**: `run` and `run_session` are built and empty, every query treats them as optional, and nothing writes a row. A `SessionStart` hook has `session_id` and `cwd`, and `statuses.js` says which ticket is in flight. It also fires on `compact`, so a naive hook counts one session 4 times. **talk first**

- [ ] **A linter is a rule check Flow does not have to write.** Raised by the user 2026-09-10. ESLint, ruff and shellcheck already decide most of the shape questions `scripts/rule-checks/` would otherwise implement by hand, they run over a whole file rather than one edit's added text, and their rules are argued over by more people than Flow will ever have. Two ways in: a check that shells out to the linter and files its findings under a Flow rule id, or Flow generating linter config from its own rules so the two cannot disagree. Open: which rules belong in linter config rather than in JS, what a project with no linter gets, and what happens when a project's existing config contradicts a Flow rule. **never-install binds here**: Flow can read a config a project already has, and adding a linter is the user's call. **talk first**

- [ ] **`flow audit prune`**: `cleanupPeriodDays` is 365, so nothing bounds `~/.claude/projects/` for a year, and the index is 44 MB against 241 MB of transcripts as of 2026-09-02. Prune by run rather than by age, delete only what the index has fully read, and never sweep what a study case pins

- [ ] **A subagent's transcript is indexed and unreachable**: each one becomes its own session row carrying `agent_of`, and no query joins on it. A subagent's tool calls do not appear in its parent's totals

- [ ] **`~/.flow/workflow-notes.md` and study cases cite the audit**: both become readers of it. A case still extracts and commits what it cites, because the index is machine-local and the transcripts are swept. `references/study-cases.md` justifies writing one immediately because the conversation is the only copy, and retention weakens that premise. **talk first**

### Subagents and dispatch

- [ ] **Output contract, tool allowlist and model, per agent**: nothing fixes what a dispatched agent returns, so it comes back as free prose the parent has to re-read. The model for fixing a format exactly is `repos/caveman/agents/cavecrew-*.md`, 3 tight subagent definitions each with a tool allowlist and `model: haiku`. **talk first**

### Docs for whoever reads Flow

- [ ] **A manual page on what Claude Code already does**: `/run` spent months doing a worse version of shell mode, a built-in feature nobody knew was there, and was deleted the day it surfaced. The page lists the built-ins worth knowing and the Flow-shaped mistake each one prevents: shell mode against building a command skill, `permissions.deny` being additive against any switch layered over it, the documented hook payload against guessing what a hook receives. It grows every time a feature turns out to have been there all along. **talk first** on where it sits: its own page, or a section of one that exists

- [ ] **`docs/context/` and `docs/spec/decisions.md` overlap and nothing routes between them.** "We use Postgres" is a durable verified fact and a locked decision at once. The user asked whether the two folders merge. Recommended instead: delete `docs/spec/decisions.md` and split it 3 ways, since the overlap is one file wide and not one folder wide. Decisions that constrain implementation go to `tech.md`, which `references/workflow.md` already gives that job. Product decisions go to `product.md`. Refused options, bets and open questions stay in the groundwork map that produced them. Merging loses more: a folder named `spec` holding a verified command breaks `name-for-content`, and `decisions.md` against subject files stays an overlap after the merge. Walk 3 real Delapse examples first, which makes it groundwork. A delete needs its own confirmation. **talk first**

### Install and migration

- [ ] **Tune `guard.js`'s deny and ask lists** against real use: they were written from the rules, never against an observed false positive

### Context and session boundaries

- [ ] **Wrap up when the context gets large**: a hook that reads the running token count, then tells the agent to stop at the next checkpoint, write the handoff and report in full. The transcript at `~/.claude/projects/<project>/<session-id>.jsonl` carries a `usage` block on every assistant message, so the count is readable without asking Claude Code for it. `PostToolUse`, never `UserPromptSubmit`: a long execution run makes no user turns for the second one to fire on. Threshold around 120k against a working ceiling of 150k. **What counts as a checkpoint has to be defined per phase**, because the reminder must never cut a ticket in half. Designing it is also what makes "go means finish everything" safe to put into `home/CLAUDE.md`, so the two are one job. A working start was deleted 2026-09-15: `context-pulse`, a hook printing context usage read from the transcript, restored by `git show cf63643:lab/framework-build/hooks/context-pulse/index.mjs`. **talk first**. `rules.md`

- [ ] **Nothing loads on a bare `/start` with no ticket and no path**: a `handoff.md` sits beside whichever thing is being worked, so there can be several and no id points at one. Left out of the 2026-08-24 build

- [ ] **A dropped file path costs a whole extra turn**: dragging a file from the editor into the terminal pastes its absolute path in quotes, and that is the only easy way to name a file `@` cannot find or that git ignores. The agent then spends one turn seeing the path and a second reading the file. Wanted: the content arrives with the prompt. `UserPromptSubmit` is the shape: it fires before the model processes the prompt and its stdout is added as context, so a hook could read every quoted absolute path and print the file. Undesigned. **talk first**. `lab/research/claude-code-docs/hooks.md`

- [ ] **Context engineering**: keep what loads as small as possible, and stop cache invalidation when a skill loads mid-session. **talk first**

- [ ] **A workflow note is written and never read again.** `~/.flow/workflow-notes.md` is the cheap half of the capture pair: one dated line for friction with nothing to preserve. Nothing drains it, and nothing promotes a line that has now appeared 3 times into the study case it has become. Decide what reads the file back and when. `/file-findings` already drains `.flow/inbox.md`, and the notes file is global where the inbox is per project. **talk first**. `references/study-cases.md` → `## Note or case`

### Drawing

- [ ] **Turn the glyph probe into a script**: `lab/research/ascii-glyph-probe.md` is evidence today. `scripts/glyph-probe.js` would make "show it to the user first" something the agent can carry out, and it has to render into a file as well as a terminal. `drawing.md`

### Other people, other models

- [ ] **Build Flow for a stranger.** `home/CLAUDE.md` carries a personal profile, the install has never run on a second machine, and no page explains Flow to somebody who has never seen it. A setup script is fine, and a one-command npm install is not required. Split out of the other-harness item on 2026-09-16, because none of it needs another harness or another model. `manual.md`

## After V1

### The skill system

Flow keeps Claude Code's skills and adds 3 things: a group folder, one shell line per skill for overlays, and a rule that a skill invoked over and over stays short. `skills.md` carries every argument.

- [ ] **How a design plugin gets used**: what fires it, whether design work is its own phase, what happens when 2 of them disagree, the boundary with `/visualize`, what comes back into Flow afterwards. **Decided after the first real run in a project**, never before. Not essential; Flow works without one. **talk first**

- [ ] **`paths:` in skill frontmatter, which Flow uses nowhere.** With it, Claude Code loads a skill only while working with files matching the patterns, and every Flow skill loads from its description alone today. Rejected 2026-08-26 for the `standards/` group, since dissolved. Still open for domain skills, where a skill maps to a file type and costs nothing until it matches. **No richer condition than a glob exists**: no hook loads a skill or a rule file, asked and closed 2026-09-07. **parked** until 1 project installs 5 or more domain skills. `docs/dev/claude-code.md`

### Individual skills

- [ ] **Whether a child map may write an open branch into its parent's `map.md`.** Built 2026-09-08 as `/groundwork` Phase 2's rule for a decision that binds more than 1 child, because 2 children answering the same question answer it differently. Unproven: no product has been split into child maps yet, and the rule assumes one session at a time, which holds for a solo developer and not in general. Reverse it and the alternative is walking the shared decision in whichever child hits it first, then having the sibling read it. **talk first**

### `flow`, the tool

- [ ] **One state path across harnesses.** Raised by the user 2026-09-09. Flow writes to `~/.claude/` today, and a second harness means `~/.codex/` or `~/.agents/` beside it, each with its own layout. What the user wants is one place holding whatever must survive a machine change, with `~/.flow/` as the candidate, and explicitly **not** the whole of `~/.claude/` moved under it. Open: which files actually need to travel, whether they are linked or copied, and how a harness that only reads its own path gets them. Depends on the entry above, since travelling means committed. **talk first**

### Rules and always-loaded files

- [ ] **Project-level rule checks at `.flow/checks/<id>.js`**, with the scorecard loading both folders. Designed and deliberately skipped in the 2026-09-07 build: no project needs one, and a mechanism built ahead of its first case gets built wrong. The global half at `scripts/rule-checks/` is done. **parked**

### The audit

Built 2026-09-02, over the transcripts Claude Code already writes. `flow audit` indexes them into a SQLite file, answers queries against it, and opens a bounded turn range of the original conversation when the counts are not enough. `docs/dev/audit.md` describes the index.

- [ ] **The rule-text injection path has never run live.** When a check fires against a rule whose file never loaded this session, `rule-check.js` injects the rule's whole text instead of its id. `checks.ruleText` is unit-tested and has never been exercised by Claude Code. It stays unproven until a `warn` check exists. Moves to `## V1` if a major rule gets a check before release

- [ ] **A full sweep over the tree against every rule, ending in one report.** Raised by the user 2026-09-10. `PreToolUse` sees one edit at a time and only the text that edit added, so nothing today can say how the project as a whole stands against the rules. A sweep walks every file, runs every check whose `applies` matches, and writes one report detailed enough for an agent to work through: fix these, report those, ignore the rest. Distinct from `flow scorecard`, which counts what sessions did rather than what the tree holds. **The design problem is `needs: 'added'`.** Every check is written to judge new text, and handing one a whole file that predates the rule turns a clean tree into thousands of findings. So a sweep either runs a different set of checks or every check declares what it does when handed history. **talk first**

- [ ] **The daily sweep is a second mode**: analysing every session since yesterday is batch, and batch wants parallel dispatch. Parallel readers need no worktree and no change record, so nothing blocks it since 2026-09-15. The deterministic half runs at zero token cost over every new session and escalates only what it flags

### Subagents and dispatch

- [ ] **Work on several branches at once**: Flow supports one branch at a time to start with, ruled by the user 2026-09-13. Across parallel branches `.flow/inbox.md`, `.flow/handoff.md` and new ticket ids collide, and a new worktree lacks the ignored skill symlinks. Ideas raised, none decided: the branch recorded on a ticket, and the sessions that worked it recorded by id, doubted because work moves between machines. **talk first**. `skills.md` → `## Branches`

- [ ] **2 change-record paths never ran live**: a subagent resumed by typing into its row, whose record should arrive with the parent's next tool call, and a record left with nobody waiting for it. Both are unit-tested. Watch for them in the first real session that resumes a subagent. `docs/dev/agents.md`

- [ ] **A worker that starts its own subagent**: that subagent's changes carry its own id, and whether the delivery reaches the top parent is unverified. Watch for it the first time a dispatched worker dispatches. `docs/dev/agents.md`

- [ ] **2 snapshots per command a worker runs**, which is slow on a very large repository. Nothing has measured the cost. `docs/dev/agents.md`

### Install and migration

- [ ] **Migrate Delapse, with its project-local skills converted**: the real test of the workflow, and where its conventions route into the project `CLAUDE.md` and `docs/context/`. Its skills are not Flow's. Each is copied into `<project>/.claude/skills/<name>/` and committed with Delapse, or vendored into Flow's tree under a group once a second project wants it, reversed 2026-08-26. **parked** until the workflow is finished. `skills.md`

### Context and session boundaries

- [ ] **Strip filler out of a dictated prompt before the model reads it**: "umm", "you know", a stray "like". Low priority. Unbuildable as first designed: `UserPromptSubmit` cannot replace the prompt, only add text beside it, and a compressed copy beside the original makes the context bigger. Kept in case a workaround turns up. Whatever strips must touch filler only, because hedges, questions and the order of a message are what `instruction-or-thinking` reads. **parked**

### Drawing

- [ ] **The ASCII engine**: hand it JSON, get back the drawing. You have read `drawing.md` and mostly disagree with its recommendation; state your direction before anything in there gets argued. **talk first**

- [ ] **An SVG engine**: later than the ASCII one. It reopens the SVG ban, decided on a measured ~10 minutes and ~80k tokens per diagram in the main context, which a subagent changes. **talk first**

### Other people, other models

- [ ] **Flow on another harness and on another model.** Researched 2026-09-06 and 2026-09-07, and nothing is locked. Building it for a stranger split off into `## V1` on 2026-09-16. **talk first**. `models.md`. The parts:
  - **No rule is measured per model.** Sonnet 4.6 puts the report before the edits. Opus 5 fails plain explanation with the reply rules loaded. A base rule set plus a per-model overlay is the shape, earned by the scorecard split rather than assumed
  - **Buy one coding plan and run Flow on it.** GLM at $18, or Qwen at about ¥200, which bundles Kimi, GLM and MiniMax. It answers whether a non-Claude model holds Flow's rules, whether the quota survives Flow's token profile, and whether auto mode's classifier runs on the gateway model
  - **Replace `WebSearch` and `WebFetch` off Anthropic.** `WebSearch` is a server-side Anthropic tool and stops. `WebFetch` preflights to `api.anthropic.com` and reportedly fails behind third-party providers. An MCP search server is the replacement, and `CLAUDE.md`'s read-the-docs rule depends on both
  - **`flow audit` reads Claude Code transcripts only.** Codex writes `~/.codex/sessions/YYYY/MM/DD/rollout-<id>.jsonl`, so `scan.js` needs a sibling
  - **The audit's `cost_usd` and cache columns go wrong** from the first non-Anthropic session: a flat plan has no per-request dollar figure
  - **`flow install` gains `~/.agents/` as a second link root**, pointing at the clone rather than chaining through `~/.claude/`
  - **Survey the remaining harnesses**, `deepseek-harness` first

### Research still to read

- [ ] **Read `agent-toolkit/skills/game-changing-features` and `adhd` for `/groundwork`'s idea generation.** Both produce ideas rather than shape one, which is the half `/groundwork` does least: `game-changing-features` forces the *what would make this 10x more valuable* question, and `adhd` is a divergent-ideation engine. `adhd` was already read once, on 2026-08-29, for its writing rules only: this is a different question and the earlier verdict does not carry. `bash lab/scripts/repos.sh` restores both

- [ ] **Read `claude-task-master` for initialization, the ticket system and the workflow shape.** An AI task-management system that drops into Cursor, Windsurf, Roo and others, 28k stars, JavaScript, last pushed 2026-04-28. It is the closest thing to a direct competitor Flow has: it solves the same ticket problem for many editors where Flow solves it for one, so its onboarding and its task model are the 2 things to read. github.com/eyaltoledano/claude-task-master

- [ ] **Read `deepseek-harness` for ideas**: a plugin-based agent harness where everything is a plugin, cloned at `repos/deepseek-harness/`. Ranked last here. github.com/deepseek-ai/deepseek-harness
