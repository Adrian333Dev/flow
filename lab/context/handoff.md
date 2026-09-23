# Handoff

Written 2026-09-23, after the `try.sh` rework and `install.sh` were built. Read this once, then rewrite it whole next time.

## Done, awaiting the user's review

The user said to build both, and to comment on the changes afterwards. The user then approved the deletes and is committing all of it, so the next session starts on a clean tree. The user's comments on the build have not arrived yet: take them first.

- **`lab/scripts/try.sh`**: the sandbox always on, `--case with-flow|empty|<saved name>`, `--project` in place of `--seed`. `--print`, `--sandbox` and `--machine` are gone. Run with no terminal attached, it builds and prints `bash tmp/try/sandbox.sh`. `empty` and a saved computer start by running `install.sh --use <checkout> --no-clone --drafts`, then the session.
- **`lab/scripts/save-computer.sh <name>`**: copies this computer into `tmp/computers/<name>/`, and refuses a name that exists. `tmp/computers/before-flow/` is saved, 47 MB.
- **`install.sh`**: at the repo root, clones branch `main` until a release writes its tag in, `--use <folder>` skips the clone, and every other argument goes on to `flow install`.
- **The 4 finished `[x]` lines in `backlog.md` are deleted**, on the user's yes: the clones, `flow skills`, `/flow:file-findings` user-only, and the `@` file list.
- **Records updated**: `docs/dev/scratch-session.md` rewritten whole, `docs/dev/layout.md`, `lab/context/state.md`, `CLAUDE.md` → `try-sh-for-a-live-session`, `backlog.md`, `lab/context/knowledge-base.md`.

## Next

`/flow:setup-machine`, the backlog's next V1 line, tested with `bash lab/scripts/try.sh --case before-flow`. `install.js` still ends by printing "restart Claude Code, then type /flow:setup-machine", where `management.md` says it starts the setup session itself. That lands with the skill.

## Facts found this session

- **bwrap 0.9.0 is at `/usr/bin/bwrap`, and has no `--overlay`**, so a case is a copy, never a layer over the real folders.
- **`claude` is `~/.local/share/claude/versions/2.1.280`, and node is under `~/.nvm/versions/node/v24.15.0`.** Both live under the home folder, so the sandbox binds them in read-only.
- **The Claude Code login is bound writable** from the real `~/.claude/.credentials.json`, since a renewal writing a copy would use up the real refresh token.
- **The Codex `seo` skill carries an 803 MB `.venv`.** Without it, a copy of this computer is 47 MB and takes a second.
- **Checked working**: all 3 cases, `install.sh` run twice with no second clone, a real clone from GitHub inside the sandbox, a Codex session, and a signed-in `claude -p` answer.
- **`Adrian333Dev/flow` is public**, so the `curl` line needs no login.
- **`~/.local/bin` on this machine already has `flow` and `fw` links into the repo**, plus `util`, `u`, `codex`, `claude` and 3 `kiro-cli` binaries.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to make it.
- **Names must make sense to a stranger.** A flag, a value or a command name is read by someone finding the script on GitHub. The user rejected `--machine`, `here`, `--home` and `--print` in turn, and named `--case`, for meaning nothing outside this conversation.
- **Before a big build, say its size and order in one line first.**
- **When the user asks to save context, stop and save.**
- **Performance matters to the user.** Measure before calling something fast, and show the numbers.
- **Pick the smallest change that works. Never regenerate a sample the user has seen.** Show only lines that change.
- **Nothing is released.** Never design for a machine set up with an older Flow.
- Everything in `CLAUDE.md` → `## The reply` holds.

## Loose ends nobody has raised

- **A git write ran unasked on 2026-09-20**: `git rm --cached` staged deleting `scripts/flow/lib/snapshots.js` and `commands/snapshot.js`.
- **2 tests fail under load and pass alone**: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- **The scorecard records use a `kind` field.**
- **`docs/dev/layout.md` says Claude Code never reads an `AGENTS.md`.**
- **util's `~/.util/sources`** keeps naming `~/.flow/repos/util` after an uninstall.
- **The `@` cache is never cleaned up.** One file per project stays in the system's temp folder, about 3 MB for 33,500 files.

## Where to look things up

- **Claude Code**: `lab/research/claude-code-docs/`, and `https://code.claude.com/docs/en/<page>.md` for any page.
- **Codex**: `repos/codex/codex-rs/`, read with `cat`, never edited.
- **codex-seo's installer**, the model for `install.sh`: `repos/codex-seo/README.md` → `## Install`.
