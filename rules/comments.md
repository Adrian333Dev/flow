---
paths:
  - "**/*.{js,jsx,mjs,cjs,ts,tsx}"
  - "**/*.py"
  - "**/*.{sh,bash}"
  - "**/*.sql"
  - "**/*.{css,scss}"
---

Two decisions, in order: whether the comment is worth writing, then which form it takes.

## Whether to write one

**Write a comment where a reader fluent in the language would still guess wrong.** Everything else the code already says, and says more reliably, because code cannot go stale against itself.

- **`say-what-the-code-cannot`** Write the reason, the constraint, the decision, or what the outside system really returns. The name and the signature carry what the code does, so the comment carries why it does it that way: a workaround and the bug behind it, an ordering that matters, a number that looks arbitrary and is not.
- **`never-restate-the-line`** Delete a comment that repeats the code under it. `// increment the counter` above `i++` costs a line and a read and pays back nothing.
- **`not-every-declaration`** Leave a function whose name already answers the question uncommented. Comment the one where a reader would have to open the body to find out.
- **`say-it-once`** Put a fact in one comment. Repeating it in the caller and the callee means the two drift, and the reader cannot tell which is current.

## Which form it takes

**Position decides the form.** A comment on a declaration takes whichever form the language surfaces where the name gets used. A comment inside a body takes the line form.

- **`js-and-ts`** `/** */` on a file header, a class or a function. `//` inside a body. Only `/** */` reaches the hover and the autocomplete list at the call site, so it goes on anything worth reading from another file.
- **`python`** A docstring on a module, a class or a function. `#` inside a body. The docstring is a string rather than a comment, and it is what the editor and `help()` show.
- **`bash`** `#` everywhere, since the language has no second form. A blank line is what separates a file header from the code under it.
- **`sql`** `--` on a statement and inside it. `/* */` for a file header running several lines.
- **`css`** `/* */`, the only form plain CSS has. SCSS adds `//`, which the compiler drops, so a note that should never ship goes there.
- **`a-block-fits-one-line`** Write a one-line block wherever the text fits: `/** True when the arguments ask for help. */`. Three lines around one sentence is the waste this section exists to stop.
- **`match-the-file`** Take the form the file already uses in that position. A file mixing two forms for the same thing reads as two authors.
