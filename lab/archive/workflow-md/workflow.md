# Flow: how the pieces fit

Every place in the workflow and the routes between them. For how to do a step, read that step's skill.

## The pieces

- **Ticket**: one unit of committed work, and the only thing that ever gets built. On disk, a folder under `.flow/tickets/` holding `ticket.md` (what to do, why, where it stands) beside whatever the work produces. Its status, parent and dependencies live in that file's frontmatter, written only by `flow`.
- **Groundwork**: a list of open questions walked until each is answered, in the ticket's `## Questions`. It produces tickets, a spec, a design, or nothing.
- **Design**: the shape of one solution, its parts and how they talk. Written in one pass when groundwork closes, in the ticket, or in `docs/spec/` when it outlives the build. Only earned when the answer was a structure.
- **Plan**: the checklist that builds one ticket, under `## Tasks` in `ticket.md`. Written at pickup when the build takes more than about 3 steps, each step naming its check. Smaller work keeps its plan unwritten.
- **Spec**: what the product is and why, in `docs/spec/`. Any groundwork run can create or edit it, and it outlives every ticket that came out of it.
- **Prototype**: runnable code answering one question, in the ticket's own `protos/` folder. Never promoted: the real build reads it as a reference and starts again.

## The chain

**groundwork → tickets → plan → build.**

Not every job walks the whole chain. A small fix is a ticket with a plan and no groundwork. A question is neither.

**Every phase works on a ticket.** A phase skill started with none creates one first, labelled for the work. Outside a project it lives in `~/.flow/tickets/`. Only a small task asked in chat, a `/flow:research` question and a subagent's job run without one: the subagent works under the ticket that sent it.

## Where groundwork's answers go

Any run routes what it decided, to several places or to none:

- committed work → tickets, each carrying a `## References` section pointing at what the build has to read
- anything settled that outlives the build → `docs/spec/`, created if absent
- the shape of one thing, dying when that thing is built → a design section in the ticket
- a durable fact about the project → its `CLAUDE.md` where most sessions need it, otherwise `docs/context/<subject>.md`
- decided but not now, and anything else that dies with the build → the ticket's own decisions

**Groundwork lives in its ticket**: the questions and their answers in `ticket.md`, the reasoning in `context.md`. An older ticket holds `groundwork/map.md` instead, read as its `## Questions`. A run outside a project routes nothing to `docs/`.

## Tickets

`todo → in-progress → done`. Two off the line: `parked` (revivable) and `dropped` (terminal), each needing a written reason. The phase a ticket is in sits beside the status, as its `activity`: `design`, `build` or `debug`, set by `flow start <id> --activity <word>`.

**A type is a label, and sets no route.** `feature`, `chore`, `bug` and `topic` change nothing about the statuses. The work decides which phases a ticket meets:

- **A small fix** skips `/flow:groundwork`.
- **A bug**: `/flow:debug` hunts the cause and writes the fix as one act.
- **A topic** ends when its `## Questions` are answered. The ticket is the deliverable.

`.flow/tickets/` stays flat on disk: the hierarchy is `parent:` in frontmatter, and `flow` renders it on demand.

**A ticket is named by its id, never a path.** `exp-47`, `47` and `exp-47-parser-split` all resolve in `flow`. A ticket reaches a skill through its own skill, typed after it: `/flow:execute /exp-47`.

**Pickup decides a ticket's shape.** `/flow:start` routes it, and nothing else happens there. **The ticket does not move at pickup.** The skill that takes it runs `flow start <id> --activity <word>`, after reading the ticket. `/flow:groundwork` settles what the ticket is. `/flow:execute` plans, builds and reviews it.

**The ticket's sections decide the phase: `## Questions`, `## Tasks`, the hunt in `reports/`.** Where the status disagrees, every phase skill reads those first, says the disagreement out loud, and corrects the status. Evidence reading both ways → ask the user.

**A ticket holds its work in 2 files, `ticket.md` and `context.md`**, shaped by `references/write-tickets.md`. A session reads the files `## References` lists that the work needs, in one parallel batch.

## Inside each place

**Two roots.** `docs/` holds the project's own documents, including whatever was there before Flow. `.flow/` holds Flow's working store: a link into the project's folder in the Flow home (`~/.flow/projects/<name>/`), made by `flow init`.

- **`.flow/tickets/47/`**: one ticket's folder, laid out in `references/write-tickets.md`.
- **`docs/spec/`.** `product.md`, always: what the product is, who it is for, what it bets on, and an index line per other spec file. `<part>.md`, once a part of the product outgrows its section there: what that part does and how it is built. `tech.md`, only once a build decision covers every part: the stack, the repo layout. Every behavior carries its release (V1, V2…) / next / later / never, and every decision its reason and what it refused, in the file that holds it. Markdown only.
- **`.flow/research/<topic>/`**: the reports `/flow:research` wrote for this project, before their facts are harvested into the wiki. One folder per topic, one file per question, one set for the whole project, in `.flow/` beside the tickets. Research asked outside any project goes to `~/.flow/research/<topic>/`.
- **`docs/intake/`**: input that arrived as files somebody already worked on, plus `index.md` grading every file in it. Nothing here is current, including anything labelled decided. `/flow:groundwork` reads it through `references/read-intake.md`.
- **`CLAUDE.md`**: what every session in this project needs: what the project is, its own rules, and whatever else most sessions would get wrong without.
- **`docs/context/<subject>.md`**: durable project facts only some work needs, one file per subject: a deploy path, a service's limit, any command past install, run, test and check.
- **`.flow/findings/<lesson>.md`**: a lesson or fact about this project, filed at a checkpoint and folded into a page, a rule or a skill by `/flow:upkeep`.

## Departing

**Depart when the workflow fights the work.** Say which part you set aside and why, then carry on. Never ask first.
