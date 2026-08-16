# Writing a skill

Read this when a skill has to be created or restructured. Style is not here — `~/.claude/flow/refs/writing.md` carries it, including how to write the `description`.

## Before writing one

1. **One job, sayable in a sentence.** Two sentences means two skills.
2. **Nothing already covers it.** Something close → extend that skill instead. A second skill on one subject splits the knowledge, and then neither half is complete.

## Where it lives

**A new skill starts project-local**, in `.claude/skills/<name>/`. It stays there while one project's work is still shaping it, which is most of a skill's early life.

**Promote it to `~/.claude/skills/` once it has proved itself** — used on work it was not written for, and right without edits. Global means one copy per machine, live in every project the moment it changes.

## Shape

`SKILL.md` is the only required file. Add more only when there is a reason:

- **A sub-file** — depth read on some runs and not others. `SKILL.md` stays lean, the sub-file loads on demand. Split by how often a part is read, never by length.
- **`scripts/`** — runnable code, so the agent doesn't rewrite it every run.
- **`knowledge/`** — accumulated facts, one file per topic. The layout emerges; don't design it up front.

One file until one file stops working.

## Frontmatter

```
name: <verb-first, lowercase and hyphens>
description: <what it does, and when to reach for it>
disable-model-invocation: true    # user-only skills
```

**The trigger lives here and nowhere else.** Where the agent should reach for this skill in situation X, name X in the description, in directive form. A `CLAUDE.md` rule saying the same thing is a second copy, and the two drift.

## Reshaping one

- the same thing written twice → one shared file, both point at it
- rarely-read reference crowding `SKILL.md` → move it to a sub-file
- two jobs in one skill → split it
- grown by accretion → rewrite it, never patch it

**Deleting a skill is the user's call.** Discuss it, never unprompted.
