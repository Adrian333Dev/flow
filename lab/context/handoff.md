# Handoff

Written 2026-09-19. Read it once, then rewrite it whole next time.

**Next: the discussion carries on, and nothing from 2026-09-19 is built.** 2 threads wait on the user: `flow uninstall` and working on more than one machine, both under `## Open` below. When the user says build, one pass runs to the end:

1. Write every decision under `## Agreed on 2026-09-19` into `backlog.md` and `lab/context/management.md` → `## Snapshot and restore`.
2. Build the snapshot rework in `scripts/apply-migration.js`, `scripts/flow/lib/snapshots.js` and `scripts/flow/commands/snapshot.js`, with its tests.
3. Build `flow install`'s 5 changes, the first line of `backlog.md` → `### The management skill, in build order`, with `flow uninstall` beside them.

Read `lab/context/state.md` first: it says what is built today.

## Built on 2026-09-18, and still as built

- **A migration and its snapshot are 2 folders.** `/flow:setup-machine`, `/flow:setup-project` and `/flow:migrate` will write `~/.flow/migrations/<machine or project>/<date-time>/migration.md` and `files/`. After the yes, the skill runs `~/.flow/scripts/apply-migration.js <id>`, which copies each path into `~/.flow/snapshots/<same folder name>/<date-time>/` before changing it. `docs/manual/reference.md` → `## Migrations and snapshots` holds the user's side.
- **The out-of-date check**: the script refuses when a file a `write` or `delete` line names changed after the time in the migration's folder name. Snapshots and restores keep each file's modified time, so a restored file never reads as changed.
- **"Plan" means only a ticket's plan.** `references/workflow.md` → `## The pieces` defines Migration beside Ticket.
- 123 tests passed.

## Agreed on 2026-09-19

Each was proposed in a reply and drew no objection, so each is agreed. None is built or recorded anywhere but here.

### What a snapshot holds

- **A snapshot copies 2 sets**: the files `flow install` creates, and every path any applied migration named. The agent's choices reach the snapshot through the migration's lines. There is no list file, and snapshots never wait on the per-harness files in `backlog.md`. This replaces 2 designs from the same day: a list of the whole setup written by the setup skill, and a list of every place each harness keeps things.
- **A skill, MCP server or plugin the user adds later is in neither set**, so restore never touches it. The user asked for this, to keep it simple.
- **Copying is the only mechanism.** Never a recorded install command: most tools leave no record of how they were installed, and `npx skills` reinstalls the newest version rather than the one the user had. The user agreed outright.
- **Restore is a plain copy**: each path goes back whole. Restoring an older snapshot first restores every later one, newest first, so no 2 migrations are left half each.
- **A file shared by Flow and later changes goes back whole.** `~/.claude/settings.json` is the case: a plugin enabled later stays installed but switched off. Restore's output names every file it put back, and the snapshot restore takes of itself keeps the later version.
- **Fix needed, found 2026-09-19**: `record()` in `lib/snapshots.js` marks a missing path absent at its highest missing folder. A migration writing `.flow/domain-skills.txt` into a project with no `.flow/` records `.flow` itself, and restore then deletes every ticket made since. Restore must delete only the files the migration created, then each folder it created only while that folder is empty.
- **Hard links**: each snapshot hard-links every file unchanged since the previous snapshot, so only the first copy costs space. Deleting one snapshot never damages another.
- **Links are copied as links.** Logins are never copied: `~/.claude/.credentials.json` and `~/.codex/auth.json`.
- **`~/.claude.json` is copied whole**, when a migration names it. It holds no token. Setup names it only in the competitor test, which removes a plugin or MCP server that does Flow's job, or limits it to one project, through `claude plugin uninstall` or `claude mcp remove`. Every other plugin and MCP server stays untouched.
- **Restore runs with every Claude Code session closed**, since a running session rewrites `~/.claude.json`.
- **Tickets are never in a snapshot.** A project's work travels and is undone through its own git.

### Commands

- **`flow snapshot new "<note>"`** copies the same 2 sets on demand, for testing. The note shows in `flow snapshot ls`. It stays after testing ends.
- **`flow snapshot drop <id>`** deletes a snapshot. Deleting its folder by hand does the same. Whether a migration ran moves out of its snapshot and into the migration's own folder, so a deleted snapshot never makes a migration look unapplied.
- **The agent cannot run the dangerous commands.** Flow's `~/.claude/settings.json` carries `deny` rules for `flow snapshot restore`, `flow snapshot drop` and `flow uninstall`. The user runs them in a terminal or with `!` in a session. An `ask` rule covers `apply-migration.js`, and Claude Code's prompt becomes the yes, replacing the yes typed in chat. A rule matches the command as written, and auto mode's classifier is the second check. Codex gets the same through `~/.codex/rules/` when its support comes. sudo was rejected: a restore run as root leaves files Claude Code can no longer write.

### Install and description

- **One command installs Flow**: `curl -fsSL https://raw.githubusercontent.com/Adrian333Dev/flow/main/install.sh | bash`. It downloads Flow and util where missing, runs `flow install` and `util install`, then starts Claude Code with `/flow:setup-machine`. The toolbox and domain skills stay out, since Flow runs only util's commands. It is the setup script `backlog.md` → **Build Flow for a stranger** allows. A Claude Code plugin cannot do it: a plugin installs only into Claude Code's own folder.
- **`skills/.claude-plugin/plugin.json`'s description becomes**: "An opinionated workflow for solo developers. Turns scattered ideas into tracked, finished work. Runs on Claude Code; Codex and other coding agents coming soon." `README.md` already says Codex is unsupported.

### Skills installed with `npx skills` update themselves

- The `SessionStart` hook planned for the domain-skills pull, in `backlog.md`, also updates them. One setting, `skillsAutoUpdate`, replaces `domainSkillsAutoUpdate`.
- Flow computes each skill folder's git tree hash from disk and runs `npx skills update <name> -g` only where it still matches the lock file's `skillFolderHash`. An edited skill is reported and never updated.
- Lock entries whose folder is gone are skipped.
- Flow reads `~/.agents/.skill-lock.json` and never writes it. `/flow:setup-machine` reports where each outside skill came from, and every entry whose folder is gone.

## Open

- **`flow uninstall`.** The user ruled it deletes everything Flow put on the machine, snapshots included. Proposed on 2026-09-19, no answer yet:
  1. It lists what it will change and delete, and waits for the user to type `uninstall`.
  2. It restores the snapshot taken before the first setup, for the machine and every project. Deleting alone would leave Flow's hooks in `~/.claude/settings.json` pointing at a deleted `~/.flow/scripts/`, Flow's rules in `~/.agents/AGENTS.md`, and the competitors setup removed still gone. After step 3 no snapshot is left to do it.
  3. It deletes `~/.flow/` whole, everything `flow install` created, and the Flow folder if the install script downloaded it.
  - Each project's `.flow/` stays, since its tickets are the project's own work. The output lists the projects holding one.
  - Step 2 depends on the `record()` fix above.
- **Working on more than one machine.** Written into `backlog.md` on 2026-09-19 as **Working on more than one machine**, with the scope, the sync moments and the open project question. The user asked for a dedicated page, `lab/context/multi-machine.md`, once the design starts. The user's points: `SessionEnd` is not enough, pulls must be automatic too, and saving uncommitted work, `util git save`, belongs to the same design.

## Facts found on 2026-09-19

Nobody needs to look these up again.

- **Sizes on this machine**:
  - `~/.claude/` is 433 MB across 29 entries: `projects/` 348 MB of transcripts, `file-history/` 40 MB, `plugins/` 33 MB (23 MB of marketplaces, 9 MB of installed plugins).
  - The setup entries in `~/.claude/` are `CLAUDE.md`, `settings.json`, `skills/`, `plugins/` and `scripts/`, the last holding the user's own scripts.
  - `~/.codex/` is 1.8 GB: `skills/` 806 MB, `packages/` 354 MB, `sessions/` 237 MB, `logs_2.sqlite` 119 MB.
  - `~/.agents/` is 64 KB, and `~/.flow/` does not exist.
- **Codex SEO**, 805 MB in `~/.codex/skills/seo/`: its `install.sh` downloads `AgriciDaniel/codex-seo` at `v1.9.6-codex.5` into a temporary folder. It then copies 27 skill folders into `~/.codex/skills/` and 24 agents into `~/.codex/agents/`, and builds `seo/.venv/`, which is 803 MB. `AgriciDaniel/claude-seo` is a real Claude Code plugin, installed with `/plugin marketplace add AgriciDaniel/claude-seo` then `/plugin install claude-seo@agricidaniel-claude-seo`, with `install.sh` and `uninstall.sh` beside it. Both READMEs and the installer are saved in `tmp/seo/`.
- **`~/.agents/.skill-lock.json`** belongs to Vercel's `skills` tool, run as `npx skills`. Versions 1.5.19 and 1.5.26 sit in `~/.npm/_npx/`.
  - `add -g` copies a skill into `~/.agents/skills/`, links it into each harness picked, and writes an entry.
  - `remove -g` deletes both.
  - `update` compares the source repository's GitHub tree hash with `skillFolderHash` and never reads the local copy.
  - `experimental_install` rebuilds only from a project's own `skills-lock.json`.
  - `XDG_STATE_HOME` moves the file.
  - It lists 9 skills, and 3 exist on disk. The 6 missing: `caveman`, `diagnose`, `grill-me`, `zoom-out`, `grill-with-docs`, `setup-matt-pocock-skills`.
- **`~/.claude.json` holds no login token.** Its `oauthAccount` is the account's profile: name, email, organization. The token is in `~/.claude/.credentials.json`. The Claude Code settings page still calls the file's contents an OAuth session.
- **Hooks**, from `tmp/docs/hooks.md`: `SessionEnd` reasons are `clear`, `resume`, `logout`, `prompt_input_exit` and `other`. Its hooks share a 1.5-second budget, which a `timeout` raises to at most 60. `Stop` runs after every answer, and not on a user interrupt.
- **Permissions**, from `tmp/docs/permission-modes.md` and `auto-mode-config.md`: an `ask` rule prompts even in auto mode, a `deny` rule blocks in every mode, and `dontAsk` mode denies what an `ask` rule matches.

## Loose ends nobody has raised yet

- **The `changes.test.js` race was caught again** on 2026-09-18: `1 file changed` where 2 were expected, the shape `backlog.md` already records. The output is saved at `tmp/test-fail-changes.txt`.
- **`lab/context/management.md` predates the move to `AGENTS.md`.** Where it says `~/.claude/CLAUDE.md` holds the rules or the profile sections, read `~/.agents/AGENTS.md`.
- **`find()` in `scripts/flow/lib/skills.js` has no caller.** Deleting it needs the user's yes.
- **This repo has no `AGENTS.md`, so Codex working on Flow reads none of `CLAUDE.md`'s rules.** Say so only if the user starts working on Flow in Codex.
- **The scorecard records use a `kind` field**, against `type-never-kind`.
- **`lab/context/context-7-alternatives.md` and `context7-report.md` appeared untracked**, and no session of ours wrote them. Ask before touching either.
- **`docs/manual/where-everything-lives.md` lists `~/.flow/tickets/`**, and `references/workflow.md` has none. The multi-machine item now counts it among what travels.

## Where to look up anything about Codex

The Codex source is the documentation. There is no page set like `lab/research/claude-code-docs/`. The places to look, in order:

- **`repos/codex/codex-rs/`**, read with `cat` and `grep`, never edited. `ext/skills/` covers skills, and `ext/skills/src/loader/namespace.rs` decides each skill's `flow:` prefix. `utils/plugins/` covers manifests. `hooks/` covers hooks, and `core/src/hook_runtime.rs` fires them. `execpolicy/` covers the rules files. `codex-home/` holds the global instructions loader. `external-agent-migration/` is the importer. `login/src/auth/` holds the login renewal. `ext/memories/` and `config/src/types.rs` → `MemoriesToml` cover memory. `SandboxWorkspaceWrite` in the same file holds `writable_roots`, and `sandbox_permissions: require_escalated` is how a command asks to run outside the sandbox.
- **GitHub issues on `openai/codex`**, searched through the API with no token. Issue 25042 gave the 64-character limit on a `plugin:skill` name.
- **`learn.chatgpt.com/docs/`**, for what a feature is meant to do rather than how it works. Fetch the raw text and strip the markup.
- **`repos/codex/docs/`**: `config.md`, `agents_md.md`, `slash_commands.md` and `sandbox.md`.
- **A live run**, where the source leaves it open: `bash lab/scripts/try.sh --codex --print`, then `codex exec --sandbox read-only "<question>"` from `tmp/try/project` with the printed environment. The session log under `tmp/try/root/.codex/sessions/` shows exactly which skills and rules Codex was handed.

## Claude Code's current pages

`lab/research/claude-code-docs/` was saved on 2026-08-14 and has gone stale in places. `tmp/docs/` holds 5 pages fetched on 2026-09-18: `permission-modes.md`, `auto-mode-config.md`, `hooks.md`, `costs.md` and `skills.md`. `https://code.claude.com/docs/en/<page>.md` returns any page as markdown.

## The writing faults, so they stop

`lab/context/rejected-replies.md` holds 15 cases. The ones most likely to recur, the last 2 from 2026-09-19:

- **`## A simple thing explained as a hard one`**: a colon fragment standing for a sentence, an abstract noun before the concrete file, a reason attached to every statement. Say the thing in one short sentence first, and name the file in it.
- **`## What the reader never got`**: a mechanism written with no actor and no moment. Every step names the thing that performs it and when it runs.
- **Asking for a yes.** A recommendation the user does not oppose is agreed. End a reply on what happens next.
- **A mechanism stated without a walked case.** "Snapshots keep each file's modified time … otherwise restoring a stopped run and running it again would be refused" drew anger. The same point walked with clock times, 10:12 written, 10:30 applied, 10:35 restored, 10:40 applied again, landed.
- **A file named where its content belongs.** "They start from the harness files already in `backlog.md`" made the user ask how `backlog.md` related at all. Say what the thing is, and that it does not exist yet, before naming where it is written down.
