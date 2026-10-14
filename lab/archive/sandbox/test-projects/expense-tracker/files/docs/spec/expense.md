# expense: what it does

A command-line expense tracker for one person. Every record is an amount, a category, a date and a note, kept in one JSON file.

## Built

- `add`: one record, dated today unless `--date` says otherwise. Refuses an amount at or below zero.
- `report`: totals by category, then by month.
- `budget set`: a monthly amount per category.

## Decided and not built

- **Export to CSV.** `expense export` writes every record as one CSV row, oldest first, with a header line. The columns are the record's fields in order. Done when `expense export | wc -l` is the record count plus 1.
- **A date range on the report.** `expense report --from 2026-01-01 --to 2026-03-31` counts only records inside the range, both ends included. A range with no records prints the headings and nothing under them.
