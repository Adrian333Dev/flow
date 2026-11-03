# Log of guides/write-loaded-files.md

## 2026-11-02 · 0. The path · add
Ticket: fw-358
Why: loaded text went through groundwork then `/flow:execute`, and the user agreed to summaries only; the real text and behaviour showed after they were written (session `9feb0e67`). The user: "I kind of need to see, like, what the fuck agent really proposes here." Removal first, but only after finding why a line was added: the user fears a line added for a real fault, its reason forgotten, cut by a compression pass.
Trial: watch the next loaded-text change in this repo: is this section read before the first proposal, and is the behaviour shown on a real case before any text.

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
