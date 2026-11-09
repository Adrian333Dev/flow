# Log of guides/write-loaded-files.md

## 2026-11-02 · 0. The path · add
Ticket: fw-358
Why: loaded text went through groundwork then `/flow:execute`, and the user agreed to summaries only; the real text and behaviour showed after they were written (session `9feb0e67`). The user: "I kind of need to see, like, what the fuck agent really proposes here." Removal first, but only after finding why a line was added: the user fears a line added for a real fault, its reason forgotten, cut by a compression pass.

## 2026-11-03 · `propose-the-exact-text` · rewrite
Ticket: fw-397
Why: the user, on the guides rewrite: "for the guides, it's absolutely unnecessary" to show the text line by line; "just reading the reviews is also fine for me". Not a hard rule: they may still ask for the text. Skills keep the full proposal, a new one most of all.
Was:
```md
6. **`propose-the-exact-text`** The new text word for word. The old text word for word when short, its file and section when long. A new skill → the description and the section list first, then each section.
```

## 2026-11-04 · title paragraph · remove
Ticket: fw-397
Why: the guide arrives with `writing.md`, so the line saying so does nothing.
Was:
```md
Beside `writing.md`, for any file that enters an agent's context: a rule file, a skill and its references, a command, an agent, a guide in `references/guides/`, a mod's prompt.
```

## 2026-11-04 · 7. Cuts from real rewrites · rewrite
Ticket: fw-397
Why: one example per kind of cut; `### Rejected: structure absorbs repetition` argued against an option the agent never meets, the fault § 7 itself names.
Was:
```md
### Rejected: structure absorbs repetition

A table header carrying what each row would repeat. Dropped: a list is preferred to a table, so the header saves nothing worth the columns.

(Delete the rebuttal) - "The test is commitment, not size: there is no backlog file"
- "Nothing is called `plan.md`."

(State the rule, cut the argument) - **Before:** "**`docs/` and `.flow/` both always exist**, project or not, repo or not. Paths are created on first write. `docs/` is the project's own: the spec, durable facts, fetched research, anything there before Flow. `.flow/` is Flow's working store: tickets, groundwork, the inbox, the handoff."
- **After:** deleted. Every route under it names its own path.
```

## 2026-11-05 · `show-the-behaviour-early` · remove
Ticket: fw-408
Why: "On a real case, before any text" pushed an invented case for a guide about code, and "the exchange before the change and after it" produced made-up before/after blocks. Merged into `show-before-writing`.
Was:
```md
2. **`show-the-behaviour-early`** On a real case, before any text. A skill → what it outputs on the user's case. A rule → the exchange before the change and after it. Check: the user saw the behaviour before any text.
```

## 2026-11-05 · `propose-the-exact-text` · remove
Ticket: fw-408
Why: it did the same job as `show-the-behaviour-early`, split into cases per file type. The user: the rule got "too specific and too long"; the old text is now named by its section, never quoted. Merged into `show-before-writing`.
Was:
```md
6. **`propose-the-exact-text`** The new text word for word. The old text word for word when short, its file and section when long. A new skill → the description and the section list first, then each section. A guide or a reference file → a summary of what changes, section by section, and the exact text only when the user asks.
```

## 2026-11-05 · `show-before-writing` · add
Ticket: fw-408
Why: one short step for both removed ones, approved by the user 2026-11-05. Placed after `state-the-problem`, so the text comes after the cut analysis.

## 2026-11-08 · write-loaded-files.md · remove
Ticket: fw-425
Why: folded into `/flow:write-instructions` and its `references/shapes.md`. The hook no longer attaches it.
Was: the whole file, kept verbatim in `lab/archive/write-guides/write-loaded-files.md`.
