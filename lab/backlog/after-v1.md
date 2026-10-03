# After V1

What waits until the beta ends, one section per area, the lowest priority last. The beta may pull any item forward. How an item is written: `docs/dev/layout.md`, the `backlog/` entry.

## Flow for teams

- [ ] **A version of Flow any software team can use**, of any size: a ticket system with the fields a team needs, connected to the tracker the team already uses, a secured server with roles, and a lead seeing who works on what. The user's biggest goal after V1. Research comes first, run through `/flow:groundwork` and `/flow:research` once Flow is installed: how teams work in 2026, and what they want. **talk first**. `teams.md`

## The skill system

Flow keeps Claude Code's skills and adds 3 things: a group folder, a hook handing each skill its project's overlay, and a rule that a skill invoked over and over stays short. `skills.md` carries every argument.

- [ ] **An overlay reaches a `SKILL.md` and nothing else.** The mechanism is a hook that fires when a skill loads, `scripts/hooks/overlays.js`. A `references/` page the skill opens later is read with `Read`, and a file in `rules/` loads with no event, so a project cannot extend either one. Raised by the user 2026-09-11, designing the management skill. **talk first**

- [ ] **A skill a subagent preloads gets no overlay.** A subagent definition's `skills:` line loads the skill with no `Skill` call, so `scripts/hooks/overlays.js` never fires. Flow ships no such subagent. A `SubagentStart` hook can add context, so it could hand over the overlays of the skills that definition names. Approved 2026-09-28. `skills.md` → `## Outside skills: review, then used whole or harvested`

- [ ] **`paths:` in skill frontmatter, which Flow uses nowhere.** With it, Claude Code loads a skill only while working with files matching the patterns, and every Flow skill loads from its description alone today. Rejected 2026-08-26 for the `standards/` group, since dissolved. Still open for domain skills, where a skill maps to a file type and costs nothing until it matches. **No richer condition than a glob exists**: no hook loads a skill or a rule file, asked and closed 2026-09-07. **parked** until 1 project installs 5 or more domain skills. `lab/context/claude-code.md`

## Individual skills

- [ ] **`/flow:write-skill`, the harvest**, user only: reads a subject's sources whole and writes its skill. For an outside tool, the sources are `~/.flow/wiki/<tool>/`, where capture sends every finding about the tool since 2026-09-27, and every outside skill cloned to be harvested. It writes in its own words, records each input's commit, deletes the findings it wrote in, and drops each input's clone with `flow skills drop <owner/repo>` unless a skill there is used whole. Built after a first run done by hand. `skills.md` → `### /flow:write-skill`, `knowledge-base.md` → `### Capture and the harvest`

- [ ] **Checking the running app before review.** `/flow:execute` proves a UI change by driving the page, with the Playwright CLI or `/web-pages` once rebuilt to cover the whole UI, not only debugging. Designed during the first real project with a UI. Parked by the user 2026-10-01. **parked**

- [ ] **`/grill`**: a skill fired at a finished artifact, `disable-model-invocation: true`, never model-invoked. Decided and undesigned. One form hands the stripped mechanism to subagents that never saw the conversation, so none of them can defend it. **talk first**

- [ ] **The skill-creation trigger**: when a recurring pattern becomes a new skill, and who writes it. **talk first**

- [ ] **Auditing current work against a skill's accumulated practice**: scope it to what the work touched, or the reads are unbounded. **talk first**

- [ ] **Whether a child map may write an open branch into its parent's `map.md`.** Built 2026-09-08 as `/flow:groundwork` Phase 2's rule for a decision that binds more than 1 child, because 2 children answering the same question answer it differently. Unproven: no product has been split into child maps yet, and the rule assumes one session at a time, which holds for a solo developer and not in general. Reverse it and the alternative is walking the shared decision in whichever child hits it first, then having the sibling read it. **talk first**

## `flow`, the tool

- [ ] **One sharing command for everything anyone learns**, the same path for the user, a maintainer and a new user, with no roles. Workflow notes and failures become GitHub issues; skill findings and wiki pages become pull requests. The agent drafts the text, removes anything private, and sends after one yes. Review is the bottleneck once everyone contributes, so an automatic first pass joins duplicates, checks the format and catches private details before a person reads anything. `flow contribute` left `flow help` on 2026-09-29 and waits for this. Built during the beta, once real knowledge collects. Decided with the user 2026-09-29. `knowledge-base.md`
- [ ] **Ticket skills, the parts left out of the first build**: a `FileChanged` hook updating the list on a hand edit, `sync` after `records-sync.js` and `flow sync` pull tickets, a `ticketSkills` setting turning it off, a hook moving the status before the phase skill loads. **parked** `ticket-skills.md` → `## Left out, kept in the backlog`
- [ ] **A file dragged from the VS Code sidebar into the terminal lands as `@path`.** Today VS Code types the quoted full path, `'/home/me/app/src/auth.ts'`, so the agent spends a step reading a file `@src/auth.ts` would have attached. No hook sees text before it enters the input box, and VS Code lets no extension change a terminal drop. Claude Code issue #95761, opened 2026-09-21, asks for exactly this. A wrapper around `claude` rewriting the paste was rejected by the user. Waits for Claude Code or VS Code to ship it. **parked** 2026-09-30
- [ ] **`flow history`**, filtering the history log by type, name and date, once grepping it gets tedious. `management.md` → `## Skills, sources and the machine's clones, ruled 2026-09-23`
- [ ] **One state path across harnesses.** Raised by the user 2026-09-09. Flow writes to `~/.claude/` today, and a second harness means `~/.codex/` or `~/.agents/` beside it, each with its own layout. What the user wants is one place holding whatever must survive a machine change, with `~/.flow/` as the candidate, and explicitly **not** the whole of `~/.claude/` moved under it. Open: which files actually need to travel, whether they are linked or copied, and how a harness that only reads its own path gets them. Depends on the second machine, in `beta.md`, since travelling means committed. **talk first**
- [ ] **A study case says `fixed` the moment a rule changes, and nothing checks that the rule worked.** `open` and `fixed` are the only 2 statuses, so writing the fix and declaring it good are one act. All 3 cases written 2026-09-06 say `fix: home/CLAUDE.md`, and `## The turn` has never run in a session. Wanted: `addressed` in the middle, meaning the file changed and the change is unproven. Changes `CASE_STATUSES` in `lib/cases.js`, the `--status` values on `flow cases ls` and `edit`, and `references/study-cases.md` → `## Closing`. **What blocks it is who promotes a case to `fixed`:** nothing watches a session today, so `addressed` becomes the terminal state and the third status buys nothing. **talk first**. `rules.md`
- [ ] **2 tickets at once, in 2 sessions.** Needs a second checkout of the code, a git worktree, which Flow's settings deny an agent today and the user never makes by hand. 2 decisions dropped on 2026-09-29 come back with it: how a worktree in another folder reaches `<repo>/.flow`, and how a new worktree gets the ignored skill links in `.claude/skills/`. `ticket-store.md`, and `skills.md` → `### Branches`. **parked**
- [ ] **Resuming after `/clear` with no id typed.** `/flow:handoff` leaves a marker naming the ticket. `scripts/hooks/session-check.js`, which already runs after `/clear`, loads that ticket's files, and the user types any word. Nothing can type `/clear` for the user: the agent runs no built-in command, and a hook's `initialUserMessage` starts a turn only under `-p`. It saves typing the id. Ruled after V1 by the user 2026-10-01. **parked**
- [ ] **`/goal`, Claude Code's built-in that keeps the agent working until a condition holds**, checked by a small model after each turn. It would carry the agent past the stops Flow makes for the user: plan approval and review. `disableBundledSkills` hides it from the agent, and the user can still type it. Parked by the user 2026-10-01. **parked**
- [ ] **Flow without a GitHub account.** V1 requires one: the Flow home is a private GitHub repository, and `flow install` signs `gh` in where it is not. Without GitHub there is no `flow sync`, no second machine, and no project branch `flow` to push. GitLab and an install with no remote wait until someone needs them. Ruled by the user 2026-10-01. **parked**
- [ ] **Flow on native Windows.** Today it runs on Linux, macOS and WSL: every hook is a `$HOME` shell line, every skill carries a bash line, and the install writes symlinks into `~/.local/bin`. Native Windows runs hooks in PowerShell. Raised by the user 2026-09-16. `management.md` → `## Which operating systems`

## Rules and always-loaded files

- [ ] **Project-level rule checks at `.flow/checks/<id>.js`**, with the scorecard loading both folders. Designed and deliberately skipped in the 2026-09-07 build: no project needs one, and a mechanism built ahead of its first case gets built wrong. The global half at `scripts/rule-checks/` is done. **parked**

- [ ] **A rule id is written by hand and nothing checks the naming.** The convention lives in `references/write-rules.md`, and `flow scorecard` reports an id defined twice in one file. Left open: whether the same rule in `home/AGENTS.md` and the repo `CLAUDE.md` must keep the same id, which is what makes `flow scorecard` count it once. **parked** until rules are added from mining rather than by rewriting

- [ ] **Dependency discipline**: a check before any dependency is added, and how a bulk version bump gets reviewed. **talk first**

- [ ] **The negation split**: a prohibition where the agent breaks a rule under pressure, a positive recipe where the output comes out the wrong shape. **talk first**. `rules.md`

- [ ] **Symlinked rules do not load in Cowork desktop sessions.** Those sessions skip a symlinked `~/.claude/rules/` file resolving outside the working directory, and `flow install` links every one of them into the clone. Terminal and IDE sessions are unaffected. Since 2026-09-18 the rules miss Cowork too: those sessions skip an import in `~/.claude/CLAUDE.md` that points outside the working folder, and `@~/.agents/AGENTS.md` always does. No decision yet on whether Flow cares. `rules.md` → `## .claude/rules/ is a standard Claude Code feature`

## The audit

Built 2026-09-02, over the transcripts Claude Code already writes. `flow audit` indexes them into a SQLite file, answers queries against it, and opens a bounded turn range of the original conversation when the counts are not enough. The comments at the top of `scripts/lib/audit/` describe the index.

- [ ] **Scoring a session against Flow's rules, conduct rules included.** The machinery landed 2026-09-07 and holds no checks, so nothing is scored yet. A check is a function where a function can decide, and a model call only where it cannot. `rules.md` assumes one `PreToolUse` hook on `Edit|Write` and leaves conduct rules to a reminder, but 3 documented hooks reach further. `MessageDisplay` streams Claude's prose with a `turn_id`. `PreToolUse` carries the `prompt_id` of the user prompt in progress. `Stop` carries `last_assistant_message` and can block, up to 8 times in a row. Text against edits inside one turn is readable, so `the-turn` and `the-reply` become enforceable and not only measurable. Raised by the user 2026-09-07. **talk first**, a design pass. `rules.md` → `## Locked decisions: the enforcement bridge`, `lab/context/claude-code.md` → `### What a hook can see of the conversation`

- [ ] **The rule-text injection path has never run live.** When a check fires against a rule whose file never loaded this session, `rule-check.js` injects the rule's whole text instead of its id. `checks.ruleText` is unit-tested and has never been exercised by Claude Code. It stays unproven until a `warn` check exists. Moves up if a major rule gets a check before release

- [ ] **A linter is a rule check Flow does not have to write.** Raised by the user 2026-09-10. ESLint, ruff and shellcheck already decide most of the shape questions `scripts/rule-checks/` would otherwise implement by hand, they run over a whole file rather than one edit's added text, and their rules are argued over by more people than Flow will ever have. Two ways in: a check that shells out to the linter and files its findings under a Flow rule id, or Flow generating linter config from its own rules so the two cannot disagree. Open: which rules belong in linter config rather than in JS, what a project with no linter gets, and what happens when a project's existing config contradicts a Flow rule. **never-install binds here**: Flow can read a config a project already has, and adding a linter is the user's call. **talk first**

- [ ] **A full sweep over the tree against every rule, ending in one report.** Raised by the user 2026-09-10. `PreToolUse` sees one edit at a time and only the text that edit added, so nothing today can say how the project as a whole stands against the rules. A sweep walks every file, runs every check whose `applies` matches, and writes one report detailed enough for an agent to work through: fix these, report those, ignore the rest. Distinct from `flow scorecard`, which counts what sessions did rather than what the tree holds. **The design problem is `needs: 'added'`.** Every check is written to judge new text, and handing one a whole file that predates the rule turns a clean tree into thousands of findings. So a sweep either runs a different set of checks or every check declares what it does when handed history. **talk first**

- [ ] **The daily sweep is a second mode**: analysing every session since yesterday is batch, and batch wants parallel dispatch. Parallel readers need no worktree and no change record, so nothing blocks it since 2026-09-15. The deterministic half runs at zero token cost over every new session and escalates only what it flags

- [ ] **A run is not wired to anything**: `run` and `run_session` are built and empty, every query treats them as optional, and nothing writes a row. A `SessionStart` hook has `session_id` and `cwd`, and `statuses.js` says which ticket is in flight. It also fires on `compact`, so a naive hook counts one session 4 times. **talk first**

- [ ] **`flow audit prune`**: `cleanupPeriodDays` is 365, so nothing bounds `~/.claude/projects/` for a year, and the index is 44 MB against 241 MB of transcripts as of 2026-09-02. Prune by run rather than by age, delete only what the index has fully read, and never sweep what a study case pins

- [ ] **A subagent's transcript is indexed and unreachable**: each one becomes its own session row carrying `agent_of`, and no query joins on it. A subagent's tool calls do not appear in its parent's totals

- [ ] **`~/.flow/workflow-notes.md` and study cases cite the audit**: both become readers of it. A case still extracts and commits what it cites, because the index is machine-local and the transcripts are swept. `references/study-cases.md` justifies writing one immediately because the conversation is the only copy, and retention weakens that premise. **talk first**

## Subagents and dispatch

- [ ] **Output contract, tool allowlist and model, per agent**: nothing fixes what a dispatched agent returns, so it comes back as free prose the parent has to re-read. The model for fixing a format exactly is `repos/skills/caveman/agents/cavecrew-*.md`, 3 tight subagent definitions each with a tool allowlist and `model: haiku`. **talk first**

- [ ] **2 modes of pace, careful and fast**, shaped like Claude Code's fast mode: a fast user still keeps tickets, and skips the phases they don't want. Raised by the user 2026-09-29, who rejected both a pace fixed per machine and 2 versions of one rule. **talk first**

- [ ] **2 snapshots per command a worker runs**, which is slow on a very large repository. Nothing has measured the cost. `docs/subagents.md`

## Drawing

- [ ] **Turn the glyph probe into a script**: `lab/research/ascii-glyph-probe.md` is evidence today. `scripts/glyph-probe.js` would make "show it to the user first" something the agent can carry out, and it has to render into a file as well as a terminal. `drawing.md`

- [ ] **The ASCII engine**: hand it JSON, get back the drawing. You have read `drawing.md` and mostly disagree with its recommendation; state your direction before anything in there gets argued. **talk first**

- [ ] **An SVG engine**: later than the ASCII one. It reopens the SVG ban, decided on a measured ~10 minutes and ~80k tokens per diagram in the main context, which a subagent changes. **talk first**

## Other people, other models

- [ ] **Flow on another harness and on another model.** Researched 2026-09-06 and 2026-09-07, and nothing is locked. **Codex waits until Flow has shipped on Claude Code**, ruled by the user 2026-09-18, reversing a ruling from the same morning that put the port before the management skill. Each harness may get its own mechanisms rather than one bent to fit both. The `flow:` prefix and the one real copy of each file in `~/.agents/` were built before the reversal and stay, since any harness needs them. **talk first**. `models.md`. The parts:
  - **The Codex hooks, in `~/.codex/hooks.json`.** Walked hook by hook on 2026-09-18, with a design for each. The git switch that walk designed for was removed on 2026-09-25, and a Codex hook still cannot answer "ask", so the guard's 4 asks need a new design there. `models.md` → `### The hooks on Codex, walked 2026-09-18`
  - **Codex writes only inside the project, `/tmp` and `writable_roots`.** Add `~/.flow` to `writable_roots` under `[sandbox_workspace_write]` in `~/.codex/config.toml`, so Flow's own files can be written from a Codex session. `apply-migration.js` also writes into `~/.claude/`, `~/.codex/` and `~/.agents/`, so from Codex it runs outside the sandbox, as a command asking for `sandbox_permissions: require_escalated`. `SandboxWorkspaceWrite` in `repos/harnesses/codex/codex-rs/config/src/types.rs`
  - **Codex's memory stays off**, as it is by default: `[features] memories`, in `repos/harnesses/codex/codex-rs/features/src/lib.rs`. Claude Code keeps memory per project and Flow turns it off in `home/settings.json`. Codex's, when on, is one pile in `~/.codex/memories/`, which would split what the 2 harnesses know again
  - **The Codex subagents, as TOML files in `~/.codex/agents/`.** Read `import_subagents` in `repos/harnesses/codex/codex-rs/external-agent-migration/src/source/cla.rs` first
  - **A skill linked onto the whole machine never reaches Codex.** `flow skills on <name> --machine` or `--global` links into `~/.claude/skills/`. Codex reads `~/.agents/skills/` alone, so both would move there, with a link back for Claude Code the way Flow's own plugin folder has one
  - **The failure log sees nothing from Codex.** Codex has no `PostToolUseFailure` hook (`models.md`), so a failed MCP tool or Flow command there writes no line. `failure-log.md`
  - **`flow audit` reads Codex's session logs**, `~/.codex/sessions/YYYY/MM/DD/rollout-<id>.jsonl`, through a new scanner beside `scan.js`. Until it exists, work done in Codex is invisible to every audit query
  - **No rule is measured per model.** Sonnet 4.6 puts the report before the edits. Opus 5 fails plain explanation with the reply rules loaded. A base rule set plus a per-model overlay is the shape, earned by the scorecard split rather than assumed
  - **Buy one coding plan and run Flow on it.** GLM at $18, or Qwen at about ¥200, which bundles Kimi, GLM and MiniMax. It answers whether a non-Claude model holds Flow's rules, whether the quota survives Flow's token profile, and whether auto mode's classifier runs on the gateway model
  - **Replace `WebSearch` and `WebFetch` off Anthropic.** `WebSearch` is a server-side Anthropic tool and stops. `WebFetch` preflights to `api.anthropic.com` and reportedly fails behind third-party providers. An MCP search server is the replacement, Parallel first, since its free endpoint needs no key. `CLAUDE.md`'s read-the-docs rule depends on both
  - **The audit's `cost_usd` and cache columns go wrong** from the first non-Anthropic session: a flat plan has no per-request dollar figure
  - **Survey the remaining harnesses**, `deepseek-harness` first

## util

- [ ] **util: `git uncommitted get <machine> --branch` makes the branch the other machine had.** Today `get` refuses on any branch but the matching one, and on a machine that never had the branch there is nothing to switch to, so the work cannot land. Everything else already travels: a push sends every object the remote lacks, and the copy's parent commits are those objects, so unpushed commits arrive as the copy's ancestors. The flag creates the branch at the copy's parent commit, which is exactly where the other machine's branch tip was, switches to it, then applies the copy's diff the way a plain `get` does. Designed with the user 2026-09-20. An empty branch was rejected there: it points at none of the work.

- [ ] **util: an outline of any file**: the lines that give a file its shape, each with its line number, so the next read aims at one range. Markdown headings, and the functions, classes and exports of JavaScript, TypeScript and Python. Found 2026-09-24 in 586 heading searches (`grep -n '^#'`) across the machine's Claude Code transcripts. Raised by the user the same day, and designed once the build starts, flag name included. **talk first**

- [ ] **util: `fs merge --strip-comments`**, an opt-in flag dropping comments from every block it prints. Lived as a `TODO:` inside `commands/fs/merge.js`, where `--help` printed it to anybody running the command; moved out 2026-09-11. Risky for TypeScript, where `@ts-ignore`, `declare const` and type comments each change what the code means, so the flag has to know the language before it strips a line

## domain-skills

- [ ] **domain-skills: the pipeline's second half**: the CI checks on pull requests there, and Flow's `/flow:write-skill`. CI waits for the first contributor other than the user, and `/flow:write-skill` for a first run done by hand on the abuse-prevention case. `flow contribute` was built 2026-09-15. Later still: a drift agent and skill evals. `skills.md`

- [ ] **domain-skills: a domain skill covers one tool at several versions.** React 17, 18 and 19 differ, and the minors between them do too, and nothing in a skill's shape says where React 19 knowledge sits or how a run picks it. Raised by the user 2026-09-12; a `package.json` lookup was guessed and rejected, and the user has a mechanism in mind. **talk first**. `skills.md`

- [ ] **domain-skills: rebuild `/web-pages` on `browser-harness`**: 1,059 lines to roughly 150: 54 in `SKILL.md`, 514 in `knowledge/`, 491 in 2 scripts. The capture transport dies, the investigation method stays. Waits for the move to Linux, and is the 1 skill excluded from Flow's writing pass until then. It sits unchanged in `drafts/web-pages/`, and ships by moving to `skills/` in the shape `CONTRIBUTING.md` sets. Its body appends what an investigation proved to a file in its own `knowledge/domains/`. Installed from a clone of that repository, the write would land in the clone, so the rebuild records it as a finding instead. `skills.md`

- [ ] **domain-skills: Chrome extensions**: 3 guides at `drafts/chrome-extension/`, 749 lines on Manifest V3 extensions, single-page app hosts and YouTube. Written for an earlier workflow, moved there from Flow's deleted `lab/framework-build/` on 2026-09-15, and never shaped as a skill. Waits for the next extension project. **parked**

## toolbox

- [ ] **toolbox: the library**: the user's catalog of software tools that grows by itself, with harvesters, a web UI, agent access and ratings. A separate product from the toolbox, designed later through Flow's own groundwork. The user's notes sit in Flow's `tmp/notes/library.md`, which git ignores. **talk first**. `skills.md` → `### The library, for later`

## Research still to read

- [ ] **Read `agent-toolkit/skills/game-changing-features` and `adhd` for `/flow:groundwork`'s idea generation.** Both produce ideas rather than shape one, which is the half `/flow:groundwork` does least: `game-changing-features` forces the _what would make this 10x more valuable_ question, and `adhd` is a divergent-ideation engine. `adhd` was already read once, on 2026-08-29, for its writing rules only: this is a different question and the earlier verdict does not carry. `bash lab/scripts/repos.sh` restores both

- [ ] **Read `claude-task-master` for initialization, the ticket system and the workflow shape.** An AI task-management system that drops into Cursor, Windsurf, Roo and others, 28k stars, JavaScript, last pushed 2026-04-28. It is the closest thing to a direct competitor Flow has: it solves the same ticket problem for many editors where Flow solves it for one, so its onboarding and its task model are the 2 things to read. github.com/eyaltoledano/claude-task-master

- [ ] **Read `deepseek-harness` for ideas**: a plugin-based agent harness where everything is a plugin, cloned at `repos/harnesses/deepseek-harness/`. Ranked last here. github.com/deepseek-ai/deepseek-harness
