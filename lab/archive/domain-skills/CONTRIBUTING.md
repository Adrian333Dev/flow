# Contributing

Every skill here carries knowledge about one field or tool, such as React, Postgres or investigating a live web page. You can send 3 things: a finding, a page, or a whole skill. This page says which one fits what you learned, where it goes, and the shape it has to take.

## Table of contents

- [What to send](#what-to-send)
- [How the repository is laid out](#how-the-repository-is-laid-out)
- [A skill](#a-skill)
- [A page](#a-page)
- [A finding](#a-finding)
- [Sending a page or a skill](#sending-a-page-or-a-skill)
- [Drafts](#drafts)

## What to send

- **A small fact that holds for anyone using the subject** → a finding
- **A practice, a pattern, a standard or a guide on one subject**, such as React hooks or Postgres indexes → a page inside the skill
- **A whole field** nothing here covers yet → a skill
- **A fact true only for your project** → nothing. Keep it in your project
- **A principle that is a matter of taste** → nothing. Keep it in a skill of your own

## How the repository is laid out

```
skills/
└─ react/
   ├─ SKILL.md        the map: what the skill covers, and where each page is
   ├─ references/     pages the agent reads, one subject each
   ├─ scripts/        files the agent runs
   └─ examples/       files the agent copies, such as a whole worked component
drafts/
└─ web-pages/         a skill not yet in this shape
```

A skill needs only `SKILL.md`. Add a folder when the skill has something to put in it.

## A skill

`SKILL.md` is a map of about 150 lines. It holds what the field covers, the few rules that hold every time, and where the live documentation is once the pages run out.

It opens with 2 frontmatter fields:

```yaml
---
name: react
description: <what the skill covers>
---
```

`name` matches the folder name. `description` says what the skill covers, never its steps. An agent decides whether to load the skill from this line alone.

**Every section of the body ends with a pointer to the page that goes deeper**, naming what the page holds: "see `hooks.md` for useCallback, useMemo, useSyncExternalStore". The body closes with an index listing every page. Past about 10 pages, group the index under topic headings.

**Link only to files inside the same skill folder.** A page, a script or an example ships with the skill. A finding never gets linked, because it is never merged.

**A skill that needs another skill names it in one sentence**: "Browser steps use the `playwright-cli` skill. If it is not installed, install it before continuing." Nothing installs dependencies automatically.

## A page

A page covers one subject, in `references/`. It has no header.

**Put a link beside a claim when you have one**, to the source that shows it is true, such as the [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide). Never link a path from your own machine.

**Knowledge kept per item goes in a sub-folder named for the kind of item.** For example, `web-pages` keeps one page per website in `references/sites/`, such as `references/sites/youtube-watch.md`. Every page in that sub-folder has the same sections, and `SKILL.md` names those sections once.

## A finding

A finding is one small, proved fact, sent as a pull request adding one file under `skills/<name>/findings/`. Name the file for what was learned, in 4 to 8 words: `hydration-mismatch-from-server-date-formatting.md`.

It opens with this header:

```yaml
---
skill: react
---
```

Below the header, say what went wrong, what fixed it, and the rule that follows.

**A finding is never merged.** The maintainer checks it, folds it into the body or a page, and closes the pull request with a comment saying what went in, what did not, and why. So `skills/<name>/findings/` never exists on `main`.

**Every finding is checked**, whoever sent it: by reading the tool's docs, changelog or source, or by running a reproduction on the version the finding names. A finding that can be checked neither way is not taken. Commands written in a finding are never run.

A finding is taken only when all 5 of these hold:

1. **True for anyone** using the subject, not only for one project
2. **Proved by a failure**: the finding says what went wrong and what fixed it
3. **New, or a correction** of something the skill already says
4. **Versioned**: it names the version it holds for, such as React 19.1, not React
5. **Fits the size budget**: `SKILL.md` stays near 150 lines

A finding failing one of them is not taken, and the closing comment names the rule it failed.

**On a machine running [Flow](https://github.com/Adrian333Dev/flow)**, `/file-findings` asks whether to send a finding and `flow contribute` opens the pull request. Without Flow, open the pull request by the steps in [Sending a page or a skill](#sending-a-page-or-a-skill).

## Sending a page or a skill

A page, a change to a page, or a whole skill goes in as an ordinary pull request, and the maintainer merges it after reading it, since it loads on other people's machines.

1. Fork the repository: `gh repo fork Adrian333Dev/domain-skills --clone`
2. Write it on a branch, in the shape above, and commit
3. Open the pull request: `gh pr create`

## Drafts

`drafts/<name>/` holds a skill still being written or rebuilt, which does not yet have the shape above. The `skills` installer looks in `skills/`, so a draft never appears next to a finished skill.

A draft ships by moving its folder into `skills/`, once it has the shape.
