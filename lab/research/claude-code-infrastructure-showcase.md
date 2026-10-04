# Claude Code Infrastructure Showcase

Read 2026-10-04 from `repos/workflows/claude-code-infrastructure-showcase/`. About 10,000 stars, MIT. A library of hooks, skills and agents to copy into a project, from 6 months on a TypeScript project. Not a tool to install.

## How it works

**A hook picks the skill from the prompt.** `skill-rules.json` gives each skill keywords and regular expressions. A `UserPromptSubmit` hook matches the prompt against them, and tells the agent which skill to use. An optional mode asks a model instead.

**A second hook blocks the first edit until the skill is read.** Before `Edit` or `Write`, the hook checks the file path against each skill's patterns. A mandatory skill not yet loaded blocks the edit once. The second try goes through, so the agent never loops.

**Dev docs survive a reset**: `/dev-docs` writes a plan, a context file and a task list per task under `dev/active/<task>/`. Flow's tickets do the same job.

## What Flow could take

**The two-try block proves a skill can load on a matching file today, with no mod.** `README.md` → Coming next promises "rules loaded the moment a matching file is written", through mods. A `PreToolUse` hook does it now: block the first write to `*.tsx` until the domain skill for React is read. Joined to `lab/backlog/after-v1.md` → the `paths:` item.
