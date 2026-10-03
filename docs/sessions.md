# Sessions

What Flow does when a session opens and while it runs, and how work carries over to the next session.

## Table of contents

- [When a session opens](#when-a-session-opens): what Flow checks, and when it speaks
- [While a session runs](#while-a-session-runs): the reminder, the status line, and the length warning
- [Carry work to the next session](#carry-work-to-the-next-session): `/flow:handoff`, `/clear`, and the line that picks the work up
- [What `/flow:handoff` writes](#what-flowhandoff-writes): the `## State` section in the ticket
- [Why Flow refuses `/compact`](#why-flow-refuses-compact): a summary against a handoff

## When a session opens

Flow prints a line only when something needs you, and nothing otherwise:

```text
Flow: this machine is at changelog entry 3, and 5 is the newest. Run flow update in a terminal.
Flow: not set up here. Run flow init to add it, or flow settings off setupReminder to stop this.
```

It also does 3 things without a word, and without making the session wait:

- **Matches skill links to your settings**, so a skill you switched on another computer works here.
- **Updates each skill repository** in the background, at most every 6 hours.
- **Brings down other people's tickets**, in a project whose tickets live on its `flow` branch.

Then type `/flow:start`. [Phases](phases.md) covers what it does.

## While a session runs

**A reminder arrives beside every message you send:**

```text
Follow `## The reply`, and pass every `### Before sending` test. If it applies, follow `## Capture`.
```

The rules for writing a reply sit at the end of a long file, loaded once when the session starts. By the 15th message they are far behind the conversation, and replies drift back to long and unclear. The line puts them in front of the agent again. It names the rules and never copies them, so it stays one line however many rules you add.

**The status line**, under the box you type in, shows the ticket and how full the conversation is:

```text
shop-7 building · 98k of 150k
```

**A warning arrives once the conversation passes 150,000 tokens:**

```text
The context is at 152k. At the next checkpoint, run /flow:handoff, report in full, and stop.
```

The limit follows the quality of the answers, which get worse long before the context window fills. A Flow session starts at about 25,000 tokens, so 150,000 leaves room for about 110,000 of work. Every 20,000 tokens past it, the warning comes again, firmer:

```text
The context is at 171k, past the 150k limit. Stop at the step you are on: finish it, run /flow:handoff, report, and stop.
```

[Settings](reference/settings.md#switches) covers turning each line off, and [`wrapUpAt`](reference/settings.md#wrapupat) moves the limit.

**Your tickets are backed up as you work.** After a reply, Flow sends the project's tickets and your Flow home to GitHub where something changed and 30 minutes have passed, and once more as the session closes. It runs in the background, so a reply never waits.

## Carry work to the next session

A new session knows your code and nothing of the conversation before it. 3 steps carry the work across:

1. **`/flow:handoff`** writes what the next session needs into the ticket, then ends on the lines to type next:

   ```text
   /clear
   /flow:execute /shop-7
   ```

2. **`/clear`** empties the conversation. The ticket holds everything.
3. **The line it named** loads the ticket and the files it lists before the agent's first word. The phase carries on where it stopped: `/flow:execute` at the first unchecked step of `plan.md`, `/flow:debug` at the first guess still standing.

Hand off at a checkpoint: a step finished and its check run. A handoff written in the middle of an edit describes a state that is gone once the edit lands.

Work with no ticket gets one from the handoff, so the next session finds it on the board. Flow writes no separate handoff file.

## What `/flow:handoff` writes

A `## State` section at the bottom of the ticket's `ticket.md`. One test decides every line: would the next session get this wrong without it? A handoff in the middle of a build might write:

````md
## State

Now: steps 1 and 2 pass. Step 3 is not started: `setBudget` accepts any category, and you want a typo like `fod` refused.

Found: `readAll` in `src/store.js` is the only place that knows every category, so step 3 reads the records through it.

```open
plan.md
src/budgets.js:14-24   # setBudget, where step 3 goes
```
````

- **`Now`**: where the work stands this second. Rewritten whole each time.
- **`Found`**: what the session learned that no file records. Added to, and kept until it stops being true.
- **`Open`**: decisions half made, and the option the session leaned toward. Kept like `Found`.
- **`Touched`**: files changed that no step in `plan.md` names. Rewritten like `Now`.
- **The `open` block**: the files the next session gets before its first message, with a line range where one part matters.

Most handoffs fill 2 of the 4. The section is deleted when the ticket reaches `review`, and anything in `Found` still true moves to the ticket's `issues.md` first. Before it writes, `/flow:handoff` also files what the conversation taught: [Learning](learning.md) covers that step.

## Why Flow refuses `/compact`

`/compact` swaps the conversation for Claude Code's summary of it. A summary keeps a little of everything, and lives only inside that conversation. A handoff keeps what the next session would get wrong, in the ticket, where any session on any computer reads it.

A typed `/compact` stops, and you see:

```text
Flow does not compact. Run /flow:handoff, then /clear. "compact": true in ~/.flow/settings.json allows /compact.
```

Claude Code's own compacting near the end of the window is switched off too. [`compact`](reference/settings.md#compact) lets a typed `/compact` run.
