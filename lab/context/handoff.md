# Handoff

Written 2026-09-25. The user approved the permissions build below and is compacting. **After compaction, build it to the end with no second approval**: every file, the tests, the records, the writing pass. Read this once, then rewrite it whole next time.

## Build this: permissions with one owner per rule

Claude Code's settings hold every rule a pattern can say. The guard, `scripts/guard.js`, keeps only checks that must read inside a command, and it never allows anything. Git gets no mechanism of its own.

1. **`home/settings.json` → `permissions.allow`**: remove the bare `"Bash"`. Keep `Edit`, `Read`, `WebFetch`, `WebSearch`, `mcp__context7__*`. Add these 23:
   - files: `Bash(mkdir *)`, `Bash(touch *)`, `Bash(mv *)`, `Bash(cp *)`, `Bash(rm *)`, `Bash(ln *)`, `Bash(chmod *)`
   - code: `Bash(node *)`, `Bash(python3 *)`
   - Flow: `Bash(flow *)`, `Bash(fw *)`, `Bash(util *)`
   - tests and scripts: `Bash(npm test *)`, `Bash(npm run *)`, `Bash(pnpm test *)`, `Bash(pnpm run *)`, `Bash(yarn test *)`, `Bash(yarn run *)`, `Bash(bun test *)`, `Bash(bun run *)`, `Bash(pytest *)`, `Bash(cargo test *)`, `Bash(go test *)`

   The user approved the first 14, then the pnpm, yarn and bun pairs and the 3 other-language test commands. The reply that proposed them said 20 by miscount. The list is the decision.
2. **`permissions.deny`** gains `Bash(sudo *)`, `Bash(mkfs *)` and a rule for `--dangerously-skip-permissions`. Check `permissions.md` for how a pattern matches a flag mid-command before writing that one. No `ask` rule anywhere, since an ask rule beats every saved allow.
3. **`scripts/guard.js` keeps 4 checks, each answering `ask`, every time:**
   - a recursive or forced delete (`rm -r`, `rm -f`) pointing outside the working directory: the existing `realpathish` logic
   - a download piped into a shell, `curl … | sh`: today a deny, now an ask
   - a write into a shell startup file, `>> ~/.bashrc`
   - a destructive git command: the existing `GIT_DESTRUCTIVE` table (force push, `reset --hard`, `clean`, rebase, `filter-branch`, forced branch delete, tag delete, ref delete, forced worktree removal, reflog delete, prune)
4. **Remove from the guard:** the sudo, pipe-to-shell and skip-permissions `DENY` list (moved to settings or to ask), the install, `chmod 777`, `dd` and `mkfs` asks, `SELF_UNLOCK`, `GIT_READS`, `GIT_INSTRUCTED`, `gitMode()`, the off-mode deny, and the throw-denies-git fallback. The header comment is rewritten for what is left. `dd` and installs then fall to Claude Code's own prompt, since no pattern allows them.
5. **Remove the git switch whole:** `scripts/flow/commands/git.js`, its registration in `scripts/flow/flow.js` and `scripts/flow/lib/cli.js`, `gitMode` in `scripts/flow/lib/settings.js`, the git line in `scripts/flow/setup/form.md`, and the tests for all of it in `scripts/tests/flow.test.js` and `scripts/tests/guard.test.js`. If the project's `.flow/settings.local.json` then serves nothing, it goes too, with the `project-template` gitignore line and the mention in this repo's `CLAUDE.md` → `claude-dir-vs-flow-dir`. Check with a search before deleting.
6. **`home/AGENTS.md`**: delete `no-git-writes` under `## Tools`. Claude Code's prompt is the gate now.
7. **Docs** that name the switch or the blanket `Bash`: `README.md`, `docs/manual/settings.md` (the allow table and "Bash is blanket" paragraph get rewritten around the shipped patterns), `docs/manual/reference.md`, `docs/manual/where-everything-lives.md`, `references/cli-design.md`. Find every one with `grep -rn "gitMode\|git allow\|flow git\|\"Bash\"" --include=*.md --include=*.js`, skipping `tmp/`, `repos/`, `lab/research/`, `lab/context/`.
8. **Records:** `lab/context/state.md` → the `flow` command-group count and list, the `guard.js` line under `## 12 hooks`, the `home/AGENTS.md` line count, and one line under `## Rulings and measurements` saying the timed git switch was removed 2026-09-25 by the user, as a preference Claude Code's prompt already covers, and that `git log -S gitMode` finds the code if a mid-session setting that holds even in auto mode is ever needed again. `lab/context/management.md` gets the locked decision, batched with the `Read` allow of 2026-09-24.
9. **Tests:** `npm test` in `scripts/`, all must pass. Rewrite the guard tests for the 4 asks. No `CHANGELOG.md` entry.

**Raise, never decide alone:** the guard's old deny list held `su` beside `sudo`. The approved deny list names only `sudo`. Say so in the reply and recommend adding `Bash(su *)`.

### Why, in case it is questioned

- **Git is a preference.** The switch was built against the superpowers plugin committing after every edit. Claude Code's own prompt already asks before each commit, and a user who wants commits free saves `git commit *`. Reads never prompt: Claude Code runs read-only git forms with no rule. The destructive-git ask stays in the guard because it reads flags, and it still catches `git push --force` for someone who saved `git push *`.
- **Auto mode lets a commit run unasked.** The user accepted that: Flow's default mode asks.
- **A chained command saves one rule per piece, sometimes word for word.** Nothing is built for it. Revisit only if `.claude/settings.local.json` fills with word-for-word rules.

## Built and approved on 2026-09-24, already on disk

- `home/AGENTS.md` → `## Reading`: `tree-for-structure`, `search-then-choose`, `read-one-merge-many`. `## Scripts` mentions the line numbers and the line counts.
- `lab/util`: `fs merge` numbers every line, 3 backticks always; `fs tree` prints each text file's line count, none under `--into`, none for binary or over 10 MB. Tests and `docs/commands.md` updated. 55 of 56 pass: `git work refuses to send from a machine with no name` fails because this machine's global git config names it `me-kmkw`. It failed before the change.
- `scripts/flow/commands/doctor.js`: the `fs merge` caller note names `read-one-merge-many`.
- `home/settings.json`: `Read` allowed, `Read(~/.ssh/**)` and `Read(~/.aws/**)` denied, with `docs/manual/settings.md` and `reference.md` to match.
- `lab/util/backlog.md` → `### fs merge`: an outline of any file. **talk first.**
- `lab/context/state.md`: the reading ruling and the permission-prompt facts, under `## Rulings and measurements with no other home`.
- Claude Code's sandbox stays off, for the 3 reasons in `docs/manual/settings.md`.

## Facts established

- **Claude Code 2.1.281 has no `Grep` or `Glob` tool.** The shell's `grep`, `find` and `rg` run built-in ugrep, bfs and ripgrep.
- **Current models edit a file without a prior `Read`.** Opus 4.6, Haiku 4.5 and older still need one.
- **Claude Code runs a built-in read-only set with no rule**: `ls`, `cat`, `echo`, `head`, `tail`, `grep`, `find`, `wc`, `diff`, `cd` inside the project, and read-only `git`. `permissions.md` → `#### Read-only commands`.
- **`Bash(npm test *)` also matches a bare `npm test`**: a trailing ` *` matches the end of the string.
- **A hook's `ask` shows Yes and No only.** A hook giving no answer hands the command to Claude Code's prompt, which offers a pattern to save.
- **Saved rules land in `.claude/settings.local.json` at the repository root.** 2 sessions saving at once kept both rules, tested 2026-09-24.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to build.
- **Explain every term the first time**, in plain words.
- **Answer every topic, and say what to do.**
- **Read files with `Read`; search in the shell.** Never `cd` in a command, not even `cd /dev/null`. Use absolute paths. A `( … )` subshell is the one safe way to run from another folder.
- **Pick the smallest design, one source of truth.**
- **Probe in tmux** with `claude --settings tmp/guard-probe/settings.json --model haiku`. Submit a typed message with `tmux send-keys -t <name> C-m`, since `Enter` sent in the same call does not submit. Back up `.claude/settings.local.json` first, and remove only the probe's rules after.
- **Nothing is released.** Never design for a machine set up with an older Flow.

## Next, after this build

`/flow:setup-project`, next in `backlog.md` → `### The management skill, in build order`, with its own design pass. The user's own run of the setup session is still pending: `bash lab/scripts/try.sh --case before-flow --name setup-1` from a real terminal.

## Loose ends nobody has raised

- `docs/manual/reference.md` has a heading `# Delapse into Flow` near line 220, not written by this work.
- 2 tests fail under load and pass alone: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- The scorecard records use a `kind` field.
- A git write ran unasked on 2026-09-20: `git rm --cached` staged deleting `scripts/flow/lib/snapshots.js` and `commands/snapshot.js`.
- Scratch to clear some day: `tmp/read-calls/`, `tmp/guard-probe/`, `tmp/merge-try/`, `tmp/open-example/`.
