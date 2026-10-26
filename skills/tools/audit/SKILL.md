---
name: audit
description: Answers a question about how something behaved, such as whether the agent follows a Flow rule, by counting the cases in past sessions and Flow's logs.
metadata:
  wiki:
    audit: load
---

# Audit

Answer a question about how something behaved by counting it in the records: whether a Flow mechanism fires and the agent follows it, why one broke, where work wastes tokens and steps, whether a trial rule file still works. A guideline: adapt each point to the question.

The records: past sessions through `flow audit`, the logs in `~/.flow/logs/`, ticket history, `git log`.

- **On a ticket** → `flow start <id> --activity debug`, also where it is already `in-progress`.
- **No ticket** → `flow new "<question>" --label audit`, then the same command.

`~/.flow/wiki/audit/` holds the records, the queries that worked and their traps.

## The method

- **Write the question first**, in the report: what a yes looks like, what a no looks like, and the baseline it is measured against. A question nothing can count, such as how a reply reads → hand it back to the user.
- **Find the record holding the answer, and the line between before and after**: the commit that shipped the change (`git log`), a date, a session with and one without.
- **Count every case, then read a few by hand** to check the count measures the question. A query or an approach that worked, and would serve another audit → a finding in `~/.flow/wiki/audit/findings/`, filed now.
- **Compare with the baseline**: before against after, with against without.
- **Report in `reports/<question>.md`** in the ticket folder: the answer first with its numbers, the cases read by session and turn, what was not checked, and a status:
  - `ANSWERED`: the count settles it.
  - `TOO_EARLY`: too few sessions since the line. Name the count that would settle it.
  - `NO_RECORD`: nothing records it. Name what would.

Name the report in the ticket's `## References` when you open it.

## Reading

- **Count here.** A subagent reads only where the question needs many whole sessions read, briefed with the question and what to quote back.
- **The raw `.jsonl` only for what the index does not store**, such as message text and its size.

## What it hands on

- **A failure found** → a ticket, by `## Capture`.
- **A fault with no known cause** → `/flow:debug`, with the sessions and turns as its starting evidence.

## Hard rules

- **Write the question before reading any data.**
- **Never conclude from cases read without a count.**
