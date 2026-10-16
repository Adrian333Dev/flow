# Writing the start message

The next session knows the repo and nothing else. After a restart, this message is all the new conversation holds.

Write these parts in order. Skip a part with nothing in it.

1. **Load first**: skills and files, by name or path. For another session or model, the commands the user types.
2. **Where the work stands**: each ticket by id. Never copy its `## State`.
3. **What comes next**, in order.
4. **The question waiting on the user.**
5. **What binds it**: a constraint or correction no ticket holds.

```text
Load: /flow:execute, mods/flow-session/hooks/ask.ts
fw-139: handoff skill done, code half not started. fw-136 waits on it.
Next: write fw-139's tasks, then build.
Ask the user: drop fw-160?
Binding: leave skills/phases/execute/ alone.
```
