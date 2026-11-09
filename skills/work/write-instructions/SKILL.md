---
name: write-instructions
description: Writes and changes the text an agent loads: skills, rule files (`CLAUDE.md`), guides and the prompts hooks send. Use it as soon as such a change is discussed, before the first proposal.
---

# Write instructions

The user gives the direction. You write the text.

Every step runs, sized by the job: one rule takes a line or two per step, a skill takes a draft file. After each answer from the user, go back to the step it changes. The ticket keeps each step's result: the problem, the cases, the design, and every proposal dropped, with why.

## Steps

1. **`read-what-exists`** Read all of this before the first proposal.
   - The target file whole, and where it loads: every session, one phase, one skill, or a hook's message.
   - For each line the job touches, why it was added: its edit log entry, else `git log -S "<words>"` and the ticket its commit names. No reason found → name what the line seems to guard.
   - What already covers the job: the global and project `CLAUDE.md`, the skill's own description, the file's twin.
   - A fault → the turn where it went wrong, through `flow audit read <session> --turns <n>`. Read what the agent leaned on there.
   - A new skill → what already does part of the job, here and outside (`/flow:research`).

   Check: you can name the line that should have prevented the fault, or show that no line covers the job.

2. **`state-the-problem`** Say the problem in your own words. The user's words handed back prove nothing.
   - What goes wrong, or what is wanted, with a real example: the turn, the line, the output.
   - Its cause. A loaded line already covered it and was not followed → the fix changes that line's place or shape. A new line beside it fixes nothing.
   - The behaviour wanted after the change.

3. **`write-the-cases`** Number every situation the text must handle, one line each: what happens → what the agent does.
   - The usual case, and the awkward ones: empty, huge, repeated, interrupted halfway.
   - The cases where today's behaviour is right and must stay. A fix too broad breaks them.
   - A fault is case 1.

   Send steps 2 and 3 in one reply, then stop. Check: the user confirmed the problem and answered the cases, adding their own.

4. **`design`** Grow the user's direction into the strongest design. Try more than one shape of it.
   - Write the fewest lines that pass every case. Cut or reshape a line before adding one.
   - Rewrite in place what already covers the job. Never add a second copy.
   - Match the shape to the failure:
     - a step the agent skipped → an ordered step ending on a check
     - a ban broken under pressure → the ban, paired with the action to take
     - output in the wrong shape → a recipe for the right shape, never a list of bans
     - a judgment call → the goal, and the reason that decides the cases it does not name
   - Put each line where it fires. Every session gets only what fires with no skill loaded.
   - A loaded rule the new text could contradict → name it, and say which wins.
   - A skill or a rewrite → its sections, start to end, before any step's text. A rewrite maps every old line to its new place or a named cut.
   - Walk every case through the design. A case that fails sends you back here.

   `references/shapes.md` holds section shapes, rule ids, branching a step, skill frontmatter and cuts from real rewrites.

   Check: every case passes, named one by one.

5. **`show-the-exact-text`** Read `~/.flow/references/guides/writing.md` now. Fix every sentence that fails its tests.
   - Show the text as it will read, under the file and section it replaces. A rewrite shows the old text beside it.
   - A skill or a rewrite → a draft file the user reads start to end: `<name>.draft.md` beside the old file, or the ticket's `draft/` folder for a new one.
   - Say in plain words what the text makes the agent do.

   Stop. Check: the user read the exact text and approved it.

6. **`land-it`** Write exactly the approved text.
   - The file's twin, if it has one.
   - The edit log entry, by `~/.flow/references/guides/edit-log.md`, where the project keeps one.
   - `flow install` for a new or renamed skill.
   - Every record the change makes stale: the spec, the docs, a pointer in another file.

   Check: a search for the old wording finds no stale mention.

7. **`check-it-later`** Write one line where the project keeps checks on real sessions: what to count, the baseline, the target. Then end with the next step for the user.
