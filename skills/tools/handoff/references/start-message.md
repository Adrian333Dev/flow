# Writing the start message

The next session knows the repo and nothing else. It holds this message and nothing of this conversation.

Write a briefing in short plain sentences, in this order. Skip a part with nothing in it.

1. **Load**: first line. Skills and files by name or path, and the commands the user types.
2. **The task**: what is being done, why, what stands built. Each ticket by id with a clause saying what it is. Never copy its `ticket.md` or `context.md`: name the sections to read.
3. **What the user said that no file holds**: decisions, leanings, rejections, what to leave alone. Check the loaded files first. Never restate a rule already loaded.
4. **Next**: steps in order, then the questions waiting on the user.

A line stays only where the next session acts wrongly without it. Steps already taken never pass. Write fragments, no filler.

```text
Load: /flow:execute, then /fw-179 (the band's badges; read context.md#Restart button).
Task: fw-179, the band's badges. Built: the badges. Not built: the restart button, shown past the wrap-up limit.
User said: leave fw-73 (a parallel session's). ~/.flow/study-cases/ stays until the user says delete.
Next: draw the button with /flow:visualize: small, right side, before the issue count, a press restarts. User's yes, then build.
Ask: badge gap 0? Delete the dropped session-name note in ~/.flow/notes/?
```
