---
name: handoff
description: ALWAYS invoke when context fills, when a stretch of work closes, or when a job needs its own session — a brainstorm resolved, a ticket half-built, a prototype to run, a failure to debug in parallel. Also before compacting, and when untracked work turns out to be worth a ticket. Writes the state a session that was not here needs: written out, never a reading list. Inside a ticket it writes into the ticket itself.
---

# Handoff

Write what a session that was not here needs to carry on.

It knows the repo. It knows nothing about this conversation.

**One test decides every line: would that session get this wrong without it?** Not whether it mattered here. That test is the whole difference from `/compact`, which summarizes everything.

## 1. Pick where it goes

Decide this first. Everything else follows from it.

- **Working a ticket** → `## State` inside that ticket's `ticket.md`.
- **Handing a job to a session that reports back** → a new ticket, `flow ticket new "…" --body -`. A child of the ticket that dispatched it, where one exists.
- **A subagent starting right now** → the prompt. It reads that and nothing else, so a file would be a second copy that goes stale the moment either one changes.
- **No ticket system here** → `handoff.md`, beside the work. `flow` needs only a git repo, so this is the rare case: no repo at all, or one belonging to someone else. A path the user names beats all of it.

**Inside a ticket the state is a living section.** Write to it as the work moves, every time something becomes true that no other file records — not after every edit, after every thing you learned. Running this skill at the end is then a check rather than a reconstruction, which is what makes it affordable at the one moment context is scarce. It also survives a session that dies before anyone runs anything.

**Everywhere else it is written once**, read once, and rewritten whole next time. Never updated in place.

## 2. Gather only what this job needs

Nothing here runs by default. Pick what the next session will trip over.

- **Mid-build** → name the files this session changed, and what changed in each. Nothing hurts more than a fresh session editing on top of changes it never saw. `git status --short` gets you that in a repo committed regularly; on a tree nobody has committed for weeks it returns everything and separates nothing.
- **Inside a ticket system** → `flow status`, for what is in flight.
- **Handing a job over** → whatever waits for the receiving session: a server already listening, a half-finished install, a folder that is read-only.
- **A brainstorm, or a prototype question** → nothing. A question about how a library behaves gains nothing from the working tree.

## 3. Write it

**The destination decides the sections**, because it decides what already exists to be skipped. Drop any section nothing fills.

### In a ticket — `## State`

Short by construction. Four other files already carry most of it, and none of it gets restated here:

- **`plan.md`** holds the steps and which ones landed.
- **`brainstorm/map.md`** holds every decision and its reasoning.
- **The ticket body** holds why the work exists; `## Done when` holds what finishes it.
- **`docs/research/<question>.md`** holds the findings.

What is left is what nobody wrote down, under four labels:

- **Now** — what is half-done, broken, half-applied, or in flight this second.
- **Found** — what cost real effort to learn and lives in no file: the version that turned out to matter, the exact payload, the trap already hit.
- **Open** — decisions half-made, threads nobody closed, the option you were leaning toward and why. A half-made decision dies in a reset exactly like a locked one.
- **Touched** — files this session changed that no step in `plan.md` names.

**How many fill depends entirely on the work, and most of the time it is two.** A build fills *Now* and *Found*, because the plan carries the shape and names its own files. A brainstorm fills *Now* and *Open*, because `map.md` holds the decisions. **A bug fills all four and runs long**, because `debug` writes nothing durable while it hunts.

A fat state section on a build ticket means the plan carries too little.

### In a file — `handoff.md`

No ticket, so nothing else holds anything and this document carries all of it:

- **The job** — what's being done and why, current tense.
- **The state** — done, in flight, broken, half-applied.
- **What is already set up** — the install that ran, the server still listening, the read-only folder, the command that works from one directory only. Skip it and the next session spends an hour rebuilding a working setup.
- **What binds it** — decisions locked, corrections given, approaches ruled out and why. Weight what was said out loud and written nowhere; the reset destroys exactly that. Dead ends count as conclusions.
- **What is still open** — threads nobody resolved, the options weighed, the one you were leaning toward and why.
- **What was found** — versions, endpoints, exact payloads, traps already hit. Write out anything that cost real effort, source or no source.
- **What to open** — the files the first action opens, and nothing else. Full path, line range, and what the reader gets from each. Verify every path.
- **The first action** — concrete enough to start on. Name the skill when one applies.

### Handing a job over — a child ticket's body

Every section above, written into the ticket body instead of a file, plus four that exist because someone is waiting on an answer:

- **What turns on the answer** — the decision waiting on it, and what changes if it comes back no. Without this, a marginal result reads like a decisive one.
- **What done looks like** — written before the work starts, as the ticket's `## Done when`. Criteria written afterwards match whatever came out.
- **What to produce** — the artifact and its shape: the questions it answers, in order.
- **What to say back** — the two or three sentences this session needs to carry on.

**A bug has no finished check yet.** Nobody has built the red command, and `debug` refuses to name a cause before one fails in front of it. Write the observable instead — the failure as seen, and what not seeing it would look like.

**A subagent starting now gets the same content in its prompt**, never a file and never a ticket. It reads the prompt and nothing else.

### How much to write

**Write out what the next session must know. A path is for a file it must open.**

You pay once, in a context that is ending. The reader pays out of the context it needs for the work, and it cannot tell a file it must study from one it must glance at — so it reads all of them.

Two entries always cost more than they give:

- **A file whose content you already wrote out here.** The reader reads both and cannot tell which one is current.
- **A file the session must not act on.** Where a path exists only to stop the reader doing something, write that sentence and drop the path.

Durable knowledge goes to its own home the moment it surfaces — Capture in the project `CLAUDE.md` names the file. This is disposable.

## 4. Land it

**In a ticket** — `## State`, at the bottom of `ticket.md`. Rewrite that section whole and touch no other: `flow` owns the frontmatter, `execute` owns `plan.md`, `debug` and `prototype` own `reports/`, and the body belongs to whoever created the ticket.

**Delete the section at `flow review`.** "Step 4 in progress" is false forever once the ticket closes, and git keeps the old one.

**In a file** — `handoff.md` beside the most specific thing being worked: the brainstorm's own folder, or the file in front of you. **One per folder, overwritten every time.** A stale one describes a state that no longer exists.

## Booting from one

Read every listed file in one parallel batch, then start on the first action. The decisions in it are settled.

**The list is complete.** Read nothing beyond it before the first action.

**Where `## State` disagrees with anything else in the ticket, it wins.** It is the newer of the two.

A dispatched job ends by saying its answers back in its final message, and by writing them into the file its own skill names — `reports/<failure>.md` for a hunt, `docs/research/<question>.md` for a question. `## State` carries the job's progress, never its answer.

**A file needs boot lines; a ticket does not.** Whoever opens a ticket arrived through `flow start` and already knows the loop. A file may be all a fresh session is handed, so it says at the top: the list is complete, read it in one batch, then start on the first action.

## Hard rules

- **Write what is true now.** Never replay the session. A decision made out loud and written nowhere is state, and this is the only thing that carries it.
- **Never write into a section another skill owns.**
- **Never restate what an existing file already holds.**
- **Never run a command this job does not need.**
- **Write at a clean point.** Finish the task, land the edit, run the verification, then write. Half-states are what make a handoff unreliable — with no room left for that, describe the half-state honestly.
- **Verify every path before writing it down.**
