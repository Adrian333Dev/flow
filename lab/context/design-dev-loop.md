# Developing Flow — two checkouts, a scratch session, and a drafts group

**Locked 2026-08-30.** How a change to Flow gets made and tested without reaching the projects that
run it. Nothing here is built except the drafts group's absence, which is the current state.

## The problem

**Every skill is a symlink into the clone**, so saving `SKILL.md` changes that skill in every project
and every open session, immediately. That is Flow's single best property and it has no off switch.

**The unit of change is the workflow, not a skill** (user, 2026-08-30). Changing one skill usually
means changing five, and often `home/CLAUDE.md` and `home/settings.json` with them. So a mechanism
that holds back one skill answers nothing. What needs two versions is the whole clone.

## Two checkouts

- **Stable — `~/code/flow`.** Every symlink in `~/.claude/` and `~/.local/bin/` points here. This is
  what real projects run, and it is not edited during a rework.
- **Dev — `~/code/flow-dev`.** A second working copy of the same repository, on a branch. Five skills,
  both global files, a new draft, all at once. Nothing reaches a real project, because nothing points
  here.

**Testing it is `bash scripts/try.sh` run from the dev checkout, and it works today with no code
change.** `try.sh` calls `node "$root/scripts/flow/flow.js" install`, and `lib/clone.js` derives the
clone from its own `__dirname` rather than from a stored path. A `try.sh` sitting in `flow-dev`
therefore installs flow-dev: the scratch config links flow-dev's skills, copies flow-dev's
`CLAUDE.md`, and rewrites flow-dev's `settings.json`. The scratch session is the entire edited
workflow.

**Shipping is `git merge`, then `git pull` in the stable checkout.** Every symlink already points
there, so the whole rework goes live in one step. `flow install` is needed only when a skill was
added or renamed, which is the existing rule.

**Both editing modes exist with no switch to remember:**

- **A quick fix wanted live now** — edit the stable checkout. Instant, in every open session.
- **A multi-file rework** — edit the dev checkout, test the whole state, merge when it holds.

**Make the second checkout with `git worktree add ../flow-dev <branch>`**, which shares one object
store. A plain second clone behaves identically. Gitignored folders do not come across, which costs
nothing: `repos/` is not needed to test the workflow and `tmp/` is rebuilt.

## The scratch session — three fixes to `try.sh`

`try.sh` builds a throwaway `~/.claude` under `tmp/try/` and prints the line that starts a real
session against it. The user called it useless in its current form; the mechanism is right and three
things are wrong.

- **It destroys the scratch project every run.** Line 21 is `rm -rf "$try"`, so every rebuild takes
  the scratch tickets, files and git history with it. Testing a rework means running it repeatedly.
  **Refresh `tmp/try/home/` only, leave `tmp/try/project/` alone, and put the wipe behind `--fresh`.**
- **It prints a command instead of starting the session.** Its header says an interactive session
  cannot start from inside a script holding the terminal, which is true of a normal call and not of
  `exec`. **Try `exec` at the end**; if it misbehaves, printing stays.
- **It is `bash scripts/try.sh`, a path.** Everything else the user runs is a bare word.

**It moves to `lab/scripts/try.sh`.** `flow install` symlinks `scripts/` as a whole folder, so
`try.sh` currently lands on every machine that installs Flow, where it is useless. Its `root`
computation goes from one folder up to two.

**Skills and agents are already symlinked into the scratch config**, so editing one is live inside a
running scratch session with no rebuild. `CLAUDE.md` and `settings.json` are copies, so those two are
the only reason to re-run.

**`try.sh` keeps its real job**: it is the only way to test a change to `settings.json`, a hook, or the
install arrangement without installing. It verified the four `skillOverrides` values against Claude
Code 2.1.251. What it is not is a way to try a single skill.

## The drafts group

**A group folder the linker skips.** A new skill starts in `skills/drafts/<name>/`, and graduating is
`mv skills/drafts/<name> skills/phases/<name>` — free, because nothing outside `skills/` reads a
group. The catalog's existing name-collision check covers a draft clashing with a shipped skill.

**`flow install --drafts` links them too, and the scratch session passes it always.** Without the
flag a draft cannot be tested, because the scratch config is built by the same install command. The
flag makes the difference one visible word rather than a hidden one.

**Reworking an existing skill without shipping it** is a copy into `drafts/` under a working name.
The installed one keeps working. This is the small case; the two checkouts are the real answer.

**Rule to write when it lands:** every group installs except `drafts/`. A new skill starts there and
moves into a real group when it is worth shipping.

**`flow install --pin <name>`**, which would replace one skill's symlink with a real copy, was designed
and deferred. A pin you must remember to remove is a new failure mode — a skill silently frozen at an
old version, inside a workflow whose best property is that an edit is live. Build it the first time
the copy-into-drafts route actually annoys.

## `docs/dev/`

**Developer documentation had no home.** Three places existed and none fit: `docs/manual/` is for
someone using Flow, `lab/` holds *why* a decision was made rather than *how* to carry a procedure out,
and the repo `CLAUDE.md` loads into every session so a procedure written there costs tokens in every
turn that never runs it.

```
docs/
├─ manual/     using Flow — every concept, every command, the reasoning
└─ dev/        developing Flow — the dev checkout, the scratch session, the tests
```

**Both are published and `README.md` indexes both.** The split is audience.

**The line against the repo `CLAUDE.md` is rule versus procedure.** `CLAUDE.md` keeps the short rules
that must be in context — never install, scratch files in `tmp/`, a skill edit is live. `docs/dev/`
holds the long how-to: setting up the dev checkout, what merging back does, running the scratch
session, running the tests, adding a skill. The dev checkout is the first page it needs, and nothing
describes it anywhere today.

## Decided against

- **Copying instead of symlinking at install**, so the clone could be deleted afterwards. It kills
  live editing, it makes fixing Flow while using Flow require a re-install every time, and it turns an
  update from `git pull` into a merge against files that may have been edited in place. The last one
  is the migration problem the idea was meant to solve, and copying creates it.
- **Moving `scripts/tests/` and `scripts/package.json` to `lab/scripts/`.** They serve this repo alone
  and they ship, which the rule says should not happen. Moving them separates the tests from the code
  they test and splits the Node package root from its package. The cost of leaving them is a few
  unread files.
- **Linking `guard.js` and `snapshot.js` individually instead of symlinking `scripts/` as a folder.**
  It would stop anything dev-only shipping. Not worth it: a folder link means adding a script needs no
  re-install.

## The real migration problem, which is small

**Two files are copied and then personalised, so a new Flow version never reaches them:**

- `~/.claude/CLAUDE.md` — `install.js` prints `kept: CLAUDE.md — yours, already here` and leaves it. A
  rule added to `home/CLAUDE.md` next month reaches nobody who already installed
- `~/.claude/settings.json` — merged by hand, once, at install

**Everything else updates with `git pull`, because every other path is a symlink.** So the whole of
what the install skill has to solve for updates is: on a re-install, diff those two shipped files
against the machine's, show what changed since last time, and let the user merge.
