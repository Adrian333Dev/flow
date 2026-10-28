# Work in a ticket's worktree

The ticket's code lives in its own checkout under `.claude/worktrees/<name>/`, on a branch of the same name. Other sessions build other tickets in their own. `flow` inside it works on the main checkout's tickets.

## Entering

1. `flow tickets start` printed `worktree: <folder>` → `EnterWorktree` with `path: <folder>`. Check: the working directory is the folder.
2. Run the project's tests there before the first edit. Check: they run, or the failure is named before building.

## Resources

The worktree shares everything outside its folder: a database, a port, a cache, a service.

- **A resource 2 sessions would likely change at once** (a database a migration changes, a port a server binds) → `.worktree/create <resource>` for a copy of its own. Missing from the script → add that case to `.worktree/create` and its undo to `.worktree/remove`, in this ticket.
- **Any other resource** → use it shared.
- **A resource that cannot be copied** → use it shared, and name it in the report.
- **A limit hit and solved by hand once** (a missing file, a setup step, an env value) → automate the fix into `.worktree/create` in this ticket, or `.worktreeinclude` for a gitignored file to copy. The next worktree gets it with no steps.

`.worktree/create` and `.worktree/remove` are the project's committed scripts. They work out every name themselves and take no input beyond the resource.

## Closing

1. Run the full suite in the worktree. Check: it passes.
2. `ExitWorktree` with `action: keep`. `flow tickets done` deletes the folder, so the session leaves first.
3. `flow tickets done <id>`. It commits what the worktree holds, rebases it onto the ticket's branch, and merges it.
4. A conflict stops it, naming the files → `EnterWorktree` with the path again, fix the files, `git add` them, `git rebase --continue`, rerun the suite, then steps 2 and 3. Check: `done` prints `merged`.
