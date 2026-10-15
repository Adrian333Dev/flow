# Dispatching a job

For a job going to a session that reports back, or to a subagent starting now. The brief is written once, read once, and never updated in place.

## Where it goes

- **A session that reports back** → a new ticket, `flow new "…" --body -`. A child of the ticket that dispatched it, where one exists.
- **A subagent starting now** → the prompt, never a file.

## What it carries

- **The job**: what's being done and why, current tense.
- **The state**: done, in flight, broken, half-applied.
- **What is already set up**: the install that ran, the server still listening, the read-only folder, the command that works from one directory only.
- **What binds it**: decisions locked, corrections given, approaches ruled out and why. Weight what was said out loud and written nowhere. Dead ends count as conclusions.
- **What is still open**: threads nobody resolved, the options weighed, the one you were leaning toward and why.
- **What was found**: versions, endpoints, exact payloads, traps already hit. Write out anything that cost real effort, source or no source.
- **The first action**: concrete enough to start on. Name the skill when one applies.

Plus 4 where someone waits on an answer:

- **What turns on the answer**: the decision waiting on it, and what changes if it comes back no.
- **What done looks like**: written before the work starts, as the ticket's `## Done when`.
- **What to produce**: the artifact and its shape: the questions it answers, in order.
- **What to say back**: the 2 or 3 sentences this session needs to carry on.

**A bug with no failing check built yet** → its `## Done when` is the observable: the failure as seen, and what not seeing it would look like.

**A subagent also gets a stopping point**: "stop after these 3 sources and write the file". Never a time limit.

## Where the answer goes

The brief names it. A dispatched job ends by saying its answers in its final message, and by writing them into the file its own skill names: `reports/<failure>.md` for a hunt, the research file `/flow:research` names for a question. The ticket's `## State` carries the job's progress, never its answer.
