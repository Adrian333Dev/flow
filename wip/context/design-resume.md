# Resuming after a clear

Raised 2026-08-22, nothing built. The user rejected the first shape and named the direction; the mechanics below are confirmed against Claude Code's own docs and do not need re-deriving.

## The problem

A long session ends by hand, in 3 typed steps:

1. `/handoff` — writes `## State` into the ticket, or `handoff.md` beside the work.
2. `/clear` — wipes the conversation.
3. Point the fresh session at what was written.

Step 3 is the one that costs. It has to be retyped every cycle, it is easy to aim at the wrong file, and the fresh session reads whatever it was pointed at rather than what the work needs.

**`/compact` is not part of this.** The user does not use it and will not. Every mechanic below concerns `/clear`.

## What the platform allows

Confirmed against `wip/research/claude-code-docs/hooks.md` and the skills reference at `code.claude.com/docs/en/slash-commands.md`, 2026-08-22.

- **Skills load in 3 tiers.** Every skill's `name` and `description` sit in context from the start. The body enters only on invocation. Files under `refs/` enter only when read.
- **Appending never invalidates the prompt cache.** The cache keys on a prefix, so a skill body or a reference file arriving at the bottom leaves every earlier token valid. Only a change to something early — system prompt, tool definitions — breaks it. `/clear` discards the whole context anyway.
- **`SessionStart` fires after `/clear`, with `source: "clear"`.** It is a shell command. Its plain stdout is added to the fresh context before the first prompt — one of only 3 events whose stdout Claude sees, alongside `UserPromptSubmit` and `UserPromptExpansion` (`hooks.md:760`).
- **`SessionEnd` fires before the wipe, with `reason: "clear"`.** Cleanup only: it cannot block, and being a shell script it knows nothing about the conversation, so it can never write the handoff.
- **`` !`<command>` `` in a command or skill body runs before Claude reads the file**, and its output replaces the line. A fenced ` ```! ` block takes several lines. `commands/start.md:6` already uses the inline form, and already branches on whether an argument was given.
- **Substitution runs once and is never re-scanned.** Command output is inserted as plain text, so a command cannot emit a placeholder — or another command — for a later pass to expand.
- **`@path` attaches a file, but takes a literal path only.** A path built from `$ARGUMENTS` needs `!` plus `cat` or `fmerge`.
- **`fmerge` already takes line ranges** — `fmerge <path[:N-M]> [path2] ...`. Loading half a file needs no new tooling.
- **Skill dedup keys on invocation, not on text.** Re-invoking a skill whose rendered content matches the copy in context adds a short note instead of a second copy. A `cat` of a `SKILL.md` leaves no such record, so a later invocation appends the **full body a second time**.
- **Skills stack.** `/start /execute t047` loads both as real invocations, up to 6, and passes the trailing text to each as `$ARGUMENTS`. A skill with no `$ARGUMENTS` placeholder gets `ARGUMENTS: t047` appended to its body.
- **`UserPromptExpansion` fires when a typed command expands**, carries `command_name` and `command_args`, and can block the expansion or add context.
- **Hook stdout over 10,000 characters** is written to a file, and Claude gets the path plus a preview.

## What cannot be automated

- **`/clear` itself.** No hook returns it and no tool performs it. Claude cannot wipe its own context.
- **One command covering all 3 steps.** A command is text inside the conversation, so the clear destroys the half that would resume. Only a hook survives, because a hook is a shell process outside the conversation.
- **Starting the work with no typing at all.** `SessionStart` has an `initialUserMessage` field that creates the first turn, but the doc restricts it to non-interactive `-p` runs. Interactive `/clear` never gets it. **The ceiling is 2 typed steps**, and the goal is that the second one is real work rather than orientation.

## The constraint that would break it silently

Claude Code guards against text arriving from outside the conversation that reads like an order — the shape of a prompt injection. A hook's stdout arrives from outside.

- `Invoke /execute now and continue the build.` → may be surfaced to the user as suspicious text instead of used. The resume stops working, confusingly.
- `Ticket t047 "Split the parser" is at status building.` → a fact, and passes.

The docs say it directly: *"Write the text as factual statements rather than imperative system instructions."* So the hook states what is true, and the routing rules already in `commands/start.md` decide what happens.

## Shapes considered

**Rejected — branching on status.** A `case` in the resume script emitting `map.md` for `groundwork`, `plan.md` for `building`. The user rejected it 2026-08-22: the decision is baked into the script, which cannot skip a file that stopped mattering or add one nobody would predict.

**Rejected — printing `## State` alone.** `handoff/SKILL.md` deliberately omits from `## State` whatever `plan.md`, `map.md`, the ticket body and `docs/research/` already hold. Printing it alone hands the next session the leftovers and none of the substance.

**Rejected — `cat`ing a `SKILL.md` into the resume.** Doubles the skill, per the dedup rule above. Worth knowing that no Flow skill uses `!` blocks or `${CLAUDE_SKILL_DIR}`, so a `cat` copy would at least be byte-identical; the fault is purely the missing registration.

**Superseded — a `Read` label inside `## State`.** `handoff` writes a bullet list of paths with line ranges, and the resume greps the paths out and pipes them to `fmerge`. The user rejected the parsing: markdown scraped by a script is fragile.

## The direction

The user's words, 2026-08-22: a **custom file, or a custom section in the ticket file**, holding the references the resume needs — read directly, with **no agent involved in deciding what to read**.

Three properties that follow, and any shape has to hold all 3:

- **`handoff` decides, and writes it as data.** Not the resume script. The script contains no rules about what groundwork needs versus building, so `handoff` can skip a file, add an odd one, or take 40 lines from the middle of something, and the script never changes.
- **Machine-readable.** Detected and read directly, never parsed out of prose.
- **The whole read happens before Claude's first turn**, through `!` or hook stdout, so nothing costs a round trip.

## Open questions

- **Where the list lives.** Frontmatter would fit Flow's existing rule that `flow` is the only writer of ticket frontmatter, and would be structured for free. A separate file would keep the note beside each path, which `handoff` requires. Undecided.
- **Whether `flow` gains a command that emits the resume block**, which would put the whole thing behind one tested code path rather than shell in a markdown file.
- **How the skill gets loaded on resume.** Stacking (`/start /execute t047`) loads it correctly in one turn, but expansion happens before Claude reasons, so a refused `flow tickets start` still costs the skill's tokens. Routing through `/start` avoids that at the price of one tool call inside the same turn.
- **What happens when several tickets are in flight**, or none.

## Prior art

`wip/framework-build/session.md:132` has an `## On resume` section from the previous generation — read this file, read that one, next action, and a note on what can wait. Same problem, solved by hand.

`handoff/SKILL.md` already carries **What to open** for the no-ticket case: *"the files the first action opens, and nothing else. Full path, line range, and what the reader gets from each. Verify every path."* The ticket case has no equivalent.
