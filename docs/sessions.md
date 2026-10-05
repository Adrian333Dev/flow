# Sessions

What Flow does while a session runs, and how work carries over to the next session or to a second one.

## Table of contents

- [When a session opens](#when-a-session-opens): a line only when something needs you
- [While a session runs](#while-a-session-runs): the reminder, the status line, and the length warning
- [Carry work to the next session](#carry-work-to-the-next-session): `/flow:handoff`, `/clear`, and the line that picks the work up
- [What `/flow:handoff` writes](#what-flowhandoff-writes): the `## State` section in the ticket
- [Hand a job to a second session](#hand-a-job-to-a-second-session): a child ticket another session picks up
- [Why Flow refuses `/compact`](#why-flow-refuses-compact): a summary against a handoff

## When a session opens

Flow prints a line only when something needs you:

```text
Flow: this machine is at changelog entry 3, and 5 is the newest. Run flow update in a terminal.
```

Without a word, it also links the skills you switched on from another computer, updates each skill repository, and brings down other people's tickets.

## While a session runs

**A reminder arrives beside every message you send**, putting the reply rules in front of the agent again, since they drift far behind a long conversation:

```text
Follow `## The reply`, and pass every `### Before sending` test. If it applies, follow `## Capture`.
```

**The status line** shows the ticket and how full the conversation is:

```text
shop-7 building · 98k of 150k
```

**A warning arrives past 150,000 tokens**, and again, firmer, every 20,000 after:

```text
The context is at 152k. At the next checkpoint, run /flow:handoff, report in full, and stop.
```

Answers get worse long before the context window fills. A session starts at about 25,000 tokens, so 150,000 leaves about 110,000 for work. [`wrapUpAt`](reference/settings.md#wrapupat) moves the limit, and [Settings](reference/settings.md#switches) turns each line off.

**Anything with a shape gets drawn** with `/flow:visualize`, such as a screen layout: a text diagram in the reply, or an HTML preview where colour and spacing matter.

**Your tickets are backed up as you work**, in the background: [Sync between computers](sync.md).

## Carry work to the next session

1. **`/flow:handoff`** writes what the next session needs into the ticket, then ends on the lines to type:

   ```text
   /clear
   /flow:execute /shop-7
   ```

2. **`/clear`** empties the conversation.
3. **The line it named** loads the ticket and its files before the agent's first word, and the phase carries on where it stopped.

Hand off once a step is finished and checked. A handoff written mid-edit describes a state that is gone once the edit lands. Work with no ticket gets one from the handoff.

## What `/flow:handoff` writes

A `## State` section at the bottom of `ticket.md`:

````md
## State

Now: steps 1 and 2 pass. Step 3 is not started: `setBudget` accepts any category, and you want a typo like `fod` refused.

Found: `readAll` in `src/store.js` is the only place that knows every category, so step 3 reads the records through it.

```open
plan.md
src/budgets.js:14-24   # setBudget, where step 3 goes
```
````

- **`Now`**: where the work stands.
- **`Found`**: what the session learned that no file records.
- **`Open`**: decisions half made, and the option the session leaned toward.
- **`Touched`**: files changed that no step in `plan.md` names.
- **The `open` block**: the files the next session gets before its first message.

The section is deleted once the ticket reaches `review`.

## Hand a job to a second session

Ask for a job to run beside yours, such as checking how an API behaves while the build goes on. `/flow:handoff` writes it as a child ticket holding everything the job needs, and ends on the line to type in a new terminal, such as `/flow:execute /shop-8`. Let only one session edit the code at a time.

## Why Flow refuses `/compact`

`/compact` swaps the conversation for Claude Code's summary of it. A summary keeps a little of everything, inside that conversation alone. A handoff keeps what the next session would get wrong, in the ticket, where any session on any computer reads it.

```text
Flow does not compact. Run /flow:handoff, then /clear. "compact": true in ~/.flow/settings.json allows /compact.
```
