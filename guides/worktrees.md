# Work in a worktree

The default is the main checkout: its uncommitted changes show in the editor's Source Control list. A worktree exists only when the user asks for one, usually for parallel work. Nothing in Flow makes one, commits one or merges one.

## Making one

1. Read `docs/context/worktrees.md` where the project has it: what to copy, link, install or skip. Adapt it to the job.
2. Make it, with `EnterWorktree` or `git worktree add -b <name> .claude/worktrees/<name> <base>`.
   - `<name>` is the ticket's folder name, starting with its id (`fw-342-worktree-on-demand`). `flow tickets done` and a drop find the worktree by it.
   - `<base>` is `main`'s last commit, without the main checkout's uncommitted edits. A child building on its parent's unmerged work → the parent's branch.
3. `.claude/worktrees/` listed in `.git/info/exclude`, for the first worktree of a project. Check: `git check-ignore .claude/worktrees` prints it.
4. `ln -s "$(realpath <main checkout>/.flow)" <worktree>/.flow`. Claude Code does not link it.
5. Run the setup the page lists. No submodule is checked out unless the job needs it. Check: the project's tests run there before the first edit.

## Resources

The worktree shares everything outside its folder: a database, a port, a cache, a service.

- **A resource 2 sessions would likely change at once** (a database a migration changes, a port a server binds) → a copy of its own, made from the page's snippet.
- **Any other resource** → use it shared.
- **A resource that cannot be copied** → use it shared, and name it in the report.
- **A limit hit and solved by hand once** (a missing file, a setup step, an env value) → add the snippet to `docs/context/worktrees.md` in this ticket. A snippet repeated unchanged becomes a script the project commits beside the page, named there. `.worktreeinclude` lists gitignored files Claude Code copies itself.

## Ending the build

Run the full suite in the worktree, leave the edits uncommitted, and report. Commit nothing, merge nothing, suggest neither. The worktree shows in Source Control as a repository section of its own, after one click on the list's refresh button.

The main checkout holds uncommitted edits (`git status --short` there) → add one line to the report: their files next to the worktree's, and any that import or call each other. Git cannot see that dependency, and the user decides.

## The user merges

The user runs `util git save -w <name>` (inside the worktree, `-w` alone). It commits the worktree under its branch name, replays it on top of the branch the main checkout has out, runs the check in `git config util.saveCheck`, moves that branch up and pushes it. A plain `util git save` never merges.

It stops with a message on a conflict, on uncommitted edits in the main checkout to a file the merge changes, on a failing check, and after a replay with no check set (`main` had moved on, so the code is untested). On a stop, fix what it names and run the suite. The user runs it again.

A project sets the check once: `git config util.saveCheck "<command>"`, one shell command run in the worktree. It is listed on `docs/context/worktrees.md`.

## Merging by hand

Only when the user asks the agent to merge. In this order. A conflict or a failing check stops the merge and reports.

1. In the worktree: `git add -A`, then `git commit -m "<ticket name>"`.
2. `git log --oneline <branch>..main`. Open a diff or `flow tickets get <id>` only for a subject that touches the ticket's area.
3. `git rebase main`. Check: no conflict, or each one fixed with `git add` and `git rebase --continue`.
4. Run the full suite. Check: it passes.
5. `ExitWorktree` with `action: keep`. Inside a worktree, Claude Code blocks edits and git aimed at the main checkout.
6. `git merge --ff-only <branch>` in the main checkout. Check: `main` holds the commit. Git refuses where the main checkout has uncommitted edits to a file the merge changes, even on far-apart lines → stop and name the files. A stash (`git stash push -u -m <unique tag>`, then `git stash apply <sha>` and a drop of that entry) only on the user's word.
7. `util git save`, which pushes. Nothing to commit there, so it only pushes.

Never `git checkout -f` or `git reset --hard` in the main checkout. Never commit another session's unfinished edits.

## Closing

The work is merged, by the user or by hand, and the user says the ticket is done.

1. `flow tickets done <id>`. It refuses while the worktree holds uncommitted or unmerged work.
2. `ExitWorktree` if the session stands in the folder. Then `git worktree remove <folder>` and `git branch -d <branch>`. Check: `git worktree list` shows only the main checkout.
3. A worktree that had a submodule checked out refuses removal: `git -C <folder> submodule deinit <path>` first, then `git worktree remove --force <folder>`, which asks the user once.
