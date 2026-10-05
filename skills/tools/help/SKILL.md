---
name: help
description: Answers any question about Flow or Claude Code, and fixes a problem with either. Covers how each piece works, how to do something, why something failed, and how this computer and this project are set up, from Flow's docs, logs, commands and code.
---

# Help

**Answer the question in full.** Size the answer to the question, never to what you read.

**Typed with no question** → the user is asking what to do now. `~/.flow/run.json` exists → a setup stopped part-way: run `flow doctor`, which names the step and both ways out. Otherwise → `/flow:start`.

## Where the answer is

- **How Flow works, or how to do something in it** → `~/.flow/docs/README.md`, the index. Read the page it names. Where the page falls short → Flow's code in `~/.flow/repos/flow/`: `skills/` for a skill, `scripts/` for a command or a hook.
- **Something failed or acts wrong** → `flow doctor` first. Then `~/.flow/logs/failures/<year>-<month>.jsonl` for a failed command, hook or plugin, and `~/.flow/logs/install.log` for a failed install. Then the code.
- **How this computer or project is set up** → `flow settings ls`, `flow skills ls`, `flow next`, the ticket.
- **Claude Code itself**: a setting, a key, a hook, a built-in command → `/flow:research`.
- **A bug in the project's own code** → say so, and point to `/flow:debug`.

## The answer

- **End on the page that covers it**, for reading more: `docs/sync.md` → `## A computer on an older Flow`.
- **Answered from the code** → say no page covers it, and name the file.
- **A fix that changes anything**: a setting, a sync, a skill switched → propose it. Run it on the user's yes.
