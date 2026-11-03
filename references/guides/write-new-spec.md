# Write a new spec

## 1. Before writing

1. **Re-read `## Questions` in `ticket.md`.** Open `[ ]` questions → name them and confirm they're deferred, or go back and walk them. A ticket made earlier holds its questions in `groundwork/map.md`.
2. **Read what exists**: code, the current spec, whatever this touches. A contradiction with a settled decision → raise it and reopen that question. Never quietly write around it.
3. **List every closed question, one line each, with the file it lands in.**

**List questions, never behaviors**: a UI decision, a refused approach and a cost ceiling are all questions, and none is a behavior. A 5,000-line ticket is maybe 120 lines of this. Several tickets → one at a time.

Write the list before any prose. Tick each line as it lands. At the end, check every line is ticked.

## 2. Write it

One pass, after the map closes. Never re-approve the decisions section by section. Save as each section completes.

**Write every requirement concrete and checkable.** "Fast", "robust", "user-friendly" are not requirements.

**Draw wherever a drawing carries the point: invoke `/flow:visualize`.** In whichever sections are spatial, and **every spec carries at least one**. Never head a section "architecture" and leave no picture under it.

Markdown only. No frontmatter, no copied artifacts.

### What it must do: `product.md`

Always, however small the product:

1. **What it is and who it is for**: one paragraph a stranger follows.
2. **The problem, and why now.**
3. **Every behavior**, grouped how the product is actually shaped: by surface, by job, by whatever the map used. Each carries a mark. A part with its own file holds its behaviors there, and `product.md` keeps only the index line.
4. **How you know it worked**: the observable outcome, the check, the number.

Then only what a question covered, usually 3 or 4 of these:

- **The domain model**: the concepts this is built on, and how they relate.
- **Named principles**: the constraints that settle later arguments before they start.
- **The interaction surface**: screens, cards, flows, at the depth the groundwork reached.
- **Constraints that are not code**: money, law, privacy, policy.
- **What it competes against**, and why this holds up. The survey itself belongs in `.flow/research/<topic>/`.
- **The glossary**: every term invented here.
- **`## Bets`**: what the whole thing rests on that nobody has checked.

Finish the spec when every behavior carries a mark.

**Write the whole product, at every version.** Scope the *building*, never the *writing*: never push later phases out of the spec.

### How it is built: a part's file, `tech.md` or `design.md`

Same skeleton at every scope. A part's file covers that part, and `tech.md` what every part shares. Both outlive every feature. `design.md` is one thing and dies when that thing is built.

**Always write one, simple work included.** A section can be one sentence.

1. **The goal**: one paragraph a stranger follows.
2. **Scope**: what is in, and what is out. Both named.
3. **The parts**: what each one owns, and what it depends on. A part is a module, a stage, a team, a channel: whatever this thing is actually built out of.
4. **What passes between them**: concrete wherever it was decided. A function signature and an event payload in software; a rendered file, an approval, a paid invoice elsewhere.
5. **One real case, end to end**: followed part by part, start to finish. One request from click to stored row. One video from idea to published. One customer from first ad to money in the account.
6. **How it fails**: every way it goes wrong, and what happens on each.
7. **How you know it worked**: the observable outcome, the check, the number.
8. **What is locked**: one line per decision, with its reason.

`tech.md` adds 2 things:

- **The stack and the repo layout**: what each piece is for, which folders exist, what lives in them.
- **The parts are the system's parts**: backend, frontend, services, workers, packages. Never one feature's.

## 3. Review it yourself

Read it once with fresh eyes and fix what you find inline:

- **Placeholders**: any TBD, TODO, or half-written section.
- **Contradictions**: sections that disagree, or a drawing that doesn't match the parts under it.
- **Vague requirements**: anything not concrete and checkable.
- **Invented material**: anything in the document that no question decided.
- **Ambiguity**: any requirement that could be read 2 ways. Pick one and say it.
- **The question list**: every line ticked.

No second review. Fix and move on.

## 4. Show it and stop

Give the paths. The user reads and approves before anything is created from it.

**An objection is not new groundwork.** It reopens the one question it came from, in the ticket's `## Questions`. Walk that question, then rewrite the affected section.

Approved, with questions still open → each stays a `## Questions` line in the ticket that owns it. One that stands alone becomes a ticket: `flow tickets new "<the question>" --body -`, the body saying what would settle it.

Approved, with work to cut → `/flow:tickets-from-spec`. **Never cut a work ticket from here.**
