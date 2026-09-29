# Where tickets live, and the commands around them

Decided with the user on 2026-09-29, during pass 1 of the final sweep. Nothing below is built yet. `lab/backlog/before-beta.md` holds the item.

## Why it changes

A project's `.flow/` is committed with the code today, so every branch carries its own copy of the tickets. 2 branches invent the same ticket number, and a ticket moved on one branch keeps its old status on the other. Flow therefore supported one branch at a time. Global tickets, in `~/.flow/tickets/`, share the `t` numbers with every project, and nothing could reach them from inside one.

## Ticket ids: a short word and a number

- **Each place picks a short word when it is set up**: `exp` for an expense app, so its tickets are `exp-1`, `exp-2`. The pattern is Backlog.md's `BACK-368` (`lab/research/ticket-tools.md`), and Linear's and Jira's.
- **Global tickets use `home`**: `home-4`. They live under the home folder and belong to no project.
- **A bare number means the current project's ticket**: `12` inside the expense app is `exp-12`.
- **The word says where a ticket lives**, so 2 places never produce the same id. A letter per place, `g4`, was rejected: `t` reads as ticket and `g` does not.

## Moving a ticket: `flow move`

- **`flow move exp-12 home`** moves the folder, and the ticket takes the next free number in its new place: `home-5`.
- **The ticket keeps `was: exp-12`**, so the old id still finds it.
- **A ticket with dependencies or child tickets is refused** unless they all move together.

## Project records live on a `flow` branch

- **A branch named `flow` in the project's own repository** holds `.flow/`: tickets, groundwork maps, the inbox, findings. It shares no history with the code: git calls it an orphan branch.
- **Each clone checks the `flow` branch out once, as a worktree at `<repo>/.flow`**, shared by every code branch. Only files describing the code stay on the code branches: `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `docs/`.
- **Anyone who can read the project gets its tickets**, and nothing else of the owner's. `~/.flow/` was rejected as the home for project records: it is one person's private repository, so a project shared with a teammate or a team could never live there.
- **Global tickets stay in `~/.flow/`.**
- **The risk is merging.** Beads ran a sync branch and deleted it (commit `ff7244b61`, 5,720 lines of worktree management and repair), because every issue sat in one file and any 2 edits could conflict. Flow keeps one folder per ticket, so 2 people conflict only on the same ticket.

## Trying Flow on a team's repository

Before a team adopts Flow, `.flow/` is a plain folder listed in `.git/info/exclude`, git's ignore list for one clone, never committed. No `flow` branch. It holds only the user's own tickets, so nothing needs sharing. It gives up 2 things: no copy outside the clone, and each worktree has its own `.flow/`. Flow finds `.flow/` at the same path in both modes.

## Sync at checkpoints

- **Commit** the `flow` branch at each checkpoint. A commit takes the whole folder, so the user's hand edits ride along with the agent's.
- **Push** at a status move, at `/flow:handoff`, and at the end of a session. GitHub limits apply to pushes only, and this is a few dozen a day.
- **Pull** at session start, and right before a new ticket takes its number.
- **`flow sync`** stays, for a push by hand.

## A new ticket is pushed at once

`flow new` pulls, takes the next number, commits and pushes. A refused push means someone pushed first: it pulls and starts again, within a second or two. The agent shows the id only after the push lands, so nobody sees a number change. Offline, the ticket takes its number locally and is renumbered at the next push if the number was taken meanwhile. A trial with no remote never clashes.

## What a ticket records about its sessions

- **The branch**, written when work starts. `/flow:start` warns when the current branch differs.
- **Every session id**, with its title, written by a hook into the ticket's history at each status move and handoff. The id never changes; a `/rename` sets the title only, and `claude --resume` takes either. A transcript exists only on the machine that ran it and is deleted after 365 days (`cleanupPeriodDays`). Nothing here loads at session start.

## The setup commands: 7 verbs

- **`flow install`**: puts Flow on this machine, the setup session included.
- **`flow init`**: sets up this project.
- **`flow update`**: pulls Flow, then migrates this machine and this project where either is behind. Today's `flow up`.
- **`flow sync`**: copies `~/.flow/` between machines.
- **`flow doctor`**: checks the machine.
- **`flow restore`**: puts this project or this machine back as before Flow.
- **`flow uninstall`**: removes Flow.

`flow setup project` goes into `flow init`. `migrate` was rejected as a command name: `flow update` and the machine setup already migrate.

## What `flow init` checks

The test is whether anything competes with Flow's rules, never whether the folder is empty. Code, a `README` and a `package.json` change nothing. Each state is checked on its own:

- **No git repository** → `git init`. Never in an existing one.
- **Typed in a subfolder of a repository** → works at the top folder, and says so.
- **Already a Flow project** → says so and stops.
- **A run that stopped part way** → carries on from where it stopped.
- **No competing files** → writes the template at once, with no session.
- **Competing files present** (`CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/skills/`, Claude Code's memory for the folder, other tools' rule files) → the setup session opens, for those files only.
- **An existing `.gitignore`** → Flow's lines are added, and nothing is replaced.
- **No `flow` branch** → creates it.

## Open when the build starts

Each of these is a decision the build meets, and none is settled:

- How a second worktree, in another folder, reaches the `<repo>/.flow` checkout.
- Where a project's word is stored, and what it defaults to.
- What happens to a project whose `.flow/` is already committed on its code branches.
- Whether `~/.flow/` itself commits and pushes at the same checkpoints.
- Which hook runs the push at the end of a session, and what it does offline.
- Whether `.flow/settings.json`, ignored today, is committed on the `flow` branch.
- How a new worktree gets the skill links in `.claude/skills/`, which are ignored and so missing from it. `skills.md` → `### Branches` walks both.
