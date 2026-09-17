# Opening a session

Every session opens with `/flow:start`. It is a skill you type, and it does one of 3 things depending on what follows it: shows the board, loads one ticket, or opens a loose file. Whichever it did, it ends by handing the work to the right phase skill.

This page assumes a project with tickets in it. [Tickets](../tickets.md) says what a ticket is and how one gets made.

## Table of contents

- [With nothing: the board](#with-nothing-the-board)
- [With a ticket id: one ticket, then its phase](#with-a-ticket-id-one-ticket-then-its-phase)
- [With a path: loose work](#with-a-path-loose-work)
- [Skipping `/flow:start`](#skipping-start)
- [A misspelt id costs one line](#a-misspelt-id-costs-one-line)

## With nothing: the board

`/flow:start` alone prints the board, which is what `flow next` prints: the tickets in flight, then the ones ready to pick up, then the ones blocked and why.

```text
in flight (6), finish these before starting more:
  ID    STATUS      TYPE       PRI  PARENT  TITLE
  t001  groundwork  feature    -    -       Budgets per category
  t002  building    feature    -    t001    Store budgets and set them
  t004  building    issue      -    -       Report merges January to September into one month
  t005  groundwork  topic      -    -       Move the store from JSON to SQLite
  t006  building    prototype  -    t005    Does node:sqlite ship in the installed Node, and does it survive 10k rows
  t008  review      chore      -    -       Test that add refuses a negative amount

nothing ready. 1 todo ticket blocked:
  t003  Show what is left in the report
        t002 is building
```

The agent recommends one ticket and says what decided it. The order is fixed: work already in flight beats work cut out of it, and both beat anything new, whatever its priority. Then it waits. You pick, by typing `/flow:start` again with the id.

## With a ticket id: one ticket, then its phase

`/flow:start t002` loads the ticket in full, and every file its `open` block names. The `open` block is the list of files a handoff left for the next session, and [Stopping and picking up](resume.md) says how it gets written.

````md
t002  Store budgets and set them
status: building   type: feature   parent: t001
priority:   normal
deps:       -
dependents: t003 (todo)
plan:       plan.md   2/4 steps
path:       .flow/tickets/t002-budget-store/ticket.md
------------------------------------------------------------
# Store budgets and set them

The file, the read and write, and `expense budget set <category> <amount>`. The report and the warning come later.

## Done when

`expense budget set food 200` writes `budgets.json`, and `expense budget` prints every budget, one per line.

## State

Now: steps 1 and 2 pass. Step 3 is not started: `setBudget` accepts any category, and the user wants a typo like `fod` refused.

Found: `readAll` in `src/store.js` is the only place that knows every category, so step 3 reads the records through it rather than keeping a category list.

```open
plan.md
src/budgets.js:14-24   # setBudget, where step 3 goes
```

------------------------------------------------------------
open: 2 files, 32 lines

``` .flow/tickets/t002-budget-store/plan.md
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

Then the `type:` line picks the phase skill, and for a feature or a chore the `status:` line does:

- `issue` → `/flow:debug`
- `prototype` → `/flow:prototype`
- `topic` → `/flow:groundwork`
- `feature` or `chore` at `todo` or `groundwork` → `/flow:groundwork`
- `feature` or `chore` at `planning`, `building` or `review` → `/flow:execute`

`/flow:start` invokes that skill in the same session, with no argument, since the ticket is already on screen. `/flow:start` moves nothing: the phase skill writes the status once it has read the ticket, and [Who moves the status](status.md) says when.

A parked ticket routes on its `resumes at:` line, which names the status it left. A ticket at `done` or `dropped` stops here: reopening is your call, never the agent's.

The id takes 3 forms, and all 3 resolve to the same ticket: `t002`, `t2`, or the folder name `t002-budget-store`. The number is the identity and the label is decoration.

## With a path: loose work

`/flow:start docs/notes/pricing.md` opens work that has no ticket: a file beside the thing being worked on. The agent reads it and carries on from whatever the file says comes next.

## Skipping `/flow:start`

The 4 phase skills take the same id. `/flow:execute t002` loads the ticket exactly as `/flow:start t002` does, and opens the phase without the routing step. Use it when you already know which phase the ticket is in. [The 4 phase skills](phases.md) says what each accepts.

## A misspelt id costs one line

`/flow:start t047` with no such ticket prints `flow`'s refusal and loads nothing:

```text
flow: no ticket t047.
```

The check runs before the skill's text is built, so a typo never spends the context the skill would have taken. The same check guards the 4 phase skills. [Settings](../settings.md) describes the hook that runs it.
