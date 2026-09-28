# Handoff

Written 2026-09-28, mid-build, for a compaction. Read this once, then rewrite it whole next time.

## Next: finish the guard rebuild, then send one reply

The user approved rebuilding `scripts/guard.js`, now that every shell command is allowed. The code and the tests are done: 9 tests in `scripts/tests/guard.test.js` pass. What is left, in order:

1. **`docs/manual/settings.md` → `### hooks`**: rewrite the guard section, which still lists the old 4 dangers, for the 5 families below. The `#### allow` list's first bullet links `[4 dangers](#hooks)`, so fix that link's words too.
2. **Guard lines elsewhere**: `README.md` → `### The guard`, `docs/manual/reference.md` → the `hooks` bullet near line 879, `docs/dev/layout.md` → the `guard.js` bullet ("asks before 4 commands"), `scripts/flow/setup/form.md` → the `guard.js` line, `lab/context/state.md` → the `guard.js` bullet under `## 18 hooks`.
3. **Writing pass on each markdown file**, `references/style.md` and `references/write-docs.md` read already.
4. **`npm test --prefix scripts`**: the whole suite, 199 before this build plus the new guard tests. Rerun `node tmp/guard-holes.js`, the 17 commands the old guard let through: all ask except `git restore src` and `rm -rf src`, which lose nothing in this repo, since it has no `src`.
5. **One reply**: what the guard now catches, the files changed, the test count, and the calls made mid-build listed below, since the user has not seen them.

## The guard as built

`scripts/guard.js`, 1,409 lines. It never answers `allow`.

- **A shell reader, `parse()`**: quotes, `$(…)`, backticks, `<(…)`, `$((…))`, `${…}`, here-docs, comments, every operator, subshell parens. Each word keeps its parts (text, `~`, a named variable, or unknown) and its `raw` text, which is read again for `bash -c`, `eval`, `watch` and `env -S`.
- **`unwrap()`** peels keywords, assignments and wrappers: `env`, `command`, `exec`, `nohup`, `time`, `nice`, `ionice`, `timeout`, `stdbuf`, `sudo`, `flock`, `watch`, `bundle exec`, `xargs` (its input becomes an unknown argument). Variables set by `x=…`, `export` and `for` are tracked, and so is `cd`, with subshells restoring it.
- **Family 1, losing work**: `rm`, `unlink`, `shred`, `rimraf` and the rest ask outside the project, on an unknown target, on the project or an ancestor of it or of home, on a whole git repository, and inside the project over files `git status` lists as changed, staged or new. Outside git, a delete asks unless it sits in a rebuilt folder such as `node_modules` or `dist`. `find -delete` and `find -exec rm` run a dry run of the same find with `-print0`, then check exactly what matched. The git discards: force push, `reset --hard`, `clean`, `rebase`, `filter-branch`, `branch -D`, tag and ref deletes, `reflog`, `gc --prune`, `stash drop`/`clear`, and `checkout`/`restore`/`switch -f`/`rm -f` only over uncommitted changes. `git config --global` writes.
- **Family 2, off the machine**: `curl`/`wget`/`httpie` sending data to a host that is not local, `scp`/`rsync` to a remote destination, `sftp`, every `ssh`.
- **Family 3, shared systems**: 21 deploy and cloud tools ask unless a word reads and none changes (`READS`, `CHANGES`); `gh api` by its method and fields; bare `vercel`; `docker push`, volume deletes, `compose down -v`; `DROP`/`TRUNCATE`/`FLUSHALL` in a database client's arguments, here-doc or piped input; `dropdb`; `prisma migrate reset`; `rails db:drop`; django `flush`.
- **Family 4, the machine**: global installs (`npm -g`, `pip` outside a virtual environment or `--user`, `uv tool`, `pipx`, `cargo`/`go`/`gem install`, `brew`), `crontab`, `systemctl`, `launchctl`, `pkill`, `killall`.
- **Family 5, outside code and Flow's switches**: a download piped or substituted into a shell or interpreter, `npx`/`bunx`/`pnpm dlx`/`yarn dlx` of a package the project lacks (checked in `node_modules` and `package.json`), and any write into `~/.ssh`, shell startup files, `~/.gitconfig`, `~/.claude`, `~/.flow`, `~/.agents` or the project's `.claude/settings*.json`, by redirect, `tee`, `cp`, `mv`, `ln`, `install`, `sed -i`, `perl -i`, `truncate`, `chmod`/`chown` or `dd`.
- **When it cannot tell**: an unknown delete target or program asks. A command bash would refuse, such as an unclosed quote, stays silent. A crash asks when the command mentions a risky program.

**Calls made mid-build, to report to the user:**

- A named delete in `/tmp` passes, and a glob there asks.
- Deleting a new file git does not ignore asks, such as a scratch file outside `tmp/`.
- A plain `rm` outside the project now asks, where the old guard asked only for `-r` or `-f`.
- `find` deleting runs a dry run first, capped at 3 seconds.
- `ssh` always asks, even with no command after the host.
- `git push` without force, and `git commit`, stay with the `ask` rules, so deleting one from settings still lets it run.

## Decided 2026-09-28: permissions

- **Every shell command is allowed**: a bare `Bash` in `permissions.allow`, and `permissions.ask` holds `git commit`, `git push`, and `npm`/`pnpm`/`yarn`/`cargo publish`. Both `home/settings.json` and this repo's `.claude/settings.json`. `docs/manual/settings.md` → `#### Why every shell command is allowed`, `#### ask: 6 commands that always ask` and `#### Modes` record the reasons.
- **`approve.js` was built and deleted the same day**: its first live session asked on `wc -l < "$f"` inside a loop, and the user refused to patch shapes forever.
- **Auto mode ruled out by the user**: extra cost, reviews failing with no verdict, and blocking actions the conversation already agreed. **The sandbox ruled out** for what it breaks, and its retries outside the wall.
- The "switch to auto mode" option in prompts is gone, since the prompts left all come from a hook or an ask rule.

## Decided 2026-09-28: tickets and teams

- **Saving a ticket keeps fields Flow does not know**: `scripts/flow/lib/frontmatter.js`, with a test in `tickets.test.js`.
- **Mode 1 for teams keeps ticket records in a database** on a server, with plans in the repo; a solo developer keeps files. The board's columns: Todo, In progress (phase as a label), Review, Done, Parked, Dropped. `lab/context/teams.md`.
- **2 ticket rules ride on the `scripts/` cleanup** in `lab/backlog/before-beta.md`: id parsing and every ticket read and write stay inside `store.js`.
- **Not recorded yet**: the idea of one developer using Flow on a team repo, with Flow's files kept out of git through `.git/info/exclude`. A proposal only.

## Scratch

`tmp/guard-holes.js` feeds the guard 17 commands and prints ask or RUNS. Nothing is committed.
