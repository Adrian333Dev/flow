# Moving uncommitted work between two machines

Locked 2026-08-23, prototyped and built 2026-08-24. The user works the same projects from a desktop
and a laptop, one at a time, never both at once. Committed work already travels through GitHub. Uncommitted work — files
edited but not committed, plus files never added — has no way to get there, so every switch of
machine either loses it or forces a junk commit.

## What was locked

- **Uncommitted work travels as a commit stored outside `refs/heads/`.** Build a commit holding the
  whole working tree, parent it on the current commit, write its name into a label git does not act
  on, push that label. Nothing about the branch, the staging area or the files on disk changes.
- **One label per machine, per branch** — `refs/unfinished/<machine>/<branch>`. Two machines can
  never overwrite each other, so no warning and no recovery path is needed for the case where a
  send is forgotten.
- **Only the newest copy is kept.** Each send replaces that machine's previous one, which makes the
  push a forced one. Safe here specifically: one machine writes each label, nothing reads it as
  history, and the machine that made the old copy still holds it in its own reflog.
- **Restoring is manual, and never automatic.** It is the one step that overwrites files in the
  project folder. It takes a copy of the current state first, so nothing can be lost to it.
- **Sending is manual too.** The user rejected a `Stop` or `SessionEnd` hook outright: *"that's
  something I'm probably going to run on my own."*
- **Gitignored files travel only when named**, one path per line in `.flow-include` at the project
  root. Committed, so the list moves with the project. Empty by default. A path listed here lands on
  whatever remote the project pushes to, which publishes it on a public repo.

## What was rejected, and why

- **Syncing Claude Code sessions between machines.** Killed on two facts: session files key their
  history by absolute project path, so the project would have to sit at an identical path on both
  machines forever; and tool results over 20k characters are written to separate sidecar files, so
  the session file is not self-contained anyway. The ticket files, `plan.md`, the reports and the
  handoff already carry the state a fresh session needs. The scrollback was the only thing lost, and
  it is not worth that price.
- **Chaining each copy to the previous one**, so pushes stay fast-forward and no copy is ever
  orphaned. Proposed, then dropped on the user's objection: *"most of the time we only need the
  latest snapshot."* The failure it guarded — sending from the laptop over an unrestored copy from
  the desktop — is already impossible once each machine owns its own label.
- **Deciding worktrees first.** Backlog line 82 has worktrees open with **talk first**, and the
  question of whether the git-mutation ban lifts with them is part of it. This design does not touch
  that: each worktree has its own current commit, so each would simply produce its own label. Left
  closed on purpose.
- **Copying the whole project folder to a bucket** with `rclone` or similar. Sends gigabytes where
  git sends kilobytes, risks a half-written `.git`, and carries no way to merge.
- **Taking the machine name from the hostname.** Built that way first, then rejected by the user on
  2026-08-24: *"I don't want it to rely on some hostname or anything."* The argument that settles it
  is that WSL hands out defaults — this machine reports `me` — so both computers can report the same
  name, file every copy under one label, and overwrite each other with nothing to detect it. A guess
  that is wrong costs the work; a refusal costs one command, once.

## The git-mutation ban does not move

`guard.js` allows only read-only git subcommands, and `permissions.deny` blocks the writes
independently. Both restrict **the agent**, through Bash. A script the user types is neither, and
`snapshot.js` already runs `git add -A` with `GIT_INDEX_FILE` as a hook on every subagent dispatch.
So this ships without loosening either wall.

## The commands

A new group on `flow`, following `references/cli-design.md`. `edit` is absent: nothing on a stored
copy is editable.

- **`flow work send`** — scratch staging list (`GIT_INDEX_FILE`), `git add -A`, `git add -f` for
  `.flow-include`, `git write-tree`, `git commit-tree -p HEAD`, `git update-ref`, forced `git push`.
  The project folder is untouched by all six.
- **`flow work send --clear`** — the same, then `git stash push --include-untracked` to empty the
  folder so a branch switch is possible. Deliberately git's own command, so a local copy survives
  and `git stash pop` is the undo.
- **`flow work get`** — fetch the labels with `--prune`, store the current state at
  `refs/unfinished-backup/<branch>` as insurance, `git diff --binary <parent> <copy>`, then
  `git apply --3way`. The `--3way` is what produces conflict markers instead of refusing; plain
  `git apply` is all-or-nothing. The insurance label is local and never pushed, and a folder that
  already matches the last commit gets none, having nothing to lose. A clean restore ends with
  `git reset`, because `--3way` stages everything it applies and the work being restored is
  mid-edit by definition. A restore with conflicts leaves the staging area alone: unstaging there
  would destroy the unmerged state the conflict editor reads.
- **`flow work ls`** — one line per stored copy: machine, branch, age, file count. Fetches first so
  the list is not stale; `--offline` skips that for a repository with no reachable remote.
- **`flow work drop [<machine>]`** — delete the label here and on the remote. Defaults to this
  machine's copy on this branch; `--all` takes every machine's copy on this branch.

`get` takes a machine name too, and needs one whenever two other machines both hold a copy of the
branch — it refuses and lists them rather than picking.

**The machine name is set by hand and never guessed** — `git config --global flow.machine desktop`,
once per computer, with `FLOW_MACHINE` overriding it where a test needs one folder to stand in for
two machines. `send`, `get` and `drop` refuse until it is set; `ls` does not, because refusing to
list what is stored is a strange way to ask for a setting.

`references/work-sync.md` is the usage guide: setup, the two-machine routine, conflicts,
`.flow-include`, what never arrives, and how to recover from a bad restore.

Everything lives in `scripts/flow/commands/work.js`, so no new file is linked anywhere. The
`flow` on PATH resolves to an old clone of this repo at `~/code/projects/agentic-setup/flow`, stopped
at 2026-08-07 and so carrying no `work.js` — until that is sorted the command runs as
`node scripts/flow/flow.js work …` from this repo.

## Conflicts

A stored copy holds a **set of edits**, not a moment in time. Restoring replays those edits onto
whatever the branch is now, so a branch that moved in between produces an ordinary three-way merge
with ordinary `<<<<<<<` markers, and VS Code's conflict editor opens on them. This is the same
machinery `git stash pop` uses, because the design is `git stash` with the label moved and pushed.

## What the prototype found

Ran 2026-08-24, against a throwaway pair of repositories and a real private repository on GitHub.
`tmp/proto-unfinished.sh` is the script; it rebuilds the whole world each run.

- **GitHub accepts `refs/unfinished/…`.** Push, forced push over an existing label, two machine
  labels side by side, fetch of the whole namespace, and delete — all six work over HTTPS. The
  `git bundle` fallback is not needed and is dropped.
- **A round trip preserves everything except an empty folder.** Modified file, deleted file, new
  file, new file in a new folder, executable bit, binary content and a named gitignored file all
  arrive. An unnamed gitignored file stays home. Git has no way to record an empty folder, so
  nothing can carry one.
- **Fetching a label carries the commit it hangs off.** The other machine does not need the branch
  pushed first. What it does not get is that commit's own content: a restore replays the edits and
  nothing else, so a local commit still needs its own push.
- **A branch that moved produces an ordinary three-way merge.** Conflicting edits come back with
  `<<<<<<<` markers and `git status` reads `UU`, which is what VS Code's conflict editor opens on.
- **`git apply --3way` stages everything it applies.** The design says the work comes back
  unstaged, so `get` runs `git reset` after a clean restore to make that true.
- **`git cherry-pick --no-commit` refuses on a dirty folder**, which is the state every restore
  runs in. That settles `diff` piped into `apply` as the route.
- **A folder holding its own git repository travels as a pointer, not as files.** The tree entry
  comes back `160000`. It does not break the restore, and `send` names every such path in its
  output so the gap is visible when the copy is made rather than when the files are missing.

Two shapes refuse rather than produce a broken label, both confirmed: a repository with no commits,
where a copy has nothing to hang off, and a detached HEAD, where there is no branch name to file it
under.

## Names say what the thing holds — corrected 2026-09-01

Raised on a folder called `refs/flow-wip/`, and on `lab/util/commands/git/save.sh`, which starts every
generated commit message with `wip:` — short for *work in progress*. The first write-up turned that into
a ban on the abbreviation itself.

**The user rejected that shape.** Nothing gets banned name by name, because the list of unclear names
runs to thousands and no file could hold it.

**The rule that replaced it:** a file or folder is named for what it holds, clearly and briefly, in words
a reader who has never seen it can follow. It sits in `home/CLAUDE.md` → `## Hard rules`, directly above
the rule that a name failing this test earns a `description:` line.
