# Flow

What Flow is, who it is for, what it rests on, and the index of every other spec file. Each part of Flow has its own file under `docs/spec/`, holding what the part does and how it is built. A behavior carries one mark: `V1`, `next` (committed, no release picked), `later` (wanted, no commitment) or `never` (refused, with the reason).

## What Flow is, and who it is for

Flow is a complete development workflow for Claude Code, built for one developer working alone. It takes a raw idea and finds every decision the project needs, including the ones nobody raised. It researches the open ones, settles each one with the user, and tests the design against real cases before any code exists. It cuts the design into tickets, then plans, builds and reviews each one. It carries the work from one session to the next. Everything it learns about the user's preferences, their tools and its own mistakes goes back into its skills, its rules and a wiki every project shares. Each project starts with what the last one taught it.

It runs in Claude Code alone, on Linux, macOS and Windows through WSL, and needs a GitHub account. It is free, under the MIT license.

## The problem, and why now

- **A session starts from nothing.** Claude Code reads the rule files and the code. The decisions behind the code, the work in progress and what went wrong last week sit in no place it reads.
- **The agent settles open questions silently.** A decision nobody raised gets made mid-build, by whatever the agent guessed.
- **Long work outruns one session.** Answers degrade past about 140,000 tokens of context, so real work spans many sessions, each needing the state the last one left.
- **A correction is forgotten.** Memory tools store what went wrong. Nothing changes what the agent does next time.
- **Skill sets teach each step and stop there.** Nothing runs the work between the steps: which ticket is next, what state it is in, what was learned on it.

**Why now**: Claude Code ships skills, plugins and hooks, enough to build a whole workflow without changing Claude Code itself. Since 2.1.287 its mods let Flow run inside Claude Code and draw on its screen.

## Flow as a whole

Flow lives in 3 places:

- **A Claude Code session**: the rule file, Flow's skills and Flow's hooks are loaded, and the work runs there.
- **The project**: its tickets live on an orphan branch `flow`, checked out at `.flow/`. Code branches never carry it. Git carries it to GitHub and to every other clone.
- **The machine**: `~/.flow/` holds the rule file, Flow's clone, the skills, the wiki of outside tools and the logs. `flow sync` carries it to the Flow home, a private GitHub repository each user has one of, so every machine shares it.

The work runs as one loop across them:

```text
Design    idea → every decision mapped → researched → settled with you → tested on real cases → design written down
Build     tickets → plan → build → review → handoff to the next session
Improve   preferences, tool knowledge, mistakes → filed into skills, rules and the wiki ↺ the next project
```

```text
┌────────────────────────────────────────────────────────────────┐
│                     A CLAUDE CODE SESSION                      │
│                                                                │
│                Design  ──►  Build  ──►  Improve                │
│                                                                │
│          loaded: the rules, Flow's skills, the hooks           │
└────────────────────────────────────────────────────────────────┘
    │ tickets,    ▲ the ticket        │ lessons     ▲ rules,
    │ handoffs    │ in work           │             │ skills,
    │             │                   │             │ the wiki
    ▼             │                   ▼             │
┌────────────────────────────┐      ┌────────────────────────────┐
│        THE PROJECT         │      │        THE MACHINE         │
│                            │      │                            │
│  .flow/: the branch `flow` │      │  ~/.flow/: rules, skills,  │
│  checked out, its tickets  │      │  the wiki, the logs        │
└────────────────────────────┘      └────────────────────────────┘
              ▲                                   ▲
              │ git, both ways                    │ flow sync
              ▼                                   ▼
┌────────────────────────────┐      ┌────────────────────────────┐
│           GITHUB           │      │           GITHUB           │
│                            │      │                            │
│  the project's repository, │      │  the Flow home, one        │
│  its branch `flow`         │      │  private repository        │
└────────────────────────────┘      └────────────────────────────┘
```

## The parts, one file each

- `docs/spec/setup.md`: installing Flow on a machine, setting up a project, updating by a pull and `flow install`, and syncing machines.
- `docs/spec/tickets.md`: the ticket store, the `flow` ticket commands, the ticket skills, and the status moves each phase makes.
- `docs/spec/skills.md`: Flow's skills and its 4 phases, how skills install and switch on, outside skills and their sources, and overlays.
- `docs/spec/permissions.md`: what runs without asking, what asks, the guard, the dialog that asks, and the log of asks.
- `docs/spec/rules.md`: the rule file, how a rule is written, the rule checks and the scorecard.
- `docs/spec/knowledge-base.md`: research, the wiki of outside tools and fields, Context7, capture and findings.
- `docs/spec/drawing.md`: `/flow:visualize`, and how a diagram is drawn and checked.
- `docs/spec/failure-log.md`: the failure log and `~/.flow/logs/`.

## Behaviors with no part file

### Hooks and guardrails

10 hook scripts, registered 18 times in `home/settings.json`.

- `V1` **Permissions have their own file**: what runs unasked, the guard, the dialog and the log, in `docs/spec/permissions.md`.
- `V1` **The session hands off at 150,000 tokens.** The `flow-session` mod tells the agent to run `/flow:handoff` at the next checkpoint and then call its restart tool, and says so again every 20,000 tokens past the limit. The user set the limit 2026-09-27, since answers degrade past about 140,000.
- `V1` **Flow never lets Claude Code write the summary.** The agent hands off, then calls the mod's restart tool. The mod compacts the conversation in place and answers the compaction with the agent's note, each ticket in flight and the last exchange. The session and its transcript stay. Every other compaction is refused, a typed `/compact` included, and Claude Code's own compacting is off. Decided 2026-10-10 (`fw-16`, `## 17.1`).
- `V1` **One reminder line beside every message the user sends**, naming `## The reply` and `## Capture`. `"reminder": false` turns it off.
- `V1` **`@` lists every file, git-ignored ones included, most recently changed first**, answered from a saved walk in about 50 ms.
- `V1` **The session start prints one line only when something needs attention**: a git repository with no Flow. It also makes every skill link and ticket skill match the settings, and starts the background pull and sync.
- `never` **A typed `/compact` let through on the second try**, refused 2026-10-01: people learn to type it twice. The mod refuses it every time, with no override setting.

### Subagents

- `V1` **A subagent's changes reach the main session as a change record**: the files its own tool calls changed, recorded by `changes.js` under its id. The main session judges the work by the record, never by the subagent's report.
- `V1` **`haiku-worker` carries out one decided step** that repeats across many files.
- `V1` **Review runs in the session that built the work**, never in a subagent.
- `V1` **Every brief ends with a stopping point**, such as "stop after these 3 sources and write the file", never a time: agents see no clock. Decided 2026-10-12 (`fw-100`): briefs saying "about 10 minutes" changed nothing.
- `V1` **Claude Code's Explore and Plan agents switched off**, by `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1`. Explore skips every `CLAUDE.md`, so no Flow rule reaches the searches Claude Code sends it unasked; Plan has no use while plan mode is denied. Decided 2026-10-12 (`fw-100`).
- `never` **A fork, the subagent that starts with a copy of the whole conversation.**
- `later` **A fixed output, tool list and model per subagent**, so a report comes back in a known shape.
- `later` **Measuring the 2 snapshots taken per command a worker runs**, slow on a very large repository.

### The meters

- `V1` **The `flow-session` mod draws the meters on the row under the prompt** (`fw-138`): model with effort, context against `wrapUpAt` (`74k/150k`, never the 1M window), the 5-hour and weekly limits, and the prompt cache's countdown. A narrow row drops whole meters, never part of one. The old status line (`flow status-line`) is in `lab/archive/status-line/`.
- `V1` **Claude Code's agent panel shows one row per agent in the same style**, through `subagentStatusLine` in the mod's `settings.json`: what the agent does, model and effort, time running, tokens (green, amber from 100k, red past 150k).
- `next` **Every session named by itself**, so the right one is easy to find after `/clear`: `fw-38`.

### The audit and issue tickets

- `V1` **`flow audit` indexes Claude Code's transcripts into SQLite** and answers queries over it. `/flow:review` reads it.
- `V1` **Every indexed session carries its machine's name, and every audit answer opens with one coverage line per machine**: its session count and newest day. A split between machines never misleads an agent. Set 2026-10-11.
- `V1` **An issue ticket keeps the exact output the user reacted to, for good**: a ticket labelled `flow-issue` plus a type, so `flow labels "label:flow-issue"` groups the failures by kind. The third ticket of a type is the evidence a rule is needed. Replaced `flow cases` 2026-10-19 (`fw-180`, `fw-181`): the 14 study cases became tickets `fw-182` to `fw-195`, and the code is in `lab/archive/cases/`.
- `V1` **Issue tickets and workflow notes keep the output word for word, and the project's name**, though both sync to GitHub. Set 2026-09-30.
- `later` **A session sync between machines**, its own ticket after release 1: rclone sends each machine's `~/.claude/projects/` to a folder named for the machine. Until then the PC's folder is copied by hand before it is wiped for Linux.
- `later` **`flow audit prune`**, by run rather than by age, never touching what a case cites.
- `later` **A subagent's transcript joined to its parent's**, and its tool calls counted in the parent's totals.
- `later` **A run wired to the sessions it spans**, and a daily sweep over every session since yesterday.

### Mods

- `V1` **The `flow-session` mod, in `mods/flow-session/`, owns the restart and the wrap-up warning** (`fw-136`). `CLAUDE_CODE_PLUGIN_DIRS` in `home/settings.json` loads it. It replaced `context-check.js` and `compact-check.js`, which sit in `lab/archive/`. It also turns a file dragged into the prompt box into an `@` mention, and removes a note left in `.flow/handoffs/` once the session that opened it answers.
- `next` **Flow built into Claude Code through mods.** Ruled by the user 2026-10-02: the beta ships on command hooks, and mods get built during the beta, in this repo. First the 4 open questions get probed, then watch-only mods replace the status line. Later steps bring a ticket board in its own pane, every reply checked against the rules before the user reads it, sessions on one repository kept from editing over each other, and a rule loaded the moment a matching file is written. `fw-14`, and `.flow/research/claude-code-mods/flow-fixes-and-ideas.md` → `## Build order`.

### Pace

- `next` **A fast mode across every phase**, keeping tickets and skipping the ceremony the user does not want: `fw-16`. A pace fixed per machine and 2 versions of one rule were rejected by the user 2026-09-29.

### Working on Flow itself

- `V1` **One copy: `~/.flow/repos/flow` is a link to the dev checkout, `~/code/flow-dev`.** Every session on the machine runs it. A skill edit reaches a session at once, a hook and the `flow` command on their next call, and the mod when a hook file is saved. `flow update` leaves a linked clone alone, and another machine pulls from GitHub. Ruled by the user 2026-10-18, replacing the release copy and the `claude-dev` alias (2026-10-06): the user alone runs Flow, so a stable release protected no one. Costs: a half-edited hook breaks every project's session until it is fixed, and the checked-out branch is what runs. Rejected: working inside the old release clone, which would move the project record, the session history keyed by folder, `repos/`, `tmp/` and the uncommitted work to a new folder.
- `V1` **A test of a command that exists to print compares its whole output against a literal**, set 2026-09-11. A test reading only the filesystem passed over a command that described the filesystem wrongly.
- `later` **Flow in a plugin marketplace**, the plugin shipping the install script.

### Flow for teams

- `later` **A version of Flow any software team can use**, of any size, the user's biggest goal after V1. Research comes first, through `/flow:groundwork` and `/flow:research`: how teams work, and what they want from coding agents. The vision: a ticket system with the fields a team needs, a secured server with roles, a dashboard starting with a Kanban board, and a lead seeing who works on what.
- `later` **2 modes, set by the user 2026-09-28.** A team fully on Flow keeps each ticket's record on a server with a database, since tickets shared through git break past 2 people, while the plan and the groundwork stay in the repository. A team keeping its tracker keeps a thin Flow record per tracker id, GitHub Issues the best fit. A two-way sync of a full Flow ticket and a full tracker item was rejected: 2 records that never quite match.
- `later` **Free means self-hosted open source.** A free hosted server means paying for servers and answering for its security indefinitely.

### Kept in the final sweep

Each piece below was proposed for removal on 2026-10-01 and kept. Raise one again only with new evidence.

- `V1` **The guard**, the safety net against destructive commands.
- `V1` **`changes.js`**, which lets 2 Haiku workers edit at once without mixing their changes. Uncommitted work makes `git diff` mix them.
- `V1` **`flow audit`**, read by `/flow:review` and by the update's proof step.
- `V1` **`flow cases`**, retired 2026-10-19 into issue tickets (`fw-181`). A case kept the output for good and closed naming the file that fixed it, so a rule shortened later still shows why it exists. A ticket does the same.
- `V1` **The settings levels and the overlays**, which make Flow flexible.
- `V1` **The ticket skills and the `@` file list**: each small and asked for. The skill updater and the restore and uninstall forms left 2026-10-14 (`fw-124`).

### Other harnesses, models and platforms

- `later` **Codex, then open models**, ruled by the user 2026-09-18: nothing ports until Flow ships on Claude Code. Each harness may get its own mechanisms rather than one bent to fit both. `.flow/research/models/which-model-and-other-harnesses.md` holds the port's costs.
- `later` **Native Windows**, where hooks run in PowerShell. Every hook today is a shell line.
- `later` **Flow without a GitHub account**, parked by the user 2026-10-01. Without GitHub there is no `flow sync`, no second machine and no branch `flow` to push.
- `later` **One folder holding what must survive a machine change across harnesses**, `~/.flow/` the candidate, never the whole of `~/.claude/` moved under it.

## How you know it worked

- **The README's install line sets up a real machine**, the acceptance test: done, `fw-1`.
- **`npm test` in `scripts/` passes**: 255 tests.
- **Flow carries real work on this machine for 2 to 3 weeks of beta**, and each checklist ticket, `fw-2` to `fw-14`, is tried once in real use.
- **A second project starts with what the first one learned**: a finding about a tool, filed in one project, is read by `/flow:research` or `/flow:execute` in the next.
- **A correction is filed once.** The same rejected reply does not come back after its rule lands, which issue tickets and `flow audit` show.

## What it competes against

- **Skill sets**: Superpowers, Agent Skills and mattpocock/skills, compared in a README table that `fw-141` removed with the README's pitch to strangers. Flow leads on design before code, task tracking, long sessions, self-improvement, rule enforcement, sync across machines, skill management, installation and hooks. It trails on supported agents, Claude Code alone against up to 70. Plan, build, review and debug are a tie, so the table had given them no row.
- **Compound Engineering and gstack**, whole workflows. Compound Engineering trails Flow on every row but supported agents. gstack has about 135,000 stars.
- **Memory tools** remember what went wrong. Flow changes what the agent does next time.
- **The cost**: Flow loads about 4,000 tokens at session start, against 1,000 to 2,200 for its contenders.

`.flow/research/workflows/does-any-tool-match-flow.md` holds the survey.

## Bets

What Flow rests on that nobody has checked, and what happens if each one fails.

- **A lesson filed into a rule or a skill changes what the agent does.** `## The turn` and `## The reply` have never been measured, and the one rule check only counts. If it fails, self-improvement is a memory tool with more steps. Scoring sessions against the rules, in `docs/spec/rules.md`, is what checks it.
- **Walking every decision before code is worth its time to a solo developer.** If it fails, the user skips `/flow:groundwork`, and the fast mode (`fw-16`) is the answer.
- **The rules are worth what they cost**: `home/CLAUDE.md` alone is about 3,600 tokens in every session. If it fails, rules repeating Claude Code's own system prompt go first.
- **A handoff carries what the next session needs.** A fresh session picks up from the ticket alone. If it fails, sessions re-derive what the last one knew, and reading the old transcript through `flow audit` is the fallback.
- **Claude Code keeps the surface Flow builds on**: hooks, a plugin loaded from a skills folder, the settings keys. Flow has 6 issues open with Anthropic for what it lacks. If it fails, a release breaks Flow until each release is read against Flow, which `check-claude-code-updates` in `CLAUDE.md` does.
- **Nothing in Flow needs a particular model.** It is built and tested on Claude's 5.5 models, and no skill or setting is tuned to them. If it fails, a base rule set plus a per-model overlay is the shape.

## Glossary

- **Ticket**: one piece of work, its status, its plan and its history, in `.flow/tickets/<id>/`. An id is the project's prefix and a number, `fw-28`.
- **Phase**: one of 4 kinds of work, each a skill: `/flow:groundwork`, `/flow:execute`, `/flow:prototype` and `/flow:debug`.
- **Groundwork**: the phase that maps every decision an idea needs and settles each one before any code.
- **Handoff**: the state a ticket's next session needs, written into the ticket by `/flow:handoff`.
- **Capture**: the sweep at each checkpoint that files what the conversation taught into tickets, rules, the wiki or findings.
- **Finding**: one lesson, in one file, waiting for `/flow:file-findings` to fold it into a skill or a rule.
- **The wiki**: `~/.flow/wiki/<tool>/`, one folder per outside tool, shared by every project.
- **The Flow home**: the private GitHub repository holding `~/.flow/`, one per user.
- **The guard**: the hook that reads each shell command and asks before one that can do harm.
- **Change record**: the list of files one subagent's own tool calls changed.
- **Issue ticket**: a ticket labelled `flow-issue` plus a type, holding the exact output the user rejected, kept for good, with the file that fixed it.
