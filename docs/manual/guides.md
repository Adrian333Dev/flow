# Guides sent by situation

Flow's `flow-session` mod watches each response the agent writes. When a response touches a file that a writing guide covers, the mod adds a `Read` of that guide to the same response. When the response edits or writes such a file before the guide is read, the mod holds the edit back and reads the guide in its place. The list lives in `mods/flow-session/hooks/situations.ts`.

## Table of contents

- [Which file brings which guide](#which-file-brings-which-guide): the entries, first match wins
- [A read of a matched file](#a-read-of-a-matched-file): the guide added beside it
- [An edit or write of a matched file](#an-edit-or-write-of-a-matched-file): the edit held back
- [A group's first command](#a-groups-first-command): its help added
- [What counts as already read](#what-counts-as-already-read): when nothing is added
- [A skill's wiki folder](#a-skills-wiki-folder): the index sent with the skill
- [After a restart](#after-a-restart): the guides in the new window

## Which file brings which guide

The first entry that matches wins. Every guide sits in `~/.flow/references/`.

- **`ticket`**: any file under a `tickets/` folder → `write-tickets.md`
- **`knowledge`**: a `Write` of a `SKILL.md`, an edit of `.mcp.json`, or a `Bash` call running `claude plugin install`, `claude plugin enable` or `claude mcp add` → `knowledge.md`, plus `style.md` and `write-loaded-files.md` for the `SKILL.md`. The call is held back like an edit until `knowledge.md` is read.
- **`rule-file`**: a `CLAUDE.md`, a `CLAUDE.local.md`, a file in `.claude/rules/` → `style.md`, `write-loaded-files.md`, `write-rules.md`
- **`loaded-file`**: a `.md` in a skill folder, `.claude/commands/`, `.claude/agents/`, `.claude/output-styles/`, a `references/` folder, a mod's `prompts/` → `style.md`, `write-loaded-files.md`
- **`spec`**: a `.md` in `docs/spec/` → `style.md`, `write-spec.md`
- **`markdown`**: any other `.md`, `docs/manual/` included → `style.md`
- **`command`**: a `Bash` call running `flow notes`, `flow audit` or `util <group>` → that group's `--help`

Code files match no entry, `.mcp.json` aside. A read of a guide itself brings nothing.

## A read of a matched file

The mod adds a `Read` of each missing guide after the agent's own calls. Its result carries this line, here for a read of `docs/spec/rules.md`:

```text
[Added by Flow] Guide for spec files.
```

The other entries say `Guide for a ticket's files.`, `Guide for rule files.`, `Guide for files an agent loads.` and `Guide for markdown.` in its place. The rule `flow-added-calls` in `CLAUDE.md` tells the agent what the marker means: act on the call, never mention it to you, never count it as its own.

## An edit or write of a matched file

The `Edit` or `Write` never runs, so the file is unchanged. Every call after it in the same response is held back too, since a test run after the edit would run against the old file. A `Read` of each missing guide takes their place, and the first one's result carries this line:

```text
[Added by Flow] Your Write of b.md was held back, so the file is unchanged. Held with it: Bash (npm test). Read this guide, then make them again.
```

With nothing after the edit, the line ends `Read this guide, then make it again.` A held install command says `so it did not run` in place of `so the file is unchanged`. Where the agent already reads the guide in that same response, the line goes on the agent's own `Read`, and nothing is added.

## A group's first command

```text
[Added by Flow] The flow audit commands.
```

Ticket commands, such as `flow tickets start`, bring nothing.

## What counts as already read

The mod reads the agent's conversation before adding anything. A guide counts as read where a `Read` of the whole file has its result there. A group's help counts where `flow audit --help` or `-h` ran. Either counts whoever made the call: the agent, the mod, or the restart. A subagent's conversation is judged alone, and a restart starts over.

## A skill's wiki folder

A skill can link wiki folders in its frontmatter, as `/flow:audit` does:

```yaml
metadata:
  wiki:
    audit: load
```

When the skill starts, typed or called by the agent, the mod adds text after the skill's own. A `load` folder sends its `index.md`, after this line:

```text
[Added by Flow] The index of this skill's wiki folder, /home/me/.flow/wiki/audit/index.md:
```

A `name` folder, or a `load` folder with no `index.md`, sends one line:

```text
[Added by Flow] This skill's wiki folder: /home/me/.flow/wiki/audit/
```

Each folder goes once per conversation. Nothing is added where the conversation already holds the line, or a `Read` of the whole `index.md`. Two skills linking one folder bring it once. A subagent that calls the skill gets its own copy.

## After a restart

The restart window loads the tickets in flight and the files the agent named, with the guides they need, each once, between the tickets and the named files. A skill the agent named carries its wiki folder's text, as above. [restart.md](restart.md) shows the window whole.
