# Where tickets live, and the commands around them

Decided with the user on 2026-09-29, during pass 1 of the final sweep, and built the same day. A second round the same evening renamed `--trial` to `--local`, made `flow new` refuse offline, built what a ticket records about its sessions, and moved the phase skills' first line into `flow load`.

## Why it changed

A project's `.flow/` used to be committed with the code, so every branch carried its own copy of the tickets. 2 branches invented the same ticket number, and a ticket moved on one branch kept its old status on the other. Flow therefore supported one branch at a time. Global tickets, in `~/.flow/tickets/`, shared the `t` numbers with every project, and nothing could reach them from inside one.

## Ticket ids: a short word and a number

- **Each place picks a short word when it is set up**: `exp` for an expense app, so its tickets are `exp-1`, `exp-2`. The pattern is Backlog.md's `BACK-368` (`lab/research/ticket-tools.md`), and Linear's and Jira's.
- **The word is `ticketPrefix` in the project's `.flow/settings.json`**, 2 to 8 lowercase letters, never `home`. `flow init` asks once and offers the first 3 letters of the folder name. `--prefix` answers it.
- **Global tickets use `home`**: `home-4`. They live in `~/.flow/tickets/` and belong to no project. A `home-` id works from anywhere.
- **A bare number means the current place's ticket**: `12` inside the expense app is `exp-12`.
- **The word says where a ticket lives**, so 2 places never produce the same id. A letter per place, `g4`, was rejected: `t` reads as ticket and `g` does not.

## Moving a ticket: `flow move`

- **`flow move exp-12 home`** moves the folder whole, ignored files included, and the ticket takes the next free number in its new place: `home-5`. The target is `home` or another project's folder.
- **The ticket keeps `was: exp-12`**, so the old id still finds it. From inside the project it left, an id missing there is looked for among home tickets' `was:`. A ticket left behind that was renumbered from the same id wins. The hint `flow move` prints about the old id is then left out.
- **A link to a ticket staying behind refuses the move.** Linked tickets moved together get their links rewritten.

## Project records live on a `flow` branch

- **A branch named `flow` in the project's own repository** holds `.flow/`: tickets, groundwork maps, the inbox, findings, `settings.json` and `version`. It shares no history with the code: git calls it an orphan branch.
- **Each clone checks the `flow` branch out once, at `<repo>/.flow`**, with `git worktree`, shared by every code branch. Every code branch ignores `.flow/` through `.gitignore`. Only files describing the code stay on the code branches: `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `docs/`.
- **Anyone who can read the project gets its tickets**, and nothing else of the owner's. `~/.flow/` was rejected as the home for project records: it is one person's private repository, so a project shared with a teammate or a team could never live there.
- **Global tickets stay in `~/.flow/`**, which commits and pushes at the same checkpoints.
- **The risk is merging.** Beads ran a sync branch and deleted it (commit `ff7244b61`, 5,720 lines of worktree management and repair), because every issue sat in one file and any 2 edits could conflict. Flow keeps one folder per ticket, so 2 people conflict only on the same ticket. A pull that meets the same lines of one ticket changed on both sides is put back, and the local version stays committed for a merge by hand.
- **Git worktrees for code stay off.** Flow's settings deny an agent making one, and the user never makes one by hand, so no second checkout of the code needs to reach `.flow/`. 2 tickets at once in 2 sessions is the case that would bring them back, parked in `lab/backlog/after-v1.md`.
- **No project has `.flow/` committed with its code**, so nothing migrates to the branch.

## A repository other people keep: `--local`

`flow init --local`: `.flow/` is a plain folder listed in `.git/info/exclude`, git's ignore list for one clone. No `flow` branch, no rule file, no `.gitignore` line, no session. It holds only the user's own tickets, and gives up any copy outside the clone. Flow finds `.flow/` at the same path in both modes.

- **Named `--local`, not `--trial`**, since a project can stay in the mode for good: a client's repository, while the user's own projects take the full setup. `--local` over `--private`: the tickets reach neither the team nor the user's own other machines, and "private" says only the first. `settings.local.json` already uses the word for "never leaves this machine".
- **`.git/info/exclude` over a `.gitignore` line**, settled with the user: a `.gitignore` line is a change to a committed file, left either committed into someone else's repository or showing in every `git status`. The exclude file ignores `.flow/` the same way and is never committed.
- Turning a local project into a team project is not built.

## Sync at checkpoints

- **Commit** at every command that writes a ticket. A commit takes the whole folder, so the user's hand edits ride along with the agent's.
- **Push** at a status move or a drop, in the background; at once for a new ticket; after a reply once 30 minutes have passed and something changed (the `Stop` hook, `async`); and at session end (the `SessionEnd` hook, whose 1.5 seconds only start a detached run). The user asked for more than session end: every half hour at most.
- **Pull** at session start, in the background, and right before a new ticket takes its number.
- **Offline**, a push skips quietly and the next checkpoint tries again, except for a new ticket, below. Any other failure goes to the failure log.
- **`flow sync`** stays, for a push by hand. Typed inside a project it syncs the project's branch too, even when `~/.flow/` refuses.
- **`scripts/records-sync.js`** runs every checkpoint nobody typed. `~/.flow/records-sync.json` holds when each place last sent, and never travels.

## A new ticket is pushed at once, or not made

`flow new` pulls, takes the next number, commits and pushes. A refused push means someone pushed first: it pulls, renumbers and tries again, up to 5 times, writing no `was:`, since nobody saw the first number. The id shows only after the push lands, so nobody sees a number change.

**Offline, no ticket is made**, decided with the user the same evening. A failed pull refuses before anything is written. A push that never lands takes the ticket back: its folder goes, a `--from-groundwork` folder returns where it was, and the removal is committed. The message: `no ticket was made: the remote could not be reached.` A ticket renumbered after it was shown leaves its old id wherever it was already written, a plan, a commit message, a conversation, which is the argument. Claude Code needs the network anyway. A project with no remote, and a local one, give numbers out on the spot.

**`~/.flow/` still renumbers with `was:`.** Its tickets are sent every 30 minutes, not when made, so 2 machines can give out one `home-` number between syncs. `flow sync` renumbers the later one and prints `home-4 is now home-5: another machine took home-4 first.`

## Prototypes live in their ticket

- **`.flow/tickets/<id>/protos/<name>/`**, one folder per prototype, plural since a ticket can hold several. The root `protos/` folder is gone: in a local project it would have sat in the other people's repository.
- **No ticket, inside a project** → `flow new "<question>" --type prototype` first. **Outside a project** → the folder the user names.
- **`.flow/.gitignore` on the branch** keeps `node_modules/` out, and a prototype adds lines for model caches and generated media. `flow move` and a plain `mv` both carry the ignored files, since they move the folder whole.

## What a ticket records about its sessions

Decided by the user and built on 2026-09-29. Tickets left the code branches, so nothing else says which code branch a ticket's work is on, or which sessions worked on it.

- **`branch:`** in the frontmatter: the code branch checked out when the ticket first reaches `building` or `review`, written once. `flow <id>` prints `branch: feature/budgets   (checked out here: main)` where they differ, and `/flow:start` stops on that line and tells the user before routing.
- **`history.md`** in the ticket folder, one line per status move and per `flow handoff <id>`, which `/flow:handoff` runs after writing `## State`: `2026-09-29 14:02  todo → building  <session id>  "<title>"  feature/budgets`. In the folder rather than in commit messages, so it travels with `flow move` and exists in a local project, which commits nothing.
- **The session id is `CLAUDE_CODE_SESSION_ID`**, which Claude Code sets for every command it runs, so no hook is needed. A command typed outside a session writes `-`.
- **The title** is read from the transcript under `~/.claude/projects/`: the last `customTitle` (a `/rename`), else the last `aiTitle`. A transcript exists only on the machine that ran it and is deleted after 365 days (`cleanupPeriodDays`).
- **`scripts/flow/lib/ticket-history.js`** holds it. A failed history write never undoes the move.

## The phase skills' first line: `flow load`

Each phase skill opened with `` !`[[ "$0" =~ ^([a-zA-Z]{2,8}-)?[0-9]+(-|$) ]] && flow get "$0" --files 2>&1 || true` ``, which the user could not read. It is now `` !`flow load "$0"` ``: the ticket and its open files where the first word is shaped like an id, nothing for any other word, a refusal printed as text with exit 0. The id pattern lives once, as `store.ID_SHAPE`, which `check-ticket.js` shares. `docs/dev/skills.md` → `## A shell line in the body` holds the rule: a shell line runs one named command.

## The setup commands: 7 verbs

- **`flow install [check|finish]`**: puts Flow on this machine, the setup session included.
- **`flow init [check|finish] [--prefix] [--local]`**: sets up this project.
- **`flow update [check|finish]`**: pulls Flow, then migrates this machine and this project where either is behind. Was `flow up`.
- **`flow sync`**: copies `~/.flow/` between machines, and the project's branch.
- **`flow doctor`**: checks the machine.
- **`flow restore`**: puts this project or this machine back as before Flow.
- **`flow uninstall`**: removes Flow.

`flow setup` and `flow setup project` are gone: `scripts/flow/commands/setup.js` is a library holding both sessions. `migrate` was rejected as a command name: `flow update` and the machine setup already migrate.

## What `flow init` checks

The test is whether anything competes with Flow's rules, never whether the folder is empty. Code, a `README` and a `package.json` change nothing. In order:

- **No git repository** → `git init`. Never in an existing one.
- **Typed in a subfolder of a repository** → works at the top folder, and says so.
- **A run that stopped part way** → carries on from where it stopped.
- **Already a Flow project** → says so and stops, or folds in this machine's old Claude Code memory.
- **`--local`** → the plain folder above, and nothing else.
- **A teammate made the branch** → checks it out, and the project is set up.
- **No `flow` branch** → creates it, and adds `.flow/` to `.gitignore`.
- **No competing files** → writes the template at once, with no session.
- **Competing files present** (`CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/skills/`, Claude Code's memory for the folder, other tools' rule files) → the setup session opens, for those files only.
- **An existing `.gitignore`** → Flow's lines are added group by group, and nothing is replaced.
