# Phases

The 4 skills that work on a ticket, which one to pick, and what each leaves in the ticket.

## Table of contents

- [Let `/flow:start` pick](#let-flowstart-pick): it shows your tickets, or picks the phase for one
- [Type a phase yourself](#type-a-phase-yourself): with a ticket, with words, or alone
- [`/flow:groundwork`](#flowgroundwork): turn an idea and your notes into decisions, then into tickets
- [`/flow:execute`](#flowexecute): plan one ticket, build it, and what happens when the build goes wrong
- [`/flow:debug`](#flowdebug): find a bug's cause, prove it, and fix it
- [`/flow:prototype`](#flowprototype): answer one question with quick code

## Let `/flow:start` pick

`/flow:start` alone shows your tickets and recommends one, work already in progress first. `/flow:start /shop-5` starts the phase that ticket needs:

- **`issue`** → `/flow:debug`
- **`prototype`** → `/flow:prototype`
- **`topic`**, or a `feature` or `chore` with decisions still open → `/flow:groundwork`
- **`feature` or `chore` already decided** → `/flow:execute`

## Type a phase yourself

- **`/flow:execute /shop-7`**: starts the phase on that ticket.
- **`/flow:groundwork /shop-5 compare only free libraries`**: words after the ticket are your instructions.
- **`/flow:groundwork we need receipt uploads`**: with no ticket, the phase creates one from your words.

Each time you type a phase, its whole skill is added to the conversation again, so type it once per session.

## `/flow:groundwork`

Turns an idea into a design, with every decision written down. It writes no plan and no code.

1. **Map**: list every decision the work needs, including the ones nobody raised.
2. **Walk**: settle them with you one at a time. A question talk cannot answer gets research or a prototype.
3. **Attack**: run the design through real cases, the awkward ones included.
4. **Route**: work to build becomes tickets. What outlives the build, such as what the product must do, goes in `docs/spec/`.

Material you already have, such as notes, drafts or research, is read before the first decision. Put it in `docs/intake/` for the whole project, in the ticket's `intake/` for one piece of work, or name a folder: `/flow:groundwork /shop-5 read ~/notes/charts first`.

The decisions land in the ticket's `groundwork/map.md`, a checklist with each answer under it:

```md
- [ ] 0: Distribution
  - [x] 0.0: which platform do we publish to first?
  - [ ] 0.1: do we cut vertical versions for shorts?
- [ ] 1: how many episodes ship before we judge the format?
```

## `/flow:execute`

Builds one ticket, from its plan through review.

1. **Plan**: it writes `plan.md`, numbered steps that each end on a check, and waits for your yes. A plan of one step in one file goes straight through.
2. **Build**: it builds the steps in order and runs each check. A step can go to a helper agent: [Subagents](subagents.md).
3. **Review**: it runs the full test suite, checks the work against the plan, and moves the ticket to `review`.
4. **Done**: notes from you go back to step 2, and your yes moves the ticket to `done`.

```md
1. [ ] **Add the config table**: `db/migrations/0031_rate_limit.sql`, `db/schema.ts`
       Check: `pnpm db:migrate && pnpm test:db`
```

When the build goes wrong:

- **A step keeps failing.** After a few simple fixes leave the same failure, the agent says what it believed, and starts `/flow:debug`.
- **The plan turns out wrong.** A change to how this ticket gets built rewrites `plan.md`, and the agent says what changed. Anything bigger it proposes to you first.
- **You reject what was built.** A list of changes becomes new steps. A new idea of the ticket sends it back to `/flow:groundwork`, and you choose whether the code stays. The agent prints the git command to undo it, for you to run.

## `/flow:debug`

Finds a bug's cause from evidence, proves it, then fixes it.

1. **Make it fail on demand**, with a fast check that fails the same way every time.
2. **Rank 3 guesses at the cause**, and show you all 3.
3. **Test each guess** by predicting what the check does, then running it.
4. **Fix the cause**, and run the check again.

Its report, `reports/<failure>.md`, opens with one of 3 results:

- **`FIXED`**: the ticket moves to `review`.
- **`FOUND_NOT_FIXED`**: the cause is proved, and the fix needs a decision from you.
- **`UNPROVEN`**: every guess failed, and you decide whether the hunt goes on.

## `/flow:prototype`

Answers one question with quick code, such as whether a library handles 10,000 rows. The code lives in the ticket's `protos/<name>/`, and never becomes the real build. Its report, `reports/<question>.md`, gives the answers first, with the numbers measured.
