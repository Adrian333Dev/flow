# Opening a session

Every session opens with `/flow:start`. It is a skill only you can start, and it does one of 2 things depending on what follows it: shows the board, or loads one ticket. Either way, it ends by handing the work to the right phase skill.

This page assumes a project with tickets in it. [Tickets](../tickets.md) says what a ticket is and how one gets made.

## Table of contents

- [With nothing: the board](#with-nothing-the-board)
- [With a ticket: one ticket, then its phase](#with-a-ticket-one-ticket-then-its-phase)
- [Skipping `/flow:start`](#skipping-start)

## With nothing: the board

`/flow:start` alone prints the board, which is what `flow next` prints: how many tickets sit at each status, the ticket closed last, the tickets in flight, then the ones cut out of work in flight, then the ones ready to pick up. Where nothing is in flight or ready, the blocked tickets print, each with why. Parked tickets come last.

```text
tickets: 9   todo 1   groundwork 2   planning 0   building 3   review 1   done 1   parked 1   dropped 0

last closed  exp-9  Show the report by category

in flight (4), finish these before starting more:
  ID     STATUS    TYPE       PRI  PARENT  TITLE
  exp-2  building  feature    -    exp-1   Store budgets and set them
  exp-4  building  issue      -    -       Report merges January to September into one month
  exp-6  building  prototype  -    exp-5   Does node:sqlite ship in the installed Node, and does it survive 10k rows
  exp-8  review    chore      -    -       Test that add refuses a negative amount

unfiled: 1 closed ticket not yet filed   (flow ls --unfiled)
         run file-findings to sweep them

parked (1):
  ID     TITLE               REASON
  exp-7  Recurring expenses  waits on the store decision in exp-5: a rule is a row in SQLite and a second file in JSON
```

**A parent with open children is left out of `in flight`.** exp-1 and exp-5 are both at `groundwork`, and neither shows: each waits on its children, and picking one up refuses until they close. Its children stand in for it, in flight themselves like exp-2 and exp-6, or under `continues open work` while they wait to start.

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

## Skipping `/flow:start`

A ticket skill works after a phase skill too. `/flow:execute /exp-2` loads the ticket exactly as `/flow:start /exp-2` does, and opens the phase without the routing step. Use it when you already know which phase the ticket is in. [The 4 phase skills](phases.md) says what else each accepts.
