# Reading input that already carries decisions

Material somebody already worked on, arriving as files: brainstorms run with an agent, research reports, design drafts, a decisions log, notes to themselves.

`docs/intake/` holds a project's own. `<ticket>/intake/` holds material dropped in for one job. A folder the user names is the same thing wherever it sits.

**Under 2000 lines in total → read all of it, shortest file first, then go back to Phase 1.** The steps below are for a bigger pile.

**Run the steps once per pile.** After them the folder has an `index.md`, and later runs read that instead.

## 1. List before reading

Get every file and its line count first. Read nothing yet. Sort the files into 5 kinds:

- **A navigation file**: an index, a session handoff, a "state and open issues", a decisions log. Short, and it grades everything else.
- **A design document**: hundreds or thousands of lines on one subject.
- **A research report**: an answer to a question someone asked.
- **A scrap**: one line, a link, a half-finished thought.
- **Not design material at all**: sample data, a to-do, a list of chat links pointing at conversations nobody can open.

## 2. Read the navigation files first

They carry what no other file has: which design was rejected, which version replaced which, why a choice that looks arbitrary was load-bearing.

No navigation file exists → read 20 lines of each remaining file, enough to say what it is.

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

**Write it yourself, and rewrite it whole.** Never patch it.

**Rejected is not dead**: a design turned down is a live open decision, with evidence of what does not work. Mark it rejected and keep it.

## 4. Propose the cleanup

Each of these goes to the user for a yes. Never delete without one.

- **Superseded copies** → propose deleting. 2 versions of one document with nothing marking which is dead are a download habit, not a decision.
- **A research report** → move it where `/flow:research` files it, `.flow/research/` when unsure.
- **Facts about the user**: budget, tools they pay for, how they like to work → `~/.agents/AGENTS.md`, under `## The user`.
- **A recorded failure of an agent** → `/flow:review` writes it up as a study case.
- **Two scopes tangled in one folder** → split them, and say which scope is superseded.

## 5. Leave the big files closed

Open a design document of thousands of lines in Phase 2, from the branch that needs it, never here.

## What it is reliable about

**Trust a constraint somebody hit.** "6 languages forced the polymorphic schema" is a fact. Whether 6 is right is still open.

**Attribute what was thought before**, beside the branch it opens.
