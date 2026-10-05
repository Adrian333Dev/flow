# Walkthroughs

Each kind of work, from the first thing you type to the closed ticket. Every walk assumes Flow is [installed](install.md) and the project set up with `flow init`.

Most steps type a phase with a ticket after it, such as `/flow:execute /shop-9`. Every open ticket is also a skill, so typing `/shop` lists them to pick from: [Tickets](tickets.md#naming-a-ticket).

## Table of contents

- [A new project, from idea to built](#a-new-project-from-idea-to-built): the idea, the spec, then tickets cut from it chunk by chunk
- [An existing project, brought into Flow](#an-existing-project-brought-into-flow): the setup session, and your yes on every change
- [A feature in a project you already have](#a-feature-in-a-project-you-already-have): design it, plan it, build it
- [A bug](#a-bug): find the cause, prove it, fix it
- [A question only running code can answer](#a-question-only-running-code-can-answer): quick code, and a report with the numbers
- [A decision with nothing to build](#a-decision-with-nothing-to-build): the decisions are the result
- [Upkeep, such as a dependency bump](#upkeep-such-as-a-dependency-bump): straight to the plan

## A new project, from idea to built

A habit tracker, in an empty folder:

1. **Set it up.** `flow init` in the folder.
2. **Describe the whole idea.** Put any notes or research you have in `docs/intake/` first. `/flow:groundwork a habit tracker that families share` makes a `topic` ticket, the type for a decision with nothing to build yet. On an idea this big, the first run settles the scope, then splits each big subject into a child ticket.
3. **Settle each subject.** `/flow:groundwork /habits-2` walks one subject's decisions with you, one at a time.
4. **Read the spec.** `/flow:groundwork` then writes `docs/spec/product.md`, what the product must do, and `docs/spec/tech.md`, how it is built. Each behavior carries a mark: a release such as `V1`, `next`, `later`, or `never` with the reason. Nothing is cut before your yes.
5. **Cut the first chunk.** `/flow:tickets-from-spec` turns the `V1` behaviors that matter most next into tickets. Tickets cut far ahead go stale, so it leaves the rest for later runs. Only you can start it.
6. **Build ticket by ticket.** `/flow:groundwork /habits-6` while a decision is open, `/flow:execute /habits-6` once it is decided. `/flow:start` recommends the next ticket.
7. **Cut the next chunk** with `/flow:tickets-from-spec` as each one gets built. Once `V1` is all cut, mark the next release `V2` in `product.md`.

## An existing project, brought into Flow

The `shop` project, with code, a `CLAUDE.md` and a folder of plans:

1. **Set it up.** `flow init` opens the setup session, which reads the project before anything changes: [New project](new-project.md#a-folder-that-already-has-files).
2. **Read the form.** The session writes every change into one file, `migration.md`, such as `9 rules → AGENTS.md`. Untick a line to keep that part as it is.
3. **Say go.** The session makes the changes. `flow restore project` undoes all of them later.
4. **Start Claude Code again**, so the project's new rules load.
5. **Write the spec.** Setup added a "Write the product spec" ticket where the project held plans. `/flow:groundwork /shop-1` turns the plans into `docs/spec/`.

## A feature in a project you already have

Receipt uploads, in the `shop` project:

1. **Describe it.** `/flow:groundwork we need receipt uploads` makes a ticket and lists every decision the feature needs, such as where files are stored and the size limit.
2. **Settle the decisions**, one at a time. Drafts for this feature go in the ticket's `intake/` folder first.
3. **Approve the plan.** `/flow:execute /shop-9` writes `plan.md`, numbered steps that each end on a check. Nothing is built before your yes.
4. **Let it build.** It builds and checks each step, runs the full test suite, and moves the ticket to `review`.
5. **Accept it.** Notes send it back to the build. Your yes moves it to `done`.

A small feature with nothing to decide skips the design: `/flow:execute add a CSV export button`.

## A bug

Logging in on Safari lands back on the login page:

1. **Describe what fails.** `/flow:debug Safari logs me out after login` makes an `issue` ticket and starts at once.
2. **Watch the hunt.** It makes the bug fail on demand, shows you its 3 best guesses at the cause, and tests each one.
3. **Read the report**, which opens with `FIXED`, `FOUND_NOT_FIXED` (the fix needs your decision) or `UNPROVEN`.
4. **Confirm the fix.** Your yes moves the ticket to `done`.

## A question only running code can answer

Whether a PDF library renders 10,000 rows in under a second:

1. **Ask it.** `/flow:prototype can pdfkit render 10,000 rows in under a second` makes a `prototype` ticket.
2. **Read the answer.** It writes quick code in the ticket and runs it, then a report with the numbers measured.
3. **Accept it.** The code stays in the ticket, and never becomes the real build.

## A decision with nothing to build

Whether to move the shop's API from REST to GraphQL:

1. **Ask it.** `/flow:groundwork should the API move to GraphQL` makes a `topic` ticket.
2. **Settle it.** Each decision, a "no" included, lands in the ticket's `groundwork/map.md`, and the map is the result.
3. **Close it** once you agree. An answer that needs building gets a child ticket per part.

## Upkeep, such as a dependency bump

1. **Make the ticket.** `! flow new "Bump React to 19" --type chore` in the session. A command typed behind `!` runs in the session's terminal.
2. **Go straight to the plan.** `/flow:execute /shop-12`. A plan of one step in one file builds without waiting for your yes.
3. **Accept it.** Your yes moves the ticket to `done`.
