# The beta

Flow installed on this machine and used for real work, for 2 to 3 weeks. How an item is written: `docs/dev/layout.md`, the `backlog/` entry.

## Checklist

Each line is tried once in real use, then deleted.

- [ ] **Install Flow on this machine: the first real install, and the acceptance test.** The release order: push without a tag, install here and check it works, then tag and announce. The 9 outside skills and plugins on this machine have been kept untouched since 2026-09-15 to be the test material. `never-install` holds until the user says the day has come. `management.md` → `## Faults found by the attack, 2026-09-17` records the machine as it stands.

- [ ] **`flow update` on its first real update**: the whole update in one word, for the machine and for the project it is typed in. Built 2026-09-26: it pulls the clone and its submodules, then opens a Claude Code session per place that is behind, which reads the upgrade guides and writes one form. The first real update is entry 2, the first change after Flow is installed. No run has shown whether `flow audit session` lists the hooks a `claude -p` session fired, and the proof step relies on it. `management.md` → `## Migration is a session flow up opens, ruled 2026-09-26`

- [ ] **Migrate Delapse, with its project-local skills converted**: `flow init` on a real project, and where its conventions route into the project `CLAUDE.md` and `docs/context/`. Its skills are not Flow's. Each is copied into `<project>/.claude/skills/<name>/` and committed with Delapse, or vendored into Flow's tree under a group once a second project wants it. `management.md` → `## Project setup is a command, ruled 2026-09-25`, `skills.md`

- [ ] **The second machine.** Install, check and re-install across the user's 2 machines. `~/.flow/` is one private git repository, `flow sync` brings the other machine's work down and sends this one up by hand, and `scripts/lib/machine/flow-repo.js` holds it, built 2026-09-20. What stays on one machine is `version`, `run.json`, `originals/`, `settings.local.json`, the `scripts` and `references` links, and each wiki tool's `downloads/`. The questions left, each waiting for a real case:
  - **Nothing syncs by itself.** `SessionEnd` fires only on exit, `/clear`, `/resume` and `/logout`, never on `/compact`. Its hooks share a 1.5-second budget, too short for a push, and a session left open on one machine never ends. Proposed 2026-09-19: a background commit and push from `Stop` after every answer that changed `~/.flow/`, and a background fast-forward pull from `SessionStart` and from `UserPromptSubmit` once the last pull is 5 minutes old.
  - **What Flow does not carry at all**: `~/.claude/settings.json`, the plugins a machine has enabled, and its MCP servers. Each is Claude Code's own file, outside `~/.flow/`, and a copy of one would carry the other machine's paths and keys.
  - **A Flow update reaching one machine before the other.** The 2 clones sit at different commits, so `~/.flow/version` differs and a migration that ran on one has not run on the other.
  - **The transcripts and the audit index stay put.** `~/.claude/projects/` is 351 MB on this machine and `audit/audit.db` is derived from it, so neither travels and `flow audit` answers about one machine.
  - **Nothing tells Claude what arrived.** A note written on the other machine is on disk after a sync, and no session mentions it.
  - **Whether `migrations/` should travel.** It does today, since nothing ignores it. It is history rather than state, and its paths are the other machine's.
  - **Each machine holds projects, clones and plugins the other never had.** Raised by the user 2026-09-20. The `~/.flow/` that arrives then describes a machine that is not this one. Open: whether the setup session `flow install` opens runs a second time, on request, to harvest what the new machine already carries.
  - **A project travels through its own repository**, settled rather than open. Its `.flow/`, tickets included, is committed with it, so only uncommitted work stays behind, and `util git uncommitted send` carries that on the rare day it is left. Flow leaves projects alone, ruled 2026-09-20.

- [ ] **The agent pushes back on a weak suggestion from the user.** `disagree-before-building` says to test a proposal, and on 2026-09-13 the agent argued for the user's idea instead. The user said the toolbox inbox felt more fitting as one file than as a folder, and the reply built 2 arguments for it that the folder already answered: `grep -r "^description:" inbox/` prints every waiting tool on one line, and `mv inbox/owner_repo.* <folder>/` moves a pair in one command. On 2026-10-02 the user made the rule harder: whatever the user says is a claim to test, never a fact. Watch whether the rule holds. Still open: whether to re-test the decisions that started as the user's suggestion.

- [ ] **`## The reply` against the next rejected reply.** It replaced `## Explaining` on 2026-09-16, built against the 14 recorded failures in `lab/context/rejected-replies.md`: 3 ordered steps and 5 tests run on the finished draft. Whether the 5 tests fire is unknown. A failure the tests do not catch is the signal to change the shape again, never to add a sixth test. `rules.md`

- [ ] **2 change-record cases never seen in a real session.** When a subagent edits files, Flow hands the main session a record of which files changed. Both cases are unit-tested. `docs/dev/agents.md`
  - A subagent that finished and is resumed by typing into its row: its record should arrive with the main session's next tool call.
  - A record left with nobody waiting for it.

- [ ] **A worker that starts its own subagent**: that subagent's changes carry its own id, and whether the delivery reaches the top parent is unverified. `docs/dev/agents.md`

- [ ] **How a design plugin gets used**, decided after its first real run in a project: what fires it, whether design work is its own phase, what happens when 2 of them disagree, the boundary with `/flow:visualize`, what comes back into Flow afterwards. Flow works without one. `skills.md`

- [ ] **About 10 rule checks before V1**, chosen from rules real sessions break, per the workflow notes and the failure log, and only where a script can decide from the edit alone. Writing them tests the guide, `skills/tools/file-findings/references/write-checks.md`. Asked by the user 2026-09-29. `lab/archive/manual/rule-checks.md`

- [ ] **Study beta sessions with `/cost` and `/skill-doctor`**, 2 of Claude Code's own commands. `/cost` names the likely cause of each prompt-cache miss, a turn where context that should have been reused was sent again. `/skill-doctor` shows what each loaded skill costs in context, and which ones never get used. Kept for the beta by the user on 2026-10-02, after both left the simplify pass on 2026-10-01. A skill may read what they report later. `lab/research/claude-code-updates.md` → 2.1.251, 2.1.260 and 2.1.261

- [ ] **Build Flow's mods, in the build order the research sets.** A mod is a plugin whose JavaScript runs inside Claude Code at every event, and can draw in its screen. Mods arrived in Claude Code 2.1.287. Ruled by the user 2026-10-02: the beta ships on Flow's command hooks, and mods get built during the beta, live in this repo. The first step probes 4 open questions, then come the watch-only mods replacing `context-check.js`, `compact-check.js` and the status line. `lab/research/claude-code-mods/README.md` → `## Build order`

## Found in use

What the beta turns up. A note from `~/.flow/workflow-notes.md` lands here as an item, or joins the item it repeats.
