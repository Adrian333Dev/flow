# Upgrade guides

One guide per changelog entry, holding everything `/flow:migrate` needs to move a machine from the entry before it to this one. `CHANGELOG.md` says what changed, in a sentence, for a user reading it. The guide says how to do it, and the agent works nothing out for itself.

## Where they live

- **`upgrades/12.md`**, in the clone, beside `CHANGELOG.md`. A pull brings every guide with it.
- **The clone's path** is `clone` in `~/.flow/settings.local.json`, written by `flow install`. Nothing goes under `~/.flow/`, which holds what a machine saved rather than what it pulled.
- **The name is the entry's number alone.** `12.md` is the step from 11 to 12. `11-to-12.md` says nothing the number does not, and a machine at 8 would look for `8-to-12.md`, which nobody writes.

## A guide is one step, and several run in order

A machine at 8 reads `9.md`, `10.md`, `11.md` and `12.md`, in that order, and writes one `migration.md` from the 4.

- **A guide names the state each path ends in, never a patch to apply.** Where 2 guides name one path, the later one is the answer and there is nothing to reconcile. Patches applied in sequence break on any line that moved in between.
- **A guide the running skill cannot carry out stops the run**, under `Can the old skill run it`. The run stamps `~/.flow/version` with that guide's number, and the next session picks up the rest.
- **An entry that moves nothing on a machine gets no guide**, and that is most of them. A guide is written in the same edit as its entry, never later.

## What a guide holds

6 headings, in this order, every one of them present. A guide with nothing under a heading then reads as thin rather than as finished.

1. **What changed, and why.** The change whole, in plain words.
2. **How to migrate.** The plan, in order. A change that is more than a replacement gets its method here: a sweep over every ticket, a folder move with the user's own files inside it, a setting read before it is rewritten.
3. **Every path, and the state it ends in.** One entry per path, saying what to find it by rather than where it sits.
4. **What may be the user's own.** What to leave alone, and what to name in `migration.md` so the user sees what was left.
5. **Can the old skill run it.** Yes, or what a new session has to do.
6. **Proof.** What says it worked, usually a `flow doctor` line.

## An example

````md
# 12, from 11: the prompt reminder runs a script instead of cat

**What changed, and why.** The `UserPromptSubmit` hook ran `cat` over a markdown
file. A bare `cat` cannot read a setting, so it now runs `reminder.js` and
`"reminder": false` silences it.

**How to migrate.** One hook entry is replaced and one setting is added. Find the
`UserPromptSubmit` entry by the file its command names, never by its position:
this machine may carry hooks of its own on the same event.

**Every path, and the state it ends in.**

- `~/.claude/settings.json`, `hooks.UserPromptSubmit`. The entry naming
  `reminder.md` ends as `node "$HOME/.flow/scripts/reminder.js"`. Every other
  entry on that event is untouched.
- `~/.flow/settings.json` ends with `"reminder": true`, unless the key is set.

**What may be the user's own.** Another `UserPromptSubmit` hook. Leave it, and
name it in `migration.md` so the user sees what was left.

**Can the old skill run it.** Yes.

**Proof.** `flow doctor` reports the hook and finds the file it names on disk.
````
