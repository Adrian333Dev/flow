# Handoff

Written 2026-09-18. The management skill's groundwork is finished, and the `flow:` prefix is built. Read once, then rewrite whole next time.

**The map is `lab/context/management.md` and it holds everything.** Every decision below has a dated section there with its argument. This file only says where the walk stopped and what to avoid.

## Built 2026-09-18: the `flow:` prefix, from a plugin manifest both harnesses read

**Every Flow skill is now typed `/flow:groundwork`, and the prefix appears nowhere in the clone.** The 2026-09-17 sweep that renamed 12 folders to `flow:<name>` was reverted in full, by `mv` and `git restore`, and `flow-review` became `review` in the same pass.

`flow install` links the 12 skills into `~/.claude/skills/flow/skills/` and copies `home/plugin.json` to `~/.claude/skills/flow/.claude-plugin/plugin.json`:

```json
{
  "name": "flow",
  "description": "An opinionated workflow for solo devs on Claude Code and Codex. Turns scattered ideas into tracked, finished work."
}
```

Claude Code reads that file because the format is its own. Codex reads the same file: `repos/codex/codex-rs/exec-server-protocol/src/protocol.rs` lists `.claude-plugin/plugin.json` second of the three manifests it accepts. So one word gives `/flow:groundwork` in Claude Code and `$flow:groundwork` in Codex, and changing it renames every command in both at once.

**Proven, not assumed.** A scratch session from `bash lab/scripts/try.sh --fresh` reported `flow@skills-dir  Status: ✔ loaded`, and asked to name its own skills it answered `flow:groundwork`, `flow:handoff`, `flow:visualize`. All 116 tests pass, including the 2 that were failing before the revert.

**The argument, the two dead ends and the Codex evidence are in `lab/context/skills.md`, in the section on Flow being a plugin of its own.** Do not re-derive them. The short form of the dead ends: a colon inside a personal skill's frontmatter `name` is rejected by Claude Code outright, and a prefix baked into the name renders `/flow:flow-setup` once the manifest is there too.

### What it left behind

- **The old links at `~/.claude/skills/<name>` would be orphans on a real machine.** Nothing is installed here, so none exist; on a machine that had an earlier install, `flow install` leaves 12 working links beside the new plugin, and removing them is a delete needing its own yes.
- **`flow skills ls` prints `STATE` and `SET BY` columns that now say the same thing on every row**, because `skillOverrides` does not reach a plugin's skills. The item that cuts them is in `backlog.md` → `### The skill system`.
- **`flow doctor`'s override check was inverted**: it used to flag a key naming no skill in the clone, and now flags a key naming a Flow skill, which is the one that does nothing.

## The groundwork is finished, and the work is a list

**All 4 phases ran on 2026-09-17.** The walk closed all 8 branches; the attack ran one real case, setup on this machine, end to end and broke the design in 6 places, all 6 fixed in the sections they belong to; the route turned the map into 14 lines in `backlog.md` -> `## V1` -> `### The management skill, in build order`. **That list is the work, and it runs in the order written.** Nothing is built yet.

**Read that list first, not this file.** Its order: the 2 sweeps left over the repo, then `flow snapshot`, `flow install`, the changelog, `flow doctor`, `~/.flow/settings.json`, the `SessionStart` hook and the domain-skills pull, then `references/prerequisites.md` and the 3 skill bodies, then `flow up`.

**The route found one thing the walk had not.** `CHANGELOG.md` has been suspended since 2026-08-09, and a migration's whole input is the changelog entries newer than the date in `~/.flow/version`. `/flow:migrate` cannot ship until the file comes back, and lifting the suspension is the user's call. It is marked **talk first** on its line.

The 6 faults and their fixes are `lab/context/management.md` -> `## Faults found by the attack, 2026-09-17`, with the disk evidence for each. In short: this machine carries Flow's own leftovers from 2 clones with no `~/.flow/version`, so setup's survey looks for them first; `~/.claude/CLAUDE.md` exists at 0 bytes, so writing the rule file moves from `flow install` to `/flow:setup`; the snapshot records a symlink as a row rather than copying it; a settings key Flow's template does not carry is left alone; removing a marketplace plugin is an `enabledPlugins` edit; and a competitor that cannot be removed is a third outcome, because `~/.claude/skills/synced/` is pushed from the user's account.

## What was locked on 2026-09-17, in one line each

Every one has its own section in `lab/context/management.md`.

- **Setup and migration are two flows**, sharing only the snapshot at the front and `flow doctor` plus the version stamp at the back. The words are "setup" and "migration", because `flow install` already names the symlink command.
- **An unfinished run is `~/.flow/run.json`**, holding the type, the snapshot folder, the plan and the last step finished. Step 6 deletes it and stamps `~/.flow/version`.
- **A new `SessionStart` hook** prints one line when the machine or the project needs attention. `home/settings.json` has no `SessionStart` hook today; the reminder runs on `UserPromptSubmit`.
- **Everything Flow prints gets a switch in `~/.flow/settings.json`.** The reminder's `cat` becomes `reminder.js` so it can read the setting.
- **Flow stays a git clone**, and `flow up` is the whole update in one word. npm and a Claude Code plugin were both rejected.
- **Proof is 2 steps in step 6**: `flow doctor` reads the disk, then one `claude --print` session shows the wiring firing, read back through `flow audit`.
- **Prerequisites are checked by running the commands**, never by comparing a submodule commit.
- **A machine installs the last tagged commit**, never the tip of `main`. The tag's name is the changelog date. The user keeps pushing to `main`.
- **Domain skills pull themselves** at session start, behind 2 guards, with `"domainSkillsAutoUpdate": false` to switch it off. A skill may go global one at a time.
- **A run stops once, at the plan**, written to `~/.flow/snapshots/<date-time>/plan.md` as a file the user edits.
- **The competitor test is overlap**: does it instruct behavior on ground Flow already rules on. Behavior with no overlap stays.
- **A harvested line is dropped only when the plan names the Flow rule replacing it.** Nothing is deleted at harvest.
- **The auto-memory files live on the machine**, at `~/.claude/projects/<project>/memory/`, so setup reads them all without opening a project.
- **`settings.json` splits 3 ways**: `hooks` replaces, `permissions` merges, 7 opinion keys are each asked once.
- **The 2 personal sections stay inline** in `~/.claude/CLAUDE.md`. A separate `~/.flow/profile.md` was proposed and rejected: Codex has no import, so its copy would need rebuilding after every capture.
- **The answer job** reads `docs/manual/README.md` as its index, answers in one line plus a page and heading, and never rebuilds `/flow:start`. A `flow docs index` command was proposed and rejected by the user 2026-09-17.
- **The management skill is 3 skills**: `/flow:setup`, `/flow:migrate` and `/flow:help`, filed in `skills/tools/`, every one carrying `disable-model-invocation: true`. The prefix reaches them from the plugin manifest, so their folders and their frontmatter names are bare like every other skill's.
- **A typed-only skill is marked `(user invoked)`** on first mention in any file the agent reads.
- **A migration that changes the management skill** is applied by the old version, and the new one takes effect next session.
- **A whole-workflow replacement is the same 6 steps**, with step 5 writing Flow's own files whole rather than patching them. No size threshold, no second mode.
- **A session that applied a replacement is stale**, because rules load at launch. Proof runs in a fresh `claude --print` process for that reason.

## Code the walk found, none of it built

The user ruled on 2026-09-17: discuss, plan and record only, and build after the groundwork is done. Every line here is now a line in the build order, which says what it does and in what order; this list stays as the short form.

- `install.js:125` leaves an existing `~/.claude/CLAUDE.md` alone rather than rewriting it around the 2 sections. Until that changes, no migration can ship a new template.
- New commands the design needs: `flow up`, `flow snapshot new|ls|restore`, `flow doctor --updates`.
- `flow doctor` gains the version check, the `run.json` check, and the submodule note.
- `flow install` never prunes `~/.local/bin`, so a name Flow stops shipping stays on the machine forever.
- `flow install`'s closing message sends the user to `/flow:setup` instead of a manual settings merge, the first install on a machine snapshots itself, and `~/.flow/docs` becomes a link to the clone's `docs/`.
- The `(user invoked)` mark, including the live fault at `skills/phases/groundwork/references/write-spec.md` line 119, which says **invoke `/flow:cut-from-spec`** where the agent cannot.
- `references/style.md` splits into `style.md`, `write-rules.md` and `write-docs.md`.
- `.gitmodules` points `domain-skills` at an SSH remote while `util` and `toolbox` use https. All 3 repositories are public. Recorded in `backlog.md` -> `## V1` -> `### Install and migration`.
- Two small items from before this walk, proposed and never approved: `flow check` flagging a status outside the 8, and tests for `flow plan` on a parent with open children and `flow park` with no reason.

## The writing faults, so they stop

`lab/context/rejected-replies.md` holds 15 cases. Two of them came out of this walk:

- **`## A simple thing explained as a hard one`**: a colon fragment standing for a sentence, an abstract noun before the concrete file, a reason welded to every statement, the file name arriving at the end. Say the thing in one short sentence first, name the file in that sentence, then the reason only if one is needed.
- **`## What the reader never got`**, the first Opus 5 case: a mechanism written with no actor and no moment. Every step names the thing that performs it and when it runs.

## Codex comes before the rest of the management skill

**The user ruled on 2026-09-18 that Codex compatibility runs first**, because the management skill's 14-line build order was written against one harness and every line naming a `~/.claude/` path would be opened twice otherwise. The prefix above is the first piece of that port, already landed: skills carry across with no rename, no regeneration and no per-harness install step. **What is left of the port** is a second install root at `~/.agents/skills/`, which takes the same manifest copy and the same links, `AGENTS.md` generated from `home/CLAUDE.md`, `~/.codex/hooks.json`, subagents in TOML, and `flow audit` reading `~/.codex/sessions/`.

**The Codex source is the documentation, and it is now at `repos/codex`.** There is no page set to mirror `lab/research/claude-code-docs/`, and the prose at `learn.chatgpt.com/docs/` is thin. Everything decided above came out of Rust doc comments. Four places, in the order to use them:

- **`repos/codex/codex-rs/`**, the Codex CLI itself. `ext/skills/` is everything about skills, `utils/plugins/` is manifests and namespaces, `exec-server-protocol/src/protocol.rs` holds the constants, `core/` holds the session and hook plumbing. Read it with `cat` and `grep`, never edited, like every clone under `repos/`.
- **GitHub issues on `openai/codex`**, which OpenAI labels. Issue 25042 gave the 64-character limit on the qualified `plugin:skill` name, and 27659 confirmed colons reach the metrics layer. Search them through the API with no token.
- **`learn.chatgpt.com/docs/`** for intent rather than mechanism: `build-skills`, `build-plugins`, `plugins`, `developer-commands`. The pages are JavaScript-heavy, so fetch and strip the markup rather than reading rendered text. `developers.openai.com/codex/*` redirects there.
- **`repos/codex/docs/`**, four useful files: `config.md`, `agents_md.md`, `slash_commands.md`, `sandbox.md`. Its `skills.md` is a stub pointing at the web.

Two open standards sit under both harnesses and are why any of this works: `agentskills.io` for the `SKILL.md` format, and `agent-plugins.org` for `plugin.json`, schema at `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`, spec at `agentplugins/agent-plugins-spec`.

The port's costs per component are in `lab/context/models.md` -> `### What Flow costs to port to Codex`, the layout rule is the `.agents/` section beside it, and `backlog.md` -> `## After V1` -> **Flow on another harness and on another model** carries the original entry, which now belongs in `## V1`.
