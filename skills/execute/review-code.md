# Reviewing the code

Read at Phase 4, on a ticket that produced code. A ticket that produced a document or a decision skips this file.

## The smell baseline

Twelve shapes worth naming, each as what it is and what to do about it. Match them against what the ticket changed, never against the whole file.

- **Mysterious name** — a name that does not say what the thing does. Rename it; where no honest name comes, the design is murky.
- **Duplicated code** — the same logic shape in more than one place. Extract it, call it from both.
- **Feature envy** — a function reaching into another object's data more than its own. Move it onto the data it envies.
- **Data clumps** — the same few fields travelling together everywhere. Bundle them into one type.
- **Primitive obsession** — a string or a number standing in for a domain concept. Give the concept its own small type.
- **Repeated switches** — the same branch on the same type in several places. Replace with polymorphism, or one map both sites share.
- **Shotgun surgery** — one logical change forcing scattered edits across many files. Gather what changes together.
- **Divergent change** — one file edited for several unrelated reasons. Split it so each part changes for one reason.
- **Speculative generality** — abstraction, parameters or hooks for needs nothing has. Delete it; inline back until a real need shows.
- **Message chains** — a long `a.b().c().d()` walk the caller should not depend on. Hide the walk behind one method.
- **Middle man** — a class or function that mostly delegates onward. Cut it, call the real target.
- **Refused bequest** — a subclass ignoring most of what it inherits. Drop the inheritance, use composition.

Two rules bind the list:

- **The project overrides.** A convention written down in `docs/context/` or in `CLAUDE.md` wins. Where it endorses what the baseline would flag, drop the flag.
- **Every one is a judgement call.** Report "possible feature envy", never a violation. Skip anything a linter already catches.

## Two conditional checks

- **Input, auth, secrets or data from outside → check the boundary.** Is the input validated where it arrives, is the query parameterized, is the secret out of the file. Running this on every ticket is ceremony, and ceremony gets skipped.
- **A loop over a collection that grows → check the cost.** A query per item, an unbounded fetch, a list endpoint with no limit.

## Dead code

Name what this change orphaned — the function nothing calls now, the constant with no readers, the component that got replaced. List it; deleting it is the user's call.

## What to report

Two levels, and no more:

- **Fix before `flow done`** — it is wrong, it is unsafe, or it does not do what the ticket asked.
- **Noted** — everything else. It gets said once and left alone.

**One structural problem and ten nits means the structural problem is the review.** Lead with it. A real finding buried under formatting notes reads as a list of formatting notes.

Say what is genuinely good, and say it specifically. A review that only lists faults gets discounted whole.
