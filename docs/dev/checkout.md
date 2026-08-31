# The two checkouts

Every skill is a symlink into your clone, so saving `SKILL.md` changes that skill everywhere at once — in every project, and in every session already running. That is Flow's best property and it has no off switch. It also means a rework spanning five skills is half-applied in real work for as long as the rework takes.

Two working copies of one repository answer it.

- [Stable and dev](#stable-and-dev)
- [Making the dev checkout](#making-the-dev-checkout)
- [Shipping](#shipping)
- [Which one to edit](#which-one-to-edit)

## Stable and dev

**Stable is `~/code/flow`.** Every symlink in `~/.claude/`, `~/.flow/` and `~/.local/bin/` points here, so this is what your real projects run. Leave it alone during a rework.

**Dev is `~/code/flow-dev`.** A second working copy of the same repository, on a branch. Nothing points at it, so nothing in it reaches a project until you merge.

**The unit of change is the workflow, not a skill.** Changing one skill usually means changing four more, and often `home/CLAUDE.md` and `home/settings.json` with them. A mechanism that held back a single skill would answer nothing, which is why what gets two versions is the whole clone.

## Making the dev checkout

```bash
git worktree add ../flow-dev <branch>
```

A worktree is a second working copy sharing one object store with the first, so the copy costs almost nothing on disk. A plain second clone behaves identically if you prefer one.

Gitignored folders do not come across, and neither one is needed to test a change: `repos/` holds reference clones that nothing reads at runtime, and `tmp/` is rebuilt on demand.

## Shipping

Merge the branch, then pull in the stable checkout.

```bash
cd ~/code/flow && git pull
```

Every symlink already points at that clone, so the whole rework goes live in one step.

Re-run `flow install` only when a skill was **added, renamed or removed**. That is the one change a symlink cannot carry, because the link is named for the skill.

## Which one to edit

- **A quick fix you want live now** — edit the stable checkout. It takes effect in every open session immediately.
- **A rework across several files** — edit the dev checkout, run the whole state through [the scratch session](scratch-session.md), and merge when it holds.

Both modes exist with no switch to set and nothing to remember: which checkout you are standing in is the whole decision.
