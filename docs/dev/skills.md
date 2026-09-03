# Adding a skill

A skill is a folder holding a `SKILL.md`. Create the folder and the skill exists: there is no list to add a name to, because `flow install` reads the tree.

## Table of contents

- [The folder](#the-folder)
- [The groups](#the-groups)
- [Frontmatter](#frontmatter)
- [Everything below SKILL.md](#everything-below-skillmd)
- [When an install is needed](#when-an-install-is-needed)

## The folder

```
skills/<group>/<name>/SKILL.md
```

`SKILL.md` is the only file at a skill's root. Everything else goes in a folder beneath it.

A skill's name is short and says what it is for. A skill named for the thing it touches is named for that alone: `react`, never `write-react`.

There is one copy of every skill on the machine, so an edit is live in every project at once, including sessions already open. Flow's own skills are never copied into a project.

## The groups

A group is a filing decision. Nothing outside `skills/` reads a group name: a symlink in `~/.claude/skills/` is flat and named for the skill: so moving a skill to a different group later is a `mv`.

- **`phases/`**: what you are doing: groundwork, execute, prototype, debug
- **`tools/`**: something you reach for inside a phase: research, visualize
- **`standards/`**: how you work throughout
- **`stack/`**: what you are touching: web-pages
- **`commands/`**: what you mainly type yourself: start, handoff, file-findings, cut-from-spec
- **`dev/`**: building and improving Flow itself: flow-review
- **`drafts/`**: one still being written

`drafts/` is the only group that changes behavior. `flow install` skips it, so a skill ships by being moved out of it. Until then the skill is reachable only through [the scratch session](scratch-session.md), which passes `--drafts` on every run.

`commands/` wins wherever two groups fit, because who reaches for the skill matters more than what it does.

A group also decides whether a session is shown the skill. `phases/`, `commands/`, `tools/`, and `dev/` are on. `stack/` is off, and turned on per project. `standards/` is decided per skill. The off list ships in `home/settings.json` as `skillOverrides`, whose values are `on` and `off` with nothing between them.

## Frontmatter

```yaml
---
name: <name>
description: <what the skill is, and what it covers>
---
```

The description says what the skill is and what it covers. Never the steps, and never when to invoke it. Claude Code loads it from the moment a session starts, whether the skill is ever used or not, and decides whether to fire the skill from this description alone.

Under-explaining is the failure to avoid. Cover the subject in enough detail that a reader can tell what the skill reaches. No word count overrides that. A description that summarizes the workflow gets followed in place of the file itself.

`disable-model-invocation: true` makes a skill reachable only when the user types `/<name>`. It also removes the skill from the list a session is handed, so something else has to say the skill exists: otherwise nothing does.

## Everything below SKILL.md

- **`scripts/`**: executables the skill runs
- **`references/`**: markdown read on some runs and not others
- A purpose name where one fits better, like `knowledge/`

Length is not a reason to split a skill into multiple files. Split only where a part is genuinely conditional: read on some runs, skipped on others. Splitting what every run needs buys an extra file read and nothing else.

Findings a skill accumulates go in the skill, not a changelog. Dated entries in a `knowledge/` file are read when the skill runs. A changelog never is.

## When an install is needed

```bash
flow install
```

Only when a skill was **added, renamed, or removed**. Editing a skill never needs it: `~/.claude/skills/<name>` is a symlink into your clone, so the file you saved is the file the next session reads.

Re-running is safe at any time. It relinks what it owns, drops links into the clone that no longer resolve, and refuses to replace anything that is not already a symlink.
