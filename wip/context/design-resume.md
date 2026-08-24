# Resuming after a clear

Raised 2026-08-22, **built 2026-08-24**. What shipped is in `## What was built` at the bottom; everything above it is the reasoning that got there, kept because the rejected shapes are why the built one looks like it does.

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

**Superseded — a `Read` label inside `## State`.** `handoff` writes a bullet list of paths with line ranges, and the resume greps the paths out and pipes them to `fmerge`. The user rejected the parsing: markdown scraped by a script is fragile. **The fence is what answered this 2026-08-24** — a bullet in prose has no edges, and a fenced block has two.

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

## What was built, 2026-08-24

**A separate file was proposed and rejected by the user.** Their objection: a second file is one more thing to
keep in step, and it duplicates something already written. The file proved them right —
`handoff/SKILL.md:70` already carried **What to open**, so a `resume.txt` would have been a second copy of
that section. One place, and the block sits where the note explaining each path already sits.

- **The syntax is a fenced block**, `flow-open`, inside `## State` on a ticket or near the top of a
  `handoff.md`. One path per line, `#` for a note, `:40-120` for a range. A fence has hard edges, which is
  what separates it from the bullet list rejected on 2026-08-22.
- **`flow open` is the reader** — `global/scripts/flow/commands/open.js`. Bare it prints the board; an id
  prints the ticket and loads its block; a second word is a status verb and moves the ticket first; a path
  route reads any file and its block, and is the one `flow` shape needing no git repo.
- **`commands/start.md` line 6 is one call** — `flow open $ARGUMENTS`. The shell conditional is gone, and
  every branch lives in Node where it can be tested.
- **Nothing is truncated.** `fmerge --force`, deliberately: past 2000 lines the guard returns line counts,
  which is right for an exploratory read and wrong for a resume. A header line prints the file and line
  count so the cost stays visible.
- **No minimum, and no maximum.** The user overturned a proposed floor of one. A ticket cut from a spec
  carries its own context, and an absent block is the honest answer there.
- **Paths resolve beside the ticket first, then from the repo root**, so `plan.md` and `src/parser.js` both
  land. Output renders from the root, so every path printed is one a tool can take back.
- **A guard stops the load.** A refused status move throws before anything is read, so a failed
  `flow open t047 build` loads no files at all.

### The four open questions, answered

- **Where the list lives** — in the document, fenced. Frontmatter lost because `flow` owns ticket
  frontmatter and `handoff` writes this.
- **Whether `flow` gains a command** — yes, and it absorbed the branching too. The user offered a shell
  script for the conditions; one Node command does the same job with one fewer file.
- **How the skill gets loaded** — unchanged. `/start` routes, and the artifact the skill would have opened
  is already in context, so routing now costs no read.
- **Several tickets in flight, or none** — naming the id settles the first. The second is still open: a
  bare `/start` has no id and no path, and a `handoff.md` sits beside whichever thing is worked, so several
  can exist with nothing pointing at one. Left out on purpose, and on `backlog.md`.
