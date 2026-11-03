# Guides sent by situation

Flow's `flow-session` mod watches each response the agent writes. When a response touches a file that a writing guide covers, the mod adds a `Read` of that guide to the same response. When the response edits or writes such a file before the guide is read, the mod holds the edit back and reads the guide in its place. The list lives in `mods/flow-session/features/triggers/list.ts`, beside the mod's other triggers.

No rule sends the agent to a guide: the mod is the only route.

## Table of contents

- [Which file brings which guide](#which-file-brings-which-guide): the entries, first match wins
- [A read of a matched file](#a-read-of-a-matched-file): the guide added beside it
- [An edit or write of a matched file](#an-edit-or-write-of-a-matched-file): the edit held back
- [A shell read of a matched file](#a-shell-read-of-a-matched-file): the guide attached to the result
- [A group's first command](#a-groups-first-command): its help added
- [What counts as already read](#what-counts-as-already-read): when nothing is added
- [A skill's wiki folder](#a-skills-wiki-folder): the index sent with the skill
- [After a restart](#after-a-restart): the guides in the new window
- [Guides sent from the chat](#guides-sent-from-the-chat): the guides a discussion calls for
- [The load log](#the-load-log): every guide the mod sent

## Which file brings which guide

The first entry that matches wins. Every guide sits in `~/.flow/references/guides/`.

- **`ticket`**: any file under a `tickets/` folder → `write-tickets.md`
- **`knowledge`**: a `Write` of a `SKILL.md`, an edit of `.mcp.json`, or a `Bash` call running `claude plugin install`, `claude plugin enable` or `claude mcp add` → `knowledge.md`. A `SKILL.md` gets `writing.md`, `write-loaded-files.md` and `write-skills.md` instead. The call is held back like an edit until its guides are read.
- **`agent`**: an `Agent` call, starting a subagent → `subagents.md`. The call is held back until the guide is read.
- **`rule-file`**: a `CLAUDE.md`, a `CLAUDE.local.md`, a file in `.claude/rules/` → `writing.md`, `write-loaded-files.md`, `write-rules.md`
- **`loaded-file`**: a `.md` in a skill folder, `.claude/commands/`, `.claude/agents/`, `.claude/output-styles/`, Flow's `references/guides/`, a skill's `references/`, Flow's `prompts/` → `writing.md`, `write-loaded-files.md`
- **`spec`**: a `.md` in `docs/spec/` → `writing.md`, `write-spec.md`
- **`wiki`**: a `.md` in `~/.flow/wiki/` → `writing.md`, `wiki.md`
- **`markdown`**: any other `.md`, `docs/manual/` included → `writing.md`
- **`code`**: a code file (`.ts`, `.js`, `.py`, `.sh` and other source files) → `write-code.md`
- **`command`**: a `Bash` call running `flow notes`, `flow audit` or `util <group>` → that group's `--help`


Data files such as `.json` and `.yaml` match no entry, `.mcp.json` aside. A read of a guide itself brings nothing.

## A read of a matched file

The mod adds a `Read` of each missing guide after the agent's own calls. Its result carries this line, here for a read of `docs/spec/rules.md`:

```text
[Auto] Before planning a change to rules.md, follow this guide.
```

Every entry says the same, with its own file's name. The rule `flow-added-calls` in `CLAUDE.md` tells the agent what the marker means: act on the call, never mention it to you, never count it as its own.

## An edit or write of a matched file

The `Edit` or `Write` never runs, so the file is unchanged. Every call after it in the same response is held back too, since a test run after the edit would run against the old file. A `Read` of each missing guide takes their place, and the first one's result carries this line:

```text
[Auto] Your Write of b.md was held back, so the file is unchanged. Held with it: Bash (npm test). Read this guide, then make them again.
```

With nothing after the edit, the line ends `Read this guide, then make it again.` A held install command says `so it did not run` in place of `so the file is unchanged`. Where the agent already reads the guide in that same response, the line goes on the agent's own `Read`, and nothing is added.

## A shell read of a matched file

A `grep`, `rg`, `cat`, `head`, `tail`, `sed -n`, `awk`, `less` or `bat` runs as it would. Once its result is in, the mod attaches the guides of each file the output shows to that result. For a grep, those are the files named at the start of its output lines. Otherwise they are the files the command names. A listing (`grep -l`, `-c`, `-q`) or an empty output brings nothing. Here is what the agent reads after `grep -n "## 6" references/guides/writing.md`, once per guide:

```text
[Auto] Before planning a change to writing.md, follow this guide, references/guides/write-loaded-files.md:

# Write a file an agent loads
…
```

A guide attached this way counts as read, so a later edit of the file runs without being held.

## A group's first command

```text
[Auto] The flow audit commands.
```

Ticket commands, such as `flow tickets start`, bring nothing.

## What counts as already read

The mod reads the agent's conversation before adding anything. A guide counts as read where a `Read` of the whole file has its result there, or where it rode a shell read's result. A group's help counts where `flow audit --help` or `-h` ran. Either counts whoever made the call: the agent, the mod, or the restart. A subagent's conversation is judged alone, and a restart starts over.

## A skill's wiki folder

A skill can link wiki folders in its frontmatter, as `/flow:audit` does:

```yaml
metadata:
  wiki:
    audit: load
```

When the skill starts, typed or called by the agent, the mod adds text after the skill's own. A `load` folder sends its `index.md`, after this line:

```text
[Auto] The index of this skill's wiki folder, /home/me/.flow/wiki/audit/index.md:
```

A `name` folder, or a `load` folder with no `index.md`, sends one line:

```text
[Auto] This skill's wiki folder: /home/me/.flow/wiki/audit/
```

Each folder goes once per conversation. Nothing is added where the conversation already holds the line, or a `Read` of the whole `index.md`. Two skills linking one folder bring it once. A subagent that calls the skill gets its own copy.

## After a restart

The restart window loads the tickets in flight and the files the agent named, with the guides they need, each once, between the tickets and the named files. A skill the agent named carries its wiki folder's text, as above. [restart.md](restart.md) shows the window whole.

## Guides sent from the chat

When you send a message, the mod reads the last 3 turns of the conversation, yours and the agent's, and scores each file they name. A file named alone scores 3. Named in a message that also says to change something (edit, rewrite, remove and the like), it scores 5. A reply of the agent's that drafts a rule line such as ``- **`read-first`** …`` scores 5 for `CLAUDE.md`. A turn back counts half. At 5 the file's guides ride along with your message, as with a shell read:

```text
[Auto] Before planning a change to CLAUDE.md, follow this guide, references/guides/write-rules.md:

# Writing a rule
…
```

"we should rewrite home/CLAUDE.md" sends them. "what does home/CLAUDE.md say?" does not. Each guide goes once per conversation.

## The load log

Every guide the mod sends, and every send that broke, is a line in `~/.flow/logs/triggers/<year>-<month>.jsonl`, which `/flow:audit` reads across sessions.
