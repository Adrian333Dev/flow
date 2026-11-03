# How a session restarts

Near the context limit, Flow restarts the session in place: Flow's `flow-session` mod empties the conversation and refills it from the files on disk. The session and its transcript stay. Claude Code never writes a summary.

## Table of contents

- [The 3 phases](#the-3-phases): the ask, the tool call, the new window
- [Phase 1: the ask](#phase-1-the-ask): what the agent is sent, the restart guide whole
- [Phase 2: the tool call](#phase-2-the-tool-call): what the agent saves and passes
- [Phase 3: the context after the restart](#phase-3-the-context-after-the-restart): the skeleton of the new conversation
- [What decides each part](#what-decides-each-part): which tickets, sections and files load
- [When a restart is refused](#when-a-restart-is-refused): the reasons, and what to do
- [/fresh: a light window once the work is finished](#fresh-a-light-window-once-the-work-is-finished): what it carries
- [/fresh-dialogue: a light window that keeps the last window's dialogue](#fresh-dialogue-a-light-window-that-keeps-the-last-windows-dialogue): what it carries, and its limit

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

- **At the limit**, 200,000 tokens by default ([`wrapUpAt`](settings.md#wrapupat)): `Context is large. Carry on. Restart at the next break: the work in hand finished, or the user turning to something new. Run capture first.` In a discussion, the break is your next message on another topic: the agent restarts before starting it, and your message carries over.
- **At 100,000 past it**, with no restart yet: `Context is very large. Restart at the end of this step, discussion or not. Run capture first.`
- **By hand**: a press of the green Restart button above the prompt (shown from 30,000 under the limit), or `/restart`: `Restart now:`. Words typed after `/restart` follow under `User:`.

The guide, as the agent receives it, from `~/.flow/prompts/restart-guide.md`:

```md
# Restart guide

The new window holds only: the tickets in flight, the files and skills you name, your note, the user's unanswered messages word for word. Nothing else of this conversation survives.

1. Update the ticket. Everything this window learned or decided goes into `ticket.md` and `context.md`, by `~/.flow/references/guides/write-tickets.md`: decisions, answers, findings, context, dead ends, task state. Check: the note restates none of it.
2. Run `## Capture` over this window: file every lesson, correction and fault by its route now. Check: nothing is left to file, so the note carries no lesson.
3. Pick `files`: only what the first step edits. Name every other file the next steps need by path in the note.
   - Whole file by default.
   - `path#heading` or `path:from-to` only for a large file whose rest the next step doesn't need.
   - Groundwork: `context.md` loads whole by itself. Name the specs and code the open questions touch.
   - Build: the file mid-edit, its test, the spec part it implements.
   - 40k tokens in all, skills included.
4. Pick `skills`: the phase skill running and any skill the next step follows.
5. Write `message`, the note. Facts, compressed, no narration. In order:
   - Facts still needed that belong in no ticket file.
   - Each point of the user's unanswered messages: done (what you did) or open (what's left).
   - First action: file, place, change.
   - Next steps, in order.
   - Questions waiting on the user.
6. Call `restart` last.
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

The agent first writes the window's decisions and findings into the ticket's `ticket.md` (the index) and `context.md` (one section per question or task). Then it runs its capture pass, filing every lesson, correction and fault, so the note carries none. Then it calls the tool once, as its last action:

```json
{
  "message": "- fw-268 reopened. Mod suite 306 pass.\n- User's message: (1) how unanswered messages are found: open, answer it. (2) delete the 13 restart files: done.\n- First action: lab/archive/README.md, the mod-restart-dialogue line: add the retired parts.\n- Next: the unchecked tasks in fw-268, in order.",
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
    "content": "Session restarted. Continue from the note.\nAnswer every point of the user's messages below.\nConflicts: files win on what exists; `ticket.md` wins over `context.md` on decisions.",
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
      "input": { "file_path": "~/.flow/references/guides/write-tickets.md" },
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
    "content": "Note from the old agent:\n\n- fw-268 reopened. Mod suite 306 pass …\n- First action: lab/archive/README.md …",
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
- **The old dialogue**: never carried by a restart or `/fresh`. It stays in the session's transcript, and `/fresh-dialogue` copies the part since the last restart.

## When a restart is refused

The tool answers with the reason, and nothing restarts:

- **`A restart is already under way.`** Wait for it to finish.
- **A helper agent is still running.** The agent calls the tool again after the helper's finished notice.
- **`Nothing restarted:`**, followed by a file that cannot be read, a skill the session does not list, or each part's size past 40k tokens in all. The agent names fewer files, and calls again.

A restart that fails while building the new window leaves the session as it was. The log line says `restart failed, the session is as it was`, followed by the error.

## /fresh: a light window once the work is finished

Type `/fresh` once a piece of work is finished and the context is large. The mod empties the conversation the way a restart does, with no note, no files and no model request. Nothing runs until you type. It never asks for a capture first: you know a finished piece of work from a discussion still running.

The new window holds, in order:

1. The opening, as the agent receives it:

   ```md
   Session restarted. The old window's work is finished: below are the tickets in flight and the agent's last reply.
   Answer every point of the user's messages below.
   Conflicts: files win on what exists; `ticket.md` wins over `context.md` on decisions.
   ```

   The second line shows only when a message of yours is unanswered.
2. The tickets in flight, as a restart loads them.
3. Each ancestor of those tickets (its parent, the parent's parent, and on up): only the part above its first `##` heading, its `## Context` and its `## Decisions`. A parent's `## Questions` can run past 150 KB.
4. The guides those files need.
5. The agent's last reply, headed `The agent's last reply in the old window:`.
6. Your unanswered messages, each whole.

Nothing suggests `/fresh`: the meters under the prompt show the size. The agent hears about its size only from the wrap-up lines in phase 1.

`/fresh` is refused only while a restart is already under way.

## /fresh-dialogue: a light window that keeps the last window's dialogue

Type `/fresh-dialogue` anywhere: mid-discussion, mid-groundwork, or on a cold cache. It empties the conversation the way `/fresh` does, with no note and no model request. In place of the last reply it carries everything said since the last restart, `/fresh` or `/fresh-dialogue`, so nothing needs filing first. Earlier windows are finished work, and stay in the transcript. Nothing runs until you type.

The new window holds, in order:

1. The opening, as the agent receives it:

   ```md
   Session restarted. Below are the tickets in flight and the dialogue since the last restart: the user's words and the agent's text word for word, each tool call as one line.
   The dialogue ends with the user's messages not yet answered: answer every point of them.
   Conflicts: files win on what exists; `ticket.md` wins over `context.md` on decisions.
   ```

   The second line shows only when a message of yours is unanswered.
2. The tickets in flight, their ancestors and the guides, as `/fresh` loads them.
3. The dialogue, read from the session's transcript file after its last restart. It is headed `Copied dialogue of the previous window, since the last restart:` and looks like this:

   ```text
   [user]
   /flow:execute fw-300

   [agent]
   Raising the stop mark from 30,000 to 100,000 past the limit.

   [tool] Edit /home/me/code/flow-dev/mods/flow-session/hooks/wrap-up.ts
   [tool] Bash cd /home/me/code/flow-dev/mods/flow-session && claude plugin test . 2>&1 | tail -8
   ```

   Left out: tool results, the agent's thinking, subagents, and the window the mod itself wrote at the last restart.

The dialogue keeps at most 160 KB, about 65,000 tokens, so the new window opens near 100,000 at most. A longer window keeps its newest part, starting at one of your messages, and the heading then reads `Copied dialogue of the previous window, its newest part: the start of the window is left out to fit:`. One window rarely reaches the limit: this session's window on 2026-11-01 copied to 7 KB.

`/fresh-dialogue` is refused only while a restart is already under way. A transcript it cannot read leaves the session as it was, and the log line names the file.
