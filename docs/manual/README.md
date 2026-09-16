# The Flow manual

Flow is a Claude Code workflow for a solo developer: rules that load in every session, a set of skills, a command-line tool for the work in flight, and a small scaffold for a new project. This folder is for using it. For changing Flow itself, see [Developing Flow](../dev/README.md).

## Table of contents

- [The pages](#the-pages)
- [Where to start](#where-to-start)

## The pages

- Use Flow, one page per part of a working day:
  - [Opening a session](use/start.md): `/start` with nothing, with a ticket id, with a path, and what each one loads
  - [The 4 phase skills](use/phases.md): what each accepts after its name, what an id loads, and what each produces
  - [Who moves the status](use/status.md): the skill moves it as the phase moves, and you can type the same verb
  - [Stopping and picking up](use/resume.md): `/handoff`, `/clear`, then the skill with the id
- [Reference](reference.md): every command, skill and setting in one place, including how to install
- [Tickets](tickets.md): what a ticket is, the frontmatter, the body, and how one gets made and moved
- [Settings](settings.md): every key in `~/.claude/settings.json` and `~/.flow/settings.json`, what it does, and why Flow sets it that way
- [Where everything lives](where-everything-lives.md): one tree of every folder Flow puts on a machine and in a project, and what each holds

## Where to start

Install first. [Reference](reference.md) opens with the two commands that do it, and `util` goes on before Flow does.

Then read [Tickets](tickets.md) once, end to end. A ticket is the only thing Flow ever builds, and everything else in the workflow either produces one or comes out of one, so the rest of the system is hard to place until that page has been read.

Then the 4 Use Flow pages, in the order listed: they follow one ticket from `/start` to the handoff.

[Reference](reference.md) is the page to come back to. It is built for the reader who knows Flow has a feature and cannot remember what it is called.
