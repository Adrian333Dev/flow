# How issue trackers model a ticket, and what Flow's tickets convert to

A research report, written 2026-09-28 from each tracker's public documentation. The proposed changes at the end wait for the user's approval, and nothing in the ticket system changes before it.

## Why now

The beta fixes the ticket shape: Delapse migrates, and 2 to 3 weeks of real tickets get written. Changing the shape after that means converting real tickets through `flow up`. The `scripts/` cleanup rewrites the ticket code before the beta, so the model settles first. `lab/context/teams.md` holds the team vision this serves.

## The framing, set by the user 2026-09-28

**Conversion, never full compatibility.** Flow keeps its own ticket model, and a connector converts it to and from a tracker's. A tracker may have no `groundwork` or `planning` status, and most teams care mainly whether a ticket is done. The research finds what converts cleanly, what is lost in each direction, and what Flow should add, remove or rename so the loss stays small.

## Flow's model today

`docs/manual/tickets.md` holds it whole: `id`, `title`, 8 statuses (`todo`, `groundwork`, `planning`, `building`, `review`, `done`, `parked`, `dropped`), 5 types (`feature`, `chore`, `issue`, `topic`, `prototype`), `priority` as `high` or `low` with normal absent, one `parent`, a `deps` list, `reason`, `resume`, `closed`, `filed`, a body with `## Done when`, `## References` and `## State`, and a folder holding the plan and the groundwork.

## What decides the proposals

**Adding an optional field later costs nothing, while renaming or removing one costs a migration.** A ticket written without `assignee` stays valid once `assignee` exists. A ticket carrying `type: issue` has to be rewritten if the type is renamed. So before the beta, only renames, removals and meanings are worth deciding. Every field a team needs and a solo developer does not waits for the team version.

## Statuses: every tracker sorts its statuses into about 4 fixed groups

Team-defined status names sit on top of a small fixed set of groups, and reports, boards and automations read the group. The groups are the part a connector can rely on.

- **Linear**: 6 fixed groups in a fixed order: backlog, unstarted, started, completed, canceled, and duplicate, which Linear manages itself. Triage is an optional inbox group. Teams name and order the statuses inside each group.
- **Jira**: 3 fixed groups, To Do, In Progress and Done, whose names cannot be changed. A workflow per project defines the statuses and which moves are allowed. A finished item also carries a resolution: Done, Won't do, Duplicate, Cannot reproduce.
- **GitHub Issues**: open or closed, with a closing reason of completed, not planned or duplicate. A GitHub Project adds a Status field of up to 50 team-defined options, `Todo`, `In Progress` and `Done` by default.
- **GitLab**: 5 groups (triage, to do, in progress, done, canceled), with custom statuses on paid tiers, up to 30 per lifecycle. Done and canceled close the item.
- **Azure DevOps**: 5 groups (proposed, in progress, resolved, completed, removed). Resolved means built and not yet verified. Each work item type has one completed state.
- **ClickUp**: 4 groups (not started, active, done, closed). Done clears dependencies. Closed statuses can be renamed but never added.
- **Shortcut**: 3 state types (unstarted, started, done). Team-defined workflow states sit under them.
- **Asana**: a task is completed or not. Progress lives in board sections or a custom field.

**Flow's statuses convert through the groups:**

- `todo` → unstarted (Jira To Do, Linear unstarted, GitHub open).
- `groundwork`, `planning`, `building` → started. In Linear, Jira, GitLab, ClickUp, Shortcut and a GitHub Project, a team can create statuses with those names inside the started group, and nothing is lost.
- `review` → started, or Azure's resolved, the one group meaning built and not yet verified.
- `done` → completed (GitHub closed as completed, Jira resolution Done).
- `dropped` → canceled (GitHub closed as not planned, Jira resolution Won't do). `reason` becomes a comment.
- `parked` → no tracker has one. The nearest is backlog (Linear) or To Do (Jira), plus a label. `reason` becomes a comment, and `resume` stays in Flow's copy alone.

**Lost coming back:** a tracker status Flow never defined, such as Jira's Blocked or QA, arrives as its group alone. Started converts to `building` unless the name matches a Flow status.

**One rule differs.** In Flow, a dependency counts as met at `review`. In every tracker, a blocker clears only when the blocking item completes. Linear turns a resolved block into a plain "related" link, and ClickUp clears dependencies at done. A Flow ticket unblocked at review still reads as blocked in the tracker.

## Fields

- **Title and body** exist everywhere. The body is markdown in GitHub, GitLab and Linear. Jira's API takes its own document format, so headings and fenced blocks such as `open` convert and may lose shape.
- **Assignee** exists everywhere, and Flow has none. Linear and Jira both let an agent work an item while the human stays the assignee.
- **Priority** scales: Linear has 5 (none, low, medium, high, urgent), and so does Jira (lowest to highest). ClickUp has 4 (low, normal, high, urgent) and Beads 4 (P0 to P3). GitHub has none built in, and a Project adds it as a custom field. Flow's 3 levels convert out with no loss: `high` → high, absent → medium or none, `low` → low. Coming back, urgent and highest fold into `high`.
- **Labels, estimates, due dates and custom fields** exist in most trackers, and Flow has none of them. Each can be added later as an optional field.
- **`closed`** maps to the tracker's completed date. **`filed`** and **`resume`** have no counterpart and stay in Flow's copy.

## Types: Flow's `issue` means something else in 5 trackers

- **Built-in types**: GitHub has task, bug and feature by default, up to 25 per organization. Jira has epic, story, task, bug and subtask. Azure DevOps has epic, feature, user story, task and bug. Shortcut has feature, bug and chore, which are exactly 3 of Flow's 5. Beads has task, bug and epic.
- **No types**: Linear and Asana. Labels play the part.
- **"Issue" is the tracker's word for any ticket** in GitHub, GitLab, Linear and Jira, which renamed it "work item" only recently. Flow's `issue` means a problem to find and fix.
- **Conversion:** `feature` → feature or story, `chore` → task or chore, `issue` → bug. `topic` and `prototype` have no counterpart anywhere, and become a task with a label.
- **`issue` stays, set by the user 2026-09-28.** Not every problem is a bug: a slow page or a runaway bill is an `issue` too. `bug` would force renaming the other types to match, and `fix` names no problem at all, so it reads strangest to a team.

## Structure: parents and blocking links are universal, and Jira restricts the tree

- **Parent and child** exist everywhere. GitHub allows 8 levels and 100 children per parent, across repositories. Linear allows nesting, and can close a parent once its children are done. Jira fixes the tree by type: epic above story, task and bug, subtask below them, and a subtask can have no children. Azure DevOps also fixes the tree by type.
- **Flow's single `parent` converts everywhere except Jira**, where a child's type is dictated by the level. A Flow feature parented under another feature has no place in Jira's default tree.
- **Blocks and blocked by** exist in GitHub, Linear, Jira, Asana, ClickUp, Shortcut and Beads. Flow's `deps` converts to "blocked by" with no loss.
- **Almost no tracker enforces a dependency.** GitHub marks a blocked issue with an icon, and Linear with a flag. ClickUp warns on closing a task still waiting on another, and only with its Dependency Warning setting on. Jira can natively refuse a transition only on the state of sub-tasks; refusing on a "blocked by" link takes a paid add-on (ScriptRunner, Jira Workflow Toolbox) or an automation that moves the item back. So a custom field adds nothing, since every tracker already stores the link natively. Flow's refusals stay in `flow`, run before a write reaches the tracker. A card dragged on the tracker's board skips them, and the next sync can only report it.
- **Related and duplicate** exist in most trackers, and Flow has neither. A duplicate in Flow is a drop whose reason names the other ticket, and it converts to canceled with the link lost.
- **Above the ticket:** Linear's projects and initiatives, Jira's epics, Shortcut's epics and iterations. Jira epics sync as Linear projects in Linear's own sync. Flow has no level above a parent ticket.

## Programmatic access: every tracker has one

Every tracker above has an API and webhooks. Linear's API is GraphQL, and the rest are REST. Linear, Atlassian, GitHub, Asana, ClickUp and Plane ship an official MCP server. Rate limits and sign-in were not checked, and belong to building the first connector.

## Two-way sync: the sync tools already show what gets lost

- **Linear's own Jira sync** carries title, description, assignee, creator, priority, status, labels and due date, and turns Jira epics into Linear projects. It drops custom fields, sub-tasks and issue types, and turns Jira components into labels. A Jira status Linear lacks leaves the Linear status unchanged. A Jira workflow demanding required fields blocks the synced item from being created.
- **Unito and similar tools** map each field separately, and set a direction per field: one field both ways, another one way only. Status goes through a table the team fills in, such as "Dev" in one tool equals "To Do" in the other.
- **Status syncing both ways loops**, one tool's automation undoing the other's, so sync tools recommend one side owning status.
- **The lesson for a Flow connector:** each field needs one owner. The tracker owns what the team sees and edits: title, assignee, priority, the status group. Flow owns what only the agent uses: the phase inside started, the plan, the groundwork, `## State`.

## Coding agents inside trackers read the title and the description, and nothing else

- **GitHub Agent HQ**, public preview since February 2026 on Copilot Pro+ and Enterprise: an issue is assigned to Copilot, Claude or Codex from the Assignees menu, or to all 3. The agent opens a draft pull request, and one issue can go to several agents at once.
- **Linear**: assigning an issue to an agent delegates it, and the human stays the assignee. Linear tells an agent to move the issue into the first started status when it begins. The agent reports through a session made of thoughts, actions, questions to the user, a final response and errors. The session's states are pending, active, awaiting input, error, complete and stale. Team guidance written in Linear tells the agent which repository and conventions to use.
- **Jira**: an agent is assigned from a picker, mentioned in a comment, or started by a status move, so moving an item into a chosen status runs the agent. It reads the summary and description, and may read comments and attachments. Its output is private to whoever started it. The Jira coding agent (Rovo Dev) runs in a cloud sandbox and opens a pull request. "Open in coding tool" hands the work item to Claude Code, Cursor, Copilot, Codex or VS Code with the summary and description as the first prompt.
- **What none of them carries:** a plan reviewed before code, design decisions, or state handed from one session to the next. Each agent starts from the title and description. Flow's folder is what Flow adds on top of a tracker.

## Proposed changes to Flow's model

The user approved these 2026-09-28. Proposal 2 was withdrawn the same day: the user's 2 modes (`lab/context/teams.md` → `2 modes`) never write Flow's status into a tracker, and the column costs nothing to add later. Proposal 1 was built the same day, in `scripts/flow/lib/frontmatter.js`. Proposal 3 is a rule the `scripts/` cleanup in `lab/backlog/before-beta.md` keeps.

1. **Keep every frontmatter field on write.** `frontmatter.serialize()` writes only the keys in `TICKET_KEYS` (`scripts/flow/lib/store.js:228`), so a field Flow does not know is erased on the next move. A teammate on an older Flow would erase an `assignee` a newer one wrote. Write the known keys in order, then every other key after them.
2. **Withdrawn.** **Add a `group` column to the status table** in `scripts/flow/lib/statuses.js`: `todo` not started; `groundwork`, `planning`, `building` and `review` started; `done` completed; `dropped` canceled; `parked` not started with a label. A connector then converts the group, and a team with matching statuses keeps the full name. Plus one paragraph in `docs/manual/tickets.md`.
3. **Keep id parsing inside `store.js`.** Today the `t` plus number shape is read in `store.js` alone (lines 88, 95, 147, 221, 391). The cleanup keeps it there, and treats an id as an opaque string everywhere else, so a tracker's `ENG-123` can name a mode 2 folder later.
4. **Keep a dependency met at `review`**, and accept that a tracker shows it blocked until done. Changing Flow to match would stall a solo developer's next ticket behind their own review.
5. **Keep sequential ids for the beta.** `t047` is the highest id plus 1, so 2 people or 2 branches creating a ticket at once get the same id. A team version takes the tracker's id, which one server hands out, and a ticket keeps a temporary local id until its first sync, the way CCPM renames `001` to the GitHub issue number. Long random ids are ruled out by the user: unusable from a command line.
6. **Add no field yet.** Assignee, labels, estimate, due date, related links and a level above a parent are all optional additions, cheap once proposal 1 holds.

`ticket-tools.md` compares Backlog.md, Beads, CCPM and Vibe Kanban against Flow's tickets.

## Sources

- Linear: [workflows](https://linear.app/docs/configuring-workflows), [relations](https://linear.app/docs/issue-relations), [sub-issues](https://linear.app/docs/parent-and-sub-issues), [priority](https://linear.app/docs/priority), [Jira sync](https://linear.app/docs/jira), [agents](https://linear.app/docs/agents-in-linear), [agent sessions](https://linear.app/developers/agent-interaction), [agent guidance](https://linear.app/developers/agent-best-practices)
- Jira: [statuses, priorities, resolutions](https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-statuses-priorities-and-resolutions/), [work type hierarchy](https://support.atlassian.com/jira-cloud-administration/docs/configure-the-issue-type-hierarchy/), [agents on work items](https://support.atlassian.com/jira-software-cloud/docs/collaborate-on-work-items-with-ai-agents/), [Jira coding agent](https://support.atlassian.com/rovo/docs/work-with-rovo-dev-in-jira/), [open in coding tool](https://jirareleases.atlassian.com/announcements/launch-your-ai-coding-agent-straight-from-jira)
- GitHub: [issue types](https://docs.github.com/en/issues/tracking-your-work-with-issues/configuring-issues/managing-issue-types-in-an-organization), [sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues), [dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies), [issue state](https://docs.github.com/en/rest/issues/issues), [single select fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-single-select-fields), [Claude and Codex on GitHub](https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/)
- GitLab: [work item status](https://docs.gitlab.com/user/work_items/status/)
- Azure DevOps: [state categories](https://learn.microsoft.com/en-us/azure/devops/boards/work-items/workflow-and-state-categories)
- ClickUp: [statuses](https://help.clickup.com/hc/en-us/articles/6309452618647-Manage-task-statuses), [priorities](https://help.clickup.com/hc/en-us/articles/6304483666199-Set-task-Priorities)
- Shortcut: [REST API](https://developer.shortcut.com/api/rest/v3)
- Asana: [dependencies](https://help.asana.com/hc/en-us/articles/14078761989531-Task-dependencies), [subtasks](https://help.asana.com/s/article/subtasks?language=en_US)
- Sync: [Unito for Jira and Linear](https://unito.io/integrations/jira-linear/)
- Beads: [repository](https://github.com/steveyegge/beads)
- Dependency enforcement: [Jira, blocking on linked issues](https://community.atlassian.com/t5/Jira-questions/Blocking-Workflow-Transition-To-Done-if-Linked-Issues-quot-Is/qaq-p/711502), [ClickUp dependencies](https://help.clickup.com/hc/en-us/articles/6309943321751-Task-Dependencies)
