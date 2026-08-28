# Writing a skill

Read this before creating or restructuring a skill. Style lives in `~/.claude/flow/references/writing.md`, including how to write the `description`.

## Before writing one

- **One job, sayable in a sentence.** Two sentences means two skills.
- **Nothing already covers it.** Something close → extend that skill. A second skill on one subject splits the knowledge, and neither half is complete after that.

## Where it lives

**A new skill starts project-local**, at `.claude/skills/<name>/`, and stays there while one project's work is still shaping it.

**Promote it to `~/.claude/skills/` once it has proved itself** — used on work it was not written for, and right without edits. Global means one copy per machine, live in every project the moment it changes.

## Shape

**`SKILL.md` is the only file at a skill's root.** Add another only with a reason, and give it a folder:

- **`references/`** — markdown read on some runs and not others. `SKILL.md` stays lean and the reference loads on demand. Split by how often a part is read, never by length.
- **`scripts/`** — runnable code, so the agent never rewrites it per run.
- **`knowledge/`** — accumulated facts, one file per topic. Let the layout emerge; never design it up front.

One file until one file stops working.

## Knowledge files

**A knowledge file holds what is true for anyone.** Anything true only because of one project — a class name from your own UI, a decision your app made, a path in another repo — belongs in that project's `docs/context/`.

Later runs trust these files without re-checking them, so a project fact filed here gets read as a fact about the subject. Date every entry and cite what proved it.

**Once a tactic appears in two files, promote it** into the shared file both then point at. Prune on the same pass — a line the agent would follow by default says nothing.

## Frontmatter

```
name: <verb-first, lowercase and hyphens>
description: <what it does, and when to reach for it>
disable-model-invocation: true    # user-only skills
```

**The trigger lives here and nowhere else.** Where the agent should reach for the skill in situation X, name X in the description, in directive form. A `CLAUDE.md` rule saying the same thing is a second copy, and the two drift.

## Reshaping one

- the same thing written twice → one shared file, both point at it
- a rarely-read reference crowding `SKILL.md` → move it to `references/`
- two jobs in one skill → split it
- grown by accretion → rewrite it, never patch it

**Deleting a skill is the user's call.** Discuss it, never unprompted.
