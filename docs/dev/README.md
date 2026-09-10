# Developing Flow

Flow is a Claude Code workflow for a solo developer: rules that load in every session, a set of skills, and a small scaffold for a new project. This folder is about changing Flow itself: the repository, the scripts, the skills, and the tests. For using Flow, see [the manual](../manual/README.md), and for what Flow is, the [main README](../../README.md).

## Table of contents

- [The pages](#the-pages)
- [An edit in the clone is live everywhere](#an-edit-in-the-clone-is-live-everywhere)

## The pages

- [The repository layout](layout.md): what is in every folder, and where a new file goes
- [The two checkouts](checkout.md): how to edit Flow safely when real projects depend on it
- [The scratch session](scratch-session.md): running a change without installing it
- [The tests](tests.md): two suites, no dependencies
- [Adding a skill](skills.md): one folder, one group, no list to update
- [What costs context](context-cost.md): which shortenings buy tokens and which only look like they do

Install, the commands, the skills, the settings and the file layout on a machine are all in [Reference](../manual/reference.md). Nothing here restates them.

## An edit in the clone is live everywhere

Flow installs by symlink, so one clone holds every file and your machine holds names pointing into it. Saving a skill file changes the installed workflow at once, in every project and in every session already open. Nothing is copied except `~/.claude/CLAUDE.md` and `~/.claude/settings.json`, which become yours on a first install.

That immediacy is what the next two pages exist for. [The two checkouts](checkout.md) is how to rework several files at once without a half-finished state reaching a real project. [The scratch session](scratch-session.md) is how to run a change against a throwaway config instead, leaving the installed workflow alone.

Adding, renaming or removing a skill is the one change that needs `flow install` re-run, because that is when a symlink has to be created or dropped. Editing a skill that already exists needs nothing.
