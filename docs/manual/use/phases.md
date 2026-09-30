# The 4 phase skills

A phase skill is one you type to work a ticket through one phase: `/flow:groundwork` settles the open questions, `/flow:execute` plans and builds, `/flow:debug` finds a cause and fixes it, `/flow:prototype` answers one question with naive code, kept in the ticket as a reference. There are 4 and no more. This page says what each one accepts after its name and what that loads. [Opening a session](start.md) says which ticket goes to which skill.

## Table of contents

- [What the first word can be](#what-the-first-word-can-be)
- [What an id loads](#what-an-id-loads)
- [Text after the name is an instruction](#text-after-the-name-is-an-instruction)
- [Open a phase with the id from the start](#open-a-phase-with-the-id-from-the-start)
- [What each skill produces](#what-each-skill-produces)

## What the first word can be

Every phase skill reads the first word typed after its name the same way:

- **A ticket id**: `exp-2`, `2`, or the folder name `exp-2-budget-store`. The ticket loads, then the phase opens on it.
- **Nothing**: the phase opens on whatever is already in the conversation. This is how `/flow:start` invokes a phase, since it has already loaded the ticket.
- **Anything else**: the phase opens with no ticket, and the words are an instruction to it.

An id that matches no ticket is refused before the skill loads, and the refusal is `flow`'s own line: `flow: no ticket exp-47.`

## What an id loads

The first line of every phase skill runs `flow get <id> --files`, the command that prints one ticket and every file its `open` block names. What arrives, for `/flow:execute exp-2`:

````md
exp-2  Store budgets and set them
status: building   type: feature   parent: exp-1
priority:   normal
deps:       -
dependents: exp-3 (todo)
plan:       plan.md   2/4 steps
path:       .flow/tickets/exp-2-budget-store/ticket.md
------------------------------------------------------------
# Store budgets and set them
...
## State

Now: steps 1 and 2 pass. Step 3 is not started: `setBudget` accepts any category, and the user wants a typo like `fod` refused.
...
------------------------------------------------------------
open: 2 files, 32 lines

``` .flow/tickets/exp-2-budget-store/plan.md
# Store budgets and set them: plan
...
3. [ ] **Refuse a category with no records**: `src/budgets.js`, `src/store.js`
       Check: `node --test tests/budgets.test.js`
...
```

``` src/budgets.js:14-24
function setBudget(category, amount) {
...
}
```
````

Three things arrive at once: the ticket's header lines, its body with `## State`, and the contents of every file in the `open` block, cut to the line range where one is given. A path the block names and the disk does not hold is reported on a `missing:` line, so the agent knows not to look for it. The skill starts from all of that and opens nothing else until the work reaches it.

## Text after the name is an instruction

Anything typed after the id, or after the name with no id, reaches the skill as your first message. Both forms work:

```text
/flow:groundwork exp-5 start from the migration cost, the rest can wait
/flow:groundwork we need to decide where uploads are stored
```

The first loads exp-5 and then reads the instruction. The second opens groundwork with no ticket, which is normal: a topic often starts as a sentence and becomes a ticket in the skill's last phase.

## Open a phase with the id from the start

Each skill is a long file, and Claude Code adds it to the conversation whole. Running `/flow:execute` bare and then `/flow:execute exp-2` in the same session adds the text twice, because the second run renders differently, with the ticket in it. Typing the id the first time avoids the second copy. `/flow:start exp-2` has the same effect, since the skill it invokes runs bare.

## What each skill produces

Every phase leaves its result in the ticket folder, so a later session reads the file rather than the conversation. [Tickets](../tickets.md) lists every file a ticket folder can hold.

- **`/flow:groundwork`** writes `groundwork/map.md`: every question, settled or open, and the reasoning under each. At the end it cuts tickets for what was decided and hands a feature to `/flow:execute`.
- **`/flow:execute`** writes `plan.md`, waits for your yes on the steps, builds them, and hands the work back at `review`.
- **`/flow:debug`** writes `reports/<failure>.md`: the failing check, the hypotheses, the one that held, and the fix.
- **`/flow:prototype`** writes `reports/<question>.md`: what was built, what it showed, and the answer. The code stays beside it in `protos/<name>/`, as a reference the real build reads and never copies.
