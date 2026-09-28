# Flow for teams: the vision, and where the discussion stopped

Flow is built for one developer. After V1, the user wants a version any software team can use, of any size and doing any kind of work. Raised by the user 2026-09-28, and deliberately left undesigned. `lab/backlog/after-v1.md` → `## Flow for teams` carries the item.

## Research comes first, through Flow's own skills

The design waits until Flow is installed, so the research runs through `/flow:groundwork` and `/flow:research`. It starts from how software teams work in 2026, and from what they want out of working with coding agents. Market research and user research both belong to it. A quick research pass before then was offered and turned down, since it would be out of date by the time the design starts.

## The vision as the user described it

- **Any team.** Corporations, SaaS teams, startups, a company made of many teams. Jira and GitHub's issues serve every size, and Flow's team version aims as wide. A size limit picked in advance, such as 2 to 8 developers, was proposed and rejected by the user: it is the same kind of limit as being solo.
- **The ticket system grows first.** Teams need more fields than Flow's tickets carry: assignees, a different priority system, and more. The current ticket shape may change completely.
- **Knowledge filing changes.** Many people, each with one machine or more, work on different tickets at once.
- **A secured web server**, private or public, with permissions, groups and roles.
- **Dashboards**, starting with a Kanban board where tickets are dragged between statuses and assigned.
- **The team is managed from the dashboard.** A lead sees who is working on which ticket, whether they are active, and their session's progress, without too much detail, and can look into the work.
- **Faster decisions.** The user's example: a developer blocked on a design decision today writes a report, finds the lead and holds a meeting. The user offered it as an example only, from a 2-person startup, and research decides whether the problem is real for most teams.
- **Free.** The web part, and maybe the whole ticket system, may become a product separate from Flow.
- **The goal**: a more trusted, more mature way for teams to use AI and coding agents.

## Tickets convert to a tracker's, set by the user 2026-09-28

Flow keeps its own ticket model, and a connector converts it to and from a tracker's. A tracker may lack a status such as `groundwork`, and most teams care mainly whether a ticket is done. The tracker research moved before the beta the same day, since the beta fixes the ticket shape: `lab/research/trackers.md`. How teams work, dashboards and live tracking stay after V1.

## Positions the agent argued, none settled

- **Connect to the tracker a team already uses, instead of building one.** A team on Jira will not move to GitHub Projects to adopt an agent workflow, and the reverse holds too. So Flow's ticket commands would read and write through one layer, with one connection per tracker. Files in `.flow/tickets/` stay for a solo developer. Larger files such as a plan stay in the repo, linked from the issue. What overturns it: the agent's parts of a ticket not fitting an issue plus linked files.
- **GitHub Projects covers most of the list.** Issues from several repositories as rows, a table, a Kanban board and a timeline, custom fields, filters and grouping, simple automations, charts, organization roles, and an API plus `gh project`. It lacks Jira's enforced workflows, strict dependencies and large-organization reporting.
- **Every major tracker can be read and written by a program.** Jira has a REST API covering issues, assignees, custom fields, workflow moves and search, plus webhooks and an official MCP server. Linear has a GraphQL API, webhooks and an MCP server. Asana, ClickUp, Monday, Notion, Trello, GitLab and Azure DevOps each have a REST API. The hard part is that each models work differently: a Jira workflow can force the order of statuses, custom fields differ per project, and each has its own sign-in. The shape argued for: one shared model of what every tracker has (title, body, status, assignee, priority, links), one small connector per tracker, and everything else kept in repo files. `flow` commands call the APIs, and an agent mid-task may use the tracker's MCP server.
- **Project knowledge already travels.** `docs/context/` and the committed `.flow/` reach every person and machine through git. 2 people editing one ticket file and hitting a merge conflict is the real case for a shared server. `~/.flow/` stays personal.
- **Watching each person's session live costs adoption.** The people watched decide whether a tool gets used, and seeing that someone is online never shortens a decision.
- **Free means self-hosted open source.** A free hosted server means paying for servers and answering for its security indefinitely.
