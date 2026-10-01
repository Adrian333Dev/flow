Last checked: 2.1.286 (2026-10-01)

# Claude Code releases, read against Flow

Line 1 is the newest release read. `bash lab/scripts/claude-code-changes.sh` prints every release after it, and the root `CLAUDE.md` → `check-claude-code-updates` says how to read them. A release with nothing for Flow gets no entry. Newest first.

Each entry names the change, then what it touches in Flow, then the action: none, a backlog item, or a tool to use.

## 2.1.286, read 2026-10-01

- **2.1.286: ctrl+enter while a skill's own shell command runs moves the command to the background instead of ending it.** `/flow:review` runs `flow audit index --quiet` as it loads. Sent early, the review can read an index the command has not finished. Action: none. The review still reads the last full index.

## 2.1.214 to 2.1.285, read 2026-09-30

The catch-up: 61 releases, from the one current when Flow began on 2026-07-18. Every page in `claude-code-docs/` was downloaded again the same day, and `plugins-loading.md` now comes from `plugins/loading.md`.

- **2.1.284: a terminal session with no permission mode set starts in auto mode, on every plan.** Flow's `home/settings.json` sets `defaultMode` to `"default"`, which still wins. The setup, project setup and update sessions each pass `--permission-mode`. Claude Code asks once whether to switch the setting to auto mode, and 2.1.285 shows that question more widely. A yes rewrites `~/.claude/settings.json`, and `flow doctor` then reports `defaultMode`. Action: none. Expect the question in the beta.
- **2.1.284: a rule file linked into a project's `.claude/rules/` from outside the project now asks for approval.** Flow links `rules/comments.md` into `~/.claude/rules/`, which is not a project's folder. Action: none.
- **2.1.281: `rm -rf "$(pwd)"` and similar asks even under a bare `Bash` allow rule.** Claude Code's own check, beside `guard.js`. Action: none.
- **2.1.280: a write through a symlink is judged by where it lands.** `acceptEdits` and allow rules no longer approve a write that lands outside the working folders. The setup session adds `~/.flow` as a folder, so `~/.agents/AGENTS.md`, a link to `~/.flow/AGENTS.md`, stays inside. A project session editing a Flow skill through its link into the clone now asks. Action: none. Watch it in the beta.
- **2.1.277: Claude Code reads `AGENTS.md` directly in a project with no `CLAUDE.md`.** `project-template/CLAUDE.md` is the one line `@AGENTS.md`. Action: keep the import. The docs say some sessions cannot read `AGENTS.md` directly, and any `CLAUDE.md` above the project switches the direct read off.
- **2.1.275: skills and plugins turned on for the claude.ai account sync into terminal sessions.** Synced plugins need 2.1.273. A synced plugin loads as `<name>@synced`, with no install record and no marketplace. `scripts/flow/setup/machine.md` step 3 finds plugins in `installed_plugins.json` alone, so the setup survey never sees one. `claude plugin uninstall`, the only removal line 60 allows, cannot remove one, since `claude plugin disable <name>@synced` is the documented way. `scripts/flow/lib/skill-links.js:333` misses them the same way. Synced skills are covered: step 3 reads `~/.claude/skills/synced/`. Action: done 2026-09-30. Setup and `flow skills ls` list plugins through `claude plugin list --json`, and setup switches a synced one off with `claude plugin disable <name>@synced`. The disable writes `"<name>@synced": false` into this machine's `~/.claude/settings.json` alone, so claude.ai keeps the plugin on. Setting `CLAUDE_CONFIG_DIR`, even to `~/.claude`, makes `claude plugin list` leave synced plugins out.
- **2.1.271: `omitClaudeMd` in an agent's frontmatter runs a subagent without the rule files.** Action: none. `agents/haiku-worker.md` builds plan steps and needs the rules, the git ones included.
- **2.1.261: `/skill-doctor` shows which loaded skills go unused, and what each costs in context.** Action: none. What loads at session start is about 4,000 tokens, and shrinking the skills is pass 3's.
- **2.1.251 and 2.1.260: `/cost` shows a prompt-cache line per session, with the likely cause of each miss.** The status line gets the same as `prompt_cache`. Action: none. A skill loads as a message at the end of the conversation, so it never invalidates the cache.
- **2.1.257: a plugin component path that is a symlink leading outside the plugin is refused.** Every Flow skill in `~/.agents/skills/flow/skills/` is a link into the clone. Claude Code 2.1.275 loaded the set that way on 2026-09-18, by `lab/context/state.md`. Action: none. Check the skills load on the beta install.
- **2.1.232: a subagent starts in the background by default, and fork subagents are on by default.** `changes.js --wait` already waits in the background through `asyncRewake`, so the change record still arrives. `home/settings.json` denies `Agent(fork)`. Action: none.
