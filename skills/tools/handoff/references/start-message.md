# Writing the start message

The next session knows the repo and nothing else. After a restart, this message is all the new conversation holds.

Write these parts in order. Skip a part with nothing in it.

1. **Load first**: skills and files, by name or path. For another session or model, the commands the user types.
2. **Done and Left**, measured against the user's last messages. Skip both when the last turn was answered.
3. **Where the work stands**: each ticket by id. Never copy its `## State`.
4. **What comes next**, in order.
5. **The question waiting on the user.**
6. **What binds it**: a constraint or correction no ticket holds.

The mod adds the last reply, the user's messages since it and the changed files after a restart. Copy none of them.

```text
Load: /flow:execute, mods/flow-session/hooks/ask.ts
Done: the skill half of fw-139.
Left: its code half, then fw-136, which waits on it.
Next: write fw-139's tasks, then build.
Ask the user: drop fw-160?
Binding: leave skills/phases/execute/ alone.
```
