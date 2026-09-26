# This session brings Flow up to date

`flow up` pulled Flow's clone and opened this session. `~/.flow/run.json` names the place, `project` for a project and nothing for the machine, the entry it is at, `from`, the entry it moves to, `to`, and the migration folder under `~/.flow/migrations/`. This run reads what changed between the 2 entries and writes one form, `migration.md`, which the user approves once. Nothing outside `~/.flow/` changes before that yes.

The rules and hooks loaded here are the ones from before this update. Where a guide disagrees with a loaded rule, the guide wins.

Edits inside `~/.flow/` go through without asking. So do `flow up`, `flow doctor`, `flow audit`, `util fs tree`, `claude -p` and `node ~/.flow/scripts/apply-migration.js`, typed exactly so.

One edit asks anyway. Claude Code asks before every write to a path holding a `.claude` folder, and `files/` mirrors `.claude/` folders. Before the first write there, tell the user in one line that Claude Code is about to ask, and that **allow Claude to edit its own settings for this session** covers the rest.

Flow's clone is `~/.flow/repos/flow/`. Every path below starting `home/`, `project-template/` or `upgrades/` sits inside it.

## Steps

0. **`flow up check`.** A failure → print what it said and stop. It lists every changelog entry between the 2 numbers, and the guide each one names.
   - `step` in `run.json` above 0 → a run stopped part way. Carry on from the step after it, and tell the user in one line.
   - Rewrite `step` in `run.json` as each step below finishes.
1. **Read what changed**: every guide `flow up check` listed, lowest number first, then every file in `~/.flow/references/harnesses/`.
   - No entry has a guide → nothing on disk changes. Tell the user in one line, then step 7.
2. **Read the place.** Every live file a guide names. Then compare Flow's own files with their templates, to find what the user changed by hand:
   - The machine: `~/.flow/AGENTS.md` against `home/AGENTS.md`, outside `## The user` and `## Preferences`, and `~/.claude/settings.json` against `home/settings.json`.
   - A project: `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` and `.gitignore` against `project-template/`.
   - A line no template holds and no guide explains is the user's own.
3. **Write the migration** into `~/.flow/migrations/<migration>/`: `migration.md` by `## The form` below, and under `files/` the new version of every path a `write` line names, whole, at `files/<full path>`.
   - One line per file, never one per entry. Where 2 guides name one path, the later guide wins.
   - The machine's run takes a guide's `~` paths. A project's run takes the paths inside the project.
   - Every line of the user's own goes into the new file, and gets a box in the form.
   - Build JSON with `node`, never by hand.
4. **Hand over the form.** One message: the full path of `migration.md`, one line saying an unticked line of yours is dropped, and that saying go runs it. Then stop.
5. **Take the answer.** Read `migration.md` again. The file wins over anything said in chat.
   - Nothing changed → step 6.
   - A box unticked → take that line out of its file under `files/`, and say so in one line. Then step 6.
   - Anything else edited → one message saying what the edit does, then wait for go.
6. **Apply it**: `node ~/.flow/scripts/apply-migration.js <migration>`. A refusal → print it whole and stop. It stopped part way → say which line and why, and stop: running it again carries on from that line.
7. **Check it**: `flow doctor`, then each guide's `Proof`.
   - The migration changed a hook, the rule file or the skills → start a new session on the new files: `claude -p --output-format json "ok"` from the place's folder. Then `flow audit index` and `flow audit session <session_id>` show what that session loaded and which hooks ran.
   - A problem → name it, with its fix, in the last message. It never holds back the stamp.
8. **Stamp it**: `flow up finish`.
9. **The last message**: what changed, in the form's own words; for a project, that nothing is committed; then "Quit this session and start `claude` again: the new rules and hooks load when a session starts."

## The form

Copy every fixed line word for word. Replace each line holding a `{…}` whole, with the lines it stands for. The text after `such as:` is one example. A section left with no line goes, heading included.

- **`{place}`**: `this machine`, or the project's folder name.
- **`{project}`**: the project's full path. The machine's form has no `project` line.
- **`{entries}`**: one line per entry with a guide: its number, then what changed, in the entry's own words.
- **`{yours}`**: one ticked box per line of the user's own, naming the file.
- **`{action lines}`**: every line under `## Every file this changes`, in the order they run.

````markdown
---
type: migrate
project: {project}
---

# Bringing {place} up to date

Nothing changes until you say go. The new version of every file is under files/, beside this form.

## What changed in Flow

- {entries}, such as: 2: the prompt reminder runs a script instead of cat.

## Your own lines, kept

These are yours, not Flow's. Each one is carried into the new file. Untick one to drop it.

- [x] {yours}, such as: `~/.flow/AGENTS.md`: "Answer in British English."

## Every file this changes

{action lines}
````

## The action lines

`apply-migration.js` acts on every line opening `- write `, `- delete `, `- move ` or `- run `, anywhere in the file, so no other line may open with one of those 4 words. One path per line. A path with no `~` sits inside the project. Everything after `: ` is for the user.

```markdown
- write ~/.claude/settings.json: the prompt hook runs reminder.js
- write ~/.flow/settings.json: "reminder": true added
- run flow install: writes ~/.claude/skills/flow, ~/.agents/skills/flow
```

A `run` line names every path its command writes, or ends `: writes nothing`.
