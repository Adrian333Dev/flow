---
date: 2026-09-12
project: flow
model: claude-opus-5
effort: xhigh
rule: name-the-subject-first, whole-then-parts, lead-with-what-matters, define-from-zero, explain-never-label, ui-is-drawn
status: open
---

# 5 verdicts and no picture

Moved from `lab/context/shit-explanations.md` on 2026-09-15. Designing the contribution pipeline, in conversation, the turn after the whole design was written to `lab/context/design-domain-skills.md`. The user asked 5 things in one message: whether to use the Vercel skills package, how a shared skill stays usable on a machine with no Flow, whether to drop the plan of installing every domain skill and turning most off, whether to build the separate repository first, and whether that repository becomes a submodule under `lab/`. The reply answered all 5 and was rejected whole. The user corrected the model's attribution mid-session: *"I fucking told you to record it as Opus 5 because this model was fucking Opus 5, not Fable 5.1."*

## What the user sent

> "Okay, your explanation is shit. I'm having a hard time understanding what the fuck are you exactly proposing. You'll need to fucking try again and properly explain what the fuck are you proposing. I'll also record this shit in the shit explanations as well. Like, I'm really pissed off by this and I'm really tired of this shit. Like, you keep making and making this mistake again and again and again and I'm already tired at this point. Like, what the fuck are you even explaining here?"

## What happened

Sent, whole:

`````markdown
Read the folder you installed under `tmp/domain-skills/`, Flow's `skills.js` and `commands/skills.js`, and fetched the Claude Code skills page to `tmp/skills-doc.md`, since it is the one page missing from `lab/research/claude-code-docs/`. No file edited.

## 1. The Vercel package: copy its layout, do not build on it

What it is, from what it left in `tmp/domain-skills/`: a CLI that copies a skill folder out of a GitHub repo into `.agents/skills/<name>/`, symlinks `.claude/skills/<name>` at it, and writes `skills-lock.json` recording the source repo, the path inside it, and a hash of the content:

```json
"ai-elements": {
  "source": "vercel/ai-elements",
  "sourceType": "github",
  "skillPath": "skills/ai-elements/SKILL.md",
  "computedHash": "6d7ccc65..."
}
```

Do not build on it. For our own repo a clone plus `git pull` does everything it does and leaves a history; the lock file's job is to tell a borrowed skill from one you own, and the folder a skill sits in already says that. It adds a second skills folder and a node dependency for what is one `ln -s`.

Take one thing from it: the path it expects. `skills/<name>/SKILL.md` at the repo root. Lay the repo out that way and anyone can install from it with `npx skills add`, with no Flow involved. That is most of your compatibility question answered by a folder name.

Nothing in Flow needs to change to tolerate it either. `flow install` already refuses to replace anything that is not already a symlink, so a skill that CLI put in a project is left alone.

## 2. Outside Flow: one guarded line at the bottom of a body

Verified on the docs page: `` !`cmd` `` in a skill body runs when the skill loads, the `!` has to start a line, and the output is pasted in as plain text.

Today a body carries two Flow lines, `` !`flow overlays <name>` `` and, in the design, `` !`flow extras <name>` ``. Cut it to one:

```
!`flow extras react 2>/dev/null || true`
```

Where `flow` is absent the shell prints its complaint to stderr, `2>/dev/null` swallows it, `|| true` keeps the exit clean, and the reader sees a plain skill. `flow extras` prints the project's overlay text first, then one path per file under `~/.flow/skills/react/`. Flow's own phase and tool skills keep `flow overlays` unchanged, so nothing else moves.

One line rather than two because every Flow line in that repo is foreign matter to someone who has never heard of Flow, and the two commands answer one question: what does this machine add to this skill.

The rest of compatibility is the page rules already decided: no path outside the repo, no link to a file the repo does not ship, no `flow` anywhere except that one line. Worth knowing: a reader who sets `disableSkillShellExecution` sees `[shell command execution disabled by policy]` in place of the line, which is harmless.

## 3. Install nothing by default: right call, wrong reason

The obvious argument for it is false, so it is worth replacing before it gets written down. A skill set to `off` costs nothing in context. Flow verified that against Claude Code 2.1.251 on 2026-08-29 and the docs agree. So "off wastes context" does not decide this.

What decides it: `flow install` would have to enumerate the corpus and write one line per skill into `~/.claude/settings.json`, turning a file you maintain by hand into a generated one, and fill `~/.claude/skills/` with hundreds of symlinks for skills nobody is using. On demand needs no list anywhere.

Then go one step further than you said: **install into the project, not the machine.** A skill that is on costs its name and description in every session, and the docs cap the whole listing at 1% of the context window and start dropping descriptions when it overflows. A React skill's description in a Python project is pure cost. Machine wide and off is free but needs a settings edit before it works. Per project is free everywhere else and works the moment it lands.

The mechanism, four pieces:

- `~/.flow/sources` stays, one folder per line, but it is now a lookup path rather than an install list. `flow install` never reads it.
- `flow skills ls --hidden` gains the corpus. The flag already means "what else exists"; corpus skills list with state `available`. That is how an agent discovers a skill it cannot see.
- `flow skills add react` symlinks `<project>/.claude/skills/react` at the source folder and prints which source won.
- `flow skills drop react` removes the symlink.

Two facts that make it work, both from the docs page: Claude Code watches `.claude/skills/` and picks up an added skill inside the running session with no restart, so `flow skills add` is usable mid task; and if the project had no `.claude/skills/` folder at all when the session started, that session has to restart once. And the symlink needs no gitignore work, because `project-template/.gitignore` already ignores links and tracks folders.

Two written positions this overturns, both rewritten in the same pass:

- `scripts/flow/commands/skills.js` opens with "No `add`, `sync`, `new` or `drop`. An external skill used by one project is a folder copied into `<project>/.claude/skills/<name>/` and committed." A copy never receives a fold, so it becomes a symlink and the commands exist.
- The off by default question is dead. `home/settings.json` loses `"web-pages": "off"`.

`home/CLAUDE.md` gets one line: a domain skill for the tool you are using may exist without being installed, `flow skills ls --hidden` lists them, `flow skills add <name>` installs one.

## 4. Repo first, and it now stands alone

New order, replacing items 7 to 11 in `backlog.md`:

1. `domain-skills`: `web-pages` moved in and reshaped, `CONTRIBUTING.md`, `skills/stack/` removed from Flow, docs and `home/settings.json` updated.
2. `~/.flow/sources`, plus `flow skills add`, `drop` and `ls --hidden`.
3. `flow extras`.
4. `/file-findings` writes finding files.
5. `/fold`.

Under the old plan the repo needed the sources work first or nothing could install. It no longer does: until item 2 exists, a corpus skill is installed by one `ln -s` into a project. So item 1 is genuinely finishable and testable on its own.

## 5. Submodule under `lab/`, and one rule has to change

Same shape as `lab/util` and `lab/toolbox`: its own repo, checked out here only so development happens in one place, never named by anything that ships. `submodules-commit-twice` becomes three submodules.

One rule in `CLAUDE.md` says otherwise. `no-skill-under-lab` opens "`skills/` is the only place a live skill exists." A submodule at `lab/domain-skills/` breaks that sentence. What the rule protects is two things: `flow install` reads one tree and cannot be fooled, and nothing that ships points into `lab/`. The first is already retired by the sources design. The second still matters. So replace the sentence rather than the rule:

> **`no-skill-under-lab`** Flow's own skills live in `skills/`. A skill from another repo lives in that repo. Never let a `lab/` path leak into a skill, `home/`, or `project-template/`.

The repo has to exist before the submodule can point at it, and both commands are git mutations, so they are yours. Public, since other people's pull requests are the entire point of the pipeline:

```
gh repo create Adrian333Dev/domain-skills --public
git submodule add git@github.com:Adrian333Dev/domain-skills.git lab/domain-skills
```

Say go and I will write the records for all five decisions, then start on the repo.
`````

## Why it was wrong

1. **5 headings, 5 verdicts, and not one of them the proposal.** The message opens on the Vercel package, a side question, so the first thing the reader meets is a ruling about a tool. No sentence in 89 lines says what the proposal is.
2. **The load-bearing sentence is buried inside an argument.** "Install into the project, not the machine" is the entire design. It appears mid-section 3, bolded, after 2 paragraphs correcting a reason the reader never held.
3. **The argument precedes the thing it argues for.** Section 3 opens by refuting "off wastes context", which is only readable by someone who already knows the design it clears the ground for.
4. **6 mechanisms named as if known.** `~/.flow/sources`, `flow skills ls --hidden`, `flow extras`, "the corpus", "the listing budget", "a fold". The design record on disk holds all 6, and none had been put in front of the reader in this conversation.
5. **The 2 folders the change is about never appear together.** The whole proposal is the difference between `~/.claude/skills/` and `<project>/.claude/skills/`. Neither path is shown until a bullet list in section 3, and never side by side.
6. **No drawing, for a change whose entire content is where files sit.** `/visualize` carries a tree pattern for exactly this, and the user had asked for a tree-shaped picture 2 turns earlier.

## Root cause

`topic-by-topic` was obeyed and `whole-then-parts` was not. The user asked 5 questions, so the reply was built as 5 answers in their order, and a list of 5 verdicts has nowhere to put the picture all 5 depend on. Where the 2 rules collide, the picture comes first and the topics hang off it.

## What would have been right

One sentence naming what is proposed. Then the tree of what sits where today. Then the same tree after the change. Then each of the 5 questions answered as a change to that tree.

## The rule that failed

6, all loaded, in `## Explaining` and `## Judgment` of the repo `CLAUDE.md`: `name-the-subject-first`, `whole-then-parts`, `lead-with-what-matters`, `define-from-zero`, `explain-never-label` and `ui-is-drawn`.

## The rewrite, same session: readable, with 3 faults left

The rewrite opened with the proposal in one sentence and 2 trees, and the user worked through it rather than rejecting it. 3 faults survived, all named by the user.

1. **A section of pure argument, unlabelled.** "The load-bearing rule: a domain skill is installed per project" ran a 3-way comparison without a first sentence saying it was the case for a line in the proposal above it. *"I'm still not understanding that if that section is a proposal of new system? Or were you just evaluating the old solution? You just dumped your reasoning in that section and you're not fucking clarifying."* An argument section states what it argues for before it argues.
2. **Today's tree used to define a term, with no label saying it was today's.** The folder list named `skills/stack/` as a live group, in a section the reader took for the design after the change, where that folder is deleted. *"Is that correct? I don't think it is accurate because I think we discussed that we're going to move it out completely."*
3. **A mechanism deleted inside a simplification, without the deletion being named.** Merging `flow overlays` into `flow extras` removed the project overlay from every domain skill body, and the message presented the merge as cutting 2 lines to 1. *"Where did the overlays command go? I think we're supposed to have the overlays command as well, right?"*
