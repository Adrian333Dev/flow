# Changelog — execute

## 2026-08-03

- Multi-source briefs are no longer conditional. `merge-files.js` is installed globally at `~/.claude/scripts/`, so it is always present — the "if the project ships it" fallback is gone.

## 2026-07-23

- Multi-source briefs marked optional: merge-files is a project utility (workflow-template projects ship `scripts/merge-files.js`), not a dependency of this skill — execution works without it.
- `haiku-worker.md` (the Haiku subagent's instruction brief) moved into this skill folder from the template's `.claude/agents/` — it travels with the skill now; dispatch and merge-files references updated to `~/.claude/skills/execute/haiku-worker.md`. Agent-registration frontmatter stripped — it's a read-at-dispatch brief, not a registered agent type.
- Initial publish (moved from the agentic-workflow template; renamed from `executing-plans`). Body unchanged except chaining phrasing removed from the verification steps — command chaining is a global workflow rule now, not a per-skill instruction.
