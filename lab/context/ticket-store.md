# Where tickets live, and the commands around them

Decided with the user on 2026-09-29, during pass 1 of the final sweep, and built the same day. A second round the same evening renamed `--trial` to `--local`, made `flow new` refuse offline, built what a ticket records about its sessions, and moved the phase skills' first line into `flow load`. On 2026-10-01 the Flow home became a second place for a project's tickets, `--machine-only` replaced `--local`, and `flow store` moves tickets between the 2 places.

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
- **Anyone who can read the project gets its tickets**, and nothing else of the owner's. `~/.flow/` was rejected as the only home for project records: it is one person's private repository, so a project shared with a teammate or a team could never live there. It became the second place on 2026-10-01, below.
- **Global tickets stay in `~/.flow/`**, which commits and pushes at the same checkpoints.
- **The risk is merging.** Beads ran a sync branch and deleted it (commit `ff7244b61`, 5,720 lines of worktree management and repair), because every issue sat in one file and any 2 edits could conflict. Flow keeps one folder per ticket, so 2 people conflict only on the same ticket. A pull that meets the same lines of one ticket changed on both sides is put back, and the local version stays committed for a merge by hand.
- **Git worktrees for code stay off.** Flow's settings deny an agent making one, and the user never makes one by hand, so no second checkout of the code needs to reach `.flow/`. 2 tickets at once in 2 sessions is the case that would bring them back, parked in `lab/backlog/after-v1.md`.
- **No project has `.flow/` committed with its code**, so nothing migrates to the branch.

## The second place: the Flow home

Decided with the user and built 2026-10-01. A project's tickets live in one of 2 places: the project's `flow` branch, above, or the Flow home.

- **In the Flow home, `.flow/` is a link** to `~/.flow/projects/<name>/`, which `flow sync` carries to the user's other machines, or to `~/.flow/projects-local/<name>/` with `--machine-only`, which the Flow home's ignore list keeps on the machine. `<name>` is the project folder's name, with `-2`, `-3` where taken. `scripts/flow/lib/records-place.js` holds it.
- **Why a second place**: a public repository would publish its tickets on the branch, and a repository other people keep, such as a client's, can't take a branch at all. `--local` covered the second case with a plain folder that never left the clone, so the user's own other machines never saw those tickets.
- **`--machine-only` replaces `--local`, and stays**: an employer can forbid work notes in a personal GitHub repository, which the Flow home is. A plain `.flow/` folder left by `--local` still reads as `folder` and still works. Nothing makes one any more.
- **Setup in the Flow home touches nothing in the repository** but the line `.flow` in `.git/info/exclude`: no rule file, no `.gitignore` line, no session, as `--local` did. A public project of the user's own therefore gets no `AGENTS.md` template. Decided mid-build, and reversible.
- **`.git/info/exclude` over a `.gitignore` line**, settled with the user for `--local`: a `.gitignore` line is a change to a committed file, left either committed into someone else's repository or showing in every `git status`. The exclude file ignores `.flow` the same way and is never committed. The line has no trailing slash, since a link is not a folder to git.
- **The folder's `settings.json` holds `repository`**, the origin's address normalized to `github.com/owner/repo`: protocol, `user@` and `.git` stripped, the scp form's `host:` turned into `host/`, lowercased. `flow init` in another clone finds the folder by it and links to it rather than asking.
- **Numbers are given on the spot**, and `flow sync` renumbers a clash with `was:`, as for `home-` tickets. Nothing commits on each ticket write: the Flow home's own save takes the folder, from `flow sync`, the hooks and `records-sync.js --home --in <root>` after a status move.
- **Renumbering judges against the remote as fetched before this machine's push**, `theirs` from `flow-repo.js` → `sync()`. Until 2026-10-01 it judged against `origin/main` after the push, where this machine's ticket already sat, so the wrong ticket could keep a disputed number. The fault touched `home-` tickets too.
- **`flow restore project`** deletes the link alone, and its box says the tickets stay in the Flow home.

### Which place `flow init` picks

In order, the first that applies:

1. `--machine-only`, then `--home`.
2. A Flow home folder whose `repository` matches: that folder, on the shelf it sits on.
3. A local `flow` branch, then a remote one after a fetch.
4. The repository's visibility, from `gh repo view <owner/repo> --json visibility`. Public asks, with 3 choices and the Flow home the default. With no terminal, the Flow home.
5. A GitHub repository whose visibility `gh` can't read asks too, since a wrong guess publishes the tickets. Decided mid-build.
6. Private, a remote outside GitHub, and no remote take the branch with no question. A host outside GitHub can't be asked, and the user ruled a private repository takes the branch. Decided mid-build.

`FLOW_VISIBILITY` stands in for `gh` in the tests.

### `flow store`

- **Bare** → one line saying where the tickets live and who reads them.
- **`home [--machine-only]`** → from the branch, it commits, copies the files into a new Flow home folder, takes the checkout away and links. The branch stays, here and on the remote, and the command prints how to delete it: `git branch -D flow`, then `git push origin --delete flow`. Deleting is the user's. It refuses where a Flow home folder already holds the project.
- **Between the Flow home and this machine alone** → the folder moves shelf. The Flow home's history on GitHub keeps the earlier copies, and the command says so.
- **`project`** → onto the branch, the one an earlier move left or a new one. The branch then holds exactly what moved, so a ticket on the branch that the moved set lacks would be deleted: it refuses, puts the link back and names the ticket. `repository` comes out of `settings.json`, since a branch travels with its repository.

## Sync at checkpoints

- **Commit** at every command that writes a ticket. A commit takes the whole folder, so the user's hand edits ride along with the agent's.
- **Push** at a status move or a drop, in the background; at once for a new ticket; after a reply once 30 minutes have passed and something changed (the `Stop` hook, `async`); and at session end (the `SessionEnd` hook, whose 1.5 seconds only start a detached run). The user asked for more than session end: every half hour at most.
- **Pull** at session start, in the background, and right before a new ticket takes its number.
- **Offline**, a push skips quietly and the next checkpoint tries again, except for a new ticket, below. Any other failure goes to the failure log.
- **`flow sync`** stays, for a push by hand. Typed inside a project it syncs the project's branch too, even when `~/.flow/` refuses.
- **`scripts/records-sync.js`** runs every checkpoint nobody typed. `~/.flow/records-sync.json` holds when each place last sent, and never travels.

## A new ticket is pushed at once, or not made

`flow new` pulls, takes the next number, commits and pushes. A refused push means someone pushed first: it pulls, renumbers and tries again, up to 5 times, writing no `was:`, since nobody saw the first number. The id shows only after the push lands, so nobody sees a number change.

**Offline, no ticket is made**, decided with the user the same evening. A failed pull refuses before anything is written. A push that never lands takes the ticket back: its folder goes, a `--from-groundwork` folder returns where it was, and the removal is committed. Since 2026-09-30 the message prints git's own words, `no ticket was made: the remote did not take it. git said: …`, since a missing sign-in and a network fault had read the same. A ticket renumbered after it was shown leaves its old id wherever it was already written, a plan, a commit message, a conversation, which is the argument. Claude Code needs the network anyway. A project with no remote, and one in the Flow home, give numbers out on the spot.

**`~/.flow/` still renumbers with `was:`.** Its tickets are sent every 30 minutes, not when made, so 2 machines can give out one `home-` number between syncs. `flow sync` renumbers the later one and prints `home-4 is now home-5: another machine took home-4 first.`

## Prototypes live in their ticket

- **`.flow/tickets/<id>/protos/<name>/`**, one folder per prototype, plural since a ticket can hold several. The root `protos/` folder is gone: in a project kept outside the branch it would have sat in the other people's repository.
- **No ticket, inside a project** → `flow new "<question>" --type prototype` first. **Outside a project** → the folder the user names.
- **`.flow/.gitignore` on the branch** keeps `node_modules/` out, and a prototype adds lines for model caches and generated media. `flow move` and a plain `mv` both carry the ignored files, since they move the folder whole.

## What a ticket records about its sessions

Decided by the user and built on 2026-09-29. Tickets left the code branches, so nothing else says which code branch a ticket's work is on, or which sessions worked on it.

- **`branch:`** in the frontmatter: the code branch checked out when the ticket first reaches `building` or `review`, written once. `flow <id>` prints `branch: feature/budgets   (checked out here: main)` where they differ, and `/flow:start` stops on that line and tells the user before routing.
- **`history.md`** in the ticket folder, one line per status move and per `flow handoff <id>`, which `/flow:handoff` runs after writing `## State`: `2026-09-29 14:02  todo → building  <session id>  "<title>"  feature/budgets`. In the folder rather than in commit messages, so it travels with `flow move` and exists in a project kept in the Flow home, which commits nothing on its own.
- **The session id is `CLAUDE_CODE_SESSION_ID`**, which Claude Code sets for every command it runs, so no hook is needed. A command typed outside a session writes `-`.
- **The title** is read from the transcript under `~/.claude/projects/`: the last `customTitle` (a `/rename`), else the last `aiTitle`. A transcript exists only on the machine that ran it and is deleted after 365 days (`cleanupPeriodDays`).
- **`scripts/flow/lib/ticket-history.js`** holds it. A failed history write never undoes the move.

## The phase skills' first line: `flow load`

Each phase skill opened with `` !`[[ "$0" =~ ^([a-zA-Z]{2,8}-)?[0-9]+(-|$) ]] && flow get "$0" --files 2>&1 || true` ``, which the user could not read. It is now `` !`flow load "$0"` ``: the ticket and its open files where the first word is shaped like an id, nothing for any other word, a refusal printed as text with exit 0. The id pattern lives once, as `store.ID_SHAPE`, which `check-ticket.js` shares. `docs/dev/skills.md` → `## A shell line in the body` holds the rule: a shell line runs one named command.

Removed 2026-09-30, with `ID_SHAPE`: a ticket reaches a phase skill through its own ticket skill now. `ticket-skills.md` → `## Archived` says what `flow load` did and how to bring it back.

## The setup commands: 8 verbs

- **`flow install [check|finish]`**: puts Flow on this machine, the setup session included.
- **`flow init [check|finish] [--prefix] [--home|--machine-only]`**: sets up this project.
- **`flow store [project | home [--machine-only]]`**: where this project's tickets live, or moves them. Added 2026-10-01.
- **`flow update [check|finish]`**: pulls Flow, then migrates this machine and this project where either is behind. Was `flow up`.
- **`flow sync`**: copies `~/.flow/` between machines, and the project's branch.
- **`flow doctor`**: checks the machine.
- **`flow restore`**: puts this project or this machine back as before Flow.
- **`flow uninstall`**: removes Flow.

`flow setup` and `flow setup project` are gone: `scripts/flow/commands/setup.js` is a library holding both sessions. `migrate` was rejected as a command name: `flow update` and the machine setup already migrate.

## What `flow init` checks

The test is whether the folder holds anything for the setup session to read: code, or a file competing with Flow's rules. Until 2026-09-30 code counted for nothing, which left a project with code and no rule file on the bare template: no `## Project`, and no stack ticket. In order:

- **No git repository** → `git init`. Never in an existing one.
- **Typed in a subfolder of a repository** → works at the top folder, and says so.
- **A run that stopped part way** → carries on from where it stopped.
- **Already a Flow project** → says so and stops, or folds in this machine's old Claude Code memory.
- **`--home` or `--machine-only`** → the Flow home, and nothing else in the repository.
- **A Flow home folder holds this repository** → links it, and the project is set up.
- **A teammate made the branch** → checks it out, and the project is set up.
- **A public repository, or a GitHub one whose visibility `gh` can't read** → asks where the tickets live. No terminal takes the Flow home.
- **The remote refuses a dry-run push** → stops before making anything, prints git's reason, and offers `--home`. Added 2026-09-30.
- **No `flow` branch** → creates it, and adds `.flow/` to `.gitignore`.
- **An empty folder**: no file git keeps or would keep, besides `.gitignore` → writes the template at once, and asks nothing.
- **Competing files** (`CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/skills/`, `.mcp.json`, other tools' rule files) → the setup session opens, asking nothing: only reading them sorts their rules into Flow's files.
- **Other files, or Claude Code's memory for the folder** → asks `Read them in a setup session first? (y/N)`. `-y` answers yes. The default, and the answer with no terminal, is the template, which replaces no file already there. Decided 2026-09-30: only the user can tell a project from a folder of scratch code.
- **An existing `.gitignore`** → Flow's lines are added group by group, and nothing is replaced.
