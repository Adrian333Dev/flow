# Log of home/CLAUDE.md

## 2026-11-02 · `show-the-data` · rewrite
Ticket: fw-358
Why: an example of a new window's context came as inline, unformatted JSON, and a before and an after were put in one `[user]` / `[agent]` block. The user asked for one generic line, optimized for their reading, never a list of formats that grows a line per case.
Trial: watch for examples shown with no label, or in a shape built for a machine (one-line JSON).
Was:
```md
- **`show-the-data`** A file, a record or an output gets an example of what it holds, never a description alone.
```

## 2026-11-03 · `read-writing-first` · remove
Ticket: fw-397
Why: the agent read `writing.md` itself before its first markdown edit in 0 of 13 windows. The mod sends each file's guides when the file is read, grepped or edited. The user: "since it never really triggered".
Trial: watch for markdown proposals made with no guide in the window; `/triggers-check` reports them once built.
Was:
```md
- **`read-writing-first`** Before planning or drafting any markdown change, read `~/.flow/guides/writing.md`.
```

## 2026-11-03 · `read-before-adding` · remove
Ticket: fw-397
Why: fired 1 time in 1, late, at the build. The mod's `knowledge` entry holds a new `SKILL.md`, an `.mcp.json` edit and a plugin or MCP install until `knowledge.md` is read.
Was:
```md
- **`read-before-adding`** Before proposing a skill, a plugin or an MCP server, read `~/.flow/guides/knowledge.md`.
```

## 2026-11-03 · `read-subagents-before-dispatch` · remove
Ticket: fw-397
Why: the agent read `subagents.md` before its own dispatch in 4 of 12 windows. The mod's `agent` entry now holds an `Agent` call until the guide is read. The user approved the removal 2026-11-03.
Trial: watch for a subagent started with no `subagents.md` in the window; the held call should make this impossible.
Was:
```md
- **`read-subagents-before-dispatch`** Before starting a subagent, read `~/.flow/guides/subagents.md`: which model, how to brief it, how to reply while it runs.
```

## 2026-11-04 · `user-only-skills` · rewrite
Ticket: fw-397
Why: no file the agent reads named `/flow:triggers-check`, so the agent would report it missing when the user asks for it by name.
Was:
```md
- **`user-only-skills`** Suggest `/flow:start`, `/flow:tickets-from-spec` and `/flow:upkeep` to the user.
```
