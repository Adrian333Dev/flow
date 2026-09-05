# Flow

An agentic development workflow for a solo developer. Rules, enforcement, a CLI for managing work across sessions, a project scaffold, and a growing set of skills.

## Table of contents

- [What makes it different](#what-makes-it-different)
- [From idea to design](#from-idea-to-design)
- [From design to build](#from-design-to-build)
- [The ticket system and CLI](#the-ticket-system-and-cli)
- [The workflow learns](#the-workflow-learns)
- [Supporting skills](#supporting-skills)
- [Built-in mechanisms](#built-in-mechanisms)
- [Keeping it cheap](#keeping-it-cheap)
- [How it compares](#how-it-compares)
- [Companion tools](#companion-tools)
- [What is next](#what-is-next)
- [Status](#status)
- [Documentation](#documentation)

## What makes it different

Flow is installed globally, once per machine, by symlinking skills, scripts, and reference files from one clone into `~/.claude/` and `~/.flow/`. `~/.claude/` holds what Claude Code reads: the rules (`CLAUDE.md`), hooks and permissions (`settings.json`), and one symlink per skill. `~/.flow/` holds what only Flow reads: the CLI scripts, the guard, reference files, the git-writes state, workflow notes, and study cases. Every project shares the same skills, rules, preferences, and accumulated knowledge. A project adds its own rules and context on top through `.claude/` and `.flow/` at the project level, and [skill overlays](#skill-overlays) let a project extend what a global skill does without editing it.

The workflow handles a full project from the initial idea through to a finished, reviewed build. Each phase produces what the next one consumes:

```
/groundwork      idea → researched design, every decision locked
/start           the board, or one ticket with its context loaded
/execute         ticket → planned, built, and reviewed
/file-findings   lessons filed back into skills and rules
```

Groundwork produces the design and cuts it into tickets. For large projects with an existing spec, `/cut-from-spec` cuts the next batch of tickets from `docs/spec/` instead, but most of the time groundwork handles ticket creation directly.

Flow can start from any point. If you already have a design, start at `/execute`. If you already have tickets, pick one up with `/start`. If you are mid-build and something breaks, `/debug` takes over. If you need to research before deciding, `/research` runs on its own.

## From idea to design

[`/groundwork`](skills/phases/groundwork/SKILL.md) takes you from a raw idea to a researched, designed solution where every decision is locked and written down. The agent works with you through four stages: map every open decision (including ones nobody raised), walk each to a locked answer through an interview, attack the result by running it through real cases, then route each decision to the file that owns it.

The mapping is where the depth is. The agent breaks the subject into independent parts and systematically generates options the user did not bring. It names contradictions in your input, challenges whether the stated approach is even right, runs a pre-mortem (imagine it shipped and went badly, name the 3 most likely causes), and checks prior art. When a branch is genuinely stuck, the skill reformulates the problem, names the underlying contradiction, forces analogues from unrelated fields, and builds structurally different solution families before judging any.

Groundwork reaches for other skills when conversation alone cannot settle a branch. It invokes `/research` to fetch docs, read source, or survey a landscape the user barely knows. When only running code can answer, it cuts a prototype ticket and hands it to a fresh session, then resumes from the findings. When the shape of something is itself the question, it invokes `/visualize` and draws it instead of describing it.

What comes out is a design: the decisions, the structure, the tradeoffs, the bets. That design routes to tickets for committed work, a spec for anything that outlives the build, and context files for durable facts. "Nothing" is a legitimate outcome. Groundwork that resolves to "not worth doing" did its job.

It works for any scope from simple feature to full project brainstorming and design.

## From design to build

[`/execute`](skills/phases/execute/SKILL.md) picks up a ticket and writes a plan that sequences the design groundwork produced. The plan does not reinvent what was already decided. It reads the code first, then writes numbered steps, each with a named check that proves it.

Building runs one step at a time. Mechanical steps (5+ files, or 10+ near-identical edits) delegate to a subagent on a cheaper model, verified through the [snapshot system](#subagent-verification-via-snapshots).

Review runs two passes over the same diff: against the plan (every step delivered, nothing extra), then against the code (see [`references/review-code.md`](skills/phases/execute/references/review-code.md)). When the built thing turns out wrong, the ticket goes back to groundwork on the same ticket, keeping its full history.

## The ticket system and CLI

`flow` is a full CLI that manages work across sessions. It tracks status, dependencies, parent/child hierarchy, and five ticket types (feature, issue, chore, topic, prototype). Each type walks a subsequence of the same status line (`todo → groundwork → planning → building → review → done`). The system refuses what would break the graph: picking up a ticket whose dependency is unsatisfied, closing a parent with open children, dropping with live dependents.

[`/start`](skills/session/start/SKILL.md) opens a session. With no argument, it shows the board and recommends what to pick up. With a ticket, it loads the ticket and routes to the right skill based on type and status: a feature at `todo` goes to `/groundwork`, a feature at `planning` goes to `/execute`, an issue goes to `/debug`, a prototype goes to `/prototype`.

Key commands:

```
flow get [id]           the board, or a ticket with its context (--files)
flow next               rank what is workable
flow new "title"        create a ticket (--type, --deps, --parent, --body -)
flow check              catch cycles, dangling ids, dropped blockers
flow <id>               show one ticket in full
flow git allow          unlock git writes with a timer
flow audit read         query session history from indexed transcripts
```

Status commands are named for where the ticket lands: `flow groundwork t047`, `flow plan t047`, `flow build t047`, `flow review t047`, `flow done t047`.

The handoff (`/handoff`) writes what the next session would get wrong without it: what is half-done, what cost effort to learn, decisions half-made, files changed outside the plan. `flow open` assembles the ticket, its handoff state, and every file named in the `flow-open` block into a context the next session can act on immediately. Sessions do not start from zero.

## The workflow learns

Capture writes everything worth keeping as it surfaces: preferences, patterns, constraints, corrections, things that cost effort to learn. Everything with no obvious home goes to the inbox, raw and unshaped.

[`/file-findings`](skills/knowledge/file-findings/SKILL.md) drains the inbox and routes each item to its destination by scope. A tool quirk goes to that tool's skill. A broad principle goes to a high-level rule. A user preference goes to the profile. Several findings on one subject that no skill covers are what earns a new skill.

The skills and rules are not static. They accumulate what the work teaches, and the next session loads those changes automatically.

## Supporting skills

Three skills fire inside any phase:

- [`/research`](skills/tools/research/SKILL.md) covers any topic: a library API, a design pattern, a domain the user barely knows. It fetches docs through the llms.txt route (most tools publish one), caches them locally under `tmp/references/`, and reads from cache on future runs so the same docs are never fetched twice. Four levels matched to depth: a single doc-page fetch, full docs cached before a plan freezes an API, a source clone for deep customization, or a landscape survey delegated to external LLMs (including free ones) in their own sessions.
- [`/visualize`](skills/tools/visualize/SKILL.md) picks the medium before drawing: prose, a list, ASCII, an ASCII frame for screen layout, or an HTML preview for color and typography. ASCII first, because it costs a fraction of what an HTML round costs and renders inline. The skill carries a pattern vocabulary (layered stacks, pipelines, flows with return paths, trees, side-by-sides), correctness mechanics (collision detection, equal row length, label fitting), and references for [screen mockups](skills/tools/visualize/references/draw-mockups.md), [large-scale diagrams](skills/tools/visualize/references/hooks-lifecycle.md) (113 columns, 97 rows), and a [full-page YouTube mockup](skills/tools/visualize/references/youtube-page.md) at real proportion.
- [`/handoff`](skills/session/handoff/SKILL.md) writes what the next session needs to carry on. It is what makes the ticket system work across sessions.

Two more fire on a situation:

- [`/debug`](skills/phases/debug/SKILL.md) requires multiple hypotheses of different kinds before testing any. Every test is a prediction written before the check runs. Three failed fixes mean the hypothesis was never the problem: the skill names the structure that makes the bug possible and hands it back.
- [`/prototype`](skills/phases/prototype/SKILL.md) answers a question only running code can settle. Throwaway code, naive on purpose, never promoted. The report is the deliverable, not the code.

## Built-in mechanisms

### The guard ([`scripts/guard.js`](scripts/guard.js))

A `PreToolUse` hook that runs before every shell command the agent executes. It checks every command against the rules: git mutations (against a mode that can be off, ask, or allow), privileged commands (`sudo`, `su`), pipe-to-shell patterns, permission bypass attempts, recursive deletes outside the working directory, and self-unlock attempts. A denied command never executes. Destructive operations that are not outright banned still stop for confirmation. The guard is a general mechanism, and its rule set will grow as the workflow does.

### Git write locking

Git is locked by default. `flow git allow` unlocks writes for the current session with a timer that locks them again when it expires. Scope narrows from global to project to session, and the narrowest wins. The agent cannot unlock git for itself: the guard denies `flow git allow` from inside a session, so the user types it in the input box.

### Subagent verification via snapshots ([`scripts/snapshot.js`](scripts/snapshot.js))

A pair of hooks (PreToolUse and PostToolUse on the Agent tool) capture the full working tree before a subagent dispatch and again after it returns. Each snapshot is a git tree object written to a throwaway index, so it records the entire working tree (dirty parts included) while the real index, the working files, and HEAD stay untouched. Comparing the two snapshots cancels out whatever was already dirty and isolates exactly what the subagent changed. The parent session reads the diff, not the worker's summary. Once git worktrees land, this mechanism unlocks parallel dispatch to multiple subagents, each working in its own copy of the repo.

### Skill overlays

A skill is installed globally and shared across every project. A project that needs to extend a skill writes `.flow/overlays/<name>.md`, and that content is appended to the skill's body when it loads. The global skill stays untouched, and the extension is scoped to the project that wrote it.

### Flow-open pre-loading

A `flow-open` block in a ticket or handoff names files and line ranges. When `flow open` loads the ticket, those files arrive in context before the session's first turn. The next session does not have to find or open anything: the files are already there.

### The audit system

`flow audit` indexes the transcripts Claude Code writes at `~/.claude/projects/` into a SQLite database and answers queries against them. It reads any session that ever ran, including sessions from before the audit existed. `flow audit read` opens a bounded turn range from a past session. `flow audit sessions` lists what is available. The index is derived and rebuildable from the raw transcripts at any time.

### Permission denials and feature flags

`settings.json` denies tools Flow does not use (plan mode, remote triggers, artifact creation, and others) and disables features that conflict with the workflow (bundled skills, built-in workflows, remote control). These are enforced at the settings level, so the agent cannot bypass them.

## Keeping it cheap

ASCII over HTML for diagrams and mockups: a fraction of the tokens, renders inline, and the structure is decided before color starts.

`util fs tree` for reading directory structure without noise:

```
skills/
├─ phases/       groundwork, execute, prototype, debug
├─ tools/        research, visualize
├─ commands/     start, handoff, file-findings, cut-from-spec
├─ stack/        web-pages
└─ dev/          flow-review
```

`util fs merge` for loading many files into context in one call. It supports line ranges (`file.md:45-89`), extension filters (`--ext ts,tsx`), and a trailing note after `--` that rides alongside the content. One call is cheaper than separate parallel reads, and the agent gets the content in a single block instead of scattered across tool results:

```
util fs merge src/auth.ts src/db.ts:1-50 lib/helpers/ -- focus on the auth flow
```

Research levels that stop at the shallowest depth that answers the question. Delegating heavy research to external LLMs (including free ones) keeps cost at zero for broad surveys. A cheaper model for delegated mechanical steps. Prototypes in their own session so throwaway code does not consume the main context.

## How it compares

The alternatives are skill sets: packages of skills you install into an agent. Flow is a workflow. The difference is in what happens between the skills and around them.

A skill set can build a feature you already know you want. You come in with "build a dashboard", invoke the right skill, and it helps you write the code. Flow handles the full lifecycle of a project. You come in with a raw idea, and the workflow takes you through designing the solution, cutting it into tickets, building each one, reviewing the result, filing what you learned, and carrying state to the next session. The alternatives have no mechanism for that chain, because the chain is not made of skills.

Flow can also start from any checkpoint. If the design is done, skip groundwork. If the tickets exist, pick one up. The phases are a pipeline, not a forced sequence from the beginning.

Other differentiators:

- **The workflow improves itself.** Every session's findings get filed back into the skills and rules. The alternatives ship a fixed set of skills that update when the author ships a new version.
- **Enforcement is at the tool level.** The guard intercepts commands before they execute. Permission denials block tools at the settings level. The alternatives rely on the agent following instructions in the prompt.
- **State survives between sessions.** The ticket CLI, the handoff, and flow-open pre-loading carry context forward. The alternatives start fresh every session (mattpocock/skills integrates with issue trackers, but does not pre-load context or carry handoff state).
- **One global install serves every project.** Skills, rules, preferences, and accumulated knowledge are shared. A project extends the base with overlays and local rules. The alternatives install per project or require copying files.
- **Subagent work is verified by diffs, not by trust.** The snapshot system proves what a subagent changed. The alternatives delegate work and trust the report.
- **Cost optimization is a design principle.** ASCII over HTML, research levels, delegation to cheaper models, merge over parallel reads. The alternatives do not optimize for token cost.
- **Structured decision-making goes deeper.** Groundwork's systematic widening, contradiction naming, distant analogues, and pre-mortem go further than any brainstorming skill in the alternatives.
- **Session history is queryable.** The audit system indexes past transcripts and answers queries against them. No alternative ships anything like it.

|  | Flow | [Superpowers](https://github.com/obra/superpowers) | [Agent Skills](https://github.com/addyosmani/agent-skills) | [mattpocock/skills](https://github.com/mattpocock/skills) |
|---|---|---|---|---|
| Full project lifecycle | Idea through build, review, and filing | Brainstorming through shipping, each skill independent | /spec through /ship, checklists per step | Composable skills, no pipeline |
| Start from any point | Yes, any phase | Each skill invoked independently | Each command invoked independently | Each skill invoked independently |
| Cross-session state | Ticket CLI, handoffs, flow-open | No built-in state management | No built-in state management | Issue tracker integration |
| Self-improving | Capture and file-findings loop | No | No | No |
| Enforcement | Hook-level guard, git locking, permissions | SessionStart hook | No | No |
| Subagent verification | Snapshot diffs | No | No | No |
| Global install | One symlinked clone | Per-project or global config | Plugin or CLI | Plugin or copied files |
| Cost optimization | Built-in (ASCII, merge, research levels, delegation) | No | No | No |
| Session audit | Transcript indexing and queries | No | No | No |
| Multi-agent support | Claude Code (expanding) | Claude Code, Codex, Cursor, Gemini CLI, others | 70+ agents via skills.sh | Claude Code |

Flow coexists with skill set plugins. The rules and the guard apply regardless of which skill is running, including a plugin's skills.

## Companion tools

**[util](https://github.com/Adrian333Dev/util)** is a command registry and CLI. You register command sources from any directory with `util source add`, and the commands become available under namespaces on `PATH`. `util fs tree` and `util fs merge` are the two used in every session. The registry supports adding more commands from any source, and `util install` links them all at once.

## What is next

The [backlog](backlog.md) tracks every open item. The next priorities:

1. **Splitting the global rules**: the always-loaded rules file only grows, and rules that fire in one situation belong in the skill that owns that situation
2. **Git worktrees**: parallel dispatch to subagents working in isolated copies of the repo
3. **End-to-end testing**: widening the two test suites past the unit tests they hold now
4. **The management skill**: installing, updating, migrating a project, converting the personalized files on re-install
5. **Multi-model portability**: the rules, the ticket system, and the phases are agent-agnostic. The hooks, permissions, and audit are tied to Claude Code. Naming that split is the first step

## Status

What works today: every rule, every skill, the CLI, the permission guard, the project scaffold, and two test suites.

What is unfinished: the user manual, the management skill, git worktree support, multi-agent portability, and the ASCII rendering engine.

Flow currently runs on Claude Code. The core workflow is designed to be portable.

## Documentation

- **[Developing Flow](docs/dev/README.md)**: how to change Flow. The repository layout, the two checkouts, the scratch session, the tests, and adding a skill.
- **[Backlog](backlog.md)**: every open item and the reasoning behind each.
