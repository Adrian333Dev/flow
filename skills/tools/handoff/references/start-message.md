# Writing the start message

The next session knows the repo and nothing else. It holds this message, and the mod adds the last reply, the user's unanswered messages and the changed files. Copy none of them.

Write a briefing in short plain sentences, in this order. Skip a part with nothing in it.

1. **Load**: first line. Skills and files by name or path. For another session or model, the commands the user types.
2. **The task**: what is being done, why, what stands built. Each ticket by id with a clause saying what it is. Never copy its `## State`.
3. **What the user said that no file holds**: decisions, leanings, rejections, what to leave alone. Check the loaded files first. Never restate a rule already loaded.
4. **Next**: steps in order, then the questions waiting on the user.

A line stays only where the next session acts wrongly without it. Steps already taken never pass. Write fragments, no filler.

```text
Load: /flow:execute, then flow fw-179 (the band's badges; read its ## State).
Left: the restart button, shown past the wrap-up limit. Draw it first with /flow:visualize: small, right side, before the issue count, a press restarts. User's yes, then build.
Ask: badge gap 0? Delete the dropped session-name note in ~/.flow/notes/?
Leave fw-73 (a parallel session's). ~/.flow/study-cases/ stays until the user says delete.
```
