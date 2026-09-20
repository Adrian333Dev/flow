# Claude Code: where it keeps its files

One file per harness, in `~/.flow/references/harnesses/`. `/flow:setup-machine`, `/flow:setup-project` and `/flow:migrate` read every file in that folder, so a second harness is a file written here and no skill edited.

Claude Code's own paths, never Flow's. `flow doctor` reports what Flow owns, and `scripts/flow/lib/installed.js` is the list behind it.

**The config folder is `~/.claude`, and `CLAUDE_CONFIG_DIR` replaces it.** Read that variable before naming any path below. `~/.claude.json` sits beside the folder by default, and inside it as `$CLAUDE_CONFIG_DIR/.claude.json` once the variable is set.

## On the machine

Under the config folder, except the last 2.

- **`CLAUDE.md`**: the rules loaded at the start of every session.
- **`rules/<name>.md`**: more rules. One with no `paths:` line loads at launch, and one carrying `paths:` loads the first time a session reads a file it matches. The folder is read to any depth, and a symlink is followed.
- **`settings.json`**: hooks, permission rules, environment variables, the model, and which plugins are on.
- **`skills/<name>/SKILL.md`**: one skill, found 1 level deep. A folder here holding `.claude-plugin/plugin.json` is a plugin instead, and the skills inside it load from its own `skills/<name>/SKILL.md`.
- **`plugins/`**: every plugin installed from a marketplace, written by Claude Code.
- **`agents/<name>.md`**: one subagent. **`commands/<name>.md`**: one prompt, typed `/<name>`. **`output-styles/`**, **`workflows/`**, **`themes/`** and **`keybindings.json`**: how a session answers, and how it looks.
- **`agent-memory/<agent>/MEMORY.md`**: what a subagent carries from one run to the next, written by Claude Code.
- **`projects/<project>/memory/MEMORY.md`**: auto memory for one project, written by Claude Code and kept here rather than in the project. Topic files sit beside that index. `<project>` is the repository's path with every character that is not a letter or a digit turned into `-`.
- **`projects/<project>/<session>.jsonl`**: one transcript per session, holding every message and every tool result. `cleanupPeriodDays` deletes old transcripts and leaves the memory folder beside them.
- **`.credentials.json`**: the login. **`history.jsonl`**: every prompt typed. **`file-history/`**, **`shell-snapshots/`**, **`paste-cache/`**, **`debug/`**, **`plans/`**, **`sessions/`** and **`backups/`**: what a running session leaves behind.
- **`~/.claude.json`**: app state, the sign-in session, per-project trust, and the MCP servers added for the user or for one project. An MCP server is an outside process a session loads tools from. Claude Code rewrites this whole file whenever a session changes any of it.
- **`/etc/claude-code/managed-settings.json`** on Linux and WSL: settings an administrator deployed, beating every file above.

## In a project

- **`CLAUDE.md`** at the root, or **`.claude/CLAUDE.md`**: this project's rules. **`AGENTS.md`** loads as well, on its own or beside `CLAUDE.md`. **`CLAUDE.local.md`** at the root: the user's own rules for this project, loaded beside `CLAUDE.md`.
- **`.claude/settings.json`**: committed, and shared with whoever else works here. **`.claude/settings.local.json`**: never committed, and Claude Code writes each permanent "don't ask again" approval into it. It sits at the repository root, which a worktree resolves to the main checkout.
- **`.claude/rules/`**, **`skills/<name>/`**, **`commands/`**, **`agents/`**, **`output-styles/`** and **`workflows/`**: the same 6 as on the machine, for this project alone. Where a machine skill and a project skill share a name, 1 of the 2 survives, the machine's, with no warning.
- **`.claude/agent-memory/<agent>/MEMORY.md`**: what a subagent defined here carries between runs, written by Claude Code. **`.claude/agent-memory-local/<agent>/MEMORY.md`** beside it is the gitignored half.
- **`.mcp.json`**, at the root and never inside `.claude/`: the MCP servers this repository offers. Each one waits for the user's approval before it connects.

## What a migration may name

- **Every path above takes a `write`, a `delete` or a `move` line**, under the 4 rules below.
- **Never a transcript, a cache or the login.** `projects/`, `history.jsonl`, `file-history/`, `shell-snapshots/`, `paste-cache/`, `debug/`, `sessions/`, `backups/` and `.credentials.json` are a session's own working state, hundreds of megabytes of it, and nothing in Flow needs any of it moved.
- **`~/.claude.json` changes through a `run` line.** Claude Code rewrites that file itself, so a new version built minutes ago drops whatever a session wrote in between, and the changed-file check refuses the migration anyway.
- **A project's auto memory is a machine path.** `~/.claude/projects/<project>/memory/` holds it, so a project's migration names a folder outside the project.
- **Settings merge key by key**, an administrator's file over the project's local file, over the project's committed file, over the machine's. Permission rules from every one of them hold at once. A migration that moves 1 key names the file holding that key and leaves the rest where it is.

**Every file here is read when a session starts.** What a migration changed reaches the next session, never the session that applied it.
