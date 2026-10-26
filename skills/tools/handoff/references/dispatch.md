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

**A subagent also follows `~/.flow/references/subagents.md`**: its size, its stopping point, its model.

## A continuation

A subagent keeps its progress as it works in `jobs/<job>.md` in the ticket's folder, one `##` section per part of the job, edited in place. A subagent whose reply began `UNFINISHED:` left its state there and in the files it named. The next one starts from them, in a prompt that carries only:

- **The question**, as the first brief put it.
- **The files to read first**, the ones the reply named. They hold the sources read, the findings and what is left.
- **What is left**, from the reply, and any decision made here since.
- **The same stopping point**, counted from what is left.

Never the first brief's history or the old reply: the files hold them, and the new agent's window starts small. A job that ends `UNFINISHED:` twice was cut too big: split what is left by source group.

## Where the answer goes

The brief names it. A dispatched job ends by saying its answers in its final message, and by writing them into the file its own skill names: `reports/<failure>.md` for a hunt, the research file `/flow:research` names for a question. `jobs/<job>.md` carries the job's progress, never its answer. `reports/` holds final answers only.
