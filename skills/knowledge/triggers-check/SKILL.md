---
name: triggers-check
description: Checks whether every file change discussed, proposed or made had its guides loaded in time, from the transcript.
disable-model-invocation: true
---

# Triggers check

Find every moment a change to a file came up with a guide it needs out of context, and say who failed: the trigger or the agent. Report in the reply. Write nothing.

## Scope

The user says what to read in their own words: "this window", "this and the previous window", "the last few windows", another session. No words → this window.

- **This window** → already in context: read nothing for it.
- **Earlier windows** → `flow audit turns <session>` gives each window's turns (`SEG`), `flow audit read <session> --turns <from-to> --full` opens them. "A few" → 3, and say so.
- **Other sessions** → each session `flow audit -- "<query>"` lists, read the same way.

## Steps

1. **Find each moment.** Every point where a change to a file came up: discussed, proposed, drafted or edited, by the user or by you, tool call or none. One moment per file per stretch of work. Its time is the first proposal.
2. **Name the guides it needed.** Read `~/.flow/repos/flow/mods/flow-session/features/triggers/list.ts` once: the file's entry, its `send`, and any `also` entry that matches it.
3. **Find what was in context before the first proposal.** A guide counts as loaded by:
   - your own `Read` of it
   - the mod's send: an `[Auto] Before planning a change to …` block (`+ hook` in `flow audit read`), or a line for this session in `~/.flow/logs/triggers/<year>-<month>.jsonl` at or before that turn
   - the restart's load: the window opening with it attached
4. **Give each moment a verdict.**
   - `ok`: every guide in context before the first proposal.
   - `late`: one arrived after the first proposal. A `held` log line is always late.
   - `missed`: one never arrived before the change was made, or before the discussion ended.
5. **Name who failed, on `late` or `missed`.**
   - **The trigger**: no entry, check or chat signal covered the moment. Name the signal that would have caught it: the words, the path or the pattern in the chat at that point.
   - **The agent**: the guide was in context, and a step of it went unfollowed. Name the step.

## Output

One block per moment, oldest first, then one line counting the verdicts:

```text
turn 6 · docs/spec/rules.md, the guides section
  needed   writing.md, write-spec.md
  loaded   none: the section grepped, no guide sent
  verdict  missed · the trigger
  signal   "rewrite" beside a guide path, in the agent's own reply
```

No moment found → one line saying so, with the turns read.
