---
name: curate-skills
description: Create a new skill, or maintain an existing one.
disable-model-invocation: true
---

# Curate Skills

## Shape

`SKILL.md` is the only required file. Add more only when there's a reason:

- **sub-file** — depth read rarely; `SKILL.md` stays lean, the sub-file loads on demand. Split by how often it's read, not by length.
- **`scripts/`** — runnable code, so the agent doesn't rewrite it every run.
- **`knowledge/`** — accumulated facts, one file per topic. Layout emerges; don't design it up front.

One file until one file stops working.

## Frontmatter

```
name: <verb-first, lowercase + hyphens>
description: <one line>
disable-model-invocation: true    # user-only skills
```

Description length follows invocation. Model-invoked → what it does **and** when to reach for it; that line is all the agent sees. User-invoked → one short line; the user already decided.

## Style

Telegraphic. Cut words, never information. No filler, no restating what the agent knows, no repeating `CLAUDE.md` rules.

Plain prose — no invented taxonomy, no ceremony sections.

Say what to do, not what to avoid.

## Write it

1. One job, sayable in a sentence. Two sentences → two skills.
2. Nothing already covers it — otherwise extend that skill instead.
3. Write `SKILL.md`. One file, in `.claude/skills/<name>/`. Some are symlinks into a catalog — editing through them is fine.

## Reshape

- same thing written twice → one shared file, both point at it
- rarely-read reference crowding `SKILL.md` → move to a sub-file
- two jobs in one skill → split
- grown by accretion → rewrite, don't patch

Deleting a skill is the user's call — discuss it, never unprompted.
