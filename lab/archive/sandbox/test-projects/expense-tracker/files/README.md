# expense

A command-line expense tracker. Records live in `expenses.json` beside the command, budgets in `budgets.json`.

```sh
expense add 12.50 food "lunch"          # record one, dated today
expense add 40 travel "train" --date 2026-03-02
expense report                          # totals by category, then by month
expense budget set food 200             # a monthly budget for one category
npm test
```
