# Handoff — 2026-08-29

```flow-open
backlog.md              # every open item; the sections below only add what is not in it
home/settings.md        # the skillOverrides section, which no session loads by default
```

## The job

Two builds landed today, back to back. The first turned Claude Code's merge of commands into skills
into Flow's own reorganization. The second split *installing a skill* from *showing it to the model*.
Both are finished and verified. Nothing is half-applied.

The repo `CLAUDE.md` carries the outcome of both in `## Current state`, and it auto-loads, so nothing
below restates it.

## What binds it

Every line here came from the user in conversation and exists in no file as an argument.

- **Off-by-default was proposed twice and rejected twice.** First as `name-only`, then as
  `user-invocable-only`. The principle: on a machine with one author who wants every skill everywhere,
  the default that has to be configured is the wrong one. Every skill is `on`, and a project turns off
  what it does not want. **Do not propose the inverse a third time.**
- **`commands/` is closed.** It holds every skill the user mainly invokes, and it wins wherever two
  groups fit. `/cut-from-spec` lives there. The user's words: *"Period. Don't bring this shit again."*
- **Nothing announces a skill a project turned off.** Naming one in `home/CLAUDE.md` was rejected
  because that file loads in every session, including the projects that turned the skill off.
  Discovery is a read: `flow skills ls`, or the project's own `settings.json`.
- **`flow skills add` stays, not archived.** The install design is young enough to be reversed, and
  `add` is what a reversal would need back.
- **The long report format was rejected outright.** A section listing seven edited files as one
  semicolon-joined sentence. `lab/context/shit-explanations.md` entry 5 holds it verbatim with the
  five faults and the root cause. Read it before writing any report of what changed.

## What was found

Verified against Claude Code 2.1.251, in six `-p` runs against a scratch config. None of it is in the
published docs at this level of detail.

- **`skillOverrides` is a `settings.json` key, keyed by skill name.** `on` — name and description.
  `name-only` — name alone, **and the skill stays invocable**. `user-invocable-only` — the model is
  shown nothing, `/name` still works. `off` — the model is shown nothing and `/name` refuses with
  *Skill "x" is disabled via skillOverrides*.
- **A project's settings override the machine's, key by key.** The objects merge; they do not replace.
  A key only the machine carries survives a project that names other keys.
- **A brand-new project `.claude/settings.json` did not apply until its second run** in that
  directory. Later edits apply on the next run. Almost certainly the workspace trust flow, not this key.
- **`~/.claude/skills/<name>/SKILL.md` is a flat path**, because install links per skill and names the
  link for the skill. Any skill can be read with `cat` without knowing its group folder, which is why
  `flow skills get` adds nothing.
- **`disable-model-invocation: true` hides a skill from the model machine-wide** and cannot differ per
  project, because one copy of the file serves every project.

## What is already set up

- **`bash scripts/try.sh`** builds `tmp/try/` — a throwaway `~/.claude` with all 12 skills linked and
  a scratch git repo as the project. It installs nothing.
- **The verification loop that produced every fact above:**
  `cd tmp/try/project && CLAUDE_CONFIG_DIR=<repo>/tmp/try/home claude -p "<prompt>"`.
  Asking the session to list its own skills is what reveals the override state.
- **`npm test` from `scripts/`** — 17 tests, all passing right now.

## What is still open

- **`flow skills ls` prints `global` on every row.** Every skill installs, so the INSTALLED column is
  dead information, and each skill's override state is what belongs there instead. It is the command an
  agent runs to find a skill a project turned off, so the column matters. The item is in `backlog.md`,
  under `` ## `flow`, the tool ``.
- **The real session has never run.** Every description was rewritten twice today and nothing has been
  tried interactively. Whether a fresh session reaches for the right skill from its description alone
  is the only test that decides whether they are right. `backlog.md` → `## Next` item 1.
- Three smaller ones, all in `backlog.md`: the `/file-findings` rewrite (**talk first**), `flow install`
  no longer pruning `~/.claude/commands/`, and `project-template/` shipping no `.claude/settings.json`.

## The first action

Nothing is pending. The user was about to compact, so the next turn is theirs.

If work resumes on skills, the honest next step is the real session — `bash scripts/try.sh`, then start
an interactive one against it. No build can stand in for it.
