# Writing a rule

## What makes a rule fire

Learned from the replies Flow's author rejected while building it, 2026-08 to 2026-10.

- **Expect a new rule to fix nothing that a loaded rule already failed at.** Every rejected reply broke a rule the session had loaded.
- **Fix a failure to act with structure.** One ordered section, `## The turn`, closed 6 kinds of failure in a day. 20 rules in a flat list closed none in 6 weeks.
- **Pair a prohibition with the action to take.** A rule written only as a ban inherits what the model already leans toward: an eager model reads it as permission, a cautious one as an order to wait.
- **Name the cost, never only the symptom.** "Match depth to weight" did nothing until `size-by-worth` said what length takes from the reader.

## Rule ids

Every rule in a loaded file carries an id: lowercase, its words joined by dashes, in a bold code span at the start of the rule:

```md
- **`no-git-mutations`** Never run a git command that writes.
```

**The id states the rule. The body says only what the id cannot.**

### What gets one

3 questions, in order.

- **Does it group other rules?** It is a section, and its id is the slug of its heading text: `## The turn` is `the-turn`. Never write a rule that restates its own heading.
- **Does it instruct?** It is a rule. It gets an id.
- **Does it only frame what follows?** It gets none. "One user message, your work, one reply" sets up the 5 steps under `## The turn` and instructs nothing.

### The shapes that carry one

- A bullet.
- A numbered step, where the rules run in order.
- A paragraph, where one rule governs the section under it.

A sub-bullet under any of the 3 is a rule of its own and takes its own id. Nest as deep as the material needs. A rule ends where the next rule at its own depth or shallower begins.

A `→` branch list takes no ids. Its lines are the cases of one rule, and the rule above them owns the id.

### The constraints

- **Unique inside its file.** Section ids and rule ids share one namespace. The same id in 2 files is fine. `flow scorecard` prints every id it finds.
- **Every heading slugs cleanly.** Rename a heading whose text makes an unreadable id. Never invent syntax to avoid it. `### When it has parts: a design, a plan, a mechanism, a diff across files` became `### When it has parts`, with the list on the line below.
