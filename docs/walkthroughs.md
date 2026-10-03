# Walkthroughs

Each kind of work Flow handles, walked from the first thing you type to the closed ticket. Every walk assumes Flow is [installed](install.md) and the project set up with `flow init`. A project that already holds files gets a setup session first, which reads them before Flow changes anything: [An existing project, brought into Flow](#an-existing-project-brought-into-flow) walks it.

Most steps type a phase with a ticket after it, such as `/flow:execute /shop-9`. `/shop-9` is the ticket typed as a skill: Flow makes one for every open ticket, so typing `/shop` lists them to pick from. [Tickets](tickets.md#naming-a-ticket) covers ticket skills.

## Table of contents

- [A new project, from idea to built](#a-new-project-from-idea-to-built): the whole idea, the spec, then tickets cut from it chunk by chunk
- [An existing project, brought into Flow](#an-existing-project-brought-into-flow): the setup session reads it, and you approve every change
- [A feature in a project you already have](#a-feature-in-a-project-you-already-have): design it, plan it, build it
- [A bug](#a-bug): find the cause, prove it, fix it
- [A question only running code can answer](#a-question-only-running-code-can-answer): quick code, and a report with the numbers
- [A decision with nothing to build](#a-decision-with-nothing-to-build): the decisions are the result
- [Upkeep, such as a dependency bump](#upkeep-such-as-a-dependency-bump): straight to the plan

## A new project, from idea to built

A habit tracker, starting from an empty folder at `~/code/habits`:

1. **Set the project up.** `flow init` in the folder writes Flow's project files.
2. **Describe the whole idea.** Notes, brainstorms or research you already have go in `docs/intake/` first, and `/flow:groundwork` reads them before designing. `/flow:groundwork a habit tracker that families share` makes a `topic` ticket, the type for a decision with nothing to build yet. `/flow:groundwork` lists every decision the idea needs in the ticket's `groundwork/map.md`. On a subject this big, the first run settles the scope and the order, then stops. Each big subject becomes a child ticket with its own map.
3. **Settle each subject.** `/flow:groundwork /habits-2` walks one subject's decisions with you, one at a time. A question needing outside facts gets `/flow:research`. A question only running code can answer becomes a prototype ticket, walked in [A question only running code can answer](#a-question-only-running-code-can-answer).
4. **Read the spec.** Once the decisions are made, `/flow:groundwork` writes the spec: `docs/spec/product.md` for what the product must do, and `docs/spec/tech.md` for how it is built. Every behavior in `product.md` carries 1 of 4 marks:
   - **`V1`**: ships first.
   - **`next`**: committed, not yet.
   - **`later`**: wanted, with no commitment.
   - **`never`**: refused, with the reason.

   Nothing is cut from the spec before you approve it. A question still open becomes a `topic` ticket of its own.
5. **Cut the first chunk.** `/flow:tickets-from-spec` turns the `V1` behaviors that matter most next into tickets, and leaves the rest for later runs. Building the first tickets changes the plan for the rest, so tickets cut far ahead go stale. Only you can start it. A behavior one session can plan and build gets one ticket, and a bigger one gets a parent ticket with a child per part. Order that matters becomes waits, so `flow next` offers a ticket only once the tickets it waits on are finished.
6. **Build ticket by ticket.** Type the phase each ticket needs: `/flow:groundwork /habits-6` while a decision is still open, `/flow:execute /habits-6` once it is decided. Not sure which ticket is next? `/flow:start` shows your tickets and recommends one. [A feature in a project you already have](#a-feature-in-a-project-you-already-have) walks one ticket in full.
7. **Carry long work across sessions.** Past 150,000 tokens a warning arrives. `/flow:handoff` writes into the ticket where the work stands, `/clear` empties the conversation, and `/flow:execute /habits-6` picks the work up again. [Sessions](sessions.md) covers it.
8. **Cut the next chunk.** Run `/flow:tickets-from-spec` again as each chunk gets built. It skips every behavior a ticket already covers. Once `V1` is built, change marks in `product.md`: a `next` behavior you want now becomes `V1`, and the next run cuts it.

## An existing project, brought into Flow

The `shop` project, with code, a `CLAUDE.md` and a folder of planning docs:

1. **Set it up.** `flow init` in the project's folder. A folder that already has files gets the setup session, a Claude Code session that reads the project's rules, docs, code and Claude Code memory before anything changes. [New project](new-project.md#a-folder-that-already-has-files) covers when it asks first.
2. **Read the form.** The session writes every change it would make into one file, `migration.md`, and stops. Each line says what goes where, such as `9 rules → AGENTS.md`. Untick a line to leave that part as it is.
3. **Say go.** The session carries out the form. Nothing in the project changes before your go, and `flow restore project` undoes all of it later.
4. **Start Claude Code again.** Quit the session and type `claude`, so the project's new rules load.
5. **Write the spec.** Where the project held plans, setup added a "Write the product spec" ticket, and the plans stay until it is done. Open work listed in the old files became tickets too. Typing `/shop` lists them all. `/flow:groundwork /shop-1` turns the plans into `docs/spec/`.
6. **Carry on.** Each new feature follows [A feature in a project you already have](#a-feature-in-a-project-you-already-have). `/flow:tickets-from-spec` cuts the spec into tickets, as in [A new project, from idea to built](#a-new-project-from-idea-to-built).

## A feature in a project you already have

Receipt uploads, in the `shop` project:

1. **Describe it.** `/flow:groundwork we need receipt uploads` makes a ticket and lists every decision the feature needs, including the ones you never raised: where files are stored, the size limit, what happens offline.
2. **Settle the decisions.** Drafts or notes for this feature go in the ticket's `intake/` folder, and `/flow:groundwork` reads them. It walks the decisions with you one at a time, then tests the design against real cases, the awkward ones included. A decision that outlives the build, such as what the product must do, goes into `docs/spec/`.
3. **Leave with tickets.** One piece of work stays one ticket. Bigger work gets a child ticket per part, under the first.
4. **Approve the plan.** `/flow:execute /shop-9` reads the code and writes `plan.md`, numbered steps that each end on a check. Nothing is built until you say yes.
5. **Let it build.** It builds the steps in order and runs each step's check. Then it runs the full test suite, checks the work against the plan, and moves the ticket to `review`.
6. **Accept it.** You read the work. Notes send it back to the build, and your yes moves the ticket to `done`.

A small feature with nothing to decide skips the design: `/flow:execute add a CSV export button` makes the ticket and starts on the plan.

## A bug

Logging in on Safari lands back on the login page:

1. **Describe what fails.** `/flow:debug Safari logs me out after login` makes an `issue` ticket and starts at once, since finding the cause and fixing it are one job.
2. **Watch the hunt.** `/flow:debug` makes the bug fail on demand, then shows you its 3 best guesses at the cause. It tests each guess by predicting what happens, then running it.
3. **Read the report.** `/flow:debug` writes `reports/<failure>.md` in the ticket, opening with one of 3 results:
   - **`FIXED`**: the cause is fixed, and the ticket waits at `review`.
   - **`FOUND_NOT_FIXED`**: the cause is proved, and the fix needs a decision from you.
   - **`UNPROVEN`**: every guess failed, and you decide whether the hunt goes on.
4. **Confirm the fix.** Your yes moves the ticket to `done`.

## A question only running code can answer

Whether a PDF library renders 10,000 rows in under a second:

1. **Ask it.** `/flow:prototype can pdfkit render 10,000 rows in under a second` makes a `prototype` ticket. `/flow:groundwork` makes one too, under its own ticket, when a decision waits on a question like this.
2. **Read the answer.** `/flow:prototype` writes quick code in the ticket's `protos/<name>/` and runs it. Then it writes `reports/<question>.md`: the answers first, in your question's words, with the numbers measured.
3. **Accept it.** The ticket moves to `review`, and to `done` on your yes. The code stays in the ticket and never becomes the real build. `/flow:groundwork` reads the report, and settles the decision that waited on it.

## A decision with nothing to build

Whether to move the shop's API from REST to GraphQL:

1. **Ask it.** `/flow:groundwork should the API move to GraphQL` makes a `topic` ticket.
2. **Settle it.** `/flow:groundwork` lists what the question needs decided, researches what nobody knows, and walks each decision with you. The answers land in `groundwork/map.md`, and the map is the result. A "no" is written there too, with why.
3. **Close it.** The ticket moves to `done` once you agree. An answer that needs building turns the topic into a feature, or gives it a child ticket per part.

## Upkeep, such as a dependency bump

1. **Make the ticket.** `! flow new "Bump React to 19" --type chore` in the session. A command typed behind `!` runs in the session's terminal.
2. **Go straight to the plan.** `/flow:execute /shop-12`. Upkeep has nothing to decide, so typing the phase yourself skips `/flow:groundwork`. A plan of one step in one file goes straight to the build, without waiting for your yes.
3. **Accept it.** You read the work, and your yes moves the ticket to `done`.
