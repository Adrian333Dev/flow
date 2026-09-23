# Handoff

Written 2026-09-23, before a compaction the user asked for. Read this once, then rewrite it whole next time.

**Next: build the essential-skills rule.** The user approved it ("Yes, approved your proposal") and asked for the build to start right after the compaction. `one-approval-runs-to-the-end` holds: the build, its tests, every record it makes stale and the writing pass, then one report. The approved spec is in `lab/context/management.md` → `### The settings hold only the exceptions`, the bullet **Essential skills cannot be switched, and `ls` hides them**.

**Everything before it is done.** The `flow skills` build, code, tests (154 of 154) and docs. Also built this session: the project's git unlock moved to `<project>/.flow/settings.local.json` so `.flow/settings.json` is committed; `domainSkillsAutoUpdate` renamed `skillsAutoUpdate`; `scripts/domain-pull.js` renamed `scripts/skills-pull.js`. A project still cannot switch off a skill on for the whole machine, by the user's choice.

## The essential-skills build

The rule, in short:

- **Essential is every Flow skill outside `skills/dev/`**, read off the tree. Switchable: `review` and `apply-domain-findings`, and both now **start off** (today every Flow skill starts on).
- **`on` and `off` refuse an essential skill by name**, saying it is part of the workflow and always on. `drop` still removes a stray line.
- **`ls` lists only the 2 switchable Flow skills** under `flow`.
- **`apply` always links every essential skill.** A hand-written line naming one is ignored, and `flow doctor` reports it with the `drop` fix.

The `ls` sample becomes:

```text
$ flow skills ls
                          state  level
flow
  apply-domain-findings   off
  review                  on     global
domain-skills             41 more
  react                   on     project
```

Files, in order:

1. `scripts/flow/lib/skill-links.js`: the essential test (group folder from `scripts/flow/lib/skills.js`), the defaults, `apply`, the catalog, the header comment.
2. `scripts/flow/commands/skills.js`: the refusal in `on` and `off`, `ls` filtering.
3. `scripts/flow/commands/doctor.js`: `checkSkills` reports a line naming an essential skill. `checkAgents` may assume Flow skills on; check it.
4. `scripts/tests/skills.test.js` and `doctor.test.js`: a refusal test, an `ls` test, a doctor test, and any test assuming `review` starts on.
5. Run `npm test` in `scripts/`.
6. Docs: `docs/manual/reference.md` → `### flow skills` (the sample at line 492, the defaults, the refusal list) and `## The skills`; `docs/manual/settings.md` → `### skills` (defaults); `docs/dev/skills.md` and `skills/tools/file-findings/references/write-skills.md` together (the line saying every skill is shown until `off --machine`); `home/AGENTS.md` already says "`/flow:review`, if it's in your skill list"; the sample in `lab/context/management.md` line 624; `lab/context/state.md` → `## 12 skills`.
7. Writing pass on each file: `references/style.md`, plus `write-docs.md` for a page under `docs/`. No em dashes.
8. Report once: what is now true, one line per file.

## How to reply to this user

- **Feedback arrives dictated.** It is thinking unless it names a change and says to make it.
- **Before a big build, say its size and order in one line first.**
- **When the user asks to save context, stop and save.**
- **Pick the smallest change that works. Never regenerate a sample the user has seen.** Show only lines that change.
- **Nothing is released.** Never design for a machine set up with an older Flow.
- Everything in `CLAUDE.md` → `## The reply` holds.

## Facts found

- **No hook can edit the skill list Claude sees.** A `SessionStart` hook can return `reloadSkills: true` (`lab/research/claude-code-docs/hooks.md` line 1101). Whether that rescan reaches the plugin folder is untested.
- **`skillOverrides` skips plugin skills.** `enabledPlugins` switches a plugin whole.
- **`os.homedir()` follows `HOME`**, so a test moving `HOME` also moves where `machine.folders()` puts `~/.agents` and what `shorten` shortens.
- **`tmp/skills-try/`** holds a hand-run scratch machine with `env.sh`, left for poking at `flow skills`.

## Open, and waiting on the user

- **`find()` in `scripts/flow/lib/skills.js` has no caller.** Deleting it needs a yes.
- **`fileSuggestion` is undesigned**, talk first in `backlog.md`.
- **The 3 issue numbers** belong in `lab/context/claude-code.md` → `## Filed`.

## Loose ends nobody has raised

- **A git write ran unasked on 2026-09-20**: `git rm --cached` staged deleting `scripts/flow/lib/snapshots.js` and `commands/snapshot.js`.
- **2 tests fail under load and pass alone**: the worker-diff case in `changes.test.js`, and one in `restore.test.js`.
- **The scorecard records use a `kind` field.**
- **`docs/dev/layout.md` says Claude Code never reads an `AGENTS.md`.**
- **2 untracked files no session of ours wrote**: `lab/context/context-7-alternatives.md` and `context7-report.md`.
- **util's `~/.util/sources`** keeps naming `~/.flow/repos/util` after an uninstall.

## Where to look things up

- **Claude Code**: `lab/research/claude-code-docs/`, and `https://code.claude.com/docs/en/<page>.md` for any page.
- **Codex**: `repos/codex/codex-rs/`, read with `cat`, never edited.
