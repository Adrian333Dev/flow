# Handoff

Written 2026-09-23, at the end of a phase, before the user commits. Read this once, then rewrite it whole next time.

**Nothing is in flight.** Every item the user raised in this phase is built, tested (160 of 160) and written into the docs. The next session starts with whatever the user brings.

## Built in this phase

- **Essential skills.** Every Flow skill outside `skills/dev/` is always linked. `flow skills ls` leaves it out, `on` and `off` refuse it, and `flow doctor` reports a settings line naming one. `/flow:review` and `/flow:apply-domain-findings` are the only Flow skills that switch, and both start off. `skills.essential()` in `scripts/flow/lib/skills.js` holds the test. `flow install` links only the essential ones and leaves the dev ones to `apply`.
- **The `@` file list.** `scripts/file-suggestion.js`, named by `fileSuggestion` in `home/settings.json`, offers git-ignored files and puts the most recently changed first. It saves each project's walk to `<os temp>/flow-file-suggestion/<hash>.txt` and answers every keystroke from it, walking again in the background once the save is 2 seconds old. `fileSuggestionIgnore` adds folders to skip, from all 3 levels, added together. The user checked in a live session that subagent names still show beside its paths. `docs/manual/settings.md` → `### fileSuggestion` holds the design and the timings.
- **`find()` in `scripts/flow/lib/skills.js` is deleted**, with the user's yes.
- **All 6 Claude Code issues have their numbers** in `lab/context/claude-code.md`: #95761, #95762 and #95763 joined the 3 from 2026-09-10.
- Earlier in the phase, already committed: the project's git unlock moved to `<project>/.flow/settings.local.json`, `domainSkillsAutoUpdate` became `skillsAutoUpdate`, and `scripts/domain-pull.js` became `scripts/skills-pull.js`.

## Speed, as measured

Measured 2026-09-23 on this machine, WSL2:

- **This repo, 33,500 files**: a typed query 50 to 58 ms, a bare `@` about 75 ms. 34 ms of each is Node starting.
- **A walk with nothing saved**: 200 to 400 ms on this repo, 3.8 s on the whole home folder. That is why the first `@` in a project stops walking at 250 ms.
- **Where the time went before the cache became plain text**: reading the file 10 ms, parsing JSON 13 ms, lowercasing every path 12 ms. The plain-text cache searches the whole text for the first word and splits only the lines holding it.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to make it.
- **Before a big build, say its size and order in one line first.**
- **When the user asks to save context, stop and save.**
- **Performance matters to the user.** Measure before calling something fast, and show the numbers.
- **Pick the smallest change that works. Never regenerate a sample the user has seen.** Show only lines that change.
- **Nothing is released.** Never design for a machine set up with an older Flow.
- Everything in `CLAUDE.md` → `## The reply` holds.

## Facts found

- **No hook can edit the skill list Claude sees.** A `SessionStart` hook can return `reloadSkills: true` (`lab/research/claude-code-docs/hooks.md` line 1101). Whether that rescan reaches the plugin folder is untested.
- **`skillOverrides` skips plugin skills.** `enabledPlugins` switches a plugin whole.
- **`fileSuggestion` replaces the file paths alone.** Claude Code can skip it without a warning, in an untrusted folder or where managed settings turn hooks off.
- **`os.homedir()` follows `HOME`**, and `os.tmpdir()` follows `TMPDIR`, which is how `scripts/tests/file-suggestion.test.js` gives each test its own cache.
- **`tmp/skills-try/`** holds a hand-run scratch machine with `env.sh`, left for poking at `flow skills`.

## Loose ends nobody has raised

- **A git write ran unasked on 2026-09-20**: `git rm --cached` staged deleting `scripts/flow/lib/snapshots.js` and `commands/snapshot.js`.
- **2 tests fail under load and pass alone**: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- **The scorecard records use a `kind` field.**
- **`docs/dev/layout.md` says Claude Code never reads an `AGENTS.md`.**
- **2 files no session of ours wrote**, committed in `b1f6666`: `lab/context/context-7-alternatives.md` and `context7-report.md`.
- **util's `~/.util/sources`** keeps naming `~/.flow/repos/util` after an uninstall.
- **The `@` cache is never cleaned up.** One file per project stays in the system's temp folder until the system clears it, about 3 MB for 33,500 files.

## Where to look things up

- **Claude Code**: `lab/research/claude-code-docs/`, and `https://code.claude.com/docs/en/<page>.md` for any page.
- **Codex**: `repos/codex/codex-rs/`, read with `cat`, never edited.
