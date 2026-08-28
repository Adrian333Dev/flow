# The `flow` surface, reworked

Decided 2026-08-22, built 2026-08-23. The user reopened the CLI redesign on one complaint — the commands are too long — and the session ended with the whole surface settled and a bug found in `start`. Everything below is locked unless marked open.

`references/cli-design.md` is the shipped rule set. It was rewritten with this work, and 2 of its rules are reversed: `edit` no longer takes a status, and a command that sets a field is now the normal way to move one.

## What is locked

- **`tickets` is the default noun.** `flow ls`, `flow new "…"`, `flow edit t047`. The user's words: *"it's basically the main entity… it doesn't make sense to write tickets every time."* Cases keep their group, `flow cases ls`, because they are typed 4 times across every file to tickets' 36.
- **Status verbs generate from the status table.** `statuses.js` gains a `verb` column — `building` carries `build`, `planning` carries `plan`, `parked` carries `park`. Adding a status adds a row and its command appears, which is the whole thing the old rule was protecting.
- **`edit --status` is removed.** Status moves happen through verbs and nowhere else. `edit` keeps `--title`, `--type`, `--priority`, `--parent`, `--label`. Two ways to write one move means skills write the long one, because it is the documented general form.
- **`flow <id>` shows the ticket.** A first word that resolves to no action is an id. `flow 1`, `flow t047`, `flow parser` all reach `get`.
- **`filed` is renamed `file`** — `flow file t047 t048 t049`.
- **`flow start` is deleted, and `/start` writes nothing.** Its `!` line becomes `flow $ARGUMENTS`. Every write now happens after something has been read.
- **Each skill moves the status itself at pickup**, after opening the phase's own artifact.
- **`park` records the status it left**, and revive returns there. Today it does not, which is the bug below.
- **`flow <id>` gains 3 lines** — the plan's step count, the pickup command, and `parked from:` where one applies.
- **Ids keep their label in the folder name.** `docs/tickets/t047-parser-split/` is readable in a path, a diff and an `ls`; `t047/` is not. The bare number already resolves, so nothing forces the label on anyone typing.
- **A ticket is never renamed after creation** (user, 2026-08-22). This kills the backlog item about sweeping long labels off existing tickets — no rename means no migration and nothing to chase. `--label` survives as a cheap way to fix a typo at creation.
- **The test suite comes after the restructure**, not before. The user's argument won: the test setup is itself structure-dependent — where tests live, which runner, how `flow` is imported — so writing it first means moving it twice.
- **`backlog.md` regroups by area.** It groups on 2 axes today, area and state, so every item has 2 homes and lands in whichever the writer thought of. Area becomes the only axis; state becomes a marker on the line, `talk first` and `parked`. Order lives in a short `## Next` that points at items by name.

## The surface

**Board** — `flow next` · `flow status` · `flow check` · `flow tree` · `flow ls [--filters]`

**Tickets**, with no `tickets` word anywhere:

- **`flow <id>`** — show it. `flow get <id>` is the explicit form
- **`flow new "<title>"`** — `--type --parent --deps --priority --body`
- **`flow edit <id>`** — `--title --type --priority --parent --label`
- **`flow dep <id>`** — `--on <id>` | `--off <id>`
- **`flow file <id>...`** — stamp the filing pass
- **`flow drop <id> --reason "…"`** — `--by <id>` | `--force`

**Status verbs**, generated: `flow groundwork <id>` · `flow plan <id>` · `flow build <id>` · `flow review <id>` · `flow done <id>` · `flow park <id> --reason "…"` · `flow todo <id>`

**Cases** keep their group: `flow cases new|ls|get|edit`.

Deleting `start` removes the one prefix collision worth knowing: `flow st` would otherwise have been ambiguous between `status` and `start`.

## Where `flow start`'s jobs went

It did 4 things. Each has a home, and none of them writes before a read:

- **Computed the entry status from the type** → `flow <id>` prints it as a command rather than performing it: `pick up with: flow groundwork t047`. The type-to-status fact stays in `statuses.js`.
- **Guarded the move** — terminal reopen, unmet dependencies, open children → already inside `transition`, which every status verb goes through. Nothing is lost by deleting the action.
- **Revived from `parked`** → `park` stores the status it left, `flow <id>` prints `parked from: building`, and revive is the ordinary verb `flow build t047`.
- **Reported the ticket** → that is `flow <id>` itself.

**What each skill does at pickup**, replacing the mechanical move:

- **`/groundwork` at `todo`** → `flow groundwork t047`, then walk the map
- **`/groundwork` at `groundwork`** → open `map.md`. Closed → `flow plan t047` and hand to `/execute`. Open → keep walking
- **`/execute` at `planning`** → open `plan.md`. Written and approved → `flow build t047`. Otherwise keep writing
- **`/execute` at `building`** → every step `[x]` → run the check, then `flow review t047`. Otherwise resume at the first `[ ]`
- **`/debug` at `todo`** → `flow build t047`

**The trade, accepted knowingly.** The status move stops being mechanical and becomes an instruction, and an instruction can be skipped. Two things hold it up: `flow <id>` prints the exact command, so it is copy rather than think, and it is the first act in each skill's pickup rather than a line buried in `/start`. If it drifts in practice the fix is a `PreToolUse` check, never putting the write back in front of the read.

## Built 2026-08-23

All 12 steps landed, and the whole surface was walked against scratch trees at `tmp/walk/` and `tmp/final/` — every type's full path, both refusals, park and revive, drop, file, and every read view.

1. **`statuses.js`** — a `verb` column on every row, `VERB_OF`, and a `DOES` map of one-line summaries. `dropped` carries no verb.
2. **`cli.js`** — `dispatch` takes one flat command table plus a fallback. `match()` is `resolve()` without the last refusal, so a word matching nothing falls through to the id path while an ambiguous one still fails. Help prints by `section`.
3. **`tickets.js`** — `start` deleted, `--status`, `--reason` and `--force` off `edit`, `filed` renamed `file`, and the verbs generated in a loop over the table. `transition` writes `resume`.
4. **`store.js`** — `now()` carries seconds, `resume` joins `TICKET_KEYS`, `planSteps()` counts the checkboxes in `plan.md`.
5. **`flow.js`** — an `error` listener on stdout exits 0 on `EPIPE`. Composes the flat table, the sections and the fallback; `NOTES` rewritten.
6. **`render.js`** — `planLine` prints `4/7 steps`, `reviveVerb` reads the stored status, `pickupLine` prints the command for a `todo` or `parked` ticket, and `show` gains a `resumes at:` field.
7. **`commands/start.md`** — the `!` line reads and nothing else, `todo` routes to `/groundwork`, and `parked` and the terminal pair got the rows `flow start` used to absorb.
8. **`groundwork`, `execute`, `debug`, `prototype`** — each writes its own status at pickup. `execute` gained a 4-row pickup list, `groundwork` an `## Arriving on a ticket` section, `debug` and `prototype` one sentence each.
9. **The call sites** — swept across 10 shipped files. Nothing outside `lab/` still writes `flow tickets`, `flow start` or `--status <status>` as a move.
10. **`references/cli-design.md`** — rewritten, 85 → 105 lines. `## One default noun`, `## Status verbs` and `## Print the command, never perform it` are new sections; `## The two kinds of command` became three.
11. **`README.md`** — the 2 stale lines fixed. Its real pass waits for the restructure, which moves the paths its install section names.
12. **`backlog.md`** — regrouped into 14 areas with a 4-line `## Next`. All 82 items kept, 4 more marked done.

## Where the build left the plan

Six places, none of them reversing a decision:

- **The field is `resume`, and it prints as `resumes at: building`.** The plan wrote `parked from:`, which is 13 characters where every other label in that header is 12 — it would have broken the column the header is read down.
- **No refusal on reopening a closed ticket.** The plan said `transition` already held that guard. It did not: the refusal lived in `start` alone, with `edit --status` as the deliberate way past it, and both are gone. Left out on purpose — `start` computed its destination, so on a closed ticket it picked one silently, and a verb names the destination out loud. `flow groundwork t047` on a done ticket prints the move and clears `closed`.
- **`/start` kept its conditional shell line.** `flow` bare prints help rather than `status`, so `flow $ARGUMENTS` alone would open a session with the help text. Both branches read and neither writes, which is the whole point of the change.
- **4 rows the pickup list did not have.** `/start` gained `parked` and the terminal pair. `/execute` gained `todo`, for a ticket cut from a spec, and `review`, where the work is with the user. `/groundwork` gained the `topic` ending — a closed map means `flow done <id>`, because there the map was the deliverable.
- **`flow new` prints the pickup command too.** One line, and a ticket is created and picked up in the same breath often enough to earn it.
- **`ls` and `tree` sit in the board section**, not with the ticket commands. They answer a question about the work as a whole, which is the test `cli-design.md` already used.

## Rejected, and why each died

- **Several ids on `edit`, `start` and `drop`.** The only case ever named was `file-findings` closing a batch. The skill does no such thing: it sweeps tickets that are *already* closed and marks them with `flow tickets filed t047 t048 t049`, which already takes a list. `threads.md` recorded the case wrong and `backlog.md` copied it. Nothing else needs it — `execute` builds one ticket at a time and `drop --force` already cascades a branch.
- **A `proposed` status**, between `planning` and `building`, for a plan written and waiting on the user. Superseded within the same conversation by the checkpoint idea, then dropped with it.
- **A `finished: <status>` field**, marking the current phase complete so `start` could choose between resume and advance. Killed by the user on 2 grounds: the normal flow would pay 2 commands where 1 was right, and forgetting the second leaves a ticket marked finished inside the phase it finished — the exact broken state the field existed to prevent. It only ever earned its keep after a cleared session.
- **An `advance` verb.** Where it lands depends on the type, so it never says whether you reached `planning` or `review`, and skills name the exact status anyway.
- **Printing the next verb as the answer to "is this phase done".** The user's rejection: *"printing doesn't solve anything, we need something persistent."* The printed line survives as a convenience, never as the record.
- **Deriving phase completion inside the script**, by counting `[ ]` in `plan.md` or reading whether `map.md` closed. It makes a load-bearing decision depend on parsing prose, and a step marked `[x]` before its check ran would advance the ticket on its own. The *agent* reads those files instead, which is what an agent is for.

## The 3 bugs, and what fixed each

**`flow start` on a parked ticket destroyed progress.** A `feature` parked at `building` revived at `groundwork`, on the command the tool itself printed — `planning` and `building` gone, `plan.md` still on disk, the status now claiming the questions were open. Fixed by storing `resume` on the park and reading it back:

```
$ flow park t001 --reason "vendor API changes land in Q3"
t001  building → parked   Parser split
revive with: flow build t001

$ flow build t001
t001  parked → building   Parser split
      revived — cleared reason: vendor API changes land in Q3
```

**`flow ls | head -2` dumped a Node stack trace** and exited 1. Fixed by an `error` listener on stdout that exits 0 on `EPIPE`.

**`closed` recorded only the minute**, so closing a batch left several tickets tied and `last closed` picked whichever the directory listed first. Fixed by adding seconds to `store.now()`. Old values still sort correctly — a shorter string with the same prefix sorts first.

## Facts checked, so nothing is re-derived

- **`commands/start.md:6` runs before the model reads a word.** Claude Code executes the `!` shell, pastes its output over the line, then sends the file. So `/start t047` moves the ticket before any reasoning happens — which is exactly why the decision cannot live in a field the script reads.
- **`normalizeId` pads**, so `1` reaches `t001` and `47` reaches `t047`. Verified: `flow tickets get 1` returns t001.
- **`flow tickets …` is typed 36 times** across `skills/`, `commands/`, `global/` and the root `CLAUDE.md`; `flow cases …` 4 times.
- **`render.js:148` argues against a plan digest** — *"any digest in the header would be a second copy to keep true."* It holds for something written down and not for something counted on read, which is why the step count is safe. Same reason generated verbs are safe.
- **`threads.md:697` already recorded the resolution**, 2026-08-20: *"Both can exist. The generic form as the surface, the verbs generated from the status list as aliases."* The redesign built the generic half and dropped the aliases. The user's complaint was never that the design was wrong.

**The statuses**, and the path each type walks:

- `todo` · `groundwork` · `planning` · `building` · `review` · `done` · `parked` · `dropped`
- **`feature`, `chore`** — `todo → groundwork → planning → building → review → done`, chore usually skipping groundwork
- **`issue`, `prototype`** — `todo → building → review → done`
- **`topic`** — `todo → groundwork → done`

2 gates, both the user's: the plan before `building`, the work before `done`.

## Still open

- **The user thinks the redesign "feels ugly"** and kept it for now. The length complaint is answered — `flow build t047` against `flow tickets edit t047 --status building`. Whether anything else remains is unasked.
- **`flow` bare still prints help.** Whether it should print `status` was never raised, and `/start` works around it with a shell conditional.
- **No test suite.** Every one of these paths was walked by hand, which is the standing item in `backlog.md`.
