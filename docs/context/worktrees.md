# Worktrees in this repo

Read before making a worktree (`guides/worktrees.md`). Adapt each snippet to the job. `<wt>` is the worktree folder, `<main>` the main checkout.

## Set up

1. Link the tickets folder. Claude Code does not.

   ```sh
   ln -s "$(realpath <main>/.flow)" <wt>/.flow
   ```

2. Install dependencies where the job runs code. Check: `pnpm test` starts in `scripts/`.

   ```sh
   (cd <wt>/scripts && pnpm install --frozen-lockfile)
   (cd <wt>/mods/flow-session && pnpm install --frozen-lockfile)
   ```

## Copy

Nothing. No gitignored file here is needed by a build, so there is no `.worktreeinclude`.

## Skip

- `lab/util`, the submodule: leave it empty. A job that changes only `lab/util` takes a worktree of that repository alone, not of this one.
- `repos/`, `tmp/`: ignored scratch.

## Check before a merge

`util git save -w` runs this in the worktree before it moves `main`. Set once per clone, and read by every worktree of it:

```sh
git config util.saveCheck '(cd scripts && pnpm test) && claude plugin test mods/flow-session'
```
