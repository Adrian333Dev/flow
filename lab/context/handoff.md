# Handoff — 2026-09-02

Rewritten whole each time, read once. Durable reasoning belongs in `state.md`, `threads.md` and the
`design-*.md` records; this file holds only what the next session needs and would otherwise lose.

## Do not touch `design-audit.md`

A parallel session owns it. The file is untracked and its work is not visible from here.

## The git switch was built, and nothing is committed

`## Next` item 2 — the git-mutation toggle — is done. `state.md` → **Git writes are a switch** and
`threads.md` → `git-writes` carry the whole design and every rejected alternative.

The two new files:

- `scripts/flow/lib/settings.js` — `~/.flow/settings.json` and a project's, scope resolution, expiry
- `scripts/flow/commands/git.js` — `flow git allow|ask|off`

`skills/commands/run/SKILL.md` was deleted, replaced by Claude Code's shell mode.

Flow's suite passes 21, `util`'s 29.

## Nothing about it is left to verify

Both open questions were answered on 2026-09-02, by the user typing into a scratch session's input box.

**The guard does not fire on shell mode.** `! node ~/code/flow/scripts/flow/flow.js git allow` printed the
state line where the self-unlock refusal would have gone, in a session with the hook installed. So
`! flow git allow` is how the switch gets thrown, and no second terminal is needed.

**The input box exports `CLAUDE_CODE_SESSION_ID`**, carrying the same id the transcript file is named after.
Session scope works.

That second answer came out of a bug: the switch shipped reading `CLAUDE_SESSION_ID`, which nothing sets, so
every unlock fell back to project scope in silence. The suite passed because the test wrote the wrong name
into its own environment. Fixed the same day, and `threads.md` records the lesson.

## Where the work goes next

`backlog.md` → `## Next` holds the order. Item 1 is splitting `home/CLAUDE.md`, marked **talk first**, and
the file grew a rule this session, which is the pressure that item exists for.

Item 2, git worktrees, is newly unblocked: `worktree` is instructed, so `guard.js` passes `worktree add`
whatever the git mode says. What remains is the `EnterWorktree` and `Agent(isolation:worktree)` denies in
`home/settings.json`, both holds rather than verdicts, and deciding who merges a worktree's work back.

## Three things the user settled

**The guard is for what the agent runs on its own, never for the user.** Their own terminal and shell mode
are both outside its reach, whatever the command is. They asked for this to be closed permanently; it is
written into `threads.md` → `git-writes` as its own section.

**`try.sh` reuses this machine's login.** Onboarding on every rebuild was the complaint. The scratch
configuration now copies the credentials, the account and the theme out of `~/.claude/`, and
`docs/dev/scratch-session.md` says which files and why.

**Explanations were rejected three times for being unreadable.** Every time the fault was arguing about a
mechanism before saying what it is. Name the thing first — what gets typed, what happens next — and put the
reasoning under it.
