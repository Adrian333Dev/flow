# Log of guides/writing.md

## 2026-11-02 · 6. Never cut these · rewrite
Ticket: fw-358
Why: "Cutting rule count is banned as a strategy" blocked fixing a fault by removing the line behind it. The user never enforced it and does not recall why it was added; `git log -S` traces it to `ea62431` (2026-08-13, a 76-file wip commit, no ticket). The first sentence stays: it guards the user's real fear, a compression pass dropping a rule. Deliberate removal now runs through `write-loaded-files.md` → `cut-before-adding`.
Was:
```md
- **A rule.** Compression removes words and duplication, never rules. Cutting rule count is banned as a strategy.
```

## 2026-11-03 · 1. Read the guides for the file's kind · remove
Ticket: fw-397
Why: the list served `read-writing-first`, which sent the agent here first and fired in 0 of 13 windows. The mod sends a file's guides together, so the list repeated the mod. Its 2 guides the mod never sent: `wiki.md` now has a `wiki` entry; `issue-tickets.md` stays named by `## Capture` in `CLAUDE.md`.
Was:
```md
## 1. Read the guides for the file's kind

Before planning, read them in one message:

- **A rule file** (`CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/`) → `write-loaded-files.md`, `write-rules.md`
- **Any other file an agent loads** (a skill and its `references/`, a command, an agent, a guide, a prompt) → `write-loaded-files.md`
- **A new skill** → `write-loaded-files.md`, `knowledge.md`
- **A spec, `docs/spec/`** → `write-spec.md`
- **A ticket's files** → `write-tickets.md`, and `issue-tickets.md` for a `flow-issue` ticket
- **A wiki page, `~/.flow/wiki/`** → `wiki.md`
- **Anything else**, `docs/manual/` included → nothing more
```

## 2026-11-04 · title paragraph · remove
Ticket: fw-397
Why: a line about the file itself; the guide arrives for any file it covers.
Was:
```md
For everything Flow writes: a skill, a rule file, a ticket, a spec, a page the user reads, a message to the user.
```
