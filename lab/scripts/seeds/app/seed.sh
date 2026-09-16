#!/usr/bin/env bash
# app: a small real program with a board of tickets that fit it, so every
# phase skill runs against code. try.sh copies files/ into the project first,
# then runs this with FLOW_JS and PROJ set.
set -euo pipefail
flow() { node "$FLOW_JS" "$@" >/dev/null; }
folder() { ls -d "$PROJ"/.flow/tickets/"$1"-*; }

# t001: a parent at groundwork, its map settled but for one question that
# waits on the children. Picking it up refuses while t002 and t003 are open.
flow new "Budgets per category" --type feature --label "budgets" --body - <<'MD'
# Budgets per category

A monthly amount per category, so the report shows what is left and `add` warns when a category is over.

## Done when

`expense budget set food 200`, then 3 records adding to 210 in one month: the report shows `food -10.00 left` and the third `add` prints a warning.
MD
flow groundwork t001
cat > "$(folder t001)/groundwork/map.md" <<'MD'
# Budgets per category: groundwork

- [x] 0: Where a budget lives
  - [x] 0.0: its own file, or a field on each record?
- [x] 1: Monthly or total?
- [ ] 2: What `add` does when the category is over
  - [ ] 2.0: warn and record, or refuse?
  - [ ] 2.1: does a budget of 0 mean no budget, or nothing allowed?

## 0: Where a budget lives

Its own file, `budgets.json`, one entry per category. A field on each record would repeat the amount on every row and go stale the day the budget changes.

## 1: Monthly or total?

Monthly. A total budget has no end, so nothing ever resets, and the report already groups by month.

## References

- `src/budgets.js`: the file read and write, built by t002
MD

# t002: a child mid-build. Steps 1 and 2 are in the code, 3 and 4 are not.
flow new "Store budgets and set them" --type feature --parent t001 --label "budget store" --body - <<'MD'
# Store budgets and set them

The file, the read and write, and `expense budget set <category> <amount>`. The report and the warning come later.

## Done when

`expense budget set food 200` writes `budgets.json`, and `expense budget` prints every budget, one per line.
MD
flow plan t002
flow build t002
cat > "$(folder t002)/plan.md" <<'MD'
# Store budgets and set them: plan

## Now

`src/store.js` reads and writes `expenses.json` and nothing else. `src/cli.js` dispatches `add` and `report` by the first word.

## Steps

1. [x] **The budget file**: `src/budgets.js`
       Check: `node --test tests/budgets.test.js`
2. [x] **`budget set` and `budget` in the command line**: `src/cli.js`
       Check: `node src/cli.js budget set food 200 && node src/cli.js budget`
3. [ ] **Refuse a category with no records**: `src/budgets.js`, `src/store.js`
       Check: `node --test tests/budgets.test.js`
4. [ ] **The README**: `README.md`
       Check: the 2 budget commands appear under the example block
MD
cat >> "$(folder t002)/ticket.md" <<'MD'

## State

Now: steps 1 and 2 pass. Step 3 is not started: `setBudget` accepts any category, and the user wants a typo like `fod` refused.

Found: `readAll` in `src/store.js` is the only place that knows every category, so step 3 reads the records through it rather than keeping a category list.

```open
plan.md
src/budgets.js:14-24   # setBudget, where step 3 goes
```
MD
cat > "$(folder t002)/issues.md" <<'MD'
# What the build taught

- `BUDGET_FILE` has to be set before `require('../src/budgets')` is evaluated in a test, or the module reads the real file. `tests/helpers.js` sets it inside `scratch()`, which every test calls first.
MD

# t003: a child cut from the parent, blocked by t002.
flow new "Show what is left in the report" --type feature --parent t001 --deps t002 --label "report budgets" --body - <<'MD'
# Show what is left in the report

The category lines of `expense report` gain a third column: the budget minus the month's total, for categories that have a budget.

## Done when

With `food` budgeted at 200 and 20.50 spent, the food line reads `food  20.50  179.50 left`.
MD

# t004: an issue with a real bug in src/dates.js. One command reproduces it.
flow new "Report merges January to September into one month" --type issue --label "month merge" --body - <<'MD'
# Report merges January to September into one month

`EXPENSE_FILE=tests/fixtures/expenses.json node src/cli.js report` prints 2 month lines, `2026-0` and `2026-1`, for records dated January, March and October. Expected 3 lines: `2026-01`, `2026-03`, `2026-10`.

## Done when

The command above prints 3 month lines, and a test in `tests/report.test.js` fails without the fix.
MD
flow build t004

# t005: a topic, its map half walked. t006 is the prototype it cut.
flow new "Move the store from JSON to SQLite" --type topic --label "sqlite store" --body - <<'MD'
# Move the store from JSON to SQLite

Whether the JSON file should become a database before the record count makes `report` slow.

## Done when

The map says yes or no, with the row count at which it flips.
MD
flow groundwork t005
cat > "$(folder t005)/groundwork/map.md" <<'MD'
# Move the store from JSON to SQLite: groundwork

- [x] 0: What gets slow first
- [ ] 1: Is `node:sqlite` usable without an install?
  - [ ] 1.0: does it ship in the installed Node, and does it survive 10k rows? → t006
- [ ] 2: What the migration costs the user

## 0: What gets slow first

`report` reads every record on every run. At 10k rows the JSON parse is a few milliseconds, so nothing is slow yet. The question is whether the move is worth doing before it is needed.
MD

flow new "Does node:sqlite ship in the installed Node, and does it survive 10k rows" --type prototype --parent t005 --label "sqlite check" --body - <<'MD'
# Does node:sqlite ship in the installed Node, and does it survive 10k rows

Answers question 1.0 of t005. Insert 10k rows into an in-memory `node:sqlite` database and sum them by month.

## Pass

`require('node:sqlite')` loads, and the sum over 10k rows returns in under 100 ms.

## Fail

The module is missing, or the sum takes longer than reading the JSON file.

## Done when

`reports/sqlite-check.md` holds the Node version, the timing, and pass or fail.
MD
flow build t006

# t007: a feature parked at groundwork, waiting on t005.
flow new "Recurring expenses" --type feature --label "recurring" --body - <<'MD'
# Recurring expenses

A rent paid every month is typed once. Open: whether a rule generates rows or the report expands it on the fly.

## Done when

`expense add 900 rent --every month` then `expense report` for 3 months later shows 3 rent lines.
MD
flow groundwork t007
flow park t007 --reason "waits on the store decision in t005: a rule is a row in SQLite and a second file in JSON"

# t008: a chore at review. The test it adds is in the tree.
flow new "Test that add refuses a negative amount" --type chore --label "negative test" --body - <<'MD'
# Test that add refuses a negative amount

`add` already refuses one. Nothing proved it.

## Done when

`tests/add.test.js` has a test that fails when the check in `src/add.js` is removed.
MD
flow plan t008
flow build t008
cat > "$(folder t008)/plan.md" <<'MD'
# Test that add refuses a negative amount: plan

## Now

`tests/add.test.js` covers the happy path and nothing else.

## Steps

1. [x] **The test**: `tests/add.test.js`
       Check: `node --test tests/add.test.js`
MD
flow review t008

# t009: done. The category totals it built are in src/report.js.
flow new "Show the report by category" --type feature --label "category report" --body - <<'MD'
# Show the report by category

`expense report` sums every record by category, one line each, sorted by name.

## Done when

`node --test tests/report.test.js` passes with a test summing the fixture by category.
MD
flow plan t009
flow build t009
flow review t009
flow done t009
