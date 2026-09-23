# Adding a skill

A skill is a folder holding a `SKILL.md`. Create the folder and the skill exists: there is no list to add a name to, because `flow install` reads the tree.

**Name the folder bare, and type the skill with a prefix.** A folder called `groundwork` is typed `/flow:groundwork` in Claude Code and `$flow:groundwork` in Codex. The `flow:` is added when the skill loads, from one file, `skills/.claude-plugin/plugin.json`, which holds the name `flow`. No folder and no `name` in this clone carries it. [What Claude Code does](claude-code.md#a-plugin-is-a-bundle-not-a-skill) has the mechanism.

This page is how Flow files and writes a skill. What Claude Code itself does with one, tested rather than assumed, is in [What Claude Code does](claude-code.md): where a skill is found, what it costs before it runs, how arguments reach it, and what `skillOverrides` does and does not switch off.

## Table of contents

- [The folder](#the-folder)
- [The groups](#the-groups)
- [Frontmatter](#frontmatter)
- [Everything below SKILL.md](#everything-below-skillmd)
- [Where the skills land](#where-the-skills-land)
- [When an install is needed](#when-an-install-is-needed)

## The folder

```text
skills/<group>/<name>/SKILL.md
```

`SKILL.md` is the only file at a skill's root. Everything else goes in a folder beneath it.

A skill's name is short and says what it is for. A skill named for the thing it touches is named for that alone: `react`, never `write-react`.

There is one copy of every skill on the machine, so an edit is live in every project at once, including sessions already open. Flow's own skills are never copied into a project.

## The groups

A group is mostly a filing decision. The symlinks `flow install` builds are flat, each named for the skill, so moving a skill to a different group later is a `mv`.

- **`phases/`**: what you are doing: groundwork, execute, prototype, debug
- **`tools/`**: what you reach for around the work: start, handoff, file-findings, research, visualize, tickets-from-spec
- **`dev/`**: maintaining Flow and the `domain-skills` repository: review, apply-domain-findings
- **`drafts/`**: one still being written

2 groups change behavior:

- **`drafts/`** does not install. `flow install` skips it, so a skill ships by being moved out of it. Until then the skill is reachable only through [the scratch session](scratch-session.md), which passes `--drafts` on every run.
- **`dev/`** switches. A skill in it starts off, and `flow skills on <name> --machine` turns it on. Every skill in any other group is part of the workflow: always linked, and `flow skills` refuses to switch it.

`phases/` is closed at those 4. A skill that looks like a fifth phase belongs somewhere else: `/flow:tickets-from-spec` produces tickets and files under `tools/`.

A `dev/` skill is shown in every session once `flow skills on <name> --machine` adds its link to the plugin folder, or `--global` on every machine. A Flow skill has no switch for one project. `skillOverrides`, the key Claude Code hides a skill with, skips a plugin's skills, and Flow's are a plugin.

A skill about one field or tool, such as React or Postgres, is not Flow's. It lives in the [`domain-skills`](https://github.com/Adrian333Dev/domain-skills) repository, whose `CONTRIBUTING.md` sets its shape, and is turned on in the one project that uses it: `flow skills on <name>`. A skill about a tool used in every project is turned on for the machine instead, with `--machine`, which says what that costs first.

A skill of your own that no repository should carry lives in `~/.flow/private-skills/<name>/`. `flow skills on <name>` turns it on in a project, and `--machine` on the machine. Its name must differ from every Flow skill and every domain skill.

## Frontmatter

```yaml
---
name: <name>
description: <what the skill is, and what it covers>
---
```

`name` is the folder's own name, bare, with no `flow:` in front of it. Claude Code names the command after the folder and treats `name` as a label; Codex does the reverse and names the skill from `name`. Writing the same bare word in both is what makes one folder work in both, and the prefix is added over the top by the manifest.

The description says what the skill is and what it covers. Never the steps, and never when to invoke it. Claude Code loads it from the moment a session starts, whether the skill is ever used or not, and decides whether to fire the skill from this description alone.

Under-explaining is the failure to avoid. Cover the subject in enough detail that a reader can tell what the skill reaches. No word count overrides that. A description that summarizes the workflow gets followed in place of the file itself.

`disable-model-invocation: true` makes a skill reachable only when the user types `/<name>`. It also removes the skill from the list a session is handed. The user still finds it in the `/` menu. The model meets it only where a file names it, so a user-only skill named nowhere else is one the model reports as missing. It is marked `(user only)` once, where the model reads it before any bare mention, as `references/style.md` → `### Only in a loaded file` says. Read first, a bare name looks like a skill the model can run.

## Everything below SKILL.md

- **`scripts/`**: executables the skill runs
- **`references/`**: markdown read on some runs and not others
- A purpose name where one fits better, like `knowledge/`

Length is not a reason to split a skill into multiple files. Split only where a part is genuinely conditional: read on some runs, skipped on others. Splitting what every run needs buys an extra file read and nothing else.

Findings a skill accumulates go in the skill, not a changelog. Dated entries in a `knowledge/` file are read when the skill runs. A changelog never is.

## Where the skills land

`flow install` builds one plugin folder, in `~/.agents/`, and both harnesses read it:

```text
~/.agents/skills/flow/                    a real folder
├─ .claude-plugin/plugin.json             a copy of skills/.claude-plugin/plugin.json
└─ skills/
   ├─ groundwork -> <clone>/skills/phases/groundwork
   └─ …                                   one link per skill outside drafts/
~/.claude/skills/flow -> ~/.agents/skills/flow
```

- **Codex** reads skills from `~/.agents/skills/` and nowhere under `~/.claude/`. It follows each skill's link to the real folder in the clone, then looks for the manifest above that folder. It finds `skills/.claude-plugin/plugin.json` in the clone, which is why the clone carries one.
- **Claude Code** reads `~/.claude/skills/`, and never `~/.agents/`. It follows the link `flow` to the plugin folder, then reads the copied manifest beside the skills. It loads the set as the plugin `flow@skills-dir`.

The plugin folder is the one folder Flow links whole. A link to `~/.claude/skills/` itself would hide every other tool's skills there. `flow/` holds Flow's alone.

## When an install is needed

```bash
flow install
```

Only when a skill was **added, renamed, or removed**. Editing a skill never needs it: `~/.agents/skills/flow/skills/<name>` is a symlink into your clone, so the file you saved is the file the next session reads.

Re-running is safe at any time. It relinks what it owns, drops links into the clone that no longer resolve, and refuses to replace anything that is not already a symlink.
