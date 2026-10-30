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

Run the full suite in the worktree, leave the edits uncommitted, and report. The worktree shows in Source Control as a repository section of its own, after one click on the list's refresh button. Commit nothing and merge nothing until the user says "merge it".

## Merging

On "merge it", with plain git, in this order. A conflict or a failing check stops the merge and reports.

1. In the worktree: `git add -A`, then `git commit -m "<ticket name>"`.
2. `git log --oneline <branch>..main`. Open a diff or `flow tickets get <id>` only for a subject that touches the ticket's area.
3. `git rebase main`. Check: no conflict, or each one fixed with `git add` and `git rebase --continue`.
4. Run the full suite. Check: it passes.
5. `ExitWorktree` with `action: keep`. Inside a worktree, Claude Code blocks edits and git aimed at the main checkout.
6. In the main checkout, uncommitted edits present → `git stash push -u -m <unique tag>`, then `git rev-parse stash@{0}`. They block the move even where the hunks are disjoint.
7. `git merge --ff-only <branch>`. Check: `main` holds the commit.
8. A stash was made → `git stash apply <sha>`, then `git stash drop` of that entry. An apply that fails stops and names the files. Nothing is lost.
9. `git worktree remove <folder>`, then `git branch -d <branch>`.
10. `flow tickets done <id>`.

Never `git checkout -f` or `git reset --hard` in the main checkout. Never commit another session's unfinished edits.
