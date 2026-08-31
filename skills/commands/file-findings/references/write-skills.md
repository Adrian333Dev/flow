# Writing a skill

Read this before creating or restructuring a skill. Style lives in `~/.flow/references/style.md`, including how to write the `description`.

## Before writing one

- **One job, sayable in a sentence.** Two sentences means two skills.
- **Nothing already covers it.** Something close → extend that skill. A second skill on one subject splits the knowledge, and neither half is complete after that.

## Where it lives

**Every skill lives once, in the Flow clone**, inside the group folder that files it. The group says where the file sits and decides nothing else.

- **`phases/`** — what you are doing, one at a time
- **`tools/`** — something you do inside a phase: it starts, produces something, finishes
- **`standards/`** — how you work, held for the whole run. It produces nothing on its own and never finishes
- **`stack/`** — what you are touching
- **`commands/`** — what the user mainly invokes. Filed by who reaches for a skill rather than by its subject, and it wins wherever two fit: `/cut-from-spec` is a phase and files here
- **`drafts/`** — a skill being written. `flow install` skips this group, so start every new skill here and graduate it with `mv`

**Every skill outside `drafts/` installs on every machine**, so a skill is typeable the moment its folder exists. There is no list of names to keep in step with the tree. A skill that is not Flow's belongs in the project that uses it: copy the folder into `<project>/.claude/skills/<name>/` and commit it.

**What a session is shown is decided by group, in `skillOverrides`.** `phases/`, `commands/` and `tools/` are on; `stack/` is off and a project turns on the one it needs; `standards/` is decided per skill. The machine's list ships in `home/settings.json`, and a project overrides it key by key in its own `.claude/settings.json`.

Two values, keyed by skill name:

- **`on`** — the name and the description. What a skill gets when nothing names it
- **`off`** — the model is shown nothing and `/name` refuses

**Claude Code accepts `name-only` and `user-invocable-only` too, and Flow uses neither.** `name-only` hides the description and leaves the skill invocable, so the model keeps the power to fire it and loses what it would judge with. `user-invocable-only` hides it from the model entirely, which makes a skill that exists to fire during a phase unfirable.

**`flow skills ls` is how you find a skill you are not being shown.** It prints every skill with its state and which file set it. Nothing announces a skill that is off, because the announcement would load in every project including the ones that turned it off.

**The machine's `settings.json` names no skill.** A project's settings override it key by key, so the project file reads as the list of what this project turned off, and nothing has to be re-enabled anywhere.

**Nothing announces a skill a project turned off, and nothing should.** `flow skills ls` lists every skill on the machine, and the project's settings say which are off. **A typed-only skill is the opposite case** — it is a step the model has to route the user to, so `~/.claude/CLAUDE.md` names those four and nothing else.

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
name: <short, lowercase and hyphens, and it says what the skill is for>
description: <what it is and what it covers>
argument-hint: <what to type after the name>    # only where it takes one
disable-model-invocation: true                  # typed-only skills
```

**A description says what the skill is and what it covers. It says nothing about when to invoke it.** Every installed skill's description sits in context from the moment a session starts, so a trigger written into one is loaded on every session that never fires it.

**Write a trigger only where one is wanted**, in exactly 1 of these:

- **`~/.claude/CLAUDE.md`** — the few that must fire with nothing else loaded
- **A phase's body** — where that phase is what needs it. A comment standard is named by `/execute`
- **A phase's project overlay** — where 1 project wants it. A project `CLAUDE.md` would load it into groundwork and debugging sessions too
- **A project `CLAUDE.md`** — where it is project-wide and belongs to no phase

**Under-explaining is the failure to avoid.** `/visualize` names its media, because a reader cannot otherwise tell what it draws. No word count overrides that.

**A skill invoked over and over stays short, and a long skill takes no arguments.** Claude Code skips a re-invocation whose rendered body is identical to the copy already in context, and appends the whole body again when it differs. An argument is 1 of the 2 ways to make it differ, the other being a shell line whose output changed. `/run` is 11 lines, so re-appending it costs nothing; a 150-line skill must never grow an argument however natural one looks.

**`disable-model-invocation: true` takes the skill out of the list a session is handed.** Nothing shows it to the model, so a typed-only skill named nowhere else is one the model reports as missing when the user asks for it by name. `~/.claude/CLAUDE.md` names the typed-only ones for that reason.

**Write it only where never firing is true everywhere.** There is one copy of a skill on the machine, so this line cannot differ between projects. Anything narrower is `skillOverrides` in a project's `.claude/settings.json`.

## Reshaping one

- the same thing written twice → one shared file, both point at it
- a rarely-read reference crowding `SKILL.md` → move it to `references/`
- two jobs in one skill → split it
- grown by accretion → rewrite it, never patch it

**Deleting a skill is the user's call.** Discuss it, never unprompted.
