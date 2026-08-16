# Resume — Flow

The list under **What to open** is complete. Read it, then start on the first action.

## The job

Designing Flow in plain conversation, one topic at a time. A large build landed 2026-08-16 and is
verified. What remains is one design discussion, then two build items.

## The state

**The 2026-08-16 build is done.** Twelve files changed, two skill folders deleted, one skill added.
Nothing from it is outstanding. The change list itself is in git, not in any file here — `CLAUDE.md`
was trimmed of it on 2026-08-16, on the same argument that bans a changelog in this repo.

**The `flow` change is the only one with executable behavior, and it was tested.** A scratch repo in
`/tmp`, a parent with two children: `flow next` hid the parent, `flow start` refused it, then both
children were closed and the parent appeared in `flow next` and started. That last step was impossible
before — the old guard fired on `has children`, so a parent's own verification work could never be
reached without `--force`.

**`bash global/scripts/link.sh` has not been run and will not be.** Adding and removing a skill is the
one case that needs it, and it falls under never-install. `~/.claude/skills/` still points at `organize`
and `curate-skills`, which no longer exist on disk. This is fine and expected — nothing is installed.

## What binds it

Everything governing this repo is in `CLAUDE.md`, which loads on its own. Three rules were added to it
this session and are worth knowing before the first reply, because two of them are about how to read the
user rather than what to build:

- **Silence on a decision is a yes**, and it never starts an edit. The discussion runs until the user
  says to build; then every decision they never argued with is in scope. Never set one aside because
  the message that carried it changed topic.
- **"Tracked" from the user never means git.** It means the agent maintaining a file as work moves.
- The **`## State`** section inside a ticket is the one document in Flow that *is* maintained as work
  moves. Every other handoff is written once and left alone.

## What is still open

1. **install — one skill instead of two.** `setup-flow-globals` and `migrate-to-flow` collapse into one.
   Raised by the user 2026-08-15, never discussed. **This is the last gate**: nothing installs until Flow
   is finished, so this skill's design closes the project. The thread is written to be read cold.
2. **A test suite for `flow`.** The only untested executable in the repo, and it just changed. Today's
   verification was manual and thrown away.
3. **A writing pass over `brainstorm`, `research`, `debug-web-pages`.** `execute` and `handoff` got theirs
   this session. These three have not been read against `global/refs/writing.md` since being written.

Order: the install discussion first. It is the only one of the three that needs the user in the room.

## What was found

- **`global/CLAUDE.md` has no skill-authoring section.** The shape rules — `SKILL.md` only, sub-file,
  `scripts/`, `knowledge/` — live only in this repo's own `CLAUDE.md`, which never installs. That is why
  the new `skills/update-context/write-skills.md` had to carry them rather than point at them. Worth
  remembering before deleting anything as a duplicate: check which `CLAUDE.md` it is in.
- **A skill's own trigger belongs in its `description`, and a user-invoked skill gets one short line.**
  `writing.md` §8. Both merged skills were user-invoked, so `update-context` got a single line.
- **Session transcripts are greppable** at `~/.claude/projects/-home-me-code-flow/*.jsonl`, one per
  session. That is how a "did we decide this" question was settled when the written record was wrong.
- **The records under `wip/context/` are unreliable and not worth cleaning.** `remaining.md` is 1,272
  lines and stale by its own header; `wip/` gets deleted when the build lands. Where a record and a skill
  disagree, the skill on disk wins.

## What to open

- **`wip/context/threads.md:406-428`** — the `install` thread, and the whole agenda. Written to be read
  cold. The `assignments` thread above it was closed and built this session; its four questions are
  answered in the text.

## The first action

Open the `install` thread with the user and walk it. Nothing gets edited until a specific plan is
approved — feedback is not approval, and a hedged message is a no.
