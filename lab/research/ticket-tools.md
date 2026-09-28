# Tools that already join tickets and coding agents

A comparison written 2026-09-28, from the 4 clones in `repos/` and each tracker's public documentation. It serves the tracker research in `trackers.md` and the team vision in `lab/context/teams.md`. None of the tools was run.

## The 4 tools as of 2026-09-28

- **Backlog.md** (`repos/Backlog.md`): 1,391 commits, last one 2026-09-27. A Bun app installed from npm.
- **Beads** (`repos/beads`): 10,936 commits, last one 2026-09-28. A Go binary.
- **CCPM** (`repos/ccpm`): 87 commits, last one 2026-03-18. An agent skill plus bash scripts.
- **Vibe Kanban** (`repos/vibe-kanban`): 2,080 commits, last one 2026-09-19. A Rust and web app. The company behind it shut down in April 2026. The code stays open source and the community keeps committing, with the hosted features removed.

## Backlog.md: Flow's closest match

One markdown file per task in the repo, fields in frontmatter, and a CLI that owns them. Agents are told never to edit a task file by hand. A real task from its own repo:

```yaml
id: BACK-368
title: 'TUI: Add section-aware navigation for task popup and detail pane'
status: To Do
assignee: ['@codex']
labels: [tui, ux, enhancement]
dependencies: []
documentation: [src/ui/board.ts, src/ui/sequences.ts]
priority: medium
```

The body holds Description, numbered Acceptance Criteria, Definition of Done, Implementation Plan, Implementation Notes and Final Summary. Statuses are set per project, `To Do`, `In Progress` and `Done` by default. Subtasks take decimal ids, `BACK-4.1`. Canceled work is archived, and finished work moves to `completed/`. `decisions/` and `docs/` sit beside `tasks/`.

- **Its lifecycle**: 3 review points. The user reviews the task split, then the plan the agent writes into the task, then the code. One task is one session and one pull request.
- **What it has that Flow lacks**: a board in the terminal (`backlog board`) and a drag-and-drop board in the browser (`backlog browser`). Acceptance criteria checked one by one, with evidence, at the end. A project-wide Definition of Done list added to every task, such as "tsc passes". Assignee, labels, milestones, search, and versioned JSON output. An `onStatusChange` shell hook, which can start an agent.
- **What Flow has that it lacks**: design decisions walked before the plan, a folder per ticket, `## State` for resuming, refused moves, park and resume, typed lifecycles.
- **Ids**: counted up. Before assigning one, it reads the tasks on every branch active in the last 30 days, and it ships a repair command for duplicates that slip through.
- **Trackers**: no connection to any.

## Beads: a database built for agents

Tickets live in Dolt, a SQL database versioned like git, synced through the git remote. `.beads/issues.jsonl` is an export, never the source.

- **Ids**: random and short, with a prefix, `bd-a3f8`, 3 to 8 characters. A child adds a number: `bd-a3f8.1`.
- **Statuses**: open, in_progress, blocked, deferred (put on ice), closed, pinned.
- **Types**: bug, feature, task, epic, chore, decision.
- **Fields**: design, acceptance criteria, notes, priority 0 to 4, assignee, owner, estimate, due date, a date to hide it until, close reason, the Claude session that closed it, an external reference such as `jira-ABC`.
- **Claims**: `bd update <id> --claim` sets the assignee and in_progress in one step. The claim is a lease with a heartbeat, so a dead agent's claim expires.
- **Tracker sync**: two ways with Linear, Jira, GitHub, GitLab and Azure DevOps. Each mapping is a setting the team can change. Linear's defaults:

  ```
  linear.state_map.backlog    open
  linear.state_map.started    in_progress
  linear.state_map.completed  closed
  linear.state_map.canceled   closed
  linear.priority_map.1       0    # Urgent -> Critical
  linear.label_type_map.bug   bug
  ```

- **Costs**: a binary to install, database migrations that one designated clone must run, and sprawl: messaging, swarms, "molecules", "wisps".
- **What it confirms in Flow**: `deferred` is Flow's `parked`, and `decision` is Flow's `topic`.

## CCPM: a skill that stores work in GitHub Issues

A product spec becomes an epic, the epic becomes numbered task files in `.claude/epics/<name>/001.md`, and a sync pushes them to GitHub as an epic issue with sub-issues. Progress goes back as issue comments.

- **Task fields**: name, status, created, updated, the GitHub link, `depends_on`, `parallel`, `conflicts_with` (tasks touching the same files), an effort size.
- **Ids**: `001`, `002` locally. After the sync, each file is renamed to its GitHub issue number and every `depends_on` is rewritten.
- **Parallel work**: one issue is split into streams, and one agent runs per stream.
- **Costs**: GitHub only. The design step is a short brainstorm. Sub-issues need a `gh` extension.

## Vibe Kanban: the board that starts the agent

A kanban board where each issue opens a workspace: a branch, a terminal, a dev server and one of 10+ agents. The user reviews the diff with inline comments that go back to the agent, then opens a pull request. Statuses: Todo, In Progress, In Review, Done, Cancelled. Priority: urgent, high, medium, low. The issue's description is the agent's prompt, and there is no design or plan step.

## Trackers that took agents in

`trackers.md` → `## Coding agents inside trackers` holds the detail. GitHub Agent HQ assigns an issue to Copilot, Claude or Codex. Linear and Jira delegate a ticket to an agent while a human stays the owner. Plane is an open-source tracker a team hosts itself, where an agent is assigned like a teammate.

## What Flow takes from them

- **Nothing runs underneath.** Backlog.md under Flow would mean 2 ticket models: its statuses are set per project while Flow's are fixed and enforced, and it keeps the plan inside the task file while Flow's ticket is a folder. It would also leave the tracker conversion unsolved.
- **Worth borrowing**: Backlog.md's board, its acceptance criteria checked with evidence, and its project-wide Definition of Done. Beads' mapping settings, as the shape of a Flow connector, and its claim with a lease, for "who is working on what". CCPM's temporary id that becomes the tracker's id on sync.
- **What none of them does**: walk design decisions before the plan, file what the work taught back into the rules, or carry a session's state into the next one.
- **Worth testing in the sweep's simplify pass**: each of them runs on 3 to 6 statuses, and Flow on 8. Flow already treats the folder as the evidence, so `groundwork`, `planning` and `building` might become one status with the phase read off the folder.
