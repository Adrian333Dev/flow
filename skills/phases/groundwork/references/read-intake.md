# Reading input that already carries decisions

Material somebody already worked on, arriving as files rather than as a message: brainstorms run with an agent, research reports, design drafts, a decisions log, notes to themselves. The work in it is real, and that is what makes it dangerous. It reads as settled.

`docs/intake/` holds a project's own. `<ticket>/intake/` holds material dropped in for one job. A folder the user names is the same thing wherever it sits.

**Under 2000 lines in total → read all of it, shortest file first, then go back to Phase 1.** Everything below is for a pile too big to hold at once.

**Run the steps once per pile.** After them the folder has an `index.md`, and later runs read that instead.

## 1. List before reading

Get every file and its line count first. Read nothing yet.

A folder someone filled over months holds documents of 5 kinds, worth wildly different amounts:

- **A navigation file**: an index, a session handoff, a "state and open issues", a decisions log. Short, and it grades everything else.
- **A design document**: hundreds or thousands of lines on one subject.
- **A research report**: an answer to a question someone asked.
- **A scrap**: one line, a link, a half-finished thought.
- **Not design material at all**: sample data, a to-do, a list of chat links pointing at conversations nobody can open.

## 2. Read the navigation files first

They are the smallest files and they carry the facts no other file has: which design was rejected, which version replaced which, why a choice everyone treats as arbitrary was load-bearing.

**Read a design document before its index and you will treat rejected work as current.** There is no way to tell from inside the file.

No navigation file exists → read 20 lines of each remaining file and no more. Enough to say what it is.

## 3. Write `index.md`

One line per file: what it is, whether it is still live, what it is worth.

```markdown
# Intake index

- `00-master-index.md`: handoff from the design sessions. Read first, it grades the rest
- `04-feed-mechanics.md`: **rejected**, the mechanism was faulty. Needs a replacement, so keep it
- `06-architecture.md`: costs, data, storage. Live, 410 lines, open when a cost branch comes up
- `bible.md`: superseded by `bible-v2.md`. **Propose deleting**
- `watched-list.md`: 8 titles. Sample data, not design material
- `sessions.md`: links to chats nobody can open. Keep as a record, use for nothing
```

**The agent writes it and rewrites it whole.** A hand-patched index drifts the first time a file moves, and a wrong index is worse than none, because everything after it trusts the index instead of the pile.

**Rejected is not dead.** A design turned down because its mechanism failed is a live open decision carrying evidence about what does not work. Mark it rejected and keep it.

## 4. Propose the cleanup

Each of these goes to the user for a yes. Never delete without one.

- **Superseded copies** → propose deleting. Two versions of one document with nothing marking which is dead is a download habit, not a decision.
- **A research report** → move to `docs/research/`. It was never intake, and `/research` owns that shape.
- **Facts about the user**: budget, tools they pay for, how they like to work → `~/.claude/CLAUDE.md`, under `## The user`.
- **A recorded failure of an agent** → `/flow-review` writes it up as a study case.
- **Two scopes tangled in one folder** → split them, and say which scope is superseded.

## 5. Leave the big files closed

A design document of thousands of lines is opened in Phase 2, by the branch that needs it. Not here. Carrying it through the whole session to answer one question is the cost these steps exist to avoid.

## What it is reliable about

**A constraint somebody hit.** That is a fact rather than a judgment: "6 languages forced the polymorphic schema" is a consequence, and whether 6 is right is still open.

**Attribute what was thought before**, beside the branch it opens. A decision recorded with no source reads as this session's own.
