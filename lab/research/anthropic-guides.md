# 2 Anthropic guides

Fetched 2026-10-04 from claude.com/blog, both linked from `awesome-claude-code`.

## Steering Claude Code: skills, hooks, rules, subagents and more

A table of the 7 ways to extend Claude Code, by when each loads and what it costs:

- **Root `CLAUDE.md`**: loads every session, read again after compaction. High cost. For facts the agent needs all the time.
- **Rules**: at session start, or on a matching file with `paths:`. Put back after compaction.
- **Skills**: name and description at start, the body when used. Low cost.
- **Subagents**: only the final message returns.
- **Hooks**: run code at set events, outside the context. Deterministic.
- **Output styles**: replace the system prompt, never compacted.

Its rulings, each one Flow already follows:

- "Every time X, always do Y" belongs in a hook: "The model choosing to run a formatter is different from the formatter running automatically."
- A "never do this" that must hold goes in a hook or a setting, since an instruction holds "most of the time".
- "Procedures belong in skills. `CLAUDE.md` is for facts Claude should hold all the time."
- "Keep `CLAUDE.md` under 200 lines." `home/AGENTS.md` has 152.

Nothing to take.

## A Field Guide to Claude Fable 5: finding your unknowns

"Claude Fable is the first model where I find the quality of the work is bottlenecked by my ability to clarify its unknowns." Its methods: a blind spot pass, several designs to react to, an interview "one question at a time", a plan naming the decisions most likely to change, notes on every departure from the plan, and a quiz on the change before merging.

`/flow:groundwork` covers the first 4: it questions the premise, researches the unknowns, and tests the design. `/flow:execute` writes a step that landed differently into `## State`. The quiz is the one method Flow lacks: the agent asks the user about the change before they commit, so they know the code they own. Left out of the backlog: the user reads fast and commits by judgment, and nothing yet shows a change they did not understand.
