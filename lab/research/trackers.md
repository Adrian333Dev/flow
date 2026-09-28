# How issue trackers model a ticket, and what Flow's tickets convert to

A research report, started 2026-09-28. Only the brief exists so far. The research runs next session, and the report replaces `## Status` below once written.

## Why now

The beta fixes the ticket shape: Delapse migrates, and 2 to 3 weeks of real tickets get written. Changing the shape after that means converting real tickets through `flow up`. The `scripts/` cleanup rewrites the ticket code before the beta, so the model settles first. `lab/context/teams.md` holds the team vision this serves.

## The framing, set by the user 2026-09-28

**Conversion, never full compatibility.** Flow keeps its own ticket model, and a connector converts it to and from a tracker's. A tracker may have no `groundwork` or `planning` status, and most teams care mainly whether a ticket is done. So Flow's 8 statuses map onto a tracker's few: `groundwork`, `planning` and `building` might all read as "In Progress" there. The research finds what converts cleanly, what is lost in each direction, and what Flow should add, remove or rename so the loss stays small.

## Questions

1. **Fields**: title, body, assignee, priority scale, estimate, labels, due dates, custom fields.
2. **Statuses**: a fixed list, a list the team defines, or a workflow forcing an order. What categories sit under the names (Linear's backlog, unstarted, started, completed, canceled; Jira's to do, in progress, done).
3. **Structure**: epics, sub-tasks, parent and child, and links such as blocks, blocked by, duplicates, relates to.
4. **Types**: bug, feature, task, and whether a team defines its own.
5. **Programmatic access**: the API, webhooks, sign-in, rate limits, and an official MCP server.
6. **Two-way sync**: how existing sync tools (Unito, Exalate, and each tracker's own importers) convert between trackers, and what they give up. They have solved the conversion problem already.
7. **Coding agents inside trackers**: how agents already take work from a tracker today. GitHub's coding agent assigned to an issue, Linear's agents, Jira with Atlassian's own agents, and any other found. What status and fields each reads and writes.

## Trackers

GitHub Issues and Projects, Jira, Linear, GitLab, Azure DevOps, Asana, ClickUp, Shortcut. Public documentation first, fetched with `WebFetch`.

## Flow's model today

`docs/manual/tickets.md` holds it whole: `id`, `title`, 8 statuses (`todo`, `groundwork`, `planning`, `building`, `review`, `done`, `parked`, `dropped`), 5 types (`feature`, `chore`, `issue`, `topic`, `prototype`), `priority` as `high` or `low` with normal absent, one `parent`, a `deps` list, `reason`, `resume`, `closed`, `filed`, a body with `## Done when`, `## References` and `## State`, and a folder holding the plan and the groundwork.

## What the report ends in

- A comparison: one section per question, each tracker's answer in it.
- A proposed conversion per field: Flow's field, what it becomes in each tracker, what is lost.
- A proposed list of changes to Flow's model, each with its argument. The user approves these separately, before any change to the ticket system.

## Status

Brief only. Nothing researched yet.
