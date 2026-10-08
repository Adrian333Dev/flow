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

- `docs/spec/setup.md`: installing Flow on a machine, setting up a project, updating, syncing machines, restoring and uninstalling.
- `docs/spec/tickets.md`: the ticket store, the `flow` ticket commands, the ticket skills, and the status moves each phase makes.
- `docs/spec/skills.md`: Flow's skills and its 4 phases, how skills install and switch on, outside skills and their sources, and project overlays.
- `docs/spec/rules.md`: the rule file, how a rule is written, the rule checks and the scorecard.
- `docs/spec/knowledge-base.md`: research, the wiki of outside tools, Context7, capture and findings.
- `docs/spec/drawing.md`: `/flow:visualize`, and how a diagram is drawn and checked.
- `docs/spec/failure-log.md`: the failure log and `~/.flow/logs/`.
- `docs/spec/manual.md`: `docs/`, the README, and how Flow describes itself.

## Behaviors with no part file

### Hooks and guardrails

12 hook scripts, registered 21 times in `home/settings.json`.

- `V1` **Every shell command runs without a prompt.** `permissions.allow` holds a bare `Bash`, ruled by the user 2026-09-28: a list of allowed programs asked on half of real commands.
- `V1` **The guard asks before 6 kinds of harm**: losing work, sending data off the machine, a deploy or cloud write, changing the machine, running outside code or writing Claude Code's or Flow's settings, and reading a secret. It never allows. A delete inside the project's `tmp/` never asks.
- `V1` **A commit, a push and a package publish always ask**, through `permissions.ask`.
- `V1` **`sudo`, `su`, `mkfs` and `--dangerously-skip-permissions` are denied**, through `permissions.deny`.
- `V1` **The session hands off at 150,000 tokens.** `context-check.js` tells the agent to run `/flow:handoff` at the next checkpoint, then again every 20,000 tokens past it. The user set the limit 2026-09-27, since answers degrade past about 140,000.
- `V1` **Flow never compacts.** A typed `/compact` is refused with `Run /flow:handoff, then /clear.`, and Claude Code's own compacting is off. A handoff keeps what the next session needs, where a summary keeps the conversation.
- `V1` **One reminder line beside every message the user sends**, naming `## The reply` and `## Capture`. `"reminder": false` turns it off.
- `V1` **`@` lists every file, git-ignored ones included, most recently changed first**, answered from a saved walk in about 50 ms.
- `V1` **The session start prints one line only when something needs attention**: a stopped setup, a version behind, a git repository with no Flow, old Claude Code memory to fold in. It also makes every skill link and ticket skill match the settings, and starts the background pull and sync.
- `never` **Auto mode**: it costs extra, its reviews fail with no verdict, and it blocks what the conversation agreed. Ruled 2026-09-28.
- `never` **Claude Code's sandbox** in place of the guard, ruled 2026-09-28.
- `never` **A hook approving a command whose programs are all on a list**: built and removed 2026-09-28, since every missed shape meant editing the list.
- `never` **A timed switch letting commits and pushes run without asking**: removed by the user 2026-09-25, since Claude Code's own prompt covers it. `git log -S gitMode` finds the code, if a switch that holds even in auto mode is ever needed.
- `never` **A typed `/compact` let through on the second try**, refused 2026-10-01: people learn to type it twice.
- `later` **The guard checked against Dippy's and CC Safety Net's thousands of command cases**, with one sentence of threat model: the guard stops a helpful agent's accidents, never a deliberate attack.

### Subagents

- `V1` **A subagent's changes reach the main session as a change record**: the files its own tool calls changed, recorded by `changes.js` under its id. The main session judges the work by the record, never by the subagent's report.
- `V1` **`haiku-worker` carries out one decided step** that repeats across many files.
- `V1` **Review runs in the session that built the work**, never in a subagent.
- `never` **A fork, the subagent that starts with a copy of the whole conversation.**
- `later` **A fixed output, tool list and model per subagent**, so a report comes back in a known shape.
- `later` **Measuring the 2 snapshots taken per command a worker runs**, slow on a very large repository.

### The status line

- `V1` **`flow status-line --context` shows the ticket in work, its status, the context size and Flow's open issues**: `fw-28 building · 98k of 150k`, then `⚠ 2 Flow issues: ask Claude to fix them` while a background job's last run failed.
- `next` **A status line worth reading**, showing what a session needs: `fw-37`.
- `next` **Every session named by itself**, so the right one is easy to find after `/clear`: `fw-38`.

### The audit and study cases

- `V1` **`flow audit` indexes Claude Code's transcripts into SQLite** and answers queries over it. `/flow:review` reads it.
- `V1` **`flow cases` keeps the exact output the user reacted to, for good**, grouped by kind of failure across projects. The third case in a folder is the evidence a rule is needed.
- `V1` **Study cases and workflow notes keep the output word for word, and the project's name**, though both sync to GitHub. Set 2026-09-30.
- `later` **`flow audit prune`**, by run rather than by age, never touching what a case cites.
- `later` **A subagent's transcript joined to its parent's**, and its tool calls counted in the parent's totals.
- `later` **A run wired to the sessions it spans**, and a daily sweep over every session since yesterday.

### Mods

- `next` **Flow built into Claude Code through mods.** Ruled by the user 2026-10-02: the beta ships on command hooks, and mods get built during the beta, in this repo. First the 4 open questions get probed, then watch-only mods replace `context-check.js`, `compact-check.js` and the status line. Later steps bring a ticket board in its own pane, every reply checked against the rules before the user reads it, sessions on one repository kept from editing over each other, and a rule loaded the moment a matching file is written. `fw-14`, and `.flow/research/claude-code-mods/README.md` → `## Build order`.

### Pace

- `next` **A fast mode across every phase**, keeping tickets and skipping the ceremony the user does not want: `fw-16`. A pace fixed per machine and 2 versions of one rule were rejected by the user 2026-09-29.

### Working on Flow itself

- `V1` **A release copy and a dev copy.** Every session runs `~/.flow/repos/flow`. A session started with `alias claude-dev='claude --plugin-dir ~/code/flow-dev/skills'` loads the skills and mods from the dev copy, in any project. Hooks, the `flow` command and the status line stay on the release. Ruled 2026-10-06: the simplest version, gaps accepted.
- `V1` **A test of a command that exists to print compares its whole output against a literal**, set 2026-09-11. A test reading only the filesystem passed over a command that described the filesystem wrongly.
- `V1` **`lab/scripts/try.sh`, its saved computers and the practice projects stay.** A change deep enough to need a test from scratch needs a pretend computer, and `tmp/computers/before-flow/` cannot be saved again once Flow is installed.
- `later` **The whole repository as one plugin**, so a dev session runs the dev copy's hooks too. Parked until a hook waiting for a release blocks real work.
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
- `V1` **`flow cases`**, proposed as a merge into workflow notes. A case keeps the output for good and closes naming the file that fixed it, so a rule shortened later still shows why it exists. A note is one line, deleted once filed.
- `V1` **The settings levels and the project overlays**, which make Flow flexible.
- `V1` **The ticket skills, the skill updater, the `@` file list, and the restore and uninstall forms**: each small and asked for, or the undo the beta needs.

### Other harnesses, models and platforms

- `later` **Codex, then open models**, ruled by the user 2026-09-18: nothing ports until Flow ships on Claude Code. Each harness may get its own mechanisms rather than one bent to fit both. `.flow/research/models.md` holds the port's costs.
- `later` **Native Windows**, where hooks run in PowerShell. Every hook today is a shell line.
- `later` **Flow without a GitHub account**, parked by the user 2026-10-01. Without GitHub there is no `flow sync`, no second machine and no branch `flow` to push.
- `later` **One folder holding what must survive a machine change across harnesses**, `~/.flow/` the candidate, never the whole of `~/.claude/` moved under it.

## How you know it worked

- **The README's install line sets up a real machine**, the acceptance test: done, `fw-1`.
- **`npm test` in `scripts/` passes**: 255 tests.
- **Flow carries real work on this machine for 2 to 3 weeks of beta**, and each checklist ticket, `fw-2` to `fw-14`, is tried once in real use.
- **A second project starts with what the first one learned**: a finding about a tool, filed in one project, is read by `/flow:research` or `/flow:execute` in the next.
- **A correction is filed once.** The same rejected reply does not come back after its rule lands, which study cases and `flow audit` show.

## What it competes against

- **Skill sets**: Superpowers, Agent Skills and mattpocock/skills, compared in the README's table. Flow leads on design before code, task tracking, long sessions, self-improvement, rule enforcement, sync across machines, skill management, installation and hooks. It trails on supported agents, Claude Code alone against up to 70. Plan, build, review and debug are a tie, so the table gives them no row.
- **Compound Engineering and gstack**, whole workflows. Compound Engineering trails Flow on every row but supported agents. gstack has about 135,000 stars.
- **Memory tools** remember what went wrong. Flow changes what the agent does next time.
- **The cost**: Flow loads about 4,000 tokens at session start, against 1,000 to 2,200 for its contenders.

`.flow/research/contenders.md` holds the survey.

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
- **Original**: every path as it was before Flow first touched it, kept so a restore or an uninstall puts it back.
- **Study case**: the exact output the user rejected, kept for good, with the file that fixed it.
