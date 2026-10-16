# The capture pass

The sweep of `## Capture`, run over the whole conversation. A restart replaces the conversation, so this is the last chance to file what it taught.

**Run it when no work stays in this session after the handoff**: the restart, or a handoff that moves all remaining work to another session or model. **Skip it** for a handoff that carves one chunk out while other work stays here, and for a brief to a subagent. Unclear → run it.

Order: ticket states, this pass, the note, the restart tool.

## Steps

1. **Find where to start.** After the last quote list in this conversation. None → the first message.
2. **Walk the user's messages from there to the last, in your visible turn.** Never in thinking. For each message that corrects, decides, sets aside or leaves something undone, write one line: their own words in quotes, the route it takes, where it is filed.

   ```text
   "never write kind in a profile line" → a correction → ~/.flow/notes/never-write-kind-in-a-profile-line.md
   "we'll do the board page after release 1" → work left undone → ~/.flow/notes/board-notes-page.md
   ```

3. **File each line by `file-by-type` in `## Capture`.** A line with no file written is a line you skipped.
4. **File what you learned about your own work** (tool lessons, failed attempts, mistakes, procedures done before) from the same pass.

A quote can only come from a real message, so a skipped message shows as a missing line.
