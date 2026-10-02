# Ticket skills, and the status moves the phase skills make

Decided with the user on 2026-09-30, in a session running beside pass 1 of the final sweep, and built the same day.

## What the user wanted

Typing a ticket should offer a list showing each ticket's id, title and status, the way the `/` list shows a skill's name and description.

## Why not the `@` list

`fileSuggestion` (`scripts/hooks/file-suggestion.js`) prints file paths only, and Claude Code inserts the picked line after the `@`. A line carrying a description would attach nothing. Ticket folders already carry the title in their name, `.flow/tickets/exp-47-daemon-detection/ticket.md`, and that was the most `@` could show. An MCP server offering tickets as `@` resources was set aside: the docs never say whether the list shows a resource's description, and it is a process running in every session.

## The design: one generated skill per open ticket

- **Where**: `<project>/.claude/skills/exp-47/`, and `~/.claude/skills/home-4/` for global tickets.
- **Which tickets**: `todo`, `groundwork`, `planning`, `building`, `review`. Never `parked`, `done` or `dropped`. A ticket with an unmet dependency stays, with "blocked" in its description.
- **What a folder holds**: `SKILL.md`, plus a `.gitignore` holding `*`, so git ignores the folder without an edit to the project's own `.gitignore`.

```md
---
name: exp-47
description: "Ticket, building: Daemon detection"
disable-model-invocation: true
---
<!-- flow: ticket exp-47, rewritten by flow on every ticket change -->
!`flow get exp-47 --files 2>&1 || true`
```

- **`disable-model-invocation: true`**: the skills page's table says a user-only skill's description is not in context. `/context` confirmed it.
- **The comment**: marks the folder as Flow's. `sync` rewrites or deletes only folders carrying it, and deletes one only while it holds nothing but `SKILL.md` and `.gitignore`.
- **The skill holds a label only.** The ticket's content arrives through `flow get`, read at that moment, so a stale skill shows an old row and never old data.

## How it is used

Skills stack at the start of a message, from Claude Code v2.1.199: `/flow:execute /exp-47` loads both. Loading stops at the first word that is not a skill, and the rest reaches every loaded skill as `ARGUMENTS: <text>`. The list also opens partway through a message, after a space.

- **`/flow:execute /exp-47`**: both load, the phase first.
- **Text after the stack**: reaches every skill in the message.
- **`/exp-47` alone**: prints the ticket and nothing else.
- **`/exp-47` partway through a message**: picking it from the list inserts plain text. The skill never loads, and the agent looks the ticket up.

**Every typed run loads the skill whole.** The docs' one-line note in place of a repeat copy covers only the agent invoking a skill again. The design had counted on a bare `/flow:execute /exp-47` getting that note, and it never does. Nothing is lost against the old `/flow:execute exp-47`, which loaded whole too.

No setting stops a skill from taking text. A trick was found and rejected: declare 20 named arguments and place only the 20th, so a short instruction expands to nothing. Nobody reading the skill would understand it, it breaks at 20 words, and it relies on how Claude Code compares copies, which the docs never promise.

## Tested in a live session

Claude Code 2.1.285, run in `tmux` in a scratch project with 5 made-up ticket skills, and read back from the session's transcript.

- **The list**: `/ex` shows each ticket as `/exp-1   Ticket, building: Daemon detection (project)`, under the built-in `/exit` and `/export`, which share the letters.
- **Partway through a message**: the same list opens outside fullscreen.
- **Mid-session**: a skill added, a description changed, and a skill deleted all showed in the list at once, with no restart.
- **`/context`**: lists no ticket skill.
- **Stacking**: works in the interactive session, the user-only flag included. `claude -p` never stacks: the second skill arrives as the first one's text.
- **A bare stack sent twice**: both copies loaded whole, the second time too.

## What keeps the skills current

`scripts/lib/tickets/ticket-skills.js` holds `sync`. It writes a folder for each listed ticket that lacks one, rewrites one whose title or status changed, skips one already right, and deletes a marked folder whose ticket is no longer listed.

- **After every `flow` command that writes a ticket**: `new`, `edit`, `dep`, `file`, `drop`, `move` and every status verb, wrapped once at the bottom of `tickets.js`. It syncs the project the command ran in and the tickets in `~/.flow/`. A failure prints a line and never fails the command.
- **`session-check.js` when a session opens**: a full `sync`, then `reloadSkills: true` in the hook's output, so skills written there count from the first prompt.

The docs say Claude Code picks up a skill added, changed or removed under `.claude/skills/` without a restart, but only in a folder that existed when the session started. So `flow init` creates `.claude/skills/`. `flow init` also counts `.claude/skills` as a file competing with Flow's rules, so `competing()` now skips a folder holding only ticket skills, or the empty folder would send every new project to the setup session.

## What was built

- `scripts/lib/tickets/ticket-skills.js`: new. `sync`, and `removeAll` for `flow uninstall`.
- `scripts/commands/tickets.js`: calls `sync` after a write. `flow load` is deleted.
- `scripts/hooks/check-ticket.js`: keeps the machine check, and the project check for a bare `/flow:start`. The id check is deleted. The file keeps its name.
- `scripts/lib/tickets/store.js`: `ID_SHAPE` is deleted, having no reader left.
- `scripts/hooks/session-check.js`: `sync`, then `reloadSkills`.
- `scripts/commands/init.js`: creates `.claude/skills/`, and skips it in `competing()` while it holds only ticket skills.
- `scripts/commands/uninstall.js`: deletes every marked folder, in each project and in `~/.claude/skills/`.
- `scripts/tests/ticket-skills.test.js`: new, 7 tests. The tests for `flow load` and the id check are deleted. `helpers/scratch.js` points `CLAUDE_CONFIG_DIR` into `tmp/tests/`, since a `flow` command in a test would otherwise write home ticket skills into the real `~/.claude/skills/`.
- The 4 phase skills: the first line and `argument-hint` are deleted. `/flow:start`: `argument-hint` is `[path]`, and it gains its line for a ticket printed above.
- `home/AGENTS.md` → `## Scripts`: `flow get <id> --files`, for a ticket id typed in the user's message.
- `CLAUDE.md` → `short-skill-no-arguments`: the phase skills take no argument, and every typed run loads whole.
- Docs: `reference.md` gains `## Ticket skills` and loses `flow load`. `settings.md`'s hook section is `#### The setup check`. `use/phases.md`, `use/start.md`, `use/resume.md`, `use/status.md`, `where-everything-lives.md`, `docs/dev/skills.md`, `docs/dev/layout.md`, `docs/dev/agents.md` and `README.md` show `/flow:execute /exp-47`.

## Status moves, simplified in the same build

The statuses drive the board, `flow next`, and dependencies: `review` and `done` unblock a dependent ticket. So the skills keep the moves tied to something that happened, and lose the rest.

- **`/flow:groundwork` never moves a ticket forward.** It enters `groundwork` if the ticket is not there. A finished map points to `/flow:execute`, where it used to run `flow plan`. A `topic` moves to `done` only when the user says so.
- **`/flow:execute` enters `planning` from `todo` or `groundwork` without judging the ticket.** An unfinished map is reported to the user, where it used to send the ticket back to groundwork. `building` on the user's approval of the plan, `review` when every step is done and the tests pass, and `done` on the user's word stay.
- **`/flow:debug` and `/flow:prototype`** keep their one move, to `building` on entry.
- **`/flow:start` takes no status.** It stopped taking one on 2026-09-04, and the lines in it and in the phase skills reacting to a move it made were leftovers. They are deleted.

## One way to name a ticket

Approved by the user 2026-09-30, after the rest. The ticket skill is the only way a skill loads a ticket. A typed id is plain text the agent looks up itself, one extra step, with `flow get <id> --files`.

- **The phase skills lose `flow load "$0"`.** It stayed only for the on/off setting, which was left out.
- **`flow load` goes.** A ticket skill runs `flow get exp-47 --files` itself, which prints the same.
- **`check-ticket.js` loses its id check** and keeps its machine and project checks. A mistyped `/exp-99` names no skill, so it reaches the phase as text, and the agent finds no ticket. Picking from the list makes the typo rare.
- **`/flow:start /exp-47`** prints the board and the ticket both, since `/flow:start` sees no argument. It gains one line: a ticket printed above means route it.

**Archived before it is deleted.** The user's condition: a removed piece is documented first, so it can come back. `## Archived` below holds one entry each for `flow load`, the id check in `check-ticket.js`, and the phase skills' first line.

## Left out, kept in the backlog

- A `FileChanged` hook watching every `ticket.md`, so a hand edit updates the list at once. Until then it waits for the next `flow` command or session.
- `sync` after a pull: `records-sync.js`, which the session start runs in the background, and `flow sync`, which renumbers a clashing `home-` ticket. A ticket pulled either way shows its old row until the next `flow` command that writes, or the next session.
- A `ticketSkills` setting turning the list off.
- A `UserPromptExpansion` hook moving the status before the phase skill loads.
- The 20-argument trick.

## Archived

Removed by the one-way decision above, and written here before the deletion. Git holds the code at the commit each entry names.

### `flow load <word>`

- **What it did**: printed the ticket and every file its `open` block names, as `flow get <id> --files` does, where the word was shaped like a ticket id. Any other word printed nothing. A refusal printed as text and exited 0, so it landed in the skill instead of breaking its load.
- **Shaped like an id**: `store.ID_SHAPE`, `/^([a-z]{2,8}-)?\d+(-|$)/i`, so `47`, `exp-47` and the folder name `exp-47-parser-split` matched and `start` did not. `check-ticket.js` shared it. It went with both, having no other reader.
- **Why it existed**: the phase skills' first line had been an inline bash test the user could not read. `flow load` gave that line one named command, on 2026-09-29.
- **Last version**: `actions.load` in `scripts/commands/tickets.js`, `ID_SHAPE` in `scripts/lib/tickets/store.js`, and its test in `scripts/tests/records.test.js`, "flow load prints a ticket for a word shaped like an id". Commit `3da0e93`, `ID_SHAPE` since `04bfd7a`.
- **Bringing it back**: restore the 3 pieces from that commit, then the phase skills' first line below.

### The id check in `check-ticket.js`

- **What it did**: read the first word typed after a phase skill or `/flow:start`. A word shaped like an id went to `flow get`. On a miss, the hook blocked the skill before it loaded and showed `flow`'s message, so a typo cost 1 line instead of the whole skill. A `home-` id skipped the project check, since it lives in `~/.flow/`.
- **Why it existed**: a phase skill loaded its ticket through its own first line, so a bad id printed a refusal and then loaded hundreds of lines on top of it.
- **Last version**: `scripts/hooks/check-ticket.js` and `scripts/tests/check-ticket.test.js` at commit `04bfd7a`. The machine and project checks stay in the file.
- **Bringing it back**: only with the phase skills taking an id again. Restore the `ID.test(first)` branch and its tests from that commit.

### The phase skills' first line

- **What it did**: `` !`flow load "$0"` `` sat under the frontmatter of `/flow:groundwork`, `/flow:execute`, `/flow:debug` and `/flow:prototype`, beside `argument-hint: '[ticket-id]'`. `/flow:execute exp-47` loaded the ticket before the skill's first word, and a bare run printed nothing there.
- **Why it existed**: to open a phase on a ticket in one command, without the routing step in `/flow:start`. Set 2026-09-16.
- **Last version**: the 4 `SKILL.md` files at commit `3da0e93`.
- **Bringing it back**: restore the line and the `argument-hint` in each, after `flow load`.
