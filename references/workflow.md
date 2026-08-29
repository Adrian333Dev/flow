# Flow — how the pieces fit

The map: every place in the workflow and the routes between them. Never the procedure inside a place — that belongs to the skill that owns it. For how to do a step, read that step's skill.

## The pieces

- **Ticket** — one unit of committed work, and the only thing that ever gets built. On disk it is a folder under `docs/tickets/` holding `ticket.md` — what to do, why, and where it stands — beside whatever the work itself produces. Its status, parent and dependencies live in that file's frontmatter and are written only by `flow`.
- **Groundwork** — a list of open branches walked until each is resolved. It is the thinking, not the product of it; what comes out is tickets, a spec, a design, or nothing at all.
- **Design** — the shape of one solution: the parts, and how they talk. Written in one pass when groundwork closes, beside its map or in `docs/spec/tech.md`. Only earned when the answer was a structure.
- **Plan** — the numbered steps that build one ticket, in `plan.md` inside that ticket's folder. Written at pickup, and each step's detail fills in as the build reaches it.
- **Spec** — what the product is and why it is that way, in `docs/spec/`. Any groundwork run can create or edit it, and it outlives every ticket that came out of it.
- **Prototype** — runnable code written to answer one question, in `protos/`. Thrown away or promoted; never the product itself.

## The chain

**groundwork → tickets → plan → build.** The plan is `plan.md`, in the ticket's own folder, written at pickup.

Not every job walks the whole chain. A small fix is a ticket with a plan and no groundwork. A question is neither.

## Where groundwork's answers go

There are no modes. Any run, any size, routes what it decided — often to more than one place at once, sometimes to none:

- committed work → tickets, each carrying a `## References` section pointing at what the build has to read
- anything settled that outlives the build → `docs/spec/`, created if absent
- the shape of one thing, dying when that thing is built → a design document beside the map
- a durable fact about the project → `docs/context/<subject>.md`
- decided but not now, and anything else that dies with the build → the map itself

**Groundwork lives where the thinking happens** — inside its ticket, or in `docs/groundwork/<slug>/`.

## Tickets

`todo → groundwork → planning → building → review → done`. Two off the line: `parked` (revivable) and `dropped` (terminal), each needing a written reason.

**Every type uses a subsequence of that order, never a different order** — which is why one set covers all five, and why `flow ls --status building` means the same thing whatever it lists:

- **`feature`** — all of them.
- **`chore`** — the same, usually skipping `/groundwork`; upkeep rarely has a decision in it.
- **`issue`** — `todo → building → review → done`. `/debug` hunts the cause and writes the fix as one act.
- **`topic`** — `todo → groundwork → done`. The map is the deliverable, and it was agreed decision by decision as it was written.
- **`prototype`** — `todo → building → review → done`. The question arrived with the ticket, and the code is thrown away.

`docs/tickets/` stays flat on disk — the hierarchy is `parent:` in frontmatter, and `flow` renders it on demand.

Pickup is where a ticket's shape gets decided, and it is the one real decision in the system. `/start` walks it: it routes on `type:` and `status:`, and nothing else happens there. **The ticket does not move at pickup** — the skill that takes it writes the status, after opening the phase's own artifact. `/groundwork` settles what the ticket is; `/execute` plans, builds and reviews it.

## Inside each place

- **`docs/tickets/t047-slug/`** — `ticket.md` (frontmatter, body, `## References`, `## Done when`, `## State`) and `groundwork/`, both from birth; `plan.md` and `reports/` appear when the work writes them — one report per thing answered, named after what it answers. A job handed to another session is its own child ticket, never a file in here. Terminal tickets move to `docs/tickets/archive/`.
- **`docs/groundwork/<slug>/`** — `map.md`, every branch and decision in one file, plus a detail file per branch that actually grew, plus `design.md` when one was earned. Nothing else.
- **`docs/spec/`** — `product.md`: every behavior, every version, each marked V1 / next / later / never. `tech.md`: stack, repo layout, components, the decisions that constrain implementation. `decisions.md`: why each call was made, what was refused, what the whole thing bets on, what is still open. Markdown only. More files as the project needs them, and an index once there are more than three.
- **`protos/`** — at repo root, never under `docs/`; a prototype is runnable code, and `docs/` stops being documentation once code lives in it. Flat, one folder each, named by what it proves. A prototype born in loose groundwork sits in that folder instead, linked from it.
- **`docs/research/`** — fetched external docs and research writeups. Flat, subject-named, one set for the whole project.
- **`docs/intake/`** — pre-Flow material, preserved as-is. Mine it; never treat it as current.
- **`docs/handoff.md`** — session state when nothing narrower is live. State belongs to the most specific thing being worked: a ticket → its `## State`; loose groundwork → `handoff.md` in that folder; neither → here.

## Departing

**Expected when the workflow fights the work.** Say which part you set aside and why, then carry on. Standing permission — never ask.
