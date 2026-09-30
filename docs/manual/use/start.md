# Opening a session

Every session opens with `/flow:start`. It is a skill only you can start, and it does one of 3 things depending on what follows it: shows the board, loads one ticket, or opens a loose file. Whichever it did, it ends by handing the work to the right phase skill.

This page assumes a project with tickets in it. [Tickets](../tickets.md) says what a ticket is and how one gets made.

## Table of contents

- [With nothing: the board](#with-nothing-the-board)
- [With a ticket: one ticket, then its phase](#with-a-ticket-one-ticket-then-its-phase)
- [With a path: loose work](#with-a-path-loose-work)
- [Skipping `/flow:start`](#skipping-start)

## With nothing: the board

`/flow:start` alone prints the board, which is what `flow next` prints: the tickets in flight, then the ones ready to pick up, then the ones blocked and why.

```text
in flight (6), finish these before starting more:
  ID     STATUS      TYPE       PRI  PARENT  TITLE
  exp-1  groundwork  feature    -    -       Budgets per category
  exp-2  building    feature    -    exp-1   Store budgets and set them
  exp-4  building    issue      -    -       Report merges January to September into one month
  exp-5  groundwork  topic      -    -       Move the store from JSON to SQLite
  exp-6  building    prototype  -    exp-5   Does node:sqlite ship in the installed Node, and does it survive 10k rows
  exp-8  review      chore      -    -       Test that add refuses a negative amount

nothing ready. 1 todo ticket blocked:
  exp-3  Show what is left in the report
        exp-2 is building
```

A project with no tickets yet prints `no tickets yet.`, and the agent points you to `/flow:groundwork` for the first piece of work.

With tickets, the agent recommends one and says what decided it. The order is fixed: work already in flight beats work cut out of it, and both beat anything new, whatever its priority. Then it waits. You pick, by typing `/flow:start` again with the ticket after it: `/flow:start /exp-2`.

## With a ticket: one ticket, then its phase

Every open ticket is also a skill you can type, named for its id. Typing `/exp` lists them with their status and title. [Ticket skills](../reference.md#ticket-skills) in the reference says which tickets get one.

`/flow:start /exp-2` loads the ticket in full, and every file its `open` block names. The `open` block is the list of files a handoff left for the next session, and [Stopping and picking up](resume.md) says how it gets written.

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

Then the agent picks the phase skill and says in one line what decided it. The `type:` line decides for 3 types:

- `issue` → `/flow:debug`
- `prototype` → `/flow:prototype`
- `topic` → `/flow:groundwork`

A feature or a chore is decided by reading the ticket: its body, the `map:` line counting the groundwork questions answered, and `## State`. What they leave open picks the skill:

- **Decisions still open** → `/flow:groundwork`.
- **Decided, and nothing built yet** → `/flow:execute`, which starts by writing the plan. A ticket cut from a written spec usually lands here, even at `todo`.
- **Code in progress, or waiting on your review** → `/flow:execute`.
- **Too little written to tell** → the status decides: `todo` or `groundwork` goes to `/flow:groundwork`, and `planning`, `building` or `review` to `/flow:execute`.

`/flow:start` invokes that skill in the same session, with no argument, since the ticket is already on screen. `/flow:start` moves nothing: the phase skill writes the status once it has read the ticket, and [Who moves the status](status.md) says when.

A parked ticket routes on its `resumes at:` line, which names the status it left. A ticket at `done` or `dropped` stops here: reopening is your call, never the agent's.

## With a path: loose work

`/flow:start ~/notes/pricing/handoff.md` opens work outside a Flow project, meaning a folder with no `.flow/`: a file beside the thing being worked on. The agent reads it and carries on from whatever the file says comes next.

Inside a project, work with no ticket gets one when it is handed off, so it shows on the board. [Stopping and picking up](resume.md) says how.

## Skipping `/flow:start`

A ticket skill works after a phase skill too. `/flow:execute /exp-2` loads the ticket exactly as `/flow:start /exp-2` does, and opens the phase without the routing step. Use it when you already know which phase the ticket is in. [The 4 phase skills](phases.md) says what else each accepts.
