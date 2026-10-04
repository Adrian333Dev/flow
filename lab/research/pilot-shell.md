# Pilot Shell

Read 2026-10-04 from `repos/workflows/pilot-shell/`. Named Claude CodePro until a rename, by Max Ritter. About 2,100 stars. **Paid and closed**: its license reserves every right, a license key activates it, and customizing it needs the Team or Enterprise plan. Its pitch: "a professional context and harness engineering system, not a collection of rules and skills", for Claude Code and Codex.

## How it works

**Hooks run around every step**, 26 entries over 10 events, in Python:

- a context meter warning once at 90%
- a `PreCompact` hook saving the plan and the task, and a hook after compaction putting them back
- stop guards keeping a workflow open until its checks pass
- a file checker per language, Python, TypeScript, Go and .NET, plus a test-first checker
- a hook steering searches toward its own indexed search tools

No hook guards against a destructive command. Claude Code's own permissions are the only stop.

**17 rule files**, the language standards loading only for files of that type.

**4 workflows**: `/spec` for an approved plan, `/build` for a goal checked against criteria, `/fix` for a bug, `/prd` for an unclear problem. Each writes its files under `docs/`. 5 more run on demand, `/create-skill` and `/benchmark` among them.

**Memory runs in the background.** A cheap model turns session evidence into notes, stored in SQLite. Team sharing writes them to `.pilot/memories/<author>/<date>.jsonl`, which travels with commits. Curated notes sit in `.pilot/knowledge/`. Its docs say memory is "historical evidence, not proof of current code".

**A local web page, the Console**, shows plans and diffs to annotate, past sessions to recover, and usage.

**Install** is an 8-step script adding Homebrew, Python 3.12, uv and jq, then 8 tools of its own: a code search, a code graph, ast-grep, 2 browser tools, and 2 design tools.

## Against Flow

The closest to Flow in shape: one install, hooks around every step, memory, and state carried across compaction.

What Pilot Shell has that Flow lacks:

- Codex support
- a web page for review
- per-language checks on every edit

What Flow has that Pilot Shell lacks:

- **Tickets kept in git.** Pilot's plans are files under `docs/`.
- **A guard on destructive commands.**
- **Learning that changes the agent.** Pilot's memory is a store the agent searches, beside its rules and skills, never into them.
- **Sync across machines** past what git carries.
- **Skill management.**
- **Open source.** Flow is MIT. Pilot Shell is paid and closed.

## What Flow could take

Nothing new. Flow already has the context meter (`context-check.js`) and the compaction guard (`compact-check.js`). Its web page is what `lab/backlog/beta.md` → the mods item plans as a ticket board inside Claude Code.
