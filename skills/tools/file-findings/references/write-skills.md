# Writing a skill

**Read `~/.flow/references/style.md` and `cut-loaded-files.md` beside it before writing.** They hold the style, the `description` included.

## Before writing one

- **One job, sayable in a sentence.** 2 sentences means 2 skills.
- **Nothing already covers it.** Something close → extend that skill.

## Where it lives

**Every skill lives once, in the Flow clone**, inside the group folder that files it.

- **`phases/`**: what you are doing, one at a time
- **`tools/`**: what you reach for around the work. It starts, produces something, finishes
- **`dev/`**: maintaining Flow and the `domain-skills` repository. The one group that switches: each skill starts off
- **`drafts/`**: a skill being written. `flow install` skips this group, so start every new skill here and graduate it with `mv`

**Every skill outside `drafts/` installs on every machine**, so a skill is typeable the moment its folder exists. A skill about one field or tool, such as React, belongs to the [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) repository, in the shape its `CONTRIBUTING.md` sets, and `flow skills on <name>` turns it on in a project. Any other skill that is not Flow's belongs in the project that uses it: copy the folder into `<project>/.claude/skills/<name>/` and commit it. A skill of your own that no repository should carry goes in `~/.flow/private-skills/<name>/`, under a name no Flow or domain skill uses, and `flow skills on <name>` turns it on the same way. `--machine` turns either one on for the whole machine.

## The name, and the prefix

**Name the folder bare and write the same bare word as `name` in the frontmatter.** A folder called `groundwork` holding `name: groundwork` is typed `/flow:groundwork`. Never write the prefix into either one.

Claude Code names the command after the folder, Codex after the frontmatter `name`, so the 2 must match. The `flow:` comes from `.claude-plugin/plugin.json` beside the skills, holding `"name": "flow"`. Codex types it `$flow:groundwork`.

**Every skill outside `drafts/` and `dev/` is shown in every session, and nothing switches it off.** A `dev/` skill is shown once `flow skills on <name> --machine` adds its link, or `--global` on every machine. A Flow skill has no switch for one project: `skillOverrides`, the settings key that hides a skill, skips a plugin's skills.

## Shape

**`SKILL.md` is the only file at a skill's root.** Add another only with a reason, and give it a folder:

- **`references/`**: markdown read on some runs and not others. Split by how often a part is read, never by length.
- **`scripts/`**: runnable code the agent would otherwise rewrite per run.
- **A `` !` `` line in `SKILL.md`**: a shell command Claude Code runs as the skill loads, its output pasted in. Run one named command or script there, never a pattern test and a chain of `&&`.
- **`knowledge/`**: accumulated facts, one file per topic. Let the layout emerge; never design it up front.

One file until one file stops working.

## Knowledge files

**A knowledge file holds what is true for anyone.** Anything true only because of one project belongs in that project's `docs/context/`: a class name from your own UI, a decision your app made, a path in another repo.

Date every entry and cite what proved it.

**Once a tactic appears in 2 files, promote it** into the shared file both then point at. Prune on the same pass any line the agent would follow by default.

## Frontmatter

```yaml
name: <short, lowercase and hyphens, the same word as the folder, never a prefix>
description: <what it is and what it covers>
argument-hint: <what to type after the name>    # only where it takes one
disable-model-invocation: true                  # user-only skills
```

**A description says what the skill is and what it covers. It says nothing about when to invoke it.**

**Write a trigger only where one is wanted**, in exactly 1 of these:

- **`~/.agents/AGENTS.md`**: the few that must fire with nothing else loaded
- **A phase's body**, where that phase is what needs it. A comment standard is named by `/flow:execute`
- **A phase's project overlay**, where 1 project wants it. The project's `AGENTS.md` would load it into groundwork and debugging sessions too
- **The project's `AGENTS.md`**, where it is project-wide and belongs to no phase

**A skill invoked over and over stays short, and a long skill takes an argument only where the argument names what the skill opens.** Claude Code appends the whole body again on every run whose render differs, through an argument or a shell line's output. A long skill takes an argument only where what it loads is worth more than its body, such as a ticket and its files, and its bare run renders the same text every time.

**`disable-model-invocation: true` takes the skill out of the list a session is handed.** The user still finds it in the `/` menu. Name it in a file the model reads, or the model reports it missing when the user asks for it by name. Write the line only where the user typing it is the whole point. Mark the skill `(user only)` once, where the model reads it before any bare mention.

**Write it only where never firing is true in every project.**

## Reshaping one

- the same thing written twice → one shared file, both point at it
- a rarely-read reference crowding `SKILL.md` → move it to `references/`
- 2 jobs in one skill → split it
- grown by accretion → rewrite it, never patch it

**Deleting a skill is the user's call.** Discuss it, never unprompted.
