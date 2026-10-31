# How a session restarts

Near the context limit, Flow restarts the session in place: Flow's `flow-session` mod empties the conversation and refills it from the files on disk. The session and its transcript stay. Claude Code never writes a summary.

## Table of contents

- [The 3 phases](#the-3-phases): the ask, the tool call, the new window
- [Phase 1: the ask](#phase-1-the-ask): what the agent is sent, the restart guide whole
- [Phase 2: the tool call](#phase-2-the-tool-call): what the agent saves and passes
- [Phase 3: the context after the restart](#phase-3-the-context-after-the-restart): the skeleton of the new conversation
- [What decides each part](#what-decides-each-part): which tickets, sections and files load
- [When a restart is refused](#when-a-restart-is-refused): the reasons, and what to do

## The 3 phases

```text
   context reaches 200k, or you press Restart, or you type /restart
                 │
                 ▼
     ┌──────────────────────┐
     │  1. THE ASK          │   the mod sends the agent one message,
     └──────────────────────┘   with the restart guide
                 │
                 ▼
     ┌──────────────────────┐
     │  2. THE TOOL CALL    │   the agent updates ticket.md and context.md,
     └──────────────────────┘   then calls restart({ message, files, skills })
                 │
                 ▼
     ┌──────────────────────┐
     │  3. THE NEW WINDOW   │   the mod empties the conversation
     └──────────────────────┘   and refills it from disk
```

## Phase 1: the ask

3 things start a restart, and each sends the agent one message ending in the restart guide:

- **At the limit**, 200,000 tokens by default ([`wrapUpAt`](settings.md#wrapupat)): `Finish the work in hand (the whole task or ticket, never only this step), run capture, then restart.`
- **At 100,000 past it**, with no restart yet: `Finish the step in hand, run capture, then restart.`
- **By hand**: a press of the green Restart button above the prompt (shown from 30,000 under the limit), or `/restart`: `Restart now:`. Words typed after `/restart` follow under `User:`.

The guide, as the agent receives it, from `~/.flow/prompts/restart-guide.md`:

```md
# Restart guide

The new window holds only: the tickets in flight, the files and skills you name, your note, the user's unanswered messages word for word. Nothing else of this conversation survives.

1. Update the ticket. Everything this window learned or decided goes into `ticket.md` and `context.md`, by `~/.flow/guides/write-tickets.md`: decisions, answers, findings, context, dead ends, task state. Check: the note restates none of it.
2. Pick `files`: only what the first step edits. Name every other file the next steps need by path in the note.
   - Whole file by default.
   - `path#heading` or `path:from-to` only for a large file whose rest the next step doesn't need.
   - Groundwork: `context.md` loads whole by itself. Name the specs and code the open questions touch.
   - Build: the file mid-edit, its test, the spec part it implements.
   - 40k tokens in all, skills included.
3. Pick `skills`: the phase skill running and any skill the next step follows.
4. Write `message`, the note. Facts, compressed, no narration. In order:
   - Lessons not yet filed, each with its exact value, error text or path.
   - Facts still needed that belong in no ticket file.
   - Each point of the user's unanswered messages: done (what you did) or open (what's left).
   - First action: file, place, change.
   - Next steps, in order.
   - Questions waiting on the user.
5. Call `restart` last.
```

A helper agent still running delays the restart until it finishes. A helper agent never restarts itself. At its own limit it gets this message instead:

```md
From the session that started you: your window is full, and this replaces the stopping point in your brief. Unless you are within a few steps of your final report, write what you learned to your report files now: the sources read, the findings, what is left to do. Then begin your reply with `UNFINISHED:` and the paths of those files.
```

At 100,000 past its limit:

```md
From the session that started you: stop now, whatever your brief says. Write what you learned to your report files and begin your reply with `UNFINISHED:` and their paths.
```

## Phase 2: the tool call

The agent first writes the window's decisions and findings into the ticket's `ticket.md` (the index) and `context.md` (one section per question or task). Then it calls the tool once, as its last action:

```json
{
  "message": "- Lesson: python3 heredoc used to cut tests, against edit-with-edit. File a flow-issue if the type repeats.\n- fw-268 reopened. Mod suite 306 pass.\n- User's message: (1) how unanswered messages are found: open, answer it. (2) delete the 13 restart files: done.\n- First action: lab/archive/README.md, the mod-restart-dialogue line: add the retired parts.\n- Next: the unchecked tasks in fw-268, in order.",
  "files": [
    "mods/flow-session/features/restart/first-message.ts",
    "lab/archive/README.md",
    "docs/spec/product.md#Session"
  ],
  "skills": ["flow:execute"]
}
```

- **`message`**: the note, in the guide's order.
- **`files`**: a path loads the whole file, `path#heading` one markdown section with its subsections, `path:40-80` a line range.
- **`skills`**: skills the new window starts with.

The tool's description, as the agent sees it in every request, one line per part:

```text
restart   Restart this session, as the restart guide sent with the ask says. Call it last. A subagent never restarts: it saves its state to files and begins its reply with `UNFINISHED:`.
message   Your note to the new window, in the order the restart guide gives.
files     Files the next step works on: a path (whole file), `path#heading` (a markdown section), `path:from-to` (lines). A miss loads the whole file. With skills, 40k tokens at most.
skills    Skills the new window starts with, such as `flow:execute`.
```

## Phase 3: the context after the restart

The mod empties the conversation and writes this one in its place. Each file and skill appears as a `Read` or `Skill` call with its result, so the new agent holds the text and can edit at once:

```jsonc
[
  // Claude Code's fixed part, the same as at any session start
  {
    "role": "system",
    "content": "<system prompt, CLAUDE.md files, tool definitions>",
  },

  // 1. The opening: instructions only
  {
    "role": "user",
    "content": "Session restarted. Continue from the note.\nAnswer every point of the user's messages below.\nConflicts: files win on what exists; `ticket.md` wins over `context.md` on decisions.\nAfter answering, run `## Capture` over the note.",
  },

  // 2. Each ticket in flight: ticket.md, then context.md
  {
    "role": "assistant",
    "tool_use": {
      "name": "Read",
      "input": { "file_path": ".flow/tickets/268/ticket.md" },
    },
  },
  {
    "role": "user",
    "tool_result": "     1\t---\n     2\tid: 268\n     3\ttitle: restart-attach\n…",
  },

  {
    "role": "assistant",
    "tool_use": {
      "name": "Read",
      "input": {
        "file_path": ".flow/tickets/268/context.md",
        "offset": 12,
        "limit": 20,
      },
    },
  },
  {
    "role": "user",
    "tool_result": "    12\t## 2.1\n    13\t\n    14\tThe unanswered messages are …",
  },

  // 3. The guides those files need, each once (see guides.md)
  {
    "role": "assistant",
    "tool_use": {
      "name": "Read",
      "input": { "file_path": "~/.flow/guides/write-tickets.md" },
    },
  },
  {
    "role": "user",
    "tool_result": "     1\t# Writing tickets\n…",
  },

  // 4. The files the agent named
  {
    "role": "assistant",
    "tool_use": {
      "name": "Read",
      "input": { "file_path": "mods/flow-session/features/restart/first-message.ts" },
    },
  },
  {
    "role": "user",
    "tool_result": "     1\t/**\n     2\t * first-message.ts: the messages a restarted session starts from.\n…",
  },

  // 5. The skills the agent named, each with its wiki folder's text after its own (guides.md)
  {
    "role": "assistant",
    "tool_use": { "name": "Skill", "input": { "skill": "flow:execute" } },
  },
  {
    "role": "user",
    "tool_result": "Launching skill: flow:execute\n\nBase directory for this skill: …\n\n# Execute\n…",
  },

  // 6. The note
  {
    "role": "user",
    "content": "Note from the old agent:\n\n- Lesson: python3 heredoc used to cut tests …\n- First action: lab/archive/README.md …",
  },

  // 7. Your unanswered messages, each whole, word for word
  {
    "role": "user",
    "content": "Okay, one question is that how we're going to, you know, like really come up with the unanswered messages …",
  },

  // 8. An automatic restart submits this; after a press or /restart, you write next
  { "role": "user", "content": "Continue from the note." },
]
```

After a press of the button or `/restart`, the opening's first line is `Session restarted.` alone, and nothing runs until you type.

## What decides each part

- **Tickets in flight**: each ticket with a badge in the band above the prompt, unless it is done.
- **`context.md` whole or in sections**: whole for a ticket in groundwork (badge `DESIGN`), where every topic stays in play. Otherwise the sections that the ticket's open questions name.
- **A skill with no file**, such as Claude Code's built-in `plugin-authoring`: the opening gains `` Invoke the `plugin-authoring` skill first. `` after its first line, and the new agent loads it with its own `Skill` call.
- **Guides**: each ticket or file in the window brings the guides its kind needs ([guides.md](guides.md)), each once. A guide the agent named itself loads in its own place, not twice.
- **A file named twice**: loads once. A ticket file the agent also names in `files` is not repeated.
- **A heading the file lacks, or a range outside it**: loads the whole file.
- **Your unanswered messages**: every message since the agent's last finished reply. A message sent again with more words or a typo fixed arrives once, in its longer form.
- **The old dialogue**: never carried. It stays in the session's transcript.

## When a restart is refused

The tool answers with the reason, and nothing restarts:

- **`A restart is already under way.`** Wait for it to finish.
- **A helper agent is still running.** The agent calls the tool again after the helper's finished notice.
- **`Nothing restarted:`**, followed by a file that cannot be read, a skill the session does not list, or each part's size past 40k tokens in all. The agent names fewer files, and calls again.

A restart that fails while building the new window leaves the session as it was. The log line says `restart failed, the session is as it was`, followed by the error.
