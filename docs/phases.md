# Phases

The 4 skills that work on a ticket, which one to pick, and what each leaves in the ticket.

## Table of contents

- [Let `/flow:start` pick](#let-flowstart-pick): it shows your tickets, or picks the phase for one
- [Type a phase yourself](#type-a-phase-yourself): with a ticket, with words, or alone
- [`/flow:groundwork`](#flowgroundwork): turn an idea and your own notes into decisions, then into tickets
- [`/flow:execute`](#flowexecute): plan one ticket, build it, hand it to you, and what happens when the build goes wrong
- [`/flow:debug`](#flowdebug): find a bug's cause, prove it, and fix it
- [`/flow:prototype`](#flowprototype): answer one question with quick code
- [The 2 moments Flow waits for you](#the-2-moments-flow-waits-for-you): the plan, and the finished work

## Let `/flow:start` pick

`/flow:start` alone shows the board, the list of your tickets that `flow next` prints, and recommends one ticket. Work already in progress comes first, then work split from it, then anything new, whatever its priority. You pick by typing the ticket after it: `/flow:start /shop-5`.

With a ticket, `/flow:start` loads it, then starts the phase it needs and says in one line why:

- **`issue`** → `/flow:debug`
- **`prototype`** → `/flow:prototype`
- **`topic`** → `/flow:groundwork`
- **`feature` or `chore` with decisions still open** → `/flow:groundwork`
- **`feature` or `chore` already decided** → `/flow:execute`, whether nothing is built yet, code is half done, or the work is waiting on your review

A ticket in `done` or `dropped` stops there: reopening one is your call.

## Type a phase yourself

Skip `/flow:start` when you already know the phase:

- **`/flow:execute /shop-7`**: loads the ticket and the files its last session listed, then starts the phase on it.
- **`/flow:groundwork /shop-5 compare only free libraries`**: words after the ticket reach the agent as your instructions.
- **`/flow:groundwork we need receipt uploads`**: with no ticket, the phase creates one from your words first. `/flow:groundwork` makes a `topic`, `/flow:debug` an `issue`, `/flow:prototype` a `prototype` and `/flow:execute` a `feature`.

Outside a project, a new ticket goes in your Flow home as `home-1`. `flow move home-1 ~/code/shop` takes it to a project later.

Every time you type a phase, its whole skill file is added to the conversation again, so type it once per session.

## `/flow:groundwork`

Turns an idea into a design, with every decision written down. It writes no plan and no code. It moves the ticket to `groundwork` on arrival.

1. **Map**: list every decision the work needs, including the ones nobody raised.
2. **Walk**: settle them with you one at a time, writing each answer as it is decided. A question nobody can answer by talking gets research or a prototype.
3. **Attack**: run the design through real cases, the awkward ones included, before it stands.
4. **Route**: send each decision where it belongs. Work to build becomes tickets. What outlives the build, such as what the product must do, goes in `docs/spec/`.

**Material you already have** goes in an intake folder, and `/flow:groundwork` reads all of it before listing a single decision: brainstorms run with another agent, research reports, design drafts, notes to yourself.

- **`docs/intake/`** in the project: material for the whole project.
- **`intake/`** in a ticket's folder: material for that one piece of work.
- **Any folder you name**: `/flow:groundwork /shop-5 read ~/notes/charts first`.

A big pile gets an `index.md` written into its folder, saying what each file is. Later runs read the index rather than the pile. Nothing you dropped in is ever rewritten.

Everything lands in the ticket's `groundwork/map.md`, a checklist of questions with a section under it for each answer. The format, from the skill:

```md
- [ ] 0: Distribution
  - [x] 0.0: which platform do we publish to first?
  - [ ] 0.1: do we cut vertical versions for shorts?
- [ ] 1: how many episodes ship before we judge the format?
```

At the end, one piece of work stays one ticket. Bigger work gets a child ticket per part, under the first. A `topic` closes once you agree, since the decisions were the result.

## `/flow:execute`

Builds one ticket, from its plan through review.

1. **Plan**: it reads the code, then writes `plan.md`, numbered steps that each end on a check. It moves the ticket to `planning`, and waits for your yes on the steps. A plan of one step in one file goes straight through.
2. **Build**: after your yes it moves the ticket to `building`, then builds the steps in order and runs each step's check. A step can go to a helper agent: [Subagents](subagents.md) covers when.
3. **Review**: it runs the full test suite, checks the work against the plan and against the code, and moves the ticket to `review`.
4. **Done**: you read the work. Notes go back to step 2, and your yes moves the ticket to `done`.

A step in `plan.md`, from the skill's template:

```md
1. [ ] **Add the config table**: `db/migrations/0031_rate_limit.sql`, `db/schema.ts`
       Check: `pnpm db:migrate && pnpm test:db`
```

When the build goes wrong, one of 3 things happens:

- **A step fails.** The agent fixes it on the spot while each fix is simple, such as a wrong path or a missing import. When a run of fixes leaves the same failure standing, it tells you what it believed, then starts `/flow:debug` in the same session.
- **The plan turns out wrong.** A discovery that changes only how this ticket gets built rewrites `plan.md`, and the agent says what changed. It proposes anything bigger to you: a new ticket for work that stands on its own, the ticket back to `/flow:groundwork`, or the ticket dropped.
- **You reject what was built.** A list of changes becomes new steps in `plan.md`. A new idea of what the ticket should be sends the same ticket back to `/flow:groundwork`. What building it taught goes into the ticket's `issues.md` first, and you choose whether the code stays or goes. The agent prints the git command to undo it, and you run it. The next plan replaces the old one.

## `/flow:debug`

Finds a bug's cause from evidence, proves it, then fixes it. It moves the ticket to `building` on arrival.

1. **Make it fail on demand**, with a check that is fast and fails the same way every time.
2. **Rank 3 guesses at the cause**, each a different kind, and show you all 3.
3. **Test each guess** by predicting what the check does, then running it.
4. **Fix the cause**, and run the same check again.

It writes `reports/<failure>.md` in the ticket, opening with one of 3 results:

- **`FIXED`**: the ticket moves to `review`, then to `done` once you confirm the fix.
- **`FOUND_NOT_FIXED`**: the cause is proved, and the fix needs a decision from you.
- **`UNPROVEN`**: every guess failed. What it ruled out is the result.

The last 2 leave the ticket at `building`, and you decide whether the hunt goes on.

## `/flow:prototype`

Answers one question with quick code, such as whether a library handles 10,000 rows. The code lives in the ticket's `protos/<name>/`. It never becomes the real build, which reads it instead.

It writes `reports/<question>.md`: the answers first, in the question's words, with the numbers measured. It moves the ticket to `review`, and to `done` once you accept the answer.

## The 2 moments Flow waits for you

- **The plan**: `/flow:execute` builds nothing until you approve `plan.md`.
- **The finished work**: a ticket reaches `done` only on your yes.

Nothing else in a phase stops for you. To move a ticket yourself, type the command behind `!` in the session, `! flow park shop-7 --reason "waits on the API"`, or in any terminal. [Commands](reference/commands.md#ticket-status) lists every status command.
