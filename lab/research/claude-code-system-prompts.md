# Claude Code System Prompts

Read 2026-10-04 from `repos/tools/claude-code-system-prompts/`. About 12,800 stars, MIT, by Piebald AI. Every piece of Claude Code's own system prompt, 827 files pulled from each release within minutes: the main prompt, each tool's description, the subagents' prompts, the compaction prompt.

**`CHANGELOG.md` says what changed in the prompt per release**, with the token difference. 2.1.288 added 4,051 tokens. 2.1.289 changed nothing.

## What Flow could take

- **Cut every Flow rule the built-in prompt already says.** `home/AGENTS.md` loads in every session, about 3,600 tokens. A rule repeating Claude Code's own instruction costs tokens and adds nothing. One was found by hand on 2026-09-29: `batch-calls`. Reading the prompt files finds the rest. `lab/backlog/after-v1.md` → the system prompt item.
- **A second input to `check-claude-code-updates`.** Release notes skip prompt changes. The changelog lists them, and a prompt change can break a Flow rule silently. Joined to the same item.
- **The compaction prompt**, `agent-prompt-conversation-summarization.md`, says what a summary keeps. `compact-check.js` and `/flow:handoff` can be checked against it.
