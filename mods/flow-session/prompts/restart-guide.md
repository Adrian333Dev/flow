# Restart guide

The new window holds only: the tickets in flight, the files and skills you name, your note, the user's unanswered messages word for word. Nothing else of this conversation survives.

1. Update the ticket. Everything this window learned or decided goes into `ticket.md` and `context.md`, by `~/.flow/references/write-tickets.md`: decisions, answers, findings, context, dead ends, task state. Check: the note restates none of it.
2. Pick `files`: the files the next step works on, so the new agent starts with few reads.
   - Whole file by default.
   - `path#heading` or `path:from-to` only for a large file whose rest the next step doesn't need.
   - Groundwork: `context.md` loads whole by itself. Name the specs and code the open questions touch.
   - Build: the file mid-edit, its test, the spec part it implements.
   - 80 KB in all, skills included.
3. Pick `skills`: the phase skill running and any skill the next step follows.
4. Write `message`, the note. Facts, compressed, no narration. In order:
   - Lessons not yet filed, each with its exact value, error text or path.
   - Facts still needed that belong in no ticket file.
   - Each point of the user's unanswered messages: done (what you did) or open (what's left).
   - First action: file, place, change.
   - Next steps, in order.
   - Questions waiting on the user.
5. Call `restart` last.
