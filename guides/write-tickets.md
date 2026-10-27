# Write a ticket

A ticket's work lives in 2 files in its folder, edited in place as the work goes. A restart, a clear or a new session continues from them alone.

## Which file a line goes in

Ask who needs it:

- **Anyone resuming, before doing anything** → `ticket.md`: what the ticket is for, what is decided (short), what is open, the plan, a trap that would bite again.
- **Whoever works one question or task, while working it** → that handle's section in `context.md`: the why, the evidence, what was rejected, a dead end's story, implementation detail.

## `ticket.md`, the index

What is true now, short. The body opens with what the ticket is for, then whichever headings the work needs, in this order. Every heading is optional.

- **`## Context`**: a few lines binding the whole ticket: the goals and limits the user set, constraints on every question, contradictions found.
- **`## Questions`**: the checklist. A closed line ends with its answer in short: what, and a one-line why.
- **`## Decisions`**: a decision with no question or task to hang on, one line each: what, and why.
- **`## Tasks`**: the plan, one line per step, each naming its check. A parent lists its children, each line opening with the child's id: `- [ ] fw-127: …`.
- **`## Assumptions`**, **`## Non-goals`**, **`## Deferred`** (each with its reason).
- **`## Done when`**: the observable outcome.
- **`## References`**: the files, tools and pages the work needs, one line each: the path, then what it says in a few words. Add the line the moment you read one.

Frontmatter changes through `flow` alone.

## `context.md`, the sections

- One `##` section per handle in `ticket.md`: a question's number (`## 1.2`) or a task's name.
- Open it when the question is posed or the task starts, with the facts it rests on and their paths. Once it locks: the decision, the reasoning, what was rejected and why, a pointer to the report holding the detail.
- Edit it in place, under its heading. A changed decision rewrites its section, with the dropped direction and why. Never append a log.
- A heading that fits no handle goes under `## Loose`, and moves when its topic settles.
- Write for a reader who was never here. Never summarize the conversation.
- Read one alone: `sed -n '/^## 1.2$/,/^## /p' context.md`.

## The folder, `.flow/tickets/47/`

- `history.md`: a line from `flow` at each status move.
- `reports/<what it answers>.md`, `protos/<name>/`, `jobs/<job>.md` (a subagent's progress), `intake/`: written when the work needs them. A prototype is never promoted: the build reads it, then starts again.
- `groundwork/map.md`, on an older ticket only: its questions and decisions in one file, read as its `## Questions`.

A job handed to another session is its own child ticket, never a file here. `.flow/tickets/` stays flat: the hierarchy is `parent:` in frontmatter. Terminal tickets move to `.flow/tickets/archive/`.

## Status and phase

- **Statuses**: `todo → in-progress → done`, plus `parked` (revivable) and `dropped` (terminal), each needing a written reason. The phase sits beside the status as `activity`: `design`, `build` or `debug`.
- **The sections decide the phase**: `## Questions` open → design, `## Tasks` → build, a hunt in `reports/` → debug. A status that disagrees → say so, then correct it. Evidence reading both ways → ask the user.
- **A label sets no route.** The work picks the phases: a small fix skips `/flow:groundwork`, a bug goes to `/flow:debug`, a topic ends when its `## Questions` are answered.
- **Every phase works on a ticket.** A phase skill started with none creates one, labelled for the work, in `~/.flow/tickets/` outside a project. A small task asked in chat, a `/flow:research` question and a subagent's job need none.
- **Name a ticket by its id**, never a path: `exp-47`, `47` and `exp-47-parser-split` all resolve.

## Rules across tickets

- **One active ticket per session.** In a parent and child pair the child is active, and the parent's `ticket.md` is read for the decisions they share.
- **Two sources can disagree.** On what exists, the files win. On decisions and what is still open, `ticket.md` wins over `context.md`.
