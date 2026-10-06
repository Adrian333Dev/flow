# Flow: how the pieces fit

Every place in the workflow and the routes between them. For how to do a step, read that step's skill.

## The pieces

- **Ticket**: one unit of committed work, and the only thing that ever gets built. On disk, a folder under `.flow/tickets/` holding `ticket.md` (what to do, why, where it stands) beside whatever the work produces. Its status, parent and dependencies live in that file's frontmatter, written only by `flow`.
- **Migration**: a change to where Flow and the harnesses keep their files, written only by `flow install`, `flow init` and `flow update`, carried out by a script after one yes. `flow restore` puts back each path ticked in its form as it was before Flow first touched it: the only undo. A ticket is the project's own work, undone with git. Real project work a project setup finds, such as an old `docs/` full of plans, becomes tickets: a migration does only what one yes covers.
- **Groundwork**: a list of open branches walked until each is resolved. It produces tickets, a spec, a design, or nothing.
- **Design**: the shape of one solution, its parts and how they talk. Written in one pass when groundwork closes, beside its map, or in `docs/spec/` when it outlives the build. Only earned when the answer was a structure.
- **Plan**: the numbered steps that build one ticket, in `plan.md` inside that ticket's folder. Written at pickup. Each step's detail fills in as the build reaches it.
- **Spec**: what the product is and why, in `docs/spec/`. Any groundwork run can create or edit it, and it outlives every ticket that came out of it.
- **Prototype**: runnable code answering one question, in the ticket's own `protos/` folder. Never promoted: the real build reads it as a reference and starts again.

## The chain

**groundwork → tickets → plan → build.**

Not every job walks the whole chain. A small fix is a ticket with a plan and no groundwork. A question is neither.

**Every phase works on a ticket.** A phase skill started with none creates one first, typed for the work. Outside a project it lives in `~/.flow/tickets/`. Only a small task asked in chat, a `/flow:research` question and a subagent's job run without one: the subagent works under the ticket that sent it.

## Where groundwork's answers go

Any run routes what it decided, to several places or to none:

- committed work → tickets, each carrying a `## References` section pointing at what the build has to read
- anything settled that outlives the build → `docs/spec/`, created if absent
- the shape of one thing, dying when that thing is built → a design document beside the map
- a durable fact about the project → its `AGENTS.md` where most sessions need it, otherwise `docs/context/<subject>.md`
- decided but not now, and anything else that dies with the build → the map itself

**Groundwork lives in its ticket's `groundwork/`.** A run outside a project routes nothing to `docs/`.

## Tickets

`todo → groundwork → planning → building → review → done`. Two off the line: `parked` (revivable) and `dropped` (terminal), each needing a written reason.

**Every type walks a subsequence of that order:**

- **`feature`**: all of them.
- **`chore`**: the same, usually skipping `/flow:groundwork`.
- **`issue`**: `todo → building → review → done`. `/flow:debug` hunts the cause and writes the fix as one act.
- **`topic`**: `todo → groundwork → done`. The map is the deliverable.
- **`prototype`**: `todo → building → review → done`.

`.flow/tickets/` stays flat on disk: the hierarchy is `parent:` in frontmatter, and `flow` renders it on demand.

**A ticket is named by its id, never a path.** `exp-47`, `47`, `parser` and `exp-47-parser-split` all resolve in `flow`. A ticket reaches a skill through its own skill, typed after it: `/flow:execute /exp-47`.

**Pickup decides a ticket's shape.** `/flow:start` routes it, and nothing else happens there. **The ticket does not move at pickup.** The skill that takes it writes the status, after opening the phase's own artifact. `/flow:groundwork` settles what the ticket is. `/flow:execute` plans, builds and reviews it.

**The artifact decides the phase: `map.md`, `plan.md`, the hunt in `## State`.** Where the status disagrees, every phase skill opens its own artifact first, says the disagreement out loud, and corrects the status. Evidence reading both ways → ask the user.

**An `open` block loads a ticket's files before the session's first turn.** `/flow:handoff` writes it, fenced, inside `## State`. `flow get --files` reads it, and every ticket's own skill runs that command. **The block delivers the files' content: read it there.** A ticket nobody has worked carries no block: open its artifact by hand. The format is `util fs open`'s and works on any document. [The `open` block](https://github.com/Adrian333Dev/util/blob/main/docs/commands.md#the-open-block) in util's documentation defines it.

**`## References` is not that block.** Whoever cut the ticket wrote there what the build has to respect, and it survives to `done`. `## State` holds work in flight: it and its block are deleted at review.

## Inside each place

**Two roots.** `docs/` holds the project's own documents, including whatever was there before Flow. `.flow/` holds Flow's working store.

- **`.flow/tickets/exp-47-slug/`**: `ticket.md` (frontmatter, body, and whichever of `## References`, `## Done when` and `## State` the work has written) and `groundwork/`, both from birth; `intake/` when material for this job gets dropped in; `plan.md` and `reports/` appear when the work writes them, one report per thing answered, named after what it answers. `protos/` holds a prototype's code, one folder per prototype. `history.md` gets a line from `flow` at each status move and handoff: the session and the code branch. `issues.md` appears when the build learns something that stays true after the ticket closes. A job handed to another session is its own child ticket, never a file in here. Terminal tickets move to `.flow/tickets/archive/`.
- **`.flow/tickets/exp-47-slug/groundwork/`**: `map.md`, every branch and decision in one file, plus a detail file per branch that actually grew, plus `design.md` when one was earned. Nothing else.
- **`docs/spec/`.** `product.md`, always: what the product is, who it is for, what it bets on, and an index line per other spec file. `<part>.md`, once a part of the product outgrows its section there: what that part does and how it is built. `tech.md`, only once a build decision covers every part: the stack, the repo layout. Every behavior carries its release (V1, V2…) / next / later / never, and every decision its reason and what it refused, in the file that holds it. Markdown only.
- **`.flow/research/`**: research true only for this project, and research nobody could place. Flat, subject-named, one set for the whole project, on the `flow` branch beside the tickets. Research about an outside tool goes to `~/.flow/wiki/<tool>/research/`, and research about no single tool to `~/.flow/research/`.
- **`docs/intake/`**: input that arrived as files somebody already worked on, plus `index.md` grading every file in it. Nothing here is current, including anything labelled decided. `/flow:groundwork` reads it through `references/read-intake.md`.
- **`AGENTS.md`**: what every session in this project needs: what the project is, its own rules, and whatever else most sessions would get wrong without.
- **`docs/context/<subject>.md`**: durable project facts only some work needs, one file per subject: a deploy path, a service's limit, any command past install, run, test and check.
- **`.flow/inbox.md`**: raw capture, unshaped, drained by `/flow:file-findings`.

## Departing

**Depart when the workflow fights the work.** Say which part you set aside and why, then carry on. Never ask first.
