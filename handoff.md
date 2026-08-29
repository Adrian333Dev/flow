# Handoff — 2026-08-29

```flow-open
backlog.md                                    # every open item; nothing below repeats it
lab/context/design-public-docs.md             # the whole docs design, and the writing.md scope split
lab/context/shit-explanations.md              # 6 rejected messages, verbatim. Read entry 6 before writing a report
```

## The job

Flow's own build is finished and verified. The live work is **designing `docs/`, Flow's public
documentation**. Nothing is written yet and nothing should be: the workflow has to be finished and
the install skill has to exist first.

The repo `CLAUDE.md` carries the state of the build in `## Current state` and auto-loads, so nothing
here restates it.

## Where the design lives

**`lab/context/design-public-docs.md`**, in full and current. It holds what `docs/` is for, the 6
sections and the axis behind them, the 4 decision groups, what makes the structure extensible, the
2 scopes inside `references/writing.md`, `docs/writing-docs.md`, what the 2 research reports changed,
and everything rejected with the argument that closed it.

**A second session is restructuring `references/writing.md`.** That file's scope line is wrong for
docs and the fix is written down, held until the restructure lands. `design-public-docs.md` →
`## For the session restructuring writing.md` is the brief for whoever works on it, including the 6
routing pointers and the citations by section number that a rename or a renumber breaks.

## The state of the repo

Everything from the skills build is applied and verified: 17 tests pass, `try.sh` rebuilds with no
dangling links and links all 12 skills, every frontmatter parses, and no file outside `lab/` mentions
the superseded install tiers or a `commands/*.md` path. The tree is uncommitted and that is expected.

## The first action

Nothing is pending on docs. No page gets written now.

If work resumes on Flow itself, `backlog.md` → `## Next` item 1 is the real session: `bash
scripts/try.sh`, then start an interactive session against it and watch whether a fresh session
reaches for the right skill from its description alone. No build can stand in for it.
